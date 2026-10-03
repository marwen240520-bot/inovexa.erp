/**
 * Normalisation des montants d'une facture.
 *
 * Les factures du système viennent de plusieurs sources (formulaire, import, données de démo,
 * anciennes versions) qui n'écrivent pas toutes les lignes avec les mêmes noms de champs :
 *   formulaire : { quantity, unitPriceHT, totalHT, totalTTC }
 *   ancien     : { quantity, unitPrice, total }   |   aucune ligne, seulement le total de la facture
 * Résultat : l'aperçu, l'impression et l'édition affichaient « null » / 0 € pour
 * « Prix unitaire HT », « Sous-total HT » et « Sous-total TTC ».
 *
 * `normalizeInvoiceAmounts` accepte tous ces formats et complète ce qui manque par le calcul.
 */

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Nombre lisible ("12", "12,5", "1 200,50") ou null */
export function toNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(String(value).replace(/[\s\u00a0]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Premier nombre valide parmi plusieurs champs candidats */
export function firstNum(...values: unknown[]): number | null {
  for (const v of values) {
    const n = toNum(v);
    if (n !== null) return n;
  }
  return null;
}

export interface NormalizedItem {
  description: string;
  quantity: number;
  unitPriceHT: number;
  totalHT: number;
  totalTTC: number;
  [key: string]: any;
}

export function normalizeItem(raw: any, taxRate: number): NormalizedItem {
  const it = raw && typeof raw === "object" ? raw : {};
  const quantity = firstNum(it.quantity, it.qty, it.qte) ?? 1;
  let unit = firstNum(it.unitPriceHT, it.unit_price_ht, it.unitPrice, it.unit_price, it.priceHT, it.price, it.pu);
  let ht = firstNum(it.totalHT, it.total_ht, it.subtotalHT, it.total, it.amountHT);
  let ttc = firstNum(it.totalTTC, it.total_ttc, it.subtotalTTC, it.amountTTC);

  if (unit === null && ht !== null) unit = quantity ? ht / quantity : ht;
  if (ht === null && unit !== null) ht = quantity * unit;
  if (ttc === null && ht !== null) ttc = ht * (1 + taxRate / 100);

  return {
    ...it,
    description: it.description ?? it.label ?? it.name ?? "",
    quantity,
    unitPriceHT: round2(unit ?? 0),
    totalHT: round2(ht ?? 0),
    totalTTC: round2(ttc ?? 0),
  };
}

/**
 * Renvoie la facture avec :
 *  - des lignes toujours au format { quantity, unitPriceHT, totalHT, totalTTC } ;
 *  - subtotalHT / taxAmount / amount (TTC) cohérents entre eux, déduits des lignes ou du total connu ;
 *  - une ligne de synthèse quand la facture n'a aucune ligne exploitable mais un montant.
 */
export function normalizeInvoiceAmounts<T extends Record<string, any>>(inv: T): T & {
  items: NormalizedItem[];
  subtotalHT: number;
  taxAmount: number;
  amount: number;
  taxRate: number;
} {
  const taxRate = firstNum(inv.taxRate) ?? 20;
  const rawItems: any[] = Array.isArray(inv.items) ? inv.items : [];
  let items = rawItems.map((it) => normalizeItem(it, taxRate));

  let amount = firstNum(inv.amount, inv.total, inv.totalTTC);
  let subtotalHT = firstNum(inv.subtotalHT, inv.subtotal, inv.totalHT);
  let taxAmount = firstNum(inv.taxAmount, inv.tva);

  // Sous-total HT : champ de la facture, sinon somme des lignes, sinon déduit du TTC
  const sumHT = items.reduce((s, i) => s + i.totalHT, 0);
  if (!subtotalHT) {
    if (sumHT > 0) subtotalHT = sumHT;
    else if (amount) subtotalHT = amount / (1 + taxRate / 100);
  }
  // Total TTC : champ de la facture, sinon HT + TVA
  if (!amount) {
    if (subtotalHT) amount = subtotalHT + (taxAmount ?? subtotalHT * (taxRate / 100));
  }
  // TVA : champ de la facture, sinon TTC - HT
  if (!taxAmount) taxAmount = Math.max((amount ?? 0) - (subtotalHT ?? 0), 0);

  // Aucune ligne exploitable mais un montant connu : une ligne de synthèse (au lieu de « Aucun article »)
  const nothingUsable = items.length === 0 || items.every((i) => i.totalHT === 0 && i.unitPriceHT === 0);
  if (nothingUsable && subtotalHT) {
    const first = items[0];
    const quantity = first?.quantity || 1;
    items = [
      {
        ...(first || {}),
        description: first?.description || inv.description || "Prestation / marchandises",
        quantity,
        unitPriceHT: round2(subtotalHT / quantity),
        totalHT: round2(subtotalHT),
        totalTTC: round2(subtotalHT * (1 + taxRate / 100)),
      },
    ];
  }

  return {
    ...inv,
    taxRate,
    items,
    subtotalHT: round2(subtotalHT ?? 0),
    taxAmount: round2(taxAmount ?? 0),
    amount: round2(amount ?? 0),
  };
}
