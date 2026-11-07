"use client";
// ============================================================
//  components/assistant/AssistantChat.tsx — Module « Assistant IA »
//
//  Interface de chat professionnelle branchée sur /api/ai/chat (v4) :
//   • réponses en temps réel + étapes d'analyse visibles (« Chiffre
//     d'affaires ✓ », « Analyse des données · ventes ✓ »…)
//   • Markdown riche (tableaux, listes, liens vers les pages de l'app)
//   • mini-graphique automatique quand la réponse contient une série
//   • questions de suivi proposées, copier, régénérer, arrêter
//   • historique conservé sur l'appareil (par utilisateur)
//   • exemples de questions construits à partir des VRAIES données
//   • repli hors-ligne exact (lib/assistant/localAssistant) si l'IA
//     est indisponible (clé absente, réseau, quota…)
//
//  Réutilisable : page /dashboard/ai, widget flottant, etc.
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, Line } from "@/components/charts/LazyCharts";
import ChatMarkdown from "./ChatMarkdown";
import { ErpData, MODULES, compactData, describeData } from "@/lib/assistant/erpQuery";
import { answerLocally } from "@/lib/assistant/localAssistant";
import { toIso } from "@/lib/assistant/period";

// ── Types ───────────────────────────────────────────────────
export interface AssistantChart {
  type: "bar" | "line";
  title: string;
  labels: string[];
  series: Array<{ name: string; values: Array<number | null> }>;
  unit: "currency" | "count" | "percent";
  horizontal?: boolean;
}
interface Step { id: string; name: string; label: string; status: "running" | "done" | "error" }
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  steps?: Step[];
  chart?: AssistantChart | null;
  suggestions?: string[];
  mode?: "ai" | "offline";
  offlineReason?: string;
  error?: string;
  stopped?: boolean;
}

export interface AssistantChatProps {
  dataset: ErpData | null;
  language: string;
  theme: any;
  isMobile: boolean;
  formatCurrency: (n: number) => string;
  currency?: { code: string; symbol: string };
  userName?: string;
  /** Identifiant pour l'historique local (id ou email de l'utilisateur) */
  userKey?: string;
  height?: string | number;
  onNavigate: (path: string) => void;
  /** Dernier recours hors-ligne (ex. ancien générateur de la page) */
  fallbackAnswer?: (q: string) => string;
  onRefreshData?: () => void;
  refreshing?: boolean;
  fontFamily?: string;
  /** Question à poser automatiquement à l'ouverture (ex. ?q=… dans l'URL) */
  initialQuestion?: string | null;
}

type L3 = "fr" | "en" | "es";

