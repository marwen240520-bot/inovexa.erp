"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Metric = "revenue" | "profit" | "sales_count" | "new_clients";
type Period = "month" | "quarter" | "year" | "custom";
type Status = "achieved" | "on_track" | "behind" | "missed" | "upcoming";
interface Objective {
  id: number; title: string; metric: Metric; period: Period; startDate: string; endDate: string; targetValue: number;
  progress: { current: number; target: number; percent: number; remaining: number; totalDays: number; elapsedDays: number; daysLeft: number; elapsedPercent: number; status: Status; neededPerDay: number };
}
interface Form { id?: number; title: string; metric: Metric; period: Period; startDate: string; endDate: string; targetValue: string; }

const METRICS: Metric[] = ["revenue", "profit", "sales_count", "new_clients"];
const PERIODS: Period[] = ["month", "quarter", "year", "custom"];

const TX: Record<string, Record<string, string>> = {
  fr: {
    title: "Objectifs", subtitle: "Fixez des objectifs et suivez leur avancement en temps réel", add: "Nouvel objectif",
    inProgress: "En cours", done: "Atteints", late: "En retard", all: "Tous", ended: "Terminés",
    revenue: "Chiffre d'affaires", profit: "Bénéfice", sales_count: "Nombre de ventes", new_clients: "Nouveaux clients",
    month: "Ce mois", quarter: "Ce trimestre", year: "Cette année", custom: "Personnalisée",
    achieved: "Atteint", on_track: "Dans les temps", behind: "En retard", missed: "Manqué", upcoming: "À venir",
    target: "Cible", current: "Réalisé", remaining: "Reste", daysLeft: "jour(s) restant(s)", perDay: "à réaliser par jour", ended2: "Période terminée",
    editTitle: "Modifier l'objectif", newTitle: "Nouvel objectif", name: "Titre", metric: "Indicateur", period: "Période", from: "Du", to: "Au", targetValue: "Valeur cible",
    save: "Enregistrer", cancel: "Annuler", edit: "Modifier", del: "Supprimer", confirmDel: "Supprimer cet objectif ?",
    empty: "Aucun objectif pour le moment", emptyHint: "Créez votre premier objectif : l'avancement est calculé automatiquement d'après vos ventes.",
    templates: "Modèles rapides", saved: "Objectif enregistré", deleted: "Objectif supprimé", errServer: "Erreur du serveur. Réessayez.", errNetwork: "Impossible de joindre le serveur.",
    unavailable: "Le module Objectifs n'est pas encore disponible sur le serveur (mise à jour du backend requise).",
    hintRevenue: "Total des ventes sur la période", hintProfit: "Ventes − achats sur la période", hintSales: "Nombre de ventes enregistrées", hintClients: "Clients ajoutés sur la période",
    tplRevMonth: "CA du mois", tplProfitQuarter: "Bénéfice du trimestre", tplSalesMonth: "Ventes du mois", tplClientsMonth: "Nouveaux clients du mois",
  },
  en: {
    title: "Goals", subtitle: "Set goals and follow their progress in real time", add: "New goal",
    inProgress: "In progress", done: "Achieved", late: "Behind", all: "All", ended: "Ended",
    revenue: "Revenue", profit: "Profit", sales_count: "Number of sales", new_clients: "New clients",
    month: "This month", quarter: "This quarter", year: "This year", custom: "Custom",
    achieved: "Achieved", on_track: "On track", behind: "Behind", missed: "Missed", upcoming: "Upcoming",
    target: "Target", current: "Achieved", remaining: "Remaining", daysLeft: "day(s) left", perDay: "needed per day", ended2: "Period ended",
    editTitle: "Edit goal", newTitle: "New goal", name: "Title", metric: "Metric", period: "Period", from: "From", to: "To", targetValue: "Target value",
    save: "Save", cancel: "Cancel", edit: "Edit", del: "Delete", confirmDel: "Delete this goal?",
    empty: "No goals yet", emptyHint: "Create your first goal: progress is calculated automatically from your sales.",
    templates: "Quick templates", saved: "Goal saved", deleted: "Goal deleted", errServer: "Server error. Please try again.", errNetwork: "Cannot reach the server.",
    unavailable: "The Goals module is not available on the server yet (backend update required).",
    hintRevenue: "Total sales over the period", hintProfit: "Sales − purchases over the period", hintSales: "Number of recorded sales", hintClients: "Clients added over the period",
    tplRevMonth: "Monthly revenue", tplProfitQuarter: "Quarterly profit", tplSalesMonth: "Monthly sales", tplClientsMonth: "New clients this month",
  },
  es: {
    title: "Objetivos", subtitle: "Fije objetivos y siga su avance en tiempo real", add: "Nuevo objetivo",
    inProgress: "En curso", done: "Logrados", late: "Atrasados", all: "Todos", ended: "Terminados",
    revenue: "Ingresos", profit: "Beneficio", sales_count: "Número de ventas", new_clients: "Nuevos clientes",
    month: "Este mes", quarter: "Este trimestre", year: "Este año", custom: "Personalizado",
    achieved: "Logrado", on_track: "En camino", behind: "Atrasado", missed: "No logrado", upcoming: "Próximo",
    target: "Meta", current: "Logrado", remaining: "Falta", daysLeft: "día(s) restante(s)", perDay: "necesarios por día", ended2: "Periodo terminado",
    editTitle: "Editar objetivo", newTitle: "Nuevo objetivo", name: "Título", metric: "Indicador", period: "Periodo", from: "Desde", to: "Hasta", targetValue: "Valor meta",
    save: "Guardar", cancel: "Cancelar", edit: "Editar", del: "Eliminar", confirmDel: "¿Eliminar este objetivo?",
    empty: "Aún no hay objetivos", emptyHint: "Cree su primer objetivo: el avance se calcula automáticamente con sus ventas.",
    templates: "Plantillas rápidas", saved: "Objetivo guardado", deleted: "Objetivo eliminado", errServer: "Error del servidor. Inténtelo de nuevo.", errNetwork: "No se puede conectar con el servidor.",
    unavailable: "El módulo Objetivos aún no está disponible en el servidor (se requiere actualizar el backend).",
    hintRevenue: "Total de ventas del periodo", hintProfit: "Ventas − compras del periodo", hintSales: "Número de ventas registradas", hintClients: "Clientes añadidos en el periodo",
    tplRevMonth: "Ingresos del mes", tplProfitQuarter: "Beneficio del trimestre", tplSalesMonth: "Ventas del mes", tplClientsMonth: "Nuevos clientes del mes",
  },
};

