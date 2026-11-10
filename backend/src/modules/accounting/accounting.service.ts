import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull } from 'typeorm';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { BankStatementLine } from './entities/bank-statement-line.entity';
import { BASE_ACCOUNTS, DEFAULT_ACCOUNT_MAP, JOURNALS, AccountType } from './chart';
import { Company } from '../company/company.entity';
import { CompanyService } from '../company/company.service';
import { SequenceService } from '../../common/sequences/sequence.service';
import { Document } from '../documents/entities/document.entity';
import { DocumentLine } from '../documents/entities/document-line.entity';
import { Payment } from '../documents/entities/payment.entity';
import { DOC_META } from '../documents/documents.types';
import { Product } from '../products/product.entity';
import { BankAccount } from '../finance/entities/bank-account.entity';
import { round, toMillimes, fromMillimes } from '../../common/money';

export interface PostLine {
  accountCode: string;
  debit?: number;
  credit?: number;
  label?: string | null;
  partyType?: string | null;
  partyId?: number | null;
}

export interface EntryInput {
  journal: string;
  date: string;
  label: string;
  refType: string | null;
  refId: number | null;
  lines: PostLine[];
  actorId: number | null;
}

@Injectable()
export class AccountingService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly company: CompanyService,
    private readonly sequences: SequenceService,
  ) {}

  // ═════════════════════════════ Plan comptable ═════════════════════════════

  accountMap(company: Company): Record<string, string> {
    return { ...DEFAULT_ACCOUNT_MAP, ...(company.accountMap || {}) };
  }

  async chart(userId: number, em?: EntityManager) {
    const custom = await (em || this.ds).getRepository(Account).find({ where: { userId }, order: { code: 'ASC' } });
    const map = new Map<string, { code: string; name: string; type: AccountType; custom: boolean; active: boolean; id?: number }>();
    for (const a of BASE_ACCOUNTS) map.set(a.code, { ...a, custom: false, active: true });
    for (const a of custom) map.set(a.code, { code: a.code, name: a.name, type: a.type as AccountType, custom: true, active: a.active, id: a.id });
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
  }

  async accountsConfig(userId: number) {
    const company = await this.company.getOrCreate(userId);
    return { map: this.accountMap(company), defaults: DEFAULT_ACCOUNT_MAP };
  }

  async addAccount(userId: number, dto: { code: string; name: string; type: AccountType }) {
    const code = String(dto.code || '').trim();
    if (!/^[0-9]{2,12}$/.test(code)) throw new BadRequestException('Le numéro de compte doit comporter 2 à 12 chiffres.');
    if (!['asset', 'liability', 'equity', 'income', 'expense'].includes(dto.type)) throw new BadRequestException('Type de compte invalide.');
    if (!dto.name?.trim()) throw new BadRequestException('Libellé du compte requis.');
    if (BASE_ACCOUNTS.some((a) => a.code === code)) throw new ConflictException('Ce numéro existe déjà dans le plan de base.');
    const repo = this.ds.getRepository(Account);
    if (await repo.findOne({ where: { userId, code } })) throw new ConflictException('Ce numéro de compte existe déjà.');
    return repo.save(repo.create({ userId, code, name: dto.name.trim().slice(0, 160), type: dto.type, active: true }));
  }

  async updateAccount(userId: number, id: number, dto: { name?: string; active?: boolean }) {
    const repo = this.ds.getRepository(Account);
    const acc = await repo.findOne({ where: { id, userId } });
    if (!acc) throw new NotFoundException('Compte personnalisé introuvable');
    if (dto.name !== undefined) acc.name = dto.name.trim().slice(0, 160);
    if (dto.active !== undefined) acc.active = dto.active;
    return repo.save(acc);
  }

  // ═════════════════════════════ Écritures ═════════════════════════════

  /**
   * Crée une écriture ÉQUILIBRÉE. Un déséquilibre est une erreur de programmation (jamais une saisie) :
   * il interrompt la transaction appelante pour qu'aucune pièce ne parte sans sa contrepartie comptable.
   */
  async postEntry(em: EntityManager, userId: number, e: EntryInput): Promise<JournalEntry | null> {
    const lines = e.lines
      .map((l) => {
        let debit = round(l.debit || 0, 3);
        let credit = round(l.credit || 0, 3);
        if (debit < 0) { credit += -debit; debit = 0; }
        if (credit < 0) { debit += -credit; credit = 0; }
        return { ...l, debit, credit };
      })
      .filter((l) => toMillimes(l.debit) !== 0 || toMillimes(l.credit) !== 0);
    const totalD = lines.reduce((s, l) => s + toMillimes(l.debit), 0);
    const totalC = lines.reduce((s, l) => s + toMillimes(l.credit), 0);
    if (totalD !== totalC) throw new InternalServerErrorException(`Écriture déséquilibrée (${e.label}) : débit ${fromMillimes(totalD)} ≠ crédit ${fromMillimes(totalC)}.`);
    if (totalD === 0) return null;

    const year = Number(e.date.slice(0, 4));
    const n = await this.sequences.next(em, userId, `journal_${e.journal}`, year);
    const entry = await em.getRepository(JournalEntry).save(
      em.getRepository(JournalEntry).create({
        userId, journal: e.journal, number: this.sequences.format(e.journal, year, n, 6), date: e.date,
        label: e.label.slice(0, 300), refType: e.refType, refId: e.refId,
        totalDebit: fromMillimes(totalD), totalCredit: fromMillimes(totalC), reversedBy: null, createdBy: e.actorId,
      }),
    );
    await em.getRepository(JournalLine).save(
      lines.map((l) =>
        em.getRepository(JournalLine).create({
          entryId: entry.id, userId, accountCode: l.accountCode, label: l.label ? l.label.slice(0, 300) : null,
          debit: l.debit, credit: l.credit, partyType: l.partyType ?? null, partyId: l.partyId ?? null,
        }),
      ),
    );
    return entry;
  }

  /** Écriture d'une facture / d'un avoir (client ou fournisseur). Idempotent : une pièce n'est comptabilisée qu'une fois. */
  async postDocument(em: EntityManager, userId: number, actorId: number | null, doc: Document, lines: DocumentLine[]) {
    const meta = DOC_META[doc.type];
    if (!meta.settles) return null;
    const exists = await em.getRepository(JournalEntry).findOne({ where: { userId, refType: 'document', refId: doc.id } });
    if (exists) return exists;

    const company = await this.company.getOrCreate(userId, em);
    const map = this.accountMap(company);
    const client = meta.party === 'client';
    const credit = meta.isCredit;
    const party = { partyType: meta.party, partyId: doc.partyId };

    const productIds = [...new Set(lines.map((l) => l.productId).filter((v): v is number => !!v))];
    const products = productIds.length ? await em.getRepository(Product).find({ where: { userId, id: In(productIds) } }) : [];
    const stockable = new Set(products.filter((p) => p.isStockable !== false).map((p) => p.id));

    // Une facture client DÉBITE le client ; un avoir fait l'inverse. On écrit toujours « dans le sens de la facture » puis on retourne.
    const out: PostLine[] = [];
    const add = (accountCode: string, amount: number, side: 'D' | 'C', label?: string, p?: typeof party) => {
      if (toMillimes(amount) === 0) return;
      const effective = credit ? (side === 'D' ? 'C' : 'D') : side;
      out.push({ accountCode, debit: effective === 'D' ? amount : 0, credit: effective === 'C' ? amount : 0, label, ...(p || {}) });
    };

    if (client) {
      add(map.receivable, doc.netToPay, 'D', doc.number || undefined, party);
      add(map.withholdingReceivable, doc.withholdingAmount, 'D', 'Retenue à la source subie');
      const goods = lines.filter((l) => l.productId && stockable.has(l.productId)).reduce((s, l) => s + toMillimes(l.netHT), 0);
      const services = toMillimes(doc.totalHT) - goods;
      add(map.sales, fromMillimes(goods), 'C', 'Ventes de marchandises');
      add(map.salesServices, fromMillimes(services), 'C', 'Prestations de services');
      add(map.vatCollected, doc.totalVat, 'C', 'TVA collectée');
      add(map.stampPayable, doc.stampDuty, 'C', 'Droit de timbre');
      // Coût des ventes (inventaire permanent) : seulement pour les lignes réellement sorties / rentrées en stock
      const cost = lines
        .filter((l) => l.productId && stockable.has(l.productId) && l.unitCost !== null && (!credit || l.returnToStock))
        .reduce((s, l) => s + toMillimes(l.unitCost! * l.quantity), 0);
      add(map.cogs, fromMillimes(cost), 'D', 'Coût des marchandises vendues');
      add(map.stock, fromMillimes(cost), 'C', 'Sortie de stock');
    } else {
      const goods = lines.filter((l) => l.productId && stockable.has(l.productId)).reduce((s, l) => s + toMillimes(l.netHT), 0);
      const other = toMillimes(doc.totalHT) - goods;
      add(map.stock, fromMillimes(goods), 'D', 'Achats de marchandises');
      add(map.purchasesExpense, fromMillimes(other), 'D', 'Achats non stockés');
      add(map.vatDeductible, doc.totalVat, 'D', 'TVA déductible');
      add(map.stampExpense, doc.stampDuty, 'D', 'Droit de timbre');
      add(map.payable, doc.netToPay, 'C', doc.number || undefined, party);
      add(map.withholdingPayable, doc.withholdingAmount, 'C', 'Retenue à la source opérée');
    }

    return this.postEntry(em, userId, {
      journal: client ? 'VT' : 'AC', date: doc.issueDate,
      label: `${meta.label} ${doc.number} — ${doc.partyName}`,
      refType: 'document', refId: doc.id, lines: out, actorId,
    });
  }

  /** Écriture d'un règlement. Une imputation d'avoir (méthode credit_note) est un lettrage : aucune écriture. */
  async postPayment(em: EntityManager, userId: number, actorId: number | null, payment: Payment, doc: Document) {
    if (payment.method === 'credit_note') return null;
    const exists = await em.getRepository(JournalEntry).findOne({ where: { userId, refType: 'payment', refId: payment.id } });
    if (exists) return exists;
    const company = await this.company.getOrCreate(userId, em);
    const map = this.accountMap(company);
    const meta = DOC_META[doc.type];
    const cash = payment.method === 'cash';
    const treasury = cash ? map.cash : map.bank;
    const control = meta.party === 'client' ? map.receivable : map.payable;
    // Encaissement d'une facture client / décaissement d'une facture fournisseur ; l'inverse pour un avoir (remboursement)
    const treasuryIsDebit = (meta.party === 'client') !== meta.isCredit;
    const party = { partyType: meta.party, partyId: doc.partyId };
    const lines: PostLine[] = treasuryIsDebit
      ? [{ accountCode: treasury, debit: payment.amount, label: payment.number }, { accountCode: control, credit: payment.amount, label: doc.number, ...party }]
      : [{ accountCode: control, debit: payment.amount, label: doc.number, ...party }, { accountCode: treasury, credit: payment.amount, label: payment.number }];
    return this.postEntry(em, userId, {
      journal: cash ? 'CA' : 'BQ', date: payment.date,
      label: `Règlement ${payment.number || ''} — ${doc.number} — ${doc.partyName}`.replace(/\s+/g, ' '),
      refType: 'payment', refId: payment.id, lines, actorId,
    });
  }

  // ═══════════════════ Caisse (clôture Z), dépenses du module Finances ═══════════════════

  /**
   * Écriture de caisse d'une session clôturée (rapport Z). Les prix de caisse sont des montants encaissés (TTC) :
   * la TVA est extraite au taux de chaque produit. Débit caisse / banque par moyen de paiement ; crédit ventes HT
   * (marchandises ou services) et TVA collectée par taux ; sortie de stock au coût moyen ; achats réglés en caisse
   * (stock ou charges, TVA déductible). Idempotent : une session n'est comptabilisée qu'une fois.
   */
  async postCashSession(em: EntityManager, userId: number, actorId: number | null, sessionId: number, label: string, date: string) {
    const existing = await em.getRepository(JournalEntry).findOne({ where: { userId, refType: 'cash_session', refId: sessionId } });
    if (existing) return existing;
    const company = await this.company.getOrCreate(userId, em);
    const map = this.accountMap(company);
    const bankMethods = new Set(['card', 'transfer', 'check', 'draft', 'mobile']);
    const groups = async (table: 'sales' | 'purchases') =>
      (await em.query(
        `SELECT COALESCE(t."paymentMethod",'cash') AS method, COALESCE(p."vatRate", $3)::float AS rate, COALESCE(p."isStockable", true) AS stockable,
                COALESCE(SUM(t."total"),0)::float AS total
           FROM "${table}" t LEFT JOIN "products" p ON p."id" = t."productId"
          WHERE t."userId" = $1 AND t."posSessionId" = $2 GROUP BY 1, 2, 3`,
        [userId, sessionId, Number(company.defaultVatRate) || 0],
      )) as Array<{ method: string; rate: number; stockable: boolean; total: number }>;
    const [sales, purchases] = await Promise.all([groups('sales'), groups('purchases')]);
    const [cogs] = await em.query(
      `SELECT COALESCE(SUM(ABS(m."quantity") * m."unitCost"),0)::float AS cost FROM "stock_movements" m
        WHERE m."userId" = $1 AND m."refType" = 'pos_sale' AND m."refId" IN (SELECT s."id"::text FROM "sales" s WHERE s."userId" = $1 AND s."posSessionId" = $2)`,
      [userId, sessionId],
    );
    const lines: PostLine[] = [];
    const split = (total: number, rate: number) => {
      const ht = round(total / (1 + rate / 100), 3);
      return { ht, vat: round(total - ht, 3) };
    };
    let cashIn = 0, bankIn = 0, cashOut = 0, bankOut = 0;
    for (const g of sales) {
      if (bankMethods.has(g.method)) bankIn += g.total; else cashIn += g.total;
      const { ht, vat } = split(g.total, g.rate);
      lines.push({ accountCode: g.stockable ? map.sales : map.salesServices, credit: ht, label: `Ventes caisse HT (TVA ${g.rate} %)` });
      lines.push({ accountCode: map.vatCollected, credit: vat, label: `TVA collectée ${g.rate} %` });
    }
    for (const g of purchases) {
      if (bankMethods.has(g.method)) bankOut += g.total; else cashOut += g.total;
      const { ht, vat } = split(g.total, g.rate);
      lines.push({ accountCode: g.stockable ? map.stock : map.purchasesExpense, debit: ht, label: `Achats caisse HT (TVA ${g.rate} %)` });
      lines.push({ accountCode: map.vatDeductible, debit: vat, label: `TVA déductible ${g.rate} %` });
    }
    if (cashIn) lines.push({ accountCode: map.cash, debit: round(cashIn, 3), label: 'Encaissements espèces' });
    if (bankIn) lines.push({ accountCode: map.bank, debit: round(bankIn, 3), label: 'Encaissements carte / virement / chèque' });
    if (cashOut) lines.push({ accountCode: map.cash, credit: round(cashOut, 3), label: 'Décaissements espèces' });
    if (bankOut) lines.push({ accountCode: map.bank, credit: round(bankOut, 3), label: 'Décaissements carte / virement / chèque' });
    const cost = round(Number(cogs?.cost) || 0, 3);
    if (cost > 0) {
      lines.push({ accountCode: map.cogs, debit: cost, label: 'Coût des marchandises vendues en caisse' });
      lines.push({ accountCode: map.stock, credit: cost, label: 'Sortie de stock (caisse)' });
    }
    return this.postEntry(em, userId, { journal: 'CA', date, label, refType: 'cash_session', refId: sessionId, actorId, lines });
  }

  /** Écriture d'une dépense saisie dans Finances : charge HT + TVA déductible, réglée par caisse ou banque. */
  async postExpense(em: EntityManager, userId: number, actorId: number | null, expense: { id: number; amount: number; amountHT?: number | null; taxAmount?: number | null; category?: string | null; description?: string | null; date: Date | string; paymentMethod?: string | null; vendor?: string | null }) {
    const existing = await em.getRepository(JournalEntry).findOne({ where: { userId, refType: 'expense', refId: expense.id } });
    if (existing) return existing;
    const company = await this.company.getOrCreate(userId, em);
    const map = this.accountMap(company);
    const total = round(Number(expense.amount) || 0, 3);
    if (total <= 0) return null;
    let vat = round(Number(expense.taxAmount) || 0, 3);
    if (vat < 0 || vat > total) vat = 0;
    const ht = round(total - vat, 3);
    const category = String(expense.category || '').trim();
    const account = (company.accountMap || {})[`expense:${category.toLowerCase()}`] || map.purchasesExpense;
    const bankMethods = new Set(['card', 'transfer', 'check', 'draft', 'mobile', 'bank', 'virement', 'carte', 'cheque', 'chèque']);
    const paidBy = bankMethods.has(String(expense.paymentMethod || '').toLowerCase()) ? map.bank : map.cash;
    const d = expense.date instanceof Date ? expense.date : new Date(expense.date);
    const date = Number.isNaN(d.getTime()) ? today() : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return this.postEntry(em, userId, {
      journal: paidBy === map.bank ? 'BQ' : 'CA', date,
      label: `Dépense${category ? ' ' + category : ''}${expense.vendor ? ' — ' + expense.vendor : ''}${expense.description ? ' — ' + expense.description : ''}`,
      refType: 'expense', refId: expense.id, actorId,
      lines: [
        { accountCode: account, debit: ht, label: category || 'Dépense' },
        { accountCode: map.vatDeductible, debit: vat, label: 'TVA déductible' },
        { accountCode: paidBy, credit: total, label: paidBy === map.bank ? 'Règlement banque' : 'Règlement espèces' },
      ],
    });
  }

  /** Contre-passe l'écriture liée à une pièce supprimée (dépense…) ; l'écriture d'origine est conservée. */
  async reverseByRef(em: EntityManager, userId: number, actorId: number | null, refType: string, refId: number, label: string) {
    const original = await em.getRepository(JournalEntry).findOne({ where: { userId, refType, refId } });
    if (!original || original.reversedBy) return null;
    return this.reverseInTx(em, userId, actorId, original, today(), label);
  }

  /** Contre-passe l'écriture d'un règlement annulé (l'écriture d'origine n'est jamais effacée). */
  async reversePayment(em: EntityManager, userId: number, actorId: number | null, payment: Payment, reason: string) {
    const original = await em.getRepository(JournalEntry).findOne({ where: { userId, refType: 'payment', refId: payment.id } });
    if (!original || original.reversedBy) return null;
    return this.reverseInTx(em, userId, actorId, original, today(), `Annulation du règlement ${payment.number || payment.id} — ${reason}`);
  }

  private async reverseInTx(em: EntityManager, userId: number, actorId: number | null, original: JournalEntry, date: string, label: string) {
    const lines = await em.getRepository(JournalLine).find({ where: { entryId: original.id } });
    const reversal = await this.postEntry(em, userId, {
      journal: original.journal, date, label, refType: 'reversal', refId: original.id, actorId,
      lines: lines.map((l) => ({ accountCode: l.accountCode, debit: l.credit, credit: l.debit, label: l.label, partyType: l.partyType, partyId: l.partyId })),
    });
    if (reversal) {
      original.reversedBy = reversal.id;
      await em.getRepository(JournalEntry).save(original);
    }
    return reversal;
  }

  // ═════════════════════════════ Écritures manuelles ═════════════════════════════

  async createManual(userId: number, actorId: number, dto: { date: string; label: string; journal?: string; lines: PostLine[] }) {
    const journal = dto.journal || 'OD';
    if (!(journal in JOURNALS)) throw new BadRequestException(`Journal inconnu (${Object.keys(JOURNALS).join(', ')}).`);
    if (!dto.label?.trim()) throw new BadRequestException('Libellé requis.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.date || '')) throw new BadRequestException('Date invalide (AAAA-MM-JJ).');
    if (!Array.isArray(dto.lines) || dto.lines.length < 2) throw new BadRequestException('Une écriture comporte au moins deux lignes.');
    const chart = new Set((await this.chart(userId)).filter((a) => a.active).map((a) => a.code));
    for (const l of dto.lines) {
      if (!chart.has(String(l.accountCode))) throw new BadRequestException(`Compte ${l.accountCode} inconnu : ajoutez-le au plan comptable.`);
      const d = Number(l.debit || 0), c = Number(l.credit || 0);
      if (!(d >= 0 && c >= 0) || (d > 0) === (c > 0)) throw new BadRequestException('Chaque ligne porte soit un débit, soit un crédit (montants positifs).');
    }
    const totalD = dto.lines.reduce((s, l) => s + toMillimes(Number(l.debit || 0)), 0);
    const totalC = dto.lines.reduce((s, l) => s + toMillimes(Number(l.credit || 0)), 0);
    if (totalD !== totalC) throw new BadRequestException(`Écriture déséquilibrée : débit ${fromMillimes(totalD)}, crédit ${fromMillimes(totalC)}.`);
    const entry = await this.ds.transaction((em) =>
      this.postEntry(em, userId, {
        journal, date: dto.date, label: dto.label, refType: 'manual', refId: null, actorId,
        lines: dto.lines.map((l) => ({ ...l, accountCode: String(l.accountCode), debit: Number(l.debit || 0), credit: Number(l.credit || 0) })),
      }),
    );
    if (!entry) throw new BadRequestException('Écriture vide.');
    return this.getEntry(userId, entry.id);
  }

  async reverseEntry(userId: number, actorId: number, id: number, date?: string) {
    return this.ds.transaction(async (em) => {
      const original = await em.getRepository(JournalEntry).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!original) throw new NotFoundException('Écriture introuvable');
      if (original.reversedBy) throw new ConflictException('Cette écriture est déjà contre-passée.');
      if (original.refType === 'reversal') throw new BadRequestException('Une contre-passation ne peut pas être contre-passée.');
      if (original.refType === 'document') throw new BadRequestException('L’écriture d’une facture se corrige par un avoir, pas par contre-passation.');
      if (original.refType === 'payment') throw new BadRequestException('Annulez le règlement depuis la facture : l’écriture sera contre-passée automatiquement.');
      const reversal = await this.reverseInTx(em, userId, actorId, original, date || today(), `Contre-passation de ${original.number} — ${original.label}`);
      return { reversed: original.number, reversal: reversal ? reversal.number : null, id: reversal?.id };
    });
  }

  async getEntry(userId: number, id: number) {
    const entry = await this.ds.getRepository(JournalEntry).findOne({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Écriture introuvable');
    const lines = await this.ds.getRepository(JournalLine).find({ where: { entryId: id }, order: { id: 'ASC' } });
    const names = new Map((await this.chart(userId)).map((a) => [a.code, a.name]));
    return { ...entry, lines: lines.map((l) => ({ ...l, accountName: names.get(l.accountCode) || `Compte ${l.accountCode}` })) };
  }

  // ═════════════════════════════ Rapprochement bancaire ═════════════════════════════

  /** Signe d'un règlement vu de la banque : + encaissement, − décaissement. */
  private static bankSign(partyType: string, docIsCredit: boolean) {
    return (partyType === 'client') !== docIsCredit ? 1 : -1;
  }

  async importStatement(userId: number, bankAccountId: number, input: { csv?: string; rows?: Array<{ date: string; label: string; amount: number; reference?: string }> }) {
    const bank = await this.ds.getRepository(BankAccount).findOne({ where: { id: bankAccountId, userId } });
    if (!bank) throw new NotFoundException('Compte bancaire introuvable');
    const rows = input.rows?.length ? input.rows : this.parseCsv(input.csv || '');
    if (!rows.length) throw new BadRequestException('Aucune ligne à importer.');
    if (rows.length > 5000) throw new BadRequestException('Import limité à 5 000 lignes par fichier.');
    const batch = `B${Date.now().toString(36)}`;
    let imported = 0, duplicates = 0;
    await this.ds.transaction(async (em) => {
      const repo = em.getRepository(BankStatementLine);
      for (const r of rows) {
        const date = this.normalizeDate(r.date);
        const amount = round(Number(r.amount), 3);
        if (!date || !Number.isFinite(amount) || amount === 0) throw new BadRequestException(`Ligne invalide : ${JSON.stringify(r).slice(0, 120)}`);
        const label = String(r.label || '').trim().slice(0, 300) || 'Opération bancaire';
        const dup = await repo.findOne({ where: { userId, bankAccountId, date, amount, label, reference: r.reference ? String(r.reference).slice(0, 80) : IsNull() } });
        if (dup) { duplicates++; continue; }
        await repo.save(repo.create({ userId, bankAccountId, date, label, amount, reference: r.reference ? String(r.reference).slice(0, 80) : null, status: 'unmatched', matchedPaymentId: null, importBatch: batch }));
        imported++;
      }
    });
    return { imported, duplicates, batch };
  }

  private normalizeDate(v: string): string | null {
    const s = String(v || '').trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return null;
  }

  /** CSV « date;libellé;montant[;référence] » (séparateur ; , ou tabulation). Décimale virgule acceptée. */
  private parseCsv(text: string) {
    const out: Array<{ date: string; label: string; amount: number; reference?: string }> = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const sep = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
      const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;
      const date = this.normalizeDate(cols[0]);
      if (!date) continue; // en-tête ou ligne non datée
      const amount = Number(cols[2].replace(/\s/g, '').replace(',', '.'));
      if (!Number.isFinite(amount)) continue;
      out.push({ date, label: cols[1], amount, reference: cols[3] || undefined });
    }
    return out;
  }

  async statementLines(userId: number, f: { bankAccountId?: number; status?: string; from?: string; to?: string; limit?: number }) {
    const qb = this.ds.getRepository(BankStatementLine).createQueryBuilder('l').where('l.userId = :userId', { userId });
    if (f.bankAccountId) qb.andWhere('l.bankAccountId = :b', { b: f.bankAccountId });
    if (f.status) qb.andWhere('l.status = :s', { s: f.status });
    if (f.from) qb.andWhere('l.date >= :from', { from: f.from });
    if (f.to) qb.andWhere('l.date <= :to', { to: f.to });
    const lines = await qb.orderBy('l.date', 'DESC').addOrderBy('l.id', 'DESC').take(Math.min(f.limit || 500, 2000)).getMany();
    const summary = await this.ds.query(
      `SELECT "status", COUNT(*)::int AS count, COALESCE(SUM("amount"),0) AS total FROM "bank_statement_lines" WHERE "userId" = $1 ${f.bankAccountId ? 'AND "bankAccountId" = $2' : ''} GROUP BY "status"`,
      f.bankAccountId ? [userId, f.bankAccountId] : [userId],
    );
    return { lines, summary: summary.map((r: any) => ({ status: r.status, count: r.count, total: Number(r.total) })) };
  }

  /** Règlements enregistrés qui pourraient correspondre à une ligne de relevé (même montant, dates proches). */
  async suggestions(userId: number, lineId: number, em?: EntityManager) {
    const line = await (em || this.ds).getRepository(BankStatementLine).findOne({ where: { id: lineId, userId } });
    if (!line) throw new NotFoundException('Ligne de relevé introuvable');
    const rows = await (em || this.ds).query(
      `SELECT p."id", p."number", p."amount", p."method", to_char(p."date",'YYYY-MM-DD') AS "date", p."reference", p."partyType",
              d."number" AS "documentNumber", d."partyName", d."type" AS "documentType"
         FROM "payments" p JOIN "documents" d ON d."id" = p."documentId"
        WHERE p."userId" = $1 AND p."voidedAt" IS NULL AND p."method" NOT IN ('cash','credit_note')
          AND (p."bankAccountId" IS NULL OR p."bankAccountId" = $2)
          AND ABS(p."amount" - $3) < 0.0005
          AND p."date" BETWEEN ($4::date - 10) AND ($4::date + 10)
          AND NOT EXISTS (SELECT 1 FROM "bank_statement_lines" b WHERE b."matchedPaymentId" = p."id")
        ORDER BY ABS(p."date" - $4::date), p."id"`,
      [userId, line.bankAccountId, Math.abs(line.amount), line.date],
    );
    const wantedSign = line.amount > 0 ? 1 : -1;
    return rows
      .filter((r: any) => AccountingService.bankSign(r.partyType, DOC_META[r.documentType as keyof typeof DOC_META]?.isCredit) === wantedSign)
      .map((r: any) => ({ ...r, amount: Number(r.amount) }));
  }

  async match(userId: number, lineId: number, paymentId: number) {
    return this.ds.transaction(async (em) => {
      const line = await em.getRepository(BankStatementLine).findOne({ where: { id: lineId, userId }, lock: { mode: 'pessimistic_write' } });
      if (!line) throw new NotFoundException('Ligne de relevé introuvable');
      if (line.status === 'matched') throw new ConflictException('Ligne déjà rapprochée.');
      const payment = await em.getRepository(Payment).findOne({ where: { id: paymentId, userId } });
      if (!payment || payment.voidedAt) throw new NotFoundException('Règlement introuvable ou annulé');
      const taken = await em.getRepository(BankStatementLine).findOne({ where: { matchedPaymentId: paymentId } });
      if (taken) throw new ConflictException('Ce règlement est déjà rapproché d’une autre ligne.');
      if (Math.abs(Math.abs(line.amount) - payment.amount) > 0.0005) throw new BadRequestException('Les montants ne correspondent pas.');
      line.status = 'matched';
      line.matchedPaymentId = paymentId;
      await em.getRepository(BankStatementLine).save(line);
      if (!payment.bankAccountId) await em.getRepository(Payment).update(payment.id, { bankAccountId: line.bankAccountId });
      return line;
    });
  }

  async unmatch(userId: number, lineId: number) {
    const repo = this.ds.getRepository(BankStatementLine);
    const line = await repo.findOne({ where: { id: lineId, userId } });
    if (!line) throw new NotFoundException('Ligne de relevé introuvable');
    line.status = 'unmatched';
    line.matchedPaymentId = null;
    return repo.save(line);
  }

  async ignore(userId: number, lineId: number, ignored = true) {
    const repo = this.ds.getRepository(BankStatementLine);
    const line = await repo.findOne({ where: { id: lineId, userId } });
    if (!line) throw new NotFoundException('Ligne de relevé introuvable');
    if (line.status === 'matched') throw new BadRequestException('Dé-rapprochez la ligne avant de l’ignorer.');
    line.status = ignored ? 'ignored' : 'unmatched';
    return repo.save(line);
  }

  /** Rapproche automatiquement les lignes qui n'ont qu'UN candidat possible. */
  async autoMatch(userId: number, bankAccountId: number) {
    const lines = await this.ds.getRepository(BankStatementLine).find({ where: { userId, bankAccountId, status: 'unmatched' }, order: { date: 'ASC' } });
    let matched = 0;
    for (const l of lines) {
      const candidates = await this.suggestions(userId, l.id);
      if (candidates.length === 1) {
        try { await this.match(userId, l.id, candidates[0].id); matched++; } catch { /* pris entre-temps */ }
      }
    }
    return { examined: lines.length, matched, remaining: lines.length - matched };
  }
}

const today = () => new Date().toISOString().slice(0, 10);
