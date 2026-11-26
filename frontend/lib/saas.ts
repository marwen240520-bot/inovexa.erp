// lib/saas.ts
// Types et appels communs de la couche SaaS (formules, secteurs, abonnement). Voir docs/SAAS-API.md.
//  - routes publiques  : publicGet("/public/plans")            — sans jeton
//  - routes connectées : api("/billing/subscription") du kit   — jeton ajouté automatiquement
import type { AccountState } from "@/lib/session";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export const MODULE_KEYS = [
  "dashboard", "products", "categories", "stock", "sales", "purchases", "pos", "orders", "clients", "suppliers",
  "invoices", "hr", "finance", "logistics", "production", "appointments", "projects", "ai", "reports", "analytics", "objectives",
  "profile", "settings",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
/** Toujours actifs, quel que soit l'abonnement. */
export const CORE_MODULES: readonly string[] = ["dashboard", "profile", "settings"];
/** Modules proposés à l'activation (tous sauf ceux qui sont toujours ouverts). */
export const SELECTABLE_MODULES: ModuleKey[] = MODULE_KEYS.filter((k) => !CORE_MODULES.includes(k));

/** Nom français de chaque module (écrans de l'administrateur). */
export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord", products: "Produits", categories: "Catégories", stock: "Stock", sales: "Ventes", purchases: "Achats",
  pos: "Caisse", orders: "Commandes", clients: "Clients", suppliers: "Fournisseurs", invoices: "Factures & devis", hr: "RH & paie",
  finance: "Finance & comptabilité", logistics: "Logistique", production: "Production", appointments: "Rendez-vous", projects: "Projets",
  ai: "Assistant IA", reports: "Rapports",
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
  id: number; code: string; name: string; nameEn: string | null; description: string | null;
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
  googleClientId: string | null;
  /** Identifiant de service Apple ; null = « Continuer avec Apple » non configuré : le bouton n'est pas affiché. */
  appleClientId?: string | null;
  /** Moyens de paiement proposés aux clients (codes : card, edinar — et bank_transfer, d17… si le hors-ligne est activé). */
  paymentMethods?: string[];
  /** true : le paiement en ligne par carte est actif sur le serveur. */
  onlinePayment?: boolean;
  modules: string[];
}

export interface SubscriptionPayment {
  id: number; userId: number; planCode: string; planName: string; billingCycle: "monthly" | "annual"; periodMonths: number;
  amountHT: number; vatRate: number; amountTTC: number; currency: string; method: string; provider: string;
  reference: string | null; note: string | null; status: "pending" | "validated" | "rejected" | "cancelled" | "initiated" | "expired" | "refunded"; rejectReason: string | null;
  declaredBy: "client" | "admin"; validatedAt: string | null; periodStart: string | null; periodEnd: string | null; receiptNumber: string | null; createdAt: string;
}

export interface SubscriptionView {
  account: AccountState;
  company: { name: string | null; email: string };
  plan: Plan | null;
  users: { used: number; limit: number | null };
  modules: Record<string, boolean>;
  /** Paiement HORS LIGNE déclaré, en attente de validation par l'administrateur (seulement si le hors-ligne est activé). */
  pendingPayment: SubscriptionPayment | null;
  /** Page de paiement par carte encore ouverte : à reprendre plutôt que d'en ouvrir une autre. */
  checkout?: CheckoutSession | null;
  payment: {
    currency: string; vatRate: number;
    /** Paiement en ligne par carte : l'accès s'ouvre tout seul dès que le prestataire confirme l'encaissement. */
    online?: { enabled: boolean; provider: string; test: boolean; methods: string[] };
    onlinePayment: boolean;
    /** true : l'administrateur accepte aussi les paiements hors ligne (virement, chèque…), qu'il valide lui-même. */
    manual?: boolean;
    instructions: string | null; methods: string[];
    link?: string | null;
  };
  /** false : le serveur n'envoie pas d'emails (SMTP non configuré) — inutile de proposer « renvoyer le code ». */
  emailEnabled?: boolean;
  support: { email: string | null; phone: string | null; whatsapp: string | null };
  /** false pour un membre d'équipe : seul le propriétaire gère l'abonnement. */
  canManage: boolean;
}

export interface CheckoutSession {
  id: number; payUrl: string; expiresAt: string; amountTTC: number; currency: string; planCode?: string; billingCycle?: string; resumed?: boolean;
}

