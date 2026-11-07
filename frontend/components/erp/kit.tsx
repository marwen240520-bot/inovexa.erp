"use client";
/**
 * Kit commun des écrans « ERP » (documents, comptabilité, paie, rapports…) :
 * client d'API authentifié, formats, et quelques composants sobres basés sur les variables du thème.
 */
import React, { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const readToken = () => {
  try { return localStorage.getItem("token"); } catch { return null; }
};

type Query = Record<string, string | number | boolean | null | undefined>;
const toQuery = (q?: Query) => {
  if (!q) return "";
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : "";
};

/** Appel JSON authentifié. Lève ApiError avec le message du serveur (tableaux de validation aplatis). */
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; query?: Query } = {}): Promise<T> {
  const token = readToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${toQuery(opts.query)}`, {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError("Impossible de joindre le serveur.", 0);
  }
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/auth/login";
    throw new ApiError("Session expirée : reconnectez-vous.", 401);
  }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const m = data?.message;
    throw new ApiError(Array.isArray(m) ? m.join(" · ") : m || `Erreur ${res.status}`, res.status);
  }
  return data as T;
}

/** Télécharge (ou ouvre) un fichier protégé par le jeton : PDF, Excel… */
export async function fetchFile(path: string, opts: { query?: Query; filename?: string; open?: boolean } = {}) {
  const token = readToken();
  const res = await fetch(`${API_URL}${path}${toQuery(opts.query)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try { const j = await res.json(); msg = Array.isArray(j.message) ? j.message.join(" · ") : j.message || msg; } catch { /* corps non JSON */ }
    throw new ApiError(msg, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (opts.open) {
    window.open(url, "_blank", "noopener");
  } else {
    const disposition = res.headers.get("content-disposition") || "";
    const name = opts.filename || /filename="?([^";]+)"?/.exec(disposition)?.[1] || "export";
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ───────────── Formats ─────────────

const moneyFmt = new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export const money = (n: unknown) => moneyFmt.format(Number(n) || 0);
export const moneyDT = (n: unknown) => `${money(n)} DT`;
export const pct = (n: unknown) => (n === null || n === undefined ? "—" : `${Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`);
export const qty = (n: unknown) => Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 3 });
export const fmtDate = (d?: string | null) => (d ? String(d).slice(0, 10).split("-").reverse().join("/") : "—");
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDaysISO = (days: number, from = todayISO()) => {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// ───────────── Données ─────────────

/** Charge une ressource et la recharge quand `deps` change. */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const reload = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    try {
      const d = await loader();
      if (id === seq.current) { setData(d); setError(null); }
    } catch (e: any) {
      if (id === seq.current) setError(e?.message || "Erreur de chargement");
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}

/** Redirige vers la connexion s'il n'y a pas de jeton. */
export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => { if (!readToken()) router.push("/auth/login"); }, [router]);
}

/** Message de retour (succès / erreur) affiché en haut de page. */
export function useNotice(): [ReactNode, (msg: string, tone?: "ok" | "err") => void] {
  const [n, setN] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const timer = useRef<number | null>(null);
  const notify = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    setN({ msg, tone });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setN(null), tone === "err" ? 9000 : 4000);
  }, []);
  const node = n ? (
    <div
      role="status"
      onClick={() => setN(null)}
      style={{
        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 3000, maxWidth: "min(92vw, 640px)",
        padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff",
        background: n.tone === "ok" ? "var(--theme-success, #10b981)" : "var(--theme-danger, #ef4444)", boxShadow: "0 8px 24px rgba(0,0,0,.25)",
      }}
    >
      {n.msg}
    </div>
  ) : null;
  return [node, notify];
}

// ───────────── Composants ─────────────

export const inputStyle: CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--theme-border)", background: "var(--theme-surface)",
  color: "var(--theme-text)", fontSize: 14, outline: "none", minWidth: 0,
};

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ padding: "clamp(14px, 3vw, 28px)", paddingBottom: 96, maxWidth: 1280, margin: "0 auto", color: "var(--theme-text)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700 }}>{title}</h1>
          {subtitle && <p style={{ margin: "4px 0 0", color: "var(--theme-text-secondary)", fontSize: 14 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, right, children, pad = true, style }: { title?: ReactNode; right?: ReactNode; children: ReactNode; pad?: boolean; style?: CSSProperties }) {
  return (
    <section style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 14, marginBottom: 16, overflow: "hidden", ...style }}>
      {(title || right) && (
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--theme-border)" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h2>
          {right}
        </header>
      )}
      <div style={pad ? { padding: 16 } : undefined}>{children}</div>
    </section>
  );
}

type Variant = "primary" | "ghost" | "danger" | "success";
export function Btn({ variant = "ghost", busy, children, style, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  const colors: Record<Variant, CSSProperties> = {
    primary: { background: "var(--theme-primary, #4f46e5)", color: "#fff", border: "1px solid transparent" },
    success: { background: "var(--theme-success, #10b981)", color: "#fff", border: "1px solid transparent" },
    danger: { background: "transparent", color: "var(--theme-danger, #ef4444)", border: "1px solid var(--theme-danger, #ef4444)" },
    ghost: { background: "transparent", color: "var(--theme-text)", border: "1px solid var(--theme-border)" },
  };
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      style={{ padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: rest.disabled || busy ? "not-allowed" : "pointer", opacity: rest.disabled || busy ? 0.6 : 1, whiteSpace: "nowrap", ...colors[variant], ...style }}
    >
      {busy ? "…" : children}
    </button>
  );
}

