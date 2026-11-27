/**
 * Textes du module Stock avancé : trois langues (fr / en / es) sans dictionnaire séparé.
 * `tr("français", "english", "español")` renvoie le texte de la langue active.
 */
export type Tr = (fr: string, en: string, es: string) => string;

export const makeTr = (language: string): Tr => (fr, en, es) => (language === "en" ? en : language === "es" ? es : fr);

type Triple = [string, string, string];

/** Motifs d'un mouvement de stock (journal) : libellé dans les trois langues. */
const REASONS: Record<string, Triple> = {
  sale: ["Vente", "Sale", "Venta"],
  purchase: ["Achat", "Purchase", "Compra"],
  delivery: ["Livraison", "Delivery", "Entrega"],
  receipt: ["Réception", "Receipt", "Recepción"],
  return: ["Retour", "Return", "Devolución"],
  manual: ["Correction manuelle", "Manual correction", "Corrección manual"],
  inventory: ["Inventaire", "Inventory count", "Inventario"],
  transfer: ["Transfert", "Transfer", "Transferencia"],
  loss: ["Perte", "Loss", "Pérdida"],
  damage: ["Casse", "Damage", "Rotura"],
  found: ["Article retrouvé", "Item found", "Artículo encontrado"],
  opening: ["Stock d'ouverture", "Opening stock", "Stock inicial"],
  pos: ["Caisse rapide", "Quick checkout", "Caja rápida"],
  invoice: ["Facture", "Invoice", "Factura"],
  sale_cancel: ["Annulation de vente", "Sale cancelled", "Venta anulada"],
  purchase_cancel: ["Annulation d'achat", "Purchase cancelled", "Compra anulada"],
  production: ["Production", "Production", "Producción"],
};

export const reasonLabel = (tr: Tr, reason?: string | null) => {
  if (!reason) return "—";
  const r = REASONS[reason];
  return r ? tr(r[0], r[1], r[2]) : reason;
};

/** Motifs proposés pour un ajustement manuel. */
export const ADJUST_REASONS = ["manual", "loss", "damage", "found", "return", "inventory", "opening"] as const;

/** Motifs proposés comme filtre du journal. */
export const FILTER_REASONS = ["sale", "purchase", "delivery", "receipt", "return", "manual", "inventory", "transfer", "loss", "damage", "found", "opening", "pos", "invoice"] as const;
