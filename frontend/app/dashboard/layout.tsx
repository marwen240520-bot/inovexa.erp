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

  const isAuthPage =
    pathname?.includes("/auth/login") || pathname?.includes("/auth/register");

  if (isAuthPage) return <>{children}</>;
  if (!mounted) return null;

  const sidebarWidth = !isMobile && sidebarOpen ? 280 : 0;

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
      {!isMobile && (
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

      {/* ── Sidebar mobile overlay ── */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 998,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: 280,
              height: "100vh",
              zIndex: 999,
            }}
          >
            <Sidebar />
          </div>
        </>
      )}

      {/* ── Contenu principal ── */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: "margin-left 0.3s ease, width 0.3s ease",
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