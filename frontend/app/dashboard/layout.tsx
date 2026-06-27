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

  // Fermeture de la sidebar mobile via la touche Échap (accessibilité clavier)
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        <nav
          aria-label="Navigation principale"
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
        </nav>
      )}

      {/* ── Bouton menu mobile (ouvre la sidebar) ── */}
      {mounted && isMobile && !sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={false}
          aria-controls="dashboard-sidebar"
          style={{
            position: "fixed",
            top: 14,
            left: 14,
            zIndex: 997,
            width: 46,
            height: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
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
              zIndex: 998,
            }}
          />
          <nav
            id="dashboard-sidebar"
            aria-label="Navigation principale"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 280,
              height: "100vh",
              zIndex: 999,
            }}
          >
            {/* Bouton de fermeture explicite (accessible) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu de navigation"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 1000,
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <Sidebar />
          </nav>
        </>
      )}

      {/* ── Contenu principal ── */}
      <main
        id="main-content"
        role="main"
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
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          * { box-sizing: border-box; }

          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: #1a1a1a; }
          ::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #764ba2; }
        `,
        }}
      />
    </div>
  );
}
