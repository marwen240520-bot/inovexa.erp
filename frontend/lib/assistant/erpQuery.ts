// ============================================================
//  lib/assistant/erpQuery.ts — Moteur de requêtes EXACTES sur les données ERP
//
//  Toutes les réponses chiffrées de l'Assistant IA passent par ici :
//  les calculs sont faits en code (jamais « devinés » par le modèle),
//  sur l'intégralité des enregistrements (aucun échantillon tronqué).
//
//  v2 — couvre les 12 modules de l'ERP :
//    ventes, achats, produits, catégories, clients, commandes, factures,
//    employés, fournisseurs, dépenses, projets, livraisons.
//
//  + queryData() : moteur analytique GÉNÉRIQUE (filtres, regroupements,
//    agrégats, séries temporelles) pour répondre aux questions que les
//    outils spécialisés ne prévoient pas (« ventes par moyen de paiement »,
//    « CA par catégorie au T2 », « dépenses par catégorie ce mois »,
//    « salaire moyen par département », « heure de pointe des ventes »…).
//
//  Partagé par :
//   - la route serveur /api/ai/chat (outils appelés par Claude)
//   - l'assistant hors-ligne (lib/assistant/localAssistant.ts)
// ============================================================

import { Period, previousPeriod, previousToDate, toIso } from "./period";

export interface ErpData {
  sales?: any[];
  purchases?: any[];
  products?: any[];
  categories?: any[];
  clients?: any[];
  orders?: any[];
  invoices?: any[];
  employees?: any[];
  suppliers?: any[];
  expenses?: any[];
  projects?: any[];
  shipments?: any[];
}

export type ModuleName = keyof ErpData;

export const MODULES: ModuleName[] = [
  "sales", "purchases", "products", "categories", "clients", "orders",
  "invoices", "employees", "suppliers", "expenses", "projects", "shipments",
];

/** Chemin de l'API backend pour chaque module (GET → tableau). */
export const MODULE_ENDPOINTS: Record<ModuleName, string> = {
  sales: "sales",
  purchases: "purchases",
  products: "products",
  categories: "categories",
  clients: "clients",
  orders: "orders",
  invoices: "invoices",
  employees: "employees",
  suppliers: "suppliers",
  expenses: "expenses",
  projects: "projects",
  shipments: "logistics/shipments",
};

/** Page de l'application correspondant à chaque module (liens dans les réponses). */
export const MODULE_ROUTES: Record<ModuleName, string> = {
  sales: "/dashboard/sales",
  purchases: "/dashboard/purchases",
  products: "/dashboard/products",
  categories: "/dashboard/categories",
  clients: "/dashboard/clients",
  orders: "/dashboard/orders",
  invoices: "/dashboard/invoices",
  employees: "/dashboard/hr",
  suppliers: "/dashboard/suppliers",
  expenses: "/dashboard/finance",
  projects: "/dashboard/finance",
  shipments: "/dashboard/logistics",
};

// ── Utilitaires numériques / dates ──────────────────────────
const DAY = 86400000;

export function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(String(v).replace(/[\s\u00a0]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
const firstNum = (...vals: unknown[]) => {
  for (const v of vals) {
    if (v === null || v === undefined || v === "") continue;
    const n = num(v);
    if (n !== 0 || v === 0 || v === "0") return n;
  }
  return 0;
};
export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
// min / max sans « ... » : Math.min(...tableau) plante au-delà de ~100 000 éléments
const minOf = (xs: number[]) => {
  let m = Infinity;
  for (const x of xs) if (x < m) m = x;
  return m;
};
const maxOf = (xs: number[]) => {
  let m = -Infinity;
  for (const x of xs) if (x > m) m = x;
  return m;
};
const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);
const isoDay = (d: Date | null) => (d ? toIso(d) : null);
const parseDate = (raw: unknown): Date | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const d = new Date(raw as any);
  return isNaN(d.getTime()) ? null : d;
};

/** Date de référence d'un enregistrement (création par défaut). */
export function recordDate(r: any): Date | null {
  return parseDate(r?.saleDate ?? r?.date ?? r?.invoiceDate ?? r?.orderDate ?? r?.createdAt ?? r?.created_at);
}

/** Date de référence selon le module (embauche pour les employés, date de dépense…). */
export function moduleDate(mod: ModuleName, r: any): Date | null {
  if (mod === "employees") return parseDate(r?.hireDate) ?? recordDate(r);
  if (mod === "expenses") return parseDate(r?.date) ?? recordDate(r);
  return recordDate(r);
}

const inPeriodOf = (mod: ModuleName) => (r: any, p?: Period | null) => {
  if (!p) return true;
  const d = moduleDate(mod, r);
  return !!d && d >= p.start && d < p.end;
};
const inPeriod = inPeriodOf("sales");

const periodOut = (p: Period | null) =>
  p ? { start: toIso(p.start), end: toIso(new Date(p.end.getTime() - DAY)) } : { start: "all", end: "all" };

// ── Statuts (FR / EN / ES) ──────────────────────────────────
export const isCancelled = (status: unknown) => /cancel|annul|refund|rembours|void|rejet|reject|anulad|devuel/i.test(String(status ?? ""));
export const isPaid = (status: unknown) =>
  /^(paid|payee?s?|pagad[oa]s?|cobrad[oa]s?|settled|regle?e?s?|acquitte?e?s?|encaisse?e?s?)$/i.test(stripAccents(String(status ?? "").trim()));
const isPendingStatus = (status: unknown) => /pending|attente|pendiente|process|en cours|cours|draft|brouillon|nouveau|new|confirm/i.test(String(status ?? ""));

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Statut canonique : permet de filtrer « payé », « paid », « pagado » indifféremment. */
export function canonStatus(s: unknown): string {
  const v = stripAccents(String(s ?? "").toLowerCase()).trim();
  if (!v) return "";
  if (/cancel|annul|anulad|void|rejet|reject|refus/.test(v)) return "cancelled";
  if (/refund|rembours|devuel/.test(v)) return "refunded";
  if (/overdue|retard|vencid|echu/.test(v)) return "overdue";
  if (/unpaid|impay|impagad|non paye|no pagad/.test(v)) return "unpaid";
  if (/partial|partiel/.test(v)) return "partial";
  if (/^(paid|payee?s?|pagad[oa]s?|cobrad[oa]s?|settled|regle?e?s?|acquitte?e?s?|encaisse?e?s?)$/.test(v)) return "paid";
  if (/deliver|livr|entregad/.test(v)) return "delivered";
  if (/ship|expedi|envoy|enviad|transit|route/.test(v)) return "shipped";
  if (/complet|termin|finish|done|clotur|cerrad|finaliz|valid/.test(v)) return "completed";
  if (/progress|en cours|curso|process|traitement/.test(v)) return "in_progress";
  if (/pending|attente|pendiente|waiting/.test(v)) return "pending";
  if (/draft|brouillon|borrador/.test(v)) return "draft";
  if (/inactiv|inactif|desactiv|suspend|archiv/.test(v)) return "inactive";
  if (/^(active|actif|active?s?|activo|activa|enabled)$/.test(v)) return "active";
  return v;
}

// ── Montants ────────────────────────────────────────────────
export function saleAmount(s: any): number {
  const t = firstNum(s?.total, s?.amount, s?.totalTTC);
  if (t) return t;
  return num(s?.quantity || 1) * num(s?.unitPrice ?? s?.price);
}
export function invoiceAmount(iv: any): number {
  return firstNum(iv?.amount, iv?.totalTTC, iv?.total, iv?.subtotalHT);
}
export const purchaseAmount = (p: any) => firstNum(p?.total, p?.amount) || num(p?.quantity || 1) * num(p?.unitPrice);
const isCreditNote = (iv: any) => /credit|avoir|nota de credito|abono/i.test(String(iv?.type ?? ""));
/** Facture fournisseur (et non client). */
export const isSupplierInvoice = (iv: any) =>
  /supplier|fournisseur|proveedor|achat|purchase|compra/i.test(String(iv?.type ?? "")) || (!!iv?.supplierId && !iv?.clientId) || (!!String(iv?.supplierName ?? "").trim() && !String(iv?.clientName ?? "").trim());

const productNameOf = (s: any) => String(s?.productName ?? s?.product?.name ?? (typeof s?.product === "string" ? s.product : "") ?? "").trim() || "—";
const clientNameOf = (r: any) => String(r?.clientName ?? r?.client?.name ?? r?.customerName ?? "").trim();
const supplierNameOf = (r: any) => String(r?.supplierName ?? r?.supplier?.name ?? (typeof r?.supplier === "string" ? r.supplier : "") ?? r?.vendor ?? "").trim();
const employeeName = (e: any) => String(e?.name ?? `${e?.firstName ?? ""} ${e?.lastName ?? ""}`).trim();
const stockQty = (p: any) => num(p?.quantity ?? p?.stock);

// ── Correspondance de noms tolérante (accents, ordre, fautes) ──
// Mémoïsation : les mêmes noms (clients, produits, statuts) reviennent des milliers de fois.
const normCache = new Map<string, string>();
const sortedCache = new Map<string, string>();
export function normName(s: unknown): string {
  const raw = String(s ?? "");
  const hit = normCache.get(raw);
  if (hit !== undefined) return hit;
  const v = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
  if (normCache.size > 50000) normCache.clear();
  normCache.set(raw, v);
  return v;
}
/** Forme normalisée et triée (« Ouni Ahmed » ≡ « ahmed ouni »). */
function sortedName(s: unknown): string {
  const n = normName(s);
  const hit = sortedCache.get(n);
  if (hit !== undefined) return hit;
  const v = n.split(" ").sort().join(" ");
  if (sortedCache.size > 50000) sortedCache.clear();
  sortedCache.set(n, v);
  return v;
}
function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}
const tokenMatch = (qt: string, nt: string) =>
  nt === qt || (qt.length >= 3 && nt.startsWith(qt)) || (qt.length >= 4 && nt.length >= 4 && lev(qt, nt) <= 1);

/** Score 0..1.2 : ≥ 1 = tous les mots de la requête retrouvés dans le nom. */
export function nameScore(query: string, name: string): number {
  const q = normName(query);
  const n = normName(name);
  if (!q || !n) return 0;
  if (q === n) return 1.2;
  const qt = q.split(" ").filter((t) => t.length >= 2);
  const nt = n.split(" ");
  if (!qt.length) return 0;
  const hits = qt.filter((t) => nt.some((x) => tokenMatch(t, x))).length;
  let score = hits / qt.length;
  // Bonus si le nom complet est couvert (« ahmed ouni » ↔ « Ouni Ahmed »)
  if (hits === qt.length && nt.every((x) => qt.some((t) => tokenMatch(t, x)))) score += 0.1;
  return score;
}
const sameName = (a: string, b: string) => {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return sortedName(x) === sortedName(y);
};

function countBy<T>(list: T[], key: (x: T) => string) {
  const m: Record<string, number> = {};
  list.forEach((x) => (m[key(x)] = (m[key(x)] ?? 0) + 1));
  return m;
}

// ── Index (produits ↔ catégories, coûts d'achat) — mis en cache par jeu de données ──
interface Catalog {
  productById: Map<string, any>;
  productByName: Map<string, any>;
  categoryById: Map<string, string>;
  /** Coût d'achat unitaire moyen pondéré par produit (clé = id ou nom normalisé). */
  unitCost: Map<string, number>;
}
const catalogCache = new WeakMap<object, Catalog>();

function catalog(data: ErpData): Catalog {
  const hit = catalogCache.get(data);
  if (hit) return hit;
  const productById = new Map<string, any>();
  const productByName = new Map<string, any>();
  arr(data.products).forEach((p) => {
    if (p?.id != null) productById.set(String(p.id), p);
    if (p?.name) productByName.set(normName(p.name), p);
  });
  const categoryById = new Map<string, string>();
  arr(data.categories).forEach((c) => c?.id != null && c?.name && categoryById.set(String(c.id), String(c.name)));

  const costAcc = new Map<string, { qty: number; amount: number }>();
  arr(data.purchases).forEach((x) => {
    if (isCancelled(x?.status)) return;
    const q = num(x?.quantity || 0);
    const unit = num(x?.unitPrice) || (q ? purchaseAmount(x) / q : 0);
    if (!q || !unit) return;
    const keys = [x?.productId != null ? `id:${x.productId}` : "", x?.productName ? `n:${normName(x.productName)}` : ""].filter(Boolean);
    keys.forEach((k) => {
      const e = costAcc.get(k) ?? { qty: 0, amount: 0 };
      e.qty += q;
      e.amount += q * unit;
      costAcc.set(k, e);
    });
  });
  const unitCost = new Map<string, number>();
  costAcc.forEach((v, k) => v.qty && unitCost.set(k, v.amount / v.qty));

  const c: Catalog = { productById, productByName, categoryById, unitCost };
  catalogCache.set(data, c);
  return c;
}

