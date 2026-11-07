import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Product } from '../products/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { normalizePaymentMethod, toNumber } from '../../common/import-utils';
import { StockService } from '../stock/stock.service';
import { CashSession } from './entities/cash-session.entity';
import { SequenceService } from '../../common/sequences/sequence.service';
import { CompanyService } from '../company/company.service';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface PosLine { productId: number; quantity: number; unitPrice?: number }

/**
 * Caisse rapide : vendre ou acheter plusieurs produits en une seule opération.
 *
 * Mêmes règles que les modules Ventes / Achats (la vente retire du stock et refuse un stock insuffisant,
 * l'achat ajoute du stock, le client / fournisseur saisi est créé s'il n'existe pas), mais :
 *  - tout est enregistré dans UNE transaction : si une ligne échoue, rien n'est enregistré ;
 *  - les produits sont verrouillés pendant l'opération (pas de vente simultanée du même dernier article).
 */
@Injectable()
export class PosService {
  constructor(private readonly dataSource: DataSource, private readonly stock: StockService, private readonly sequences: SequenceService, private readonly company: CompanyService) {}

  async checkout(userId: number, body: any) {
    const mode: 'sale' | 'purchase' | null = body?.mode === 'sale' ? 'sale' : body?.mode === 'purchase' ? 'purchase' : null;
    if (!mode) throw new BadRequestException("Mode invalide : « sale » (vente) ou « purchase » (achat)");

    const rawLines: any[] = Array.isArray(body?.lines) ? body.lines : [];
    if (rawLines.length === 0) throw new BadRequestException('Le panier est vide');
    if (rawLines.length > 100) throw new BadRequestException('Trop de lignes (100 maximum)');

    // Fusionne les lignes d'un même produit
    const merged = new Map<number, PosLine>();
    for (const l of rawLines) {
      const productId = Number(l?.productId);
      const quantity = Number(l?.quantity);
      if (!Number.isInteger(productId) || productId <= 0) throw new BadRequestException('Produit invalide');
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100000) {
        throw new BadRequestException('Quantité invalide (nombre entier entre 1 et 100 000)');
      }
      let unitPrice: number | undefined;
      if (l?.unitPrice !== undefined && l?.unitPrice !== null && l?.unitPrice !== '') {
        unitPrice = toNumber(l.unitPrice, NaN);
        if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 99_999_999) throw new BadRequestException('Prix unitaire invalide');
      }
      const prev = merged.get(productId);
      if (prev) { prev.quantity += quantity; if (unitPrice !== undefined) prev.unitPrice = unitPrice; }
      else merged.set(productId, { productId, quantity, unitPrice });
    }

    const counterpart = (typeof body?.counterpart === 'string' ? body.counterpart.trim() : '').slice(0, 120) || null;
    const paymentMethod = normalizePaymentMethod(body?.paymentMethod);

    return this.dataSource.transaction(async (manager) => {
      // Session de caisse ouverte : la vente y est rattachée (rapport Z). POS_REQUIRE_SESSION=true l'impose.
      const session = await manager.findOne(CashSession, { where: { userId, status: 'open' } });
      if (!session && process.env.POS_REQUIRE_SESSION === 'true') throw new BadRequestException('Ouvrez une session de caisse avant d’encaisser.');
      const nowTs = new Date();
      const ticketNumber = `${mode === 'sale' ? 'V' : 'A'}-${nowTs.toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
      const ids = Array.from(merged.keys());
      const products = await manager.find(Product, { where: { id: In(ids), userId }, lock: { mode: 'pessimistic_write' } });
      if (products.length !== ids.length) throw new NotFoundException('Un des produits est introuvable');
      const byId = new Map(products.map((p) => [p.id, p]));

      // Vente : on vérifie TOUT le stock avant d'enregistrer quoi que ce soit
      if (mode === 'sale') {
        const short = ids
          .map((id) => ({ p: byId.get(id)!, qty: merged.get(id)!.quantity }))
          .filter(({ p, qty }) => (p.quantity || 0) < qty)
          .map(({ p, qty }) => `${p.name} (disponible : ${p.quantity || 0}, demandé : ${qty})`);
        if (short.length) throw new BadRequestException(`Stock insuffisant : ${short.join(' ; ')}`);
      }

      // Client / fournisseur saisi : créé s'il n'existe pas (comme dans les modules Ventes / Achats)
      let counterpartName = counterpart;
      if (counterpart) {
        if (mode === 'sale') {
          const existing = await manager.createQueryBuilder(Client, 'c').where('c.userId = :userId', { userId }).andWhere('LOWER(c.name) = LOWER(:name)', { name: counterpart }).getOne();
          if (existing) counterpartName = existing.name;
          else await manager.save(Client, manager.create(Client, { userId, name: counterpart, email: '' }));
        } else {
          const existing = await manager.createQueryBuilder(Supplier, 's').where('s.userId = :userId', { userId }).andWhere('LOWER(s.name) = LOWER(:name)', { name: counterpart }).getOne();
          if (existing) counterpartName = existing.name;
          else await manager.save(Supplier, manager.create(Supplier, { userId, name: counterpart, email: '' } as any));
        }
      }

      const lines: Array<{ productId: number; productName: string; quantity: number; unitPrice: number; total: number; newStock: number }> = [];
      for (const id of ids) {
        const product = byId.get(id)!;
        const { quantity, unitPrice: given } = merged.get(id)!;
        const unitPrice = round2(given !== undefined ? given : Number(product.price) || 0);
        const total = round2(unitPrice * quantity);

        if (mode === 'sale') {
          await manager.save(Sale, manager.create(Sale, {
            userId, productId: product.id, productName: product.name, clientName: counterpartName || 'Client comptoir',
            quantity, unitPrice, total, status: 'completed', paymentMethod, posSessionId: session?.id ?? null, ticketNumber,
          } as any));
        } else {
          await manager.save(Purchase, manager.create(Purchase, {
            userId, productId: product.id, productName: product.name, supplierName: counterpartName || undefined,
            quantity, unitPrice, total, status: 'received', paymentMethod, posSessionId: session?.id ?? null, ticketNumber,
          } as any));
        }
        // Le mouvement de stock est tracé dans le journal (et le stock total du produit mis à jour).
        await this.stock.move(manager, {
          userId, productId: product.id, quantity: mode === 'sale' ? -quantity : quantity, reason: 'pos', refType: 'pos',
          refId: product.id, unitCost: mode === 'purchase' ? unitPrice : undefined, note: `Caisse — ${mode === 'sale' ? 'vente' : 'achat'}`,
        });
        const fresh = await manager.findOne(Product, { where: { id: product.id } });
        lines.push({ productId: product.id, productName: product.name, quantity, unitPrice, total, newStock: fresh ? fresh.quantity : product.quantity });
      }

      const now = nowTs;
      return {
        success: true,
        mode,
        ticketNumber,
        sessionId: session?.id ?? null,
        counterpart: counterpartName || (mode === 'sale' ? 'Client comptoir' : null),
        paymentMethod,
        itemsCount: lines.reduce((s, l) => s + l.quantity, 0),
        total: round2(lines.reduce((s, l) => s + l.total, 0)),
        lines,
        createdAt: now.toISOString(),
      };
    });
  }

  /** Totaux du jour (ventes et achats enregistrés depuis minuit, heure du serveur) */
  async today(userId: number) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const q = async (table: string) => {
      const r = await this.dataSource.query(`SELECT COUNT(*)::int AS n, COALESCE(SUM(total), 0)::float AS t FROM "${table}" WHERE "userId" = $1 AND "createdAt" >= $2`, [userId, start]);
      return { count: r[0].n as number, total: round2(r[0].t as number) };
    };
    const [sales, purchases] = await Promise.all([q('sales'), q('purchases')]);
    return { sales, purchases };
  }

  // ═════════════════════════════ Sessions de caisse (rapport Z) ═════════════════════════════

  async currentSession(userId: number) {
    const session = await this.dataSource.getRepository(CashSession).findOne({ where: { userId, status: 'open' } });
    if (!session) return { open: false, session: null };
    return { open: true, session, live: await this.computeReport(userId, session) };
  }

  async openSession(userId: number, actorId: number, dto: { openingFloat?: number; note?: string }) {
    const float = Number(dto.openingFloat ?? 0);
    if (!Number.isFinite(float) || float < 0 || float > 1e9) throw new BadRequestException('Fond de caisse invalide.');
    const repo = this.dataSource.getRepository(CashSession);
    if (await repo.findOne({ where: { userId, status: 'open' } })) throw new BadRequestException('Une session de caisse est déjà ouverte : clôturez-la d’abord.');
    return repo.save(repo.create({ userId, status: 'open', openedAt: new Date(), openingFloat: round2(float), note: dto.note?.slice(0, 300) || null, openedBy: actorId } as any));
  }

  private async computeReport(userId: number, session: CashSession) {
    const rows = async (table: 'sales' | 'purchases') =>
      (await this.dataSource.query(
        `SELECT COALESCE("paymentMethod",'cash') AS method, COUNT(DISTINCT "ticketNumber")::int AS tickets, COALESCE(SUM("total"),0)::float AS total
           FROM "${table}" WHERE "userId" = $1 AND "posSessionId" = $2 GROUP BY 1 ORDER BY 1`,
        [userId, session.id],
      )).map((r: any) => ({ method: r.method, tickets: r.tickets, total: round2(r.total) }));
    const [sales, purchases] = await Promise.all([rows('sales'), rows('purchases')]);
    const sum = (list: Array<{ total: number }>) => round2(list.reduce((t, x) => t + x.total, 0));
    const cashIn = sales.find((r: any) => r.method === 'cash')?.total || 0;
    const cashOut = purchases.find((r: any) => r.method === 'cash')?.total || 0;
    const topProducts = await this.dataSource.query(
      `SELECT "productName" AS name, SUM("quantity")::float AS quantity, SUM("total")::float AS total FROM "sales" WHERE "userId" = $1 AND "posSessionId" = $2 GROUP BY "productName" ORDER BY SUM("total") DESC LIMIT 5`,
      [userId, session.id],
    );
    return {
      sales, purchases,
      salesTotal: sum(sales), purchasesTotal: sum(purchases),
      salesTickets: sales.reduce((t: number, r: any) => t + r.tickets, 0),
      expectedCash: round2(Number(session.openingFloat) + cashIn - cashOut),
      topProducts: topProducts.map((p: any) => ({ ...p, total: round2(p.total) })),
      note: 'Les ventes sans moyen de paiement précisé sont comptées en espèces.',
    };
  }

  /** Clôture : fige le rapport Z, compare les espèces comptées aux espèces attendues. */
  async closeSession(userId: number, actorId: number, dto: { countedCash: number; note?: string }) {
    const counted = Number(dto.countedCash);
    if (!Number.isFinite(counted) || counted < 0 || counted > 1e9) throw new BadRequestException('Montant compté invalide.');
    return this.dataSource.transaction(async (em) => {
      const session = await em.findOne(CashSession, { where: { userId, status: 'open' }, lock: { mode: 'pessimistic_write' } });
      if (!session) throw new NotFoundException('Aucune session de caisse ouverte.');
      const report = await this.computeReport(userId, session);
      const company = await this.company.getOrCreate(userId, em);
      const year = new Date().getFullYear();
      const n = await this.sequences.next(em, userId, 'cash_session', year);
      session.number = this.sequences.format(this.company.prefixFor(company, 'cash_session'), year, n);
      session.status = 'closed';
      session.closedAt = new Date();
      session.closedBy = actorId;
      session.countedCash = round2(counted);
      session.expectedCash = report.expectedCash;
      session.variance = round2(counted - report.expectedCash);
      session.report = { ...report, openingFloat: Number(session.openingFloat), countedCash: round2(counted), variance: session.variance };
      if (dto.note) session.note = [session.note, dto.note].filter(Boolean).join(' — ').slice(0, 300);
      return em.save(session);
    });
  }

  async listSessions(userId: number) {
    const rows = await this.dataSource.getRepository(CashSession).find({ where: { userId }, order: { openedAt: 'DESC' }, take: 100 });
    return rows.map(({ report, ...r }) => ({ ...r, salesTotal: report?.salesTotal ?? null }));
  }

  async getSession(userId: number, id: number) {
    const session = await this.dataSource.getRepository(CashSession).findOne({ where: { id, userId } });
    if (!session) throw new NotFoundException('Session introuvable');
    return session.status === 'open' ? { ...session, report: await this.computeReport(userId, session) } : session;
  }

  /** Ticket de caisse réimprimable. */
  async ticket(userId: number, ticketNumber: string) {
    const sales = await this.dataSource.query(
      `SELECT "productName", "quantity"::float AS quantity, "unitPrice"::float AS "unitPrice", "total"::float AS total, "clientName", "paymentMethod", "createdAt" FROM "sales" WHERE "userId" = $1 AND "ticketNumber" = $2 ORDER BY "id"`,
      [userId, ticketNumber],
    );
    const purchases = sales.length ? [] : await this.dataSource.query(
      `SELECT "productName", "quantity"::float AS quantity, "unitPrice"::float AS "unitPrice", "total"::float AS total, "supplierName", "paymentMethod", "createdAt" FROM "purchases" WHERE "userId" = $1 AND "ticketNumber" = $2 ORDER BY "id"`,
      [userId, ticketNumber],
    );
    const lines = sales.length ? sales : purchases;
    if (!lines.length) throw new NotFoundException('Ticket introuvable');
    const company = await this.company.getOrCreate(userId);
    return {
      ticketNumber, mode: sales.length ? 'sale' : 'purchase', createdAt: lines[0].createdAt, paymentMethod: lines[0].paymentMethod,
      counterpart: lines[0].clientName || lines[0].supplierName || null,
      company: { name: company.legalName, taxId: company.taxId, address: company.address, phone: company.phone },
      lines, total: round2(lines.reduce((t: number, l: any) => t + l.total, 0)),
    };
  }
}
