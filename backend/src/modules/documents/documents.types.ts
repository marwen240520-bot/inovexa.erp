import { DocumentType } from './entities/document.entity';

export type StockEffect = 'out' | 'in' | 'none';

export interface DocMeta {
  label: string;
  plural: string;
  party: 'client' | 'supplier';
  /** Clé du compteur de numérotation légale. */
  numberingKey: string;
  stock: StockEffect;
  /** Génère une créance / dette réglable (paiements, échéancier, relances). */
  settles: boolean;
  /** Document fiscal : mentions légales de la société obligatoires. */
  fiscal: boolean;
  /** Droit de timbre applicable. */
  stamp: boolean;
  /** Montants à contre-passer (avoirs). */
  isCredit: boolean;
  /** Types dans lesquels ce document peut être converti. */
  convertsTo: DocumentType[];
}

export const DOC_META: Record<DocumentType, DocMeta> = {
  quote: { label: 'Devis', plural: 'Devis', party: 'client', numberingKey: 'quote', stock: 'none', settles: false, fiscal: false, stamp: false, isCredit: false, convertsTo: ['delivery_note', 'invoice'] },
  delivery_note: { label: 'Bon de livraison', plural: 'Bons de livraison', party: 'client', numberingKey: 'delivery_note', stock: 'out', settles: false, fiscal: false, stamp: false, isCredit: false, convertsTo: ['invoice'] },
  invoice: { label: 'Facture', plural: 'Factures', party: 'client', numberingKey: 'invoice', stock: 'out', settles: true, fiscal: true, stamp: true, isCredit: false, convertsTo: ['credit_note'] },
  credit_note: { label: 'Avoir', plural: 'Avoirs', party: 'client', numberingKey: 'credit_note', stock: 'in', settles: true, fiscal: true, stamp: false, isCredit: true, convertsTo: [] },
  purchase_order: { label: 'Bon de commande', plural: 'Bons de commande', party: 'supplier', numberingKey: 'purchase_order', stock: 'none', settles: false, fiscal: false, stamp: false, isCredit: false, convertsTo: ['goods_receipt', 'supplier_invoice'] },
  goods_receipt: { label: 'Bon de réception', plural: 'Bons de réception', party: 'supplier', numberingKey: 'goods_receipt', stock: 'in', settles: false, fiscal: false, stamp: false, isCredit: false, convertsTo: ['supplier_invoice'] },
  supplier_invoice: { label: 'Facture fournisseur', plural: 'Factures fournisseurs', party: 'supplier', numberingKey: 'supplier_invoice', stock: 'in', settles: true, fiscal: false, stamp: true, isCredit: false, convertsTo: ['supplier_credit_note'] },
  supplier_credit_note: { label: 'Avoir fournisseur', plural: 'Avoirs fournisseurs', party: 'supplier', numberingKey: 'supplier_credit_note', stock: 'out', settles: true, fiscal: false, stamp: false, isCredit: true, convertsTo: [] },
};

/** Statuts dans lesquels un document ne peut plus être modifié. */
export const FROZEN_STATUSES = new Set(['validated', 'delivered', 'invoiced', 'received', 'partially_received', 'cancelled', 'credited', 'converted', 'confirmed']);
