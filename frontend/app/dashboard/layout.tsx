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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isAuthPage =
    pathname?.includes("/auth/login") || pathname?.includes("/auth/register");

  if (isAuthPage) return <>{children}</>;

  // Rail de 280px en desktop ; 0 en mobile (la Sidebar affiche alors sa barre du bas).
  const sidebarWidth = mounted && !isMobile ? 280 : 0;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        background: "#0a0a0a",
      }}
    >
      {/* Sidebar rendue UNE SEULE FOIS ici. Le layout persiste entre les pages,
          donc elle ne se remonte plus a chaque navigation (fini le reload mobile).
          Le composant se positionne lui-meme : rail fixe en desktop, barre du bas en mobile. */}
      <Sidebar />

      {/* Contenu principal */}
      <div
        className="dashboard-content"
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

          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: #1a1a1a; }
          ::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #764ba2; }

          /* ════════════════════════════════════════════════════════════
             MODE COMPACT GLOBAL — s'applique a TOUTES les pages du
             dashboard sans toucher a chaque page. Les !important sont
             necessaires pour surcharger les styles inline des pages.
             ════════════════════════════════════════════════════════════ */

          /* ── Boutons : plus petits et plus denses ── */
          .dashboard-content button {
            font-size: 12.5px !important;
            line-height: 1.25 !important;
          }
          /* Boutons d'action DANS les tableaux : encore plus compacts */
          .dashboard-content table button {
            padding: 5px 10px !important;
            font-size: 11.5px !important;
            min-height: 30px !important;
            border-radius: 8px !important;
          }
          .dashboard-content table button svg {
            width: 13px !important;
            height: 13px !important;
          }

          /* ── Tableaux : plus denses et lisibles ── */
          .dashboard-content table {
            font-size: 12.5px !important;
            border-collapse: collapse;
          }
          .dashboard-content th {
            padding: 8px 10px !important;
            font-size: 11px !important;
            letter-spacing: 0.4px;
          }
          .dashboard-content td {
            padding: 8px 10px !important;
            font-size: 12.5px !important;
          }

          /* ════════════════════════════════════════════════════════════
             MOBILE (≤ 768px) — toutes les pages du dashboard
             ════════════════════════════════════════════════════════════ */
          @media (max-width: 768px) {

            /* Tableaux : defilement horizontal fluide au lieu de deborder
               ou d'ecraser les colonnes. */
            .dashboard-content table {
              display: block !important;
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch;
              max-width: 100% !important;
            }
            .dashboard-content th,
            .dashboard-content td {
              padding: 6px 8px !important;
              font-size: 11.5px !important;
              white-space: nowrap;
            }

            /* Boutons : compacts mais cible tactile suffisante */
            .dashboard-content button {
              font-size: 12px !important;
              min-height: 38px;
            }
            .dashboard-content table button {
              min-height: 30px !important;
            }

            /* Champs de saisie : 16px = pas de zoom automatique iOS */
            .dashboard-content input,
            .dashboard-content select,
            .dashboard-content textarea {
              font-size: 16px !important;
            }

            /* Titres plus compacts pour gagner de l'ecran */
            .dashboard-content h1 { font-size: 21px !important; }
            .dashboard-content h2 { font-size: 17px !important; }
            .dashboard-content h3 { font-size: 15px !important; }

            /* Pas de debordement horizontal de page */
            .dashboard-content { overflow-x: hidden; }

            /* Les images ne debordent jamais */
            .dashboard-content img { max-width: 100%; }
          }

          /* Tres petits ecrans (≤ 380px) : densite maximale */
          @media (max-width: 380px) {
            .dashboard-content th,
            .dashboard-content td {
              padding: 5px 6px !important;
              font-size: 11px !important;
            }
            .dashboard-content h1 { font-size: 19px !important; }
          }
        `,
      }} />
    </div>
  );
}