// ── Textes de l'interface ───────────────────────────────────
const UI: Record<L3, Record<string, any>> = {
  fr: {
    title: "Assistant IA",
    subtitle: "Analyste connecté à vos données",
    connected: "Connecté à vos données",
    offline: "Mode hors-ligne",
    loadingData: "Chargement des données…",
    newChat: "Nouvelle conversation",
    copyAll: "Copier la conversation",
    copied: "Copié",
    copy: "Copier",
    regenerate: "Régénérer",
    stop: "Arrêter",
    send: "Envoyer",
    refresh: "Actualiser les données",
    placeholder: "Posez votre question : ventes, clients, stock, marges, factures, prévisions…",
    placeholderShort: "Posez votre question…",
    hint: "Entrée pour envoyer · Maj + Entrée pour aller à la ligne",
    thinking: "Analyse de vos données…",
    you: "Vous",
    ai: "Assistant",
    hello: (n: string) => (n ? `Bonjour ${n}, que voulez-vous savoir ?` : "Bonjour, que voulez-vous savoir ?"),
    intro: "Posez vos questions en langage naturel, comme à un analyste. Les chiffres sont calculés sur la totalité de vos données, jamais estimés au hasard.",
    stopped: "Réponse interrompue.",
    offlineNote: (r: string) => `Réponse calculée localement — assistant IA indisponible (${r}).`,
    reasons: { unauthorized: "session expirée — reconnectez-vous", not_configured: "clé API non configurée", invalid_key: "clé API invalide", rate_limited: "trop de requêtes, réessayez dans un instant", overloaded: "service momentanément surchargé", model_not_found: "modèle introuvable", network: "connexion impossible", empty: "réponse vide", default: "erreur du service" },
    noAnswer: "Je n'ai pas pu répondre pour le moment. Réessayez dans un instant ou reformulez la question.",
    confirmClear: "Effacer la conversation ?",
    records: "enregistrements",
    steps: (n: number) => `${n} analyse${n > 1 ? "s" : ""}`,
    followUps: "Pour aller plus loin",
    cats: { sales: "Ventes", clients: "Clients", stock: "Stock & produits", finance: "Finance", forecast: "Prévisions & RH" },
  },
  en: {
    title: "AI Assistant",
    subtitle: "Analyst connected to your data",
    connected: "Connected to your data",
    offline: "Offline mode",
    loadingData: "Loading data…",
    newChat: "New conversation",
    copyAll: "Copy conversation",
    copied: "Copied",
    copy: "Copy",
    regenerate: "Regenerate",
    stop: "Stop",
    send: "Send",
    refresh: "Refresh data",
    placeholder: "Ask anything: sales, customers, stock, margins, invoices, forecasts…",
    placeholderShort: "Ask a question…",
    hint: "Enter to send · Shift + Enter for a new line",
    thinking: "Analyzing your data…",
    you: "You",
    ai: "Assistant",
    hello: (n: string) => (n ? `Hi ${n}, what would you like to know?` : "Hi, what would you like to know?"),
    intro: "Ask in plain language, as you would ask an analyst. Figures are computed on all of your data, never guessed.",
    stopped: "Response stopped.",
    offlineNote: (r: string) => `Answer computed locally — AI assistant unavailable (${r}).`,
    reasons: { unauthorized: "session expired — please sign in again", not_configured: "API key not configured", invalid_key: "invalid API key", rate_limited: "too many requests, try again shortly", overloaded: "service temporarily overloaded", model_not_found: "model not found", network: "connection failed", empty: "empty response", default: "service error" },
    noAnswer: "I couldn't answer right now. Please try again shortly or rephrase your question.",
    confirmClear: "Clear the conversation?",
    records: "records",
    steps: (n: number) => `${n} analysis step${n > 1 ? "s" : ""}`,
    followUps: "Go further",
    cats: { sales: "Sales", clients: "Customers", stock: "Stock & products", finance: "Finance", forecast: "Forecasts & HR" },
  },
  es: {
    title: "Asistente IA",
    subtitle: "Analista conectado a tus datos",
    connected: "Conectado a tus datos",
    offline: "Modo sin conexión",
    loadingData: "Cargando datos…",
    newChat: "Nueva conversación",
    copyAll: "Copiar conversación",
    copied: "Copiado",
    copy: "Copiar",
    regenerate: "Regenerar",
    stop: "Detener",
    send: "Enviar",
    refresh: "Actualizar datos",
    placeholder: "Pregunta lo que quieras: ventas, clientes, stock, márgenes, facturas, previsiones…",
    placeholderShort: "Haz tu pregunta…",
    hint: "Intro para enviar · Mayús + Intro para nueva línea",
    thinking: "Analizando tus datos…",
    you: "Tú",
    ai: "Asistente",
    hello: (n: string) => (n ? `Hola ${n}, ¿qué quieres saber?` : "Hola, ¿qué quieres saber?"),
    intro: "Pregunta en lenguaje natural, como a un analista. Las cifras se calculan sobre todos tus datos, nunca se inventan.",
    stopped: "Respuesta interrumpida.",
    offlineNote: (r: string) => `Respuesta calculada localmente — asistente IA no disponible (${r}).`,
    reasons: { unauthorized: "sesión caducada — vuelva a iniciar sesión", not_configured: "clave API no configurada", invalid_key: "clave API no válida", rate_limited: "demasiadas solicitudes, inténtelo en un momento", overloaded: "servicio sobrecargado", model_not_found: "modelo no encontrado", network: "sin conexión", empty: "respuesta vacía", default: "error del servicio" },
    noAnswer: "No he podido responder ahora. Inténtelo de nuevo o reformule la pregunta.",
    confirmClear: "¿Borrar la conversación?",
    records: "registros",
    steps: (n: number) => `${n} análisis`,
    followUps: "Para ir más lejos",
    cats: { sales: "Ventas", clients: "Clientes", stock: "Stock y productos", finance: "Finanzas", forecast: "Previsiones y RR. HH." },
  },
};

const MODULE_SHORT: Record<L3, Record<string, string>> = {
  fr: { sales: "ventes", clients: "clients", products: "produits", invoices: "factures", orders: "commandes", purchases: "achats", employees: "employés", suppliers: "fournisseurs", expenses: "dépenses" },
  en: { sales: "sales", clients: "customers", products: "products", invoices: "invoices", orders: "orders", purchases: "purchases", employees: "employees", suppliers: "suppliers", expenses: "expenses" },
  es: { sales: "ventas", clients: "clientes", products: "productos", invoices: "facturas", orders: "pedidos", purchases: "compras", employees: "empleados", suppliers: "proveedores", expenses: "gastos" },
};

