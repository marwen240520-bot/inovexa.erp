// ============================================================
//  lib/assistant/localAssistant.ts — Assistant hors-ligne trilingue
//
//  Répond SANS appel au modèle IA (clé absente, réseau coupé, quota…)
//  aux questions les plus fréquentes, en FR / EN / ES, avec des
//  chiffres exacts calculés par erpQuery :
//    « chiffre d'affaires de mai »      « revenue this month »
//    « infos du client Ahmed Ouni »     « datos del cliente Ahmed Ouni »
//    « top produits T1 », « factures impayées », « état du stock »,
//    « bénéfice du mois », « prévisions », « clients inactifs »,
//    « que dois-je réapprovisionner ? », « fournisseur X »…
//
//  Renvoie null si la question n'est pas reconnue (l'appelant
//  utilise alors son repli historique).
// ============================================================

import { Lang, MONTH_LABELS, normalizeText, parsePeriods, periodLabel, Period, monthPeriod, yearPeriod } from "./period";
import {
  ErpData,
  normName,
  nameScore,
  clientProfile,
  productProfile,
  revenueSummary,
  monthlyRevenue,
  topProducts,
  topClients,
  receivables,
  stockStatus,
  purchasesSummary,
  ordersSummary,
  employeesSummary,
  businessOverview,
  profitAndLoss,
  forecastRevenue,
  clientSegments,
  restockPlan,
  supplierProfile,
} from "./erpQuery";

export type ReplyLang = Lang | "ar";

/** Langue de réponse : arabe si la question est majoritairement en écriture arabe, sinon FR / EN / ES. */
export function detectReplyLang(question: string, fallback: string = "fr"): ReplyLang {
  const s = String(question || "");
  const arabic = (s.match(/[\u0600-\u06ff]/g) || []).length;
  const latin = (s.match(/[a-zA-Z]/g) || []).length;
  if (arabic >= 3 && arabic >= latin) return "ar";
  return detectLang(s, fallback);
}

type Money = (n: number) => string;

// ── Détection de langue ─────────────────────────────────────
const LANG_HINTS: Record<Lang, RegExp[]> = {
  fr: [/\b(quel(le)?s?|combien|donne[rz]?|donnees|montre|affiche|chiffre|affaires?|mois|ventes?|benefice|achats?|factures?|impayes?|commandes?|employes?|du|des|le|les|au|cette|ce|dernier|derniere|annee|aujourd hui|hier|infos?|informations?|fiche|meilleurs?)\b/g],
  en: [/\b(what|how|much|many|show|give|tell|the|this|last|month|year|revenue|sales|turnover|profit|invoices?|unpaid|orders?|customers?|employees?|best|top|info|details?|about|for|me|my|today|yesterday)\b/g],
  es: [/\b(cual(es)?|cuanto|cuantos|dame|muestra|muestrame|dime|el|los|las|del|este|esta|mes|ano|ingresos|ventas|facturacion|beneficio|ganancia|facturas?|pendientes?|pedidos?|clientes?|empleados?|mejores?|datos|informacion|sobre|hoy|ayer|pasado)\b/g],
};

export function detectLang(question: string, fallback: string = "fr"): Lang {
  const q = normalizeText(question);
  const score = (l: Lang) => LANG_HINTS[l].reduce((t, re) => t + (q.match(re)?.length ?? 0), 0);
  const s = { fr: score("fr"), en: score("en"), es: score("es") };
  const fb: Lang = fallback === "en" || fallback === "es" ? fallback : "fr";
  const best = (Object.keys(s) as Lang[]).sort((a, b) => s[b] - s[a])[0];
  if (s[best] === 0 || s[best] === s[fb]) return fb;
  return best;
}

