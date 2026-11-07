import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Product } from '../products/product.entity';
import { StockCount } from './entities/stock-count.entity';
import { StockCountLine } from './entities/stock-count-line.entity';
import { StockLevel } from './entities/stock-level.entity';
import { Warehouse } from './entities/warehouse.entity';
import { StockService } from './stock.service';
import { SequenceService } from '../../common/sequences/sequence.service';
import { CompanyService } from '../company/company.service';
import { round } from '../../common/money';

/** Inventaire physique : on fige le stock théorique, on saisit le comptage, la validation génère les ajustements. */
@Injectable()
export class StockCountsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly stock: StockService,
    private readonly sequences: SequenceService,
    private readonly company: CompanyService,
  ) {}

  async list(userId: number) {
    return this.ds.query(
      `SELECT c.*, w."name" AS "warehouseName",
              (SELECT COUNT(*) FROM "stock_count_lines" l WHERE l."countId" = c."id") AS "lineCount",
              (SELECT COUNT(*) FROM "stock_count_lines" l WHERE l."countId" = c."id" AND l."countedQty" IS NOT NULL) AS "countedCount"
         FROM "stock_counts" c JOIN "warehouses" w ON w."id" = c."warehouseId" WHERE c."userId" = $1 ORDER BY c."createdAt" DESC LIMIT 200`,
      [userId],
    );
  }

  async get(userId: number, id: number) {
    const count = await this.ds.getRepository(StockCount).findOne({ where: { id, userId } });
    if (!count) throw new NotFoundException('Inventaire introuvable');
    const lines = await this.ds.query(
      `SELECT l.*, p."name", p."sku", p."unit" FROM "stock_count_lines" l JOIN "products" p ON p."id" = l."productId" WHERE l."countId" = $1 ORDER BY p."name"`,
      [id],
    );
    const items = lines.map((l: any) => {
      const expected = Number(l.expectedQty);
      const counted = l.countedQty === null ? null : Number(l.countedQty);
      const diff = counted === null ? null : round(counted - expected, 3);
      return { ...l, expectedQty: expected, countedQty: counted, unitCost: Number(l.unitCost), difference: diff, differenceValue: diff === null ? null : round(diff * Number(l.unitCost), 3) };
    });
    const counted = items.filter((i: any) => i.countedQty !== null);
    return {
      ...count,
      lines: items,
      summary: {
        lines: items.length, counted: counted.length,
        withDifference: counted.filter((i: any) => i.difference !== 0).length,
        shortageValue: round(counted.filter((i: any) => i.difference < 0).reduce((s: number, i: any) => s + i.differenceValue, 0), 3),
        surplusValue: round(counted.filter((i: any) => i.difference > 0).reduce((s: number, i: any) => s + i.differenceValue, 0), 3),
      },
    };
  }

  async create(userId: number, actorId: number, dto: { warehouseId: number; productIds?: number[]; note?: string }) {
    return this.ds.transaction(async (em) => {
      const wh = await em.getRepository(Warehouse).findOne({ where: { id: dto.warehouseId, userId } });
      if (!wh) throw new NotFoundException('Dépôt introuvable');
      const open = await em.getRepository(StockCount).findOne({ where: { userId, warehouseId: wh.id, status: 'counting' } });
      if (open) throw new BadRequestException(`Un inventaire est déjà en cours pour ce dépôt (${open.number}).`);

      const company = await this.company.getOrCreate(userId, em);
      const year = new Date().getFullYear();
      const n = await this.sequences.next(em, userId, 'stock_count', year);
      const count = await em.getRepository(StockCount).save(
        em.getRepository(StockCount).create({
          userId, warehouseId: wh.id, status: 'counting', note: dto.note || null, createdBy: actorId,
          number: this.sequences.format(this.company.prefixFor(company, 'stock_count'), year, n),
        }),
      );

      let products = await em.getRepository(Product).find({ where: { userId, isStockable: true } });
      if (dto.productIds?.length) {
        const wanted = new Set(dto.productIds);
        products = products.filter((p) => wanted.has(p.id));
      }
      // Produits repris de l'ancien système : on les rattache au dépôt par défaut avant de figer les quantités.
      for (const p of products) await this.stock.adoptLegacyStock(em, p, actorId);
      const levels = await em.getRepository(StockLevel).find({ where: { warehouseId: wh.id } });
      const byProduct = new Map(levels.map((l) => [l.productId, l.quantity]));
      // Sans sélection : produits présents dans le dépôt ; avec sélection : tous les produits demandés.
      const targets = dto.productIds?.length ? products : products.filter((p) => (byProduct.get(p.id) || 0) !== 0);
      if (!targets.length) throw new BadRequestException('Aucun produit à inventorier dans ce dépôt.');
      await em.getRepository(StockCountLine).save(
        targets.map((p) => em.getRepository(StockCountLine).create({ countId: count.id, productId: p.id, expectedQty: byProduct.get(p.id) || 0, countedQty: null, unitCost: p.avgCost || 0 })),
      );
      return count;
    });
  }

  async saveLines(userId: number, id: number, lines: Array<{ productId: number; countedQty: number }>) {
    const count = await this.ds.getRepository(StockCount).findOne({ where: { id, userId } });
    if (!count) throw new NotFoundException('Inventaire introuvable');
    if (count.status !== 'counting') throw new BadRequestException('Cet inventaire n’est plus modifiable.');
    for (const l of lines) {
      const res = await this.ds.query(`UPDATE "stock_count_lines" SET "countedQty" = $1 WHERE "countId" = $2 AND "productId" = $3`, [round(l.countedQty, 3), id, l.productId]);
      if (!res[1]) {
        // Produit non prévu à l'inventaire : on l'ajoute avec un théorique de zéro.
        const [p] = await this.ds.query(`SELECT "avgCost" FROM "products" WHERE "id" = $1 AND "userId" = $2`, [l.productId, userId]);
        if (!p) throw new NotFoundException(`Produit ${l.productId} introuvable`);
        await this.ds.query(`INSERT INTO "stock_count_lines" ("countId","productId","expectedQty","countedQty","unitCost") VALUES ($1,$2,0,$3,$4)`, [id, l.productId, round(l.countedQty, 3), p.avgCost]);
      }
    }
    return this.get(userId, id);
  }

  /** Valide : pour chaque ligne comptée avec écart, un ajustement ramène le dépôt à la quantité comptée. */
  async validate(userId: number, actorId: number, id: number) {
    return this.ds.transaction(async (em) => {
      const count = await em.getRepository(StockCount).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!count) throw new NotFoundException('Inventaire introuvable');
      if (count.status !== 'counting') throw new BadRequestException('Cet inventaire est déjà clôturé.');
      const lines = await em.getRepository(StockCountLine).find({ where: { countId: id } });
      const uncounted = lines.filter((l) => l.countedQty === null);
      if (uncounted.length) throw new BadRequestException(`${uncounted.length} produit(s) n’ont pas été comptés. Saisissez leur quantité (0 si absent) avant de valider.`);
      let adjusted = 0;
      for (const l of lines) {
        const level = await em.getRepository(StockLevel).findOne({ where: { productId: l.productId, warehouseId: count.warehouseId } });
        const delta = round((l.countedQty as number) - (level?.quantity || 0), 3);
        if (delta === 0) continue;
        await this.stock.move(em, {
          userId, actorId, productId: l.productId, warehouseId: count.warehouseId, quantity: delta, reason: 'inventory',
          type: 'adjustment', refType: 'stock_count', refId: count.number || count.id, note: `Inventaire ${count.number}`, allowNegative: false,
        });
        adjusted++;
      }
      count.status = 'validated';
      count.validatedAt = new Date();
      await em.getRepository(StockCount).save(count);
      return { id: count.id, number: count.number, status: count.status, adjustments: adjusted };
    });
  }

  async cancel(userId: number, id: number) {
    const repo = this.ds.getRepository(StockCount);
    const count = await repo.findOne({ where: { id, userId } });
    if (!count) throw new NotFoundException('Inventaire introuvable');
    if (count.status !== 'counting') throw new BadRequestException('Seul un inventaire en cours peut être annulé.');
    count.status = 'cancelled';
    return repo.save(count);
  }
}
