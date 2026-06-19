"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  color: string;
}

export default function SidebarTransporteur() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar_transporteur_open");
    if (savedState !== null) {
      setSidebarOpen(savedState === "true");
    }

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && savedState === null) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebar_transporteur_open", newState.toString());
  };

  const menuItems: MenuItem[] = [
    { path: "/transporteur/dashboard", label: t("transporteur.dashboard.title") || "Tableau de bord", icon: "📊", color: "#667eea" },
    { path: "/transporteur/shipments", label: t("transporteur.shipments.title") || "Mes livraisons", icon: "📦", color: "#10b981" },
    { path: "/transporteur/profile", label: t("transporteur.profile.title") || "Mon profil", icon: "👤", color: "#94a3b8" },
    { path: "/transporteur/settings", label: t("transporteur.settings.title") || "Paramètres", icon: "⚙️", color: "#94a3b8" }
  ];

  const logout = () => {
    if (confirm(t("common.logoutWarning") || "Êtes-vous sûr de vouloir vous déconnecter ?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sidebar_transporteur_open");
      router.push("/");
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }
        .sidebar-item {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transition: left 0.5s ease;
          z-index: 0;
        }
        .sidebar-item:hover::before {
          left: 100%;
        }
        .sidebar-item:hover .item-icon {
          transform: scale(1.1) rotate(5deg);
        }
        .sidebar-item:hover .item-label {
          transform: translateX(5px);
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #10b981, #059669);
        }
      ` }} />

      <div style={{
        width: sidebarOpen ? "280px" : "80px",
        background: "linear-gradient(180deg, #0a0a0a 0%, #0f0f0f 100%)",
        borderRight: "1px solid rgba(102,126,234,0.15)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "fixed",
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 100,
        boxShadow: "4px 0 30px rgba(0,0,0,0.5)",
        left: 0,
        top: 0
      }}>
        {/* Logo et titre */}
        <div style={{ 
          padding: "20px 16px", 
          borderBottom: "1px solid rgba(102,126,234,0.15)", 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          background: "linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(0,0,0,0) 100%)"
        }}>
          <div 
            style={{ cursor: "pointer", position: "relative" }}
            onClick={() => router.push("/transporteur/dashboard")}
          >
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Inovexa ERP"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "12px", 
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(102,126,234,0.2)",
                  objectFit: "cover"
                }}
                onError={() => setLogoError(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05) rotate(5deg)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(102,126,234,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(102,126,234,0.2)";
                }}
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
                fontSize: "20px",
                fontWeight: "bold",
                color: "white",
                transition: "transform 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05) rotate(5deg)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1) rotate(0deg)"}>
                I
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <div style={{ animation: "slideIn 0.3s ease", flex: 1 }}>
              <span style={{ 
                background: "linear-gradient(135deg, #fff 0%, #667eea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontSize: "18px", 
                fontWeight: "bold",
                display: "block"
              }}>Inovexa ERP</span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar} 
            style={{ 
              marginLeft: "auto", 
              background: "rgba(102,126,234,0.1)", 
              border: "1px solid rgba(102,126,234,0.3)", 
              borderRadius: "10px", 
              color: "#94a3b8", 
              cursor: "pointer", 
              padding: "8px 12px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(102,126,234,0.2)";
              e.currentTarget.style.color = "#667eea";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(102,126,234,0.1)";
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "16px 12px", paddingBottom: "80px" }}>
          {menuItems.map((item, index) => {
            const isActive = pathname === item.path;
            const isHovered = hoveredItem === item.path;
            
            return (
              <div 
                key={item.path}
                onClick={() => router.push(item.path)}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className="sidebar-item"
                style={{ 
                  padding: "12px 14px", 
                  marginBottom: "6px", 
                  borderRadius: "12px", 
                  background: isActive 
                    ? `linear-gradient(135deg, ${item.color}20, ${item.color}08)` 
                    : isHovered 
                      ? "rgba(102,126,234,0.08)" 
                      : "transparent", 
                  color: isActive ? item.color : isHovered ? "#fff" : "#94a3b8", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "14px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderLeft: isActive ? `3px solid ${item.color}` : "3px solid transparent",
                  transform: isHovered ? "translateX(5px)" : "translateX(0)",
                  position: "relative",
                  animation: `slideIn 0.3s ease ${index * 0.05}s both`
                }}
              >
                <span 
                  className="item-icon"
                  style={{ 
                    fontSize: "22px",
                    transition: "transform 0.3s ease",
                    display: "inline-block"
                  }}
                >
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <div style={{ flex: 1 }}>
                    <div 
                      className="item-label"
                      style={{ 
                        fontSize: "14px", 
                        fontWeight: isActive ? "600" : "500",
                        letterSpacing: "0.3px",
                        transition: "transform 0.3s ease"
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                )}
                {isActive && sidebarOpen && (
                  <span style={{ 
                    width: "6px", 
                    height: "6px", 
                    background: item.color, 
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite"
                  }} />
                )}
              </div>
            );
          })}
          
          <div style={{ 
            height: "1px", 
            background: "linear-gradient(90deg, transparent, rgba(102,126,234,0.3), transparent)", 
            margin: "16px 0"
          }} />

          {/* Bouton Déconnexion */}
          <div 
            onClick={logout}
            className="sidebar-item"
            style={{ 
              padding: "12px 14px", 
              borderRadius: "12px", 
              background: "rgba(239,68,68,0.08)", 
              color: "#f87171", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "14px",
              transition: "all 0.3s ease",
              border: "1px solid rgba(239,68,68,0.15)",
              marginTop: "8px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
              e.currentTarget.style.transform = "translateX(5px)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)";
            }}
          >
            <span style={{ fontSize: "20px", transition: "transform 0.2s" }}>🚪</span>
            {sidebarOpen && (
              <span style={{ fontSize: "14px", fontWeight: "500" }}>{t("common.logout") || "Déconnexion"}</span>
            )}
          </div>
        </nav>
      </div>

      {/* Overlay pour mobile */}
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
    </>
  );
}