// ── Textes ──────────────────────────────────────────────────
const T = {
  fr: {
    revenueOf: "Chiffre d'affaires",
    sales: "ventes",
    avgTicket: "Panier moyen",
    qty: "Quantité vendue",
    invoiced: "Facturé sur la période",
    invoices: "factures",
    cancelled: "vente(s) annulée(s) exclue(s)",
    topProducts: "Top produits",
    topClients: "Top clients",
    vs: "vs",
    samePeriod: "même nombre de jours",
    noSales: "Aucune vente enregistrée sur cette période.",
    byMonth: "Détail par mois",
    thisMonth: "Ce mois",
    thisYear: "Cette année",
    allTime: "Depuis le début",
    clientCard: "Fiche client",
    email: "Email",
    phone: "Téléphone",
    address: "Adresse",
    status: "Statut",
    since: "Client depuis",
    purchases: "Achats",
    totalRevenue: "CA total réalisé",
    ytd: "CA cette année",
    firstLast: "Premier / dernier achat",
    favProducts: "Produits préférés",
    ordersL: "Commandes",
    pending: "en attente",
    invoicesL: "Factures",
    unpaid: "impayées",
    overdue: "en retard",
    recent: "Derniers achats",
    notFoundClient: (n: string) => `Je ne trouve aucun client correspondant à **« ${n} »**.`,
    didYouMean: "Vouliez-vous dire",
    otherMatches: "Autres clients au nom proche",
    notInTable: "absent de la table Clients (trouvé dans les ventes/factures)",
    actionUnpaid: (n: string) => `→ Relancez ${n} pour les factures impayées.`,
    productCard: "Fiche produit",
    price: "Prix",
    stock: "Stock",
    stockValue: "Valeur du stock",
    soldTotal: "Vendu au total",
    last30: "Vendu (30 j)",
    daysLeft: "Couverture estimée",
    days: "jours",
    outOfStock: "Rupture",
    low: "Stock faible",
    ok: "OK",
    notFoundProduct: (n: string) => `Je ne trouve aucun produit correspondant à **« ${n} »**.`,
    receivables: "Créances clients",
    overdueList: "Factures en retard",
    late: "j de retard",
    topDebtors: "Plus gros encours",
    stockTitle: "État du stock",
    products: "produits",
    units: "unités",
    restock: "→ Lancez un réapprovisionnement des produits en rupture.",
    purchasesTitle: "Achats & résultat",
    supplierTop: "Principaux fournisseurs",
    grossResult: "Résultat brut (CA − achats)",
    margin: "Marge",
    simplified: "Calcul simplifié : achats comptés à leur date d'achat, salaires estimés au prorata.",
    ordersTitle: "Commandes",
    employeesTitle: "Employés",
    active: "actifs",
    payroll: "Masse salariale mensuelle",
    overviewTitle: "Synthèse de votre activité",
    stockShort: "Stock",
    receivablesShort: "Impayés",
    monthlyTitle: "CA mensuel",
    bestMonth: "Meilleur mois",
    total: "Total",
    defaultPeriodNote: "Aucune période précisée : voici le mois en cours, l'année et le cumul.",
    plTitle: "Résultat",
    expenses: "Dépenses",
    payroll2: "Salaires (estimation)",
    netResult: "Résultat net simplifié",
    grossMargin: "Marge brute estimée",
    forecastTitle: "Prévisions de CA",
    notEnough: "Pas assez d'historique de ventes (moins de 2 mois complets) pour une prévision fiable.",
    runRate: "Projection du mois en cours (rythme actuel)",
    confidence: "Confiance",
    segmentsTitle: "Segmentation clients",
    atRisk: "À risque (91–180 j sans achat)",
    lostC: "Perdus (> 180 j)",
    newC: "Nouveaux (≤ 30 j)",
    activeC: "Actifs (≤ 30 j)",
    winBack: "→ Relancez en priorité les clients à risque qui ont le plus acheté.",
    restockTitle: "Plan de réapprovisionnement",
    toOrder: "à commander",
    budget: "Budget estimé",
    cover: "couverture",
    nothingToOrder: "Aucun produit à recommander pour l'instant.",
    supplierCard: "Fiche fournisseur",
    notFoundSupplier: (n: string) => `Je ne trouve aucun fournisseur correspondant à **« ${n} »**.`,
    unknown:
      "Je n'ai pas compris la demande. Exemples :\n- « Chiffre d'affaires de mai »\n- « CA de ce mois vs le mois dernier »\n- « Infos du client Ahmed Ouni »\n- « Top 5 produits du T1 »\n- « Factures impayées »\n- « Bénéfice de ce mois »\n- « Prévisions des 3 prochains mois »",
  },
  en: {
    revenueOf: "Revenue",
    sales: "sales",
    avgTicket: "Average ticket",
    qty: "Units sold",
    invoiced: "Invoiced in the period",
    invoices: "invoices",
    cancelled: "cancelled sale(s) excluded",
    topProducts: "Top products",
    topClients: "Top customers",
    vs: "vs",
    samePeriod: "same number of days",
    noSales: "No sales recorded in this period.",
    byMonth: "Monthly breakdown",
    thisMonth: "This month",
    thisYear: "This year",
    allTime: "All time",
    clientCard: "Customer profile",
    email: "Email",
    phone: "Phone",
    address: "Address",
    status: "Status",
    since: "Customer since",
    purchases: "Purchases",
    totalRevenue: "Total revenue",
    ytd: "Revenue this year",
    firstLast: "First / last purchase",
    favProducts: "Favourite products",
    ordersL: "Orders",
    pending: "pending",
    invoicesL: "Invoices",
    unpaid: "unpaid",
    overdue: "overdue",
    recent: "Latest purchases",
    notFoundClient: (n: string) => `I can't find any customer matching **"${n}"**.`,
    didYouMean: "Did you mean",
    otherMatches: "Other customers with a similar name",
    notInTable: "not in the Customers table (found in sales/invoices)",
    actionUnpaid: (n: string) => `→ Follow up with ${n} on the unpaid invoices.`,
    productCard: "Product profile",
    price: "Price",
    stock: "Stock",
    stockValue: "Stock value",
    soldTotal: "Sold in total",
    last30: "Sold (30 d)",
    daysLeft: "Estimated coverage",
    days: "days",
    outOfStock: "Out of stock",
    low: "Low stock",
    ok: "OK",
    notFoundProduct: (n: string) => `I can't find any product matching **"${n}"**.`,
    receivables: "Accounts receivable",
    overdueList: "Overdue invoices",
    late: "days late",
    topDebtors: "Largest balances",
    stockTitle: "Stock status",
    products: "products",
    units: "units",
    restock: "→ Restock the out-of-stock products.",
    purchasesTitle: "Purchases & result",
    supplierTop: "Main suppliers",
    grossResult: "Gross result (revenue − purchases)",
    margin: "Margin",
    simplified: "Simplified: purchases counted when bought, salaries pro-rated.",
    ordersTitle: "Orders",
    employeesTitle: "Employees",
    active: "active",
    payroll: "Monthly payroll",
    overviewTitle: "Business overview",
    stockShort: "Stock",
    receivablesShort: "Unpaid",
    monthlyTitle: "Monthly revenue",
    bestMonth: "Best month",
    total: "Total",
    defaultPeriodNote: "No period given: here is the current month, the year and the all-time total.",
    plTitle: "Result",
    expenses: "Expenses",
    payroll2: "Salaries (estimate)",
    netResult: "Simplified net result",
    grossMargin: "Estimated gross margin",
    forecastTitle: "Revenue forecast",
    notEnough: "Not enough sales history (less than 2 full months) for a reliable forecast.",
    runRate: "Current month projection (current pace)",
    confidence: "Confidence",
    segmentsTitle: "Customer segments",
    atRisk: "At risk (91–180 d without purchase)",
    lostC: "Lost (> 180 d)",
    newC: "New (≤ 30 d)",
    activeC: "Active (≤ 30 d)",
    winBack: "→ Reach out first to the at-risk customers who bought the most.",
    restockTitle: "Restock plan",
    toOrder: "to order",
    budget: "Estimated budget",
    cover: "cover",
    nothingToOrder: "No product needs reordering right now.",
    supplierCard: "Supplier profile",
    notFoundSupplier: (n: string) => `I can't find any supplier matching **"${n}"**.`,
    unknown:
      "I didn't understand the request. Examples:\n- \"Revenue for May\"\n- \"Revenue this month vs last month\"\n- \"Info on customer Ahmed Ouni\"\n- \"Top 5 products in Q1\"\n- \"Unpaid invoices\"\n- \"Profit this month\"\n- \"Forecast for the next 3 months\"",
  },
  es: {
    revenueOf: "Facturación",
    sales: "ventas",
    avgTicket: "Ticket medio",
    qty: "Unidades vendidas",
    invoiced: "Facturado en el período",
    invoices: "facturas",
    cancelled: "venta(s) anulada(s) excluida(s)",
    topProducts: "Productos top",
    topClients: "Clientes top",
    vs: "vs",
    samePeriod: "mismo número de días",
    noSales: "No hay ventas registradas en este período.",
    byMonth: "Detalle por mes",
    thisMonth: "Este mes",
    thisYear: "Este año",
    allTime: "Histórico",
    clientCard: "Ficha del cliente",
    email: "Email",
    phone: "Teléfono",
    address: "Dirección",
    status: "Estado",
    since: "Cliente desde",
    purchases: "Compras",
    totalRevenue: "Facturación total",
    ytd: "Facturación este año",
    firstLast: "Primera / última compra",
    favProducts: "Productos preferidos",
    ordersL: "Pedidos",
    pending: "pendientes",
    invoicesL: "Facturas",
    unpaid: "impagadas",
    overdue: "vencidas",
    recent: "Últimas compras",
    notFoundClient: (n: string) => `No encuentro ningún cliente que corresponda a **«${n}»**.`,
    didYouMean: "¿Quiso decir",
    otherMatches: "Otros clientes con nombre parecido",
    notInTable: "no está en la tabla Clientes (encontrado en ventas/facturas)",
    actionUnpaid: (n: string) => `→ Contacte a ${n} por las facturas impagadas.`,
    productCard: "Ficha del producto",
    price: "Precio",
    stock: "Stock",
    stockValue: "Valor del stock",
    soldTotal: "Vendido en total",
    last30: "Vendido (30 d)",
    daysLeft: "Cobertura estimada",
    days: "días",
    outOfStock: "Agotado",
    low: "Stock bajo",
    ok: "OK",
    notFoundProduct: (n: string) => `No encuentro ningún producto que corresponda a **«${n}»**.`,
    receivables: "Cuentas por cobrar",
    overdueList: "Facturas vencidas",
    late: "días de retraso",
    topDebtors: "Mayores saldos",
    stockTitle: "Estado del stock",
    products: "productos",
    units: "unidades",
    restock: "→ Reponga los productos agotados.",
    purchasesTitle: "Compras y resultado",
    supplierTop: "Principales proveedores",
    grossResult: "Resultado bruto (ventas − compras)",
    margin: "Margen",
    simplified: "Cálculo simplificado: compras contadas al comprarse, salarios prorrateados.",
    ordersTitle: "Pedidos",
    employeesTitle: "Empleados",
    active: "activos",
    payroll: "Masa salarial mensual",
    overviewTitle: "Resumen de su actividad",
    stockShort: "Stock",
    receivablesShort: "Impagados",
    monthlyTitle: "Facturación mensual",
    bestMonth: "Mejor mes",
    total: "Total",
    defaultPeriodNote: "Sin período indicado: este es el mes en curso, el año y el histórico.",
    plTitle: "Resultado",
    expenses: "Gastos",
    payroll2: "Salarios (estimación)",
    netResult: "Resultado neto simplificado",
    grossMargin: "Margen bruto estimado",
    forecastTitle: "Previsión de facturación",
    notEnough: "No hay suficiente historial de ventas (menos de 2 meses completos) para una previsión fiable.",
    runRate: "Proyección del mes en curso (ritmo actual)",
    confidence: "Confianza",
    segmentsTitle: "Segmentación de clientes",
    atRisk: "En riesgo (91–180 d sin compra)",
    lostC: "Perdidos (> 180 d)",
    newC: "Nuevos (≤ 30 d)",
    activeC: "Activos (≤ 30 d)",
    winBack: "→ Contacte primero a los clientes en riesgo que más compraron.",
    restockTitle: "Plan de reposición",
    toOrder: "a pedir",
    budget: "Presupuesto estimado",
    cover: "cobertura",
    nothingToOrder: "Ningún producto necesita reposición por ahora.",
    supplierCard: "Ficha del proveedor",
    notFoundSupplier: (n: string) => `No encuentro ningún proveedor que corresponda a **«${n}»**.`,
    unknown:
      "No he entendido la solicitud. Ejemplos:\n- «Facturación de mayo»\n- «Ventas de este mes vs el mes pasado»\n- «Datos del cliente Ahmed Ouni»\n- «Top 5 productos del T1»\n- «Facturas impagadas»\n- «Beneficio de este mes»\n- «Previsión de los próximos 3 meses»",
  },
};

