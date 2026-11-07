import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityManager, In } from 'typeorm';
import { Document, DocumentStatus, DocumentType } from './entities/document.entity';
import { DocumentLine } from './entities/document-line.entity';
import { Payment } from './entities/payment.entity';
import { DocumentInstallment } from './entities/document-installment.entity';
import { DOC_META } from './documents.types';
import { ConvertDto, CreateDocumentDto, DocLineDto, InstallmentDto, SendDto, UpdateDocumentDto } from './documents.dto';
import { Company } from '../company/company.entity';
import { CompanyService } from '../company/company.service';
import { SequenceService } from '../../common/sequences/sequence.service';
import { StockService, MoveInput } from '../stock/stock.service';
import { AccountingService } from '../accounting/accounting.service';
import { LegacyMirrorService } from './legacy-mirror.service';
<<<<<<< HEAD
=======
import { LegacyImportService } from './legacy-import.service';
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
import { DocumentPdfService } from './document-pdf.service';
import { MailService } from '../../common/mail/mail.service';
import { PermissionsService } from '../auth/permissions.service';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { PriceListItem } from '../crm/entities/price-list.entity';
import { Warehouse } from '../stock/entities/warehouse.entity';
import { computeTotals, round } from '../../common/money';
import { VAT_RATES, stampDutyFor, validateTaxId } from '../../common/fiscal';
import { amountToFrenchWords } from '../../common/number-words';

const EPS = 0.0005;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface Actor {
  userId: number;
  actorId: number;
  role: string;
  isTeamMember: boolean;
  permissions?: string[];
  email?: string;
}

interface PartyInfo {
  id: number | null;
  name: string;
  taxId: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  discountPct: number;
  withholdingRate: number;
  paymentTermsDays: number | null;
  priceListId: number | null;
  creditLimit: number | null;
}

/** Ligne en entrée du calcul : une ligne saisie, ou issue d'une conversion (avec coût et ligne d'origine). */
interface InputLine extends DocLineDto {
  unitCost?: number | null;
}

interface Header {
  globalDiscountPct?: number;
  withholdingRate?: number;
  applyStamp?: boolean;
}

/** Statut d'un document une fois validé. */
const STATUS_AFTER_VALIDATION: Record<DocumentType, DocumentStatus> = {
  quote: 'validated', delivery_note: 'delivered', invoice: 'validated', credit_note: 'validated',
  purchase_order: 'confirmed', goods_receipt: 'received', supplier_invoice: 'validated', supplier_credit_note: 'validated',
};
const STOCK_REASON: Record<DocumentType, string> = {
  quote: '', purchase_order: '', delivery_note: 'delivery', invoice: 'sale', credit_note: 'return',
  goods_receipt: 'receipt', supplier_invoice: 'purchase', supplier_credit_note: 'purchase_return',
};
const CLOSED = new Set(['cancelled', 'rejected', 'expired', 'converted', 'invoiced', 'credited', 'draft']);

@Injectable()
export class DocumentsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly company: CompanyService,
    private readonly sequences: SequenceService,
    private readonly stock: StockService,
    private readonly accounting: AccountingService,
    private readonly mirror: LegacyMirrorService,
    private readonly pdf: DocumentPdfService,
    private readonly mail: MailService,
    private readonly permissions: PermissionsService,