/** Réponse de POST /billing/checkout/:id/verify : ce que le prestataire de paiement dit de ce paiement. */
export interface CheckoutResult {
  status: "paid" | "pending" | "expired" | "unknown";
  payment: { id: number; status: string; planName: string; billingCycle: string; amountTTC: number; currency: string; receiptNumber: string | null; periodEnd: string | null } | null;
  account: AccountState;
}

/** GET /billing/modules : secteur et modules de la société, choisis par le client lui-même. */
export interface ModulesView {
  sector: string | null;
  plan: { code: string; name: string; allModules: boolean } | null;
  trial: boolean;
  modules: Array<{ key: string; enabled: boolean; included: boolean; recommended: boolean }>;
  sectors: Array<{ code: string; name: string; nameEn: string | null; modules: string[] }>;
}

export interface Receipt {
  receiptNumber: string; issuedAt: string; planName: string; billingCycle: string; periodStart: string; periodEnd: string;
  amountHT: number; vatRate: number; vatAmount: number; amountTTC: number; currency: string; method: string; reference: string | null;
  /** Identité légale de l’éditeur (réglages de la plateforme) ; null tant que l’administrateur ne l’a pas renseignée. */
  issuer?: { name: string; taxId: string | null; address: string | null; registry: string | null; email: string | null; phone: string | null } | null;
  customer: { name: string; taxId: string | null; address: string | null; email: string | null }; notice: string;
}

// ───────────── Serveur qui redémarre : on patiente au lieu d'afficher une erreur ─────────────

/** Réponses d'un hébergeur dont le serveur redémarre ou se réveille : la requête n'a pas été traitée, on peut la refaire. */
const WAKING = new Set([502, 503, 504]);
/**
 * Une réponse 502/503/504 en JSON vient de NOTRE application (« paiement indisponible », « prestataire injoignable »…) :
 * c'est une vraie réponse, à afficher telle quelle. Seule la page d'erreur de l'hébergeur (HTML) signale un redémarrage.
 */
const isWaking = (res: Response) => WAKING.has(res.status) && !(res.headers.get("content-type") || "").includes("application/json");
/** Attentes successives avant de réessayer (≈ 45 s au total : le temps de réveil d'un serveur en veille). */
const RETRY_DELAYS_MS = [1500, 3000, 5000, 8000, 12000, 15000];
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type WakingListener = (waiting: boolean) => void;
const wakingListeners = new Set<WakingListener>();
/** S'abonner à « le serveur démarre, on réessaie » (pour afficher un message d'attente). Renvoie la fonction de désabonnement. */
export function onServerWaking(listener: WakingListener): () => void {
  wakingListeners.add(listener);
  return () => { wakingListeners.delete(listener); };
}
const announce = (waiting: boolean) => wakingListeners.forEach((l) => { try { l(waiting); } catch { /* un écran fermé ne bloque pas les autres */ } });

/**
 * fetch avec nouvelles tentatives quand le serveur redémarre.
 *  - 502 / 503 / 504 renvoyés par l'hébergeur : la requête n'a pas atteint l'application → toujours rejouée ;
 *  - coupure réseau (aucune réponse) : rejouée seulement si `safe` (lecture, ou envoi sans effet en double).
 */
export async function fetchWithRetry(url: string, init: RequestInit | undefined, safe: boolean): Promise<Response | null> {
  let announced = false;
  try {
    for (let attempt = 0; ; attempt++) {
      let res: Response | null = null;
      try {
        res = await fetch(url, init);
      } catch {
        res = null;
      }
      const retry = res ? isWaking(res) : safe;
      if (!retry || attempt >= RETRY_DELAYS_MS.length) return res;
      if (!announced && attempt >= 1) { announced = true; announce(true); }
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  } finally {
    if (announced) announce(false);
  }
}

/** Lecture d'une route publique de l'API (sans jeton). Lève une erreur avec le message du serveur. */
export async function publicGet<T>(path: string): Promise<T> {
  const res = await fetchWithRetry(`${API_URL}${path}`, { headers: { Accept: "application/json" } }, true);
  if (!res) throw new Error("Impossible de joindre le serveur.");
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const m = (data as any)?.message;
    throw new Error(Array.isArray(m) ? m.join(" · ") : m || `Erreur ${res.status}`);
  }
  return data as T;
}

/**
 * Envoi JSON sans jeton (inscription, connexion, mot de passe oublié). Renvoie le statut ET le corps, sans lever d'erreur HTTP.
 * `safe` : l'envoi peut être rejoué après une coupure réseau (connexion, demande de lien) — pas une création de compte.
 */