const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  achieved: { bg: "rgba(16,185,129,0.16)", fg: "#10b981" },
  on_track: { bg: "rgba(99,102,241,0.16)", fg: "#6366f1" },
  behind: { bg: "rgba(245,158,11,0.18)", fg: "#f59e0b" },
  missed: { bg: "rgba(239,68,68,0.16)", fg: "#ef4444" },
  upcoming: { bg: "rgba(100,116,139,0.18)", fg: "#64748b" },
};
const RING_COLOR: Record<Status, string> = { achieved: "#10b981", on_track: "#6366f1", behind: "#f59e0b", missed: "#ef4444", upcoming: "#64748b" };

const todayIso = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): Form => ({ title: "", metric: "revenue", period: "month", startDate: todayIso(), endDate: todayIso(), targetValue: "" });

export default function ObjectivesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile } = useResponsive();
  const { theme } = useTheme();
  const t = TX[language] || TX.fr;

  const [items, setItems] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [tab, setTab] = useState<"active" | "done" | "ended" | "all">("active");
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });
  const notify = (text: string, type: "success" | "error" = "success") => { setMessage({ text, type }); setTimeout(() => setMessage(null), 3500); };
  const money = (m: Metric, v: number) => (m === "revenue" || m === "profit" ? formatCurrency(v) : (Number.isInteger(v) ? v : Math.round(v * 10) / 10).toLocaleString());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/objectives`, { headers: headers() });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (res.status === 404) { setUnavailable(true); setItems([]); }
      else { const data = await res.json(); setItems(Array.isArray(data) ? data : []); setUnavailable(false); }
    } catch { notify(t.errNetwork, "error"); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, language]);

  useEffect(() => { if (!localStorage.getItem("token")) { router.push("/auth/login"); return; } load(); }, [load, router]);

  const today = todayIso();
  const counts = useMemo(() => ({
    active: items.filter((o) => o.endDate >= today).length,
    done: items.filter((o) => o.progress.status === "achieved").length,
    late: items.filter((o) => o.progress.status === "behind").length,
    ended: items.filter((o) => o.endDate < today).length,
  }), [items, today]);

  const visible = items.filter((o) => tab === "all" ? true : tab === "done" ? o.progress.status === "achieved" : tab === "ended" ? o.endDate < today : o.endDate >= today);

  const openNew = (preset?: Partial<Form>) => { setFormError(""); setForm({ ...emptyForm(), ...preset }); };
  const openEdit = (o: Objective) => { setFormError(""); setForm({ id: o.id, title: o.title, metric: o.metric, period: o.period, startDate: o.startDate, endDate: o.endDate, targetValue: String(o.targetValue) }); };

  const save = async () => {
    if (!form) return;
    if (!form.title.trim()) { setFormError(`${t.name} ?`); return; }
    if (!(Number(String(form.targetValue).replace(",", ".")) > 0)) { setFormError(`${t.targetValue} > 0`); return; }
    setSaving(true); setFormError("");
    try {
      const res = await fetch(`${API_URL}/objectives${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PUT" : "POST", headers: headers(),
        body: JSON.stringify({ title: form.title, metric: form.metric, period: form.period, targetValue: form.targetValue, ...(form.period === "custom" ? { startDate: form.startDate, endDate: form.endDate } : form.id ? { startDate: form.startDate } : {}) }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (res.ok) { setForm(null); notify(t.saved); setTab("active"); await load(); }
      else if (res.status === 404) setFormError(t.unavailable);
      else setFormError((Array.isArray(data?.message) ? data.message[0] : data?.message) || t.errServer);
    } catch { setFormError(t.errNetwork); }
    setSaving(false);
  };

  const remove = async (o: Objective) => {
    if (!confirm(t.confirmDel)) return;
    try { const res = await fetch(`${API_URL}/objectives/${o.id}`, { method: "DELETE", headers: headers() }); if (res.ok) { notify(t.deleted); await load(); } else notify(t.errServer, "error"); }
    catch { notify(t.errNetwork, "error"); }
  };

  const card: React.CSSProperties = { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16 };
  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 46, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceHover, color: theme.text, padding: "0 12px", fontSize: 16 };
  const hint = (m: Metric) => ({ revenue: t.hintRevenue, profit: t.hintProfit, sales_count: t.hintSales, new_clients: t.hintClients }[m]);

  const Ring = ({ percent, color }: { percent: number; color: string }) => {
    const r = 34, c = 2 * Math.PI * r, p = Math.max(0, Math.min(percent, 100));
    return (
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={r} fill="none" stroke={theme.border} strokeWidth="9" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} transform="rotate(-90 44 44)" />
        <text x="44" y="49" textAnchor="middle" fontSize="17" fontWeight="800" fill={theme.text}>{Math.round(percent)}%</text>
      </svg>
    );
  };

  const templates: Array<{ label: string; preset: Partial<Form> }> = [
    { label: t.tplRevMonth, preset: { title: t.tplRevMonth, metric: "revenue", period: "month" } },
    { label: t.tplProfitQuarter, preset: { title: t.tplProfitQuarter, metric: "profit", period: "quarter" } },
    { label: t.tplSalesMonth, preset: { title: t.tplSalesMonth, metric: "sales_count", period: "month" } },
    { label: t.tplClientsMonth, preset: { title: t.tplClientsMonth, metric: "new_clients", period: "month" } },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.background, padding: isMobile ? 12 : 16, paddingBottom: isMobile ? 90 : 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, color: theme.text, fontSize: isMobile ? 20 : 28, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={isMobile ? 20 : 26} height={isMobile ? 20 : 26} viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
              {t.title}
            </h1>
            <p style={{ margin: "4px 0 0", color: theme.textSecondary, fontSize: isMobile ? 12 : 14 }}>{t.subtitle}</p>
          </div>
          <button onClick={() => openNew()} style={{ height: 46, padding: "0 20px", borderRadius: 12, border: "none", background: theme.gradient, color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>+ {t.add}</button>
        </div>

        {message && <div role="status" style={{ position: "fixed", top: 12, left: 12, right: 12, maxWidth: 520, margin: "0 auto", zIndex: 4000, background: theme.surface, border: `1.5px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`, color: message.type === "success" ? "#047857" : "#b91c1c", padding: "12px 16px", borderRadius: 12, textAlign: "center", fontWeight: 600, boxShadow: "0 10px 30px rgba(17,24,39,0.18)" }}>{message.text}</div>}

        {unavailable && <div style={{ ...card, padding: 16, color: theme.text, marginBottom: 16, borderColor: "#f59e0b" }}>{t.unavailable}</div>}

        {/* Onglets */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
          {([["active", t.inProgress, counts.active], ["done", t.done, counts.done], ["ended", t.ended, counts.ended], ["all", t.all, items.length]] as const).map(([key, label, n]) => (
            <button key={key} onClick={() => setTab(key)} aria-pressed={tab === key} style={{ flexShrink: 0, minHeight: 42, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: tab === key ? 700 : 500, border: `1.5px solid ${tab === key ? theme.primary : theme.border}`, background: tab === key ? theme.primary : theme.surface, color: tab === key ? "#ffffff" : theme.text }}>
              {label} <span style={{ opacity: 0.8 }}>({n})</span>
            </button>
          ))}
          {counts.late > 0 && <span style={{ flexShrink: 0, alignSelf: "center", fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>⚠ {counts.late} {t.late.toLowerCase()}</span>}
        </div>

        {loading ? (
          <div style={{ color: theme.textSecondary, textAlign: "center", padding: 40 }}>…</div>
        ) : visible.length === 0 ? (
          <div style={{ ...card, padding: isMobile ? 22 : 36, textAlign: "center" }}>
            <div style={{ color: theme.text, fontSize: 18, fontWeight: 700 }}>{t.empty}</div>
            <p style={{ color: theme.textSecondary, margin: "8px auto 16px", maxWidth: 420, fontSize: 14 }}>{t.emptyHint}</p>
            <div style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>{t.templates}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {templates.map((tp) => <button key={tp.label} onClick={() => openNew(tp.preset)} style={{ minHeight: 42, padding: "0 14px", borderRadius: 999, border: `1px solid ${theme.border}`, background: theme.surfaceHover, color: theme.text, cursor: "pointer", fontSize: 14 }}>{tp.label}</button>)}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {visible.map((o) => {
              const p = o.progress, st = STATUS_STYLE[p.status], ended = o.endDate < today;
              return (
                <div key={o.id} style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 700, fontSize: 16, wordBreak: "break-word" }}>{o.title}</div>
                      <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{t[o.metric]} · {o.startDate} → {o.endDate}</div>
                    </div>
                    <span style={{ background: st.bg, color: st.fg, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{t[p.status]}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Ring percent={p.percent} color={RING_COLOR[p.status]} />
                    <div style={{ flex: 1, display: "grid", gap: 6, fontSize: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.textSecondary }}>{t.current}</span><strong style={{ color: theme.text }}>{money(o.metric, p.current)}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.textSecondary }}>{t.target}</span><strong style={{ color: theme.text }}>{money(o.metric, p.target)}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.textSecondary }}>{t.remaining}</span><strong style={{ color: theme.text }}>{money(o.metric, p.remaining)}</strong></div>
                    </div>
                  </div>
                  <div title={`${Math.round(p.elapsedPercent)} %`} style={{ position: "relative", height: 8, borderRadius: 999, background: theme.surfaceHover, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, p.percent)}%`, height: "100%", background: RING_COLOR[p.status], borderRadius: 999 }} />
                    {!ended && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${Math.min(100, p.elapsedPercent)}%`, width: 2, background: theme.text, opacity: 0.45 }} />}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, color: theme.textSecondary }}>
                    <span>{ended ? t.ended2 : `${p.daysLeft} ${t.daysLeft}${p.neededPerDay > 0 && p.status !== "achieved" ? ` · ${money(o.metric, p.neededPerDay)} ${t.perDay}` : ""}`}</span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(o)} style={{ minHeight: 38, padding: "0 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceHover, color: theme.text, cursor: "pointer", fontSize: 13 }}>{t.edit}</button>
                      <button onClick={() => remove(o)} style={{ minHeight: 38, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(185,28,28,0.4)", background: "transparent", color: "#b91c1c", cursor: "pointer", fontSize: 13 }}>{t.del}</button>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulaire */}
      {form && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setForm(null); }} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 16 }}>
          <div style={{ width: "100%", maxWidth: 480, maxHeight: isMobile ? "calc(100dvh - 12px)" : "90vh", overflowY: "auto", background: theme.surface, color: theme.text, borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "18px 16px calc(16px + env(safe-area-inset-bottom))" : 26 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>{form.id ? t.editTitle : t.newTitle}</h2>
            <label style={{ display: "block", color: theme.textSecondary, fontSize: 12, marginBottom: 5 }}>{t.name}</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} style={{ ...field, marginBottom: 12 }} />
            <label style={{ display: "block", color: theme.textSecondary, fontSize: 12, marginBottom: 5 }}>{t.metric}</label>
            <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value as Metric })} style={{ ...field, marginBottom: 4 }}>{METRICS.map((m) => <option key={m} value={m}>{t[m]}</option>)}</select>
            <div style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>{hint(form.metric)}</div>
            <label style={{ display: "block", color: theme.textSecondary, fontSize: 12, marginBottom: 5 }}>{t.period}</label>
            <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as Period })} style={{ ...field, marginBottom: 12 }}>{PERIODS.map((p) => <option key={p} value={p}>{t[p]}</option>)}</select>
            {form.period === "custom" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div><label style={{ display: "block", color: theme.textSecondary, fontSize: 12, marginBottom: 5 }}>{t.from}</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={field} /></div>
                <div><label style={{ display: "block", color: theme.textSecondary, fontSize: 12, marginBottom: 5 }}>{t.to}</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={field} /></div>
              </div>
            )}
            <label style={{ display: "block", color: theme.textSecondary, fontSize: 12, marginBottom: 5 }}>{t.targetValue}</label>
            <input type="number" inputMode="decimal" min={0} step="any" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} style={{ ...field, marginBottom: 12 }} />
            {formError && <div role="alert" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.5)", color: "#b91c1c", borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 12 }}>{formError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1.4, height: 50, borderRadius: 12, border: "none", background: theme.gradient, color: "#fff", fontSize: 16, fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "…" : t.save}</button>
              <button onClick={() => setForm(null)} style={{ flex: 1, height: 50, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceHover, color: theme.text, fontSize: 15, cursor: "pointer" }}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
