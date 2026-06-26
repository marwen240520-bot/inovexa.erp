"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";

// SVG Icons with better styling
const DashboardIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);

const ShipmentsIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const ProfileIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SettingsIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="43" height="43" viewBox="0 0 43 43" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="21.5" cy="21.5" r="18" stroke="rgba(102,126,234,0.15)" strokeWidth="3"/>
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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
      'common.logout': { fr: 'Déconnexion', en: 'Logout', es: 'Cerrar sesión' },
      'common.logoutWarning': { fr: 'Êtes-vous sûr de vouloir vous déconnecter ?', en: 'Are you sure you want to logout?', es: '¿Estás seguro de que quieres cerrar sesión?' },
      'transporteur.dashboard.title': { fr: 'Tableau de bord', en: 'Dashboard', es: 'Panel de control' },
      'transporteur.shipments.title': { fr: 'Mes livraisons', en: 'My shipments', es: 'Mis entregas' },
      'transporteur.profile.title': { fr: 'Mon profil', en: 'My profile', es: 'Mi perfil' },
      'transporteur.settings.title': { fr: 'Paramètres', en: 'Settings', es: 'Configuración' },
      'transporteur.role.label': { fr: 'Transporteur', en: 'Transporter', es: 'Transportista' },
    };

    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
  };

  const menuItems = [
    { 
      path: "/transporteur/dashboard", 
      label: getTranslation("transporteur.dashboard.title"), 
      icon: DashboardIcon,
      color: "#667eea",
      bgColor: "rgba(102,126,234,0.15)"
    },
    { 
      path: "/transporteur/shipments", 
      label: getTranslation("transporteur.shipments.title"), 
      icon: ShipmentsIcon,
      color: "#10b981",
      bgColor: "rgba(16,185,129,0.15)"
    },
    { 
      path: "/transporteur/profile", 
      label: getTranslation("transporteur.profile.title"), 
      icon: ProfileIcon,
      color: "#f59e0b",
      bgColor: "rgba(245,158,11,0.15)"
    },
    { 
      path: "/transporteur/settings", 
      label: getTranslation("transporteur.settings.title"), 
      icon: SettingsIcon,
      color: "#94a3b8",
      bgColor: "rgba(148,163,184,0.15)"
    }
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const logout = () => {
    const logoutMsg = getTranslation("common.logoutWarning");
    if (confirm(logoutMsg)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
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
            {getTranslation("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(17,17,17,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(102,126,234,0.15)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 16px",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 100,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)"
        }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  transition: "all 0.2s",
                  flex: 1
                }}
              >
                <div style={{
                  color: isActive ? item.color : "#94a3b8",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.2s"
                }}>
                  {item.icon({ active: isActive })}
                </div>
                <span style={{
                  fontSize: "10px",
                  color: isActive ? item.color : "#94a3b8",
                  fontWeight: isActive ? "600" : "400"
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={logout}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "12px",
              flex: 1
            }}
          >
            <div style={{ color: "#ef4444" }}>
              <LogoutIcon />
            </div>
            <span style={{ fontSize: "10px", color: "#ef4444" }}>
              {getTranslation("common.logout")}
            </span>
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div style={{
          width: "260px",
          background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)",
          borderRight: "1px solid rgba(102,126,234,0.08)",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          zIndex: 50,
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Logo */}
          <div style={{
            padding: "28px 20px",
            borderBottom: "1px solid rgba(102,126,234,0.08)",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            {!logoError ? (
              <img 
                src="/images/logo.png" 
                alt="Logo"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  objectFit: "cover"
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
           
            <div>
              <span style={{ color: "white", fontSize: "16px", fontWeight: "bold" }}>Inovexa ERP</span>
              <p style={{ color: "#667eea", fontSize: "10px", margin: "2px 0 0" }}>
                {getTranslation("transporteur.role.label")}
              </p>
            </div>
          )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: "20px 16px" }}>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <div
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    padding: "12px 16px",
                    marginBottom: "8px",
                    borderRadius: "14px",
                    background: isActive ? item.bgColor : (hoveredItem === item.path ? "rgba(255,255,255,0.03)" : "transparent"),
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s",
                    border: isActive ? `1px solid ${item.color}20` : "1px solid transparent"
                  }}
                >
                  <span style={{ 
                    color: isActive ? item.color : "#94a3b8",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {item.icon({ active: isActive })}
                  </span>
                  <span style={{ 
                    fontSize: "14px", 
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? item.color : "#94a3b8"
                  }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </nav>

          {/* Logout button */}
          <div style={{
            padding: "20px 16px",
            borderTop: "1px solid rgba(102,126,234,0.08)"
          }}>
            <div
              onClick={logout}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              style={{
                padding: "12px 16px",
                borderRadius: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transition: "all 0.2s",
                color: "#f87171"
              }}
            >
              <LogoutIcon />
              <span style={{ fontSize: "14px" }}>{getTranslation("common.logout")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        marginLeft: !isMobile ? "260px" : 0,
        marginBottom: isMobile ? "70px" : 0,
        minHeight: "100vh",
        background: "#0a0a0a"
      }}>
        {children}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #764ba2;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
          }
          
          input, select, button {
            font-size: 16px !important; /* Prevent zoom on focus */
          }
          
          /* Improve touch targets */
          button, 
          [role="button"],
          .clickable {
            min-height: 44px;
            cursor: pointer;
          }
        }
      ` }} />
    </>
  );
}