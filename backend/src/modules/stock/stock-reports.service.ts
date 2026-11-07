import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { round } from '../../common/money';

const num = (v: any) => (v === null || v === undefined ? 0 : Number(v));

/** Rapports de stock : niveaux, valorisation, fiche de stock, alertes, rotation. Lecture seule. */
@Injectable()
export class StockReportsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /** Stock par produit avec le détail par dépôt. */
  async levels(userId: number, opts: { warehouseId?: number; search?: string; lowOnly?: boolean; limit?: number; offset?: number } = {}) {
    const params: any[] = [userId];
    let where = `p."userId" = $1 AND p."isStockable" = true`;
    if (opts.search) {
      params.push(`%${opts.search.toLowerCase()}%`);
      where += ` AND (LOWER(p."name") LIKE $${params.length} OR LOWER(p."sku") LIKE $${params.length} OR LOWER(COALESCE(p."barcode",'')) LIKE $${params.length})`;
    }
    if (opts.lowOnly) where += ` AND p."quantity" <= p."minStock"`;
    if (opts.warehouseId) {
      params.push(opts.warehouseId);
      where += ` AND EXISTS (SELECT 1 FROM "stock_levels" w WHERE w."productId" = p."id" AND w."warehouseId" = $${params.length} AND w."quantity" <> 0)`;
    }
    const limit = Math.min(Math.max(opts.limit || 200, 1), 1000);
    const offset = Math.max(opts.offset || 0, 0);
    const products = await this.ds.query(
      `SELECT p."id", p."name", p."sku", p."unit", p."quantity", p."minStock", p."avgCost", p."price", p."trackLots",
              (SELECT COUNT(*) FROM "stock_levels" l WHERE l."productId" = p."id") AS "levelRows"
         FROM "products" p WHERE ${where} ORDER BY p."name" ASC LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    const ids = products.map((p: any) => p.id);
    const perWh = ids.length
      ? await this.ds.query(
          `SELECT l."productId", l."warehouseId", l."quantity", w."name" AS "warehouseName"
             FROM "stock_levels" l JOIN "warehouses" w ON w."id" = l."warehouseId"
            WHERE l."productId" = ANY($1::int[]) AND l."quantity" <> 0 ORDER BY w."name"`,
          [ids],
        )
      : [];
    const byProduct = new Map<number, any[]>();
    for (const r of perWh) {
      const list = byProduct.get(r.productId) || [];
      list.push({ warehouseId: r.warehouseId, warehouse: r.warehouseName, quantity: num(r.quantity) });
      byProduct.set(r.productId, list);
    }
    return products.map((p: any) => {
      const qty = num(p.quantity);
      return {
        productId: p.id, name: p.name, sku: p.sku, unit: p.unit, quantity: qty, minStock: p.minStock,
        avgCost: num(p.avgCost), value: round(qty * num(p.avgCost), 3), price: num(p.price), trackLots: p.trackLots,
        status: qty <= 0 ? 'out' : qty <= p.minStock ? 'low' : 'ok',
        // Produit repris de l'ancien système : son détail par dépôt apparaîtra au premier mouvement.
        warehouses: byProduct.get(p.id) || (qty !== 0 && Number(p.levelRows) === 0 ? [{ warehouseId: null, warehouse: 'Non réparti', quantity: qty }] : []),
      };
    });
  }

  /** Valorisation du stock au coût moyen pondéré (CMUP). */
  async valuation(userId: number) {
    const rows = await this.ds.query(
      `SELECT w."id" AS "warehouseId", w."name" AS warehouse, COALESCE(c."name",'Sans catégorie') AS category,
              SUM(l."quantity") AS qty, SUM(l."quantity" * p."avgCost") AS value
         FROM "stock_levels" l
         JOIN "products" p ON p."id" = l."productId"
         JOIN "warehouses" w ON w."id" = l."warehouseId"
         LEFT JOIN "categories" c ON c."id" = p."categoryId"
        WHERE l."userId" = $1 AND l."quantity" > 0 GROUP BY w."id", w."name", c."name" ORDER BY w."name", category`,
      [userId],
    );
    const unrepartitioned = await this.ds.query(
      `SELECT COALESCE(SUM(p."quantity" * p."avgCost"),0) AS value, COUNT(*) AS n
         FROM "products" p WHERE p."userId" = $1 AND p."isStockable" = true AND p."quantity" > 0
          AND NOT EXISTS (SELECT 1 FROM "stock_levels" l WHERE l."productId" = p."id")`,
      [userId],
    );
    const noCost = await this.ds.query(
      `SELECT COUNT(*) AS n FROM "products" p WHERE p."userId" = $1 AND p."isStockable" = true AND p."quantity" > 0 AND p."avgCost" = 0`,
      [userId],
    );
    const byWarehouse = new Map<number, { warehouseId: number; warehouse: string; quantity: number; value: number }>();
    const byCategory = new Map<string, { category: string; value: number }>();
    for (const r of rows) {
      const w = byWarehouse.get(r.warehouseId) || { warehouseId: r.warehouseId, warehouse: r.warehouse, quantity: 0, value: 0 };
      w.quantity = round(w.quantity + num(r.qty), 3);
      w.value = round(w.value + num(r.value), 3);
      byWarehouse.set(r.warehouseId, w);
      const c = byCategory.get(r.category) || { category: r.category, value: 0 };
      c.value = round(c.value + num(r.value), 3);
      byCategory.set(r.category, c);
    }
    const extra = num(unrepartitioned[0]?.value);
    if (extra) {
      const c = byCategory.get('Sans catégorie') || { category: 'Sans catégorie', value: 0 };
      c.value = round(c.value + extra, 3);
      byCategory.set('Sans catégorie', c);
    }
    const warehouses = Array.from(byWarehouse.values());
    return {
      method: 'CMUP (coût moyen unitaire pondéré)',
      totalValue: round(warehouses.reduce((s, w) => s + w.value, 0) + extra, 3),
      warehouses,
      categories: Array.from(byCategory.values()).sort((a, b) => b.value - a.value),
      productsWithoutCost: Number(noCost[0]?.n || 0),
      note: Number(noCost[0]?.n || 0) > 0 ? 'Certains produits en stock n’ont pas de coût : renseignez-le (PATCH /stock/products/:id/cost) pour une valorisation exacte.' : undefined,
    };
  }

  /** Journal des mouvements, filtrable. */
  async movements(userId: number, f: { productId?: number; warehouseId?: number; reason?: string; type?: string; refType?: string; refId?: string; from?: string; to?: string; limit?: number; offset?: number }) {
    const params: any[] = [userId];
    let where = `m."userId" = $1`;
    const add = (sql: string, v: any) => { params.push(v); where += ` AND ${sql.replace('?', `$${params.length}`)}`; };
    if (f.productId) add(`m."productId" = ?`, f.productId);
    if (f.warehouseId) add(`m."warehouseId" = ?`, f.warehouseId);
    if (f.reason) add(`m."reason" = ?`, f.reason);
    if (f.type) add(`m."type" = ?`, f.type);
    if (f.refType) add(`m."refType" = ?`, f.refType);
    if (f.refId) add(`m."refId" = ?`, f.refId);
    if (f.from) add(`m."createdAt" >= ?`, f.from);
    if (f.to) add(`m."createdAt" < (?::date + 1)`, f.to);
    const limit = Math.min(Math.max(f.limit || 100, 1), 500);
    const offset = Math.max(f.offset || 0, 0);
    const total = await this.ds.query(`SELECT COUNT(*) AS n FROM "stock_movements" m WHERE ${where}`, params);
    const items = await this.ds.query(
      `SELECT m.*, p."name" AS "productName", p."sku", w."name" AS "warehouseName"
         FROM "stock_movements" m JOIN "products" p ON p."id" = m."productId" JOIN "warehouses" w ON w."id" = m."warehouseId"
        WHERE ${where} ORDER BY m."createdAt" DESC, m."id" DESC LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    return {
      total: Number(total[0].n), limit, offset,
      items: items.map((m: any) => ({ ...m, quantity: num(m.quantity), unitCost: num(m.unitCost), balanceAfter: num(m.balanceAfter), totalAfter: num(m.totalAfter) })),
    };
  }

  /** Fiche de stock d'un produit : report à nouveau, mouvements de la période avec solde cumulé, solde final. */
  async card(userId: number, productId: number, from?: string, to?: string) {
    const [p] = await this.ds.query(`SELECT "id","name","sku","unit","quantity","avgCost" FROM "products" WHERE "id" = $1 AND "userId" = $2`, [productId, userId]);
    if (!p) throw new NotFoundException('Produit introuvable');
    const before = from
      ? await this.ds.query(`SELECT COALESCE(SUM("quantity"),0) AS q FROM "stock_movements" WHERE "userId" = $1 AND "productId" = $2 AND "createdAt" < $3::date`, [userId, productId, from])
      : [{ q: 0 }];
    const params: any[] = [userId, productId];
    let where = `m."userId" = $1 AND m."productId" = $2`;
    if (from) { params.push(from); where += ` AND m."createdAt" >= $${params.length}::date`; }
    if (to) { params.push(to); where += ` AND m."createdAt" < ($${params.length}::date + 1)`; }
    const rows = await this.ds.query(
      `SELECT m."id", m."createdAt", m."type", m."reason", m."quantity", m."unitCost", m."refType", m."refId", m."lotNumber", m."note", w."name" AS warehouse
         FROM "stock_movements" m JOIN "warehouses" w ON w."id" = m."warehouseId" WHERE ${where} ORDER BY m."createdAt", m."id"`,
      params,
    );
    let balance = round(num(before[0].q), 3);
    const opening = balance;
    let totalIn = 0, totalOut = 0;
    const lines = rows.map((r: any) => {
      const q = num(r.quantity);
      balance = round(balance + q, 3);
      if (q > 0) totalIn += q; else totalOut += -q;
      return { ...r, quantity: q, unitCost: num(r.unitCost), balance };
    });
    return {
      product: { id: p.id, name: p.name, sku: p.sku, unit: p.unit, currentQuantity: num(p.quantity), avgCost: num(p.avgCost) },
      period: { from: from || null, to: to || null },
      opening, totalIn: round(totalIn, 3), totalOut: round(totalOut, 3), closing: balance, lines,
    };
  }

  /** Alertes : stock bas / rupture, lots proches de la péremption ou périmés. */
  async alerts(userId: number, expiryDays = 60) {
    const low = await this.ds.query(
      `SELECT "id","name","sku","quantity","minStock","unit" FROM "products"
        WHERE "userId" = $1 AND "isStockable" = true AND "quantity" <= "minStock" ORDER BY ("quantity" <= 0) DESC, "quantity" ASC LIMIT 200`,
      [userId],
    );
    const lots = await this.ds.query(
      `SELECT l."id", l."productId", p."name" AS "productName", w."name" AS warehouse, l."lotNumber", l."expiryDate", l."quantity",
              (l."expiryDate" - CURRENT_DATE) AS "daysLeft"
         FROM "stock_lots" l JOIN "products" p ON p."id" = l."productId" JOIN "warehouses" w ON w."id" = l."warehouseId"
        WHERE l."userId" = $1 AND l."quantity" > 0 AND l."expiryDate" IS NOT NULL AND l."expiryDate" <= CURRENT_DATE + $2::int
        ORDER BY l."expiryDate" ASC LIMIT 200`,
      [userId, expiryDays],
    );
    return {
      lowStock: low.map((p: any) => ({ productId: p.id, name: p.name, sku: p.sku, unit: p.unit, quantity: num(p.quantity), minStock: p.minStock, status: num(p.quantity) <= 0 ? 'out' : 'low' })),
      expiringLots: lots.map((l: any) => ({ ...l, quantity: num(l.quantity), daysLeft: Number(l.daysLeft), expired: Number(l.daysLeft) < 0 })),
    };
  }

  async lots(userId: number, f: { productId?: number; warehouseId?: number; expiringInDays?: number }) {
    const params: any[] = [userId];
    let where = `l."userId" = $1 AND l."quantity" > 0`;
    if (f.productId) { params.push(f.productId); where += ` AND l."productId" = $${params.length}`; }
    if (f.warehouseId) { params.push(f.warehouseId); where += ` AND l."warehouseId" = $${params.length}`; }
    if (f.expiringInDays !== undefined) { params.push(f.expiringInDays); where += ` AND l."expiryDate" IS NOT NULL AND l."expiryDate" <= CURRENT_DATE + $${params.length}::int`; }
    const rows = await this.ds.query(
      `SELECT l.*, p."name" AS "productName", w."name" AS warehouse FROM "stock_lots" l
         JOIN "products" p ON p."id" = l."productId" JOIN "warehouses" w ON w."id" = l."warehouseId"
        WHERE ${where} ORDER BY l."expiryDate" ASC NULLS LAST, l."id" LIMIT 500`,
      params,
    );
    return rows.map((l: any) => ({ ...l, quantity: num(l.quantity) }));
  }

  /**
   * Rotation du stock sur une période : coût des marchandises sorties / stock moyen valorisé.
   * Plus la rotation est élevée, plus le stock tourne vite ; « jours de stock » = durée que couvre le stock actuel.
   */
  async rotation(userId: number, from: string, to: string) {
    const days = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);
    const rows = await this.ds.query(
      `WITH out_cost AS (
         SELECT "productId", SUM(-"quantity") AS out_qty, SUM(-"quantity" * "unitCost") AS cogs
           FROM "stock_movements"
          WHERE "userId" = $1 AND "quantity" < 0 AND "reason" IN ('sale','delivery','pos','invoice')
            AND "createdAt" >= $2::date AND "createdAt" < ($3::date + 1)
          GROUP BY "productId"),
       open_q AS (
         SELECT "productId", SUM("quantity") AS q FROM "stock_movements" WHERE "userId" = $1 AND "createdAt" < $2::date GROUP BY "productId"),
       close_q AS (
         SELECT "productId", SUM("quantity") AS q FROM "stock_movements" WHERE "userId" = $1 AND "createdAt" < ($3::date + 1) GROUP BY "productId")
       SELECT p."id", p."name", p."sku", p."avgCost", COALESCE(o.out_qty,0) AS out_qty, COALESCE(o.cogs,0) AS cogs,
              COALESCE(oq.q,0) AS opening, COALESCE(cq.q,0) AS closing
         FROM "products" p
         LEFT JOIN out_cost o ON o."productId" = p."id" LEFT JOIN open_q oq ON oq."productId" = p."id" LEFT JOIN close_q cq ON cq."productId" = p."id"
        WHERE p."userId" = $1 AND p."isStockable" = true AND (o.out_qty IS NOT NULL OR COALESCE(cq.q,0) > 0)`,
      [userId, from, to],
    );
    const items = rows.map((r: any) => {
      const avgQty = (num(r.opening) + num(r.closing)) / 2;
      const avgValue = avgQty * num(r.avgCost);
      const cogs = num(r.cogs);
      const rotation = avgValue > 0 ? cogs / avgValue : null;
      const dailyOut = num(r.out_qty) / days;
      return {
        productId: r.id, name: r.name, sku: r.sku, soldQty: round(num(r.out_qty), 3), cogs: round(cogs, 3),
        averageStockValue: round(avgValue, 3), rotation: rotation === null ? null : round(rotation, 2),
        daysOfStock: dailyOut > 0 ? Math.round(num(r.closing) / dailyOut) : null,
        closingQty: round(num(r.closing), 3), status: num(r.out_qty) === 0 ? 'dormant' : rotation !== null && rotation < 1 ? 'slow' : 'ok',
      };
    });
    items.sort((a: any, b: any) => (b.rotation ?? -1) - (a.rotation ?? -1));
    return { period: { from, to, days }, items, dormantCount: items.filter((i: any) => i.status === 'dormant').length };
  }
}