// ── Intentions ──────────────────────────────────────────────
const has = (q: string, re: RegExp) => re.test(q);
const RE = {
  client: /\b(client|clients|cliente|clientes|customer|customers|acheteur|comprador)\b/,
  product: /\b(produit|produits|product|products|producto|productos|article|articles|articulo|articulos|reference|ref|sku)\b/,
  revenue: /\b(chiffre d affaires?|chiffres d affaires?|ca|c a|ventes?|vendu|vendus|recettes?|revenue|revenues|turnover|sales|sold|income|ingresos|ventas|vendido|facturacion|facturado|cifra de negocios?)\b/,
  profit: /\b(benefices?|profit|profits|marge|marges|margin|resultat|ganancias?|beneficios?|utilidad|rentabilit\w*|rentab\w*)\b/,
  purchases: /\b(achats?|depenses?|fournisseurs?|purchases?|expenses?|spending|spent|suppliers?|compras?|gastos?|proveedor\w*)\b/,
  top: /\b(top|meilleur\w*|best|mejor\w*|plus vendu\w*|mas vendid\w*|best ?sell\w*|classement|ranking|principaux|principales)\b/,
  receivables: /\b(impaye\w*|creances?|en retard|unpaid|overdue|receivables?|impagad\w*|vencid\w*|por cobrar|pendientes de pago|factures?|invoices?|facturas?)\b/,
  stock: /\b(stock|stocks|rupture\w*|inventaire|inventory|inventario|agotad\w*|existencias|reappro\w*|restock\w*)\b/,
  orders: /\b(commandes?|orders?|pedidos?)\b/,
  employees: /\b(employes?|salaries|personnel|rh|employees?|staff|empleados?|plantilla)\b/,
  overview: /\b(resume|synthese|bilan|vue d ensemble|tableau de bord|overview|summary|dashboard|resumen|situacion|como va|comment va|how is)\b/,
  monthly: /\b(par mois|mois par mois|mensuel\w*|monthly|by month|month by month|por mes|mes a mes|mensual\w*)\b/,
  forecast: /\b(prevision\w*|prevoir|prediction\w*|forecast\w*|predict\w*|projection\w*|previsiones|prevision|tendance\w*|futur\w*|prochains? mois|next months?|proximos meses)\b/,
  segments: /\b(inacti\w*|perdu\w*|a risque|dormant\w*|fideli\w*|churn|lost|at risk|segment\w*|perdid\w*|en riesgo|no compran|n achetent plus|plus achete)\b/,
  restock: /\b(reappro\w*|recommander|commander quoi|quoi commander|restock\w*|reorder\w*|reponer|reposicion|que pedir|a commander|to order)\b/,
  supplier: /\b(fournisseur|fournisseurs|supplier|suppliers|proveedor|proveedores)\b/,
};

