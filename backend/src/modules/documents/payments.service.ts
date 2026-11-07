import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Document } from './entities/document.entity';
import { Payment } from './entities/payment.entity';
import { DocumentInstallment } from './entities/document-installment.entity';
import { DOC_META } from './documents.types';
import { ApplyCreditDto, PaymentDto, RemindDto } from './documents.dto';
import { Actor } from './documents.service';
import { LegacyMirrorService } from './legacy-mirror.service';
import { AccountingService } from '../accounting/accounting.service';
import { CompanyService } from '../company/company.service';
import { SequenceService } from '../../common/sequences/sequence.service';
import { MailService } from '../../common/mail/mail.service';
import { Interaction } from '../crm/entities/interaction.entity';
import { BankAccount } from '../finance/entities/bank-account.entity';
import { BankStatementLine } from '../accounting/entities/bank-statement-line.entity';
import { round } from '../../common/money';

const EPS = 0.0005;
const today = () => new Date().toISOString().slice(0, 10);
const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

@Injectable()
export class PaymentsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly company: CompanyService,
    private readonly sequences: SequenceService,
    private readonly accounting: AccountingService,
    private readonly mirror: LegacyMirrorService,
    private readonly mail: MailService,
  ) {}

  // ═════════════════════════════ Règlements ═════════════════════════════

  async addPayment(actor: Actor, documentId: number, dto: PaymentDto) {
    if (dto.method === 'credit_note') throw new BadRequestException('Pour imputer un avoir, utilisez « Imputer un avoir ».');
    return this.ds.transaction(async (em) => {
      const doc = await em.getRepository(Document).findOne({ where: { id: documentId, userId: actor.userId }, lock: { mode: 'pessimistic_write' } });
      if (!doc) throw new NotFoundException('Document introuvable');
      const meta = DOC_META[doc.type];
      if (!meta.settles || !doc.lockedAt || doc.status === 'cancelled') throw new BadRequestException('Seule une facture ou un avoir validé peut recevoir un règlement.');
      const amount = round(dto.amount, 3);
      if (amount - doc.balanceDue > EPS) throw new BadRequestException(`Le règlement (${amount}) dépasse le solde restant dû (${doc.balanceDue}).`);
      const date = (dto.date || today()).slice(0, 10);
      if (date > today()) throw new BadRequestException('La date d’un règlement ne peut pas être dans le futur.');
      if (date < String(doc.issueDate).slice(0, 10)) throw new BadRequestException(`La date du règlement précède celle de la pièce (${doc.issueDate}).`);
      if (dto.bankAccountId) {
        const bank = await em.getRepository(BankAccount).findOne({ where: { id: dto.bankAccountId, userId: actor.userId } });
        if (!bank) throw new BadRequestException('Compte bancaire introuvable.');
      }
      const company = await this.company.getOrCreate(actor.userId, em);
      const year = Number(date.slice(0, 4));
      const n = await this.sequences.next(em, actor.userId, 'payment', year);
      const payment = await em.getRepository(Payment).save(
        em.getRepository(Payment).create({
          userId: actor.userId, documentId, number: this.sequences.format(this.company.prefixFor(company, 'payment'), year, n),
          partyType: meta.party, amount, method: dto.method, date, reference: dto.reference || null,
          bankAccountId: dto.bankAccountId || null, creditNoteId: null, notes: dto.notes || null, createdBy: actor.actorId,
        }),
      );
      await this.recompute(em, doc.id, dto.method);
      await this.accounting.postPayment(em, actor.userId, actor.actorId, payment, doc);
      const fresh = (await em.getRepository(Document).findOne({ where: { id: doc.id } }))!;
      return { payment, document: this.summary(fresh) };
    });
  }

  async voidPayment(actor: Actor, paymentId: number, reason: string) {
    return this.ds.transaction(async (em) => {
      const payment = await em.getRepository(Payment).findOne({ where: { id: paymentId, userId: actor.userId }, lock: { mode: 'pessimistic_write' } });
      if (!payment) throw new NotFoundException('Règlement introuvable');
      if (payment.voidedAt) throw new ConflictException('Règlement déjà annulé.');
      if (!reason?.trim()) throw new BadRequestException('Précisez le motif de l’annulation.');
      const matched = await em.getRepository(BankStatementLine).findOne({ where: { matchedPaymentId: payment.id } });
      if (matched) throw new BadRequestException('Ce règlement est rapproché d’une ligne de relevé bancaire : dé-rapprochez-le d’abord.');
      const docIds = [payment.documentId, payment.creditNoteId].filter((v): v is number => !!v).sort((a, b) => a - b);
      for (const id of docIds) await em.getRepository(Document).findOne({ where: { id, userId: actor.userId }, lock: { mode: 'pessimistic_write' } });
      payment.voidedAt = new Date();
      payment.voidReason = reason.trim().slice(0, 300);
      await em.getRepository(Payment).save(payment);
      const doc = (await em.getRepository(Document).findOne({ where: { id: payment.documentId } }))!;
      await this.recompute(em, payment.documentId, null);
      if (payment.creditNoteId) await this.recompute(em, payment.creditNoteId, null);
      await this.accounting.reversePayment(em, actor.userId, actor.actorId, payment, payment.voidReason);
      const fresh = (await em.getRepository(Document).findOne({ where: { id: doc.id } }))!;
      return { payment, document: this.summary(fresh) };
    });
  }

  /** Impute (tout ou partie d')un avoir sur une facture du même tiers : simple lettrage, sans mouvement de trésorerie. */
  async applyCreditNote(actor: Actor, creditId: number, dto: ApplyCreditDto) {
    return this.ds.transaction(async (em) => {
      const [first, second] = [creditId, dto.invoiceId].sort((a, b) => a - b);
      const locked = new Map<number, Document>();
      for (const id of [first, second]) {
        const d = await em.getRepository(Document).findOne({ where: { id, userId: actor.userId }, lock: { mode: 'pessimistic_write' } });
        if (!d) throw new NotFoundException('Document introuvable');
        locked.set(id, d);
      }
      const credit = locked.get(creditId)!;
      const invoice = locked.get(dto.invoiceId)!;
      if (!DOC_META[credit.type].isCredit || !credit.lockedAt) throw new BadRequestException('Le premier document doit être un avoir validé.');
      if (!DOC_META[invoice.type].settles || DOC_META[invoice.type].isCredit || !invoice.lockedAt) throw new BadRequestException('L’avoir s’impute sur une facture validée.');
      if (credit.partyType !== invoice.partyType || credit.partyId !== invoice.partyId || (credit.partyId === null && credit.partyName !== invoice.partyName)) {
        throw new BadRequestException('L’avoir et la facture doivent concerner le même tiers.');
      }
      const max = Math.min(credit.balanceDue, invoice.balanceDue);
      const amount = round(dto.amount ?? max, 3);
      if (amount <= EPS) throw new BadRequestException('Rien à imputer : l’avoir est épuisé ou la facture soldée.');
      if (amount - max > EPS) throw new BadRequestException(`Montant maximal imputable : ${round(max, 3)}.`);
      const company = await this.company.getOrCreate(actor.userId, em);
      const date = today();
      const year = Number(date.slice(0, 4));
      const n = await this.sequences.next(em, actor.userId, 'payment', year);
      const payment = await em.getRepository(Payment).save(
        em.getRepository(Payment).create({
          userId: actor.userId, documentId: invoice.id, number: this.sequences.format(this.company.prefixFor(company, 'payment'), year, n),
          partyType: invoice.partyType, amount, method: 'credit_note', date, reference: credit.number, bankAccountId: null,
          creditNoteId: credit.id, notes: `Imputation de l’avoir ${credit.number}`, createdBy: actor.actorId,
        }),
      );
      await this.recompute(em, invoice.id, 'credit_note');
      await this.recompute(em, credit.id, null);
      const freshInvoice = (await em.getRepository(Document).findOne({ where: { id: invoice.id } }))!;
      const freshCredit = (await em.getRepository(Document).findOne({ where: { id: credit.id } }))!;
      return { payment, invoice: this.summary(freshInvoice), creditNote: this.summary(freshCredit) };
    });
  }

  private summary(d: Document) {
    return { id: d.id, number: d.number, paymentStatus: d.paymentStatus, paidAmount: d.paidAmount, balanceDue: d.balanceDue, netToPay: d.netToPay };
  }

  /** Recalcule payé / solde / statut / échéances d'un document à partir de ses règlements non annulés. */
  async recompute(em: EntityManager, documentId: number, lastMethod: string | null) {
    const doc = (await em.getRepository(Document).findOne({ where: { id: documentId } }))!;
    const meta = DOC_META[doc.type];
    const [own] = await em.query(`SELECT COALESCE(SUM("amount"),0) AS s FROM "payments" WHERE "documentId" = $1 AND "voidedAt" IS NULL`, [documentId]);
    let paid = Number(own.s);
    if (meta.isCredit) {
      const [applied] = await em.query(`SELECT COALESCE(SUM("amount"),0) AS s FROM "payments" WHERE "creditNoteId" = $1 AND "documentId" <> $1 AND "voidedAt" IS NULL`, [documentId]);
      paid += Number(applied.s);
    }
    paid = round(paid, 3);
    doc.paidAmount = paid;
    doc.balanceDue = Math.max(0, round(doc.netToPay - paid, 3));
    doc.paymentStatus = doc.balanceDue <= EPS ? 'paid' : paid > EPS ? 'partial' : 'unpaid';
    await em.getRepository(Document).save(doc);

    // Répartition du payé sur l'échéancier, de la plus ancienne à la plus récente
    const installments = await em.getRepository(DocumentInstallment).find({ where: { documentId }, order: { position: 'ASC', dueDate: 'ASC' } });
    if (installments.length) {
      let left = paid;
      for (const i of installments) {
        i.paidAmount = round(Math.min(i.amount, Math.max(left, 0)), 3);
        left = round(left - i.paidAmount, 3);
      }
      await em.getRepository(DocumentInstallment).save(installments);
    }

    let method = lastMethod;
    if (!method) {
      const [last] = await em.query(`SELECT "method" FROM "payments" WHERE "documentId" = $1 AND "voidedAt" IS NULL ORDER BY "date" DESC, "id" DESC LIMIT 1`, [documentId]);
      method = last?.method ?? null;
    }
    await this.mirror.onPaymentChange(em, doc, method);
    return doc;
  }

  async listPayments(userId: number, f: { documentId?: number; partyType?: string; from?: string; to?: string; method?: string; limit?: number }) {
    const qb = this.ds
      .getRepository(Payment)
      .createQueryBuilder('p')
      .innerJoin(Document, 'd', 'd.id = p.documentId')
      .select(['p.id AS id', 'p.number AS number', 'p.amount AS amount', 'p.method AS method', 'p.date AS date', 'p.reference AS reference', 'p."voidedAt" AS "voidedAt"', 'p."partyType" AS "partyType"', 'p."documentId" AS "documentId"', 'd.number AS "documentNumber"', 'd."partyName" AS "partyName"'])
      .where('p.userId = :userId', { userId });
    if (f.documentId) qb.andWhere('p.documentId = :doc', { doc: f.documentId });
    if (f.partyType) qb.andWhere('p.partyType = :pt', { pt: f.partyType });
    if (f.method) qb.andWhere('p.method = :m', { m: f.method });
    if (f.from) qb.andWhere('p.date >= :from', { from: f.from });
    if (f.to) qb.andWhere('p.date <= :to', { to: f.to });
    const rows = await qb.orderBy('p.date', 'DESC').addOrderBy('p.id', 'DESC').limit(Math.min(f.limit || 200, 1000)).getRawMany();
    return rows.map((r: any) => ({ ...r, amount: Number(r.amount), date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10) }));
  }

  // ═════════════════════════════ Balance âgée ═════════════════════════════

  /** Créances clients ('client') ou dettes fournisseurs ('supplier') par ancienneté de retard. */
  async aging(userId: number, side: 'client' | 'supplier', asOf?: string) {
    const date = asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? asOf : today();
    const rows = await this.ds.query(
      `SELECT "id","type","number","partyId","partyName","partyEmail","partyPhone", to_char("dueDate",'YYYY-MM-DD') AS "dueDate", to_char("issueDate",'YYYY-MM-DD') AS "issueDate", "balanceDue","netToPay"
         FROM "documents"
        WHERE "userId" = $1 AND "partyType" = $2 AND "lockedAt" IS NOT NULL AND "status" <> 'cancelled' AND "paymentStatus" IN ('unpaid','partial')
          AND "type" IN ('invoice','credit_note','supplier_invoice','supplier_credit_note') AND "balanceDue" > 0 AND "issueDate" <= $3`,
      [userId, side, date],
    );
    type Row = { key: string; partyId: number | null; partyName: string; email: string | null; phone: string | null; current: number; d1_30: number; d31_60: number; d61_90: number; d90plus: number; credits: number; total: number; net: number; oldestDays: number; documents: number };
    const byParty = new Map<string, Row>();
    for (const r of rows) {
      const key = r.partyId ? `p${r.partyId}` : `n${r.partyName}`;
      const row = byParty.get(key) || { key, partyId: r.partyId, partyName: r.partyName, email: r.partyEmail, phone: r.partyPhone, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, credits: 0, total: 0, net: 0, oldestDays: 0, documents: 0 };
      const balance = Number(r.balanceDue);
      if (DOC_META[r.type as keyof typeof DOC_META].isCredit) {
        row.credits = round(row.credits + balance, 3);
      } else {
        const late = r.dueDate ? dayDiff(date, r.dueDate) : 0;
        const bucket = late <= 0 ? 'current' : late <= 30 ? 'd1_30' : late <= 60 ? 'd31_60' : late <= 90 ? 'd61_90' : 'd90plus';
        row[bucket] = round(row[bucket] + balance, 3);
        row.total = round(row.total + balance, 3);
        row.oldestDays = Math.max(row.oldestDays, late);
        row.documents++;
      }
      byParty.set(key, row);
    }
    const parties = [...byParty.values()].map((r) => ({ ...r, net: round(r.total - r.credits, 3) })).sort((a, b) => b.total - a.total);
    const totals = parties.reduce(
      (t, r) => ({ current: round(t.current + r.current, 3), d1_30: round(t.d1_30 + r.d1_30, 3), d31_60: round(t.d31_60 + r.d31_60, 3), d61_90: round(t.d61_90 + r.d61_90, 3), d90plus: round(t.d90plus + r.d90plus, 3), credits: round(t.credits + r.credits, 3), total: round(t.total + r.total, 3), net: round(t.net + r.net, 3) }),
      { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, credits: 0, total: 0, net: 0 },
    );
    return { asOf: date, side, parties, totals };
  }

  /** Relevé de compte d'un tiers : factures, avoirs et règlements dans l'ordre, avec solde progressif. */
  async statement(userId: number, partyType: 'client' | 'supplier', partyId: number) {
    const docs = await this.ds.query(
      `SELECT "id","type","number", to_char("issueDate",'YYYY-MM-DD') AS "date", "netToPay" FROM "documents"
        WHERE "userId" = $1 AND "partyType" = $2 AND "partyId" = $3 AND "lockedAt" IS NOT NULL AND "status" <> 'cancelled' AND "type" IN ('invoice','credit_note','supplier_invoice','supplier_credit_note')`,
      [userId, partyType, partyId],
    );
    const pays = await this.ds.query(
      `SELECT p."id", p."number", to_char(p."date",'YYYY-MM-DD') AS "date", p."amount", p."method", d."number" AS "documentNumber", d."type" AS "documentType"
         FROM "payments" p JOIN "documents" d ON d."id" = p."documentId"
        WHERE p."userId" = $1 AND d."partyType" = $2 AND d."partyId" = $3 AND p."voidedAt" IS NULL AND p."method" <> 'credit_note'`,
      [userId, partyType, partyId],
    );
    // Solde dû par le tiers (client) / à lui (fournisseur) : factures +, avoirs −, règlements −
    const events: Array<{ date: string; kind: string; ref: string; label: string; delta: number; order: number }> = [];
    for (const d of docs) {
      const credit = DOC_META[d.type as keyof typeof DOC_META].isCredit;
      events.push({ date: d.date, kind: d.type, ref: d.number, label: DOC_META[d.type as keyof typeof DOC_META].label, delta: (credit ? -1 : 1) * Number(d.netToPay), order: 0 });
    }
    for (const p of pays) {
      const credit = DOC_META[p.documentType as keyof typeof DOC_META].isCredit;
      events.push({ date: p.date, kind: 'payment', ref: p.number, label: `${credit ? 'Remboursement' : 'Règlement'} ${p.method} (${p.documentNumber})`, delta: (credit ? 1 : -1) * Number(p.amount), order: 1 });
    }
    events.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order || a.ref.localeCompare(b.ref));
    let balance = 0;
    const lines = events.map((e) => ({ ...e, balance: (balance = round(balance + e.delta, 3)) }));
    return { partyType, partyId, balance, lines };
  }

  // ═════════════════════════════ Relances ═════════════════════════════

  async remind(actor: Actor, documentId: number, dto: RemindDto) {
    const doc = await this.ds.getRepository(Document).findOne({ where: { id: documentId, userId: actor.userId } });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.type !== 'invoice' || !doc.lockedAt) throw new BadRequestException('Seule une facture client validée se relance.');
    if (doc.balanceDue <= EPS) throw new BadRequestException('Cette facture est déjà soldée.');
    const company = await this.company.getOrCreate(actor.userId);
    const previous = doc.partyId
      ? await this.ds.getRepository(Interaction).count({ where: { userId: actor.userId, documentId: doc.id, kind: 'reminder' } })
      : 0;
    const level = dto.level || Math.min(previous + 1, 3);
    const late = doc.dueDate ? Math.max(0, dayDiff(today(), String(doc.dueDate).slice(0, 10))) : 0;
    const amount = `${doc.balanceDue.toFixed(3)} ${doc.currency}`;
    const due = doc.dueDate ? String(doc.dueDate).slice(0, 10).split('-').reverse().join('/') : '';
    const intro = {
      1: `Sauf erreur ou omission de notre part, la facture ${doc.number}${due ? ` échue le ${due}` : ''} reste impayée pour un solde de ${amount}.\nNous vous remercions de bien vouloir procéder à son règlement dans les meilleurs délais. Si ce paiement a été effectué entre-temps, merci de ne pas tenir compte de ce message.`,
      2: `Malgré notre précédent rappel, la facture ${doc.number}${due ? ` échue le ${due}` : ''} demeure impayée (solde : ${amount}${late ? `, ${late} jours de retard` : ''}).\nNous vous demandons de régulariser cette situation sous huit jours.`,
      3: `MISE EN DEMEURE — La facture ${doc.number}${due ? ` échue le ${due}` : ''} reste impayée (solde : ${amount}${late ? `, ${late} jours de retard` : ''}) malgré nos relances.\nÀ défaut de règlement sous huit jours à compter de la réception de ce courrier, nous nous réservons le droit d’engager toute action utile pour le recouvrement de notre créance.`,
    }[level as 1 | 2 | 3];
    const message = dto.message?.trim() || `Bonjour,\n\n${intro}\n\nCordialement,\n${company.legalName || ''}`;
    const subject = `${level === 3 ? 'Mise en demeure' : level === 2 ? 'Relance' : 'Rappel'} — facture ${doc.number}`;

    let emailSent = false;
    let emailError: string | null = null;
    if (dto.sendEmail !== false && doc.partyEmail) {
      try {
        await this.mail.send({ to: doc.partyEmail, subject, text: message, replyTo: company.email || undefined });
        emailSent = true;
      } catch (e: any) {
        emailError = String(e?.message || e).slice(0, 200);
      }
    } else if (dto.sendEmail !== false) {
      emailError = 'Aucune adresse email sur la facture : relance enregistrée sans envoi.';
    }

    let interactionId: number | null = null;
    if (doc.partyId) {
      const followUp = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
      const saved = await this.ds.getRepository(Interaction).save(
        this.ds.getRepository(Interaction).create({
          userId: actor.userId, partyType: 'client', partyId: doc.partyId, kind: 'reminder', subject, content: message,
          documentId: doc.id, level, followUpDate: followUp, createdBy: actor.actorId,
        }),
      );
      interactionId = saved.id;
    }
    return { level, subject, message, emailSent, emailError, interactionId };
  }
}