function productOf(data: ErpData, r: any): any | null {
  const c = catalog(data);
  if (r?.productId != null && c.productById.has(String(r.productId))) return c.productById.get(String(r.productId));
  const n = normName(r?.productName ?? r?.product);
  return n ? c.productByName.get(n) ?? null : null;
}

function categoryNameOfProduct(data: ErpData, p: any): string | null {
  if (!p) return null;
  if (p.category && typeof p.category === "object" && p.category.name) return String(p.category.name);
  if (typeof p.category === "string" && p.category.trim()) return p.category.trim();
  if (p.categoryName) return String(p.categoryName);
  if (p.categoryId != null) return catalog(data).categoryById.get(String(p.categoryId)) ?? null;
  return null;
}

/** Coût d'achat unitaire connu d'un produit (moyenne pondérée des achats), sinon champ cost/purchasePrice. */
export function productUnitCost(data: ErpData, ref: { productId?: any; productName?: any; id?: any; name?: any; cost?: any; purchasePrice?: any }): number | null {
  const c = catalog(data);
  const id = ref.productId ?? ref.id;
  if (id != null && c.unitCost.has(`id:${id}`)) return c.unitCost.get(`id:${id}`)!;
  const n = normName(ref.productName ?? ref.name);
  if (n && c.unitCost.has(`n:${n}`)) return c.unitCost.get(`n:${n}`)!;
  const p = id != null ? c.productById.get(String(id)) : n ? c.productByName.get(n) : null;
  const explicit = num(ref.cost ?? ref.purchasePrice ?? p?.cost ?? p?.purchasePrice);
  return explicit > 0 ? explicit : null;
}

// ═══════════════════════════════════════════════════════════
//  CHIFFRE D'AFFAIRES
// ═══════════════════════════════════════════════════════════
export interface RevenueResult {
  period: { start: string; end: string };
  revenue: number;
  salesCount: number;
  cancelledCount: number;
  averageTicket: number;
  quantitySold: number;
  paidRevenue: number;
  invoicedAmount: number;
  invoicesCount: number;
  topProducts: Array<{ name: string; revenue: number; quantity: number }>;
  topClients: Array<{ name: string; revenue: number; sales: number }>;
  byPaymentMethod?: Record<string, number>;
  byMonth?: Array<{ month: string; revenue: number; sales: number }>;
  previous?: { period: { start: string; end: string }; revenue: number; salesCount: number; growthPct: number | null; note?: string };
  note?: string;
}

export function revenueSummary(data: ErpData, p: Period | null, opts: { compare?: boolean; now?: Date } = {}): RevenueResult {
  const now = opts.now ?? new Date();
  const inP = arr(data.sales).filter((s) => inPeriod(s, p));
  const valid = inP.filter((s) => !isCancelled(s?.status));
  const revenue = valid.reduce((t, s) => t + saleAmount(s), 0);
  const paidRevenue = valid.filter((s) => /paid|pay|complet|termin|livr|deliver|pagad|cobrad/i.test(String(s?.status ?? ""))).reduce((t, s) => t + saleAmount(s), 0);

  const byProd = new Map<string, { revenue: number; quantity: number }>();
  const byClient = new Map<string, { revenue: number; sales: number }>();
  const byMonth = new Map<string, { revenue: number; sales: number }>();
  const byPay: Record<string, number> = {};
  valid.forEach((s) => {
    const amt = saleAmount(s);
    const pn = productNameOf(s);
    const e = byProd.get(pn) ?? { revenue: 0, quantity: 0 };
    e.revenue += amt;
    e.quantity += num(s?.quantity || 1);
    byProd.set(pn, e);
    const cn = clientNameOf(s);
    if (cn) {
      const c = byClient.get(cn) ?? { revenue: 0, sales: 0 };
      c.revenue += amt;
      c.sales += 1;
      byClient.set(cn, c);
    }
    const pm = String(s?.paymentMethod ?? "").trim() || "—";
    byPay[pm] = r2((byPay[pm] ?? 0) + amt);
    const d = recordDate(s);
    if (d) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = byMonth.get(k) ?? { revenue: 0, sales: 0 };
      m.revenue += amt;
      m.sales += 1;
      byMonth.set(k, m);
    }
  });

  const invs = arr(data.invoices).filter((iv) => inPeriod(iv, p) && !isCancelled(iv?.status) && !isCreditNote(iv) && !isSupplierInvoice(iv));
  const res: RevenueResult = {
    period: periodOut(p),
    revenue: r2(revenue),
    salesCount: valid.length,
    cancelledCount: inP.length - valid.length,
    averageTicket: valid.length ? r2(revenue / valid.length) : 0,
    quantitySold: valid.reduce((t, s) => t + num(s?.quantity || 1), 0),
    paidRevenue: r2(paidRevenue),
    invoicedAmount: r2(invs.reduce((t, iv) => t + invoiceAmount(iv), 0)),
    invoicesCount: invs.length,
    topProducts: [...byProd.entries()].map(([name, v]) => ({ name, revenue: r2(v.revenue), quantity: v.quantity })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    topClients: [...byClient.entries()].map(([name, v]) => ({ name, revenue: r2(v.revenue), sales: v.sales })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
  if (Object.keys(byPay).length > 1 || (Object.keys(byPay).length === 1 && !byPay["—"])) res.byPaymentMethod = byPay;
  if (!p || p.end.getTime() - p.start.getTime() > 45 * DAY) {
    res.byMonth = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, revenue: r2(v.revenue), sales: v.sales }));
  }
  if (!valid.length && invs.length) res.note = "no sales recorded in this period, but client invoices exist: report invoicedAmount as invoiced revenue";

  if (opts.compare && p) {
    const prevFair = previousToDate(p, now);
    const prev = prevFair ?? previousPeriod(p, now);
    const pr = revenueSummary(data, prev, { now });
    res.previous = {
      period: pr.period,
      revenue: pr.revenue,
      salesCount: pr.salesCount,
      growthPct: pr.revenue ? r2(((res.revenue - pr.revenue) / pr.revenue) * 100) : null,
      note: prevFair ? "same number of elapsed days in the previous period" : undefined,
    };
  }
  return res;
}

/** CA mois par mois pour une année civile. */
export function monthlyRevenue(data: ErpData, year: number) {
  const months = Array.from({ length: 12 }, (_, m) => ({ month: `${year}-${String(m + 1).padStart(2, "0")}`, revenue: 0, sales: 0 }));
  arr(data.sales).forEach((s) => {
    if (isCancelled(s?.status)) return;
    const d = recordDate(s);
    if (!d || d.getFullYear() !== year) return;
    months[d.getMonth()].revenue += saleAmount(s);
    months[d.getMonth()].sales += 1;
  });
  months.forEach((m) => (m.revenue = r2(m.revenue)));
  const total = r2(months.reduce((t, m) => t + m.revenue, 0));
  const best = months.reduce((a, b) => (b.revenue > a.revenue ? b : a), months[0]);
  const active = months.filter((m) => m.revenue > 0);
  return {
    year,
    total,
    months,
    bestMonth: best.revenue > 0 ? best.month : null,
    worstActiveMonth: active.length ? active.reduce((a, b) => (b.revenue < a.revenue ? b : a)).month : null,
    averagePerActiveMonth: active.length ? r2(total / active.length) : 0,
  };
}

// ═══════════════════════════════════════════════════════════
//  CLIENTS
// ═══════════════════════════════════════════════════════════
export interface ClientCandidate {
  name: string;
  score: number;
  source: "clients" | "sales" | "orders" | "invoices";
  record?: any;
}

export function findClientCandidates(data: ErpData, query: string): ClientCandidate[] {
  const out = new Map<string, ClientCandidate>();
  const add = (name: string, source: ClientCandidate["source"], record?: any) => {
    if (!name) return;
    const score = nameScore(query, name);
    if (score < 0.99) return;
    const key = normName(name).split(" ").sort().join(" ");
    const prev = out.get(key);
    if (!prev || (source === "clients" && prev.source !== "clients") || score > prev.score) out.set(key, { name, score, source, record: record ?? prev?.record });
  };
  arr(data.clients).forEach((c) => add(String(c?.name ?? ""), "clients", c));
  arr(data.sales).forEach((s) => add(clientNameOf(s), "sales"));
  arr(data.orders).forEach((o) => add(clientNameOf(o), "orders"));
  arr(data.invoices).forEach((iv) => !isSupplierInvoice(iv) && add(clientNameOf(iv), "invoices"));
  // Recherche aussi par email / téléphone
  const qCompact = normName(query).replace(/ /g, "");
  const qDigits = String(query ?? "").replace(/\D/g, "");
  if (qCompact.length >= 5 || qDigits.length >= 6) {
    arr(data.clients).forEach((c) => {
      const email = normName(c?.email).replace(/ /g, "");
      const phone = String(c?.phone ?? "").replace(/\D/g, "");
      const hit = (qCompact.length >= 5 && !!email && email.includes(qCompact)) || (qDigits.length >= 6 && !!phone && phone.includes(qDigits));
      if (!hit || !c?.name) return;
      const key = normName(c.name).split(" ").sort().join(" ");
      if (!out.has(key)) out.set(key, { name: String(c.name), score: 1, source: "clients", record: c });
    });
  }
  return [...out.values()].sort((a, b) => b.score - a.score || (a.source === "clients" ? -1 : 1));
}

