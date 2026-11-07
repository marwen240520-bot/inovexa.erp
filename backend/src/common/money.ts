/**
 * Calculs monétaires des documents commerciaux (devis, bons de livraison, factures, avoirs…).
 *
 * Règles :
 *  - le dinar tunisien a 3 décimales (millimes) : tous les calculs se font en MILLIMES ENTIERS,
 *    jamais en virgule flottante, pour qu'un total ne soit jamais faux d'un millime ;
 *  - la TVA est calculée par taux sur la base HT cumulée (et non ligne par ligne), comme sur une
 *    déclaration de TVA : la somme des lignes peut donc différer d'un millime de la TVA du document,
 *    c'est la TVA du document qui fait foi ;
 *  - retenue à la source : calculée sur le TTC (hors timbre), uniquement si le TTC dépasse le seuil.
 */

/** Arrondi « commercial » (0,5 s'arrondit vers l'extérieur), symétrique pour les montants négatifs. */
export function round(value: number, decimals = 3): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  const abs = Math.abs(n);
  const shifted = Number(`${abs}e${decimals}`);
  const rounded = Number.isFinite(shifted) ? Math.round(shifted) : Math.round(abs * 10 ** decimals);
  return sign * Number(`${rounded}e-${decimals}`);
}

export const r3 = (n: number) => round(n, 3);

/** Montant (en dinars) -> millimes entiers. */
export const toMillimes = (n: number): number => Math.round(round(n, 3) * 1000);
/** Millimes entiers -> montant en dinars. */
export const fromMillimes = (m: number): number => m / 1000;

/** Pourcentage de millimes, arrondi à l'entier le plus proche (symétrique). */
function pctOf(millimes: number, pct: number): number {
  const sign = millimes < 0 ? -1 : 1;
  return sign * Math.round((Math.abs(millimes) * pct) / 100 + 1e-9);
}

export interface LineInput {
  quantity: number;
  unitPriceHT: number;
  discountPct?: number;
  vatRate?: number;
}

export interface LineTotals {
  grossHT: number;
  discountAmount: number;
  netHT: number;
  vatRate: number;
  vatAmount: number;
  totalTTC: number;
}

export interface VatBreakdown {
  rate: number;
  baseHT: number;
  vatAmount: number;
}

export interface TotalsOptions {
  /** Remise globale en % appliquée sur chaque ligne après sa propre remise. */
  globalDiscountPct?: number;
  /** Droit de timbre en dinars (0 = aucun). */
  stampDuty?: number;
  /** Taux de retenue à la source en % (0 = aucune). */
  withholdingRate?: number;
  /** Seuil TTC en dessous duquel la retenue ne s'applique pas (défaut 1 000 DT ; 0 = toujours). */
  withholdingThreshold?: number;
}

export interface DocumentTotals {
  lines: LineTotals[];
  subtotalHT: number;
  discountTotal: number;
  totalHT: number;
  vatBreakdown: VatBreakdown[];
  totalVat: number;
  totalTTC: number;
  stampDuty: number;
  withholdingRate: number;
  withholdingAmount: number;
  netToPay: number;
}

const clampPct = (n: number | undefined) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
};

export function computeTotals(lines: LineInput[], options: TotalsOptions = {}): DocumentTotals {
  const globalPct = clampPct(options.globalDiscountPct);
  const lineTotals: LineTotals[] = [];
  const groups = new Map<number, number>(); // taux de TVA -> base HT en millimes
  let grossSum = 0;
  let netSum = 0;

  for (const l of lines) {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unitPriceHT) || 0;
    const vatRate = Number.isFinite(Number(l.vatRate)) ? Number(l.vatRate) : 0;

    const grossM = toMillimes(qty * price);
    const lineDiscM = pctOf(grossM, clampPct(l.discountPct));
    const afterLineM = grossM - lineDiscM;
    const globalDiscM = pctOf(afterLineM, globalPct);
    const netM = afterLineM - globalDiscM;

    const vatM = pctOf(netM, vatRate);
    lineTotals.push({
      grossHT: fromMillimes(grossM),
      discountAmount: fromMillimes(lineDiscM + globalDiscM),
      netHT: fromMillimes(netM),
      vatRate,
      vatAmount: fromMillimes(vatM),
      totalTTC: fromMillimes(netM + vatM),
    });

    grossSum += grossM;
    netSum += netM;
    groups.set(vatRate, (groups.get(vatRate) || 0) + netM);
  }

  const vatBreakdown: VatBreakdown[] = Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, baseM]) => ({ rate, baseHT: fromMillimes(baseM), vatAmount: fromMillimes(pctOf(baseM, rate)) }));
  const totalVatM = vatBreakdown.reduce((s, g) => s + toMillimes(g.vatAmount), 0);
  const totalTtcM = netSum + totalVatM;

  const stampM = toMillimes(Math.max(0, Number(options.stampDuty) || 0));
  const wRate = clampPct(options.withholdingRate);
  const threshold = options.withholdingThreshold === undefined ? 1000 : Math.max(0, Number(options.withholdingThreshold) || 0);
  const withholdingApplies = wRate > 0 && totalTtcM > 0 && totalTtcM >= toMillimes(threshold);
  const withholdingM = withholdingApplies ? pctOf(totalTtcM, wRate) : 0;

  return {
    lines: lineTotals,
    subtotalHT: fromMillimes(grossSum),
    discountTotal: fromMillimes(grossSum - netSum),
    totalHT: fromMillimes(netSum),
    vatBreakdown,
    totalVat: fromMillimes(totalVatM),
    totalTTC: fromMillimes(totalTtcM),
    stampDuty: fromMillimes(stampM),
    withholdingRate: withholdingApplies ? wRate : 0,
    withholdingAmount: fromMillimes(withholdingM),
    netToPay: fromMillimes(totalTtcM + stampM - withholdingM),
  };
}

/** Coût moyen unitaire pondéré (CMUP) après une entrée en stock. */
export function weightedAverageCost(currentQty: number, currentCost: number, inQty: number, inCost: number): number {
  const q0 = Math.max(0, Number(currentQty) || 0);
  const q1 = Math.max(0, Number(inQty) || 0);
  if (q1 === 0) return round(currentCost, 3);
  if (q0 === 0) return round(inCost, 3);
  return round((q0 * (Number(currentCost) || 0) + q1 * (Number(inCost) || 0)) / (q0 + q1), 3);
}
