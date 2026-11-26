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

// ───────────── Montant en lettres dans une autre devise ─────────────

interface UnitWords { one: string; many: string; feminine?: boolean }
interface CurrencyWords extends UnitWords { sub?: UnitWords & { digits: number } }

const cents = (digits = 2): CurrencyWords['sub'] => ({ one: 'centime', many: 'centimes', digits });
const cent = (): CurrencyWords['sub'] => ({ one: 'cent', many: 'cents', digits: 2 });

/** Noms français des principales devises et de leur subdivision. Une devise absente de cette table n'a pas de montant en lettres. */
const CURRENCY_WORDS: Record<string, CurrencyWords> = {
  EUR: { one: 'euro', many: 'euros', sub: cents() },
  USD: { one: 'dollar', many: 'dollars', sub: cent() },
  CAD: { one: 'dollar canadien', many: 'dollars canadiens', sub: cent() },
  AUD: { one: 'dollar australien', many: 'dollars australiens', sub: cent() },
  GBP: { one: 'livre sterling', many: 'livres sterling', feminine: true, sub: { one: 'penny', many: 'pence', digits: 2 } },
  CHF: { one: 'franc suisse', many: 'francs suisses', sub: cents() },
  MAD: { one: 'dirham', many: 'dirhams', sub: cents() },
  DZD: { one: 'dinar algérien', many: 'dinars algériens', sub: cents() },
  LYD: { one: 'dinar libyen', many: 'dinars libyens', sub: { one: 'dirham', many: 'dirhams', digits: 3 } },
  EGP: { one: 'livre égyptienne', many: 'livres égyptiennes', feminine: true, sub: { one: 'piastre', many: 'piastres', feminine: true, digits: 2 } },
  SAR: { one: 'riyal saoudien', many: 'riyals saoudiens', sub: { one: 'halala', many: 'halalas', feminine: true, digits: 2 } },
  AED: { one: 'dirham des Émirats arabes unis', many: 'dirhams des Émirats arabes unis', sub: { one: 'fils', many: 'fils', digits: 2 } },
  QAR: { one: 'riyal qatari', many: 'riyals qataris', sub: { one: 'dirham', many: 'dirhams', digits: 2 } },
  KWD: { one: 'dinar koweïtien', many: 'dinars koweïtiens', sub: { one: 'fils', many: 'fils', digits: 3 } },
  JPY: { one: 'yen', many: 'yens' },
  CNY: { one: 'yuan', many: 'yuans', sub: { one: 'fen', many: 'fens', digits: 2 } },
  TRY: { one: 'livre turque', many: 'livres turques', feminine: true, sub: { one: 'kuruş', many: 'kuruş', digits: 2 } },
  XOF: { one: 'franc CFA', many: 'francs CFA' },
  XAF: { one: 'franc CFA', many: 'francs CFA' },
};

/** « un million » + « euros » -> « un million d'euros » ; « vingt et un » + « livre » (féminin) -> « vingt et une livre ». */
function amountPart(n: number, unit: UnitWords): string {
  let num = integerToFrench(n);
  if (unit.feminine && n > 0) num = num.replace(/\bun$/, 'une');
  const word = n > 1 ? unit.many : unit.one;
  if (/(million|millions|milliard|milliards)$/.test(num)) return `${num} ${/^[aeiouàâéèêëîïôû]/i.test(word) ? "d'" : 'de '}${word}`;
  return `${num} ${word}`;
}

/**
 * Montant en lettres dans la devise de la pièce. Le dinar tunisien garde sa formulation d'origine (dinars et millimes) ;
 * une devise dont le nom n'est pas connu donne `null` : la mention n'est alors pas imprimée (elle n'est obligatoire que dans certains pays).
 */
export function amountInWordsFor(amount: number, currency: string | null | undefined): string | null {
  const code = String(currency || 'TND').toUpperCase();
  if (code === 'TND') return amountToFrenchWords(amount);
  const w = CURRENCY_WORDS[code];
  if (!w) return null;
  const digits = w.sub?.digits ?? 0;
  const factor = 10 ** digits;
  const total = Math.round(Math.abs(Number(amount) || 0) * factor + 1e-6);
  const whole = Math.floor(total / factor);
  const fraction = total % factor;
  const main = amountPart(whole, w);
  return w.sub && fraction > 0 ? `${main} et ${amountPart(fraction, w.sub)}` : main;
}