/** Cherche, parmi les noms connus, celui dont TOUS les mots apparaissent dans la question. */
function nameInQuestion(qNorm: string, names: string[]): string | null {
  const qTokens = qNorm.split(" ");
  let best: { name: string; tokens: number } | null = null;
  for (const name of names) {
    const nt = normName(name).split(" ").filter((t) => t.length >= 2);
    if (!nt.length || nt.join("").length < 4) continue;
    const ok = nt.every((t) => qTokens.some((x) => x === t || (t.length >= 4 && x.length >= 4 && (x.startsWith(t) || t.startsWith(x)))));
    if (ok && (!best || nt.length > best.tokens)) best = { name, tokens: nt.length };
  }
  return best?.name ?? null;
}

/** Texte situé après « client / cliente / customer » (pour un nom inconnu). */
function textAfterKeyword(original: string, re: RegExp): string | null {
  const q = normalizeText(original);
  const m = new RegExp(re.source + "\\s+(.+)$").exec(q);
  if (!m) return null;
  const rest = m[m.length - 1]
    .replace(/\b(nomme|appele|named|called|llamado|se llama|qui s appelle|svp|stp|please|por favor|merci|thanks|gracias)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return rest ? rest.split(" ").slice(0, 4).join(" ") : null;
}

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];