export function clientProfile(data: ErpData, query: string, now = new Date()) {
  const candidates = findClientCandidates(data, query);
  if (!candidates.length) return { found: false as const, query, suggestions: suggestNames(data, query) };
  const best = candidates[0];
  const ambiguous = candidates.filter((c) => c.score >= best.score - 0.05 && !sameName(c.name, best.name));
  const name = best.name;
  const rec = best.record ?? arr(data.clients).find((c) => sameName(c?.name, name));
  const matchRec = (r: any) => sameName(clientNameOf(r), name) || (rec?.id != null && r?.clientId != null && String(r.clientId) === String(rec.id));

  const sales = arr(data.sales).filter(matchRec);
  const validSales = sales.filter((s) => !isCancelled(s?.status));
  const orders = arr(data.orders).filter(matchRec);
  const invoices = arr(data.invoices).filter((iv) => !isSupplierInvoice(iv) && matchRec(iv));
  const unpaid = invoices.filter((iv) => !isPaid(iv?.status) && !isCancelled(iv?.status) && !isCreditNote(iv));
  const overdue = unpaid.filter((iv) => iv?.dueDate && new Date(iv.dueDate) < now);
  const shipments = arr(data.shipments).filter(matchRec);
  const dates = validSales.map(recordDate).filter(Boolean) as Date[];
  const total = validSales.reduce((t, s) => t + saleAmount(s), 0);

  const prodMap = new Map<string, { revenue: number; quantity: number }>();
  validSales.forEach((s) => {
    const pn = productNameOf(s);
    const e = prodMap.get(pn) ?? { revenue: 0, quantity: 0 };
    e.revenue += saleAmount(s);
    e.quantity += num(s?.quantity || 1);
    prodMap.set(pn, e);
  });
  const thisYear = now.getFullYear();
  const ytd = validSales.filter((s) => recordDate(s)?.getFullYear() === thisYear).reduce((t, s) => t + saleAmount(s), 0);
  const lastYear = validSales.filter((s) => recordDate(s)?.getFullYear() === thisYear - 1).reduce((t, s) => t + saleAmount(s), 0);
  const last = dates.length ? new Date(maxOf(dates.map((d) => d.getTime()))) : null;
  const daysSinceLast = last ? Math.floor((now.getTime() - last.getTime()) / DAY) : null;

  return {
    found: true as const,
    name,
    otherMatches: ambiguous.slice(0, 5).map((c) => c.name),
    contact: rec
      ? {
          id: rec.id ?? null,
          email: rec.email ?? null,
          phone: rec.phone ?? null,
          address: rec.address ?? null,
          status: rec.status ?? null,
          customerSince: isoDay(recordDate(rec)),
          totalSpentField: rec.totalSpent != null ? r2(num(rec.totalSpent)) : null,
        }
      : (() => {
          const iv = invoices.find((x) => x?.clientEmail || x?.clientPhone || x?.clientAddress);
          return iv
            ? { email: iv.clientEmail ?? null, phone: iv.clientPhone ?? null, address: iv.clientAddress ?? null, taxId: iv.clientSiret ?? null, note: "not in clients table; contact taken from an invoice" }
            : { note: "not in clients table" };
        })(),
    sales: {
      count: validSales.length,
      cancelled: sales.length - validSales.length,
      totalRevenue: r2(total),
      revenueThisYear: r2(ytd),
      revenueLastYear: r2(lastYear),
      averageTicket: validSales.length ? r2(total / validSales.length) : 0,
      firstPurchase: dates.length ? toIso(new Date(minOf(dates.map((d) => d.getTime())))) : null,
      lastPurchase: last ? toIso(last) : null,
      daysSinceLastPurchase: daysSinceLast,
      segment: segmentOf(daysSinceLast, dates.length ? Math.floor((now.getTime() - minOf(dates.map((d) => d.getTime()))) / DAY) : null),
      topProducts: [...prodMap.entries()].map(([n, v]) => ({ name: n, revenue: r2(v.revenue), quantity: v.quantity })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      recent: [...validSales]
        .sort((a, b) => (recordDate(b)?.getTime() ?? 0) - (recordDate(a)?.getTime() ?? 0))
        .slice(0, 5)
        .map((s) => ({ date: isoDay(recordDate(s)), product: productNameOf(s), quantity: num(s?.quantity || 1), total: r2(saleAmount(s)), status: s?.status ?? null, paymentMethod: s?.paymentMethod ?? null })),
    },
    orders: {
      count: orders.length,
      byStatus: countBy(orders, (o) => String(o?.status ?? "unknown")),
      pending: orders.filter((o) => isPendingStatus(o?.status)).length,
      total: r2(orders.reduce((t, o) => t + num(o?.total), 0)),
    },
    invoices: {
      count: invoices.length,
      totalInvoiced: r2(invoices.filter((iv) => !isCancelled(iv?.status) && !isCreditNote(iv)).reduce((t, iv) => t + invoiceAmount(iv), 0)),
      unpaidCount: unpaid.length,
      unpaidTotal: r2(unpaid.reduce((t, iv) => t + invoiceAmount(iv), 0)),
      overdueCount: overdue.length,
      overdueTotal: r2(overdue.reduce((t, iv) => t + invoiceAmount(iv), 0)),
      unpaidList: unpaid.slice(0, 8).map((iv) => ({ ref: iv.reference ?? iv.operationNumber ?? iv.id, amount: r2(invoiceAmount(iv)), dueDate: iv.dueDate ? isoDay(new Date(iv.dueDate)) : null, status: iv.status ?? null })),
    },
    shipments: shipments.length ? { count: shipments.length, byStatus: countBy(shipments, (s) => String(s?.status ?? "unknown")) } : undefined,
  };
}

function segmentOf(daysSinceLast: number | null, daysSinceFirst: number | null): string {
  if (daysSinceLast == null) return "never_purchased";
  if (daysSinceFirst != null && daysSinceFirst <= 30) return "new";
  if (daysSinceLast <= 30) return "active";
  if (daysSinceLast <= 90) return "occasional";
  if (daysSinceLast <= 180) return "at_risk";
  return "lost";
}

/** Noms proches (au moins un mot en commun) pour proposer « Vouliez-vous dire… ». */
export function suggestNames(data: ErpData, query: string, mod: "clients" | "products" | "suppliers" | "employees" = "clients"): string[] {
  const names = new Set<string>();
  if (mod === "clients") {
    arr(data.clients).forEach((c) => c?.name && names.add(String(c.name)));
    arr(data.sales).forEach((s) => clientNameOf(s) && names.add(clientNameOf(s)));
  } else if (mod === "products") {
    arr(data.products).forEach((p) => p?.name && names.add(String(p.name)));
  } else if (mod === "suppliers") {
    arr(data.suppliers).forEach((s) => s?.name && names.add(String(s.name)));
    arr(data.purchases).forEach((p) => supplierNameOf(p) && names.add(supplierNameOf(p)));
  } else {
    arr(data.employees).forEach((e) => employeeName(e) && names.add(employeeName(e)));
  }
  return [...names]
    .map((n) => ({ n, s: nameScore(query, n) }))
    .filter((x) => x.s >= 0.34)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5)
    .map((x) => x.n);
}

/** Segmentation de la clientèle (récence des achats). */
export function clientSegments(data: ErpData, now = new Date(), inactiveDays?: number | null) {
  const stats = new Map<string, { name: string; first: number; last: number; count: number; revenue: number }>();
  arr(data.sales).forEach((s) => {
    if (isCancelled(s?.status)) return;
    const n = clientNameOf(s);
    const d = recordDate(s);
    if (!n || !d) return;
    const key = normName(n).split(" ").sort().join(" ");
    const e = stats.get(key) ?? { name: n, first: d.getTime(), last: d.getTime(), count: 0, revenue: 0 };
    e.first = Math.min(e.first, d.getTime());
    e.last = Math.max(e.last, d.getTime());
    e.count += 1;
    e.revenue += saleAmount(s);
    stats.set(key, e);
  });
  arr(data.clients).forEach((c) => {
    const key = normName(c?.name).split(" ").sort().join(" ");
    if (key && !stats.has(key)) stats.set(key, { name: String(c.name), first: NaN, last: NaN, count: 0, revenue: 0 });
  });
  const rows = [...stats.values()].map((e) => {
    const since = Number.isFinite(e.last) ? Math.floor((now.getTime() - e.last) / DAY) : null;
    const age = Number.isFinite(e.first) ? Math.floor((now.getTime() - e.first) / DAY) : null;
    return { name: e.name, purchases: e.count, revenue: r2(e.revenue), lastPurchase: Number.isFinite(e.last) ? toIso(new Date(e.last)) : null, daysSinceLastPurchase: since, segment: segmentOf(since, age) };
  });
  const seg = (s: string) => rows.filter((r) => r.segment === s).sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = rows.reduce((t, r) => t + r.revenue, 0);
  const top20 = [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, Math.max(1, Math.ceil(rows.length * 0.2)));
  const res: any = {
    definitions: "new: first purchase ≤30 days ago; active: last purchase ≤30 d; occasional: 31–90 d; at_risk: 91–180 d; lost: >180 d; never_purchased: in clients table without any sale",
    totalClients: rows.length,
    counts: countBy(rows, (r) => r.segment),
    revenueShareTop20pctClients: totalRevenue ? r2((top20.reduce((t, r) => t + r.revenue, 0) / totalRevenue) * 100) : null,
    atRisk: seg("at_risk").slice(0, 10),
    lost: seg("lost").slice(0, 10),
    newClients: seg("new").slice(0, 10),
    repeatRatePct: rows.filter((r) => r.purchases > 0).length ? r2((rows.filter((r) => r.purchases > 1).length / rows.filter((r) => r.purchases > 0).length) * 100) : null,
  };
  if (inactiveDays && inactiveDays > 0) {
    const list = rows.filter((r) => r.daysSinceLastPurchase != null && r.daysSinceLastPurchase > inactiveDays).sort((a, b) => b.revenue - a.revenue);
    res.inactiveSince = { days: inactiveDays, count: list.length, clients: list.slice(0, 25) };
  }
  return res;
}

// ═══════════════════════════════════════════════════════════
//  PRODUITS
// ═══════════════════════════════════════════════════════════
export function productProfile(data: ErpData, query: string, now = new Date()) {
  const products = arr(data.products);
  const scored = products
    .map((p) => ({ p, s: Math.max(nameScore(query, p?.name), normName(p?.sku ?? p?.reference) === normName(query) ? 1.3 : 0) }))
    .filter((x) => x.s >= 0.99)
    .sort((a, b) => b.s - a.s);
  if (!scored.length) {
    // Produit vendu mais absent du catalogue ?
    const soldNames = [...new Set(arr(data.sales).map(productNameOf))].filter((n) => nameScore(query, n) >= 0.99);
    if (!soldNames.length) return { found: false as const, query, suggestions: suggestNames(data, query, "products") };
    const n = soldNames[0];
    const sales = arr(data.sales).filter((s) => !isCancelled(s?.status) && sameName(productNameOf(s), n));
    return {
      found: true as const,
      name: n,
      note: "not in products catalog (found in sales only)",
      sales: { count: sales.length, quantity: sales.reduce((t, s) => t + num(s?.quantity || 1), 0), revenue: r2(sales.reduce((t, s) => t + saleAmount(s), 0)) },
    };
  }
  const p = scored[0].p;
  const sales = arr(data.sales).filter((s) => !isCancelled(s?.status) && (String(s?.productId) === String(p.id) || sameName(productNameOf(s), p.name)));
  const within = (days: number) => sales.filter((s) => {
    const d = recordDate(s);
    return d && now.getTime() - d.getTime() <= days * DAY;
  });
  const qty30 = within(30).reduce((t, s) => t + num(s?.quantity || 1), 0);
  const qty90 = within(90).reduce((t, s) => t + num(s?.quantity || 1), 0);
  const stock = stockQty(p);
  const revenue = sales.reduce((t, s) => t + saleAmount(s), 0);
  const quantity = sales.reduce((t, s) => t + num(s?.quantity || 1), 0);
  const cost = productUnitCost(data, p);
  const purchases = arr(data.purchases).filter((x) => !isCancelled(x?.status) && (String(x?.productId) === String(p.id) || sameName(productNameOf(x), p.name)));
  const lastPurchase = [...purchases].sort((a, b) => (recordDate(b)?.getTime() ?? 0) - (recordDate(a)?.getTime() ?? 0))[0];
  const lastSale = [...sales].sort((a, b) => (recordDate(b)?.getTime() ?? 0) - (recordDate(a)?.getTime() ?? 0))[0];
  const velocity = qty90 > 0 ? qty90 / 90 : qty30 > 0 ? qty30 / 30 : 0;
  const topBuyers = new Map<string, number>();
  sales.forEach((s) => clientNameOf(s) && topBuyers.set(clientNameOf(s), (topBuyers.get(clientNameOf(s)) ?? 0) + num(s?.quantity || 1)));
  return {
    found: true as const,
    name: p.name,
    otherMatches: scored.slice(1, 5).map((x) => x.p.name),
    id: p.id ?? null,
    sku: p.sku ?? p.reference ?? null,
    category: categoryNameOfProduct(data, p),
    price: r2(num(p.price)),
    unitCost: cost != null ? r2(cost) : null,
    unitMargin: cost != null ? r2(num(p.price) - cost) : null,
    marginPct: cost != null && num(p.price) ? r2(((num(p.price) - cost) / num(p.price)) * 100) : null,
    stock,
    stockValueAtSalePrice: r2(num(p.price) * stock),
    stockValueAtCost: cost != null ? r2(cost * stock) : null,
    stockStatus: stock <= 0 ? "out_of_stock" : stock < num(p.minStock ?? p.alertThreshold ?? 10) ? "low" : "ok",
    sales: {
      count: sales.length,
      quantity,
      revenue: r2(revenue),
      averageSellingPrice: quantity ? r2(revenue / quantity) : null,
      quantityLast30Days: qty30,
      quantityLast90Days: qty90,
      lastSale: lastSale ? isoDay(recordDate(lastSale)) : null,
      daysOfStockLeft: velocity > 0 ? Math.round(stock / velocity) : null,
      topBuyers: [...topBuyers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, quantity]) => ({ name, quantity })),
    },
    purchases: {
      count: purchases.length,
      quantity: purchases.reduce((t, x) => t + num(x?.quantity || 0), 0),
      total: r2(purchases.reduce((t, x) => t + purchaseAmount(x), 0)),
      lastPurchase: lastPurchase ? { date: isoDay(recordDate(lastPurchase)), supplier: supplierNameOf(lastPurchase) || null, unitPrice: r2(num(lastPurchase.unitPrice)), quantity: num(lastPurchase.quantity) } : null,
    },
  };
}

