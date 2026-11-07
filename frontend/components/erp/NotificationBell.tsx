"use client";
/**
 * Cloche d'alertes : stock bas, factures en retard, devis qui expirent, lots proches de la péremption…
 * Les alertes sont générées côté serveur (GET /notifications) ; ici on les liste, on les marque comme lues
 * et on ouvre la page concernée.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./kit";

interface Item { id: number; type: string; severity: "info" | "warning" | "critical"; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string; }
interface Payload { unread: number; critical: number; items: Item[]; }

const POLL_MS = 3 * 60 * 1000;
const COLORS: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };

const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "à l’instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return `il y a ${Math.round(s / 86400)} j`;
};

/** Bouton à placer dans l'en-tête d'une page (taille `size`, comme le bouton de thème) ; le panneau s'accroche au bouton. */
export default function NotificationBell({ isMobile, size }: { isMobile: boolean; size?: number }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [panelTop, setPanelTop] = useState(72);
  const box = useRef<HTMLDivElement>(null);

  // Réservé aux comptes entreprise (ni l'opérateur plateforme, ni les transporteurs).
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const role = JSON.parse(localStorage.getItem("user") || "null")?.role;
      setAllowed(!!token && role !== "admin" && role !== "transporteur");
    } catch { setAllowed(false); }
  }, []);

  const load = useCallback(async (silent = true) => {
    try {
      setData(await api<Payload>("/notifications", { query: { limit: 40 } }));
      setError(null);
    } catch (e: any) { if (!silent) setError(e?.message || "Erreur"); }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    load();
    const tick = () => { if (document.visibilityState === "visible") load(); };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [allowed, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!allowed) return null;

  const unread = data?.unread ?? 0;
  const critical = data?.critical ?? 0;

  async function act(fn: () => Promise<any>, message?: (r: any) => string | null) {
    setBusy(true); setInfo(null); setError(null);
    try { const r = await fn(); await load(false); if (message) setInfo(message(r)); }
    catch (e: any) { setError(e?.message || "Erreur"); }
    finally { setBusy(false); }
  }

  async function openItem(n: Item) {
    if (!n.readAt) { try { await api(`/notifications/${n.id}/read`, { method: "POST" }); } catch { /* sans gravité */ } load(); }
    if (n.link) { setOpen(false); router.push(n.link); }
  }

  const btnSize = size ?? (isMobile ? 44 : 40);
  const iconSize = Math.max(16, Math.round(btnSize * 0.46));
  const trigger: React.CSSProperties = { position: "relative" };
  const panel: React.CSSProperties = isMobile
    ? { position: "fixed", left: 8, right: 8, top: panelTop, maxHeight: `calc(100vh - ${panelTop + 16}px)` }
    : { position: "absolute", right: 0, top: btnSize + 8, width: 400, maxHeight: "80vh" };

  return (
    <div ref={box} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        aria-label={unread ? `Alertes : ${unread} non lue(s)` : "Alertes"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (!open) { load(false); setPanelTop(Math.round((box.current?.getBoundingClientRect().bottom ?? 60) + 8)); }
          setOpen((o) => !o);
        }}
        style={{
          ...trigger, width: btnSize, height: btnSize, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--theme-surface)", color: "var(--theme-text)", border: "1px solid var(--theme-border)", boxShadow: "none",
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: critical ? COLORS.critical : COLORS.warning }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Alertes" style={{ ...panel, zIndex: 2400, display: "flex", flexDirection: "column", background: "var(--theme-surface)", color: "var(--theme-text)", border: "1px solid var(--theme-border)", borderRadius: 14, boxShadow: "0 18px 50px rgba(0,0,0,.35)", overflow: "hidden" }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--theme-border)" }}>
            <strong style={{ fontSize: 15 }}>Alertes{unread ? ` (${unread})` : ""}</strong>
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" disabled={busy} onClick={() => act(() => api("/notifications/refresh", { method: "POST" }))} style={linkBtn}>Actualiser</button>
              <button type="button" disabled={busy || !unread} onClick={() => act(() => api("/notifications/read-all", { method: "POST" }))} style={linkBtn}>Tout lire</button>
              <button type="button" disabled={busy} onClick={() => act(() => api("/notifications/digest", { method: "POST" }), (r) => (r.sent ? `Récapitulatif envoyé à ${r.to} (${r.count} alerte(s)).` : r.reason || "Rien à envoyer."))} style={linkBtn}>Envoyer par email</button>
            </span>
          </header>
          {(error || info) && <div role={error ? "alert" : "status"} style={{ padding: "8px 14px", fontSize: 13, color: error ? "#ef4444" : "var(--theme-text-secondary)", borderBottom: "1px solid var(--theme-border)" }}>{error || info}</div>}
          <div style={{ overflowY: "auto" }}>
            {!data ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--theme-text-secondary)", fontSize: 14 }}>Chargement…</div>
            ) : !data.items.length ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--theme-text-secondary)", fontSize: 14 }}>Aucune alerte. Tout est à jour.</div>
            ) : data.items.map((n) => (
              <button key={n.id} type="button" onClick={() => openItem(n)} style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderBottom: "1px solid var(--theme-border)", background: n.readAt ? "transparent" : "var(--theme-surface-hover)", color: "inherit", cursor: "pointer", fontFamily: "inherit" }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: n.readAt ? "transparent" : COLORS[n.severity] || COLORS.info, border: n.readAt ? "1px solid var(--theme-border)" : "none" }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: n.readAt ? 500 : 700 }}>{n.title}</span>
                  {n.body && <span style={{ display: "block", fontSize: 12.5, color: "var(--theme-text-secondary)", marginTop: 2 }}>{n.body}</span>}
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--theme-text-secondary)", marginTop: 3 }}>{ago(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const linkBtn: React.CSSProperties = { background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "var(--theme-primary, #4f46e5)", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" };