// ── Point d'entrée ──────────────────────────────────────────
export function answerLocally(question: string, data: ErpData | null | undefined, uiLang: string, money?: Money, now = new Date()): string | null {
  if (!data || !question?.trim()) return null;
  const lang = detectLang(question, uiLang);
  const t = T[lang];
  const fmt: Money = money ?? ((n) => `${Math.round(n).toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "de-DE" : "fr-FR")} DT`);
  const q = normalizeText(question);
  const { periods, comparison } = parsePeriods(question, now);
  const L = (p: Period) => periodLabel(p, lang);
  const MONTHS_FULL = MONTH_LABELS[lang];
  const pct = (v: number | null | undefined) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toLocaleString(lang === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 1 })} %`);

  // 1) Client nommé (connu des données)
  const clientNames = uniq([
    ...(data.clients ?? []).map((c: any) => String(c?.name ?? "")),
    ...(data.sales ?? []).map((s: any) => String(s?.clientName ?? "")),
    ...(data.invoices ?? []).map((s: any) => String(s?.clientName ?? "")),
  ]);
  const namedClient = nameInQuestion(q, clientNames);
  const wantsTop = has(q, RE.top);

  if (namedClient && !(wantsTop && !has(q, RE.client))) return renderClient(namedClient);

  // 2) Produit nommé
  const productNames = uniq((data.products ?? []).map((p: any) => String(p?.name ?? "")));
  const namedProduct = has(q, RE.product) || has(q, RE.stock) || has(q, RE.revenue) ? nameInQuestion(q, productNames) : null;
  if (namedProduct && !wantsTop) return renderProduct(namedProduct);

  // 2 bis) Fournisseur nommé
  if (has(q, RE.supplier) && !wantsTop) {
    const supplierNames = uniq([...(data.suppliers ?? []).map((s: any) => String(s?.name ?? "")), ...(data.purchases ?? []).map((p: any) => String(p?.supplierName ?? ""))]);
    const named = nameInQuestion(q, supplierNames) ?? textAfterKeyword(question, RE.supplier);
    if (named && named.length >= 3) {
      const sp = supplierProfile(data, named, now);
      if (sp.found) return renderSupplier(sp);
      if (nameInQuestion(q, supplierNames) == null && !/^(principa|top|meilleur)/.test(named)) {
        return t.notFoundSupplier(named) + (sp.suggestions.length ? `\n\n${t.didYouMean} : ${sp.suggestions.map((s) => `**${s}**`).join(", ")}${lang === "es" ? "?" : " ?"}` : "");
      }
    }
  }

  // 3) Classements
  if (wantsTop && (has(q, RE.client) || /\b(acheteurs|buyers|compradores)\b/.test(q))) return renderTopClients();
  if (wantsTop && (has(q, RE.product) || has(q, RE.revenue) || /\b(vendu|sell|vendid)/.test(q))) return renderTopProducts();

  // 3 bis) Analyses avancées
  if (has(q, RE.forecast)) return renderForecast();
  if (has(q, RE.segments) && (has(q, RE.client) || /\b(inacti|perdu|churn|lost|perdid|dormant)/.test(q))) return renderSegments();
  if (has(q, RE.restock)) return renderRestock();

  // 4) Client demandé mais nom inconnu
  if (has(q, RE.client) && !wantsTop) {
    const guess = textAfterKeyword(question, RE.client);
    if (guess && guess.length >= 3 && !RE.revenue.test(guess) && !/^(actif|active|activo|total)/.test(guess)) {
      const prof = clientProfile(data, guess, now);
      if (prof.found) return renderClient(prof.name);
      const sug = prof.suggestions;
      const shown = guess.replace(/\b\w/g, (c) => c.toUpperCase());
      return t.notFoundClient(shown) + (sug.length ? `\n\n${t.didYouMean} : ${sug.map((s) => `**${s}**`).join(", ")}${lang === "es" ? "?" : " ?"}` : "");
    }
  }

  // 5) Domaines
  if (has(q, RE.monthly) && (has(q, RE.revenue) || !periods.length)) return renderMonthly();
  if (has(q, RE.profit) || (has(q, RE.purchases) && !has(q, RE.revenue))) return renderPurchases();
  if (has(q, RE.revenue)) return renderRevenue();
  if (has(q, RE.receivables)) return renderReceivables();
  if (has(q, RE.stock)) return renderStock();
  if (has(q, RE.orders)) return renderOrders();
  if (has(q, RE.employees)) return renderEmployees();
  if (has(q, RE.overview)) return renderOverview();
  if (periods.length) return renderRevenue(); // « et pour avril ? »
  return null;

  // ── Rendus ────────────────────────────────────────────────
  function renderRevenue(): string {
    if (!periods.length) {
      const ov = businessOverview(data!, now);
      const m = monthPeriod(now.getFullYear(), now.getMonth(), now);
      const y = yearPeriod(now.getFullYear(), now);
      const lines = [
        `**${t.revenueOf}**`,
        `- ${t.thisMonth} — ${MONTHS_FULL[m.month!]} ${m.year} : **${fmt(ov.thisMonth.revenue)}** — ${ov.thisMonth.sales} ${t.sales}` + (ov.thisMonth.previousSameDays ? ` (${pct(ov.thisMonth.previousSameDays.growthPct)} ${t.vs} ${fmt(ov.thisMonth.previousSameDays.revenue)}, ${t.samePeriod})` : ""),
        `- ${t.thisYear} — ${y.year} : **${fmt(ov.thisYear.revenue)}** — ${ov.thisYear.sales} ${t.sales}`,
        `- ${t.allTime} : **${fmt(ov.allTimeRevenue)}**`,
        "",
        `_${t.defaultPeriodNote}_`,
      ];
      return lines.join("\n");
    }
    const blocks = periods.slice(0, 4).map((p) => {
      const r = revenueSummary(data!, p, { compare: !comparison, now });
      const out = [`**${t.revenueOf} — ${L(p)} : ${fmt(r.revenue)}**`];
      if (!r.salesCount) {
        out.push(t.noSales);
        return { p, r, text: out.join("\n") };
      }
      out.push(`- ${r.salesCount} ${t.sales} · ${t.avgTicket} : ${fmt(r.averageTicket)} · ${t.qty} : ${r.quantitySold}`);
      if (r.invoicesCount) out.push(`- ${t.invoiced} : ${fmt(r.invoicedAmount)} (${r.invoicesCount} ${t.invoices})`);
      if (r.previous) out.push(`- ${pct(r.previous.growthPct)} ${t.vs} ${fmt(r.previous.revenue)} (${r.previous.period.start} → ${r.previous.period.end}${r.previous.note ? `, ${t.samePeriod}` : ""})`);
      if (r.cancelledCount) out.push(`- _${r.cancelledCount} ${t.cancelled}_`);
      if (r.topProducts.length) out.push(`- ${t.topProducts} : ${r.topProducts.slice(0, 3).map((x) => `${x.name} (${fmt(x.revenue)})`).join(", ")}`);
      if (r.topClients.length) out.push(`- ${t.topClients} : ${r.topClients.slice(0, 3).map((x) => `${x.name} (${fmt(x.revenue)})`).join(", ")}`);
      if (r.byMonth && r.byMonth.length > 1 && r.byMonth.length <= 12) out.push(`- ${t.byMonth} : ${r.byMonth.map((m) => `${m.month.slice(5)}: ${fmt(m.revenue)}`).join(" · ")}`);
      return { p, r, text: out.join("\n") };
    });
    let text = blocks.map((b) => b.text).join("\n\n");
    if (comparison && blocks.length >= 2) {
      const [a, b] = blocks;
      const diff = a.r.revenue - b.r.revenue;
      const g = b.r.revenue ? ((a.r.revenue - b.r.revenue) / b.r.revenue) * 100 : null;
      text += `\n\n**${L(a.p)} ${t.vs} ${L(b.p)}** : ${diff >= 0 ? "+" : "−"}${fmt(Math.abs(diff))} (${pct(g == null ? null : Math.round(g * 10) / 10)})`;
    }
    return text;
  }

  function renderMonthly(): string {
    const year = periods.find((p) => p.year)?.year ?? now.getFullYear();
    const m = monthlyRevenue(data!, year);
    const M = ({ fr: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] } as const)[lang];
    const lines = [`**${t.monthlyTitle} ${year}** — ${t.total} : **${fmt(m.total)}**`];
    m.months.forEach((x, i) => {
      if (year === now.getFullYear() && i > now.getMonth()) return;
      lines.push(`- ${M[i]} : ${fmt(x.revenue)} (${x.sales} ${t.sales})`);
    });
    if (m.bestMonth) lines.push(`\n${t.bestMonth} : **${M[Number(m.bestMonth.slice(5)) - 1]}**`);
    return lines.join("\n");
  }

  function renderClient(name: string): string {
    const c = clientProfile(data!, name, now);
    if (!c.found) return t.notFoundClient(name);
    const ct: any = c.contact || {};
    const lines = [`**${t.clientCard} — ${c.name}**`];
    if (ct.note) lines.push(`_${t.notInTable}_`);
    const contact = [ct.email && `${t.email} : ${ct.email}`, ct.phone && `${t.phone} : ${ct.phone}`, ct.address && `${t.address} : ${ct.address}`, ct.status && `${t.status} : ${ct.status}`, ct.customerSince && `${t.since} : ${ct.customerSince}`].filter(Boolean);
    contact.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
    lines.push(`**${t.purchases}** : ${c.sales.count} ${t.sales} · ${t.totalRevenue} **${fmt(c.sales.totalRevenue)}** · ${t.ytd} ${fmt(c.sales.revenueThisYear)}`);
    if (c.sales.count) {
      lines.push(`- ${t.avgTicket} : ${fmt(c.sales.averageTicket)} · ${t.firstLast} : ${c.sales.firstPurchase} / ${c.sales.lastPurchase}`);
      if (c.sales.topProducts.length) lines.push(`- ${t.favProducts} : ${c.sales.topProducts.slice(0, 3).map((p) => `${p.name} (${p.quantity})`).join(", ")}`);
      if (c.sales.recent.length) lines.push(`- ${t.recent} : ${c.sales.recent.slice(0, 3).map((s) => `${s.date} · ${s.product} · ${fmt(s.total)}`).join(" ; ")}`);
    }
    if (c.orders.count) lines.push(`- ${t.ordersL} : ${c.orders.count} (${c.orders.pending} ${t.pending})`);
    if (c.invoices.count) lines.push(`- ${t.invoicesL} : ${c.invoices.count} · ${fmt(c.invoices.totalInvoiced)} — ${c.invoices.unpaidCount} ${t.unpaid} (${fmt(c.invoices.unpaidTotal)}), ${c.invoices.overdueCount} ${t.overdue}`);
    if (c.otherMatches.length) lines.push(`\n_${t.otherMatches} : ${c.otherMatches.join(", ")}_`);
    if (c.invoices.unpaidTotal > 0) lines.push(`\n${t.actionUnpaid(c.name)}`);
    return lines.join("\n");
  }

  function renderProduct(name: string): string {
    const p: any = productProfile(data!, name, now);
    if (!p.found) return t.notFoundProduct(name);
    if (p.note) return `**${t.productCard} — ${p.name}**\n- ${t.soldTotal} : ${p.sales.quantity} ${t.units} · ${fmt(p.sales.revenue)}`;
    const st = p.stockStatus === "out_of_stock" ? `⛔ ${t.outOfStock}` : p.stockStatus === "low" ? `⚠️ ${t.low}` : `✅ ${t.ok}`;
    return [
      `**${t.productCard} — ${p.name}**${p.sku ? ` (${p.sku})` : ""}`,
      `- ${t.price} : ${fmt(p.price)} · ${t.stock} : **${p.stock}** ${t.units} ${st}`,
      `- ${t.stockValue} : ${fmt(p.stockValueAtSalePrice)}`,
      p.unitCost != null ? `- ${t.margin} : ${fmt(p.unitMargin)} / ${t.units.replace(/s$/, "")} (${p.marginPct} %)` : "",
      `- ${t.soldTotal} : ${p.sales.quantity} ${t.units} · ${fmt(p.sales.revenue)} · ${t.last30} : ${p.sales.quantityLast30Days}`,
      p.sales.daysOfStockLeft != null && p.stock > 0 ? `- ${t.daysLeft} : ~${p.sales.daysOfStockLeft} ${t.days}` : "",
    ].filter(Boolean).join("\n");
  }

  function renderTopProducts(): string {
    const p = periods[0] ?? null;
    const limit = Number(/\b(\d{1,2})\b/.exec(q.replace(/\b20\d\d\b/g, ""))?.[1]) || 5;
    const by = /\b(quantit|qty|unit|cantidad)/.test(q) ? "quantity" : "revenue";
    const list = topProducts(data!, p, limit, by);
    if (!list.length) return t.noSales;
    return [`**${t.topProducts}${p ? ` — ${L(p)}` : ""}**`, ...list.map((x, i) => `${i + 1}. ${x.name} — ${fmt(x.revenue)} · ${x.quantity} ${t.units}`)].join("\n");
  }

  function renderTopClients(): string {
    const p = periods[0] ?? null;
    const limit = Number(/\b(\d{1,2})\b/.exec(q.replace(/\b20\d\d\b/g, ""))?.[1]) || 5;
    const list = topClients(data!, p, limit);
    if (!list.length) return t.noSales;
    return [`**${t.topClients}${p ? ` — ${L(p)}` : ""}**`, ...list.map((x, i) => `${i + 1}. ${x.name} — ${fmt(x.revenue)} (${x.sales} ${t.sales})`)].join("\n");
  }

  function renderReceivables(): string {
    const r = receivables(data!, now);
    const lines = [`**${t.receivables}** : ${r.unpaidCount} ${t.invoices} ${t.unpaid} — **${fmt(r.unpaidTotal)}**`, `- ${r.overdueCount} ${t.overdue} : ${fmt(r.overdueTotal)}`];
    if (r.overdueList.length) {
      lines.push(`\n**${t.overdueList}**`);
      r.overdueList.slice(0, 6).forEach((x) => lines.push(`- ${x.ref} · ${x.client ?? "—"} · ${fmt(x.amount)} · ${x.daysLate} ${t.late}`));
    }
    if (r.topDebtors.length) lines.push(`\n${t.topDebtors} : ${r.topDebtors.slice(0, 3).map((d) => `${d.name} (${fmt(d.amount)})`).join(", ")}`);
    return lines.join("\n");
  }

  function renderStock(): string {
    const s = stockStatus(data!, now);
    const lines = [`**${t.stockTitle}** : ${s.productsCount} ${t.products} · ${s.totalUnits} ${t.units} · ${t.stockValue} **${fmt(s.stockValueAtSalePrice)}**`, `- ⛔ ${t.outOfStock} : ${s.outOfStockCount}${s.outOfStock.length ? ` — ${s.outOfStock.slice(0, 6).map((p) => p.name).join(", ")}` : ""}`, `- ⚠️ ${t.low} : ${s.lowStockCount}${s.lowStock.length ? ` — ${s.lowStock.slice(0, 6).map((p) => `${p.name} (${p.quantity})`).join(", ")}` : ""}`];
    if (s.outOfStockCount) lines.push(`\n${t.restock}`);
    return lines.join("\n");
  }

  function renderPurchases(): string {
    const p = periods[0] ?? monthPeriod(now.getFullYear(), now.getMonth(), now);
    const r = profitAndLoss(data!, p, now);
    const exp = Object.entries(r.expensesByCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const sup = purchasesSummary(data!, p).topSuppliers.slice(0, 3);
    return [
      `**${t.plTitle} — ${L(p)}**`,
      `- ${t.revenueOf} : ${fmt(r.revenue)}`,
      r.grossMarginEstimate != null ? `- ${t.grossMargin} : ${fmt(r.grossMarginEstimate)}${r.grossMarginPct != null ? ` (${pct(r.grossMarginPct).replace("+", "")})` : ""}` : "",
      `- ${t.purchases} : ${fmt(r.purchasesTotal)} (${r.purchasesCount})${sup.length ? ` — ${t.supplierTop} : ${sup.map((x) => `${x.name} (${fmt(x.amount)})`).join(", ")}` : ""}`,
      r.expensesTotal ? `- ${t.expenses} : ${fmt(r.expensesTotal)}${exp.length ? ` — ${exp.map(([c, v]) => `${c} ${fmt(v)}`).join(", ")}` : ""}` : "",
      r.payrollEstimate ? `- ${t.payroll2} : ${fmt(r.payrollEstimate)}` : "",
      `- ${t.netResult} : **${fmt(r.netResultSimplified)}**${r.netMarginPct != null ? ` · ${t.margin} ${pct(r.netMarginPct).replace("+", "")}` : ""}`,
      `\n_${t.simplified}_`,
    ].filter(Boolean).join("\n");
  }

  function renderForecast(): string {
    const h = Number(/\b(\d{1,2})\b/.exec(q.replace(/\b20\d\d\b/g, ""))?.[1]) || 3;
    const f = forecastRevenue(data!, h, now);
    if (!f.enoughData) return `**${t.forecastTitle}**\n\n${t.notEnough}\n- ${t.runRate} : ${fmt(f.currentMonth.runRateProjection)}`;
    const M = MONTHS_FULL;
    const conf = { high: { fr: "élevée", en: "high", es: "alta" }, medium: { fr: "moyenne", en: "medium", es: "media" }, low: { fr: "faible", en: "low", es: "baja" } }[f.confidence as "high" | "medium" | "low"][lang];
    return [
      `**${t.forecastTitle}** — ${t.total} : **${fmt(f.forecastTotal ?? 0)}**`,
      ...(f.forecast ?? []).map((x) => `- ${M[Number(x.month.slice(5)) - 1]} ${x.month.slice(0, 4)} : **${fmt(x.forecast)}** (${fmt(x.low)} – ${fmt(x.high)})`),
      `- ${t.runRate} : ${fmt(f.currentMonth.runRateProjection)}`,
      `\n_${t.confidence} : ${conf} · ${f.monthsOfHistory} ${({ fr: "mois d'historique", en: "months of history", es: "meses de historial" } as const)[lang]}_`,
    ].join("\n");
  }

  function renderSegments(): string {
    const s = clientSegments(data!, now);
    const c = s.counts as Record<string, number>;
    const lines = [
      `**${t.segmentsTitle}** — ${s.totalClients} ${({ fr: "clients", en: "customers", es: "clientes" } as const)[lang]}`,
      `- ${t.activeC} : ${c.active ?? 0} · ${t.newC} : ${c.new ?? 0}`,
      `- ${t.atRisk} : **${c.at_risk ?? 0}**${s.atRisk.length ? ` — ${s.atRisk.slice(0, 5).map((x: any) => `${x.name} (${fmt(x.revenue)})`).join(", ")}` : ""}`,
      `- ${t.lostC} : ${c.lost ?? 0}${s.lost.length ? ` — ${s.lost.slice(0, 5).map((x: any) => x.name).join(", ")}` : ""}`,
    ];
    if ((c.at_risk ?? 0) > 0) lines.push(`\n${t.winBack}`);
    return lines.join("\n");
  }

  function renderRestock(): string {
    const r = restockPlan(data!, 30, now, 10);
    if (!r.productsToReorder) return `**${t.restockTitle}**\n\n${t.nothingToOrder}`;
    return [
      `**${t.restockTitle}** — ${r.productsToReorder} ${t.products} · ${t.budget} **${fmt(r.estimatedBudget)}**`,
      ...r.items.filter((x) => x.suggestedOrderQty > 0).slice(0, 8).map((x) => `- ${x.name} : ${t.stock} ${x.stock} · ${x.suggestedOrderQty} ${t.toOrder}${x.daysOfCover != null ? ` · ${t.cover} ${x.daysOfCover} ${t.days}` : ""}${x.lastSupplier ? ` · ${x.lastSupplier}` : ""}`),
    ].join("\n");
  }

  function renderSupplier(sp: any): string {
    const ct = sp.contact || {};
    return [
      `**${t.supplierCard} — ${sp.name}**`,
      ...[ct.contact, ct.email && `${t.email} : ${ct.email}`, ct.phone && `${t.phone} : ${ct.phone}`].filter(Boolean).map((x: string) => `- ${x}`),
      `- ${t.purchases} : ${sp.purchases.count} · **${fmt(sp.purchases.total)}** · ${t.thisYear} ${fmt(sp.purchases.thisYear)}`,
      sp.purchases.lastPurchase ? `- ${t.firstLast} : ${sp.purchases.firstPurchase} / ${sp.purchases.lastPurchase}` : "",
      sp.purchases.products.length ? `- ${t.products} : ${sp.purchases.products.slice(0, 4).map((p: any) => `${p.name} (${p.quantity})`).join(", ")}` : "",
      sp.invoices?.unpaidCount ? `- ${t.invoicesL} ${t.unpaid} : ${sp.invoices.unpaidCount} (${fmt(sp.invoices.unpaidTotal)})` : "",
    ].filter(Boolean).join("\n");
  }

  function renderOrders(): string {
    const p = periods[0] ?? null;
    const o = ordersSummary(data!, p);
    const st = Object.entries(o.byStatus).map(([k, v]) => `${k}: ${v}`).join(" · ");
    return [`**${t.ordersTitle}${p ? ` — ${L(p)}` : ""}** : ${o.count} · ${fmt(o.total)}`, st ? `- ${st}` : "", ...o.recent.slice(0, 5).map((x) => `- ${x.date ?? ""} · ${x.client ?? "—"} · ${x.product ?? ""} · ${fmt(x.total)} · ${x.status ?? ""}`)].filter(Boolean).join("\n");
  }

  function renderEmployees(): string {
    const e = employeesSummary(data!);
    const dep = Object.entries(e.byDepartment).map(([k, v]) => `${k}: ${v}`).join(" · ");
    return [`**${t.employeesTitle}** : ${e.count} (${e.active} ${t.active})`, dep ? `- ${dep}` : "", e.totalMonthlySalary ? `- ${t.payroll} : ${fmt(e.totalMonthlySalary)}` : ""].filter(Boolean).join("\n");
  }

  function renderOverview(): string {
    const o = businessOverview(data!, now);
    return [
      `**${t.overviewTitle}**`,
      `- ${t.thisMonth} : **${fmt(o.thisMonth.revenue)}** (${o.thisMonth.sales} ${t.sales})${o.thisMonth.previousSameDays ? ` · ${pct(o.thisMonth.previousSameDays.growthPct)}` : ""}`,
      `- ${t.thisYear} : **${fmt(o.thisYear.revenue)}**${o.thisYear.previousSameDays ? ` · ${pct(o.thisYear.previousSameDays.growthPct)}` : ""}`,
      `- ${t.stockShort} : ${fmt(o.stock.valueAtSalePrice)} · ${o.stock.outOfStock} ${t.outOfStock.toLowerCase()} · ${o.stock.low} ${t.low.toLowerCase()}`,
      `- ${t.receivablesShort} : ${fmt(o.receivables.unpaidTotal)} (${o.receivables.overdueCount} ${t.overdue})`,
      `- ${t.ordersL} ${t.pending} : ${o.pendingOrders}`,
    ].join("\n");
  }
}

/** Message d'aide trilingue (exemples de questions). */
export function assistantHelp(uiLang: string): string {
  const l: Lang = uiLang === "en" || uiLang === "es" ? uiLang : "fr";
  return T[l].unknown;
}

/** Utilitaire exporté pour les tests. */
export const _internals = { nameInQuestion, textAfterKeyword, nameScore };