// ── Classements ─────────────────────────────────────────────
export function topProducts(data: ErpData, p: Period | null, limit = 10, by: "revenue" | "quantity" | "margin" = "revenue", order: "desc" | "asc" = "desc") {
  const m = new Map<string, { revenue: number; quantity: number; sales: number; cost: number; costKnown: boolean; productId: any }>();
  arr(data.sales).filter((s) => inPeriod(s, p) && !isCancelled(s?.status)).forEach((s) => {
    const n = productNameOf(s);
    const e = m.get(n) ?? { revenue: 0, quantity: 0, sales: 0, cost: 0, costKnown: true, productId: s?.productId };
    const q = num(s?.quantity || 1);
    e.revenue += saleAmount(s);
    e.quantity += q;
    e.sales += 1;
    const uc = productUnitCost(data, s);
    if (uc == null) e.costKnown = false;
    else e.cost += uc * q;
    m.set(n, e);
  });
  const rows = [...m.entries()].map(([name, v]) => ({
    name,
    category: categoryNameOfProduct(data, productOf(data, { productId: v.productId, productName: name })),
    revenue: r2(v.revenue),
    quantity: v.quantity,
    sales: v.sales,
    margin: v.costKnown ? r2(v.revenue - v.cost) : null,
    marginPct: v.costKnown && v.revenue ? r2(((v.revenue - v.cost) / v.revenue) * 100) : null,
  }));
  const key = (x: any) => (by === "margin" ? x.margin ?? -Infinity : x[by]);
  rows.sort((a, b) => (order === "asc" ? key(a) - key(b) : key(b) - key(a)));
  return rows.slice(0, Math.max(1, Math.min(50, limit)));
}

export function topClients(data: ErpData, p: Period | null, limit = 10, order: "desc" | "asc" = "desc") {
  const m = new Map<string, { revenue: number; sales: number; last: number }>();
  arr(data.sales).filter((s) => inPeriod(s, p) && !isCancelled(s?.status)).forEach((s) => {
    const n = clientNameOf(s);
    if (!n) return;
    const e = m.get(n) ?? { revenue: 0, sales: 0, last: 0 };
    e.revenue += saleAmount(s);
    e.sales += 1;
    e.last = Math.max(e.last, recordDate(s)?.getTime() ?? 0);
    m.set(n, e);
  });
  const total = [...m.values()].reduce((t, v) => t + v.revenue, 0);
  return [...m.entries()]
    .map(([name, v]) => ({ name, revenue: r2(v.revenue), sales: v.sales, averageTicket: r2(v.revenue / v.sales), sharePct: total ? r2((v.revenue / total) * 100) : null, lastPurchase: v.last ? toIso(new Date(v.last)) : null }))
    .sort((a, b) => (order === "asc" ? a.revenue - b.revenue : b.revenue - a.revenue))
    .slice(0, Math.max(1, Math.min(50, limit)));
}

/** Marges par produit (prix de vente réel − coût d'achat moyen). */
export function productMargins(data: ErpData, p: Period | null, limit = 15, order: "desc" | "asc" = "desc") {
  const rows = topProducts(data, p, 500, "revenue");
  const known = rows.filter((r) => r.margin != null);
  const revenueKnown = known.reduce((t, r) => t + r.revenue, 0);
  const marginKnown = known.reduce((t, r) => t + (r.margin ?? 0), 0);
  const sorted = [...known].sort((a, b) => (order === "asc" ? (a.margin ?? 0) - (b.margin ?? 0) : (b.margin ?? 0) - (a.margin ?? 0)));
  return {
    period: periodOut(p),
    method: "margin = sales revenue − quantity × weighted average purchase unit price of the product (from purchases)",
    productsWithKnownCost: known.length,
    productsWithoutCost: rows.length - known.length,
    revenueCoveredPct: rows.reduce((t, r) => t + r.revenue, 0) ? r2((revenueKnown / rows.reduce((t, r) => t + r.revenue, 0)) * 100) : null,
    totalMargin: r2(marginKnown),
    averageMarginPct: revenueKnown ? r2((marginKnown / revenueKnown) * 100) : null,
    products: sorted.slice(0, Math.max(1, Math.min(50, limit))),
    withoutCost: rows.filter((r) => r.margin == null).slice(0, 10).map((r) => r.name),
  };
}

// ═══════════════════════════════════════════════════════════
//  FACTURES / CRÉANCES
// ═══════════════════════════════════════════════════════════
export function receivables(data: ErpData, now = new Date()) {
  const invs = arr(data.invoices).filter((iv) => !isCancelled(iv?.status) && !isCreditNote(iv) && !isSupplierInvoice(iv));
  const unpaid = invs.filter((iv) => !isPaid(iv?.status));
  const overdue = unpaid.filter((iv) => iv?.dueDate && new Date(iv.dueDate) < now);
  const byClient = new Map<string, number>();
  unpaid.forEach((iv) => byClient.set(clientNameOf(iv) || "—", (byClient.get(clientNameOf(iv) || "—") ?? 0) + invoiceAmount(iv)));
  const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  overdue.forEach((iv) => {
    const late = Math.floor((now.getTime() - new Date(iv.dueDate).getTime()) / DAY);
    const k = late <= 30 ? "0-30" : late <= 60 ? "31-60" : late <= 90 ? "61-90" : "90+";
    aging[k] = r2(aging[k] + invoiceAmount(iv));
  });
  const dueSoon = unpaid.filter((iv) => iv?.dueDate && new Date(iv.dueDate) >= now && new Date(iv.dueDate).getTime() - now.getTime() <= 7 * DAY);
  const supplierUnpaid = arr(data.invoices).filter((iv) => isSupplierInvoice(iv) && !isCancelled(iv?.status) && !isPaid(iv?.status));
  return {
    invoicesTotal: invs.length,
    invoicedTotal: r2(invs.reduce((t, iv) => t + invoiceAmount(iv), 0)),
    paidCount: invs.length - unpaid.length,
    unpaidCount: unpaid.length,
    unpaidTotal: r2(unpaid.reduce((t, iv) => t + invoiceAmount(iv), 0)),
    overdueCount: overdue.length,
    overdueTotal: r2(overdue.reduce((t, iv) => t + invoiceAmount(iv), 0)),
    overdueAgingByDaysLate: aging,
    dueWithin7Days: { count: dueSoon.length, total: r2(dueSoon.reduce((t, iv) => t + invoiceAmount(iv), 0)) },
    topDebtors: [...byClient.entries()].map(([name, amount]) => ({ name, amount: r2(amount) })).sort((a, b) => b.amount - a.amount).slice(0, 8),
    overdueList: overdue
      .sort((a, b) => invoiceAmount(b) - invoiceAmount(a))
      .slice(0, 12)
      .map((iv) => ({
        ref: iv.reference ?? iv.operationNumber ?? iv.id,
        client: clientNameOf(iv) || null,
        email: iv.clientEmail ?? null,
        phone: iv.clientPhone ?? null,
        amount: r2(invoiceAmount(iv)),
        dueDate: isoDay(new Date(iv.dueDate)),
        daysLate: Math.floor((now.getTime() - new Date(iv.dueDate).getTime()) / DAY),
      })),
    supplierInvoicesToPay: supplierUnpaid.length ? { count: supplierUnpaid.length, total: r2(supplierUnpaid.reduce((t, iv) => t + invoiceAmount(iv), 0)) } : undefined,
  };
}

// ═══════════════════════════════════════════════════════════
//  STOCK & RÉAPPROVISIONNEMENT
// ═══════════════════════════════════════════════════════════
export function stockStatus(data: ErpData, now = new Date()) {
  const products = arr(data.products);
  const threshold = (p: any) => num(p?.minStock ?? p?.alertThreshold ?? 10) || 10;
  const out = products.filter((p) => stockQty(p) <= 0);
  const low = products.filter((p) => stockQty(p) > 0 && stockQty(p) < threshold(p));
  const lastSaleByProduct = new Map<string, number>();
  arr(data.sales).forEach((s) => {
    if (isCancelled(s?.status)) return;
    const prod = productOf(data, s);
    const key = prod?.id != null ? String(prod.id) : `n:${normName(productNameOf(s))}`;
    lastSaleByProduct.set(key, Math.max(lastSaleByProduct.get(key) ?? 0, recordDate(s)?.getTime() ?? 0));
  });
  const dead = products.filter((p) => {
    if (stockQty(p) <= 0) return false;
    const last = lastSaleByProduct.get(p?.id != null ? String(p.id) : `n:${normName(p?.name)}`) ?? 0;
    return now.getTime() - last > 90 * DAY;
  });
  const byCat = new Map<string, { products: number; units: number; value: number }>();
  products.forEach((p) => {
    const c = categoryNameOfProduct(data, p) ?? "—";
    const e = byCat.get(c) ?? { products: 0, units: 0, value: 0 };
    e.products += 1;
    e.units += stockQty(p);
    e.value += num(p?.price) * stockQty(p);
    byCat.set(c, e);
  });
  const costValue = products.reduce((t, p) => {
    const c = productUnitCost(data, p);
    return c != null ? t + c * stockQty(p) : t;
  }, 0);
  return {
    productsCount: products.length,
    totalUnits: products.reduce((t, p) => t + stockQty(p), 0),
    stockValueAtSalePrice: r2(products.reduce((t, p) => t + num(p?.price) * stockQty(p), 0)),
    stockValueAtCostKnown: r2(costValue),
    outOfStockCount: out.length,
    lowStockCount: low.length,
    deadStockCount: dead.length,
    deadStockValue: r2(dead.reduce((t, p) => t + num(p?.price) * stockQty(p), 0)),
    outOfStock: out.slice(0, 25).map((p) => ({ name: p.name, sku: p.sku ?? null })),
    lowStock: low.sort((a, b) => stockQty(a) - stockQty(b)).slice(0, 25).map((p) => ({ name: p.name, quantity: stockQty(p), threshold: threshold(p) })),
    deadStock: dead.sort((a, b) => num(b?.price) * stockQty(b) - num(a?.price) * stockQty(a)).slice(0, 10).map((p) => ({ name: p.name, quantity: stockQty(p), value: r2(num(p.price) * stockQty(p)) })),
    byCategory: [...byCat.entries()].map(([category, v]) => ({ category, products: v.products, units: v.units, value: r2(v.value) })).sort((a, b) => b.value - a.value).slice(0, 15),
    notes: "low = stock below minStock (default 10); deadStock = in stock but not sold for 90+ days",
  };
}

/** Plan de réapprovisionnement : vitesse de vente, couverture, quantités à commander. */
export function restockPlan(data: ErpData, targetDays = 30, now = new Date(), limit = 20) {
  const products = arr(data.products);
  const sold90 = new Map<string, number>();
  arr(data.sales).forEach((s) => {
    if (isCancelled(s?.status)) return;
    const d = recordDate(s);
    if (!d || now.getTime() - d.getTime() > 90 * DAY) return;
    const prod = productOf(data, s);
    if (!prod) return;
    sold90.set(String(prod.id ?? prod.name), (sold90.get(String(prod.id ?? prod.name)) ?? 0) + num(s?.quantity || 1));
  });
  const lastSupplier = new Map<string, { supplier: string; unitPrice: number; date: string | null }>();
  [...arr(data.purchases)]
    .filter((x) => !isCancelled(x?.status))
    .sort((a, b) => (recordDate(a)?.getTime() ?? 0) - (recordDate(b)?.getTime() ?? 0))
    .forEach((x) => {
      const prod = productOf(data, x);
      if (prod) lastSupplier.set(String(prod.id ?? prod.name), { supplier: supplierNameOf(x) || "—", unitPrice: r2(num(x?.unitPrice)), date: isoDay(recordDate(x)) });
    });
  const rows = products
    .map((p) => {
      const key = String(p.id ?? p.name);
      const q90 = sold90.get(key) ?? 0;
      const perDay = q90 / 90;
      const stock = stockQty(p);
      const cover = perDay > 0 ? Math.floor(stock / perDay) : null;
      const need = Math.max(0, Math.ceil(perDay * targetDays * 1.2 - stock)); // +20 % de sécurité
      const sup = lastSupplier.get(key);
      const unit = sup?.unitPrice || productUnitCost(data, p) || null;
      return {
        name: p.name,
        sku: p.sku ?? null,
        stock,
        soldLast90Days: q90,
        avgDailySales: r2(perDay),
        daysOfCover: cover,
        suggestedOrderQty: need,
        estimatedCost: unit && need ? r2(unit * need) : null,
        lastSupplier: sup?.supplier ?? null,
        urgency: stock <= 0 && q90 > 0 ? "critical" : cover != null && cover <= 7 ? "high" : cover != null && cover <= targetDays ? "medium" : stock <= 0 ? "out_no_recent_demand" : "low",
      };
    })
    .filter((r) => r.suggestedOrderQty > 0 || r.urgency === "out_no_recent_demand");
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, out_no_recent_demand: 3, low: 4 };
  rows.sort((a, b) => rank[a.urgency] - rank[b.urgency] || (a.daysOfCover ?? 1e9) - (b.daysOfCover ?? 1e9));
  return {
    method: `velocity = units sold over the last 90 days / 90; suggested quantity covers ${targetDays} days + 20% safety stock`,
    targetDays,
    productsToReorder: rows.filter((r) => r.suggestedOrderQty > 0).length,
    estimatedBudget: r2(rows.reduce((t, r) => t + (r.estimatedCost ?? 0), 0)),
    items: rows.slice(0, Math.max(1, Math.min(60, limit))),
  };
}

