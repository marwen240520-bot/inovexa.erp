"use client";
// ============================================================
//  components/assistant/FloatingAssistant.tsx — Bouton « Chat IA »
//
//  Bouton flottant présent sur toutes les pages du tableau de bord :
//  un clic ouvre l'Assistant IA (même moteur que /dashboard/ai) dans
//  une fenêtre, sans quitter la page en cours.
//
//   • masquable dans Paramètres › Préférences (lib/aiChatButton)
//   • données des modules chargées à la PREMIÈRE ouverture seulement
//     (aucun coût sur les pages tant que le chat n'est pas utilisé)
//   • conversation conservée pendant la navigation (le layout persiste)
//   • Échap ferme la fenêtre ; plein écran sur mobile
//   • masqué sur /dashboard/ai, qui affiche déjà le chat en grand
//   • icône vectorielle (robot assistant + pastille « IA ») aux couleurs
//     du thème : nette à toute taille, en clair comme en sombre
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { AI_CHAT_BUTTON_EVENT, AI_CHAT_BUTTON_KEY, readAiChatButton } from "@/lib/aiChatButton";

// Chargé à la demande : le code du chat (Markdown, graphiques…) n'alourdit pas les autres pages.
const AssistantChat = dynamic(() => import("./AssistantChat"), { ssr: false });

const LABELS: Record<string, { open: string; close: string; title: string; full: string; badge: string }> = {
  fr: { open: "Ouvrir le Chat IA", close: "Fermer le Chat IA", title: "Chat IA", full: "Ouvrir en plein écran", badge: "IA" },
  en: { open: "Open AI chat", close: "Close AI chat", title: "AI chat", full: "Open full screen", badge: "AI" },
  es: { open: "Abrir el chat IA", close: "Cerrar el chat IA", title: "Chat IA", full: "Abrir en pantalla completa", badge: "IA" },
};

// Mêmes modules que la page Assistant IA (un module absent renvoie simplement [])
const ENDPOINTS: Record<string, string> = {
  sales: "sales", purchases: "purchases", products: "products", clients: "clients", orders: "orders",
  invoices: "invoices", employees: "employees", suppliers: "suppliers", categories: "categories",
  expenses: "expenses", projects: "projects", shipments: "logistics/shipments",
};

