import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentLine } from './entities/document-line.entity';
import { Payment, PAYMENT_METHODS } from './entities/payment.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { round } from '../../common/money';

/**
 * Reprise des factures de l'ancien module (`invoices` saisies à la main ou importées d'Excel) dans le moteur
 * de documents, qui devient l'unique source de vérité.
 *
 * Chaque ancienne facture sans `documentId` devient un document **validé et figé** :
 *  - type `invoice` (vente) ou `supplier_invoice` (achat) selon l'ancien sens débit / crédit ;
 *  - le numéro d'origine est conservé (pas de renumérotation : il a pu être communiqué au client) ;
 *  - les montants sont repris tels quels (pas de recalcul, pas d'écriture comptable, pas de mouvement de stock :
 *    il s'agit d'historique, déjà traité dans l'ancien système) ;
 *  - une facture marquée payée reçoit un règlement « repris » daté de sa dernière mise à jour ;
 *  - `sources` garde la trace de l'origine (`legacy_invoice`).
 *
 * Idempotent : l'ancienne ligne reçoit le `documentId` et devient un simple reflet (comme les nouveaux documents).
 */
@Injectable()
export class LegacyImportService {
  private done = new Set<number>();

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /** Appelée à la première consultation des documents après le démarrage : reprise silencieuse. */
  async ensure(userId: number) {
    if (this.done.has(userId)) return;
    this.done.add(userId);
    try {
      await this.importAll(userId);
    } catch (e) {
      this.done.delete(userId);
      // eslint-disable-next-line no-console
      console.error(`[documents] reprise des anciennes factures impossible pour la société ${userId}:`, (e as Error).message);
    }
  }

  async importAll(userId: number) {
    const pending = await this.ds.getRepository(Invoice).find({ where: { userId, documentId: IsNull() }, order: { createdAt: 'ASC', id: 'ASC' } });
    let imported = 0;
    const skipped: Array<{ id: number; reason: string }> = [];
    for (const inv of pending) {
      try {
        await this.ds.transaction((em) => this.importOne(em, inv));
        imported++;
      } catch (e) {
        skipped.push({ id: inv.id, reason: (e as Error).message });
      }
    }
    return { imported, skipped, remaining: skipped.length };
  }