// ═══════════════════════════════════════════════════════════
//  ACHATS / FOURNISSEURS / DÉPENSES / RÉSULTAT
// ═══════════════════════════════════════════════════════════
export function purchasesSummary(data: ErpData, p: Period | null, supplier?: string | null) {
  let list = arr(data.purchases).filter((x) => inPeriod(x, p) && !isCancelled(x?.status));
  if (supplier) list = list.filter((x) => nameScore(supplier, supplierNameOf(x)) >= 0.99);
  const bySupplier = new Map<string, number>();
  const byProduct = new Map<string, { quantity: number; amount: number }>();
  list.forEach((x) => {
    bySupplier.set(supplierNameOf(x) || "—", (bySupplier.get(supplierNameOf(x) || "—") ?? 0) + purchaseAmount(x));
    const e = byProduct.get(productNameOf(x)) ?? { quantity: 0, amount: 0 };
    e.quantity += num(x?.quantity || 0);
    e.amount += purchaseAmount(x);
    byProduct.set(productNameOf(x), e);
  });
  return {
    period: periodOut(p),
    supplierFilter: supplier ?? undefined,
    purchasesTotal: r2(list.reduce((t, x) => t + purchaseAmount(x), 0)),
    purchasesCount: list.length,
    byStatus: countBy(list, (x) => String(x?.status ?? "—")),
    topSuppliers: [...bySupplier.entries()].map(([name, amount]) => ({ name, amount: r2(amount) })).sort((a, b) => b.amount - a.amount).slice(0, 8),
    topProductsBought: [...byProduct.entries()].map(([name, v]) => ({ name, quantity: v.quantity, amount: r2(v.amount) })).sort((a, b) => b.amount - a.amount).slice(0, 8),
  };
}

export function supplierProfile(data: ErpData, query: string, now = new Date()) {
  const names = new Map<string, { name: string; score: number; record?: any }>();
  const add = (n: string, record?: any) => {
    if (!n) return;
    const s = nameScore(query, n);
    if (s < 0.99) return;
    const k = normName(n);
    const prev = names.get(k);
    if (!prev || s > prev.score || (record && !prev.record)) names.set(k, { name: n, score: s, record: record ?? prev?.record });
  };
  arr(data.suppliers).forEach((s) => add(String(s?.name ?? ""), s));
  arr(data.purchases).forEach((x) => add(supplierNameOf(x)));
  arr(data.expenses).forEach((e) => add(String(e?.vendor ?? "")));
  const cands = [...names.values()].sort((a, b) => b.score - a.score);
  if (!cands.length) return { found: false as const, query, suggestions: suggestNames(data, query, "suppliers") };
  const best = cands[0];
  const rec = best.record ?? arr(data.suppliers).find((s) => sameName(s?.name, best.name));
  const purchases = arr(data.purchases).filter((x) => !isCancelled(x?.status) && sameName(supplierNameOf(x), best.name));
  const expenses = arr(data.expenses).filter((e) => sameName(String(e?.vendor ?? ""), best.name));
  const invs = arr(data.invoices).filter((iv) => isSupplierInvoice(iv) && (sameName(supplierNameOf(iv), best.name) || (rec?.id != null && String(iv?.supplierId) === String(rec.id))));
  const unpaid = invs.filter((iv) => !isPaid(iv?.status) && !isCancelled(iv?.status));
  const dates = purchases.map(recordDate).filter(Boolean) as Date[];
  const byProduct = new Map<string, { quantity: number; amount: number; lastUnitPrice: number }>();
  [...purchases].sort((a, b) => (recordDate(a)?.getTime() ?? 0) - (recordDate(b)?.getTime() ?? 0)).forEach((x) => {
    const e = byProduct.get(productNameOf(x)) ?? { quantity: 0, amount: 0, lastUnitPrice: 0 };
    e.quantity += num(x?.quantity || 0);
    e.amount += purchaseAmount(x);
    e.lastUnitPrice = num(x?.unitPrice) || e.lastUnitPrice;
    byProduct.set(productNameOf(x), e);
  });
  const ytd = purchases.filter((x) => recordDate(x)?.getFullYear() === now.getFullYear()).reduce((t, x) => t + purchaseAmount(x), 0);
  return {
    found: true as const,
    name: best.name,
    otherMatches: cands.slice(1, 5).map((c) => c.name),
    contact: rec ? { contact: rec.contact ?? null, email: rec.email ?? null, phone: rec.phone ?? null, address: rec.address ?? null, status: rec.status ?? null, totalPurchasesField: rec.totalPurchases != null ? r2(num(rec.totalPurchases)) : null } : { note: "not in suppliers table" },
    purchases: {
      count: purchases.length,
      total: r2(purchases.reduce((t, x) => t + purchaseAmount(x), 0)),
      thisYear: r2(ytd),
      firstPurchase: dates.length ? toIso(new Date(minOf(dates.map((d) => d.getTime())))) : null,
      lastPurchase: dates.length ? toIso(new Date(maxOf(dates.map((d) => d.getTime())))) : null,
      products: [...byProduct.entries()].map(([name, v]) => ({ name, quantity: v.quantity, amount: r2(v.amount), lastUnitPrice: r2(v.lastUnitPrice) })).sort((a, b) => b.amount - a.amount).slice(0, 10),
    },
    expenses: expenses.length ? { count: expenses.length, total: r2(expenses.reduce((t, e) => t + num(e?.amount), 0)) } : undefined,
    invoices: invs.length ? { count: invs.length, unpaidCount: unpaid.length, unpaidTotal: r2(unpaid.reduce((t, iv) => t + invoiceAmount(iv), 0)) } : undefined,
  };
}

function monthsInPeriod(p: Period, now: Date) {
  const end = Math.min(p.end.getTime(), now.getTime() + DAY);
  return Math.max(0, (end - p.start.getTime()) / (DAY * 30.4375));
}

/** Compte de résultat simplifié sur une période. */
export function profitAndLoss(data: ErpData, p: Period | null, now = new Date()) {
  const rev = revenueSummary(data, p, { now });
  const sales = arr(data.sales).filter((s) => inPeriod(s, p) && !isCancelled(s?.status));
  let cogs = 0;
  let coveredRevenue = 0;
  sales.forEach((s) => {
    const uc = productUnitCost(data, s);
    if (uc == null) return;
    cogs += uc * num(s?.quantity || 1);
    coveredRevenue += saleAmount(s);
  });
  const purchases = arr(data.purchases).filter((x) => inPeriod(x, p) && !isCancelled(x?.status));
  const purchasesTotal = purchases.reduce((t, x) => t + purchaseAmount(x), 0);
  const expenses = arr(data.expenses).filter((e) => inPeriodOf("expenses")(e, p));
  const expByCat: Record<string, number> = {};
  expenses.forEach((e) => {
    const c = String(e?.category ?? "").trim() || "—";
    expByCat[c] = r2((expByCat[c] ?? 0) + num(e?.amount));
  });
  const expensesTotal = expenses.reduce((t, e) => t + num(e?.amount), 0);
  const activeEmployees = arr(data.employees).filter((e) => canonStatus(e?.status ?? "active") !== "inactive");
  const monthlyPayroll = activeEmployees.reduce((t, e) => t + num(e?.salary), 0);
  const months = p ? monthsInPeriod(p, now) : null;
  const payroll = months != null ? monthlyPayroll * months : null;
  const net = rev.revenue - purchasesTotal - expensesTotal - (payroll ?? 0);
  const clientInv = arr(data.invoices).filter((iv) => inPeriod(iv, p) && !isCancelled(iv?.status) && !isSupplierInvoice(iv) && !isCreditNote(iv));
  const vatCollected = clientInv.reduce((t, iv) => t + num(iv?.taxAmount), 0);
  const vatDeductible = expenses.reduce((t, e) => t + num(e?.taxAmount), 0) + arr(data.invoices).filter((iv) => inPeriod(iv, p) && isSupplierInvoice(iv) && !isCancelled(iv?.status)).reduce((t, iv) => t + num(iv?.taxAmount), 0);
  return {
    period: periodOut(p),
    revenue: rev.revenue,
    salesCount: rev.salesCount,
    costOfGoodsSoldEstimate: r2(cogs),
    cogsCoveragePct: rev.revenue ? r2((coveredRevenue / rev.revenue) * 100) : null,
    grossMarginEstimate: coveredRevenue ? r2(coveredRevenue - cogs) : null,
    grossMarginPct: coveredRevenue ? r2(((coveredRevenue - cogs) / coveredRevenue) * 100) : null,
    purchasesTotal: r2(purchasesTotal),
    purchasesCount: purchases.length,
    expensesTotal: r2(expensesTotal),
    expensesByCategory: expByCat,
    payrollEstimate: payroll != null ? r2(payroll) : null,
    payrollMonths: months != null ? r2(months) : null,
    monthlyPayroll: r2(monthlyPayroll),
    netResultSimplified: r2(net),
    netMarginPct: rev.revenue ? r2((net / rev.revenue) * 100) : null,
    vat: { collectedOnClientInvoices: r2(vatCollected), deductibleKnown: r2(vatDeductible), balanceToPay: r2(vatCollected - vatDeductible) },
    notes: [
      "netResultSimplified = revenue − purchases − expenses − payroll estimate (cash view, purchases counted when bought)",
      "grossMargin uses the weighted average purchase price per product; only sales whose product cost is known are covered (see cogsCoveragePct)",
      payroll == null ? "payroll not included: no period given" : "payroll estimate = current monthly salaries of active employees × months in period",
    ],
  };
}

// ═══════════════════════════════════════════════════════════
//  COMMANDES / EMPLOYÉS
// ═══════════════════════════════════════════════════════════
export function ordersSummary(data: ErpData, p: Period | null, status?: string | null) {
  let list = arr(data.orders).filter((o) => inPeriod(o, p));
  if (status) list = list.filter((o) => canonStatus(o?.status) === canonStatus(status) || normName(o?.status).includes(normName(status)));
  const pending = list.filter((o) => isPendingStatus(o?.status));
  return {
    period: periodOut(p),
    count: list.length,
    total: r2(list.reduce((t, o) => t + num(o?.total), 0)),
    pendingCount: pending.length,
    pendingValue: r2(pending.reduce((t, o) => t + num(o?.total), 0)),
    byStatus: countBy(list, (o) => String(o?.status ?? "unknown")),
    recent: [...list]
      .sort((a, b) => (recordDate(b)?.getTime() ?? 0) - (recordDate(a)?.getTime() ?? 0))
      .slice(0, 10)
      .map((o) => ({ ref: o.reference ?? o.id, client: clientNameOf(o) || null, product: o.productName ?? null, quantity: num(o.quantity), total: r2(num(o.total)), status: o.status ?? null, date: isoDay(recordDate(o)) })),
  };
}

export function employeesSummary(data: ErpData, query?: string | null) {
  let list = arr(data.employees);
  if (query) list = list.filter((e) => nameScore(query, employeeName(e)) >= 0.99 || normName(e?.department).includes(normName(query)) || normName(e?.position).includes(normName(query)) || normName(e?.email).includes(normName(query)));
  const deptSalary = new Map<string, { count: number; total: number }>();
  list.forEach((e) => {
    const d = String(e?.department || "—");
    const x = deptSalary.get(d) ?? { count: 0, total: 0 };
    x.count += 1;
    x.total += num(e?.salary);
    deptSalary.set(d, x);
  });
  const salaries = list.map((e) => num(e?.salary)).filter((s) => s > 0);
  return {
    count: list.length,
    active: list.filter((e) => canonStatus(e?.status ?? "active") !== "inactive").length,
    byDepartment: [...deptSalary.entries()].map(([department, v]) => ({ department, count: v.count, totalSalary: r2(v.total), averageSalary: v.count ? r2(v.total / v.count) : 0 })).sort((a, b) => b.count - a.count),
    byPosition: countBy(list, (e) => String(e?.position || e?.role || "—")),
    totalMonthlySalary: r2(salaries.reduce((t, s) => t + s, 0)),
    averageSalary: salaries.length ? r2(salaries.reduce((t, s) => t + s, 0) / salaries.length) : null,
    minSalary: salaries.length ? minOf(salaries) : null,
    maxSalary: salaries.length ? maxOf(salaries) : null,
    list: list.slice(0, 30).map((e) => ({ name: employeeName(e), position: e.position ?? e.role ?? null, department: e.department ?? null, salary: e.salary != null ? r2(num(e.salary)) : null, email: e.email ?? null, phone: e.phone ?? null, hireDate: e.hireDate ?? null, status: e.status ?? null })),
  };
}

