"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import Spinner from "@/components/ui/Spinner";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { AppShellProvider } from "@/components/ui/PageSkeleton";
import A11yAutoLabels from "@/components/ui/A11yAutoLabels";
import { USER_KEY, clearSession, getStoredUser, getToken, type SessionUser } from "@/lib/session";
import { API_URL } from "@/lib/saas";

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

const StatsIcon = ({ active = false }: { active?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
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
    const token = getToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    // Seul un transporteur reste dans cet espace ; les autres rôles repartent vers l'ERP.
    const admit = (user: SessionUser) => {
      if (user.role !== "transporteur") {
        router.replace("/dashboard");
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    const stored = getStoredUser();
    if (stored) {
      admit(stored);
      return;
    }

    // Jeton présent mais profil local absent ou illisible (stockage vidé à moitié, ancien onglet…) : la page restait
    // indéfiniment sur le spinner. Le profil est reconstruit depuis le serveur ; s'il refuse le jeton ou ne répond
    // pas, la session est fermée et l'on revient à la connexion.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const me = await res.json();
        if (cancelled) return;
        if (!me?.id || !me?.role) throw new Error("Profil incomplet");
        // Mêmes champs que ceux posés à la connexion : rien d'autre de la réponse n'est gardé dans le navigateur.
        const user: SessionUser = {
          id: me.id, email: me.email, name: me.name, role: me.role, companyName: me.companyName ?? null, modules: me.modules ?? null,
          isTeamMember: !!me.isTeamMember, sector: me.sector ?? null, twoFactorEnabled: !!me.twoFactorEnabled, permissions: me.permissions,
        };
        try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* stockage indisponible */ }
        admit(user);
      } catch {
        if (cancelled) return;
        clearSession();
        router.replace("/auth/login");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
      'common.logout': { fr: 'Déconnexion', en: 'Logout', es: 'Cerrar sesión' },
      'common.logoutWarning': { fr: 'Êtes-vous sûr de vouloir vous déconnecter ?', en: 'Are you sure you want to logout?', es: '¿Estás seguro de que quieres cerrar sesión?' },
      'transporteur.dashboard.title': { fr: 'Tableau de bord', en: 'Dashboard', es: 'Panel de control' },
      'transporteur.shipments.title': { fr: 'Expéditions', en: 'Shipments', es: 'Envíos' },
      'transporteur.profile.title': { fr: 'Profil', en: 'Profile', es: 'Perfil' },
      'transporteur.stats.title': { fr: 'Statistiques', en: 'Statistics', es: 'Estadísticas' },
      'transporteur.settings.title': { fr: 'Paramètres', en: 'Settings', es: 'Configuración' },
      'transporteur.role.label': { fr: 'Transporteur', en: 'Transporter', es: 'Transportista' },
      'transporteur.section.main': { fr: 'Transporteur', en: 'Carrier', es: 'Transportista' },
      'transporteur.section.account': { fr: 'Compte', en: 'Account', es: 'Cuenta' },
    };

    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
  };

  // Menu en deux sections : TRANSPORTEUR (tableau de bord, expéditions) et COMPTE (profil, statistiques, paramètres, déconnexion).
  // Chaque entrée est un vrai lien vers sa page.
  type CarrierItem = { path: string; label: string; icon: (p: { active?: boolean }) => React.ReactElement; color: string; bgColor: string };
  const mainItems: CarrierItem[] = [
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
  ];
  const accountItems: CarrierItem[] = [
    {
      path: "/transporteur/profile",
      label: getTranslation("transporteur.profile.title"),
      icon: ProfileIcon,
      color: "#f59e0b",
      bgColor: "rgba(245,158,11,0.15)"
    },
    {
      path: "/transporteur/profile/stats",
      label: getTranslation("transporteur.stats.title"),
      icon: StatsIcon,
      color: "#3b82f6",
      bgColor: "rgba(59,130,246,0.15)"
    },
    {
      path: "/transporteur/settings",
      label: getTranslation("transporteur.settings.title"),
      icon: SettingsIcon,
      color: "var(--theme-nav-text)",
      bgColor: "rgba(148,163,184,0.15)"
    },
  ];
  const menuItems = [...mainItems, ...accountItems];
  const sections = [
    { id: "main", label: getTranslation("transporteur.section.main"), items: mainItems },
    { id: "account", label: getTranslation("transporteur.section.account"), items: accountItems },
  ];

  const pathMatches = (path: string) => pathname === path || (!!pathname && pathname.startsWith(path + "/"));
  // Le lien le plus précis gagne : /transporteur/profile/stats n'allume pas aussi « Profil ».
  const isItemActive = (path: string) =>
    pathMatches(path) && !menuItems.some((m) => m.path.length > path.length && pathMatches(m.path));

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const logout = () => {
    const logoutMsg = getTranslation("common.logoutWarning");
    if (confirm(logoutMsg)) {
      // Session complète (jeton, profil, caches de la barre latérale et de l'API) ; langue et thème sont conservés.
      clearSession();
      router.push("/");
    }
  };

  if (isLoading || !isAuthenticated) {
    return <Spinner fullScreen />;
  }

  return (
    <>
      {/* Titre de l'onglet propre à chaque écran ; noms accessibles des champs et boutons. */}
      <A11yAutoLabels />
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav aria-label={getTranslation("transporteur.role.label")} style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--theme-border)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 6px",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 100,
          boxShadow: "0 -4px 20px rgba(17,24,39,0.08)"
        }}>
          {menuItems.map((item) => {
            const isActive = isItemActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "none",
                  padding: "8px 2px",
                  borderRadius: "12px",
                  transition: "all 0.2s",
                  flex: 1,
                  minWidth: 0
                }}
              >
                <div style={{
                  color: isActive ? item.color : "var(--theme-nav-text)",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.2s"
                }}>
                  {item.icon({ active: isActive })}
                </div>
                <span style={{
                  fontSize: "10px",
                  lineHeight: 1.15,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                  color: isActive ? item.color : "var(--theme-nav-text)",
                  fontWeight: isActive ? "600" : "400"
                }}>
                  {item.label}
                </span>
              </Link>
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
              padding: "8px 2px",
              borderRadius: "12px",
              flex: 1,
              minWidth: 0
            }}
          >
            <div style={{ color: "#ef4444" }}>
              <LogoutIcon />
            </div>
            <span style={{ fontSize: "10px", lineHeight: 1.15, textAlign: "center", overflowWrap: "anywhere", color: "#ef4444" }}>
              {getTranslation("common.logout")}
            </span>
          </button>
        </nav>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div style={{
          width: "260px",
          background: "var(--theme-surface)",
          borderInlineEnd: "1px solid var(--theme-border)",
          position: "fixed",
          height: "100vh",
          insetInlineStart: 0,
          top: 0,
          zIndex: 50,
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Logo - Version améliorée */}
          <div style={{
            padding: "28px 20px",
            borderBottom: "1px solid rgba(102,126,234,0.08)",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            {!logoError ? (
              <img 
                src="/images/logo.png" 
                alt="Inovexa Logo"
                style={{
                  width: "88px",
                  height: "88px",
                  objectFit: "contain"
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold",
                color: "white"
              }}>
                I
              </div>
            )}
            <div>
              <div style={{ 
                color: "var(--theme-text)", 
                fontSize: "18px", 
                fontWeight: "800", 
                letterSpacing: "1px"
              }}>
                Inovexa-ERP
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px",
                marginTop: "2px"
              }}>
                <span style={{ 
                  color: "#667eea", 
                  fontSize: "10px", 
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  background: "rgba(102,126,234,0.12)",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(102,126,234,0.15)"
                }}>
                  {getTranslation("transporteur.role.label")}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation : deux sections, chaque entrée est un lien */}
          <nav aria-label={getTranslation("transporteur.role.label")} style={{ flex: 1, padding: "8px 16px 20px", overflowY: "auto" }}>
            {sections.map((section) => (
              <div key={section.id} role="group" aria-labelledby={`carrier-nav-${section.id}`}>
                <div
                  id={`carrier-nav-${section.id}`}
                  style={{
                    padding: "16px 16px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--theme-text-secondary)"
                  }}
                >
                  {section.label}
                </div>
                {section.items.map((item) => {
                  const isActive = isItemActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      aria-current={isActive ? "page" : undefined}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        padding: "12px 16px",
                        marginBottom: "6px",
                        borderRadius: "14px",
                        background: isActive ? item.bgColor : (hoveredItem === item.path ? "var(--theme-surface-hover)" : "transparent"),
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        border: isActive ? `1px solid ${item.color}20` : "1px solid transparent"
                      }}
                    >
                      <span style={{
                        color: isActive ? item.color : "var(--theme-nav-text)",
                        display: "flex",
                        alignItems: "center"
                      }}>
                        {item.icon({ active: isActive })}
                      </span>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: isActive ? "600" : "400",
                        color: isActive ? item.color : "var(--theme-nav-text)"
                      }}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
                {section.id === "account" && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={logout}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); logout(); } }}
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
                )}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Bouton de thème (clair / sombre) */}
      <div style={{ position: "fixed", top: "12px", insetInlineEnd: "14px", zIndex: 900 }}>
        <ThemeToggle size={38} />
      </div>

      {/* Main Content */}
      <div style={{
        marginInlineStart: !isMobile ? "260px" : 0,
        marginBottom: isMobile ? "70px" : 0,
        minHeight: "100vh",
        background: "var(--theme-background)"
      }}>
        {/* Chargements de page : squelette du contenu, la barre latérale reste visible */}
        <AppShellProvider>{children}</AppShellProvider>
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
          background: var(--theme-surface-hover);
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