async function loadDataset(): Promise<Record<string, any[]>> {
  const API = process.env.NEXT_PUBLIC_API_URL;
  let token: string | null = null;
  try { token = localStorage.getItem("token"); } catch { token = null; }
  const entries = await Promise.all(
    Object.entries(ENDPOINTS).map(async ([key, path]) => {
      try {
        const res = await fetch(`${API}/${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
        if (!res.ok) return [key, []] as const;
        const json = await res.json();
        return [key, Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : Array.isArray(json?.data) ? json.data : []] as const;
      } catch {
        return [key, []] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

// Bouton : halo discret qui pulse trois fois à l'arrivée sur la page puis s'arrête (rien du tout si l'utilisateur réduit
// les animations), anneau de focus visible au clavier.
const FAB_STYLE = `
@keyframes ixa-fab-halo { 0% { transform: scale(1); opacity: .4; } 80% { transform: scale(1.45); opacity: 0; } 100% { transform: scale(1.45); opacity: 0; } }
.ixa-fab-halo { position: absolute; inset: 0; border-radius: inherit; z-index: -1; animation: ixa-fab-halo 2.6s ease-out 3; opacity: 0; pointer-events: none; }
.ixa-fab:focus-visible { outline: 3px solid rgba(124, 58, 237, .55); outline-offset: 3px; }
.ixa-fab-badge { position: absolute; top: -4px; inset-inline-end: -7px; z-index: 1; padding: 2px 6px; border-radius: 999px; background: #fff; color: #5b21b6;
  font: 800 10px/1.2 system-ui, -apple-system, "Segoe UI", sans-serif; letter-spacing: .04em; box-shadow: 0 2px 6px rgba(0, 0, 0, .2); pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .ixa-fab-halo { animation: none; } }
`;

/** Icône du Chat IA : tête de robot assistant, en trait blanc (la pastille « IA » est posée sur le bouton). */
const RobotIcon = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="12" cy="2.9" r="1.15" fill="currentColor" stroke="none" />
    <line x1="12" y1="4" x2="12" y2="6.2" />
    <rect x="4.6" y="6.2" width="14.8" height="11.6" rx="3.6" />
    <circle cx="9.3" cy="11.3" r="1.45" fill="currentColor" stroke="none" />
    <circle cx="14.7" cy="11.3" r="1.45" fill="currentColor" stroke="none" />
    <path d="M9.6 14.6c1.4 1 3.4 1 4.8 0" />
    <line x1="2.6" y1="10.2" x2="2.6" y2="13.8" />
    <line x1="21.4" y1="10.2" x2="21.4" y2="13.8" />
  </svg>
);

const CloseIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ExpandIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

export default function FloatingAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { formatCurrency, currency, getCurrencySymbol } = useAppSettings();
  const L = LABELS[language] || LABELS.fr;

  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dataset, setDataset] = useState<Record<string, any[]> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const loadingRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Préférence (Paramètres) + taille d'écran
  useEffect(() => {
    setEnabled(readAiChatButton());
    setMounted(true);
    try { const u = localStorage.getItem("user"); if (u) setUser(JSON.parse(u)); } catch { /* ignoré */ }
    const onPref = (e: Event) => {
      const detail = (e as CustomEvent).detail?.visible;
      const visible = typeof detail === "boolean" ? detail : readAiChatButton();
      setEnabled(visible);
      if (!visible) setOpen(false); // bouton masqué : on ferme aussi la fenêtre
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AI_CHAT_BUTTON_KEY) return;
      const visible = readAiChatButton();
      setEnabled(visible);
      if (!visible) setOpen(false);
    };
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener(AI_CHAT_BUTTON_EVENT, onPref);
    window.addEventListener("storage", onStorage);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener(AI_CHAT_BUTTON_EVENT, onPref);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRefreshing(true);
    try {
      setDataset(await loadDataset());
    } finally {
      loadingRef.current = false;
      setRefreshing(false);
    }
  }, []);

  // Données chargées à la première ouverture seulement
  useEffect(() => {
    if (open && !dataset) refresh();
  }, [open, dataset, refresh]);

  // Échap ferme la fenêtre (et rend le focus au bouton)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onAiPage = pathname?.startsWith("/dashboard/ai");
  if (!mounted || !enabled || onAiPage) return null;

  // Sur mobile, le bouton se place au-dessus de la barre de navigation du bas
  const bottom = isMobile ? 88 : 24;
  const close = () => { setOpen(false); buttonRef.current?.focus(); };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={L.title}
          style={{
            position: "fixed",
            zIndex: 1500,
            ...(isMobile
              ? { inset: 0, padding: 8, paddingBottom: "max(8px, env(safe-area-inset-bottom))", background: "rgba(0,0,0,0.35)" }
              : { insetInlineEnd: 24, bottom: bottom + 72, width: "min(420px, calc(100vw - 48px))" }),
          }}
        >
          <AssistantChat
            dataset={dataset as any}
            language={language}
            theme={theme}
            isMobile={isMobile}
            compact
            formatCurrency={(n: number) => formatCurrency(n)}
            currency={{ code: currency || "tnd", symbol: getCurrencySymbol() }}
            userName={String(user?.name || "").split(" ")[0]}
            userKey={String(user?.id ?? user?.email ?? "default")}
            height={isMobile ? "calc(100dvh - 16px)" : "min(640px, calc(100vh - 140px))"}
            onNavigate={(path: string) => { router.push(path); if (isMobile) setOpen(false); }}
            onRefreshData={refresh}
            refreshing={refreshing}
            onClose={close}
          />
          {!isMobile && (
            <div style={{ textAlign: "end", marginTop: 6 }}>
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/dashboard/ai?tab=chat"); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, background: theme.surface, border: `1px solid ${theme.border}`,
                  borderRadius: 999, color: theme.textSecondary, fontSize: 11.5, cursor: "pointer", padding: "4px 10px",
                }}
              >
                <ExpandIcon /> {L.full}
              </button>
            </div>
          )}
        </div>
      )}

      {!(open && isMobile) && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ixa-fab"
          aria-label={open ? L.close : L.open}
          aria-expanded={open}
          title={open ? L.close : L.open}
          style={{
            position: "fixed",
            zIndex: 1501,
            insetInlineEnd: isMobile ? 16 : 24,
            bottom,
            width: isMobile ? 52 : 58,
            height: isMobile ? 52 : 58,
            borderRadius: "50%",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "#fff",
            // Couleurs du thème (clair : indigo → violet ; sombre : bleu → violet), ouvert comme fermé.
            background: theme.gradient || theme.primary,
            isolation: "isolate",
            boxShadow: "0 10px 28px rgba(79,70,229,0.35), 0 2px 6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform .18s ease, box-shadow .18s ease",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <style>{FAB_STYLE}</style>
          {!open && <span className="ixa-fab-halo" aria-hidden="true" style={{ background: theme.gradient || theme.primary }} />}
          {open ? <CloseIcon size={isMobile ? 22 : 24} /> : <RobotIcon size={isMobile ? 27 : 30} />}
          {!open && <span className="ixa-fab-badge" aria-hidden="true">{L.badge}</span>}
        </button>
      )}
    </>
  );
}