// ═══════════════════════════════════════════════════════════
//  PRÉVISIONS
// ═══════════════════════════════════════════════════════════
export function forecastRevenue(data: ErpData, horizon = 3, now = new Date()) {
  const h = Math.max(1, Math.min(12, Math.round(horizon) || 3));
  const monthKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;
  const totals = new Map<string, number>();
  arr(data.sales).forEach((s) => {
    if (isCancelled(s?.status)) return;
    const d = recordDate(s);
    if (!d) return;
    const k = monthKey(d.getFullYear(), d.getMonth());
    totals.set(k, (totals.get(k) ?? 0) + saleAmount(s));
  });
  // Historique : jusqu'à 24 mois complets (le mois en cours est traité à part)
  const history: Array<{ month: string; revenue: number }> = [];
  for (let i = 24; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    history.push({ month: monthKey(d.getFullYear(), d.getMonth()), revenue: r2(totals.get(monthKey(d.getFullYear(), d.getMonth())) ?? 0) });
  }
  const firstActive = history.findIndex((x) => x.revenue > 0);
  const hist = firstActive >= 0 ? history.slice(firstActive) : [];
  const curKey = monthKey(now.getFullYear(), now.getMonth());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsed = now.getDate();
  const curToDate = r2(totals.get(curKey) ?? 0);
  const runRate = elapsed ? r2((curToDate / elapsed) * daysInMonth) : 0;

  if (hist.length < 2) {
    return { enoughData: false, monthsOfHistory: hist.length, history: hist, currentMonth: { month: curKey, revenueToDate: curToDate, runRateProjection: runRate }, note: "less than 2 full months of sales history: no reliable forecast" };
  }
  const series = hist.slice(-12);
  const n = series.length;
  const xs = series.map((_, i) => i);
  const ys = series.map((x) => x.revenue);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const sxx = xs.reduce((t, x) => t + (x - mx) ** 2, 0);
  const slope = sxx ? xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / sxx : 0;
  const intercept = my - slope * mx;
  const residuals = ys.map((y, i) => y - (intercept + slope * i));
  const sigma = Math.sqrt(residuals.reduce((t, r) => t + r * r, 0) / Math.max(1, n - 2));
  const avg3 = ys.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, n);
  const seasonal = hist.length >= 13;
  const forecast = Array.from({ length: h }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() + k, 1);
    const trend = Math.max(0, intercept + slope * (n + k));
    let value = 0.5 * trend + 0.5 * avg3;
    if (seasonal) {
      const lastYearKey = monthKey(d.getFullYear() - 1, d.getMonth());
      const ly = totals.get(lastYearKey) ?? 0;
      const yoy = (() => {
        const recent = ys.slice(-3).reduce((a, b) => a + b, 0);
        const prior = [3, 2, 1].map((i) => totals.get(monthKey(now.getFullYear() - 1, now.getMonth() - i)) ?? 0).reduce((a, b) => a + b, 0);
        return prior ? recent / prior : 1;
      })();
      if (ly > 0) value = (value + ly * Math.min(2, Math.max(0.5, yoy))) / 2;
    }
    if (k === 0 && runRate > 0) value = (value + runRate) / 2;
    return { month: monthKey(d.getFullYear(), d.getMonth()), forecast: r2(value), low: r2(Math.max(0, value - 1.28 * sigma)), high: r2(value + 1.28 * sigma) };
  });
  const cv = my ? sigma / my : 1;
  return {
    enoughData: true,
    monthsOfHistory: hist.length,
    method: seasonal
      ? "blend of linear trend (last 12 months), 3-month average and same month last year adjusted by recent year-over-year growth; current month also blended with its run-rate"
      : "blend of linear trend (last 12 months) and 3-month average; current month also blended with its run-rate",
    trendPerMonth: r2(slope),
    trendPctPerMonth: my ? r2((slope / my) * 100) : null,
    confidence: n >= 9 && cv < 0.25 ? "high" : n >= 5 && cv < 0.5 ? "medium" : "low",
    interval: "low/high = ±1.28 σ of residuals (~80% interval)",
    history: series,
    currentMonth: { month: curKey, revenueToDate: curToDate, daysElapsed: elapsed, daysInMonth, runRateProjection: runRate },
    forecast,
    forecastTotal: r2(forecast.reduce((t, f) => t + f.forecast, 0)),
  };
}

// ═══════════════════════════════════════════════════════════
//  VUE D'ENSEMBLE
// ═══════════════════════════════════════════════════════════
export function businessOverview(data: ErpData, now = new Date()) {
  const thisM = { kind: "month" as const, start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1), year: now.getFullYear(), month: now.getMonth(), current: true };
  const thisY = { kind: "year" as const, start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1), year: now.getFullYear(), current: true };
  const month = revenueSummary(data, thisM, { compare: true, now });
  const year = revenueSummary(data, thisY, { compare: true, now });
  const st = stockStatus(data, now);
  const rc = receivables(data, now);
  const pl = profitAndLoss(data, thisM, now);
  const newClients = arr(data.clients).filter((c) => {
    const d = recordDate(c);
    return d && d >= thisM.start;
  }).length;
  return {
    today: toIso(now),
    counts: Object.fromEntries(MODULES.map((m) => [m, arr(data[m]).length]).filter(([, v]) => (v as number) > 0)),
    thisMonth: { revenue: month.revenue, sales: month.salesCount, averageTicket: month.averageTicket, previousSameDays: month.previous, topProduct: month.topProducts[0] ?? null, topClient: month.topClients[0] ?? null, purchases: pl.purchasesTotal, expenses: pl.expensesTotal, newClients },
    thisYear: { revenue: year.revenue, sales: year.salesCount, previousSameDays: year.previous },
    allTimeRevenue: revenueSummary(data, null).revenue,
    stock: { valueAtSalePrice: st.stockValueAtSalePrice, outOfStock: st.outOfStockCount, low: st.lowStockCount, dead: st.deadStockCount },
    receivables: { unpaidTotal: rc.unpaidTotal, overdueTotal: rc.overdueTotal, overdueCount: rc.overdueCount },
    pendingOrders: arr(data.orders).filter((o) => isPendingStatus(o?.status)).length,
    employees: arr(data.employees).length,
  };
}

// ═══════════════════════════════════════════════════════════
//  MOTEUR ANALYTIQUE GÉNÉRIQUE
// ═══════════════════════════════════════════════════════════
export type FilterOp = "eq" | "neq" | "contains" | "not_contains" | "starts_with" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "not_in" | "empty" | "not_empty";
export interface QueryFilter { field: string; op?: FilterOp; value?: any; value2?: any }
export interface QueryMetric { op: "count" | "sum" | "avg" | "min" | "max" | "count_distinct" | "median"; field?: string }
export interface QuerySpec {
  module: ModuleName;
  start_date?: string | null;
  end_date?: string | null;
  period?: Period | null;
  filters?: QueryFilter[];
  group_by?: string | string[] | null;
  metrics?: QueryMetric[] | null;
  sort_by?: string | null;
  sort_dir?: "asc" | "desc" | null;
  limit?: number | null;
  fields?: string[] | null;
  include_cancelled?: boolean;
}

const TIME_BUCKETS: Record<string, string> = {
  day: "day", jour: "day", dia: "day", date: "day", daily: "day", quotidien: "day",
  week: "week", semaine: "week", semana: "week", weekly: "week",
  month: "month", mois: "month", mes: "month", monthly: "month", mensuel: "month",
  quarter: "quarter", trimestre: "quarter", quarterly: "quarter",
  year: "year", annee: "year", ano: "year", yearly: "year", an: "year",
  weekday: "weekday", dayofweek: "weekday", joursemaine: "weekday", jourdelasemaine: "weekday", diasemana: "weekday",
  hour: "hour", heure: "hour", hora: "hour",
};

/** Alias de champs (FR / EN / ES) → nom canonique. */
const FIELD_ALIASES: Record<string, string> = {
  amount: "amount", montant: "amount", total: "amount", ca: "amount", revenue: "amount", chiffre: "amount", chiffredaffaires: "amount", importe: "amount", monto: "amount", valeur: "amount", value: "amount", ttc: "amount", totalttc: "amount",
  client: "clientName", clients: "clientName", customer: "clientName", cliente: "clientName", clientname: "clientName", customername: "clientName",
  produit: "productName", product: "productName", producto: "productName", article: "productName", articulo: "productName", productname: "productName",
  fournisseur: "supplierName", supplier: "supplierName", proveedor: "supplierName", suppliername: "supplierName", vendor: "supplierName", vendeur: "supplierName",
  categorie: "category", category: "category", categoria: "category", famille: "category", categoryname: "category", rayon: "category",
  statut: "status", status: "status", estado: "status", etat: "status",
  paiement: "paymentMethod", payment: "paymentMethod", paymentmethod: "paymentMethod", modedepaiement: "paymentMethod", modepaiement: "paymentMethod", methodedepaiement: "paymentMethod", pago: "paymentMethod", metododepago: "paymentMethod", reglement: "paymentMethod",
  quantite: "quantity", qty: "quantity", quantity: "quantity", cantidad: "quantity", qte: "quantity", stock: "quantity", unites: "quantity", units: "quantity",
  prix: "price", price: "price", precio: "price", prixunitaire: "unitPrice", unitprice: "unitPrice", preciounitario: "unitPrice", pu: "unitPrice",
  departement: "department", department: "department", departamento: "department", service: "department",
  poste: "position", position: "position", role: "position", cargo: "position", fonction: "position", job: "position",
  salaire: "salary", salary: "salary", salario: "salary", sueldo: "salary",
  nom: "name", name: "name", nombre: "name",
  email: "email", mail: "email", correo: "email",
  telephone: "phone", phone: "phone", tel: "phone", telefono: "phone", mobile: "phone",
  adresse: "address", address: "address", direccion: "address", ville: "address", city: "address",
  reference: "reference", ref: "reference", numero: "reference", number: "reference", invoicenumber: "reference",
  tva: "taxAmount", tax: "taxAmount", taxe: "taxAmount", taxamount: "taxAmount", iva: "taxAmount", impuesto: "taxAmount",
  taux: "taxRate", taxrate: "taxRate", tauxtva: "taxRate",
  ht: "subtotalHT", subtotal: "subtotalHT", subtotalht: "subtotalHT", amountht: "amountHT", montantht: "amountHT",
  echeance: "dueDate", duedate: "dueDate", vencimiento: "dueDate",
  transporteur: "carrier", carrier: "carrier", transportista: "carrier",
  budget: "budget", presupuesto: "budget",
  cout: "cost", cost: "cost", coste: "cost", costo: "cost",
  marge: "margin", margin: "margin", margen: "margin", benefice: "margin", profit: "margin",
  retard: "daysLate", dayslate: "daysLate", joursderetard: "daysLate",
  enretard: "overdue", overdue: "overdue", vencida: "overdue",
  paye: "paid", paid: "paid", pagada: "paid",
  type: "type", tipo: "type", kind: "type",
  sku: "sku", codebarre: "sku",
  embauche: "hireDate", hiredate: "hireDate", fechadecontratacion: "hireDate",
  restant: "remaining", remaining: "remaining", reste: "remaining",
  valeurstock: "stockValue", stockvalue: "stockValue",
  etatstock: "stockStatus", stockstatus: "stockStatus",
  description: "description", notes: "notes", libelle: "description",
  suivi: "trackingNumber", tracking: "trackingNumber", trackingnumber: "trackingNumber",
};

const AMOUNT_FIELD: Partial<Record<ModuleName, string>> = {
  sales: "amount", purchases: "amount", orders: "amount", invoices: "amount", expenses: "amount", shipments: "amount",
  employees: "salary", products: "stockValue", clients: "totalSpent", suppliers: "totalPurchases", projects: "budget",
};

/** Champs disponibles par module (documentation pour le modèle). */
export const MODULE_FIELDS: Record<ModuleName, string> = {
  sales: "date, clientName, productName, category*, quantity, unitPrice, amount*(=total), status, paymentMethod, cost*, margin*",
  purchases: "date, supplierName, productName, category*, quantity, unitPrice, amount*(=total), status, paymentMethod",
  products: "name, sku, category*, price, quantity(stock), stockValue*, stockStatus*(ok|low|out_of_stock), cost*, date(created)",
  categories: "name, description, productsCount*",
  clients: "name, email, phone, address, status, totalSpent, date(created)",
  orders: "date, clientName, productName, quantity, unitPrice, amount*(=total), status",
  invoices: "date, reference, type, kind*(client|supplier), clientName, supplierName, amount*(TTC), subtotalHT, taxAmount, taxRate, dueDate, status, paid*, overdue*, daysLate*, paymentMethod",
  employees: "name, email, phone, position, department, salary, status, hireDate(=date)",
  suppliers: "name, contact, email, phone, address, status, totalPurchases, date(created)",
  expenses: "date, category, description, supplierName(=vendor), amount, amountHT, taxAmount, taxRate, paymentMethod, invoiceNumber",
  projects: "name, department, budget, cost, remaining*, status, date(created)",
  shipments: "date, clientName, address, carrier, trackingNumber, amount, status, estimatedDelivery",
};

