// lib/countries.ts
// Pays et devises proposés à l'inscription et dans Paramètres › Société. Mêmes données que le serveur
// (backend/src/common/countries.ts) : le serveur contrôle de toute façon ce qu'il reçoit.

/** Codes ISO 3166-1 alpha-2 (plus XK, Kosovo, d'usage courant). */
export const COUNTRY_CODES: readonly string[] = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW",
];

/** Devise usuelle d'un pays (proposée, modifiable). Absent : la personne la choisit. */
export const CURRENCY_BY_COUNTRY: Readonly<Record<string, string>> = {
  AD: "EUR", AT: "EUR", BE: "EUR", BG: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR",
  FI: "EUR", FR: "EUR", GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR",
  LV: "EUR", MC: "EUR", ME: "EUR", MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR",
  SM: "EUR", VA: "EUR", XK: "EUR", TN: "TND", MA: "MAD", DZ: "DZD", EG: "EGP", LY: "LYD",
  MR: "MRU", SA: "SAR", AE: "AED", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR", JO: "JOD",
  LB: "LBP", IQ: "IQD", IL: "ILS", TR: "TRY", GB: "GBP", CH: "CHF", LI: "CHF", NO: "NOK",
  SE: "SEK", DK: "DKK", IS: "ISK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", RS: "RSD",
  BA: "BAM", AL: "ALL", MK: "MKD", MD: "MDL", UA: "UAH", RU: "RUB", BY: "BYN", GE: "GEL",
  AM: "AMD", AZ: "AZN", IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", CN: "CNY",
  HK: "HKD", MO: "MOP", TW: "TWD", JP: "JPY", KR: "KRW", SG: "SGD", MY: "MYR", TH: "THB",
  VN: "VND", PH: "PHP", ID: "IDR", KZ: "KZT", UZ: "UZS", AU: "AUD", NZ: "NZD", US: "USD",
  CA: "CAD", MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", UY: "UYU",
  PY: "PYG", BO: "BOB", EC: "USD", SV: "USD", PA: "USD", CR: "CRC", GT: "GTQ", HN: "HNL",
  NI: "NIO", DO: "DOP", JM: "JMD", TT: "TTD", HT: "HTG", CU: "CUP", VE: "VES", ZA: "ZAR",
  NG: "NGN", GH: "GHS", KE: "KES", TZ: "TZS", UG: "UGX", RW: "RWF", ET: "ETB", MU: "MUR",
  MG: "MGA", NA: "NAD", BW: "BWP", MZ: "MZN", ZM: "ZMW", AO: "AOA", CD: "CDF", SD: "SDG",
  DJ: "DJF", GN: "GNF", BI: "BIF", KM: "KMF", SN: "XOF", CI: "XOF", ML: "XOF", BF: "XOF",
  BJ: "XOF", NE: "XOF", TG: "XOF", GW: "XOF", CM: "XAF", GA: "XAF", CG: "XAF", TD: "XAF",
  CF: "XAF", GQ: "XAF",
};

export const defaultCurrencyFor = (code: string | null | undefined): string | null => CURRENCY_BY_COUNTRY[String(code || "").toUpperCase()] ?? null;

const regionNames = new Map<string, Intl.DisplayNames>();
const currencyNames = new Map<string, Intl.DisplayNames>();

/** Nom du pays dans la langue de l'interface (« Maroc », « Morocco », « Marruecos »), le code à défaut. */
export function countryLabel(code: string, lang = "fr"): string {
  try {
    let names = regionNames.get(lang);
    if (!names) { names = new Intl.DisplayNames([lang], { type: "region" }); regionNames.set(lang, names); }
    return names.of(code) || code;
  } catch {
    return code;
  }
}

/** Nom de la devise dans la langue de l'interface (« euro », « dirham marocain »), le code à défaut. */
export function currencyLabelFor(code: string, lang = "fr"): string {
  try {
    let names = currencyNames.get(lang);
    if (!names) { names = new Intl.DisplayNames([lang], { type: "currency" }); currencyNames.set(lang, names); }
    return names.of(code) || code;
  } catch {
    return code;
  }
}

/** Pays triés par nom dans la langue de l'interface. */
export function countryOptions(lang = "fr"): Array<{ code: string; name: string }> {
  return COUNTRY_CODES.map((code) => ({ code, name: countryLabel(code, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang));
}

/** Devises proposées : celles des pays de la liste, triées par nom. */
export function currencyOptions(lang = "fr"): Array<{ code: string; name: string }> {
  const codes = Array.from(new Set(Object.values(CURRENCY_BY_COUNTRY))).concat(["USD", "EUR"]);
  return Array.from(new Set(codes)).map((code) => ({ code, name: `${currencyLabelFor(code, lang)} (${code})` })).sort((a, b) => a.name.localeCompare(b.name, lang));
}

