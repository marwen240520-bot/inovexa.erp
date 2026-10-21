"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { useDeviceHint } from "@/contexts/DeviceContext";
import { AppShellProvider } from "@/components/ui/PageSkeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Valeur initiale fournie par le serveur (User-Agent) : le contenu est placé au bon endroit
  // dès le HTML, il ne glisse plus de 280 px vers la droite après le chargement.
  const isMobileHint = useDeviceHint();
  const [isMobile, setIsMobile] = useState(isMobileHint);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    // Les transitions ne s'activent qu'après la première mesure (pas d'animation au chargement)
    const id = window.requestAnimationFrame(() => setMounted(true));
    window.addEventListener("resize", checkMobile);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const isAuthPage =
    pathname?.includes("/auth/login") || pathname?.includes("/auth/register");

  if (isAuthPage) return <>{children}</>;

  // Rail de 280px en desktop ; 0 en mobile (la Sidebar affiche alors sa barre du bas).
  const sidebarWidth = isMobile ? 0 : 280;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        background: "var(--theme-background)",
      }}
    >
      {/* Sidebar rendue UNE SEULE FOIS ici. Le layout persiste entre les pages,
          donc elle ne se remonte plus a chaque navigation (fini le reload mobile).
          Le composant se positionne lui-meme : rail fixe en desktop, barre du bas en mobile. */}
      <Sidebar />

      {/* Contenu principal */}
      <main
        id="contenu"
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: mounted ? "margin-left 0.3s ease, width 0.3s ease" : "none",
          minHeight: "100vh",
          position: "relative",
          minWidth: 0,
        }}
      >
        <AppShellProvider>{children}</AppShellProvider>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
          * { box-sizing: border-box; }

          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: var(--theme-surface-hover); }
          ::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #764ba2; }
        `,
      }} />
    </div>
  );
}
