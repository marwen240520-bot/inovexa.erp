import { Injectable } from '@nestjs/common';
import { DeepPartial, EntityManager } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentLine } from './entities/document-line.entity';
import { DOC_META } from './documents.types';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';

/**
 * Les écrans historiques (tableau de bord, ventes, achats, anciennes factures) lisent les tables `invoices`,
 * `sales` et `purchases`. Chaque facture / avoir validé y laisse donc un REFLET (colonne `documentId`) :
 * les chiffres restent cohérents sans réécrire ces écrans. Le document commercial reste la source de vérité.
 *
 * Les ventes et achats sont reflétés en HT (comme les prix du catalogue), les avoirs en négatif.
 */
@Injectable()
export class LegacyMirrorService {
  async onValidated(em: EntityManager, doc: Document, lines: DocumentLine[]) {
    const meta = DOC_META[doc.type];
    if (!meta.settles) return; // devis, bons de livraison / commande / réception : pas de reflet
    const sign = meta.isCredit ? -1 : 1;
    const client = meta.party === 'client';
    const dominantVat = (doc.vatBreakdown || []).slice().sort((a, b) => b.baseHT - a.baseHT)[0]?.rate ?? 0;

    await em.getRepository(Invoice).save(
      em.getRepository(Invoice).create({
        userId: doc.userId,
        // `operationNumber` est unique sur toute la base : on le préfixe par la société
        operationNumber: `${doc.number}#${doc.userId}`,
        reference: doc.number || String(doc.id),
        type: client ? 'debit' : 'credit',
        clientId: client ? doc.partyId : null,
        supplierId: client ? null : doc.partyId,
        clientName: client ? doc.partyName : undefined,
        supplierName: client ? undefined : doc.partyName,
        clientEmail: doc.partyEmail || undefined,
        clientAddress: doc.partyAddress || undefined,
        clientPhone: doc.partyPhone || undefined,
        clientSiret: doc.partyTaxId || undefined,
        description: `${DOC_META[doc.type].label} ${doc.number}`,
        items: lines.map((l) => ({ description: l.description, quantity: sign * l.quantity, unitPrice: l.unitPriceHT, vatRate: l.vatRate, total: sign * l.netHT })),
        subtotalHT: sign * doc.totalHT,
        amount: sign * doc.totalTTC,
        taxRate: dominantVat,
        taxAmount: sign * doc.totalVat,
        dueDate: doc.dueDate ? new Date(`${String(doc.dueDate).slice(0, 10)}T00:00:00Z`) : null,
        paymentTerms: doc.paymentTerms || 'Net 30',
        notes: doc.notes || undefined,
        status: 'pending',
        documentId: doc.id,
      } as any),
    );

    if (client) {
      const rows = lines
        .filter((l) => l.productId)
        .map((l) =>
          em.getRepository(Sale).create({
            userId: doc.userId, productId: l.productId!, clientName: doc.partyName, productName: l.description.slice(0, 250),
            quantity: sign * l.quantity, unitPrice: l.quantity ? l.netHT / l.quantity : 0, total: sign * l.netHT,
            status: 'pending', documentId: doc.id,
          } as DeepPartial<Sale>),
        );
      if (rows.length) await em.getRepository(Sale).save(rows);
    } else {
      const rows = lines
        .filter((l) => l.productId)
        .map((l) =>
          em.getRepository(Purchase).create({
            userId: doc.userId, productId: l.productId!, productName: l.description.slice(0, 250), supplierName: doc.partyName,
            quantity: sign * l.quantity, unitPrice: l.quantity ? l.netHT / l.quantity : 0, total: sign * l.netHT,
            status: 'pending', documentId: doc.id,
          } as DeepPartial<Purchase>),
        );
      if (rows.length) await em.getRepository(Purchase).save(rows);
    }
  }

  /** Répercute l'état de règlement (payé / en attente) et le dernier moyen de paiement sur les reflets. */
  async onPaymentChange(em: EntityManager, doc: Document, lastMethod: string | null) {
    if (!DOC_META[doc.type].settles) return;
    const status = doc.paymentStatus === 'paid' ? 'paid' : 'pending';
    await em.getRepository(Invoice).update({ documentId: doc.id }, { status, paymentMethod: lastMethod });
    const table = DOC_META[doc.type].party === 'client' ? Sale : Purchase;
    await em.getRepository(table as any).update({ documentId: doc.id } as any, { status, paymentMethod: lastMethod } as any);
  }
}