/** Exemples de questions, personnalisés avec un vrai client / produit de l'utilisateur. */
function buildExamples(lang: L3, data: ErpData | null) {
  const firstClient = String((data?.sales ?? []).find((s: any) => s?.clientName)?.clientName ?? (data?.clients ?? [])[0]?.name ?? "").trim();
  const firstProduct = String((data?.products ?? [])[0]?.name ?? "").trim();
  const c = firstClient && firstClient.length <= 40 ? firstClient : "";
  const p = firstProduct && firstProduct.length <= 40 ? firstProduct : "";
  const E: Record<L3, Record<string, string[]>> = {
    fr: {
      sales: ["Quel est mon CA ce mois-ci par rapport au mois dernier ?", "CA par moyen de paiement cette année", "Pourquoi mes ventes ont-elles évolué ce trimestre ?"],
      clients: [c ? `Infos sur le client ${c}` : "Infos sur mon meilleur client", "Quels clients n'ont rien acheté depuis 90 jours ?", "Top 5 clients de l'année"],
      stock: ["Que dois-je réapprovisionner ?", p ? `Quel est le stock de « ${p} » ?` : "Produits en rupture de stock", "Quels produits ont la meilleure marge ?"],
      finance: ["Résultat net de ce mois", "Factures en retard de plus de 30 jours", "TVA collectée ce trimestre"],
      forecast: ["Prévisions de CA des 3 prochains mois", "Masse salariale par département", "Dépenses par catégorie cette année"],
    },
    en: {
      sales: ["What is my revenue this month vs last month?", "Revenue by payment method this year", "Why did my sales change this quarter?"],
      clients: [c ? `Info on customer ${c}` : "Info on my best customer", "Which customers haven't bought in 90 days?", "Top 5 customers this year"],
      stock: ["What should I restock?", p ? `What is the stock of "${p}"?` : "Out-of-stock products", "Which products have the best margin?"],
      finance: ["Net result this month", "Invoices more than 30 days overdue", "VAT collected this quarter"],
      forecast: ["Revenue forecast for the next 3 months", "Payroll by department", "Expenses by category this year"],
    },
    es: {
      sales: ["¿Cuál es mi facturación este mes frente al mes pasado?", "Ventas por método de pago este año", "¿Por qué cambiaron mis ventas este trimestre?"],
      clients: [c ? `Datos del cliente ${c}` : "Datos de mi mejor cliente", "¿Qué clientes no compran desde hace 90 días?", "Top 5 clientes del año"],
      stock: ["¿Qué debo reponer?", p ? `¿Cuánto stock queda de «${p}»?` : "Productos agotados", "¿Qué productos tienen mejor margen?"],
      finance: ["Resultado neto de este mes", "Facturas vencidas hace más de 30 días", "IVA repercutido este trimestre"],
      forecast: ["Previsión de ventas de los próximos 3 meses", "Masa salarial por departamento", "Gastos por categoría este año"],
    },
  };
  return E[lang];
}

