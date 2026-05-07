"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

// SVG Icons
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);

const ShipmentsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="43" height="43" viewBox="0 0 43 43" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="21.5" cy="21.5" r="18" stroke="#1a1a1a" strokeWidth="3"/>
    <path d="M21.5 3.5a18 18 0 0118 18" stroke="#667eea" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export default function TransporteurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [language]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        const savedState = localStorage.getItem("sidebar_transporteur_open");
        if (savedState === null) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(savedState === "true");
        }
      } else {
        const savedState = localStorage.getItem("sidebar_transporteur_open");
        if (savedState !== null) {
          setSidebarOpen(savedState === "true");
        }
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== "transporteur") {
          router.replace("/dashboard");
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        router.replace("/auth/login");
        return;
      }
    }
    setIsLoading(false);
  }, [router]);

  const getTranslatedLabel = (key: string, fallback: string) => {
    try {
      const translated = t(key);
      if (translated === key) return fallback;
      return translated;
    } catch (e) {
      return fallback;
    }
  };

  const menuItems = [
    { 
      path: "/transporteur/dashboard", 
      label: getTranslatedLabel("transporteur.dashboard.title", "Tableau de bord"), 
      icon: <DashboardIcon />, 
      color: "#667eea" 
    },
    { 
      path: "/transporteur/shipments", 
      label: getTranslatedLabel("transporteur.shipments.title", "Mes livraisons"), 
      icon: <ShipmentsIcon />, 
      color: "#10b981" 
    },
    { 
      path: "/transporteur/profile", 
      label: getTranslatedLabel("transporteur.profile.title", "Mon profil"), 
      icon: <ProfileIcon />, 
      color: "#94a3b8" 
    },
    { 
      path: "/transporteur/settings", 
      label: getTranslatedLabel("transporteur.settings.title", "Paramètres"), 
      icon: <SettingsIcon />, 
      color: "#94a3b8" 
    }
  ];

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebar_transporteur_open", newState.toString());
  };

  const logout = () => {
    const logoutMsg = getTranslatedLabel("common.logoutWarning", "Êtes-vous sûr de vouloir vous déconnecter ?");
    if (confirm(logoutMsg)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sidebar_transporteur_open");
      router.push("/");
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#0a0a0a"
      }}>
        <div style={{ textAlign: "center" }}>
          <SpinnerIcon />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#94a3b8", marginTop: "14px", fontSize: "13px" }}>
            {getTranslatedLabel("common.loading", "Chargement...")}
          </p>
        </div>
      </div>
    );
  }

  const sidebarWidthOpen = 280;
  const sidebarWidthClosed = 72;

  return (
    <div key={key} style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? sidebarWidthOpen : sidebarWidthClosed,
        background: "linear-gradient(180deg, #0a0a0a 0%, #0f0f0f 100%)",
        borderRight: "1px solid rgba(102,126,234,0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "fixed",
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 100,
        left: 0,
        top: 0
      }}>
        {/* Logo et bouton toggle */}
        <div style={{ 
          padding: "20px 16px", 
          borderBottom: "1px solid rgba(102,126,234,0.1)", 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          justifyContent: sidebarOpen ? "space-between" : "center",
          flexDirection: sidebarOpen ? "row" : "column",
          textAlign: "center"
        }}>
          <div 
            style={{ 
              cursor: "pointer", 
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              width: sidebarOpen ? "auto" : "100%"
            }} 
            onClick={() => router.push("/transporteur/dashboard")}
          >
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Logo"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  objectFit: "cover",
                  display: "block"
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "white",
                margin: "0 auto"
              }}>
                I
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <div style={{ flex: 1 }}>
              <span style={{ color: "white", fontSize: "16px", fontWeight: "bold" }}>Inovexa ERP</span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar} 
            style={{ 
              background: "rgba(102,126,234,0.15)", 
              border: "none", 
              borderRadius: "8px", 
              color: "#94a3b8", 
              cursor: "pointer", 
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              flexShrink: 0,
              marginTop: sidebarOpen ? "0" : "12px"
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.background = "rgba(102,126,234,0.3)"; 
              e.currentTarget.style.color = "#667eea"; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.background = "rgba(102,126,234,0.15)"; 
              e.currentTarget.style.color = "#94a3b8"; 
            }}
            title={sidebarOpen ? "Réduire" : "Agrandir"}
          >
            {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "16px 12px" }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <div 
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{ 
                  padding: "12px", 
                  marginBottom: "6px", 
                  borderRadius: "10px", 
                  background: isActive ? `${item.color}20` : "transparent",
                  color: isActive ? item.color : "#94a3b8",
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  gap: sidebarOpen ? "14px" : "0",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { 
                  if (!isActive) e.currentTarget.style.background = "rgba(102,126,234,0.08)"; 
                }}
                onMouseLeave={(e) => { 
                  if (!isActive) e.currentTarget.style.background = "transparent"; 
                }}
              >
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{item.icon}</span>
                {sidebarOpen && <span style={{ fontSize: "13px" }}>{item.label}</span>}
              </div>
            );
          })}
          
          <div style={{ 
            height: "1px", 
            background: "rgba(102,126,234,0.1)", 
            margin: "16px 0 12px 0" 
          }} />
          
          {/* Bouton Déconnexion */}
          <div 
            onClick={logout}
            style={{ 
              padding: "12px", 
              borderRadius: "10px", 
              background: "rgba(239,68,68,0.1)", 
              color: "#f87171", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: sidebarOpen ? "14px" : "0",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.background = "rgba(239,68,68,0.2)"; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.background = "rgba(239,68,68,0.1)"; 
            }}
          >
            <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><LogoutIcon /></span>
            {sidebarOpen && <span style={{ fontSize: "13px" }}>{getTranslatedLabel("common.logout", "Déconnexion")}</span>}
          </div>
        </nav>
      </div>

      {/* Contenu principal */}
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarOpen ? `${sidebarWidthOpen}px` : `${sidebarWidthClosed}px`,
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%",
        minHeight: "100vh",
        background: "#0a0a0a"
      }}>
        {children}
      </div>

      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(0,0,0,0.6)", 
            backdropFilter: "blur(4px)", 
            zIndex: 99,
            animation: "fadeIn 0.3s ease" 
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
}