function fieldKey(f: string) {
  return stripAccents(String(f ?? "").toLowerCase()).replace(/[^a-z0-9]/g, "");
}

/** Nom canonique d'un champ ou d'un regroupement temporel (« mois » → month, « paiement » → paymentMethod). */
export function canonicalField(f: string): string {
  const k = fieldKey(f);
  return TIME_BUCKETS[k] ?? FIELD_ALIASES[k] ?? String(f ?? "");
}
export const isTimeBucket = (f: string) => !!TIME_BUCKETS[fieldKey(f)];

/** Valeur d'un champ (réel ou virtuel) pour un enregistrement. */
export function fieldValue(data: ErpData, mod: ModuleName, r: any, field: string, now = new Date()): any {
  const raw = String(field ?? "");
  const k = fieldKey(raw);
  const canon = FIELD_ALIASES[k] ?? raw;
  switch (canon) {
    case "amount":
      if (mod === "sales") return saleAmount(r);
      if (mod === "purchases") return purchaseAmount(r);
      if (mod === "invoices") return invoiceAmount(r);
      if (mod === "orders" || mod === "shipments" || mod === "expenses") return num(r?.total ?? r?.amount);
      if (AMOUNT_FIELD[mod] && AMOUNT_FIELD[mod] !== "amount") return fieldValue(data, mod, r, AMOUNT_FIELD[mod]!, now);
      return num(r?.amount ?? r?.total);
    case "clientName":
      return clientNameOf(r) || (mod === "clients" ? String(r?.name ?? "") : "");
    case "productName":
      return mod === "products" ? String(r?.name ?? "") : productNameOf(r);
    case "supplierName":
      if (mod === "suppliers") return String(r?.name ?? "");
      if (mod === "expenses") return String(r?.vendor ?? "");
      return supplierNameOf(r);
    case "category":
      if (mod === "products") return categoryNameOfProduct(data, r);
      if (mod === "sales" || mod === "purchases" || mod === "orders") return categoryNameOfProduct(data, productOf(data, r));
      return r?.category ?? null;
    case "name":
      if (mod === "employees") return employeeName(r);
      return r?.name ?? r?.clientName ?? r?.productName ?? null;
    case "quantity":
      return mod === "products" ? stockQty(r) : num(r?.quantity);
    case "price":
      return num(r?.price ?? r?.unitPrice);
    case "unitPrice":
      return num(r?.unitPrice ?? r?.price);
    case "stockValue":
      return mod === "products" ? r2(num(r?.price) * stockQty(r)) : null;
    case "stockStatus": {
      if (mod !== "products") return null;
      const q = stockQty(r);
      return q <= 0 ? "out_of_stock" : q < num(r?.minStock ?? r?.alertThreshold ?? 10) ? "low" : "ok";
    }
    case "cost": {
      if (mod === "projects") return num(r?.cost);
      if (mod === "products") return productUnitCost(data, r);
      if (mod === "sales") {
        const uc = productUnitCost(data, r);
        return uc == null ? null : r2(uc * num(r?.quantity || 1));
      }
      return r?.cost ?? null;
    }
    case "margin": {
      if (mod === "sales") {
        const uc = productUnitCost(data, r);
        return uc == null ? null : r2(saleAmount(r) - uc * num(r?.quantity || 1));
      }
      if (mod === "products") {
        const uc = productUnitCost(data, r);
        return uc == null ? null : r2(num(r?.price) - uc);
      }
      if (mod === "projects") return r2(num(r?.budget) - num(r?.cost));
      return null;
    }
    case "remaining":
      return mod === "projects" ? r2(num(r?.budget) - num(r?.cost)) : null;
    case "kind":
    case "type":
      if (mod === "invoices" && fieldKey(raw) === "kind") return isSupplierInvoice(r) ? "supplier" : "client";
      return r?.type ?? null;
    case "paid":
      return mod === "invoices" ? isPaid(r?.status) : null;
    case "overdue":
      return mod === "invoices" ? !isPaid(r?.status) && !isCancelled(r?.status) && !!r?.dueDate && new Date(r.dueDate) < now : null;
    case "daysLate": {
      if (mod !== "invoices" || !r?.dueDate || isPaid(r?.status)) return null;
      const late = Math.floor((now.getTime() - new Date(r.dueDate).getTime()) / DAY);
      return late > 0 ? late : 0;
    }
    case "productsCount":
      if (mod === "categories") return arr(data.products).filter((p) => String(p?.categoryId) === String(r?.id) || sameName(categoryNameOfProduct(data, p) ?? "", r?.name ?? "")).length;
      return null;
    case "salary":
      return num(r?.salary);
    case "taxAmount":
      return num(r?.taxAmount);
    case "date":
      return isoDay(moduleDate(mod, r));
    default: {
      if (fieldKey(raw) === "kind" && mod === "invoices") return isSupplierInvoice(r) ? "supplier" : "client";
      if (r && Object.prototype.hasOwnProperty.call(r, canon)) return r[canon];
      // correspondance insensible à la casse
      const ck = fieldKey(canon);
      const key = r ? Object.keys(r).find((x) => fieldKey(x) === ck) : undefined;
      const v = key ? r[key] : undefined;
      return v && typeof v === "object" && !(v instanceof Date) ? v?.name ?? null : v ?? null;
    }
  }
}

const NAME_FIELDS = new Set(["clientName", "productName", "supplierName", "name", "vendor", "category", "department", "position", "carrier"]);
const STATUS_FIELDS = new Set(["status", "stockStatus"]);

function truthy(v: any): boolean | null {
  if (typeof v === "boolean") return v;
  const s = normName(v);
  if (/^(true|oui|yes|si|1|vrai|verdadero)$/.test(s)) return true;
  if (/^(false|non|no|0|faux|falso)$/.test(s)) return false;
  return null;
}

function matchFilter(data: ErpData, mod: ModuleName, r: any, f: QueryFilter, now: Date): boolean {
  const op: FilterOp = f.op ?? "eq";
  const canon = FIELD_ALIASES[fieldKey(f.field)] ?? f.field;
  const v = fieldValue(data, mod, r, f.field, now);
  const isEmpty = v === null || v === undefined || v === "";
  if (op === "empty") return isEmpty;
  if (op === "not_empty") return !isEmpty;
  const isDateField = canon === "date" || /date|createdat|hiredate|duedate|estimateddelivery/i.test(canon);
  const toCmp = (x: any) => (isDateField ? parseDate(x)?.getTime() ?? NaN : num(x));
  const eqOne = (target: any): boolean => {
    if (typeof v === "boolean" || canon === "paid" || canon === "overdue") {
      const t = truthy(target);
      return t != null ? !!v === t : false;
    }
    if (typeof v === "number") return Math.abs(v - num(target)) < 1e-9;
    if (isDateField) return String(v ?? "").slice(0, 10) === String(target ?? "").slice(0, 10);
    const a = normName(v);
    const b = normName(target);
    if (a === b) return true;
    if (STATUS_FIELDS.has(canon) && canonStatus(v) && canonStatus(v) === canonStatus(target)) return true;
    if (NAME_FIELDS.has(canon) && b && (nameScore(String(target), String(v ?? "")) >= 0.99 || sameName(String(v ?? ""), String(target)))) return true;
    return false;
  };
  const list = (x: any) => (Array.isArray(x) ? x : String(x ?? "").split(/[,;|]/).map((s) => s.trim()).filter(Boolean));
  switch (op) {
    case "eq": return eqOne(f.value);
    case "neq": return !eqOne(f.value);
    case "in": return list(f.value).some(eqOne);
    case "not_in": return !list(f.value).some(eqOne);
    case "contains": return normName(v).includes(normName(f.value));
    case "not_contains": return !normName(v).includes(normName(f.value));
    case "starts_with": return normName(v).startsWith(normName(f.value));
    case "gt": return toCmp(v) > toCmp(f.value);
    case "gte": return toCmp(v) >= toCmp(f.value);
    case "lt": return toCmp(v) < toCmp(f.value);
    case "lte": return toCmp(v) <= toCmp(f.value);
    case "between": return toCmp(v) >= toCmp(f.value) && toCmp(v) <= toCmp(f.value2);
    default: return true;
  }
}

