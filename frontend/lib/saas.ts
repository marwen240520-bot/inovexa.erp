// lib/saas.ts
// Types et appels communs de la couche SaaS (formules, secteurs, abonnement). Voir docs/SAAS-API.md.
//  - routes publiques  : publicGet("/public/plans")            — sans jeton
//  - routes connectées : api("/billing/subscription") du kit   — jeton ajouté automatiquement
import type { AccountState } from "@/lib/session";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export const MODULE_KEYS = [
  "dashboard", "products", "categories", "stock", "sales", "purchases", "pos", "orders", "clients", "suppliers",
  "invoices", "hr", "finance", "logistics", "production", "ai", "reports", "analytics", "objectives", "profile", "settings",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
/** Toujours actifs, quel que soit l'abonnement. */
export const CORE_MODULES: readonly string[] = ["dashboard", "profile", "settings"];
/** Modules proposés à l'activation (la production n'a pas d'écran : elle n'est pas proposée). */
export const SELECTABLE_MODULES: ModuleKey[] = MODULE_KEYS.filter((k) => !CORE_MODULES.includes(k) && k !== "production");

/** Nom français de chaque module (écrans de l'administrateur). */
export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord", products: "Produits", categories: "Catégories", stock: "Stock", sales: "Ventes", purchases: "Achats",
  pos: "Caisse", orders: "Commandes", clients: "Clients", suppliers: "Fournisseurs", invoices: "Factures & devis", hr: "RH & paie",
  finance: "Finance & comptabilité", logistics: "Logistique", production: "Production", ai: "Assistant IA", reports: "Rapports",
  analytics: "Analyses", objectives: "Objectifs", profile: "Profil", settings: "Paramètres",
};

export interface Plan {
  id: number; code: string; name: string; description: string | null;
  /** Prix hors taxes ; null = sur devis. */
  priceMonthly: number | null; priceAnnual: number | null;
  /** null = illimité. */
  maxUsers: number | null;
  /** null = tous les modules. */
  modules: string[] | null;
  features: string[] | null;
  isPublic: boolean; isActive: boolean; highlight: boolean; sortOrder: number;
}

export interface PlansResponse { currency: string; vatRate: number; trialHours?: number; plans: Plan[] }

export interface Sector {
  id: number; code: string; name: string; nameEn: string | null; nameAr: string | null; description: string | null;
  modules: string[] | null; recommendations: string[] | null; isActive: boolean; sortOrder: number; itemCount: number;
}

export interface SectorCategory { id: number; sectorId: number; parentId: number | null; name: string; description: string | null; isActive: boolean; sortOrder: number }

export interface SectorItem {
  id: number; sectorId: number; categoryId: number | null; kind: "product" | "service"; name: string; description: string | null; unit: string;
  /** Montants indicatifs hors taxes (null = non renseigné). */
  purchasePrice: number | null; sellingPrice: number | null; marginPct: number | null; vatRate: number | null;
  trackLots: boolean; basis: string | null; isActive: boolean; sortOrder: number;
}

export interface ServiceOffer {
  id: number; sectorCode: string | null; category: "setup" | "training" | "migration" | "support" | "module"; name: string; description: string | null;
  /** null = sur devis. */
  price: number | null; priceUnit: "one_time" | "per_month" | "per_day" | "per_hour" | "per_user"; basis: string | null;
  isPublic: boolean; isActive: boolean; sortOrder: number;
}

export interface SectorDetail { sector: Sector; categories: SectorCategory[]; items: SectorItem[]; serviceOffers: ServiceOffer[]; disclaimer: string }

export interface PublicConfig {
  trialHours: number; currency: string; vatRate: number; requireEmailVerification: boolean;
  supportEmail: string | null; supportPhone: string | null; supportWhatsapp: string | null;
  /** null = connexion Google non configurée sur le serveur : le bouton n'est pas affiché. */
  googleClientId: string | null; modules: string[];
}

export interface SubscriptionPayment {
  id: number; userId: number; planCode: string; planName: string; billingCycle: "monthly" | "annual"; periodMonths: number;
  amountHT: number; vatRate: number; amountTTC: number; currency: string; method: string; provider: string;
  reference: string | null; note: string | null; status: "pending" | "validated" | "rejected" | "cancelled"; rejectReason: string | null;
  declaredBy: "client" | "admin"; validatedAt: string | null; periodStart: string | null; periodEnd: string | null; receiptNumber: string | null; createdAt: string;
}