  private async importOne(em: EntityManager, inv: Invoice) {
    const client = inv.type !== 'credit';
    const type = client ? 'invoice' : 'supplier_invoice';
    const items: any[] = Array.isArray(inv.items) ? inv.items : [];
    const issueDate = toDate(inv.createdAt) || toDate(new Date())!;
    const totalHT = round(Number(inv.subtotalHT) || 0, 3);
    const totalTTC = round(Number(inv.amount) || 0, 3);
    const totalVat = round(Number(inv.taxAmount) || Math.max(0, totalTTC - totalHT), 3);
    const paid = inv.status === 'paid';
    const cancelled = inv.status === 'cancelled';
    const number = await this.uniqueNumber(em, inv.userId, type, (inv.reference || inv.operationNumber || `FAC-${inv.id}`).trim().slice(0, 36));

    const lines: Array<Partial<DocumentLine>> = (items.length ? items : [{ description: inv.description || number, quantity: 1, unitPrice: totalHT, vatRate: inv.taxRate, total: totalHT }])
      .map((it, i) => {
        const quantity = round(Math.abs(Number(it.quantity) || 1), 3);
        const total = round(Number(it.total ?? it.totalHT ?? (Number(it.unitPrice) || 0) * quantity), 3);
        const vatRate = round(Number(it.vatRate ?? inv.taxRate) || 0, 2);
        return {
          position: i,
          description: String(it.description || it.name || inv.description || number).slice(0, 2000),
          quantity,
          unitPriceHT: round(Number(it.unitPrice) || (quantity ? total / quantity : 0), 3),
          discountPct: 0,
          vatRate,
          netHT: total,
          vatAmount: round(total * vatRate / 100, 3),
          totalTTC: round(total * (1 + vatRate / 100), 3),
          returnToStock: false,
          processedQty: 0,
        };
      });
    const rateBreakdown = new Map<number, { rate: number; baseHT: number; vatAmount: number }>();
    for (const l of lines) {
      const b = rateBreakdown.get(l.vatRate!) || { rate: l.vatRate!, baseHT: 0, vatAmount: 0 };
      b.baseHT = round(b.baseHT + l.netHT!, 3);
      b.vatAmount = round(b.vatAmount + l.vatAmount!, 3);
      rateBreakdown.set(l.vatRate!, b);
    }

    const doc = await em.getRepository(Document).save(
      em.getRepository(Document).create({
        userId: inv.userId,
        type,
        number,
        status: cancelled ? 'cancelled' : 'validated',
        paymentStatus: cancelled ? 'none' : paid ? 'paid' : 'unpaid',
        partyType: client ? 'client' : 'supplier',
        partyId: client ? inv.clientId : inv.supplierId,
        partyName: (client ? inv.clientName : inv.supplierName) || (client ? 'Client' : 'Fournisseur'),
        partyTaxId: inv.clientSiret || null,
        partyAddress: inv.clientAddress || null,
        partyEmail: inv.clientEmail || null,
        partyPhone: inv.clientPhone || null,
        issueDate,
        dueDate: toDate(inv.dueDate),
        validUntil: null,
        currency: 'TND',
        paymentTerms: inv.paymentTerms || null,
        externalRef: inv.operationNumber?.slice(0, 80) || null,
        warehouseId: null,
        notes: inv.notes || null,
        footer: null,
        globalDiscountPct: 0,
        subtotalHT: totalHT,
        discountTotal: 0,
        totalHT,
        vatBreakdown: [...rateBreakdown.values()],
        totalVat,
        totalTTC,
        stampDuty: 0,
        withholdingRate: 0,
        withholdingAmount: 0,
        netToPay: totalTTC,
        paidAmount: paid ? totalTTC : 0,
        balanceDue: paid || cancelled ? 0 : totalTTC,
        sources: [{ id: inv.id, type: 'legacy_invoice', number: inv.operationNumber || null }],
        creditedDocumentId: null,
        affectsStock: false,
        validatedAt: inv.createdAt,
        validatedBy: null,
        lockedAt: inv.createdAt,
        sentAt: null,
        cancelledAt: cancelled ? inv.updatedAt : null,
        cancelReason: cancelled ? 'Annulée dans l’ancien module Factures' : null,
        createdBy: null,
      } as Partial<Document>),
    );
    await em.getRepository(DocumentLine).save(lines.map((l) => em.getRepository(DocumentLine).create({ ...l, documentId: doc.id })));

    if (paid && totalTTC > 0) {
      await em.getRepository(Payment).save(
        em.getRepository(Payment).create({
          userId: inv.userId, documentId: doc.id, number: null, partyType: client ? 'client' : 'supplier', amount: totalTTC,
          method: (PAYMENT_METHODS as readonly string[]).includes(inv.paymentMethod || '') && inv.paymentMethod !== 'credit_note' ? inv.paymentMethod! : 'other',
          date: maxDate(toDate(inv.updatedAt), issueDate), reference: 'Reprise ancien module',
          bankAccountId: null, creditNoteId: null, notes: null, createdBy: null,
        }),
      );
    }
    await em.query(`UPDATE "invoices" SET "documentId" = $1 WHERE "id" = $2`, [doc.id, inv.id]);
  }

  /** Les numéros de l'ancien module n'étaient pas contrôlés : on garde l'original et on suffixe seulement en cas de doublon. */
  private async uniqueNumber(em: EntityManager, userId: number, type: string, wanted: string) {
    let candidate = wanted || 'FAC';
    for (let i = 2; i < 1000; i++) {
      const [row] = await em.query(`SELECT 1 FROM "documents" WHERE "userId" = $1 AND "type" = $2 AND "number" = $3`, [userId, type, candidate]);
      if (!row) return candidate;
      candidate = `${wanted}-${i}`;
    }
    throw new Error(`Numéro ${wanted} déjà utilisé trop de fois`);
  }
}

/** La plus tardive des deux dates : un règlement ne peut pas précéder la pièce. */
const maxDate = (a: string | null, b: string) => (a && a > b ? a : b);

/** Date calendaire (fuseau du serveur) : un `timestamp` lu à minuit ne doit pas reculer d'un jour en passant par l'UTC. */
function toDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
