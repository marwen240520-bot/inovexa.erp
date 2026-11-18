import { DeepPartial, EntityManager } from 'typeorm';
import { computeTotals, round } from '../../common/money';
import { stampDutyFor } from '../../common/fiscal';
import { Company } from '../company/company.entity';
import { DEFAULT_NUMBERING } from '../company/company.service';
import { Document, DocumentStatus, DocumentType, PaymentStatus } from '../documents/entities/document.entity';
import { DocumentLine } from '../documents/entities/document-line.entity';
import { Payment } from '../documents/entities/payment.entity';
import { DOC_META } from '../documents/documents.types';
import { Invoice } from '../invoices/entities/invoice.entity';

/**
 * Données de démonstration du module « Factures & devis » (moteur de documents commerciaux) :
 * devis, bons de livraison, factures, avoirs, bons de commande, bons de réception, factures fournisseurs
 * et règlements, répartis sur la même période que les autres modules.
 *
 * Règles respectées pour que les données se comportent comme des documents saisis dans l'application :
 *  - numéros légaux continus PAR TYPE ET PAR ANNÉE, dans l'ordre chronologique des dates (comme à la validation) ;
 *  - compteurs `number_sequences` mis à jour : le prochain document validé prend le numéro suivant, sans doublon ;
 *  - totaux calculés par `computeTotals` (millimes, TVA par taux, timbre fiscal) exactement comme le moteur ;
 *  - chaque facture / avoir validé a son reflet dans l'ancienne table `invoices` (colonne `documentId`) :
 *    tableau de bord et objectifs restent cohérents, et la reprise des anciennes factures ne crée pas de doublon ;
 *  - aucune écriture comptable ni mouvement de stock : il s'agit d'un historique (comme la reprise des anciennes factures).
 *  - les derniers documents restent en BROUILLON pour qu'on puisse tester la validation.
 */

type Party = { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null; taxId?: string | null };
type Prod = { id: number; name: string; sku?: string | null; price: number | string; unit?: string | null; vatRate?: number | string | null };

export interface DemoDocumentsInput {
  userId: number;
  clients: Party[];
  suppliers: Party[];
  products: Prod[];
  /** Nombre de factures (clients + fournisseurs). */
  invoiceCount: number;
  /** Nombre des autres pièces (devis, BL, bons de commande, bons de réception). */
  otherCount: number;
  /** Date du i-ème élément sur n (le plus ancien d'abord, le dernier = hier). */
  dateAt: (i: number, n: number) => Date;
}

export interface DemoDocumentsResult {
  documents: Document[];
  payments: Payment[];
  /** Reflets dans l'ancienne table `invoices` (lus par le tableau de bord et les objectifs). */
  invoices: Invoice[];
  byType: Record<string, number>;
}

const CHUNK = { chunk: 100 };
const pad = (n: number, size = 5) => String(n).padStart(size, '0');
const pick = <T>(list: readonly T[], i: number): T => list[((i % list.length) + list.length) % list.length];
const iso = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const addDays = (d: Date, days: number) => { const x = new Date(d); x.setDate(x.getDate() + days); return x; };
const yesterday = () => { const d = new Date(); d.setHours(10, 0, 0, 0); d.setDate(d.getDate() - 1); return d; };
const minDate = (a: Date, b: Date) => (a.getTime() < b.getTime() ? a : b);

const CLIENT_METHODS = ['transfer', 'check', 'cash', 'card', 'transfer', 'draft', 'mobile'] as const;
const SUPPLIER_METHODS = ['transfer', 'check', 'transfer', 'draft', 'cash'] as const;
const LEGACY_METHOD: Record<string, string> = { transfer: 'transfer', check: 'check', cash: 'cash', card: 'card', draft: 'draft', mobile: 'mobile' };
const DISCOUNTS = [0, 0, 0, 5, 0, 10, 0, 0, 2.5, 0];
const QUOTE_NOTES = ['Offre valable 30 jours.', 'Livraison sous 7 jours ouvrés après accord.', 'Prix fermes, hors frais de transport.', null, null];
const CLIENT_REFS = ['BC-CLI-', 'CMD-', 'PO-', null, null, null];

