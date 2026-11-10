import { BadRequestException, Controller, Get, Injectable, Module, Param, Query, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { round } from '../../common/money';
import { DocumentsModule } from '../documents/documents.module';
import { PaymentsService } from '../documents/payments.service';
import { StockModule } from '../stock/stock.module';
import { StockReportsService } from '../stock/stock-reports.service';

const num = (v: any) => Number(v) || 0;
const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const todayStr = () => new Date().toISOString().slice(0, 10);

export interface Period {
  from: string;
  to: string;
}

/**
 * Lignes de vente valorisées : une ligne de facture compte en positif, une ligne d'avoir en négatif.
 * - chiffre d'affaires = HT net de la ligne (remises incluses) ;
 * - coût = quantité × coût moyen figé à la sortie de stock (`unitCost`). Pour un avoir, le coût n'est annulé que si la
 *   marchandise retourne en stock (sinon elle est perdue : le coût reste acquis et la marge en tient compte) ;
 * - `unknownCost` repère les lignes de produits en stock sans coût connu (un service n'a pas de coût d'achat : il n'est pas signalé) : leur marge est surestimée.
 */
const SALES_LINES_SQL = `
  SELECT d."id" AS "documentId", d."type", d."partyId", d."partyName", to_char(d."issueDate",'YYYY-MM') AS "month",
         l."productId", COALESCE(NULLIF(l."sku",''), '') AS "sku", l."description",
         (CASE WHEN d."type" = 'credit_note' THEN -1 ELSE 1 END) AS "sign",
         l."quantity", l."netHT",
         (CASE WHEN d."type" = 'credit_note' AND l."returnToStock" = false THEN 0
               ELSE COALESCE(l."unitCost", 0) * l."quantity" END) AS "lineCost",
         (CASE WHEN pr."isStockable" = true AND l."unitCost" IS NULL THEN 1 ELSE 0 END) AS "unknownCost"
    FROM "document_lines" l
    JOIN "documents" d ON d."id" = l."documentId"
    LEFT JOIN "products" pr ON pr."id" = l."productId"
   WHERE d."userId" = $1 AND d."type" IN ('invoice','credit_note') AND d."lockedAt" IS NOT NULL AND d."status" <> 'cancelled'
     AND d."issueDate" >= $2::date AND d."issueDate" <= $3::date`;

@Injectable()
export class BusinessReportsService {
  constructor(private readonly ds: DataSource, private readonly payments: PaymentsService, private readonly stockReports: StockReportsService) {}

  period(from?: string, to?: string): Period {
    const year = new Date().getFullYear();
    const p = { from: from || `${year}-01-01`, to: to || todayStr() };
    if (!isDate(p.from) || !isDate(p.to)) throw new BadRequestException('Dates invalides (format AAAA-MM-JJ).');
    if (p.from > p.to) throw new BadRequestException('La date de début doit précéder la date de fin.');
    return p;
  }

  private marginOf(revenue: number, cost: number) {
    const margin = round(revenue - cost, 3);
    return { margin, marginRate: revenue > 0 ? round((margin / revenue) * 100, 2) : null };
  }

  /** Chiffre d'affaires net (factures − avoirs) : totaux, par mois, meilleurs produits et clients. */
  async salesSummary(userId: number, p: Period) {
    const totalsRows = await this.ds.query(
      `SELECT d."type", COUNT(*) AS n, COALESCE(SUM(d."totalHT"),0) AS ht, COALESCE(SUM(d."totalVat"),0) AS vat,
              COALESCE(SUM(d."totalTTC"),0) AS ttc, COALESCE(SUM(d."netToPay"),0) AS net
         FROM "documents" d
        WHERE d."userId" = $1 AND d."type" IN ('invoice','credit_note') AND d."lockedAt" IS NOT NULL AND d."status" <> 'cancelled'
          AND d."issueDate" >= $2::date AND d."issueDate" <= $3::date GROUP BY d."type"`,
      [userId, p.from, p.to],
    );
    const t = (type: string) => totalsRows.find((r: any) => r.type === type) || { n: 0, ht: 0, vat: 0, ttc: 0, net: 0 };
    const inv = t('invoice');
    const cn = t('credit_note');
    const totals = {
      invoices: Number(inv.n), creditNotes: Number(cn.n),
      invoicedHT: round(num(inv.ht), 3), creditedHT: round(num(cn.ht), 3), netHT: round(num(inv.ht) - num(cn.ht), 3),
      netVat: round(num(inv.vat) - num(cn.vat), 3), netTTC: round(num(inv.ttc) - num(cn.ttc), 3),
      averageInvoiceHT: Number(inv.n) ? round(num(inv.ht) / Number(inv.n), 3) : 0,
    };

    const byMonth = await this.ds.query(
      `WITH x AS (${SALES_LINES_SQL})
       SELECT "month", SUM("sign" * "netHT") AS revenue, COUNT(DISTINCT "documentId") FILTER (WHERE "type" = 'invoice') AS invoices
         FROM x GROUP BY "month" ORDER BY "month"`,
      [userId, p.from, p.to],
    );
    const byProduct = await this.ds.query(
      `WITH x AS (${SALES_LINES_SQL})
       SELECT "productId", MIN("sku") AS sku, MIN("description") AS name, SUM("sign" * "quantity") AS qty, SUM("sign" * "netHT") AS revenue
         FROM x GROUP BY "productId", (CASE WHEN "productId" IS NULL THEN "description" END) ORDER BY revenue DESC LIMIT 20`,
      [userId, p.from, p.to],
    );
    const byClient = await this.ds.query(
      `WITH x AS (${SALES_LINES_SQL})
       SELECT "partyId", MIN("partyName") AS name, SUM("sign" * "netHT") AS revenue, COUNT(DISTINCT "documentId") FILTER (WHERE "type" = 'invoice') AS invoices
         FROM x GROUP BY "partyId", (CASE WHEN "partyId" IS NULL THEN "partyName" END) ORDER BY revenue DESC LIMIT 20`,
      [userId, p.from, p.to],
    );
    // Ventes en caisse (tickets des sessions clôturées, non facturés) : montants TTC encaissés, HT extrait au taux du produit.
    const posRows = await this.ds.query(
      `SELECT to_char(z."closedAt", 'YYYY-MM') AS month, COUNT(DISTINCT s."ticketNumber") AS tickets,
              COALESCE(SUM(s."total"),0) AS ttc, COALESCE(SUM(s."total" / (1 + COALESCE(p."vatRate", 0) / 100)),0) AS ht
         FROM "sales" s JOIN "cash_sessions" z ON z."id" = s."posSessionId" AND z."status" = 'closed'
         LEFT JOIN "products" p ON p."id" = s."productId"
        WHERE s."userId" = $1 AND s."documentId" IS NULL AND z."closedAt"::date BETWEEN $2::date AND $3::date
        GROUP BY 1 ORDER BY 1`,
      [userId, p.from, p.to],
    );
    const pos = {
      tickets: posRows.reduce((t: number, r: any) => t + Number(r.tickets), 0),
      ht: round(posRows.reduce((t: number, r: any) => t + num(r.ht), 0), 3),
      ttc: round(posRows.reduce((t: number, r: any) => t + num(r.ttc), 0), 3),
    };
    const monthMap = new Map<string, { month: string; revenue: number; invoices: number; pos: number }>();
    for (const r of byMonth) monthMap.set(r.month, { month: r.month, revenue: round(num(r.revenue), 3), invoices: Number(r.invoices), pos: 0 });
    for (const r of posRows) {
      const cur = monthMap.get(r.month) || { month: r.month, revenue: 0, invoices: 0, pos: 0 };
      cur.pos = round(num(r.ht), 3);
      monthMap.set(r.month, cur);
    }
    const totalRevenue = totals.netHT || 0;
    return {
      period: p,
      totals: { ...totals, posHT: pos.ht, posTTC: pos.ttc, posTickets: pos.tickets, allHT: round(totals.netHT + pos.ht, 3) },
      pos,
      byMonth: [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
      topProducts: byProduct.map((r: any) => ({ productId: r.productId, sku: r.sku || null, name: r.name, quantity: round(num(r.qty), 3), revenue: round(num(r.revenue), 3), share: totalRevenue > 0 ? round((num(r.revenue) / totalRevenue) * 100, 1) : null })),
      topClients: byClient.map((r: any) => ({ clientId: r.partyId, name: r.name, revenue: round(num(r.revenue), 3), invoices: Number(r.invoices), share: totalRevenue > 0 ? round((num(r.revenue) / totalRevenue) * 100, 1) : null })),
    };
  }

  /** Marge brute = chiffre d'affaires − coût des marchandises vendues, par produit ou par client. */
  async margins(userId: number, p: Period, by: 'product' | 'client' = 'product') {
    const key = by === 'client'
      ? { select: `"partyId" AS id, MIN("partyName") AS name, '' AS sku`, group: `"partyId", (CASE WHEN "partyId" IS NULL THEN "partyName" END)` }
      : { select: `"productId" AS id, MIN("description") AS name, MIN("sku") AS sku`, group: `"productId", (CASE WHEN "productId" IS NULL THEN "description" END)` };
    const rows = await this.ds.query(
      `WITH x AS (${SALES_LINES_SQL})
       SELECT ${key.select}, SUM("sign" * "quantity") AS qty, SUM("sign" * "netHT") AS revenue,
              SUM("sign" * "lineCost") AS cost, SUM("unknownCost") AS unknown
         FROM x GROUP BY ${key.group} ORDER BY SUM("sign" * "netHT") DESC`,
      [userId, p.from, p.to],
    );
    const items = rows.map((r: any) => {
      const revenue = round(num(r.revenue), 3);
      const cost = round(num(r.cost), 3);
      return { id: r.id, name: r.name, sku: r.sku || null, quantity: round(num(r.qty), 3), revenue, cost, ...this.marginOf(revenue, cost), linesWithoutCost: Number(r.unknown) };
    });
    const revenue = round(items.reduce((s: number, i: any) => s + i.revenue, 0), 3);
    const cost = round(items.reduce((s: number, i: any) => s + i.cost, 0), 3);
    const unknown = items.reduce((s: number, i: any) => s + i.linesWithoutCost, 0);
    return {
      period: p,
      by,
      totals: { revenue, cost, ...this.marginOf(revenue, cost) },
      items,
      note: unknown > 0 ? `${unknown} ligne(s) de produit sans coût connu : la marge correspondante est surestimée (renseignez le coût d'achat).` : undefined,
    };
  }

  // ═════════════════════════════ Exports Excel ═════════════════════════════

  async exportXlsx(userId: number, kind: string, q: { from?: string; to?: string; asOf?: string }) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Inovexa ERP';
    wb.created = new Date();
    const money = '#,##0.000;[Red]-#,##0.000';
    const style = (ws: ExcelJS.Worksheet, moneyCols: string[] = [], pctCols: string[] = []) => {
      const row = ws.getRow(1);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      moneyCols.forEach((k) => (ws.getColumn(k).numFmt = money));
      pctCols.forEach((k) => (ws.getColumn(k).numFmt = '0.00"%"'));
    };

    let filename: string;
    if (kind === 'sales' || kind === 'margins') {
      const p = this.period(q.from, q.to);
      filename = `${kind}-${p.from}_${p.to}.xlsx`;
      if (kind === 'sales') {
        const d = await this.salesSummary(userId, p);
        const m = wb.addWorksheet('Par mois');
        m.columns = [{ header: 'Mois', key: 'month', width: 12 }, { header: 'Factures', key: 'invoices', width: 12 }, { header: 'CA net HT', key: 'revenue', width: 18 }];
        d.byMonth.forEach((r: any) => m.addRow(r));
        m.addRow({ month: 'TOTAL', invoices: d.totals.invoices, revenue: d.totals.netHT }).font = { bold: true };
        style(m, ['revenue']);
        const pr = wb.addWorksheet('Produits');
        pr.columns = [{ header: 'Référence', key: 'sku', width: 16 }, { header: 'Désignation', key: 'name', width: 44 }, { header: 'Quantité', key: 'quantity', width: 12 }, { header: 'CA net HT', key: 'revenue', width: 18 }, { header: 'Part %', key: 'share', width: 10 }];
        d.topProducts.forEach((r: any) => pr.addRow(r));
        style(pr, ['revenue']);
        const cl = wb.addWorksheet('Clients');
        cl.columns = [{ header: 'Client', key: 'name', width: 44 }, { header: 'Factures', key: 'invoices', width: 10 }, { header: 'CA net HT', key: 'revenue', width: 18 }, { header: 'Part %', key: 'share', width: 10 }];
        d.topClients.forEach((r: any) => cl.addRow(r));
        style(cl, ['revenue']);
      } else {
        for (const by of ['product', 'client'] as const) {
          const d = await this.margins(userId, p, by);
          const ws = wb.addWorksheet(by === 'product' ? 'Marge par produit' : 'Marge par client');
          ws.columns = [{ header: by === 'product' ? 'Désignation' : 'Client', key: 'name', width: 44 }, { header: 'Référence', key: 'sku', width: 16 }, { header: 'Quantité', key: 'quantity', width: 12 }, { header: 'CA net HT', key: 'revenue', width: 16 }, { header: 'Coût', key: 'cost', width: 16 }, { header: 'Marge', key: 'margin', width: 16 }, { header: 'Taux de marge %', key: 'marginRate', width: 16 }];
          d.items.forEach((r: any) => ws.addRow(r));
          ws.addRow({ name: 'TOTAL', revenue: d.totals.revenue, cost: d.totals.cost, margin: d.totals.margin, marginRate: d.totals.marginRate }).font = { bold: true };
          style(ws, ['revenue', 'cost', 'margin'], ['marginRate']);
        }
      }
    } else if (kind === 'aging-clients' || kind === 'aging-suppliers') {
      const side = kind === 'aging-clients' ? 'client' : 'supplier';
      const d = await this.payments.aging(userId, side, q.asOf);
      filename = `${kind}-${d.asOf}.xlsx`;
      const ws = wb.addWorksheet(side === 'client' ? 'Balance âgée clients' : 'Balance âgée fournisseurs');
      ws.columns = [{ header: side === 'client' ? 'Client' : 'Fournisseur', key: 'partyName', width: 40 }, { header: 'Non échu', key: 'current', width: 14 }, { header: '1-30 j', key: 'd1_30', width: 14 }, { header: '31-60 j', key: 'd31_60', width: 14 }, { header: '61-90 j', key: 'd61_90', width: 14 }, { header: '> 90 j', key: 'd90plus', width: 14 }, { header: 'Total dû', key: 'total', width: 16 }, { header: 'Avoirs', key: 'credits', width: 14 }, { header: 'Net', key: 'net', width: 16 }];
      d.parties.forEach((r: any) => ws.addRow(r));
      ws.addRow({ partyName: 'TOTAUX', ...d.totals }).font = { bold: true };
      style(ws, ['current', 'd1_30', 'd31_60', 'd61_90', 'd90plus', 'total', 'credits', 'net']);
    } else if (kind === 'stock-valuation') {
      const d = await this.stockReports.valuation(userId);
      filename = `valorisation-stock-${todayStr()}.xlsx`;
      const w = wb.addWorksheet('Par dépôt');
      w.columns = [{ header: 'Dépôt', key: 'warehouse', width: 32 }, { header: 'Quantité', key: 'quantity', width: 14 }, { header: 'Valeur (CMUP)', key: 'value', width: 18 }];
      d.warehouses.forEach((r: any) => w.addRow(r));
      w.addRow({ warehouse: 'TOTAL', value: d.totalValue }).font = { bold: true };
      style(w, ['value']);
      const c = wb.addWorksheet('Par catégorie');
      c.columns = [{ header: 'Catégorie', key: 'category', width: 32 }, { header: 'Valeur (CMUP)', key: 'value', width: 18 }];
      d.categories.forEach((r: any) => c.addRow(r));
      style(c, ['value']);
    } else {
      throw new BadRequestException('Export inconnu (sales, margins, aging-clients, aging-suppliers, stock-valuation).');
    }
    return { buffer: Buffer.from(await wb.xlsx.writeBuffer()), filename };
  }
}

/** Rapports de gestion : ventes, marges, balance âgée et valorisation du stock, avec export Excel. */
@ApiTags('Rapports de gestion')
@ApiBearerAuth()
@Controller('reports/business')
@UseGuards(JwtAuthGuard)
export class BusinessReportsController {
  constructor(private readonly service: BusinessReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Chiffre d’affaires net (factures − avoirs) : totaux, par mois, top produits et clients' })
  sales(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.salesSummary(req.user.userId, this.service.period(from, to));
  }

  @Get('margins')
  @ApiOperation({ summary: 'Marge brute par produit (défaut) ou par client' })
  margins(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string, @Query('by') by?: string) {
    return this.service.margins(req.user.userId, this.service.period(from, to), by === 'client' ? 'client' : 'product');
  }

  @Get('export/:kind')
  @ApiOperation({ summary: 'Export Excel : sales, margins, aging-clients, aging-suppliers, stock-valuation' })
  async export(@Request() req: any, @Param('kind') kind: string, @Query() q: any, @Res() res: Response) {
    const { buffer, filename } = await this.service.exportXlsx(req.user.userId, kind, { from: q.from, to: q.to, asOf: q.asOf });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}

@Module({
  imports: [DocumentsModule, StockModule],
  controllers: [BusinessReportsController],
  providers: [BusinessReportsService],
})
export class BusinessReportsModule {}
