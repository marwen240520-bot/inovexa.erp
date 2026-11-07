import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { AccountingService } from './accounting.service';
import { JOURNALS } from './chart';
import { round } from '../../common/money';

export interface Period {
  from?: string;
  to?: string;
}

const isDate = (s?: string) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s);

@Injectable()
export class AccountingReportsService {
  constructor(@InjectDataSource() private readonly ds: DataSource, private readonly accounting: AccountingService) {}

  private period(p: Period) {
    if (!isDate(p.from) || !isDate(p.to)) throw new BadRequestException('Dates invalides (AAAA-MM-JJ).');
    const year = new Date().getFullYear();
    return { from: p.from || `${year}-01-01`, to: p.to || `${year}-12-31` };
  }

  async journal(userId: number, f: Period & { journal?: string; limit?: number; offset?: number }) {
    const { from, to } = this.period(f);
    if (f.journal && !(f.journal in JOURNALS)) throw new BadRequestException('Journal inconnu.');
    const names = new Map((await this.accounting.chart(userId)).map((a) => [a.code, a.name]));
    const limit = Math.min(Math.max(Number(f.limit) || 200, 1), 1000);
    const offset = Math.max(Number(f.offset) || 0, 0);
    const params: any[] = [userId, from, to];
    let filter = '';
    if (f.journal) { params.push(f.journal); filter = ` AND e."journal" = $${params.length}`; }
    const [{ total }] = await this.ds.query(`SELECT COUNT(*)::int AS total FROM "journal_entries" e WHERE e."userId" = $1 AND e."date" BETWEEN $2 AND $3${filter}`, params);
    const entries = await this.ds.query(
      `SELECT e."id", e."journal", e."number", to_char(e."date",'YYYY-MM-DD') AS "date", e."label", e."refType", e."refId", e."totalDebit", e."totalCredit", e."reversedBy"
         FROM "journal_entries" e WHERE e."userId" = $1 AND e."date" BETWEEN $2 AND $3${filter}
        ORDER BY e."date", e."id" LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    const ids = entries.map((e: any) => e.id);
    const lines = ids.length ? await this.ds.query(`SELECT * FROM "journal_lines" WHERE "entryId" = ANY($1) ORDER BY "id"`, [ids]) : [];
    return {
      from, to, total,
      entries: entries.map((e: any) => ({
        ...e, totalDebit: Number(e.totalDebit), totalCredit: Number(e.totalCredit), journalName: JOURNALS[e.journal],
        lines: lines.filter((l: any) => l.entryId === e.id).map((l: any) => ({ accountCode: l.accountCode, accountName: names.get(l.accountCode) || `Compte ${l.accountCode}`, label: l.label, debit: Number(l.debit), credit: Number(l.credit) })),
      })),
    };
  }

  /** Grand livre d'un compte : solde d'ouverture, mouvements et solde progressif. */
  async ledger(userId: number, accountCode: string, p: Period) {
    const { from, to } = this.period(p);
    const chart = await this.accounting.chart(userId);
    const account = chart.find((a) => a.code === accountCode);
    if (!account) throw new BadRequestException(`Compte ${accountCode} inconnu.`);
    const [open] = await this.ds.query(
      `SELECT COALESCE(SUM(l."debit"),0) AS d, COALESCE(SUM(l."credit"),0) AS c FROM "journal_lines" l JOIN "journal_entries" e ON e."id" = l."entryId"
        WHERE l."userId" = $1 AND l."accountCode" = $2 AND e."date" < $3`,
      [userId, accountCode, from],
    );
    const rows = await this.ds.query(
      `SELECT e."number", to_char(e."date",'YYYY-MM-DD') AS "date", e."journal", e."label" AS "entryLabel", l."label", l."debit", l."credit"
         FROM "journal_lines" l JOIN "journal_entries" e ON e."id" = l."entryId"
        WHERE l."userId" = $1 AND l."accountCode" = $2 AND e."date" BETWEEN $3 AND $4 ORDER BY e."date", e."id", l."id"`,
      [userId, accountCode, from, to],
    );
    const opening = round(Number(open.d) - Number(open.c), 3);
    let running = opening;
    let totalD = 0, totalC = 0;
    const lines = rows.map((r: any) => {
      const debit = Number(r.debit), credit = Number(r.credit);
      running = round(running + debit - credit, 3);
      totalD += debit; totalC += credit;
      return { number: r.number, date: r.date, journal: r.journal, label: r.label || r.entryLabel, debit, credit, balance: running };
    });
    return { account, from, to, opening, totalDebit: round(totalD, 3), totalCredit: round(totalC, 3), closing: running, lines };
  }

  async trialBalance(userId: number, p: Period) {
    const { from, to } = this.period(p);
    const names = new Map((await this.accounting.chart(userId)).map((a) => [a.code, a]));
    const rows = await this.ds.query(
      `SELECT l."accountCode" AS code,
              COALESCE(SUM(CASE WHEN e."date" < $2 THEN l."debit" - l."credit" END),0) AS opening,
              COALESCE(SUM(CASE WHEN e."date" BETWEEN $2 AND $3 THEN l."debit" END),0) AS debit,
              COALESCE(SUM(CASE WHEN e."date" BETWEEN $2 AND $3 THEN l."credit" END),0) AS credit
         FROM "journal_lines" l JOIN "journal_entries" e ON e."id" = l."entryId"
        WHERE l."userId" = $1 AND e."date" <= $3 GROUP BY l."accountCode" ORDER BY l."accountCode"`,
      [userId, from, to],
    );
    const accounts = rows.map((r: any) => {
      const opening = Number(r.opening), debit = Number(r.debit), credit = Number(r.credit);
      const closing = round(opening + debit - credit, 3);
      return {
        code: r.code, name: names.get(r.code)?.name || `Compte ${r.code}`, type: names.get(r.code)?.type || null,
        opening: round(opening, 3), debit: round(debit, 3), credit: round(credit, 3), closing,
        closingDebit: closing > 0 ? closing : 0, closingCredit: closing < 0 ? -closing : 0,
      };
    }).filter((a: any) => a.opening !== 0 || a.debit !== 0 || a.credit !== 0);
    const sum = (k: string) => round(accounts.reduce((s: number, a: any) => s + a[k], 0), 3);
    const totals = { debit: sum('debit'), credit: sum('credit'), closingDebit: sum('closingDebit'), closingCredit: sum('closingCredit') };
    return { from, to, accounts, totals, balanced: Math.abs(totals.debit - totals.credit) < 0.0005 && Math.abs(totals.closingDebit - totals.closingCredit) < 0.0005 };
  }

  /** Compte de résultat : produits (classe 7) − charges (classe 6) sur la période. */
  async incomeStatement(userId: number, p: Period) {
    const { from, to } = this.period(p);
    const names = new Map((await this.accounting.chart(userId)).map((a) => [a.code, a.name]));
    const rows = await this.ds.query(
      `SELECT l."accountCode" AS code, COALESCE(SUM(l."debit"),0) AS debit, COALESCE(SUM(l."credit"),0) AS credit
         FROM "journal_lines" l JOIN "journal_entries" e ON e."id" = l."entryId"
        WHERE l."userId" = $1 AND e."date" BETWEEN $2 AND $3 AND (l."accountCode" LIKE '6%' OR l."accountCode" LIKE '7%')
        GROUP BY l."accountCode" ORDER BY l."accountCode"`,
      [userId, from, to],
    );
    const income = rows.filter((r: any) => r.code.startsWith('7')).map((r: any) => ({ code: r.code, name: names.get(r.code) || `Compte ${r.code}`, amount: round(Number(r.credit) - Number(r.debit), 3) }));
    const expenses = rows.filter((r: any) => r.code.startsWith('6')).map((r: any) => ({ code: r.code, name: names.get(r.code) || `Compte ${r.code}`, amount: round(Number(r.debit) - Number(r.credit), 3) }));
    const totalIncome = round(income.reduce((s: number, a: any) => s + a.amount, 0), 3);
    const totalExpenses = round(expenses.reduce((s: number, a: any) => s + a.amount, 0), 3);
    const sales = income.filter((a: any) => a.code.startsWith('70')).reduce((s: number, a: any) => s + a.amount, 0);
    const cogs = expenses.filter((a: any) => a.code === '607').reduce((s: number, a: any) => s + a.amount, 0);
    return { from, to, income, expenses, totalIncome, totalExpenses, result: round(totalIncome - totalExpenses, 3), grossMargin: round(sales - cogs, 3), grossMarginPct: sales > 0 ? round(((sales - cogs) / sales) * 100, 1) : null };
  }

  /**
   * Base de la déclaration de TVA, calculée sur les factures validées de la période (date de facture).
   * À adapter si certaines opérations sont taxables à l'encaissement : à valider avec votre expert-comptable.
   */
  async vatReport(userId: number, p: Period) {
    const { from, to } = this.period(p);
    const rows = await this.ds.query(
      `SELECT d."type", (g->>'rate')::numeric AS rate, COALESCE(SUM((g->>'baseHT')::numeric),0) AS base, COALESCE(SUM((g->>'vatAmount')::numeric),0) AS vat
         FROM "documents" d, jsonb_array_elements(d."vatBreakdown") g
        WHERE d."userId" = $1 AND d."lockedAt" IS NOT NULL AND d."status" <> 'cancelled'
          AND d."type" IN ('invoice','credit_note','supplier_invoice','supplier_credit_note') AND d."issueDate" BETWEEN $2 AND $3
        GROUP BY d."type", (g->>'rate')::numeric ORDER BY 2`,
      [userId, from, to],
    );
    const side = (plus: string, minus: string) => {
      const byRate = new Map<number, { rate: number; baseHT: number; vat: number }>();
      for (const r of rows) {
        if (r.type !== plus && r.type !== minus) continue;
        const sign = r.type === plus ? 1 : -1;
        const cur = byRate.get(Number(r.rate)) || { rate: Number(r.rate), baseHT: 0, vat: 0 };
        cur.baseHT = round(cur.baseHT + sign * Number(r.base), 3);
        cur.vat = round(cur.vat + sign * Number(r.vat), 3);
        byRate.set(cur.rate, cur);
      }
      const list = [...byRate.values()].sort((a, b) => a.rate - b.rate);
      return { byRate: list, baseHT: round(list.reduce((s, x) => s + x.baseHT, 0), 3), vat: round(list.reduce((s, x) => s + x.vat, 0), 3) };
    };
    const collected = side('invoice', 'credit_note');
    const deductible = side('supplier_invoice', 'supplier_credit_note');
    const [tax] = await this.ds.query(
      `SELECT COALESCE(SUM(CASE WHEN d."type" = 'invoice' THEN d."stampDuty" ELSE 0 END),0) AS stamp,
              COALESCE(SUM(CASE WHEN d."type" IN ('invoice','credit_note') THEN (CASE WHEN d."type" = 'credit_note' THEN -1 ELSE 1 END) * d."withholdingAmount" ELSE 0 END),0) AS suffered,
              COALESCE(SUM(CASE WHEN d."type" IN ('supplier_invoice','supplier_credit_note') THEN (CASE WHEN d."type" = 'supplier_credit_note' THEN -1 ELSE 1 END) * d."withholdingAmount" ELSE 0 END),0) AS operated
         FROM "documents" d WHERE d."userId" = $1 AND d."lockedAt" IS NOT NULL AND d."status" <> 'cancelled' AND d."issueDate" BETWEEN $2 AND $3`,
      [userId, from, to],
    );
    const net = round(collected.vat - deductible.vat, 3);
    return {
      from, to, basis: 'date de facture',
      collected, deductible,
      vatPayable: net > 0 ? net : 0,
      vatCredit: net < 0 ? -net : 0,
      stampDutyCollected: Number(tax.stamp),
      withholdingSuffered: Number(tax.suffered),
      withholdingOperated: Number(tax.operated),
    };
  }

  // ═════════════════════════════ Export Excel ═════════════════════════════

  async exportXlsx(userId: number, kind: string, q: Period & { account?: string; journal?: string }) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Inovexa ERP';
    wb.created = new Date();
    const header = (ws: ExcelJS.Worksheet) => {
      const row = ws.getRow(1);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      ws.views = [{ state: 'frozen', ySplit: 1 }];
    };
    const money = '#,##0.000;[Red]-#,##0.000';

    if (kind === 'journal') {
      const data = await this.journal(userId, { ...q, limit: 1000 });
      const ws = wb.addWorksheet('Journal');
      ws.columns = [{ header: 'Date', key: 'date', width: 12 }, { header: 'Journal', key: 'journal', width: 8 }, { header: 'N° pièce', key: 'number', width: 16 }, { header: 'Compte', key: 'code', width: 10 }, { header: 'Intitulé', key: 'name', width: 38 }, { header: 'Libellé', key: 'label', width: 44 }, { header: 'Débit', key: 'debit', width: 14 }, { header: 'Crédit', key: 'credit', width: 14 }];
      for (const e of data.entries) for (const l of e.lines) ws.addRow({ date: e.date, journal: e.journal, number: e.number, code: l.accountCode, name: l.accountName, label: l.label || e.label, debit: l.debit || null, credit: l.credit || null });
      ws.getColumn('debit').numFmt = money; ws.getColumn('credit').numFmt = money;
      header(ws);
    } else if (kind === 'ledger') {
      if (!q.account) throw new BadRequestException('Paramètre account requis.');
      const data = await this.ledger(userId, q.account, q);
      const ws = wb.addWorksheet(`Compte ${q.account}`.slice(0, 31));
      ws.columns = [{ header: 'Date', key: 'date', width: 12 }, { header: 'Journal', key: 'journal', width: 8 }, { header: 'N° pièce', key: 'number', width: 16 }, { header: 'Libellé', key: 'label', width: 50 }, { header: 'Débit', key: 'debit', width: 14 }, { header: 'Crédit', key: 'credit', width: 14 }, { header: 'Solde', key: 'balance', width: 14 }];
      ws.addRow({ label: 'Solde d’ouverture', balance: data.opening });
      for (const l of data.lines) ws.addRow(l);
      ['debit', 'credit', 'balance'].forEach((k) => (ws.getColumn(k).numFmt = money));
      header(ws);
    } else if (kind === 'trial-balance') {
      const data = await this.trialBalance(userId, q);
      const ws = wb.addWorksheet('Balance');
      ws.columns = [{ header: 'Compte', key: 'code', width: 10 }, { header: 'Intitulé', key: 'name', width: 44 }, { header: 'Ouverture', key: 'opening', width: 14 }, { header: 'Débit', key: 'debit', width: 14 }, { header: 'Crédit', key: 'credit', width: 14 }, { header: 'Solde débiteur', key: 'closingDebit', width: 16 }, { header: 'Solde créditeur', key: 'closingCredit', width: 16 }];
      for (const a of data.accounts) ws.addRow(a);
      const t = ws.addRow({ name: 'TOTAUX', debit: data.totals.debit, credit: data.totals.credit, closingDebit: data.totals.closingDebit, closingCredit: data.totals.closingCredit });
      t.font = { bold: true };
      ['opening', 'debit', 'credit', 'closingDebit', 'closingCredit'].forEach((k) => (ws.getColumn(k).numFmt = money));
      header(ws);
    } else if (kind === 'income-statement') {
      const data = await this.incomeStatement(userId, q);
      const ws = wb.addWorksheet('Résultat');
      ws.columns = [{ header: 'Compte', key: 'code', width: 10 }, { header: 'Intitulé', key: 'name', width: 50 }, { header: 'Montant', key: 'amount', width: 16 }];
      ws.addRow({ name: 'PRODUITS' }).font = { bold: true };
      data.income.forEach((a: any) => ws.addRow(a));
      ws.addRow({ name: 'Total produits', amount: data.totalIncome }).font = { bold: true };
      ws.addRow({ name: 'CHARGES' }).font = { bold: true };
      data.expenses.forEach((a: any) => ws.addRow(a));
      ws.addRow({ name: 'Total charges', amount: data.totalExpenses }).font = { bold: true };
      ws.addRow({ name: 'RÉSULTAT', amount: data.result }).font = { bold: true };
      ws.getColumn('amount').numFmt = money;
      header(ws);
    } else if (kind === 'vat') {
      const data = await this.vatReport(userId, q);
      const ws = wb.addWorksheet('TVA');
      ws.columns = [{ header: 'Nature', key: 'kind', width: 22 }, { header: 'Taux %', key: 'rate', width: 10 }, { header: 'Base HT', key: 'base', width: 16 }, { header: 'TVA', key: 'vat', width: 16 }];
      data.collected.byRate.forEach((r: any) => ws.addRow({ kind: 'TVA collectée', rate: r.rate, base: r.baseHT, vat: r.vat }));
      data.deductible.byRate.forEach((r: any) => ws.addRow({ kind: 'TVA déductible', rate: r.rate, base: r.baseHT, vat: r.vat }));
      ws.addRow({ kind: 'TVA à payer', vat: data.vatPayable }).font = { bold: true };
      ws.addRow({ kind: 'Crédit de TVA', vat: data.vatCredit }).font = { bold: true };
      ws.addRow({ kind: 'Droit de timbre facturé', vat: data.stampDutyCollected });
      ws.addRow({ kind: 'Retenues subies', vat: data.withholdingSuffered });
      ws.addRow({ kind: 'Retenues opérées', vat: data.withholdingOperated });
      ['base', 'vat'].forEach((k) => (ws.getColumn(k).numFmt = money));
      header(ws);
    } else {
      throw new BadRequestException('Export inconnu (journal, ledger, trial-balance, income-statement, vat).');
    }
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    return { buffer, filename: `${kind}-${q.from || 'annee'}.xlsx` };
  }
}