const TONES: Record<string, { bg: string; fg: string }> = {
  gray: { bg: "rgba(107,114,128,.16)", fg: "var(--theme-text-secondary)" },
  green: { bg: "rgba(16,185,129,.16)", fg: "#059669" },
  red: { bg: "rgba(239,68,68,.16)", fg: "#dc2626" },
  amber: { bg: "rgba(245,158,11,.18)", fg: "#b45309" },
  blue: { bg: "rgba(59,130,246,.16)", fg: "#2563eb" },
  violet: { bg: "rgba(124,58,237,.16)", fg: "#7c3aed" },
};
export function Badge({ tone = "gray", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  const t = TONES[tone];
  return <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>{children}</span>;
}

export const STATUS_LABEL: Record<string, [string, keyof typeof TONES]> = {
  draft: ["Brouillon", "gray"], sent: ["Envoyé", "blue"], accepted: ["Accepté", "green"], rejected: ["Refusé", "red"], expired: ["Expiré", "amber"],
  converted: ["Converti", "violet"], validated: ["Validé", "blue"], confirmed: ["Confirmé", "blue"], partially_received: ["Reçu en partie", "amber"],
  received: ["Reçu", "green"], delivered: ["Livré", "green"], invoiced: ["Facturé", "violet"], cancelled: ["Annulé", "red"], credited: ["Crédité", "violet"],
  paid: ["Payée", "green"], partial: ["Partielle", "amber"], unpaid: ["Impayée", "red"],
};
export function StatusBadge({ status }: { status?: string | null }) {
  if (!status || status === "none") return null;
  const [label, tone] = STATUS_LABEL[status] || [status, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Field({ label, children, hint, grow }: { label: string; children: ReactNode; hint?: string; grow?: boolean }) {
  // L'aide est posée sous le champ sans changer sa hauteur : les champs d'une même ligne restent alignés.
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: grow ? "1 1 220px" : "0 1 auto", minWidth: 0, position: "relative" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{label}</span>
      {children}
      {hint && <span style={{ position: "absolute", top: "100%", left: 0, marginTop: 2, fontSize: 11, lineHeight: 1.2, whiteSpace: "nowrap", color: "var(--theme-text-secondary)" }}>{hint}</span>}
    </label>
  );
}

export function Row({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return <div style={{ display: "flex", flexWrap: "wrap", columnGap: gap, rowGap: gap + 8, alignItems: "flex-end" }}>{children}</div>;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: Array<[T, string]>; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16, borderBottom: "1px solid var(--theme-border)" }}>
      {tabs.map(([k, label]) => (
        <button
          key={k}
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          style={{
            padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 14, fontWeight: value === k ? 700 : 500,
            color: value === k ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary)",
            borderBottom: value === k ? "2px solid var(--theme-primary, #4f46e5)" : "2px solid transparent", marginBottom: -1,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, width = 520 }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 2500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", background: "var(--theme-surface)", color: "var(--theme-text)", borderRadius: 14, border: "1px solid var(--theme-border)", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--theme-border)" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button aria-label="Fermer" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--theme-text-secondary)", lineHeight: 1 }}>×</button>
        </header>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        {footer && <footer style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--theme-border)" }}>{footer}</footer>}
      </div>
    </div>
  );
}

export const th: CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12, fontWeight: 700, color: "var(--theme-text-secondary)", background: "var(--theme-surface-hover)", whiteSpace: "nowrap" };
export const td: CSSProperties = { padding: "9px 12px", fontSize: 14, borderTop: "1px solid var(--theme-border)", verticalAlign: "top" };
export const num: CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

export function TableWrap({ children, min = 560 }: { children: ReactNode; min?: number }) {
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: min }}>{children}</table></div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div style={{ padding: 28, textAlign: "center", color: "var(--theme-text-secondary)", fontSize: 14 }}>{children}</div>;
}

export function Stat({ label, value, tone, sub }: { label: string; value: ReactNode; tone?: "good" | "bad"; sub?: ReactNode }) {
  return (
    <div style={{ flex: "1 1 170px", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, color: tone === "good" ? "var(--theme-success, #10b981)" : tone === "bad" ? "var(--theme-danger, #ef4444)" : "var(--theme-text)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Loading() {
  return <div style={{ padding: 28, textAlign: "center", color: "var(--theme-text-secondary)" }}>Chargement…</div>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ padding: 14, borderRadius: 10, border: "1px solid var(--theme-danger, #ef4444)", color: "var(--theme-danger, #ef4444)", display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontSize: 14 }}>{message}</span>
      {onRetry && <Btn onClick={onRetry}>Réessayer</Btn>}
    </div>
  );
}

/** Message d'avertissement non bloquant (ex. paramètres non validés). */
export function Notice({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "blue" }) {
  const c = tone === "amber" ? { bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.5)" } : { bg: "rgba(59,130,246,.1)", border: "rgba(59,130,246,.4)" };
  return <div style={{ padding: "10px 14px", borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, fontSize: 13, marginBottom: 16 }}>{children}</div>;
}