<<<<<<< HEAD
=======
    private readonly legacyImport: LegacyImportService,
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
  ) {}

  // ═════════════════════════════ Lecture ═════════════════════════════

  private async refreshExpired(userId: number) {
    await this.ds.query(
      `UPDATE "documents" SET "status" = 'expired'
        WHERE "userId" = $1 AND "type" = 'quote' AND "status" IN ('validated','sent') AND "validUntil" < CURRENT_DATE`,
      [userId],
    );
  }

  async list(
    userId: number,
    f: { type?: string; status?: string; paymentStatus?: string; partyId?: number; from?: string; to?: string; search?: string; overdue?: boolean; limit?: number; offset?: number },
  ) {
<<<<<<< HEAD
=======
    await this.legacyImport.ensure(userId);
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
    await this.refreshExpired(userId);
    const qb = this.ds.getRepository(Document).createQueryBuilder('d').where('d.userId = :userId', { userId });
    if (f.type) {
      const types = f.type.split(',').filter((t) => t in DOC_META);
      if (types.length) qb.andWhere('d.type IN (:...types)', { types });
    }
    if (f.status) qb.andWhere('d.status = :status', { status: f.status });
    if (f.paymentStatus) qb.andWhere('d.paymentStatus = :ps', { ps: f.paymentStatus });
    if (f.partyId) qb.andWhere('d.partyId = :pid', { pid: f.partyId });
    if (f.from) qb.andWhere('d.issueDate >= :from', { from: f.from });
    if (f.to) qb.andWhere('d.issueDate <= :to', { to: f.to });
    if (f.overdue) qb.andWhere(`d.paymentStatus IN ('unpaid','partial') AND d.dueDate < CURRENT_DATE AND d.lockedAt IS NOT NULL`);
    if (f.search) {
      qb.andWhere(`(LOWER(COALESCE(d.number,'')) LIKE :s OR LOWER(d.partyName) LIKE :s OR LOWER(COALESCE(d.externalRef,'')) LIKE :s)`, { s: `%${f.search.toLowerCase()}%` });
    }
    const limit = Math.min(Math.max(Number(f.limit) || 50, 1), 500);
    const offset = Math.max(Number(f.offset) || 0, 0);
    const [items, total] = await qb.orderBy('d.issueDate', 'DESC').addOrderBy('d.id', 'DESC').take(limit).skip(offset).getManyAndCount();
    return { total, limit, offset, items: items.map((d) => ({ ...d, typeLabel: DOC_META[d.type].label, overdue: this.isOverdue(d) })) };
  }

  private isOverdue(d: Document) {
    return DOC_META[d.type].settles && !!d.lockedAt && d.paymentStatus !== 'paid' && !!d.dueDate && String(d.dueDate) < today() && d.balanceDue > EPS && !DOC_META[d.type].isCredit;
  }

  async get(userId: number, id: number) {
    await this.refreshExpired(userId);
    const doc = await this.ds.getRepository(Document).findOne({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document introuvable');
    const lines = await this.ds.getRepository(DocumentLine).find({ where: { documentId: id }, order: { position: 'ASC', id: 'ASC' } });
    const payments = await this.ds.getRepository(Payment).find({ where: { documentId: id }, order: { date: 'ASC', id: 'ASC' } });
    const installments = await this.ds.getRepository(DocumentInstallment).find({ where: { documentId: id }, order: { position: 'ASC', dueDate: 'ASC' } });
    const meta = DOC_META[doc.type];
    const frozen = !!doc.lockedAt;
    const linked = await this.ds.query(
      `SELECT "id","type","number","status","totalTTC" FROM "documents"
        WHERE "userId" = $1 AND ("creditedDocumentId" = $2 OR "sources" @> $3::jsonb) ORDER BY "id"`,
      [userId, id, JSON.stringify([{ id }])],
    );
    const hasRemaining = lines.some((l) => l.quantity - l.processedQty > EPS);
    const canConvert = frozen && !CLOSED.has(doc.status) && hasRemaining;
    return {
      ...doc,
      typeLabel: meta.label,
      overdue: this.isOverdue(doc),
      amountInWords: amountToFrenchWords(meta.settles ? doc.netToPay : doc.totalTTC),
      lines,
      payments,
      installments,
      linkedDocuments: linked.map((l: any) => ({ ...l, label: DOC_META[l.type as DocumentType]?.label, totalTTC: Number(l.totalTTC) })),
      allowedActions: {
        edit: !frozen,
        delete: !frozen,
        validate: !frozen,
        pay: meta.settles && frozen && doc.balanceDue > EPS,
        convertTo: canConvert ? meta.convertsTo : [],
        cancel: ['quote', 'purchase_order', 'delivery_note', 'goods_receipt'].includes(doc.type) && frozen && !['cancelled', 'invoiced', 'converted'].includes(doc.status) && !lines.some((l) => l.processedQty > EPS),
        send: frozen && doc.status !== 'cancelled',
        decide: doc.type === 'quote' && ['validated', 'sent'].includes(doc.status),
      },
    };
  }

  // ═════════════════════════════ Création / modification ═════════════════════════════

  async create(actor: Actor, dto: CreateDocumentDto) {
    const id = await this.ds.transaction(async (em) => this.createInTx(em, actor, dto, {}));
    return this.get(actor.userId, id);
  }

  /** Cœur de la création d'un brouillon (utilisé aussi par les conversions et l'duplication). */
  private async createInTx(
    em: EntityManager,
    actor: Actor,
    dto: CreateDocumentDto,
    extra: { sources?: Document['sources']; copyParty?: Document; lines?: InputLine[]; affectsStock?: boolean },
  ): Promise<number> {
    const type = dto.type as DocumentType;
    const meta = DOC_META[type];
    const company = await this.company.getOrCreate(actor.userId, em);

    let credited: Document | null = null;
    if (meta.isCredit) {
      if (!dto.creditedDocumentId) throw new BadRequestException('Un avoir doit référencer la facture qu’il corrige (creditedDocumentId).');
      credited = await this.loadCreditable(em, actor.userId, type, dto.creditedDocumentId);
    }

    const party = await this.resolveParty(em, actor.userId, meta.party, dto, credited || extra.copyParty || undefined);
    if (dto.warehouseId) await this.assertWarehouse(em, actor.userId, dto.warehouseId);
    const issueDate = dto.issueDate || today();
    const inputs: InputLine[] = extra.lines || dto.lines;
    const withholding = dto.withholdingRate ?? (credited ? credited.withholdingRate : party.withholdingRate);
    const priced = await this.price(em, actor.userId, type, { globalDiscountPct: dto.globalDiscountPct ?? credited?.globalDiscountPct, withholdingRate: withholding, applyStamp: dto.applyStamp }, inputs, party, company, !!(credited && credited.withholdingAmount > 0));

    const terms = party.paymentTermsDays ?? company.defaultPaymentTermsDays;
    const doc = em.getRepository(Document).create({
      userId: actor.userId,
      type,
      number: null,
      status: 'draft',
      paymentStatus: 'none',
      partyType: meta.party,
      partyId: party.id,
      partyName: party.name,
      partyTaxId: party.taxId,
      partyAddress: party.address,
      partyEmail: party.email,
      partyPhone: party.phone,
      issueDate,
      dueDate: meta.settles ? dto.dueDate || addDays(issueDate, terms) : null,
      validUntil: type === 'quote' ? dto.validUntil || addDays(issueDate, company.quoteValidityDays) : null,
      currency: company.currency || 'TND',
      paymentTerms: dto.paymentTerms || (meta.settles ? `${terms} jours` : null),
      externalRef: dto.externalRef || null,
      warehouseId: dto.warehouseId || null,
      notes: dto.notes ?? company.defaultNotes ?? null,
      footer: dto.footer ?? company.invoiceFooter ?? null,
      sources: extra.sources || (credited ? [{ id: credited.id, type: credited.type, number: credited.number }] : null),
      creditedDocumentId: credited ? credited.id : null,
      affectsStock: extra.affectsStock ?? dto.affectsStock ?? true,
      createdBy: actor.actorId,
      ...priced.fields,
    } as any) as unknown as Document;
    const saved = await em.getRepository(Document).save(doc);
    await this.saveLines(em, saved.id, priced.lines);
    if (dto.installments?.length) await this.replaceInstallments(em, saved, dto.installments);
    return saved.id;
  }

  async update(actor: Actor, id: number, dto: UpdateDocumentDto) {
    await this.ds.transaction(async (em) => {
      const doc = await this.lockDraft(em, actor.userId, id);
      const meta = DOC_META[doc.type];
      const company = await this.company.getOrCreate(actor.userId, em);

      const partyChanged = ['partyId', 'partyName', 'partyTaxId', 'partyAddress', 'partyEmail', 'partyPhone'].some((k) => (dto as any)[k] !== undefined);
      let party: PartyInfo;
      if (partyChanged) {
        if (doc.creditedDocumentId && dto.partyId !== undefined && dto.partyId !== doc.partyId) throw new BadRequestException('Le tiers d’un avoir est celui de la facture d’origine.');
        party = await this.resolveParty(em, actor.userId, meta.party, { partyId: dto.partyId ?? undefined, ...dto } as any, doc);
        doc.partyId = party.id;
        doc.partyName = party.name;
        doc.partyTaxId = party.taxId;
        doc.partyAddress = party.address;
        doc.partyEmail = party.email;
        doc.partyPhone = party.phone;
      } else {
        party = await this.partyOfDoc(em, actor.userId, doc);
      }

      if (dto.warehouseId !== undefined) {
        if (dto.warehouseId) await this.assertWarehouse(em, actor.userId, dto.warehouseId);
        doc.warehouseId = dto.warehouseId || null;
      }
      if (dto.issueDate) doc.issueDate = dto.issueDate;
      if (dto.dueDate !== undefined && meta.settles) doc.dueDate = dto.dueDate || null;
      if (dto.validUntil !== undefined && doc.type === 'quote') doc.validUntil = dto.validUntil || null;
      if (dto.externalRef !== undefined) doc.externalRef = dto.externalRef || null;
      if (dto.paymentTerms !== undefined) doc.paymentTerms = dto.paymentTerms || null;
      if (dto.notes !== undefined) doc.notes = dto.notes || null;
      if (dto.footer !== undefined) doc.footer = dto.footer || null;
      if (dto.affectsStock !== undefined) doc.affectsStock = dto.affectsStock;

      // Lignes : celles reçues, sinon celles déjà enregistrées (recalcul à l'identique)
      const existing = await em.getRepository(DocumentLine).find({ where: { documentId: id }, order: { position: 'ASC', id: 'ASC' } });
      const inputs: InputLine[] = dto.lines ?? existing.map((l) => this.lineToInput(l));
      const creditedWithholding = !!doc.creditedDocumentId && doc.withholdingAmount > 0;
      const header: Header = {
        globalDiscountPct: dto.globalDiscountPct ?? doc.globalDiscountPct,
        withholdingRate: dto.withholdingRate ?? doc.withholdingRate ?? party.withholdingRate,
        applyStamp: dto.applyStamp ?? (meta.stamp ? doc.stampDuty > 0 : undefined),
      };
      const priced = await this.price(em, actor.userId, doc.type, header, inputs, party, company, creditedWithholding);
      Object.assign(doc, priced.fields);
      await em.getRepository(Document).save(doc);
      if (dto.lines || existing.length === 0) {
        await em.getRepository(DocumentLine).delete({ documentId: id });
        await this.saveLines(em, id, priced.lines);
      } else {
        // mêmes lignes : on met à jour les montants recalculés sans changer les identifiants
        for (let i = 0; i < existing.length; i++) {
          const p = priced.lines[i];
          await em.getRepository(DocumentLine).update(existing[i].id, { netHT: p.netHT, vatAmount: p.vatAmount, totalTTC: p.totalTTC, vatRate: p.vatRate, discountPct: p.discountPct });
        }
      }
    });
    return this.get(actor.userId, id);
  }

  async remove(actor: Actor, id: number) {
    await this.ds.transaction(async (em) => {
      const doc = await this.lockDraft(em, actor.userId, id);
      await em.getRepository(DocumentInstallment).delete({ documentId: id });
      await em.getRepository(DocumentLine).delete({ documentId: id });
      await em.getRepository(Document).delete({ id: doc.id });
    });
    return { deleted: true };
  }

  async duplicate(actor: Actor, id: number) {
    const src = await this.get(actor.userId, id);
    const newId = await this.ds.transaction(async (em) => {
      const meta = DOC_META[src.type];
      if (meta.isCredit) throw new BadRequestException('Un avoir ne se duplique pas : créez-le depuis la facture à corriger.');
      const dto = {
        type: src.type, partyId: src.partyId ?? undefined, partyName: src.partyName, partyTaxId: src.partyTaxId ?? undefined,
        partyAddress: src.partyAddress ?? undefined, partyEmail: src.partyEmail ?? undefined, partyPhone: src.partyPhone ?? undefined,
        warehouseId: src.warehouseId ?? undefined, notes: src.notes ?? undefined, footer: src.footer ?? undefined,
        globalDiscountPct: src.globalDiscountPct, withholdingRate: src.withholdingRate, applyStamp: src.stampDuty > 0, affectsStock: src.affectsStock,
        lines: src.lines.map((l: DocumentLine) => ({ ...this.lineToInput(l), sourceLineId: undefined })),
      } as CreateDocumentDto;
      return this.createInTx(em, actor, dto, {});
    });
    return this.get(actor.userId, newId);
  }

  // ═════════════════════════════ Validation ═════════════════════════════

  /**
   * Valide un document : attribue le numéro légal (sans trou), fige le document, applique les effets de stock,
   * met à jour les documents d'origine et passe l'écriture comptable — le tout dans UNE transaction :
   * si une étape échoue, rien n'est enregistré et le numéro n'est pas consommé.
   */
  async validate(actor: Actor, id: number) {
    const warnings: string[] = [];
    await this.ds.transaction(async (em) => {
      const doc = await em.getRepository(Document).findOne({ where: { id, userId: actor.userId }, lock: { mode: 'pessimistic_write' } });
      if (!doc) throw new NotFoundException('Document introuvable');
      if (doc.lockedAt) throw new ConflictException('Ce document est déjà validé.');
      const meta = DOC_META[doc.type];

      // Le magasinier ne valide que les bons de livraison / réception
      if (!this.permissions.can(actor.role, actor.permissions, 'documents:validate', actor.isTeamMember) && !['delivery_note', 'goods_receipt'].includes(doc.type)) {
        throw new ForbiddenException('Vous pouvez valider les bons de livraison et de réception uniquement.');
      }

      const company = await this.company.getOrCreate(actor.userId, em);
      if (meta.fiscal) {
        const gaps = this.company.legalGaps(company);
        if (gaps.length) throw new BadRequestException(`Complétez la fiche société avant d’émettre une ${meta.label.toLowerCase()} (mentions légales manquantes : ${gaps.join(', ')}).`);
      }
      const lines = await em.getRepository(DocumentLine).find({ where: { documentId: id }, order: { position: 'ASC', id: 'ASC' } });
      if (!lines.length) throw new BadRequestException('Le document ne contient aucune ligne.');
      if (meta.settles && !(doc.netToPay > EPS) && !meta.isCredit) throw new BadRequestException('Le montant à payer doit être supérieur à zéro.');
      if (doc.partyTaxId) {
        const check = validateTaxId(doc.partyTaxId);
        if (!check.valid) throw new BadRequestException(check.message);
      }

      // ── Chronologie : la numérotation légale suit l'ordre des dates ──
      if (meta.fiscal) {
        if (doc.issueDate > today()) throw new BadRequestException('La date d’émission ne peut pas être dans le futur.');
        const [last] = await em.query(
          `SELECT to_char(MAX("issueDate"), 'YYYY-MM-DD') AS d FROM "documents" WHERE "userId" = $1 AND "type" = $2 AND "number" IS NOT NULL`,
          [actor.userId, doc.type],
        );
        if (last?.d && doc.issueDate < last.d) {
          throw new BadRequestException(`La date du ${doc.issueDate} est antérieure à celle du dernier document numéroté (${last.d}). Les numéros légaux doivent suivre l’ordre chronologique : utilisez une date ≥ ${last.d}.`);
        }
      }

      // ── Avoir : ne pas dépasser la facture d'origine ──
      if (meta.isCredit) await this.checkCreditLimits(em, doc, lines);

      // ── Quantités restant à traiter sur les documents d'origine ──
      const touched = await this.consumeSources(em, actor.userId, lines, +1);

      // ── Plafond d'encours client (avertissement) ──
      if (doc.type === 'invoice' && doc.partyId) {
        const w = await this.creditLimitWarning(em, actor.userId, doc);
        if (w) warnings.push(w);
      }

      // ── Échéancier cohérent avec le net à payer ──
      const installments = await em.getRepository(DocumentInstallment).find({ where: { documentId: id } });
      if (installments.length) {
        const sum = round(installments.reduce((s, i) => s + i.amount, 0), 3);
        if (Math.abs(sum - doc.netToPay) > EPS) throw new BadRequestException(`L’échéancier (${sum}) ne correspond pas au net à payer (${doc.netToPay}).`);
      }

      // ── Numéro légal ──
      const year = Number(doc.issueDate.slice(0, 4));
      const n = await this.sequences.next(em, actor.userId, meta.numberingKey, year);
      doc.number = this.sequences.format(this.company.prefixFor(company, meta.numberingKey), year, n);

      // ── Effets sur le stock ──
      await this.applyStock(em, actor, doc, lines, +1);

      // ── Cycle de vie ──
      doc.status = STATUS_AFTER_VALIDATION[doc.type];
      doc.validatedAt = new Date();
      doc.validatedBy = actor.actorId;
      doc.lockedAt = new Date();
      if (meta.settles) {
        doc.paymentStatus = doc.netToPay > EPS ? 'unpaid' : 'paid';
        doc.paidAmount = 0;
        doc.balanceDue = doc.netToPay;
      }
      await em.getRepository(Document).save(doc);
      await em.getRepository(DocumentLine).save(lines);

      // ── Comptabilité et miroir vers les anciens écrans ──
      if (meta.settles) await this.accounting.postDocument(em, actor.userId, actor.actorId, doc, lines);
      await this.mirror.onValidated(em, doc, lines);
      for (const sourceId of touched) await this.refreshSourceStatus(em, actor.userId, sourceId, doc);
    });
    const result = await this.get(actor.userId, id);
    return { ...result, warnings };
  }

  private async checkCreditLimits(em: EntityManager, doc: Document, lines: DocumentLine[]) {
    const credited = await em.getRepository(Document).findOne({ where: { id: doc.creditedDocumentId!, userId: doc.userId } });
    if (!credited || !credited.lockedAt) throw new BadRequestException('La facture d’origine de cet avoir est introuvable ou non validée.');
    if (doc.issueDate < credited.issueDate) throw new BadRequestException(`La date de l’avoir ne peut pas précéder celle de la facture (${credited.issueDate}).`);
    const [row] = await em.query(
      `SELECT COALESCE(SUM("totalTTC"),0) AS total FROM "documents" WHERE "userId" = $1 AND "creditedDocumentId" = $2 AND "lockedAt" IS NOT NULL AND "status" <> 'cancelled' AND "id" <> $3`,
      [doc.userId, credited.id, doc.id],
    );
    const already = Number(row.total);
    if (round(already + doc.totalTTC, 3) - credited.totalTTC > EPS) {
      throw new BadRequestException(`Avoirs cumulés (${round(already + doc.totalTTC, 3)}) supérieurs au montant TTC de la facture ${credited.number} (${credited.totalTTC}).`);
    }
    const unlinked = lines.filter((l) => !l.sourceLineId);
    if (unlinked.length && lines.some((l) => l.sourceLineId)) throw new BadRequestException('Un avoir ne peut pas mélanger des lignes issues de la facture et des lignes libres.');
  }

  private async creditLimitWarning(em: EntityManager, userId: number, doc: Document): Promise<string | null> {
    const client = await em.getRepository(Client).findOne({ where: { id: doc.partyId!, userId } });
    if (!client || client.creditLimit === null || client.creditLimit === undefined) return null;
    const [row] = await em.query(
      `SELECT COALESCE(SUM(CASE WHEN "type" = 'credit_note' THEN -"balanceDue" ELSE "balanceDue" END),0) AS due
         FROM "documents" WHERE "userId" = $1 AND "partyType" = 'client' AND "partyId" = $2 AND "type" IN ('invoice','credit_note') AND "lockedAt" IS NOT NULL AND "paymentStatus" IN ('unpaid','partial')`,
      [userId, doc.partyId],
    );
    const exposure = round(Number(row.due) + doc.netToPay, 3);
    return exposure > client.creditLimit + EPS ? `Plafond d’encours dépassé pour ${client.name} : ${exposure} DT dus pour une limite de ${client.creditLimit} DT.` : null;
  }

  /**
   * Met à jour (sens +1) ou rend (sens −1) la quantité déjà traitée des lignes d'origine.
   * Retourne les documents d'origine concernés.
   */
  private async consumeSources(em: EntityManager, userId: number, lines: DocumentLine[], sign: 1 | -1): Promise<number[]> {
    const wanted = new Map<number, number>();
    for (const l of lines) if (l.sourceLineId) wanted.set(l.sourceLineId, round((wanted.get(l.sourceLineId) || 0) + l.quantity, 3));
    if (!wanted.size) return [];
    const srcLines = await em.getRepository(DocumentLine).find({ where: { id: In([...wanted.keys()]) }, lock: { mode: 'pessimistic_write' } });
    if (srcLines.length !== wanted.size) throw new BadRequestException('Une ligne d’origine référencée n’existe plus.');
    const docs = await em.getRepository(Document).find({ where: { id: In([...new Set(srcLines.map((l) => l.documentId))]), userId } });
    const docById = new Map(docs.map((d) => [d.id, d]));
    for (const sl of srcLines) {
      const src = docById.get(sl.documentId);
      if (!src) throw new ForbiddenException('Ligne d’origine inaccessible.');
      if (sign > 0 && (!src.lockedAt || ['cancelled', 'rejected', 'expired'].includes(src.status))) throw new BadRequestException(`Le document d’origine ${src.number || '#' + src.id} n’est plus convertible (${src.status}).`);
      const qty = wanted.get(sl.id)!;
      if (sign > 0) {
        const remaining = round(sl.quantity - sl.processedQty, 3);
        if (qty - remaining > EPS) throw new BadRequestException(`« ${sl.description} » : quantité ${qty} supérieure au reste à traiter (${remaining}) sur ${src.number}.`);
        sl.processedQty = round(sl.processedQty + qty, 3);
      } else {
        sl.processedQty = Math.max(0, round(sl.processedQty - qty, 3));
      }
    }
    await em.getRepository(DocumentLine).save(srcLines);
    return [...docById.keys()];
  }

  private async refreshSourceStatus(em: EntityManager, userId: number, sourceId: number, child: Document) {
    const src = await em.getRepository(Document).findOne({ where: { id: sourceId, userId } });
    if (!src || src.status === 'cancelled') return;
    const lines = await em.getRepository(DocumentLine).find({ where: { documentId: sourceId } });
    const all = lines.every((l) => l.processedQty - l.quantity >= -EPS);
    const any = lines.some((l) => l.processedQty > EPS);
    const next: Partial<Record<DocumentType, () => DocumentStatus | null>> = {
      quote: () => (all ? 'converted' : null),
      delivery_note: () => (all ? 'invoiced' : null),
      goods_receipt: () => (all ? 'invoiced' : null),
      invoice: () => (all ? 'credited' : null),
      supplier_invoice: () => (all ? 'credited' : null),
      purchase_order: () => (child.type === 'goods_receipt' ? (all ? 'received' : any ? 'partially_received' : null) : all ? 'invoiced' : null),
    };
    const status = next[src.type]?.() ?? null;
    if (status && status !== src.status) {
      src.status = status;
      await em.getRepository(Document).save(src);
    }
  }

  /** Mouvements de stock d'un document (sens +1) ou leur annulation (sens −1). */
  private async applyStock(em: EntityManager, actor: Actor, doc: Document, lines: DocumentLine[], sign: 1 | -1) {
    const meta = DOC_META[doc.type];
    if (meta.stock === 'none' || !doc.affectsStock) {
      // Pas de mouvement ici : le coût des lignes vient du bon de livraison d'origine (marge et coût des ventes).
      if (sign > 0) await this.inheritCosts(em, lines);
      return;
    }
    for (const l of lines) {
      if (!l.productId) continue;
      if (meta.isCredit && !l.returnToStock) continue;
      const inbound = meta.stock === 'in';
      const input: MoveInput = {
        userId: actor.userId,
        actorId: actor.actorId,
        productId: l.productId,
        quantity: (inbound ? 1 : -1) * sign * l.quantity,
        reason: sign > 0 ? STOCK_REASON[doc.type] : `${STOCK_REASON[doc.type]}_cancel`,
        warehouseId: l.warehouseId ?? doc.warehouseId ?? undefined,
        refType: 'document',
        refId: doc.number || doc.id,
        lotNumber: l.lotNumber,
        expiryDate: l.expiryDate,
        note: `${meta.label} ${doc.number || ''}`.trim(),
      };
      // Entrée d'achat : le coût d'achat net (après remises) alimente le coût moyen pondéré
      if (sign > 0 && inbound && !meta.isCredit && meta.party === 'supplier' && l.quantity > 0) input.unitCost = round(l.netHT / l.quantity, 3);
      if (sign < 0 && !inbound) { /* annulation d'une sortie = entrée au coût d'origine */ input.unitCost = l.unitCost ?? undefined; }
      const moves = await this.stock.move(em, input);
      if (sign > 0 && !inbound && moves.length) {
        const qty = moves.reduce((s, m) => s + Math.abs(m.quantity), 0);
        l.unitCost = qty > 0 ? round(moves.reduce((s, m) => s + Math.abs(m.quantity) * m.unitCost, 0) / qty, 3) : null;
      }
      if (sign > 0 && inbound && meta.party === 'supplier' && !meta.isCredit) l.unitCost = input.unitCost ?? null;
    }
  }

  private async inheritCosts(em: EntityManager, lines: DocumentLine[]) {
    const ids = lines.filter((l) => l.sourceLineId && l.unitCost === null).map((l) => l.sourceLineId!);
    if (!ids.length) return;
    const src = await em.getRepository(DocumentLine).find({ where: { id: In(ids) } });
    const costOf = new Map(src.map((s) => [s.id, s.unitCost]));
    for (const l of lines) if (l.sourceLineId && l.unitCost === null) l.unitCost = costOf.get(l.sourceLineId) ?? null;
  }

  // ═════════════════════════════ Conversion ═════════════════════════════

  /**
   * Convertit un ou plusieurs documents validés en un nouveau BROUILLON (devis -> BL / facture, BL -> facture,
   * bon de commande -> réception / facture, facture -> avoir). Seules les quantités restant à traiter sont reprises.
   */
  async convert(actor: Actor, id: number, dto: ConvertDto) {
    const newId = await this.ds.transaction(async (em) => {
      const first = await em.getRepository(Document).findOne({ where: { id, userId: actor.userId } });
      if (!first) throw new NotFoundException('Document introuvable');
      const to = dto.to as DocumentType;
      if (!DOC_META[first.type].convertsTo.includes(to)) throw new BadRequestException(`Un(e) ${DOC_META[first.type].label.toLowerCase()} ne peut pas être converti(e) en ${DOC_META[to].label.toLowerCase()}.`);

      const ids = [...new Set([id, ...(dto.alsoIds || [])])];
      const sources = await em.getRepository(Document).find({ where: { id: In(ids), userId: actor.userId } });
      if (sources.length !== ids.length) throw new NotFoundException('Un des documents à regrouper est introuvable.');
      for (const s of sources) {
        if (!s.lockedAt || CLOSED.has(s.status)) throw new BadRequestException(`${s.number || 'Document #' + s.id} n’est pas convertible (statut : ${s.status}).`);
        if (s.type !== first.type) throw new BadRequestException('Seuls des documents du même type peuvent être regroupés.');
        if (s.partyId !== first.partyId || s.partyName !== first.partyName) throw new BadRequestException('Les documents regroupés doivent concerner le même tiers.');
        if (Math.abs(s.globalDiscountPct - first.globalDiscountPct) > 0.001) throw new BadRequestException('Les documents regroupés doivent avoir la même remise globale.');
      }
      sources.sort((a, b) => a.id - b.id);

      const creditMap = new Map((dto.creditLines || []).map((c) => [c.lineId, c]));
      const inputs: InputLine[] = [];
      for (const s of sources) {
        const lines = await em.getRepository(DocumentLine).find({ where: { documentId: s.id }, order: { position: 'ASC', id: 'ASC' } });
        for (const l of lines) {
          const remaining = round(l.quantity - l.processedQty, 3);
          if (remaining <= EPS) continue;
          let quantity = remaining;
          let returnToStock = true;
          if (DOC_META[to].isCredit) {
            if (creditMap.size) {
              const c = creditMap.get(l.id);
              if (!c) continue;
              if (c.quantity - remaining > EPS) throw new BadRequestException(`« ${l.description} » : quantité à créditer (${c.quantity}) supérieure au reste (${remaining}).`);
              quantity = c.quantity;
              returnToStock = c.returnToStock ?? (l.productId != null && l.unitCost != null);
            } else {
              returnToStock = l.productId != null && l.unitCost != null;
            }
          }
          inputs.push({
            productId: l.productId ?? undefined, description: l.description, quantity,
            unitPriceHT: l.unitPriceHT, discountPct: l.discountPct, vatRate: l.vatRate, unit: l.unit ?? undefined,
            lotNumber: l.lotNumber ?? undefined, expiryDate: l.expiryDate ?? undefined, warehouseId: l.warehouseId ?? undefined,
            returnToStock, sourceLineId: l.id, unitCost: l.unitCost,
          });
        }
      }
      if (!inputs.length) throw new BadRequestException('Rien à convertir : toutes les lignes ont déjà été traitées.');
      if (creditMap.size && DOC_META[to].isCredit) {
        const used = new Set(inputs.map((i) => i.sourceLineId));
        for (const k of creditMap.keys()) if (!used.has(k)) throw new BadRequestException(`Ligne ${k} introuvable dans la facture à créditer.`);
      }

      // La facture reprend le stock déjà sorti par les BL / réceptions ; sinon c'est elle qui le mouvemente
      const fromStockDoc = sources.every((s) => ['delivery_note', 'goods_receipt'].includes(s.type));
      const affectsStock = DOC_META[to].isCredit ? true : fromStockDoc ? false : true;
      const meta = DOC_META[to];
      const header: CreateDocumentDto = {
        type: to,
        partyId: first.partyId ?? undefined,
        partyName: first.partyName, partyTaxId: first.partyTaxId ?? undefined, partyAddress: first.partyAddress ?? undefined,
        partyEmail: first.partyEmail ?? undefined, partyPhone: first.partyPhone ?? undefined,
        externalRef: first.externalRef ?? undefined,
        warehouseId: first.warehouseId ?? undefined,
        globalDiscountPct: first.globalDiscountPct,
        withholdingRate: meta.isCredit ? first.withholdingRate : undefined,
        creditedDocumentId: meta.isCredit ? first.id : undefined,
        lines: [],
      } as any;
      return this.createInTx(em, actor, header, {
        lines: inputs,
        affectsStock,
        sources: sources.map((s) => ({ id: s.id, type: s.type, number: s.number })),
        copyParty: first,
      });
    });
    return this.get(actor.userId, newId);
  }

  // ═════════════════════════════ Annulation / décisions ═════════════════════════════

  async cancel(actor: Actor, id: number, reason?: string) {
    await this.ds.transaction(async (em) => {
      const doc = await em.getRepository(Document).findOne({ where: { id, userId: actor.userId }, lock: { mode: 'pessimistic_write' } });
      if (!doc) throw new NotFoundException('Document introuvable');
      const meta = DOC_META[doc.type];
      if (!doc.lockedAt) throw new BadRequestException('Un brouillon se supprime, il ne s’annule pas.');
      if (doc.status === 'cancelled') throw new ConflictException('Document déjà annulé.');
      if (meta.fiscal || meta.settles) throw new BadRequestException('Une facture ou un avoir validé ne peut pas être annulé : émettez un avoir pour la corriger.');
      const lines = await em.getRepository(DocumentLine).find({ where: { documentId: id } });
      if (lines.some((l) => l.processedQty > EPS)) throw new BadRequestException('Ce document a déjà été partiellement traité (livré, reçu ou facturé) : annulez d’abord les documents qui en dépendent.');
      if (doc.type === 'delivery_note' || doc.type === 'goods_receipt') {
        await this.applyStock(em, actor, doc, lines, -1);
        const touched = await this.consumeSources(em, actor.userId, lines, -1);
        for (const sid of touched) {
          const src = await em.getRepository(Document).findOne({ where: { id: sid, userId: actor.userId } });
          if (src && ['converted', 'invoiced', 'received', 'partially_received'].includes(src.status)) {
            src.status = src.type === 'quote' ? 'validated' : src.type === 'purchase_order' ? 'confirmed' : 'delivered';
            await em.getRepository(Document).save(src);
          }
        }
      }
      doc.status = 'cancelled';
      doc.cancelledAt = new Date();
      doc.cancelReason = (reason || '').slice(0, 300) || null;
      await em.getRepository(Document).save(doc);
    });
    return this.get(actor.userId, id);
  }

  async decideQuote(actor: Actor, id: number, status: 'accepted' | 'rejected') {
    const doc = await this.ds.getRepository(Document).findOne({ where: { id, userId: actor.userId } });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.type !== 'quote') throw new BadRequestException('Seul un devis peut être accepté ou refusé.');
    if (!['validated', 'sent'].includes(doc.status)) throw new BadRequestException(`Un devis « ${doc.status} » ne peut plus être ${status === 'accepted' ? 'accepté' : 'refusé'}.`);
    doc.status = status;
    await this.ds.getRepository(Document).save(doc);
    return this.get(actor.userId, id);
  }

  // ═════════════════════════════ Envoi / PDF / e-facture ═════════════════════════════

  async renderPdf(userId: number, id: number) {
    const full = await this.get(userId, id);
    const company = await this.company.getOrCreate(userId);
    const buffer = await this.pdf.render(company, full as any);
    const safe = (full.number || `brouillon-${full.id}`).replace(/[^A-Za-z0-9_.-]/g, '_');
    return { buffer, filename: `${safe}.pdf`, number: full.number };
  }

  async send(actor: Actor, id: number, dto: SendDto) {
    const doc = await this.get(actor.userId, id);
    if (!doc.lockedAt) throw new BadRequestException('Validez le document avant de l’envoyer.');
    const to = (dto.to || doc.partyEmail || '').trim();
    if (!to) throw new BadRequestException('Aucune adresse email : renseignez-la sur la fiche du tiers ou dans la demande.');
    const company = await this.company.getOrCreate(actor.userId);
    const { buffer, filename } = await this.renderPdf(actor.userId, id);
    const label = DOC_META[doc.type as DocumentType].label;
    const amount = (DOC_META[doc.type as DocumentType].settles ? doc.netToPay : doc.totalTTC).toFixed(3);
    const subject = dto.subject || `${label} ${doc.number} — ${company.legalName || ''}`.trim();
    const text =
      dto.message ||
      `Bonjour,\n\nVeuillez trouver ci-joint ${label.toLowerCase() === 'avoir' ? 'l’avoir' : 'la ' + label.toLowerCase()} ${doc.number} d’un montant de ${amount} ${doc.currency}.` +
        (doc.dueDate ? `\nÉchéance : ${String(doc.dueDate).slice(0, 10)}.` : '') +
        `\n\nCordialement,\n${company.legalName || ''}`;
    await this.mail.send({ to, subject, text, attachments: [{ filename, content: buffer, contentType: 'application/pdf' }], replyTo: company.email || undefined });
    await this.ds.getRepository(Document).update({ id, userId: actor.userId }, { sentAt: new Date(), ...(doc.type === 'quote' && doc.status === 'validated' ? { status: 'sent' as DocumentStatus } : {}) });
    return { sent: true, to };
  }

  /** Données structurées de la facture (JSON) prêtes pour une facturation électronique — non certifié TTN. */
  async einvoice(userId: number, id: number) {
    const doc = await this.get(userId, id);
    if (!doc.lockedAt) throw new BadRequestException('Seul un document validé peut être exporté.');
    const company = await this.company.getOrCreate(userId);
    return {
      notice: 'Jeu de données structuré pour la facturation électronique. Il ne remplace pas la transmission certifiée via la plateforme officielle (TTN / El Fatoora).',
      format: 'inovexa-einvoice/1',
      document: { type: doc.type, number: doc.number, issueDate: doc.issueDate, dueDate: doc.dueDate, currency: doc.currency, externalRef: doc.externalRef, creditedDocumentId: doc.creditedDocumentId },
      seller: { name: company.legalName, taxId: company.taxId, tradeRegister: company.tradeRegister, address: [company.address, company.postalCode, company.city, company.country].filter(Boolean).join(', '), email: company.email, phone: company.phone, bankAccount: company.bankAccount },
      buyer: { name: doc.partyName, taxId: doc.partyTaxId, address: doc.partyAddress, email: doc.partyEmail, phone: doc.partyPhone },
      lines: doc.lines.map((l: DocumentLine, i: number) => ({ position: i + 1, sku: l.sku, description: l.description, quantity: l.quantity, unit: l.unit, unitPriceHT: l.unitPriceHT, discountPct: l.discountPct, vatRate: l.vatRate, netHT: l.netHT, vatAmount: l.vatAmount, totalTTC: l.totalTTC })),
      totals: { subtotalHT: doc.subtotalHT, discountTotal: doc.discountTotal, totalHT: doc.totalHT, vat: doc.vatBreakdown, totalVat: doc.totalVat, totalTTC: doc.totalTTC, stampDuty: doc.stampDuty, withholdingRate: doc.withholdingRate, withholdingAmount: doc.withholdingAmount, netToPay: doc.netToPay },
    };
  }

  // ═════════════════════════════ Échéancier ═════════════════════════════

  async setInstallments(actor: Actor, id: number, items: InstallmentDto[]) {
    await this.ds.transaction(async (em) => {
      const doc = await em.getRepository(Document).findOne({ where: { id, userId: actor.userId }, lock: { mode: 'pessimistic_write' } });
      if (!doc) throw new NotFoundException('Document introuvable');
      if (!DOC_META[doc.type].settles || DOC_META[doc.type].isCredit) throw new BadRequestException('Un échéancier ne s’applique qu’à une facture.');
      if (doc.lockedAt && doc.paidAmount > EPS) throw new BadRequestException('Des règlements existent déjà : l’échéancier ne peut plus être modifié.');
      await this.replaceInstallments(em, doc, items);
    });
    return this.get(actor.userId, id);
  }

  private async replaceInstallments(em: EntityManager, doc: Document, items: InstallmentDto[]) {
    const sum = round(items.reduce((s, i) => s + Number(i.amount), 0), 3);
    if (Math.abs(sum - doc.netToPay) > EPS) throw new BadRequestException(`La somme des échéances (${sum}) doit égaler le net à payer (${doc.netToPay}).`);
    await em.getRepository(DocumentInstallment).delete({ documentId: doc.id });
    const sorted = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    await em.getRepository(DocumentInstallment).save(
      sorted.map((i, idx) => em.getRepository(DocumentInstallment).create({ documentId: doc.id, position: idx, dueDate: i.dueDate.slice(0, 10), amount: round(i.amount, 3), paidAmount: 0, label: i.label || null })),
    );
    if (doc.lockedAt) {
      doc.dueDate = sorted[sorted.length - 1].dueDate.slice(0, 10);
      await em.getRepository(Document).save(doc);
    }
  }

  // ═════════════════════════════ Outils internes ═════════════════════════════

  private async lockDraft(em: EntityManager, userId: number, id: number) {
    const doc = await em.getRepository(Document).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (doc.lockedAt) throw new ConflictException('Un document validé n’est plus modifiable. Corrigez-le par un avoir (ou annulez-le s’il s’agit d’un devis, d’un bon de commande, de livraison ou de réception).');
    return doc;
  }

  private async assertWarehouse(em: EntityManager, userId: number, id: number) {
    const wh = await em.getRepository(Warehouse).findOne({ where: { id, userId, isActive: true } });
    if (!wh) throw new BadRequestException('Dépôt introuvable ou inactif.');
  }

  private async loadCreditable(em: EntityManager, userId: number, creditType: DocumentType, creditedId: number) {
    const expected: DocumentType = creditType === 'credit_note' ? 'invoice' : 'supplier_invoice';
    const credited = await em.getRepository(Document).findOne({ where: { id: creditedId, userId } });
    if (!credited) throw new NotFoundException('Facture à créditer introuvable.');
    if (credited.type !== expected) throw new BadRequestException(`Un ${DOC_META[creditType].label.toLowerCase()} corrige une ${DOC_META[expected].label.toLowerCase()}.`);
    if (!credited.lockedAt || credited.status === 'cancelled') throw new BadRequestException('Seule une facture validée peut être corrigée par un avoir.');
    return credited;
  }

  private lineToInput(l: DocumentLine): InputLine {
    return {
      productId: l.productId ?? undefined, description: l.description, quantity: l.quantity, unitPriceHT: l.unitPriceHT,
      discountPct: l.discountPct, vatRate: l.vatRate, unit: l.unit ?? undefined, lotNumber: l.lotNumber ?? undefined,
      expiryDate: l.expiryDate ?? undefined, warehouseId: l.warehouseId ?? undefined, returnToStock: l.returnToStock,
      sourceLineId: l.sourceLineId ?? undefined, unitCost: l.unitCost,
    };
  }

  private async partyOfDoc(em: EntityManager, userId: number, doc: Document): Promise<PartyInfo> {
    if (doc.partyId) {
      const p = await this.loadParty(em, userId, doc.partyType, doc.partyId);
      if (p) return { ...p, name: doc.partyName, taxId: doc.partyTaxId, address: doc.partyAddress, email: doc.partyEmail, phone: doc.partyPhone };
    }
    return { id: doc.partyId, name: doc.partyName, taxId: doc.partyTaxId, address: doc.partyAddress, email: doc.partyEmail, phone: doc.partyPhone, discountPct: 0, withholdingRate: 0, paymentTermsDays: null, priceListId: null, creditLimit: null };
  }

  private async loadParty(em: EntityManager, userId: number, type: 'client' | 'supplier', id: number): Promise<PartyInfo | null> {
    if (type === 'client') {
      const c = await em.getRepository(Client).findOne({ where: { id, userId } });
      if (!c) return null;
      return { id: c.id, name: c.name, taxId: c.taxId, address: c.address || null, email: c.email || null, phone: c.phone || null, discountPct: c.discountPct || 0, withholdingRate: c.withholdingRate || 0, paymentTermsDays: c.paymentTermsDays, priceListId: c.priceListId, creditLimit: c.creditLimit };
    }
    const s = await em.getRepository(Supplier).findOne({ where: { id, userId } });
    if (!s) return null;
    return { id: s.id, name: s.name, taxId: s.taxId, address: s.address || null, email: s.email || null, phone: s.phone || null, discountPct: 0, withholdingRate: s.withholdingRate || 0, paymentTermsDays: s.paymentTermsDays, priceListId: null, creditLimit: null };
  }

  private async resolveParty(
    em: EntityManager,
    userId: number,
    type: 'client' | 'supplier',
    dto: { partyId?: number; partyName?: string; partyTaxId?: string; partyAddress?: string; partyEmail?: string; partyPhone?: string },
    fallback?: Document,
  ): Promise<PartyInfo> {
    let party: PartyInfo | null = null;
    const partyId = dto.partyId ?? fallback?.partyId ?? undefined;
    if (partyId) {
      party = await this.loadParty(em, userId, type, partyId);
      if (!party) throw new BadRequestException(type === 'client' ? 'Client introuvable.' : 'Fournisseur introuvable.');
    } else {
      const name = (dto.partyName ?? fallback?.partyName ?? '').trim();
      if (!name) throw new BadRequestException(type === 'client' ? 'Sélectionnez un client ou saisissez son nom.' : 'Sélectionnez un fournisseur ou saisissez son nom.');
      party = { id: null, name, taxId: null, address: null, email: null, phone: null, discountPct: 0, withholdingRate: 0, paymentTermsDays: null, priceListId: null, creditLimit: null };
    }
    // Les champs saisis sur le document l'emportent sur la fiche (adresse de livraison particulière, par ex.)
    const fb = !dto.partyId && fallback && !dto.partyName ? fallback : null;
    const pick = <K extends 'taxId' | 'address' | 'email' | 'phone'>(key: K, value: string | undefined, fbValue: string | null | undefined) =>
      value !== undefined ? value || null : party![key] ?? (fb ? fbValue ?? null : null);
    if (!partyId && dto.partyName) party.name = dto.partyName.trim();
    party.taxId = pick('taxId', dto.partyTaxId, fb?.partyTaxId);
    party.address = pick('address', dto.partyAddress, fb?.partyAddress);
    party.email = pick('email', dto.partyEmail, fb?.partyEmail);
    party.phone = pick('phone', dto.partyPhone, fb?.partyPhone);
    if (party.taxId) {
      const check = validateTaxId(party.taxId);
      if (!check.valid) throw new BadRequestException(check.message);
      party.taxId = check.normalized || null;
    }
    return party;
  }

  private async saveLines(em: EntityManager, documentId: number, lines: Array<Partial<DocumentLine>>) {
    await em.getRepository(DocumentLine).save(lines.map((l, i) => em.getRepository(DocumentLine).create({ ...l, documentId, position: i } as DeepPartial<DocumentLine>)));
  }

  /** Résout les lignes (produit, prix, remise, TVA) et calcule tous les totaux, timbre et retenue compris. */
  private async price(
    em: EntityManager,
    userId: number,
    type: DocumentType,
    header: Header,
    inputs: InputLine[],
    party: PartyInfo,
    company: Company,
    forceWithholding = false,
  ) {
    const meta = DOC_META[type];
    if (!inputs.length) throw new BadRequestException('Ajoutez au moins une ligne.');
    const ids = [...new Set(inputs.map((l) => l.productId).filter((v): v is number => !!v))];
    const products = ids.length ? await em.getRepository(Product).find({ where: { userId, id: In(ids) } }) : [];
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const pid of ids) if (!byId.has(pid)) throw new BadRequestException(`Produit ${pid} introuvable.`);
    const listPrices = new Map<number, number>();
    if (meta.party === 'client' && party.priceListId && ids.length) {
      const items = await em.getRepository(PriceListItem).find({ where: { priceListId: party.priceListId, productId: In(ids) } });
      for (const it of items) listPrices.set(it.productId, Number(it.price));
    }

    const resolved = inputs.map((l, i) => {
      const p = l.productId ? byId.get(l.productId) : undefined;
      const description = (l.description ?? p?.name ?? '').trim();
      if (!description) throw new BadRequestException(`Ligne ${i + 1} : choisissez un produit ou saisissez une désignation.`);
      let unitPriceHT = l.unitPriceHT;
      if (unitPriceHT === undefined || unitPriceHT === null) {
        if (meta.party === 'client') unitPriceHT = p ? listPrices.get(p.id) ?? Number(p.price) : undefined;
        else unitPriceHT = p ? Number(p.avgCost) || Number(p.price) : undefined;
      }
      if (unitPriceHT === undefined || unitPriceHT === null || !Number.isFinite(Number(unitPriceHT))) throw new BadRequestException(`Ligne ${i + 1} : prix unitaire requis.`);
      const vatRate = Number(l.vatRate ?? p?.vatRate ?? company.defaultVatRate);
      if (!(VAT_RATES as readonly number[]).includes(vatRate)) throw new BadRequestException(`Ligne ${i + 1} : taux de TVA ${vatRate} % non reconnu (taux admis : ${VAT_RATES.join(', ')} %).`);
      const discountPct = Number(l.discountPct ?? (meta.party === 'client' && !meta.isCredit ? party.discountPct : 0)) || 0;
      return {
        productId: p?.id ?? null, sku: p?.sku ?? null, description, quantity: Number(l.quantity), unit: l.unit ?? p?.unit ?? null,
        unitPriceHT: Number(unitPriceHT), discountPct, vatRate, unitCost: l.unitCost ?? null, processedQty: 0,
        lotNumber: l.lotNumber || null, expiryDate: l.expiryDate ? String(l.expiryDate).slice(0, 10) : null,
        warehouseId: l.warehouseId ?? null, returnToStock: l.returnToStock ?? true, sourceLineId: l.sourceLineId ?? null,
      };
    });

    const globalDiscountPct = header.globalDiscountPct ?? 0;
    const base = computeTotals(resolved, { globalDiscountPct });
    const wantStamp = meta.stamp && (header.applyStamp ?? company.stampDutyEnabled) && base.totalTTC > 0;
    const stamp = wantStamp ? stampDutyFor(base.totalTTC, company.stampScale as any, company.stampDutyAmount) : 0;
    const withholdingRate = meta.settles ? header.withholdingRate ?? 0 : 0;
    const t = computeTotals(resolved, {
      globalDiscountPct, stampDuty: stamp, withholdingRate,
      // un avoir d'une facture avec retenue reprend la retenue sans seuil
      withholdingThreshold: forceWithholding ? 0 : company.withholdingThreshold,
    });
    return {
      lines: resolved.map((l, i) => ({ ...l, netHT: t.lines[i].netHT, vatAmount: t.lines[i].vatAmount, totalTTC: t.lines[i].totalTTC })),
      fields: {
        globalDiscountPct, subtotalHT: t.subtotalHT, discountTotal: t.discountTotal, totalHT: t.totalHT, vatBreakdown: t.vatBreakdown,
        totalVat: t.totalVat, totalTTC: t.totalTTC, stampDuty: t.stampDuty, withholdingRate: t.withholdingRate,
        withholdingAmount: t.withholdingAmount, netToPay: t.netToPay, paidAmount: 0, balanceDue: 0,
      },
    };
  }
}