export async function publicPost<T = any>(path: string, body: unknown, opts: { safe?: boolean } = {}): Promise<{ ok: boolean; status: number; data: T; message: string }> {
  const res = await fetchWithRetry(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, opts.safe === true);
  if (!res) return { ok: false, status: 0, data: null as T, message: "" };
  const data = await res.json().catch(() => null);
  const m = (data as any)?.message;
  return { ok: res.ok, status: res.status, data: data as T, message: Array.isArray(m) ? m.join(" · ") : m || "" };
}

// ───────────── Formats ─────────────

const INTL: Record<string, string> = { fr: "fr-TN", en: "en-GB", es: "es-ES" };

/** Symbole d'une devise dans la langue de l'interface : « $ », « € », et pour le dinar « DT » (français) / « TND ». */
export function currencySymbol(currency = "USD", lang = "fr"): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  if (currency === "TND") return lang === "fr" ? "DT" : "TND";
  return currency;
}

function withSymbol(value: string, currency: string, lang: string): string {
  const symbol = currencySymbol(currency, lang);
  // « $29 » en anglais ; « 29 $ » en français et en espagnol ; le dinar s'écrit toujours après le montant.
  if (currency === "USD" && lang === "en") return `${symbol}${value}`;
  if (currency === "EUR" && lang === "en") return `${symbol}${value}`;
  return `${value} ${symbol}`;
}

/** Montant complet : 2 décimales (3 pour le dinar, qui se compte en millimes). */
export function formatMoney(amount: number | null | undefined, lang = "fr", currency = "USD"): string {
  const n = Number(amount) || 0;
  const digits = currency === "TND" ? 3 : 2;
  const value = new Intl.NumberFormat(INTL[lang] || INTL.fr, { minimumFractionDigits: digits, maximumFractionDigits: digits, numberingSystem: "latn" } as Intl.NumberFormatOptions).format(n);
  return withSymbol(value, currency, lang);
}

/** Prix d'une formule : sans décimales inutiles (« 29 $ », « 34,51 $ »). */
export function formatPrice(amount: number | null | undefined, lang = "fr", currency = "USD"): string {
  const n = Number(amount) || 0;
  if (Number.isInteger(n)) return withSymbol(new Intl.NumberFormat(INTL[lang] || INTL.fr, { numberingSystem: "latn" } as Intl.NumberFormatOptions).format(n), currency, lang);
  return formatMoney(n, lang, currency);
}

/** Date et heure à l'heure de Tunis, dans la langue de l'interface. */
export function formatDateTime(value: string | Date | null | undefined, lang = "fr", withTime = true): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(INTL[lang] || INTL.fr, {
    // Heure sur 24 h (« 14:30 ») : c'est l'usage en Tunisie ; sans cela « fr-TN » affiche « 2:30 PM ».
    dateStyle: "medium", ...(withTime ? { timeStyle: "short", hourCycle: "h23" } : {}), timeZone: "Africa/Tunis", numberingSystem: "latn",
  } as Intl.DateTimeFormatOptions).format(d);
}

/** Heure seule (« 14:30 »), à l'heure de Tunis. */
export function formatTime(value: string | Date | null | undefined, lang = "fr"): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(INTL[lang] || INTL.fr, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Tunis", numberingSystem: "latn" } as Intl.DateTimeFormatOptions).format(d);
}

/** « +216 22 535 181 » pour un numéro tunisien enregistré au format international. */
export function formatPhone(value: string | null | undefined): string {
  const s = String(value ?? "");
  const m = /^\+216(\d{2})(\d{3})(\d{3})$/.exec(s);
  return m ? `+216 ${m[1]} ${m[2]} ${m[3]}` : s;
}

/** Nom d'un secteur dans la langue de l'interface. */
export function sectorName(sector: Pick<Sector, "name" | "nameEn">, lang = "fr"): string {
  if ((lang === "en" || lang === "es") && sector.nameEn) return sector.nameEn;
  return sector.name;
}

/** Prix TTC à partir d'un prix HT et du taux de TVA de la plateforme (au centime ; au millime pour le dinar). */
export const withVat = (amountHT: number, vatRate: number, currency = "USD") => {
  const unit = currency === "TND" ? 1000 : 100;
  return Math.round(amountHT * (1 + (Number(vatRate) || 0) / 100) * unit) / unit;
};