export interface SubscriptionView {
  account: AccountState;
  company: { name: string | null; email: string };
  plan: Plan | null;
  users: { used: number; limit: number | null };
  modules: Record<string, boolean>;
  pendingPayment: SubscriptionPayment | null;
  payment: { currency: string; vatRate: number; instructions: string | null; methods: string[]; onlinePayment: boolean };
  support: { email: string | null; phone: string | null; whatsapp: string | null };
  /** false pour un membre d'équipe : seul le propriétaire gère l'abonnement. */
  canManage: boolean;
}

export interface Receipt {
  receiptNumber: string; issuedAt: string; planName: string; billingCycle: string; periodStart: string; periodEnd: string;
  amountHT: number; vatRate: number; vatAmount: number; amountTTC: number; currency: string; method: string; reference: string | null;
  customer: { name: string; taxId: string | null; address: string | null; email: string | null }; notice: string;
}

/** Lecture d'une route publique de l'API (sans jeton). Lève une erreur avec le message du serveur. */
export async function publicGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Impossible de joindre le serveur.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const m = (data as any)?.message;
    throw new Error(Array.isArray(m) ? m.join(" · ") : m || `Erreur ${res.status}`);
  }
  return data as T;
}

/** Envoi JSON sans jeton (inscription, connexion, mot de passe oublié). Renvoie le statut ET le corps, sans lever d'erreur HTTP. */
export async function publicPost<T = any>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: T; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, status: 0, data: null as T, message: "" };
  }
  const data = await res.json().catch(() => null);
  const m = (data as any)?.message;
  return { ok: res.ok, status: res.status, data: data as T, message: Array.isArray(m) ? m.join(" · ") : m || "" };
}

// ───────────── Formats (Tunisie) ─────────────

const INTL: Record<string, string> = { fr: "fr-TN", en: "en-GB", es: "es-ES", ar: "ar-TN" };

/** Montant en dinars : 3 décimales (millimes), « DT » en français, « TND » ailleurs, « د.ت » en arabe. */
export function formatMoney(amount: number | null | undefined, lang = "fr", currency = "TND"): string {
  const n = Number(amount) || 0;
  const digits = currency === "TND" ? 3 : 2;
  const value = new Intl.NumberFormat(INTL[lang] || INTL.fr, { minimumFractionDigits: digits, maximumFractionDigits: digits, numberingSystem: "latn" } as Intl.NumberFormatOptions).format(n);
  const symbol = currency !== "TND" ? currency : lang === "fr" ? "DT" : lang === "ar" ? "د.ت" : "TND";
  return `${value} ${symbol}`;
}

/** Prix d'une formule : sans décimales inutiles (« 49 DT », « 58,310 DT »). */
export function formatPrice(amount: number | null | undefined, lang = "fr", currency = "TND"): string {
  const n = Number(amount) || 0;
  if (Number.isInteger(n)) {
    const symbol = currency !== "TND" ? currency : lang === "fr" ? "DT" : lang === "ar" ? "د.ت" : "TND";
    return `${new Intl.NumberFormat(INTL[lang] || INTL.fr, { numberingSystem: "latn" } as Intl.NumberFormatOptions).format(n)} ${symbol}`;
  }
  return formatMoney(n, lang, currency);
}

/** Date et heure à l'heure de Tunis, dans la langue de l'interface. */
export function formatDateTime(value: string | Date | null | undefined, lang = "fr", withTime = true): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(INTL[lang] || INTL.fr, {
    dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}), timeZone: "Africa/Tunis", numberingSystem: "latn",
  } as Intl.DateTimeFormatOptions).format(d);
}

/** « +216 22 535 181 » pour un numéro tunisien enregistré au format international. */
export function formatPhone(value: string | null | undefined): string {
  const s = String(value ?? "");
  const m = /^\+216(\d{2})(\d{3})(\d{3})$/.exec(s);
  return m ? `+216 ${m[1]} ${m[2]} ${m[3]}` : s;
}

/** Nom d'un secteur dans la langue de l'interface. */
export function sectorName(sector: Pick<Sector, "name" | "nameEn" | "nameAr">, lang = "fr"): string {
  if (lang === "ar" && sector.nameAr) return sector.nameAr;
  if ((lang === "en" || lang === "es") && sector.nameEn) return sector.nameEn;
  return sector.name;
}

/** Prix TTC à partir d'un prix HT et du taux de TVA de la plateforme. */
export const withVat = (amountHT: number, vatRate: number) => Math.round(amountHT * (1 + (Number(vatRate) || 0) / 100) * 1000) / 1000;
