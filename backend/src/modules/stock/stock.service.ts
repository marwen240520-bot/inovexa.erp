import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { StockLevel } from './entities/stock-level.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { StockLot } from './entities/stock-lot.entity';
import { round, weightedAverageCost } from '../../common/money';
import { SequenceService } from '../../common/sequences/sequence.service';
import { CompanyService } from '../company/company.service';

export interface MoveInput {
  userId: number;
  productId: number;
  /** Variation SIGNÉE : + entrée, − sortie. */
  quantity: number;
  reason: string;
  type?: MovementType;
  /** Sans dépôt précis : entrée -> dépôt par défaut ; sortie -> répartie sur les dépôts (défaut d'abord). */
  warehouseId?: number | null;
  /** Coût unitaire d'une ENTRÉE : met à jour le coût moyen pondéré (CMUP). */
  unitCost?: number;
  refType?: string;
  refId?: string | number;
  lotNumber?: string | null;
  expiryDate?: string | null;
  note?: string | null;
  actorId?: number | null;
  /** Autorise un stock négatif (jamais par défaut). */
  allowNegative?: boolean;
}

const EPS = 0.0005;

@Injectable()
export class StockService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(Warehouse) private readonly warehouses: Repository<Warehouse>,
    private readonly sequences: SequenceService,
    private readonly company: CompanyService,
  ) {}

  // ───────────────────────── Dépôts ─────────────────────────

  async ensureDefaultWarehouse(em: EntityManager, userId: number): Promise<Warehouse> {
    const repo = em.getRepository(Warehouse);
    const existing = await repo.findOne({ where: { userId, isDefault: true, isActive: true } });
    if (existing) return existing;
    const any = await repo.findOne({ where: { userId, isActive: true }, order: { id: 'ASC' } });
    if (any) {
      any.isDefault = true;
      return repo.save(any);
    }
    try {
      return await repo.save(repo.create({ userId, name: 'Dépôt principal', code: 'PRINC', isDefault: true, isActive: true }));
    } catch (e: any) {
      if (e?.code === '23505') return (await repo.findOne({ where: { userId, code: 'PRINC' } }))!;
      throw e;
    }
  }

  async listWarehouses(userId: number) {
    await this.ds.transaction((em) => this.ensureDefaultWarehouse(em, userId));
    return this.warehouses.find({ where: { userId }, order: { isDefault: 'DESC', name: 'ASC' } });
  }

  async createWarehouse(userId: number, dto: { name: string; code?: string; address?: string; isDefault?: boolean }) {
    return this.ds.transaction(async (em) => {
      await this.ensureDefaultWarehouse(em, userId);
      const repo = em.getRepository(Warehouse);
      const code = (dto.code || dto.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'DEP').toUpperCase();
      if (await repo.findOne({ where: { userId, code } })) throw new ConflictException(`Le code de dépôt « ${code} » existe déjà.`);
      if (dto.isDefault) await repo.update({ userId }, { isDefault: false });
      return repo.save(repo.create({ userId, name: dto.name.trim(), code, address: dto.address || null, isDefault: !!dto.isDefault, isActive: true }));
    });
  }

  async updateWarehouse(userId: number, id: number, dto: { name?: string; address?: string; isDefault?: boolean; isActive?: boolean }) {
    return this.ds.transaction(async (em) => {
      const repo = em.getRepository(Warehouse);
      const wh = await repo.findOne({ where: { id, userId } });
      if (!wh) throw new NotFoundException('Dépôt introuvable');
      if (dto.name !== undefined) wh.name = dto.name.trim();
      if (dto.address !== undefined) wh.address = dto.address || null;
      if (dto.isActive === false) {
        if (wh.isDefault) throw new BadRequestException('Désignez un autre dépôt par défaut avant de désactiver celui-ci.');
        const { total } = (await em.query(`SELECT COALESCE(SUM(ABS("quantity")),0) AS total FROM "stock_levels" WHERE "userId"=$1 AND "warehouseId"=$2`, [userId, id]))[0];
        if (Number(total) > EPS) throw new BadRequestException('Ce dépôt contient du stock : transférez-le avant de le désactiver.');
        wh.isActive = false;
      }
      if (dto.isActive === true) wh.isActive = true;
      if (dto.isDefault) {
        if (!wh.isActive) throw new BadRequestException('Un dépôt désactivé ne peut pas être le dépôt par défaut.');
        await repo.update({ userId }, { isDefault: false });
        wh.isDefault = true;
      }
      return repo.save(wh);
    });
  }

  // ───────────────────────── Mouvements ─────────────────────────

  /** Exécute des mouvements dans une transaction dédiée. */
  moveInTx(input: MoveInput) {
    return this.ds.transaction((em) => this.move(em, input));
  }

  /**
   * Applique un mouvement de stock (avec le gestionnaire de la transaction appelante) :
   * met à jour le niveau par dépôt, les lots, le coût moyen (CMUP), le stock total du produit
   * et écrit le journal. Retourne les lignes de journal créées.
   */
  async move(em: EntityManager, input: MoveInput): Promise<StockMovement[]> {
    const qty = round(input.quantity, 3);
    if (!Number.isFinite(qty) || qty === 0) return [];

    const product = await em.getRepository(Product).findOne({ where: { id: input.productId, userId: input.userId }, lock: { mode: 'pessimistic_write' } });
    if (!product) throw new NotFoundException('Produit introuvable');
    if (product.isStockable === false) return []; // service : aucun mouvement

    await this.adoptLegacyStock(em, product, input.actorId ?? null);

    let running = await this.totalOf(em, product.id);
    const created: StockMovement[] = [];

    // 1) Répartition de la quantité par dépôt
    const parts: Array<{ warehouseId: number; delta: number }> = [];
    if (input.warehouseId) {
      await this.assertWarehouse(em, input.userId, input.warehouseId);
      parts.push({ warehouseId: input.warehouseId, delta: qty });
    } else if (qty > 0) {
      parts.push({ warehouseId: (await this.ensureDefaultWarehouse(em, input.userId)).id, delta: qty });
    } else {
      const def = await this.ensureDefaultWarehouse(em, input.userId);
      const levels = await em.getRepository(StockLevel).find({ where: { productId: product.id }, lock: { mode: 'pessimistic_write' } });
      const ordered = levels.filter((l) => l.quantity > EPS).sort((a, b) => (a.warehouseId === def.id ? -1 : b.warehouseId === def.id ? 1 : b.quantity - a.quantity));
      let remaining = -qty;
      for (const l of ordered) {
        if (remaining <= EPS) break;
        const take = Math.min(l.quantity, remaining);
        parts.push({ warehouseId: l.warehouseId, delta: -round(take, 3) });
        remaining = round(remaining - take, 3);
      }
      if (remaining > EPS) {
        if (!input.allowNegative) {
          throw new BadRequestException(`Stock insuffisant pour ${product.name}. Disponible: ${round(-qty - remaining, 3)}, Demandé: ${-qty}`);
        }
        parts.push({ warehouseId: def.id, delta: -remaining });
      }
    }

    // 2) Application par dépôt (et par lot)
    for (const part of parts) {
      const level = await this.lockLevel(em, input.userId, product.id, part.warehouseId);
      if (part.delta < 0 && level.quantity + part.delta < -EPS && !input.allowNegative) {
        throw new BadRequestException(`Stock insuffisant pour ${product.name}. Disponible: ${level.quantity}, Demandé: ${-part.delta}`);
      }

      const slices = await this.lotSlices(em, product, part.warehouseId, part.delta, input);
      for (const slice of slices) {
        const totalBefore = running;
        let cost = product.avgCost || 0;
        if (slice.qty > 0 && input.unitCost !== undefined && input.unitCost !== null) {
          cost = round(input.unitCost, 3);
          product.avgCost = weightedAverageCost(Math.max(totalBefore, 0), product.avgCost || 0, slice.qty, cost);
        }
        level.quantity = round(level.quantity + slice.qty, 3);
        running = round(running + slice.qty, 3);
        const type: MovementType = input.type || (slice.qty > 0 ? 'in' : 'out');
        created.push(
          em.getRepository(StockMovement).create({
            userId: input.userId,
            productId: product.id,
            warehouseId: part.warehouseId,
            type,
            reason: input.reason,
            quantity: slice.qty,
            unitCost: cost,
            balanceAfter: level.quantity,
            totalAfter: running,
            refType: input.refType || null,
            refId: input.refId === undefined ? null : String(input.refId),
            lotNumber: slice.lotNumber,
            note: input.note ? String(input.note).slice(0, 300) : null,
            actorId: input.actorId ?? null,
          }),
        );
      }
      await em.getRepository(StockLevel).save(level);
    }

    // 3) Stock total du produit = somme des dépôts
    product.quantity = running;
    await em.getRepository(Product).save(product);
    return em.getRepository(StockMovement).save(created);
  }

  /** Quantité totale réelle (somme des dépôts). */
  private async totalOf(em: EntityManager, productId: number): Promise<number> {
    const r = await em.query(`SELECT COALESCE(SUM("quantity"),0) AS total FROM "stock_levels" WHERE "productId" = $1`, [productId]);
    return round(Number(r[0].total), 3);
  }

  private async assertWarehouse(em: EntityManager, userId: number, warehouseId: number) {
    const wh = await em.getRepository(Warehouse).findOne({ where: { id: warehouseId, userId } });
    if (!wh) throw new NotFoundException('Dépôt introuvable');
    if (!wh.isActive) throw new BadRequestException(`Le dépôt « ${wh.name} » est désactivé.`);
    return wh;
  }

  private async lockLevel(em: EntityManager, userId: number, productId: number, warehouseId: number): Promise<StockLevel> {
    const repo = em.getRepository(StockLevel);
    let level = await repo.findOne({ where: { productId, warehouseId }, lock: { mode: 'pessimistic_write' } });
    if (!level) {
      await em.query(
        `INSERT INTO "stock_levels" ("userId","productId","warehouseId","quantity") VALUES ($1,$2,$3,0) ON CONFLICT ("productId","warehouseId") DO NOTHING`,
        [userId, productId, warehouseId],
      );
      level = (await repo.findOne({ where: { productId, warehouseId }, lock: { mode: 'pessimistic_write' } }))!;
    }
    return level;
  }

  /**
   * Un produit créé avant l'arrivée du journal a un stock (products.quantity) mais aucun niveau par dépôt :
   * on le reprend dans le dépôt par défaut avec un mouvement « opening », puis le journal prend le relais.
   */
  async adoptLegacyStock(em: EntityManager, product: Product, actorId: number | null) {
    const has = await em.getRepository(StockLevel).count({ where: { productId: product.id } });
    if (has > 0) return;
    const qty = round(Number(product.quantity) || 0, 3);
    if (qty === 0) return;
    const wh = await this.ensureDefaultWarehouse(em, product.userId);
    await em.getRepository(StockLevel).save(em.getRepository(StockLevel).create({ userId: product.userId, productId: product.id, warehouseId: wh.id, quantity: qty }));
    await em.getRepository(StockMovement).save(
      em.getRepository(StockMovement).create({
        userId: product.userId, productId: product.id, warehouseId: wh.id, type: 'opening', reason: 'opening', quantity: qty,
        unitCost: product.avgCost || 0, balanceAfter: qty, totalAfter: qty, note: 'Stock existant repris dans le journal', actorId,
      }),
    );
  }

  /** Découpe une sortie par lot (FEFO) ou applique l'entrée/sortie sur le lot indiqué. */
  private async lotSlices(em: EntityManager, product: Product, warehouseId: number, delta: number, input: MoveInput): Promise<Array<{ qty: number; lotNumber: string | null }>> {
    const lots = em.getRepository(StockLot);
    const lotNumber = input.lotNumber ? String(input.lotNumber).trim().slice(0, 60) : null;

    if (delta > 0) {
      if (!lotNumber) {
        if (product.trackLots) throw new BadRequestException(`Le produit « ${product.name} » est suivi par lot : indiquez le numéro de lot.`);
        return [{ qty: delta, lotNumber: null }];
      }
      let lot = await lots.findOne({ where: { productId: product.id, warehouseId, lotNumber }, lock: { mode: 'pessimistic_write' } });
      if (!lot) lot = lots.create({ userId: product.userId, productId: product.id, warehouseId, lotNumber, expiryDate: input.expiryDate || null, quantity: 0 });
      if (input.expiryDate && !lot.expiryDate) lot.expiryDate = input.expiryDate;
      lot.quantity = round(lot.quantity + delta, 3);
      await lots.save(lot);
      return [{ qty: delta, lotNumber }];
    }

    // Sortie
    if (lotNumber) {
      const lot = await lots.findOne({ where: { productId: product.id, warehouseId, lotNumber }, lock: { mode: 'pessimistic_write' } });
      if (!lot || lot.quantity + delta < -EPS) {
        throw new BadRequestException(`Lot « ${lotNumber} » insuffisant pour ${product.name} (disponible : ${lot ? lot.quantity : 0}).`);
      }
      lot.quantity = round(lot.quantity + delta, 3);
      await lots.save(lot);
      return [{ qty: delta, lotNumber }];
    }
    if (!product.trackLots) return [{ qty: delta, lotNumber: null }];

    // FEFO : le lot qui périme le premier sort le premier
    const available = await lots
      .createQueryBuilder('l')
      .setLock('pessimistic_write')
      .where('l.productId = :p AND l.warehouseId = :w AND l.quantity > 0', { p: product.id, w: warehouseId })
      .orderBy('l.expiryDate', 'ASC', 'NULLS LAST')
      .addOrderBy('l.id', 'ASC')
      .getMany();
    const slices: Array<{ qty: number; lotNumber: string | null }> = [];
    let remaining = -delta;
    for (const lot of available) {
      if (remaining <= EPS) break;
      const take = round(Math.min(lot.quantity, remaining), 3);
      lot.quantity = round(lot.quantity - take, 3);
      await lots.save(lot);
      slices.push({ qty: -take, lotNumber: lot.lotNumber });
      remaining = round(remaining - take, 3);
    }
    if (remaining > EPS) {
      if (!input.allowNegative) throw new BadRequestException(`Stock par lot insuffisant pour ${product.name} (manque ${remaining}).`);
      slices.push({ qty: -remaining, lotNumber: null });
    }
    return slices;
  }

  // ───────────────────────── Opérations manuelles ─────────────────────────

  async adjust(userId: number, actorId: number, dto: { productId: number; warehouseId?: number; quantity?: number; newQuantity?: number; reason: string; unitCost?: number; lotNumber?: string; expiryDate?: string; note?: string }) {
    if ((dto.quantity === undefined) === (dto.newQuantity === undefined)) {
      throw new BadRequestException('Indiquez soit la variation (quantity), soit la quantité cible (newQuantity).');
    }
    return this.ds.transaction(async (em) => {
      const warehouseId = dto.warehouseId || (await this.ensureDefaultWarehouse(em, userId)).id;
      let delta = dto.quantity;
      if (dto.newQuantity !== undefined) {
        const product = await em.getRepository(Product).findOne({ where: { id: dto.productId, userId } });
        if (!product) throw new NotFoundException('Produit introuvable');
        await this.adoptLegacyStock(em, product, actorId);
        const level = await em.getRepository(StockLevel).findOne({ where: { productId: dto.productId, warehouseId } });
        delta = round(dto.newQuantity - (level?.quantity || 0), 3);
      }
      if (!delta) return { movements: [], message: 'Aucun écart : le stock est déjà à cette quantité.' };
      const movements = await this.move(em, {
        userId, actorId, productId: dto.productId, warehouseId, quantity: delta!, reason: dto.reason,
        type: dto.reason === 'opening' ? 'opening' : 'adjustment',
        unitCost: delta! > 0 ? dto.unitCost : undefined, lotNumber: dto.lotNumber, expiryDate: dto.expiryDate, note: dto.note,
      });
      return { movements };
    });
  }

  async transfer(userId: number, actorId: number, dto: { fromWarehouseId: number; toWarehouseId: number; lines: Array<{ productId: number; quantity: number; lotNumber?: string }>; note?: string }) {
    if (dto.fromWarehouseId === dto.toWarehouseId) throw new BadRequestException('Les dépôts de départ et d’arrivée doivent être différents.');
    return this.ds.transaction(async (em) => {
      await this.assertWarehouse(em, userId, dto.fromWarehouseId);
      await this.assertWarehouse(em, userId, dto.toWarehouseId);
      const company = await this.company.getOrCreate(userId, em);
      const year = new Date().getFullYear();
      const n = await this.sequences.next(em, userId, 'stock_transfer', year);
      const number = this.sequences.format(this.company.prefixFor(company, 'stock_transfer'), year, n);
      const moved: StockMovement[] = [];
      for (const line of dto.lines) {
        const product = await em.getRepository(Product).findOne({ where: { id: line.productId, userId } });
        if (!product) throw new NotFoundException(`Produit ${line.productId} introuvable`);
        // Le coût moyen suit la marchandise : l'entrée au dépôt d'arrivée se fait au CMUP actuel (il ne change pas).
        const out = await this.move(em, {
          userId, actorId, productId: line.productId, warehouseId: dto.fromWarehouseId, quantity: -line.quantity, reason: 'transfer', type: 'transfer_out',
          refType: 'transfer', refId: number, lotNumber: line.lotNumber, note: dto.note,
        });
        const expiries = new Map<string, string | null>();
        if (line.lotNumber) {
          const lot = await em.getRepository(StockLot).findOne({ where: { productId: line.productId, warehouseId: dto.fromWarehouseId, lotNumber: line.lotNumber } });
          expiries.set(line.lotNumber, lot?.expiryDate || null);
        }
        for (const o of out) {
          const inn = await this.move(em, {
            userId, actorId, productId: line.productId, warehouseId: dto.toWarehouseId, quantity: -o.quantity, reason: 'transfer', type: 'transfer_in',
            refType: 'transfer', refId: number, lotNumber: o.lotNumber, expiryDate: o.lotNumber ? await this.expiryOf(em, line.productId, dto.fromWarehouseId, o.lotNumber) : null,
            unitCost: undefined, note: dto.note,
          });
          moved.push(o, ...inn);
        }
      }
      return { number, movements: moved };
    });
  }

  private async expiryOf(em: EntityManager, productId: number, warehouseId: number, lotNumber: string) {
    const lot = await em.getRepository(StockLot).findOne({ where: { productId, warehouseId, lotNumber } });
    return lot?.expiryDate || null;
  }

  /** Définit le coût moyen d'un produit (stock repris sans coût connu). Tracé dans le journal d'audit par l'intercepteur. */
  async setAverageCost(userId: number, productId: number, avgCost: number) {
    const repo = this.ds.getRepository(Product);
    const product = await repo.findOne({ where: { id: productId, userId } });
    if (!product) throw new NotFoundException('Produit introuvable');
    product.avgCost = round(avgCost, 3);
    await repo.save(product);
    return { productId, avgCost: product.avgCost };
  }

  /**
   * Contrôle de cohérence : products.quantity doit être égal à la somme des dépôts.
   * `fix=true` réaligne le total du produit sur les dépôts (les dépôts font foi).
   */
  async reconcile(userId: number, fix: boolean) {
    const rows: Array<{ id: number; name: string; quantity: string; levels: string }> = await this.ds.query(
      `SELECT p."id", p."name", p."quantity", COALESCE(SUM(l."quantity"),0) AS levels
         FROM "products" p LEFT JOIN "stock_levels" l ON l."productId" = p."id"
        WHERE p."userId" = $1 AND p."isStockable" = true
        GROUP BY p."id" HAVING EXISTS (SELECT 1 FROM "stock_levels" x WHERE x."productId" = p."id")
           AND ABS(p."quantity" - COALESCE(SUM(l."quantity"),0)) > 0.0005`,
      [userId],
    );
    const drift = rows.map((r) => ({ productId: r.id, name: r.name, productQuantity: Number(r.quantity), warehousesTotal: Number(r.levels) }));
    if (fix && drift.length) {
      for (const d of drift) await this.ds.query(`UPDATE "products" SET "quantity" = $1 WHERE "id" = $2 AND "userId" = $3`, [d.warehousesTotal, d.productId, userId]);
    }
    return { checked: true, drift, fixed: fix ? drift.length : 0 };
  }
}
