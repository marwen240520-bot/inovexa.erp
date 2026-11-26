/**
 * Pays, devises et particularités locales.
 *
 * L'ERP sert des sociétés de n'importe quel pays. Le pays ne dicte presque rien : les taux de TVA, l'identifiant fiscal
 * et la devise se règlent par société. Seules les fonctions qui n'existent qu'en Tunisie (droit de timbre, retenue à la
 * source tunisienne, facture TEIF / El Fatoora, paie CNSS / IRPP) sont réservées aux sociétés tunisiennes.
 */

/** Codes ISO 3166-1 alpha-2 (plus XK, Kosovo, d'usage courant). */
export const COUNTRY_CODES: readonly string[] = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE',
  'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD',
  'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
  'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
  'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME',
  'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
  'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI',
  'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK',
  'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
];

const COUNTRY_SET = new Set<string>(COUNTRY_CODES);

export const DEFAULT_COUNTRY = 'TN';

export const isCountryCode = (v: unknown): v is string => typeof v === 'string' && COUNTRY_SET.has(v);

const displayNames = new Map<string, Intl.DisplayNames>();

/** Nom du pays dans la langue demandée (« Maroc », « Morocco », « Marruecos »), le code à défaut. */
export function countryName(code: string, lang = 'fr'): string {
  if (!COUNTRY_SET.has(code)) return code;
  try {
    let names = displayNames.get(lang);
    if (!names) {
      names = new Intl.DisplayNames([lang], { type: 'region' });
      displayNames.set(lang, names);
    }
    const name = names.of(code);
    return name && name !== code ? name : code;
  } catch {
    return code;
  }
}

/** Devise usuelle d'un pays, proposée à l'inscription (modifiable). Absent : la personne la choisit. */
export const CURRENCY_BY_COUNTRY: Readonly<Record<string, string>> = {
  // Zone euro et pays qui utilisent l'euro
  AD: 'EUR', AT: 'EUR', BE: 'EUR', BG: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR', FI: 'EUR', FR: 'EUR', GR: 'EUR', HR: 'EUR',
  IE: 'EUR', IT: 'EUR', LT: 'EUR', LU: 'EUR', LV: 'EUR', MC: 'EUR', ME: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR', SK: 'EUR',
  SM: 'EUR', VA: 'EUR', XK: 'EUR',
  // Maghreb, Moyen-Orient, Turquie
  TN: 'TND', MA: 'MAD', DZ: 'DZD', EG: 'EGP', LY: 'LYD', MR: 'MRU', SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  JO: 'JOD', LB: 'LBP', IQ: 'IQD', IL: 'ILS', TR: 'TRY',
  // Reste de l'Europe et Caucase
  GB: 'GBP', CH: 'CHF', LI: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', IS: 'ISK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', RS: 'RSD',
  BA: 'BAM', AL: 'ALL', MK: 'MKD', MD: 'MDL', UA: 'UAH', RU: 'RUB', BY: 'BYN', GE: 'GEL', AM: 'AMD', AZ: 'AZN',
  // Asie et Océanie
  IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR', CN: 'CNY', HK: 'HKD', MO: 'MOP', TW: 'TWD', JP: 'JPY', KR: 'KRW', SG: 'SGD',
  MY: 'MYR', TH: 'THB', VN: 'VND', PH: 'PHP', ID: 'IDR', KZ: 'KZT', UZ: 'UZS', AU: 'AUD', NZ: 'NZD',
  // Amériques
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU', PY: 'PYG', BO: 'BOB', EC: 'USD',
  SV: 'USD', PA: 'USD', CR: 'CRC', GT: 'GTQ', HN: 'HNL', NI: 'NIO', DO: 'DOP', JM: 'JMD', TT: 'TTD', HT: 'HTG', CU: 'CUP', VE: 'VES',
  // Afrique subsaharienne
  ZA: 'ZAR', NG: 'NGN', GH: 'GHS', KE: 'KES', TZ: 'TZS', UG: 'UGX', RW: 'RWF', ET: 'ETB', MU: 'MUR', MG: 'MGA', NA: 'NAD', BW: 'BWP',
  MZ: 'MZN', ZM: 'ZMW', AO: 'AOA', CD: 'CDF', SD: 'SDG', DJ: 'DJF', GN: 'GNF', BI: 'BIF', KM: 'KMF',
  SN: 'XOF', CI: 'XOF', ML: 'XOF', BF: 'XOF', BJ: 'XOF', NE: 'XOF', TG: 'XOF', GW: 'XOF',
  CM: 'XAF', GA: 'XAF', CG: 'XAF', TD: 'XAF', CF: 'XAF', GQ: 'XAF',
};

export const defaultCurrencyFor = (code: string | null | undefined): string | null => CURRENCY_BY_COUNTRY[String(code || '').toUpperCase()] ?? null;

/** Devises ISO 4217 connues : celles de la plateforme (ICU) et celles proposées par pays. Inconnu (ancien runtime) : seule la forme est contrôlée. */
const KNOWN_CURRENCIES: ReadonlySet<string> | null = (() => {
  try {
    const list: string[] | undefined = (Intl as any).supportedValuesOf?.('currency');
    return list?.length ? new Set<string>([...list, ...Object.values(CURRENCY_BY_COUNTRY), 'EUR', 'USD']) : null;
  } catch {
    return null;
  }
})();

export const isCurrencyCode = (v: unknown): v is string => typeof v === 'string' && /^[A-Z]{3}$/.test(v) && (!KNOWN_CURRENCIES || KNOWN_CURRENCIES.has(v));

/** Devises sans décimale et à trois décimales (ISO 4217) ; toutes les autres en ont deux. */
const ZERO_DECIMALS = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);
const THREE_DECIMALS = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

/** Nombre de décimales d'une devise : les montants d'une pièce sont calculés et arrondis à cette précision. */
export function currencyDecimals(code: string | null | undefined): number {
  const c = String(code || '').toUpperCase();
  if (ZERO_DECIMALS.has(c)) return 0;
  if (THREE_DECIMALS.has(c)) return 3;
  return 2;
}

export const isTunisia = (code: string | null | undefined): boolean => String(code || DEFAULT_COUNTRY).toUpperCase() === 'TN';

/** Fonctions qui n'existent qu'en Tunisie : réservées aux sociétés tunisiennes. */
export interface LocalFeatures {
  /** Droit de timbre sur les factures. */
  stampDuty: boolean;
  /** Retenue à la source (taux et seuil tunisiens). */
  withholding: boolean;
  /** Facture électronique TEIF (El Fatoora / TTN). */
  teif: boolean;
  /** Paie : CNSS, IRPP, CSS. */
  payroll: boolean;
}

export function localFeatures(code: string | null | undefined): LocalFeatures {
  const tn = isTunisia(code);
  return { stampDuty: tn, withholding: tn, teif: tn, payroll: tn };
}

/** Nom de l'identifiant fiscal de la société dans son pays. */
export const taxIdLabel = (code: string | null | undefined): string => (isTunisia(code) ? 'Matricule fiscal' : 'Identifiant fiscal');

/** Libellé court de l'identifiant fiscal imprimé sur les pièces : « MF » (matricule fiscal) en Tunisie, « ID fiscal » ailleurs. */
export const taxIdShortLabel = (code: string | null | undefined): string => (isTunisia(code) ? 'MF' : 'ID fiscal');
