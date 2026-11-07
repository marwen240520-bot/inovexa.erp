/**
 * Montant en toutes lettres (français), pour la mention légale des factures :
 * « Arrêtée la présente facture à la somme de : mille deux cent trente-quatre dinars et cinq cent soixante-sept millimes ».
 */

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

/** 0..99. `final` = le nombre n'est suivi d'aucun autre mot (« quatre-vingts » prend un s seulement dans ce cas). */
function below100(n: number, final: boolean): string {
  if (n < 17) return UNITS[n];
  if (n < 20) return `dix-${UNITS[n - 10]}`;
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return TENS[t];
    if (u === 1) return `${TENS[t]} et un`;
    return `${TENS[t]}-${UNITS[u]}`;
  }
  if (n < 80) {
    if (n === 71) return 'soixante et onze';
    return `soixante-${below100(n - 60, final)}`;
  }
  if (n === 80) return final ? 'quatre-vingts' : 'quatre-vingt';
  return `quatre-vingt-${below100(n - 80, final)}`;
}

/** 0..999. */
function below1000(n: number, final: boolean): string {
  if (n < 100) return below100(n, final);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const head = h === 1 ? 'cent' : `${UNITS[h]} cent${rest === 0 && final ? 's' : ''}`;
  return rest === 0 ? head : `${head} ${below100(rest, final)}`;
}

/** Entier positif en lettres. */
export function integerToFrench(n: number): string {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('integerToFrench attend un entier positif');
  if (n === 0) return 'zéro';
  const parts: string[] = [];
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  if (billions) parts.push(`${below1000(billions, false)} milliard${billions > 1 ? 's' : ''}`);
  if (millions) parts.push(`${below1000(millions, false)} million${millions > 1 ? 's' : ''}`);
  if (thousands) parts.push(thousands === 1 ? 'mille' : `${below1000(thousands, false)} mille`);
  if (rest) parts.push(below1000(rest, true));
  return parts.join(' ');
}

/** Montant en dinars (3 décimales) en lettres : « cent vingt dinars et trois cents millimes ». */
export function amountToFrenchWords(amount: number, unit = 'dinar', subUnit = 'millime'): string {
  const abs = Math.abs(Number(amount) || 0);
  const totalMillimes = Math.round(abs * 1000 + 1e-6);
  const dinars = Math.floor(totalMillimes / 1000);
  const millimes = totalMillimes % 1000;

  const dinarsText = `${integerToFrench(dinars)} ${unit}${dinars > 1 ? 's' : ''}`;
  if (millimes === 0) return dinarsText;
  const millimesText = `${integerToFrench(millimes)} ${subUnit}${millimes > 1 ? 's' : ''}`;
  return `${dinarsText} et ${millimesText}`;
}
