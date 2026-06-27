"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Ferme le menu mobile à chaque navigation (évite l'overlay bloqué)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  // Bloque le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMobile && sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, sidebarOpen]);

  const isAuthPage =
    pathname?.includes("/auth/login") || pathname?.includes("/auth/register");

  if (isAuthPage) return <>{children}</>;

  // Avant le mount: on suppose desktop avec sidebar (évite le flash)
  const sidebarWidth = mounted && !isMobile && sidebarOpen ? 280 : 0;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        background: "#0a0a0a",
      }}
    >
      {/* ── Sidebar desktop fixe ── */}
      {mounted && !isMobile && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: sidebarWidth,
            height: "100vh",
            zIndex: 100,
            overflow: "hidden",
            transition: "width 0.3s ease",
          }}
        >
          <Sidebar />
        </div>
      )}

      {/* ── Bouton menu mobile (ouverture) ── */}
      {mounted && isMobile && !sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu"
          className="mobile-menu-trigger"
          style={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + 12px)",
            left: "12px",
            zIndex: 996,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            border: "1px solid rgba(102,126,234,0.35)",
            background: "rgba(20,20,24,0.82)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* ── Sidebar mobile overlay ── */}
      {mounted && isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 998,
              animation: "shellFade 0.2s ease",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 280,
              maxWidth: "85vw",
              height: "100vh",
              zIndex: 999,
              animation: "shellSlideIn 0.28s cubic-bezier(0.22,1,0.36,1)",
              boxShadow: "8px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            <Sidebar />
            {/* Bouton fermeture du menu mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
              style={{
                position: "absolute",
                top: "calc(env(safe-area-inset-top, 0px) + 10px)",
                right: 10,
                zIndex: 2,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* ── Contenu principal ── */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: mounted ? "margin-left 0.3s ease, width 0.3s ease" : "none",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        {children}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          * { box-sizing: border-box; }

          html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
          body {
            margin: 0;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }

          /* Accessibilité clavier : focus visible et net */
          :focus-visible {
            outline: 2px solid #667eea;
            outline-offset: 2px;
            border-radius: 6px;
          }
          :focus:not(:focus-visible) { outline: none; }

          /* Boutons / champs : héritage de police + curseurs cohérents */
          button, input, select, textarea { font-family: inherit; }
          button { cursor: pointer; }
          button:disabled { cursor: not-allowed; }
          a { -webkit-tap-highlight-color: transparent; }

          ::selection { background: rgba(102,126,234,0.35); color: #fff; }

          /* Scrollbars raffinées */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #667eea, #764ba2);
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          ::-webkit-scrollbar-thumb:hover { background: #764ba2; }
          * { scrollbar-width: thin; scrollbar-color: #667eea transparent; }

          @keyframes shellFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes shellSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

          .mobile-menu-trigger:active { transform: scale(0.94); }

          /* Respect des préférences de mouvement réduit */
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.001ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.001ms !important;
              scroll-behavior: auto !important;
            }
          }
        `,
      }} />
    </div>
  );
}
