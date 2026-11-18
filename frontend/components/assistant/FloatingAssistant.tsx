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

const LABELS: Record<string, { open: string; close: string; title: string; full: string }> = {
  fr: { open: "Ouvrir le Chat IA", close: "Fermer le Chat IA", title: "Chat IA", full: "Ouvrir en plein écran" },
  en: { open: "Open AI chat", close: "Close AI chat", title: "AI chat", full: "Open full screen" },
  es: { open: "Abrir el chat IA", close: "Cerrar el chat IA", title: "Chat IA", full: "Abrir en pantalla completa" },
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

// Icône du bouton : bulle de discussion avec un petit robot (assistant IA)
const ChatBotIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
    <rect x="8" y="7.5" width="8" height="5.5" rx="1.6" />
    <line x1="12" y1="5.6" x2="12" y2="7.5" />
    <circle cx="10.4" cy="10.2" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="13.6" cy="10.2" r="0.6" fill="currentColor" stroke="none" />
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
            cursor: "pointer",
            color: "#fff",
            background: theme.gradient || theme.primary,
            boxShadow: "0 10px 28px rgba(79,70,229,0.38), 0 2px 6px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform .18s ease, box-shadow .18s ease",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {open ? <CloseIcon size={isMobile ? 22 : 24} /> : <ChatBotIcon size={isMobile ? 25 : 28} />}
        </button>
      )}
    </>
  );
}
