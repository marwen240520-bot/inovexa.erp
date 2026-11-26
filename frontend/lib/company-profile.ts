// lib/company-profile.ts
// Profil de la société (pays, devise, taux de TVA, fonctions locales) : UNE seule source pour tous les écrans.
//
// Les montants, les taux de TVA proposés et les fonctions réservées à la Tunisie (timbre, retenue à la source, TEIF, paie)
// en dépendent. Le serveur fait foi (GET /company/profile) : le navigateur n'en garde qu'une copie pour afficher vite et juste,
// et la jette à chaque connexion ou déconnexion pour qu'un compte ne voie jamais la devise d'un autre.
import { useSyncExternalStore } from "react";

/** Fonctions qui n'existent qu'en Tunisie. */
export interface LocalFeatures {
  stampDuty: boolean;
  withholding: boolean;
  teif: boolean;
  payroll: boolean;
}

export interface CompanyProfile {
  /** Pays de la société (ISO 3166-1 alpha-2). */
  countryCode: string;
  countryName: string;
  /** Devise des comptes (ISO 4217, majuscules). */
  currency: string;
  /** Décimales de la devise : dinar 3, euro et dollar 2, yen 0. */
  currencyDecimals: number;
  defaultVatRate: number;
  /** Taux de TVA que la société peut utiliser. */
  vatRates: number[];
  /** Nom de l'identifiant fiscal dans son pays (« Matricule fiscal » en Tunisie, « Identifiant fiscal » ailleurs). */
  taxIdLabel: string;
  features: LocalFeatures;
}

/** Valeurs d'une société tunisienne : celles de tous les comptes existants, et celles affichées avant la lecture du profil. */
export const DEFAULT_PROFILE: CompanyProfile = {
  countryCode: "TN",
  countryName: "Tunisie",
  currency: "TND",
  currencyDecimals: 3,
  defaultVatRate: 19,
  vatRates: [0, 7, 13, 19],
  taxIdLabel: "Matricule fiscal",
  features: { stampDuty: true, withholding: true, teif: true, payroll: true },
};

const PROFILE_KEY = "company_profile";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

let current: CompanyProfile = DEFAULT_PROFILE;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Contrôle la forme d'un profil lu (copie du navigateur ou réponse du serveur) ; null si elle est inattendue. */
function parse(raw: unknown): CompanyProfile | null {
  const p = raw as Record<string, any> | null;
  if (!p || typeof p !== "object") return null;
  const countryCode = String(p.countryCode || "").toUpperCase();
  const currency = String(p.currency || "").toUpperCase();
  const decimals = Number(p.currencyDecimals);
  if (!/^[A-Z]{2}$/.test(countryCode) || !/^[A-Z]{3}$/.test(currency) || !Number.isInteger(decimals) || decimals < 0 || decimals > 4) return null;
  const rates: number[] = Array.isArray(p.vatRates) ? p.vatRates.map(Number).filter((n: number) => Number.isFinite(n) && n >= 0 && n <= 100) : [];
  const f = p.features || {};
  return {
    countryCode,
    countryName: String(p.countryName || countryCode),
    currency,
    currencyDecimals: decimals,
    defaultVatRate: Number.isFinite(Number(p.defaultVatRate)) ? Number(p.defaultVatRate) : 0,
    vatRates: rates.length ? rates : [0],
    taxIdLabel: String(p.taxIdLabel || "Identifiant fiscal"),
    features: { stampDuty: f.stampDuty === true, withholding: f.withholding === true, teif: f.teif === true, payroll: f.payroll === true },
  };
}

const same = (a: CompanyProfile, b: CompanyProfile) => JSON.stringify(a) === JSON.stringify(b);

function set(next: CompanyProfile, persist: boolean) {
  if (same(current, next)) return;
  current = next;
  if (persist) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
  }
  emit();
}

/** Profil en cours (pour les formats appelés hors d'un composant : montants, libellés). */
export const getCompanyProfile = (): CompanyProfile => current;

/**
 * Applique la copie gardée par le navigateur. À appeler une fois la page affichée (jamais pendant l'hydratation :
 * le serveur ne connaît que les valeurs par défaut, et les deux rendus doivent être identiques).
 */
export function initCompanyProfile() {
  try {
    const cached = parse(JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"));
    if (cached) set(cached, false);
  } catch { /* copie illisible : ignorée */ }
}

/** Retient un profil renvoyé par le serveur (GET /company/profile, ou « profile » de la réponse de PUT /company). */
export function applyCompanyProfile(raw: unknown): CompanyProfile | null {
  const p = parse(raw);
  if (p) set(p, true);
  return p;
}

/** Oublie le profil (connexion, déconnexion) : l'écran suivant repart des valeurs par défaut. */
export function resetCompanyProfile() {
  try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignoré */ }
  if (!same(current, DEFAULT_PROFILE)) {
    current = DEFAULT_PROFILE;
    emit();
  }
}

/** Interroge le serveur ; en cas d'échec, l'ancienne valeur est gardée. */
export async function refreshCompanyProfile(): Promise<CompanyProfile | null> {
  let token: string | null = null;
  try { token = localStorage.getItem("token"); } catch { /* ignoré */ }
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/company/profile`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return applyCompanyProfile(await res.json());
  } catch {
    return null;
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** Profil de la société, mis à jour dès qu'il change. Les valeurs par défaut sont rendues côté serveur et pendant l'hydratation. */
export function useCompanyProfile(): CompanyProfile {
  return useSyncExternalStore(subscribe, getCompanyProfile, () => DEFAULT_PROFILE);
}

// ───────────── Devises et montants ─────────────

const ZERO_DECIMALS = new Set(["BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);
const THREE_DECIMALS = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

/** Décimales d'une devise (ISO 4217) : les mêmes règles que le serveur. */
export function currencyDecimals(code: string | null | undefined): number {
  const c = String(code || "").toUpperCase();
  if (ZERO_DECIMALS.has(c)) return 0;
  if (THREE_DECIMALS.has(c)) return 3;
  return 2;
}

const LABELS: Record<string, string> = { TND: "DT", EUR: "€", USD: "$", GBP: "£", JPY: "¥" };

/** Unité affichée derrière un montant : « DT », « € », « $ » ; le code ISO pour les autres devises (« MAD », « CAD »). */
export function currencyLabel(code: string | null | undefined): string {
  const c = String(code || "").toUpperCase();
  return LABELS[c] || c || "DT";
}

const formats = new Map<number, Intl.NumberFormat>();

/** Montant sans unité, avec les décimales demandées (par défaut celles de la devise de la société). */
export function formatAmount(value: unknown, decimals: number = current.currencyDecimals): string {
  let f = formats.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formats.set(decimals, f);
  }
  return f.format(Number(value) || 0);
}

/** Montant avec son unité, dans la devise indiquée (par défaut celle de la société) : « 120,000 DT », « 71,96 € », « 6 597 ¥ ». */
export function formatMoney(value: unknown, currency?: string | null): string {
  const code = String(currency || current.currency).toUpperCase();
  return `${formatAmount(value, currencyDecimals(code))} ${currencyLabel(code)}`;
}
