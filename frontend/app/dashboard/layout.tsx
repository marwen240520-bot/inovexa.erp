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
        `,
      }} />
    </div>
  );
}