// ── Icônes ──────────────────────────────────────────────────
const Svg = ({ size = 16, children, style }: { size?: number; children: React.ReactNode; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    {children}
  </svg>
);
const ISparkle = (p: { size?: number }) => (<Svg {...p}><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></Svg>);
const ISend = (p: { size?: number }) => (<Svg {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></Svg>);
const IStop = (p: { size?: number }) => (<Svg {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></Svg>);
const ICopy = (p: { size?: number }) => (<Svg {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Svg>);
const ICheck = (p: { size?: number }) => (<Svg {...p}><path d="M20 6L9 17l-5-5" /></Svg>);
const IRefresh = (p: { size?: number }) => (<Svg {...p}><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></Svg>);
const IPlus = (p: { size?: number }) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
const IAlert = (p: { size?: number }) => (<Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></Svg>);
const IDb = (p: { size?: number }) => (<Svg {...p}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3" /><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" /></Svg>);
const CAT_ICONS: Record<string, React.ReactNode> = {
  sales: (<Svg size={14}><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></Svg>),
  clients: (<Svg size={14}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></Svg>),
  stock: (<Svg size={14}><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z" /><path d="M3.3 7L12 12l8.7-5M12 22V12" /></Svg>),
  finance: (<Svg size={14}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Svg>),
  forecast: (<Svg size={14}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></Svg>),
};

const STYLE = `
@keyframes ixa-blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes ixa-spin { to { transform: rotate(360deg) } }
@keyframes ixa-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes ixa-dot { 0%,80%,100% { opacity: .25; transform: scale(.8) } 40% { opacity: 1; transform: scale(1) } }
.ixa-scroll::-webkit-scrollbar { width: 6px } .ixa-scroll::-webkit-scrollbar-thumb { border-radius: 6px }
.ixa-root button, .ixa-root textarea { font-family: inherit }
.ixa-btn:focus-visible, .ixa-chip:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }
.ixa-input:focus, .ixa-input:focus-visible { outline: none }
.ixa-chip { transition: background-color .15s ease, border-color .15s ease }
.ixa-chip:hover:not(:disabled) { filter: brightness(0.97) }
@media (prefers-reduced-motion: reduce) { .ixa-anim { animation: none !important } }
`;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const plain = (md: string) => md.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^#+\s*/gm, "").trim();

// ── Mini-graphique ──────────────────────────────────────────
const MONTHS_SHORT: Record<L3, string[]> = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  es: ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sept.", "oct.", "nov.", "dic."],
};
const WEEKDAY_SHORT: Record<L3, Record<string, string>> = {
  fr: { Mon: "lun.", Tue: "mar.", Wed: "mer.", Thu: "jeu.", Fri: "ven.", Sat: "sam.", Sun: "dim." },
  en: { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" },
  es: { Mon: "lun.", Tue: "mar.", Wed: "mié.", Thu: "jue.", Fri: "vie.", Sat: "sáb.", Sun: "dom." },
};
const SEGMENTS: Record<L3, Record<string, string>> = {
  fr: { new: "Nouveaux", active: "Actifs", occasional: "Occasionnels", at_risk: "À risque", lost: "Perdus", never_purchased: "Sans achat" },
  en: { new: "New", active: "Active", occasional: "Occasional", at_risk: "At risk", lost: "Lost", never_purchased: "No purchase" },
  es: { new: "Nuevos", active: "Activos", occasional: "Ocasionales", at_risk: "En riesgo", lost: "Perdidos", never_purchased: "Sin compra" },
};
function prettyLabel(l: string, lang: L3): string {
  let m = /^(\d{4})-(\d{2})$/.exec(l);
  if (m) return `${MONTHS_SHORT[lang][Number(m[2]) - 1]} ${m[1].slice(2)}`;
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(l);
  if (m) return `${m[3]}/${m[2]}`;
  m = /^(\d{4})-Q(\d)$/.exec(l);
  if (m) return `${lang === "en" ? "Q" : "T"}${m[2]} ${m[1]}`;
  m = /^(\d{4})-W(\d{2})$/.exec(l);
  if (m) return `${lang === "en" ? "W" : "S"}${Number(m[2])}`;
  m = /^\d-([A-Z][a-z]{2})$/.exec(l);
  if (m) return WEEKDAY_SHORT[lang][m[1]] ?? l;
  return SEGMENTS[lang][l] ?? l;
}
function prettySeries(name: string, lang: L3): string {
  const D: Record<L3, Record<string, string>> = {
    fr: { count: "Nombre", sum: "Total", avg: "Moyenne", min: "Minimum", max: "Maximum", median: "Médiane", count_distinct: "Distincts" },
    en: { count: "Count", sum: "Total", avg: "Average", min: "Minimum", max: "Maximum", median: "Median", count_distinct: "Distinct" },
    es: { count: "Número", sum: "Total", avg: "Media", min: "Mínimo", max: "Máximo", median: "Mediana", count_distinct: "Distintos" },
  };
  if (name === "count") return D[lang].count;
  const m = /^(sum|avg|min|max|median|count_distinct)_/.exec(name);
  return m ? D[lang][m[1]] : name;
}

function MiniChart({ chart, theme, formatCurrency, lang, isMobile }: { chart: AssistantChart; theme: any; formatCurrency: (n: number) => string; lang: L3; isMobile: boolean }) {
  const palette = [theme.primary || "#4f46e5", "#f59e0b", theme.accent || "#10b981", "#ef4444", "#8b5cf6"];
  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "fr-FR";
  const compact = (v: number) => {
    try {
      return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
    } catch {
      return String(Math.round(v));
    }
  };
  const fmt = (v: number) => (chart.unit === "currency" ? formatCurrency(Math.round(v * 100) / 100) : chart.unit === "percent" ? `${v} %` : v.toLocaleString(locale));
  const labels = chart.labels.map((l) => prettyLabel(String(l), lang));
  const single = chart.series.length === 1;
  const data = {
    labels,
    datasets: chart.series.map((s, i) => ({
      label: prettySeries(s.name, lang),
      data: s.values,
      backgroundColor:
        chart.type === "bar"
          ? single
            ? s.values.map((v) => ((v ?? 0) < 0 ? "rgba(239,68,68,0.75)" : `${palette[0]}cc`))
            : `${palette[i % palette.length]}cc`
          : `${palette[i % palette.length]}22`,
      borderColor: palette[i % palette.length],
      borderWidth: chart.type === "line" ? 2 : 0,
      borderRadius: 6,
      borderDash: chart.type === "line" && i === 1 ? [6, 4] : undefined,
      fill: chart.type === "line" && i === 0,
      tension: 0.3,
      pointRadius: labels.length > 24 ? 0 : 3,
      maxBarThickness: 34,
    })),
  };
  const valueAxis = {
    ticks: { color: theme.textSecondary, font: { size: 10 }, callback: (v: any) => compact(Number(v)) },
    grid: { color: `${theme.border}` },
    beginAtZero: true,
  };
  const catAxis = {
    ticks: {
      color: theme.textSecondary,
      font: { size: 10 },
      autoSkip: true,
      maxRotation: 0,
      callback: function (this: any, value: any) {
        const lbl = String(this?.getLabelForValue ? this.getLabelForValue(value) : value);
        const max = chart.horizontal ? (isMobile ? 14 : 22) : 10;
        return lbl.length > max ? lbl.slice(0, max - 1) + "…" : lbl;
      },
    },
    grid: { display: false },
  };
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 350 },
    indexAxis: chart.horizontal ? "y" : "x",
    plugins: {
      legend: { display: !single, labels: { color: theme.textSecondary, boxWidth: 10, font: { size: 11 } } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmt(Number(chart.horizontal ? ctx.parsed.x : ctx.parsed.y))}` } },
    },
    scales: chart.horizontal ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis },
  };
  const height = chart.horizontal ? Math.min(360, Math.max(150, labels.length * 28 + 36)) : isMobile ? 190 : 220;
  return (
    <figure style={{ margin: "12px 0 0", padding: "10px 12px 12px", border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.surface }}>
      <figcaption style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: "none" }}>{chart.title}</figcaption>
      <div style={{ height, position: "relative" }} role="img" aria-label={chart.title}>
        {chart.type === "line" ? <Line data={data as any} options={options} /> : <Bar data={data as any} options={options} />}
      </div>
    </figure>
  );
}

// ── Envoi : compression gzip native (CompressionStream) pour les gros volumes ──
const MAX_BODY = 3_500_000; // limite d'une requête serverless (Vercel : 4,5 Mo)

async function gzipText(text: string): Promise<Blob | null> {
  try {
    if (typeof CompressionStream === "undefined" || typeof Blob === "undefined") return null;
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    return await new Response(stream).blob();
  } catch {
    return null;
  }
}

/**
 * Corps de la requête : JSON simple pour les petits volumes, gzip au-delà de 150 Ko
 * (≈ 10× plus léger). Trop volumineux même compressé → seul le profil est envoyé et
 * le serveur lit les données directement sur l'API avec le jeton de l'utilisateur.
 */
async function buildBody(base: Record<string, any>, dataset: ErpData | null, profile: any): Promise<{ body: BodyInit; encoding: "json" | "gzip" }> {
  const full = JSON.stringify({ ...base, dataset });
  if (full.length <= 150_000) return { body: full, encoding: "json" };
  const gz = await gzipText(full);
  if (gz && gz.size <= MAX_BODY) return { body: gz, encoding: "gzip" };
  if (!gz && full.length <= MAX_BODY) return { body: full, encoding: "json" };
  return { body: JSON.stringify({ ...base, dataset: null, profile }), encoding: "json" };
}

// ═══════════════════════════════════════════════════════════
//  COMPOSANT
// ═══════════════════════════════════════════════════════════
export default function AssistantChat(props: AssistantChatProps) {
  const { dataset, language, theme, isMobile, formatCurrency, onNavigate } = props;
  const fontFamily = `${props.fontFamily ? props.fontFamily + ", " : ""}system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  const lang: L3 = language === "en" || language === "es" ? language : "fr";
  const T = UI[lang];
  const storageKey = `inovexa.ai.chat.v4:${props.userKey || "default"}`;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<"ai" | "offline" | null>(null);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const liveRef = useRef<Msg | null>(null);
  const rafRef = useRef<number | null>(null);
  const askedInitialRef = useRef(false);
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  // ── Historique local ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) setMessages(saved.filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"));
      }
    } catch {
      /* stockage indisponible */
    }
    setReady(true);
  }, [storageKey]);
  useEffect(() => {
    if (!ready || busy) return;
    try {
      if (messages.length) localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
      else localStorage.removeItem(storageKey);
    } catch {
      /* quota ou mode privé */
    }
  }, [messages, busy, ready, storageKey]);

  // ── Données envoyées au serveur (compactées une seule fois par jeu de données) ──
  const payloadData = useMemo(() => {
    if (!dataset) return { dataset: null as ErpData | null, profile: null as any };
    let compact: ErpData | null = null;
    let profile: any = null;
    try {
      compact = compactData(dataset);
    } catch {
      compact = null;
    }
    try {
      profile = describeData(dataset);
    } catch {
      profile = null;
    }
    return { dataset: compact, profile };
  }, [dataset]);

  const counts = useMemo(() => {
    if (!dataset) return null;
    const keys = ["sales", "clients", "products", "invoices"] as const;
    return keys.filter((k) => Array.isArray(dataset[k]) && dataset[k]!.length).map((k) => `${dataset[k]!.length.toLocaleString(lang === "en" ? "en-US" : "fr-FR")} ${MODULE_SHORT[lang][k]}`);
  }, [dataset, lang]);
  const totalRecords = useMemo(() => (dataset ? MODULES.reduce((t, m) => t + (Array.isArray(dataset[m]) ? dataset[m]!.length : 0), 0) : 0), [dataset]);

  const examples = useMemo(() => buildExamples(lang, dataset), [lang, dataset]);

  // ── Défilement automatique (sauf si l'utilisateur remonte) ──
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!messages.length) el.scrollTop = 0;
    else if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── Saisie : hauteur automatique ──
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const commitLive = useCallback(() => {
    rafRef.current = null;
    const l = liveRef.current;
    if (!l) return;
    const snapshot: Msg = { ...l, steps: l.steps ? l.steps.map((s) => ({ ...s })) : undefined };
    setMessages((ms) => ms.map((m) => (m.id === snapshot.id ? snapshot : m)));
  }, []);
  const scheduleLive = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(commitLive);
  }, [commitLive]);

  const money = useCallback((n: number) => formatCurrency(Math.round(n * 100) / 100), [formatCurrency]);

  const localAnswer = useCallback(
    (q: string): string => {
      try {
        const a = dataset ? answerLocally(q, dataset, lang, money) : null;
        if (a) return a;
      } catch {
        /* ignoré */
      }
      try {
        const f = props.fallbackAnswer?.(q);
        if (f) return f;
      } catch {
        /* ignoré */
      }
      return T.noAnswer;
    },
    [dataset, lang, money, props, T],
  );

  // ── Envoi d'une question ──
  const ask = useCallback(
    async (questionRaw: string, base?: Msg[]) => {
      const question = questionRaw.trim();
      if (!question || abortRef.current) return;
      const prior = base ?? messagesRef.current;
      const userMsg: Msg = { id: uid(), role: "user", content: question, ts: Date.now() };
      const asst: Msg = { id: uid(), role: "assistant", content: "", ts: Date.now(), steps: [], mode: "ai" };
      liveRef.current = asst;
      stickRef.current = true;
      setMessages([...prior, userMsg, { ...asst }]);
      setInput("");
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const history = [...prior, userMsg]
        .filter((m) => m.content && m.content.trim())
        .map((m) => ({ role: m.role, content: m.content }))
        .slice(-16);

      let token: string | null = null;
      try {
        token = localStorage.getItem("token");
      } catch {
        token = null;
      }

      let failure: string | null = null;
      try {
        const base = {
          language: lang,
          messages: history,
          currency: props.currency,
          user: { name: props.userName || "" },
          today: toIso(new Date()),
          page: typeof window !== "undefined" ? window.location.pathname : "",
        };
        const { body, encoding } = await buildBody(base, payloadData.dataset, payloadData.profile);
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": encoding === "gzip" ? "application/octet-stream" : "application/json",
            ...(encoding === "gzip" ? { "X-Body-Encoding": "gzip" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body,
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          failure = String(j?.error || (res.status === 503 ? "not_configured" : "default"));
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          const apply = (line: string) => {
            if (!line.trim()) return;
            let e: any;
            try {
              e = JSON.parse(line);
            } catch {
              return;
            }
            const l = liveRef.current;
            if (!l) return;
            switch (e.t) {
              case "text":
                l.content += String(e.v ?? "");
                break;
              case "tool":
                l.steps = [...(l.steps ?? []), { id: String(e.id), name: String(e.name), label: String(e.label ?? e.name), status: "running" }];
                break;
              case "tool_done":
                l.steps = (l.steps ?? []).map((s) => (s.id === String(e.id) ? { ...s, status: e.ok === false ? "error" : "done", label: String(e.label ?? s.label) } : s));
                break;
              case "chart":
                l.chart = e.chart ?? null;
                break;
              case "suggestions":
                l.suggestions = Array.isArray(e.items) ? e.items.slice(0, 3).map(String) : [];
                break;
              case "error":
                l.error = String(e.message ?? "");
                break;
            }
            scheduleLive();
          };
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            lines.forEach(apply);
          }
          buf += decoder.decode();
          if (buf) apply(buf);
          const l = liveRef.current;
          if (l && !l.content.trim()) failure = l.error ? "default" : "empty";
        }
      } catch (err: any) {
        if (ctrl.signal.aborted) {
          const l = liveRef.current;
          if (l) l.stopped = true;
        } else {
          failure = "network";
        }
      }

      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const l = liveRef.current;
      if (l) {
        l.steps = (l.steps ?? []).map((s) => (s.status === "running" ? { ...s, status: l.stopped ? "error" : "done" } : s));
        l.content = l.content.replace(/\s+$/, "");
        if (failure && !l.stopped) {
          l.content = localAnswer(question);
          l.mode = "offline";
          l.offlineReason = failure;
          l.error = undefined;
          l.chart = null;
          l.suggestions = undefined;
          l.steps = [];
        }
        setLastMode(l.mode ?? null);
        commitLive();
      }
      liveRef.current = null;
      abortRef.current = null;
      setBusy(false);
      if (!isMobile) setTimeout(() => inputRef.current?.focus(), 0);
    },
    [lang, payloadData, props.currency, props.userName, scheduleLive, commitLive, localAnswer, isMobile],
  );

  const stop = () => abortRef.current?.abort();

  const regenerate = () => {
    if (busy) return;
    const ms = messagesRef.current;
    let i = ms.length - 1;
    while (i >= 0 && ms[i].role !== "user") i--;
    if (i < 0) return;
    ask(ms[i].content, ms.slice(0, i));
  };

  const newChat = () => {
    if (busy) stop();
    if (messagesRef.current.length && typeof window !== "undefined" && !window.confirm(T.confirmClear)) return;
    setMessages([]);
    setLastMode(null);
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      /* presse-papiers indisponible */
    }
  };
  const copyAll = () => copyText("__all", messagesRef.current.map((m) => `${m.role === "user" ? T.you : T.ai} : ${plain(m.content)}`).join("\n\n"));

  // Question passée par l'URL (?q=…)
  useEffect(() => {
    if (!ready || !props.initialQuestion || askedInitialRef.current) return;
    askedInitialRef.current = true;
    ask(props.initialQuestion);
  }, [ready, props.initialQuestion, ask]);

  // Annule un flux en cours si le composant est démonté
  useEffect(() => () => abortRef.current?.abort(), []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isMobile && !(e.nativeEvent as any).isComposing) {
      e.preventDefault();
      if (!busy) ask(input);
    }
  };

  // ── Styles de base ──
  const pad = isMobile ? 12 : 18;
  const btn = (active = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: isMobile ? "7px 9px" : "6px 11px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: active ? `${theme.primary}18` : theme.surface,
    color: theme.textSecondary,
    fontSize: 11.5,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    WebkitTapHighlightColor: "transparent",
  });
  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    borderRadius: 999,
    border: `1px solid ${theme.primary}33`,
    background: `${theme.primary}0d`,
    color: theme.primaryText || theme.primary,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "start",
    lineHeight: 1.35,
    WebkitTapHighlightColor: "transparent",
  };
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const statusOffline = lastMode === "offline";

  return (
    <section
      aria-label={T.title}
      className="ixa-root"
      style={{
        display: "flex",
        flexDirection: "column",
        height: props.height ?? (isMobile ? "calc(100dvh - 150px)" : 640),
        minHeight: isMobile ? 420 : 480,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: isMobile ? 14 : 16,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        fontFamily,
        color: theme.text,
      }}
    >
      <style>{STYLE}</style>

      {/* ── En-tête ── */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: `${isMobile ? 10 : 14}px ${pad}px`, borderBottom: `1px solid ${theme.border}`, background: theme.surfaceHover }}>
        <div style={{ width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 12, background: theme.gradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ISparkle size={isMobile ? 17 : 20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 14 : 15.5, fontWeight: 700, color: theme.text }}>{T.title}</h2>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 600, padding: isMobile && !statusOffline ? 4 : "2px 8px", borderRadius: 999, background: statusOffline ? "rgba(245,158,11,0.14)" : "rgba(16,185,129,0.14)", color: statusOffline ? (theme.warning || "#b45309") : (theme.success || "#047857") }}>
              <span style={{ width: 6, height: 6, borderRadius: 6, background: statusOffline ? "#f59e0b" : "#10b981" }} />
              {isMobile ? (statusOffline ? T.offline : null) : statusOffline ? T.offline : dataset ? T.connected : T.loadingData}
            </span>
          </div>
          <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 5 }}>
            <IDb size={11} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
              {counts && counts.length ? (isMobile ? `${totalRecords.toLocaleString(lang === "en" ? "en-US" : "fr-FR")} ${T.records}` : counts.join(" · ")) : T.subtitle}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {props.onRefreshData && (
            <button type="button" className="ixa-btn" onClick={props.onRefreshData} disabled={props.refreshing} title={T.refresh} aria-label={T.refresh} style={btn()}>
              <span className={props.refreshing ? "ixa-anim" : undefined} style={{ display: "inline-flex", animation: props.refreshing ? "ixa-spin 1s linear infinite" : undefined }}>
                <IRefresh size={13} />
              </span>
            </button>
          )}
          {!isMobile && messages.length > 0 && (
            <button type="button" className="ixa-btn" onClick={copyAll} title={T.copyAll} style={btn(copiedId === "__all")}>
              {copiedId === "__all" ? <ICheck size={13} /> : <ICopy size={13} />} {copiedId === "__all" ? T.copied : T.copyAll}
            </button>
          )}
          <button type="button" className="ixa-btn" onClick={newChat} title={T.newChat} aria-label={T.newChat} style={btn()}>
            <IPlus size={13} /> {!isMobile && T.newChat}
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <div ref={scrollRef} onScroll={onScroll} className="ixa-scroll" role="log" aria-live="polite" aria-busy={busy} style={{ flex: 1, overflowY: "auto", padding: pad, background: theme.background, WebkitOverflowScrolling: "touch" }}>
        {messages.length === 0 ? (
          <div className="ixa-anim" style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "8px 0" : "18px 0", animation: "ixa-in .35s ease" }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 700, color: theme.text, letterSpacing: "-0.01em" }}>{T.hello(props.userName || "")}</h3>
            <p style={{ margin: "6px 0 18px", fontSize: 13, color: theme.textSecondary, lineHeight: 1.55, maxWidth: 620 }}>{T.intro}</p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {(Object.keys(examples) as Array<keyof typeof examples>).map((cat) => (
                <div key={String(cat)} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                    <span style={{ color: theme.primaryText || theme.primary, display: "inline-flex" }}>{CAT_ICONS[String(cat)]}</span>
                    {T.cats[String(cat)]}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {examples[cat].map((q) => (
                      <button key={q} type="button" className="ixa-chip" onClick={() => ask(q)} disabled={busy} style={{ ...chip, borderRadius: 9, justifyContent: "flex-start", width: "100%" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: isMobile ? 14 : 18 }}>
            {messages.map((m) => {
              const isLast = m.id === lastAssistantId;
              const streaming = busy && isLast && m.role === "assistant";
              if (m.role === "user") {
                return (
                  <div key={m.id} className="ixa-anim" style={{ display: "flex", justifyContent: "flex-end", animation: "ixa-in .25s ease" }}>
                    <div dir="auto" style={{ maxWidth: isMobile ? "88%" : "72%", background: theme.gradient, color: "#fff", padding: "9px 14px", borderRadius: "16px 16px 4px 16px", fontSize: isMobile ? 14 : 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", boxShadow: `0 4px 14px ${theme.primary}33` }}>
                      {m.content}
                    </div>
                  </div>
                );
              }
              const steps = m.steps ?? [];
              const waiting = streaming && !m.content;
              return (
                <div key={m.id} className="ixa-anim" style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "ixa-in .25s ease" }}>
                  {!isMobile && (
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: theme.gradient, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <ISparkle size={15} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? "100%" : "92%" }}>
                    {/* Étapes d'analyse */}
                    {steps.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {steps.map((s) => (
                          <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 9px", borderRadius: 999, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textSecondary, maxWidth: "100%" }}>
                            {s.status === "running" ? (
                              <span className="ixa-anim" style={{ width: 10, height: 10, borderRadius: 10, border: `2px solid ${theme.primary}40`, borderTopColor: theme.primary, animation: "ixa-spin .8s linear infinite", flexShrink: 0 }} />
                            ) : s.status === "error" ? (
                              <span style={{ color: theme.danger || "#dc2626", display: "inline-flex" }}><IAlert size={11} /></span>
                            ) : (
                              <span style={{ color: theme.success || "#059669", display: "inline-flex" }}><ICheck size={11} /></span>
                            )}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "4px 16px 16px 16px", padding: isMobile ? "10px 12px" : "12px 16px", fontSize: isMobile ? 14 : 13.5, color: theme.text }}>
                      {waiting ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.textSecondary, fontSize: 12.5 }}>
                          <span style={{ display: "inline-flex", gap: 4 }}>
                            {[0, 1, 2].map((i) => (
                              <span key={i} className="ixa-anim" style={{ width: 6, height: 6, borderRadius: 6, background: theme.primary, animation: `ixa-dot 1.2s ${i * 0.15}s infinite ease-in-out` }} />
                            ))}
                          </span>
                          {T.thinking}
                        </div>
                      ) : (
                        <ChatMarkdown text={m.content} theme={theme} onNavigate={onNavigate} streaming={streaming && !!m.content} fontFamily={fontFamily} />
                      )}
                      {m.chart && !streaming && <MiniChart chart={m.chart} theme={theme} formatCurrency={formatCurrency} lang={lang} isMobile={isMobile} />}
                      {m.stopped && <div style={{ marginTop: 8, fontSize: 11.5, color: theme.textSecondary, fontStyle: "italic" }}>{T.stopped}</div>}
                      {m.error && m.content && <div style={{ marginTop: 8, fontSize: 11.5, color: theme.danger || "#dc2626" }}>{m.error}</div>}
                    </div>

                    {/* Pied du message */}
                    {!streaming && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontSize: 11, color: theme.textSecondary, flexWrap: "wrap" }}>
                        <span>{new Date(m.ts).toLocaleTimeString(lang === "en" ? "en-GB" : lang === "es" ? "es-ES" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                        {m.mode === "offline" && (
                          <span title={T.offlineNote(T.reasons[m.offlineReason ?? "default"] ?? T.reasons.default)} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: theme.warning || "#b45309" }}>
                            <IAlert size={11} /> {T.offlineNote(T.reasons[m.offlineReason ?? "default"] ?? T.reasons.default)}
                          </span>
                        )}
                        <button type="button" className="ixa-btn" onClick={() => copyText(m.id, plain(m.content))} style={{ ...btn(copiedId === m.id), padding: "3px 8px", fontSize: 11 }}>
                          {copiedId === m.id ? <ICheck size={11} /> : <ICopy size={11} />} {copiedId === m.id ? T.copied : T.copy}
                        </button>
                        {isLast && !busy && (
                          <button type="button" className="ixa-btn" onClick={regenerate} style={{ ...btn(), padding: "3px 8px", fontSize: 11 }}>
                            <IRefresh size={11} /> {T.regenerate}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Questions de suivi */}
                    {isLast && !busy && m.suggestions && m.suggestions.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textSecondary, marginBottom: 6 }}>{T.followUps}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {m.suggestions.map((s) => (
                            <button key={s} type="button" className="ixa-chip" onClick={() => ask(s)} style={chip} dir="auto">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Saisie ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) stop();
          else ask(input);
        }}
        style={{ padding: `${isMobile ? 10 : 12}px ${pad}px`, paddingBottom: isMobile ? "calc(10px + env(safe-area-inset-bottom, 0px))" : 12, borderTop: `1px solid ${theme.border}`, background: theme.surface }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 8, border: `1px solid ${focused ? theme.primary : theme.border}`, boxShadow: focused ? `0 0 0 3px ${theme.primary}22` : "none", transition: "border-color .15s ease, box-shadow .15s ease", borderRadius: 14, padding: "6px 6px 6px 12px", background: focused ? theme.surface : theme.surfaceHover }}>
          <textarea
            ref={inputRef}
            className="ixa-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={isMobile ? T.placeholderShort : T.placeholder}
            aria-label={T.placeholder}
            rows={1}
            maxLength={4000}
            enterKeyHint="send"
            dir="auto"
            style={{ flex: 1, minWidth: 0, width: "auto", resize: "none", border: "none", borderRadius: 0, outline: "none", boxShadow: "none", background: "transparent", color: theme.text, fontFamily, fontSize: isMobile ? 16 : 13.5, lineHeight: 1.5, padding: "6px 0", maxHeight: 160, transition: "none" }}
          />
          <button
            type="submit"
            className="ixa-btn"
            disabled={!busy && !input.trim()}
            aria-label={busy ? T.stop : T.send}
            title={busy ? T.stop : T.send}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minWidth: isMobile ? 44 : 40,
              height: isMobile ? 44 : 38,
              padding: "0 12px",
              borderRadius: 11,
              border: "none",
              background: busy ? theme.text : !input.trim() ? theme.border : theme.gradient,
              color: busy ? theme.surface : !input.trim() ? theme.textSecondary : "#fff",
              cursor: !busy && !input.trim() ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {busy ? <IStop size={14} /> : <ISend size={15} />}
            {!isMobile && <span>{busy ? T.stop : T.send}</span>}
          </button>
        </div>
        {!isMobile && <div style={{ maxWidth: 860, margin: "6px auto 0", fontSize: 10.5, color: theme.textSecondary, textAlign: "center" }}>{T.hint}</div>}
      </form>
    </section>
  );
}