interface Spec {
  type: DocumentType;
  date: Date;
  party: Party;
  partyType: 'client' | 'supplier';
  lines: Array<{ product: Prod; quantity: number; unitPriceHT: number; discountPct: number; vatRate: number }>;
  status: DocumentStatus;
  draft: boolean;
  /** Part réglée : 1 = payée, 0 < x < 1 = partielle, 0 = non réglée. */
  paidShare: number;
  validUntil?: string | null;
  externalRef?: string | null;
  notes?: string | null;
  /** Pour un avoir : index (dans specs) de la facture corrigée. */
  creditOf?: number;
  /** Pour un BL / bon de réception : index du document d'origine. */
  sourceOf?: number;
  i: number;
}

export async function seedDemoDocuments(manager: EntityManager, input: DemoDocumentsInput): Promise<DemoDocumentsResult> {
  const { userId, clients, suppliers, products } = input;
  const empty: DemoDocumentsResult = { documents: [], payments: [], invoices: [], byType: {} };
  if (!clients.length || !suppliers.length || !products.length) return empty;

  const company = await manager.getRepository(Company).findOne({ where: { userId } });
  const prefixFor = (key: string) => {
    const custom = company?.numbering?.[key];
    return (custom && String(custom).trim().toUpperCase().slice(0, 10)) || DEFAULT_NUMBERING[key] || key.toUpperCase().slice(0, 4);
  };
  const stampEnabled = company ? company.stampDutyEnabled !== false : true;
  const stampFor = (ttc: number) => (stampEnabled ? stampDutyFor(ttc, (company?.stampScale as any) || 'flat', Number(company?.stampDutyAmount ?? 1)) : 0);
  const termsDays = Number(company?.defaultPaymentTermsDays) || 30;
  const quoteDays = Number(company?.quoteValidityDays) || 30;
  const lastDay = yesterday();

  const makeLines = (i: number, supplier: boolean) => {
    const count = 1 + (i % 4);
    return Array.from({ length: count }, (_, k) => {
      const product = products[(i * 7 + k * 13) % products.length];
      const price = Number(product.price) || 1;
      const rate = Number(product.vatRate ?? 19);
      return {
        product,
        quantity: supplier ? 5 + ((i + k * 3) % 16) : 1 + ((i * 3 + k) % 5),
        unitPriceHT: supplier ? round(price * (0.55 + 0.01 * ((i + k) % 8)), 3) : round(price, 3),
        discountPct: supplier ? 0 : pick(DISCOUNTS, i + k),
        vatRate: [0, 7, 13, 19].includes(rate) ? rate : 19,
      };
    });
  };

  // ───────────── 1. Plan des pièces ─────────────
  const specs: Spec[] = [];
  const nInv = Math.max(1, input.invoiceCount);
  const nClientInv = Math.max(1, Math.round(nInv * 0.75));
  const nSupplierInv = Math.max(1, nInv - nClientInv);
  const nOther = Math.max(4, input.otherCount);
  const nQuotes = Math.round(nOther * 0.45);
  const nDelivery = Math.round(nOther * 0.2);
  const nPO = Math.round(nOther * 0.2);
  const nReceipts = Math.max(1, nOther - nQuotes - nDelivery - nPO);

  const paidShareFor = (due: Date, i: number, supplier: boolean): number => {
    const r = (i * 37) % 100;
    if (due.getTime() < Date.now()) {
      // échéance passée : la plupart réglées, quelques impayés (factures en retard) et règlements partiels
      if (r < (supplier ? 90 : 82)) return 1;
      if (r < (supplier ? 95 : 91)) return 0.3 + 0.1 * (i % 4);
      return 0;
    }
    if (r < 38) return 1;
    if (r < 55) return 0.4;
    return 0;
  };

  // Factures clients (les 3 plus récentes restent en brouillon)
  for (let i = 0; i < nClientInv; i++) {
    const date = input.dateAt(i, nClientInv);
    const draft = i >= nClientInv - 3;
    const due = addDays(date, termsDays);
    specs.push({
      type: 'invoice', date, party: clients[(i * 7) % clients.length], partyType: 'client', lines: makeLines(i, false),
      status: draft ? 'draft' : 'validated', draft, paidShare: draft ? 0 : paidShareFor(due, i, false),
      externalRef: (() => { const p = pick(CLIENT_REFS, i); return p ? `${p}${pad(1000 + i, 4)}` : null; })(), i,
    });
  }
  // Avoirs : environ une facture validée sur 25 est corrigée par un avoir partiel quelques jours plus tard
  const invoiceIdx = specs.map((s, k) => (s.type === 'invoice' && !s.draft ? k : -1)).filter((k) => k >= 0);
  invoiceIdx.forEach((k, n) => {
    if (n % 25 !== 12) return;
    const src = specs[k];
    const date = minDate(addDays(src.date, 3 + (n % 9)), lastDay);
    const first = src.lines[0];
    specs.push({
      type: 'credit_note', date, party: src.party, partyType: 'client',
      lines: [{ ...first, quantity: 1 }], status: 'validated', draft: false, paidShare: n % 2 ? 1 : 0,
      notes: n % 2 ? 'Retour marchandise — remboursé.' : 'Geste commercial suite à un article défectueux.', creditOf: k, i: n,
    });
  });
  // Factures fournisseurs (la plus récente reste en brouillon)
  for (let i = 0; i < nSupplierInv; i++) {
    const date = input.dateAt(i, nSupplierInv);
    const draft = i === nSupplierInv - 1;
    const due = addDays(date, termsDays);
    specs.push({
      type: 'supplier_invoice', date, party: suppliers[(i * 5) % suppliers.length], partyType: 'supplier', lines: makeLines(i + 3, true),
      status: draft ? 'draft' : 'validated', draft, paidShare: draft ? 0 : paidShareFor(due, i, true),
      externalRef: `FAC-FRS-${pad(2000 + i, 5)}`, i,
    });
  }
  // Devis : historique accepté / refusé / expiré, récents envoyés, 2 brouillons
  for (let i = 0; i < nQuotes; i++) {
    const date = input.dateAt(i, nQuotes);
    const draft = i >= nQuotes - 2;
    const validUntil = iso(addDays(date, quoteDays));
    const recent = addDays(date, quoteDays).getTime() >= Date.now();
    const r = (i * 29) % 10;
    const status: DocumentStatus = draft ? 'draft' : recent ? (r < 3 ? 'accepted' : 'validated') : r < 5 ? 'accepted' : r < 8 ? 'rejected' : 'expired';
    specs.push({
      type: 'quote', date, party: clients[(i * 11 + 3) % clients.length], partyType: 'client', lines: makeLines(i + 1, false),
      status, draft, paidShare: 0, validUntil, notes: pick(QUOTE_NOTES, i), i,
    });
  }
  // Bons de livraison
  for (let i = 0; i < nDelivery; i++) {
    const date = input.dateAt(i, nDelivery);
    const draft = i === nDelivery - 1;
    specs.push({
      type: 'delivery_note', date, party: clients[(i * 13 + 5) % clients.length], partyType: 'client', lines: makeLines(i + 2, false),
      status: draft ? 'draft' : 'delivered', draft, paidShare: 0, i,
    });
  }
  // Bons de commande fournisseurs, puis bons de réception rattachés à une partie d'entre eux
  const poStart = specs.length;
  for (let i = 0; i < nPO; i++) {
    const date = input.dateAt(i, nPO);
    const draft = i === nPO - 1;
    specs.push({
      type: 'purchase_order', date, party: suppliers[(i * 3 + 1) % suppliers.length], partyType: 'supplier', lines: makeLines(i + 5, true),
      status: draft ? 'draft' : 'confirmed', draft, paidShare: 0, i,
    });
  }
  for (let i = 0; i < nReceipts; i++) {
    const poIndex = poStart + Math.min(nPO - 2, Math.floor((i * Math.max(1, nPO - 1)) / nReceipts));
    const po = specs[poIndex];
    if (!po || po.draft || po.type !== 'purchase_order') continue;
    po.status = 'received';
    specs.push({
      type: 'goods_receipt', date: minDate(addDays(po.date, 2 + (i % 5)), lastDay), party: po.party, partyType: 'supplier',
      lines: po.lines.map((l) => ({ ...l })), status: 'received', draft: false, paidShare: 0, sourceOf: poIndex, i,
    });
  }

  // ───────────── 2. Numérotation chronologique par type et par année ─────────────
  const order = specs.map((_, k) => k).sort((a, b) => specs[a].date.getTime() - specs[b].date.getTime() || a - b);
  const counters = new Map<string, number>();
  const currentValue = async (key: string, year: number) => {
    const id = `${key}:${year}`;
    if (!counters.has(id)) {
      const rows: Array<{ lastValue: number }> = await manager.query(
        `SELECT "lastValue" FROM "number_sequences" WHERE "userId" = $1 AND "key" = $2 AND "year" = $3`, [userId, key, year],
      );
      counters.set(id, rows.length ? Number(rows[0].lastValue) : 0);
    }
    return id;
  };
  const numbers: Array<string | null> = specs.map(() => null);
  for (const k of order) {
    const s = specs[k];
    if (s.draft) continue;
    const key = DOC_META[s.type].numberingKey;
    const year = s.date.getFullYear();
    const id = await currentValue(key, year);
    const next = counters.get(id)! + 1;
    counters.set(id, next);
    numbers[k] = `${prefixFor(key)}-${year}-${pad(next)}`;
  }

  // ───────────── 3. Documents ─────────────
  const priced = specs.map((s) => {
    const meta = DOC_META[s.type];
    const base = computeTotals(s.lines);
    const stamp = meta.stamp && base.totalTTC > 0 ? stampFor(base.totalTTC) : 0;
    const t = computeTotals(s.lines, { stampDuty: stamp });
    return t;
  });

  const docEntities = specs.map((s, k) => {
    const meta = DOC_META[s.type];
    const t = priced[k];
    const issueDate = iso(s.date);
    const validatedAt = s.draft ? null : new Date(`${issueDate}T10:00:00`);
    const paidAmount = meta.settles && !s.draft ? round(t.netToPay * Math.min(1, s.paidShare), 3) : 0;
    const paymentStatus: PaymentStatus = !meta.settles || s.draft ? 'none' : paidAmount >= t.netToPay - 0.0005 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
    return manager.create(Document, {
      userId,
      type: s.type,
      number: numbers[k],
      status: s.status,
      paymentStatus,
      partyType: s.partyType,
      partyId: s.party.id,
      partyName: s.party.name,
      partyTaxId: s.party.taxId || null,
      partyAddress: s.party.address || null,
      partyEmail: s.party.email || null,
      partyPhone: s.party.phone || null,
      issueDate,
      dueDate: meta.settles && !meta.isCredit ? iso(addDays(s.date, termsDays)) : null,
      validUntil: s.type === 'quote' ? s.validUntil ?? null : null,
      currency: company?.currency || 'TND',
      paymentTerms: meta.settles && !meta.isCredit ? `${termsDays} jours` : null,
      externalRef: s.externalRef ?? null,
      warehouseId: null,
      notes: s.notes ?? null,
      footer: company?.invoiceFooter || null,
      globalDiscountPct: 0,
      subtotalHT: t.subtotalHT,
      discountTotal: t.discountTotal,
      totalHT: t.totalHT,
      vatBreakdown: t.vatBreakdown,
      totalVat: t.totalVat,
      totalTTC: t.totalTTC,
      stampDuty: t.stampDuty,
      withholdingRate: 0,
      withholdingAmount: 0,
      netToPay: t.netToPay,
      paidAmount,
      balanceDue: meta.settles && !s.draft ? round(t.netToPay - paidAmount, 3) : 0,
      sources: null,
      creditedDocumentId: null,
      // Historique : aucun mouvement de stock n'a été passé pour les pièces validées de démonstration
      affectsStock: s.draft,
      validatedAt,
      validatedBy: s.draft ? null : userId,
      lockedAt: validatedAt,
      sentAt: s.type === 'quote' && !s.draft ? validatedAt : null,
      cancelledAt: null,
      cancelReason: null,
      createdBy: userId,
      createdAt: new Date(`${issueDate}T09:00:00`),
    } as DeepPartial<Document>);
  });
  const documents = await manager.save(Document, docEntities, CHUNK);

  // Chaînage : avoir -> facture d'origine, bon de réception -> bon de commande
  const linked: Document[] = [];
  specs.forEach((s, k) => {
    const srcIndex = s.creditOf ?? s.sourceOf;
    if (srcIndex === undefined) return;
    const src = documents[srcIndex];
    documents[k].sources = [{ id: src.id, type: src.type, number: src.number }];
    if (s.creditOf !== undefined) documents[k].creditedDocumentId = src.id;
    linked.push(documents[k]);
  });
  if (linked.length) await manager.save(Document, linked, CHUNK);

  // ───────────── 4. Lignes ─────────────
  const lineEntities: DocumentLine[] = [];
  specs.forEach((s, k) => {
    const t = priced[k];
    s.lines.forEach((l, pos) => {
      lineEntities.push(manager.create(DocumentLine, {
        documentId: documents[k].id,
        position: pos,
        productId: l.product.id,
        sku: l.product.sku || null,
        description: l.product.name,
        quantity: l.quantity,
        unit: l.product.unit || 'pièce',
        unitPriceHT: l.unitPriceHT,
        discountPct: l.discountPct,
        vatRate: l.vatRate,
        netHT: t.lines[pos].netHT,
        vatAmount: t.lines[pos].vatAmount,
        totalTTC: t.lines[pos].totalTTC,
        unitCost: null,
        // un bon de commande réceptionné est entièrement traité
        processedQty: s.type === 'purchase_order' && s.status === 'received' ? l.quantity : 0,
        lotNumber: null,
        expiryDate: null,
        warehouseId: null,
        returnToStock: true,
        sourceLineId: null,
      } as DeepPartial<DocumentLine>));
    });
  });
  await manager.save(DocumentLine, lineEntities, CHUNK);

  // ───────────── 5. Règlements (numérotés dans l'ordre des dates) ─────────────
  type PaySpec = { k: number; date: Date; amount: number; method: string };
  const paySpecs: PaySpec[] = [];
  specs.forEach((s, k) => {
    const d = documents[k];
    if (!DOC_META[s.type].settles || s.draft || !(d.paidAmount > 0)) return;
    const methods = s.partyType === 'client' ? CLIENT_METHODS : SUPPLIER_METHODS;
    const payDate = (offset: number) => { const x = minDate(addDays(s.date, offset), lastDay); return x.getTime() < s.date.getTime() ? s.date : x; };
    const method = DOC_META[s.type].isCredit ? 'transfer' : pick(methods, s.i);
    // les factures soldées en deux fois (une sur six) reçoivent un acompte puis le solde
    if (d.paymentStatus === 'paid' && s.i % 6 === 2 && d.paidAmount > 10) {
      const first = round(d.paidAmount * 0.4, 3);
      paySpecs.push({ k, date: payDate(3 + (s.i % 7)), amount: first, method });
      paySpecs.push({ k, date: payDate(12 + (s.i % 15)), amount: round(d.paidAmount - first, 3), method: pick(methods, s.i + 1) });
    } else {
      paySpecs.push({ k, date: payDate(d.paymentStatus === 'paid' ? 5 + (s.i % 20) : 4 + (s.i % 6)), amount: d.paidAmount, method });
    }
  });
  paySpecs.sort((a, b) => a.date.getTime() - b.date.getTime() || a.k - b.k);
  const lastMethod = new Map<number, string>();
  const payEntities: Payment[] = [];
  for (const p of paySpecs) {
    const year = p.date.getFullYear();
    const id = await currentValue('payment', year);
    const next = counters.get(id)! + 1;
    counters.set(id, next);
    const doc = documents[p.k];
    lastMethod.set(p.k, p.method);
    payEntities.push(manager.create(Payment, {
      userId,
      documentId: doc.id,
      number: `${prefixFor('payment')}-${year}-${pad(next)}`,
      partyType: doc.partyType,
      amount: p.amount,
      method: p.method,
      date: iso(p.date),
      reference: p.method === 'check' ? `CHQ ${pad(400000 + p.k * 7, 7)}` : p.method === 'transfer' ? `VIR-${iso(p.date).replace(/-/g, '')}-${pad(p.k, 4)}` : p.method === 'draft' ? `TRT-${pad(p.k, 5)}` : null,
      bankAccountId: null,
      creditNoteId: null,
      notes: DOC_META[doc.type].isCredit ? 'Remboursement de l’avoir' : null,
      createdBy: userId,
      voidedAt: null,
      voidReason: null,
      createdAt: new Date(`${iso(p.date)}T11:00:00`),
    } as DeepPartial<Payment>));
  }
  const payments = payEntities.length ? await manager.save(Payment, payEntities, CHUNK) : [];

  // ───────────── 6. Compteurs de numérotation ─────────────
  for (const [id, value] of counters) {
    if (!value) continue;
    const [key, year] = id.split(':');
    await manager.query(
      `INSERT INTO "number_sequences" ("userId", "key", "year", "lastValue") VALUES ($1, $2, $3, $4)
       ON CONFLICT ("userId", "key", "year") DO UPDATE SET "lastValue" = GREATEST("number_sequences"."lastValue", EXCLUDED."lastValue")`,
      [userId, key, Number(year), value],
    );
  }

  // ───────────── 7. Reflets dans l'ancienne table « invoices » ─────────────
  const mirrors: Invoice[] = [];
  specs.forEach((s, k) => {
    const meta = DOC_META[s.type];
    const d = documents[k];
    if (!meta.settles || s.draft) return;
    const sign = meta.isCredit ? -1 : 1;
    const client = meta.party === 'client';
    const dominantVat = (d.vatBreakdown || []).slice().sort((a, b) => b.baseHT - a.baseHT)[0]?.rate ?? 0;
    const method = lastMethod.get(k);
    mirrors.push(manager.create(Invoice, {
      userId,
      operationNumber: `${d.number}#${userId}`,
      reference: d.number || String(d.id),
      type: client ? 'debit' : 'credit',
      clientId: client ? d.partyId : null,
      supplierId: client ? null : d.partyId,
      clientName: client ? d.partyName : null,
      supplierName: client ? null : d.partyName,
      clientEmail: d.partyEmail || null,
      clientAddress: d.partyAddress || null,
      clientPhone: d.partyPhone || null,
      description: `${meta.label} ${d.number}`,
      items: s.lines.map((l, pos) => ({
        description: l.product.name, quantity: sign * l.quantity, unitPrice: l.unitPriceHT, unitPriceHT: l.unitPriceHT,
        vatRate: l.vatRate, total: sign * priced[k].lines[pos].netHT, totalHT: sign * priced[k].lines[pos].netHT, totalTTC: sign * priced[k].lines[pos].totalTTC,
      })),
      subtotalHT: sign * d.totalHT,
      taxRate: dominantVat,
      taxAmount: sign * d.totalVat,
      amount: sign * d.totalTTC,
      dueDate: d.dueDate ? new Date(`${d.dueDate}T00:00:00Z`) : null,
      paymentTerms: d.paymentTerms || `${termsDays} jours`,
      notes: d.notes || null,
      status: d.paymentStatus === 'paid' ? 'paid' : !meta.isCredit && d.dueDate && new Date(`${d.dueDate}T23:59:59`).getTime() < Date.now() ? 'overdue' : 'pending',
      paymentMethod: method ? LEGACY_METHOD[method] || 'transfer' : null,
      documentId: d.id,
      createdAt: new Date(`${d.issueDate}T10:00:00`),
    } as DeepPartial<Invoice>));
  });
  const invoices = mirrors.length ? await manager.save(Invoice, mirrors, CHUNK) : [];

  const byType: Record<string, number> = {};
  for (const d of documents) byType[d.type] = (byType[d.type] || 0) + 1;
  return { documents, payments, invoices, byType };
}
