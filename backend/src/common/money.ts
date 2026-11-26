/**
 * Calculs monétaires des documents commerciaux (devis, bons de livraison, factures, avoirs…).
 *
 * Règles :
 *  - les calculs se font en UNITÉS MINEURES ENTIÈRES de la devise (millimes pour le dinar tunisien, qui a 3 décimales ;
 *    centimes pour l'euro ou le dollar, 2 décimales ; yen : 0), jamais en virgule flottante, pour qu'un total ne soit
 *    jamais faux d'une unité mineure. La précision est celle de la devise de la pièce (option `decimals`, 3 par défaut) ;
 *  - la TVA est calculée par taux sur la base HT cumulée (et non ligne par ligne), comme sur une
 *    déclaration de TVA : la somme des lignes peut donc différer d'une unité mineure de la TVA du document,
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

/** Montant -> unités mineures entières (millimes : 3 décimales ; centimes : 2 ; yen : 0). */
export const toMinor = (n: number, decimals = 3): number => Math.round(round(n, decimals) * 10 ** decimals);
/** Unités mineures entières -> montant. */
export const fromMinor = (m: number, decimals = 3): number => m / 10 ** decimals;

/** Montant (en dinars) -> millimes entiers. */
export const toMillimes = (n: number): number => toMinor(n, 3);
/** Millimes entiers -> montant en dinars. */
export const fromMillimes = (m: number): number => fromMinor(m, 3);

/** Pourcentage d'unités mineures, arrondi à l'entier le plus proche (symétrique). */
function pctOf(minor: number, pct: number): number {
  const sign = minor < 0 ? -1 : 1;
  return sign * Math.round((Math.abs(minor) * pct) / 100 + 1e-9);
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
  /** Décimales de la devise de la pièce (3 : dinar, 2 : euro et dollar, 0 : yen). Défaut : 3. */
  decimals?: number;
  /** Remise globale en % appliquée sur chaque ligne après sa propre remise. */
  globalDiscountPct?: number;
  /** Droit de timbre, dans la devise de la pièce (0 = aucun). */
  stampDuty?: number;
  /** Taux de retenue à la source en % (0 = aucune). */
  withholdingRate?: number;
  /** Seuil TTC en dessous duquel la retenue ne s'applique pas (défaut 1 000 ; 0 = toujours). */
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
  const D = Number.isInteger(options.decimals) && (options.decimals as number) >= 0 && (options.decimals as number) <= 4 ? (options.decimals as number) : 3;
  const toM = (n: number) => toMinor(n, D);
  const fromM = (m: number) => fromMinor(m, D);
  const globalPct = clampPct(options.globalDiscountPct);
  const lineTotals: LineTotals[] = [];
  const groups = new Map<number, number>(); // taux de TVA -> base HT en unités mineures
  let grossSum = 0;
  let netSum = 0;

  for (const l of lines) {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unitPriceHT) || 0;
    const vatRate = Number.isFinite(Number(l.vatRate)) ? Number(l.vatRate) : 0;

    const grossM = toM(qty * price);
    const lineDiscM = pctOf(grossM, clampPct(l.discountPct));
    const afterLineM = grossM - lineDiscM;
    const globalDiscM = pctOf(afterLineM, globalPct);
    const netM = afterLineM - globalDiscM;

    const vatM = pctOf(netM, vatRate);
    lineTotals.push({
      grossHT: fromM(grossM),
      discountAmount: fromM(lineDiscM + globalDiscM),
      netHT: fromM(netM),
      vatRate,
      vatAmount: fromM(vatM),
      totalTTC: fromM(netM + vatM),
    });

    grossSum += grossM;
    netSum += netM;
    groups.set(vatRate, (groups.get(vatRate) || 0) + netM);
  }

  const vatBreakdown: VatBreakdown[] = Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, baseM]) => ({ rate, baseHT: fromM(baseM), vatAmount: fromM(pctOf(baseM, rate)) }));
  const totalVatM = vatBreakdown.reduce((s, g) => s + toM(g.vatAmount), 0);
  const totalTtcM = netSum + totalVatM;

  const stampM = toM(Math.max(0, Number(options.stampDuty) || 0));
  const wRate = clampPct(options.withholdingRate);
  const threshold = options.withholdingThreshold === undefined ? 1000 : Math.max(0, Number(options.withholdingThreshold) || 0);
  const withholdingApplies = wRate > 0 && totalTtcM > 0 && totalTtcM >= toM(threshold);
  const withholdingM = withholdingApplies ? pctOf(totalTtcM, wRate) : 0;

  return {
    lines: lineTotals,
    subtotalHT: fromM(grossSum),
    discountTotal: fromM(grossSum - netSum),
    totalHT: fromM(netSum),
    vatBreakdown,
    totalVat: fromM(totalVatM),
    totalTTC: fromM(totalTtcM),
    stampDuty: fromM(stampM),
    withholdingRate: withholdingApplies ? wRate : 0,
    withholdingAmount: fromM(withholdingM),
    netToPay: fromM(totalTtcM + stampM - withholdingM),
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