const WEEKDAY_KEYS = ["7-Sun", "1-Mon", "2-Tue", "3-Wed", "4-Thu", "5-Fri", "6-Sat"];
function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, "0")}`;
}
function bucketKey(mod: ModuleName, r: any, bucket: string): string {
  const d = moduleDate(mod, r);
  if (!d) return "—";
  const y = d.getFullYear();
  const m = d.getMonth();
  switch (bucket) {
    case "day": return toIso(d);
    case "week": return isoWeek(d);
    case "month": return `${y}-${String(m + 1).padStart(2, "0")}`;
    case "quarter": return `${y}-Q${Math.floor(m / 3) + 1}`;
    case "year": return String(y);
    case "weekday": return WEEKDAY_KEYS[d.getDay()];
    case "hour": return `${String(d.getHours()).padStart(2, "0")}h`;
    default: return "—";
  }
}

function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function metricName(m: QueryMetric) {
  return m.op === "count" ? "count" : `${m.op}_${m.field ?? "amount"}`;
}

function computeMetrics(data: ErpData, mod: ModuleName, rows: any[], metrics: QueryMetric[], now: Date) {
  const out: Record<string, number | null> = {};
  metrics.forEach((m) => {
    const name = metricName(m);
    if (m.op === "count") {
      out[name] = rows.length;
      return;
    }
    const field = m.field ?? AMOUNT_FIELD[mod] ?? "amount";
    if (m.op === "count_distinct") {
      out[name] = new Set(rows.map((r) => normName(fieldValue(data, mod, r, field, now))).filter(Boolean)).size;
      return;
    }
    const vals = rows.map((r) => fieldValue(data, mod, r, field, now)).filter((v) => v !== null && v !== undefined && v !== "").map(num);
    if (!vals.length) {
      out[name] = m.op === "sum" ? 0 : null;
      return;
    }
    const sum = vals.reduce((a, b) => a + b, 0);
    out[name] = r2(m.op === "sum" ? sum : m.op === "avg" ? sum / vals.length : m.op === "min" ? minOf(vals) : m.op === "max" ? maxOf(vals) : median(vals) ?? 0);
  });
  return out;
}

/** Requête analytique générique sur n'importe quel module. */
export function queryData(data: ErpData, spec: QuerySpec, now = new Date()) {
  const mod = spec.module;
  if (!MODULES.includes(mod)) return { error: `unknown module ${mod}`, modules: MODULES };
  const all = arr(data[mod]);
  const p = spec.period ?? null;
  const filters = (spec.filters ?? []).filter((f) => f && f.field);
  const statusFiltered = filters.some((f) => (FIELD_ALIASES[fieldKey(f.field)] ?? f.field) === "status");
  const excludeCancelled = !spec.include_cancelled && !statusFiltered && ["sales", "purchases", "orders", "invoices"].includes(mod);

  let rows = all.filter((r) => inPeriodOf(mod)(r, p));
  const beforeCancel = rows.length;
  if (excludeCancelled) rows = rows.filter((r) => !isCancelled(r?.status));
  const excludedCancelled = beforeCancel - rows.length;
  rows = rows.filter((r) => filters.every((f) => matchFilter(data, mod, r, f, now)));

  const hasAmount = !!AMOUNT_FIELD[mod];
  const metrics: QueryMetric[] = (spec.metrics && spec.metrics.length ? spec.metrics : hasAmount ? [{ op: "count" }, { op: "sum", field: AMOUNT_FIELD[mod] }] : [{ op: "count" }])
    .filter((m) => m && m.op)
    .slice(0, 6) as QueryMetric[];
  const totals = computeMetrics(data, mod, rows, metrics, now);

  const result: any = {
    module: mod,
    period: periodOut(p),
    filters: filters.length ? filters : undefined,
    matched: rows.length,
    ofTotalRecords: all.length,
    excludedCancelled: excludedCancelled || undefined,
    totals,
  };

  const groupBy = (Array.isArray(spec.group_by) ? spec.group_by : spec.group_by ? [spec.group_by] : []).filter(Boolean).slice(0, 2);
  const limit = Math.max(1, Math.min(400, Number(spec.limit) || (groupBy.length ? 25 : 20)));

  if (groupBy.length) {
    const groups = new Map<string, { key: Record<string, any>; rows: any[] }>();
    rows.forEach((r) => {
      const keyParts: Record<string, any> = {};
      groupBy.forEach((g) => {
        const bucket = TIME_BUCKETS[fieldKey(g)];
        if (bucket) keyParts[g] = bucketKey(mod, r, bucket);
        else {
          const v = fieldValue(data, mod, r, g, now);
          keyParts[g] = v === null || v === undefined || v === "" ? "—" : typeof v === "boolean" ? String(v) : String(v).trim();
        }
      });
      // regroupement insensible à la casse / aux accents
      const id = groupBy.map((g) => normName(keyParts[g]) || String(keyParts[g])).join("§");
      const e = groups.get(id) ?? { key: keyParts, rows: [] };
      e.rows.push(r);
      groups.set(id, e);
    });
    let list = [...groups.values()].map((g) => ({ ...g.key, ...computeMetrics(data, mod, g.rows, metrics, now) }));
    const timeOnly = groupBy.length === 1 && !!TIME_BUCKETS[fieldKey(groupBy[0])];
    const sortKey = spec.sort_by ? (Object.keys(list[0] ?? {}).find((k) => fieldKey(k) === fieldKey(spec.sort_by!)) ?? spec.sort_by) : timeOnly ? groupBy[0] : metricName(metrics.find((m) => m.op !== "count") ?? metrics[0]);
    const dir = spec.sort_dir ?? (timeOnly && !spec.sort_by ? "asc" : "desc");
    list.sort((a: any, b: any) => {
      const x = a[sortKey];
      const y = b[sortKey];
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), "fr", { numeric: true });
      return dir === "asc" ? c : -c;
    });
    // Remplit les mois vides d'une série mensuelle sur une période bornée
    if (timeOnly && TIME_BUCKETS[fieldKey(groupBy[0])] === "month" && p && !spec.sort_by) {
      const g = groupBy[0];
      const have = new Set(list.map((x: any) => x[g]));
      const zero = Object.fromEntries(metrics.map((m) => [metricName(m), m.op === "count" || m.op === "sum" || m.op === "count_distinct" ? 0 : null]));
      for (let d = new Date(p.start.getFullYear(), p.start.getMonth(), 1); d < p.end && d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!have.has(k)) list.push({ [g]: k, ...zero });
      }
      list.sort((a: any, b: any) => String(a[g]).localeCompare(String(b[g])) * (dir === "asc" ? 1 : -1));
    }
    result.groupBy = groupBy;
    result.groupsCount = list.length;
    result.groups = list.slice(0, limit);
    if (list.length > limit) result.truncated = `${list.length - limit} more groups not shown`;
    const sumMetric = metrics.find((m) => m.op === "sum");
    if (sumMetric && totals[metricName(sumMetric)]) {
      const tot = totals[metricName(sumMetric)] as number;
      result.groups.forEach((g: any) => (g.sharePct = tot ? r2(((g[metricName(sumMetric)] ?? 0) / tot) * 100) : null));
    }
  } else {
    const fields = spec.fields && spec.fields.length ? spec.fields.slice(0, 12) : defaultFields(mod);
    const sortField = spec.sort_by ?? "date";
    const dir = spec.sort_dir ?? "desc";
    const sorted = [...rows].sort((a, b) => {
      const x = fieldValue(data, mod, a, sortField, now);
      const y = fieldValue(data, mod, b, sortField, now);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), "fr", { numeric: true });
      return dir === "asc" ? c : -c;
    });
    result.rows = sorted.slice(0, Math.min(100, limit)).map((r) => {
      const o: Record<string, any> = {};
      fields.forEach((f) => {
        const v = fieldValue(data, mod, r, f, now);
        if (v !== null && v !== undefined && v !== "") o[f] = typeof v === "number" ? r2(v) : v;
      });
      return o;
    });
    if (rows.length > result.rows.length) result.truncated = `${rows.length - result.rows.length} more rows not shown (totals cover all ${rows.length})`;
  }
  return result;
}

function defaultFields(mod: ModuleName): string[] {
  switch (mod) {
    case "sales": return ["date", "clientName", "productName", "quantity", "amount", "status", "paymentMethod"];
    case "purchases": return ["date", "supplierName", "productName", "quantity", "amount", "status"];
    case "products": return ["name", "sku", "category", "price", "quantity", "stockStatus"];
    case "categories": return ["name", "description", "productsCount"];
    case "clients": return ["name", "email", "phone", "status", "totalSpent"];
    case "orders": return ["date", "clientName", "productName", "quantity", "amount", "status"];
    case "invoices": return ["date", "reference", "kind", "clientName", "supplierName", "amount", "dueDate", "status", "daysLate"];
    case "employees": return ["name", "position", "department", "salary", "status", "hireDate"];
    case "suppliers": return ["name", "contact", "email", "phone", "status", "totalPurchases"];
    case "expenses": return ["date", "category", "description", "supplierName", "amount", "paymentMethod"];
    case "projects": return ["name", "department", "budget", "cost", "remaining", "status"];
    case "shipments": return ["date", "clientName", "carrier", "trackingNumber", "amount", "status", "estimatedDelivery"];
  }
}

// ── Description des données (profil pour le modèle) ────────
const CATEGORICAL: Partial<Record<ModuleName, string[]>> = {
  sales: ["status", "paymentMethod", "category"],
  purchases: ["status", "paymentMethod"],
  products: ["category", "stockStatus"],
  clients: ["status"],
  orders: ["status"],
  invoices: ["status", "type", "paymentMethod"],
  employees: ["department", "position", "status"],
  suppliers: ["status"],
  expenses: ["category", "paymentMethod"],
  projects: ["status", "department"],
  shipments: ["status", "carrier"],
};

export function describeData(data: ErpData, modules?: ModuleName[] | null, now = new Date(), maxValues = 12) {
  const mods = (modules && modules.length ? modules : MODULES).filter((m) => MODULES.includes(m));
  const out: Record<string, any> = {};
  mods.forEach((m) => {
    const list = arr(data[m]);
    if (!list.length && !(modules && modules.length)) return;
    const dates = list.map((r) => moduleDate(m, r)).filter(Boolean) as Date[];
    const info: any = { records: list.length };
    if (dates.length) info.dateRange = [toIso(new Date(minOf(dates.map((d) => d.getTime())))), toIso(new Date(maxOf(dates.map((d) => d.getTime()))))];
    const values: Record<string, Record<string, number>> = {};
    (CATEGORICAL[m] ?? []).forEach((f) => {
      const counts: Record<string, number> = {};
      list.forEach((r) => {
        const v = fieldValue(data, m, r, f, now);
        if (v === null || v === undefined || v === "") return;
        const s = String(v).trim();
        counts[s] = (counts[s] ?? 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, maxValues);
      if (top.length) values[f] = Object.fromEntries(top);
    });
    if (Object.keys(values).length) info.values = values;
    out[m] = info;
  });
  return { today: toIso(now), modules: out };
}

// ── Recherche plein texte ───────────────────────────────────
export function searchRecords(data: ErpData, mod: ModuleName, query: string, limit = 15) {
  const list = arr(data[mod]);
  const q = normName(query);
  const project = (r: any) => {
    const o: Record<string, any> = {};
    Object.entries(r ?? {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || /password|token|hash|secret|imageurl|avatar|profileimage/i.test(k)) return;
      if (typeof v === "object" && !(v instanceof Date)) {
        if ((v as any)?.name) o[k] = (v as any).name;
        return;
      }
      o[k] = v;
    });
    return o;
  };
  if (!q) return { module: mod, total: list.length, matches: list.slice(0, limit).map(project) };
  const qt = q.split(" ").filter(Boolean);
  const matches = list.filter((r) => {
    const hay = normName(Object.values(r ?? {}).filter((v) => typeof v === "string" || typeof v === "number").join(" "));
    return qt.every((t) => hay.includes(t));
  });
  return { module: mod, total: matches.length, matches: matches.slice(0, Math.max(1, Math.min(50, limit))).map(project) };
}

// ── Calculatrice sûre (pas d'eval) ──────────────────────────
export function calculate(expression: string): { expression: string; result?: number; error?: string } {
  const src = String(expression ?? "").replace(/,/g, ".").replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/");
  if (!src || src.length > 300 || /[^0-9.+\-*/%^()]/.test(src)) return { expression, error: "only numbers and + - * / % ^ ( ) are allowed" };
  let i = 0;
  const peek = () => src[i];
  const parseNumber = (): number => {
    const m = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(src.slice(i));
    if (!m) throw new Error("number expected");
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const parsePrimary = (): number => {
    if (peek() === "(") {
      i++;
      const v = parseExpr();
      if (peek() !== ")") throw new Error("missing )");
      i++;
      return v;
    }
    if (peek() === "-") {
      i++;
      return -parsePrimary();
    }
    if (peek() === "+") {
      i++;
      return parsePrimary();
    }
    return parseNumber();
  };
  const parsePow = (): number => {
    const base = parsePrimary();
    if (peek() === "^") {
      i++;
      return Math.pow(base, parsePow());
    }
    return base;
  };
  const parseTerm = (): number => {
    let v = parsePow();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = src[i++];
      const r = parsePow();
      v = op === "*" ? v * r : op === "/" ? v / r : v % r;
    }
    return v;
  };
  const parseExpr = (): number => {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  try {
    const v = parseExpr();
    if (i !== src.length) throw new Error("unexpected character");
    if (!Number.isFinite(v)) return { expression, error: "result is not finite (division by zero?)" };
    return { expression, result: Math.round(v * 1e6) / 1e6 };
  } catch (e: any) {
    return { expression, error: String(e?.message || e) };
  }
}

// ── Compactage pour l'envoi au serveur ──────────────────────
/** Version allégée des données (champs utiles uniquement). */
export function compactData(data: ErpData): ErpData {
  const pick = (o: any, keys: string[]) => {
    const r: any = {};
    keys.forEach((k) => {
      const v = o?.[k];
      if (v === undefined || v === null || v === "") return;
      if (typeof v === "object" && !(v instanceof Date)) {
        if (v?.name) r[k] = v.name;
        return;
      }
      r[k] = v;
    });
    return r;
  };
  const F: Record<ModuleName, string[]> = {
    sales: ["id", "productId", "clientId", "clientName", "productName", "product", "quantity", "unitPrice", "total", "amount", "status", "paymentMethod", "createdAt", "date", "saleDate"],
    purchases: ["id", "productId", "productName", "supplierName", "supplier", "quantity", "unitPrice", "total", "status", "paymentMethod", "createdAt", "date"],
    products: ["id", "name", "sku", "reference", "categoryId", "category", "categoryName", "price", "cost", "purchasePrice", "quantity", "stock", "minStock", "alertThreshold", "createdAt"],
    categories: ["id", "name", "description"],
    clients: ["id", "name", "email", "phone", "address", "totalSpent", "status", "createdAt"],
    orders: ["id", "reference", "clientId", "productId", "clientName", "productName", "quantity", "unitPrice", "total", "status", "createdAt"],
    invoices: ["id", "reference", "operationNumber", "type", "clientId", "supplierId", "clientName", "supplierName", "clientEmail", "clientPhone", "clientAddress", "clientSiret", "amount", "total", "subtotalHT", "taxAmount", "taxRate", "dueDate", "paymentTerms", "paymentMethod", "status", "createdAt", "date"],
    employees: ["id", "name", "firstName", "lastName", "email", "phone", "position", "role", "department", "salary", "hireDate", "status"],
    suppliers: ["id", "name", "contact", "email", "phone", "address", "totalPurchases", "status", "createdAt"],
    expenses: ["id", "amount", "amountHT", "taxAmount", "taxRate", "category", "description", "date", "paymentMethod", "vendor", "invoiceNumber", "createdAt"],
    projects: ["id", "name", "department", "budget", "cost", "status", "createdAt"],
    shipments: ["id", "clientId", "trackingNumber", "clientName", "address", "phone", "carrier", "amount", "status", "estimatedDelivery", "createdAt"],
  };
  const out: ErpData = {};
  MODULES.forEach((m) => {
    if (Array.isArray(data[m])) out[m] = arr(data[m]).map((r) => pick(r, F[m]));
  });
  return out;
}
