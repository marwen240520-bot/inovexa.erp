"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, CSSProperties } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

// ─── SVG Icon Library ─────────────────────────────────────────────────────────
const Icon = ({ d, children }: { d?: string; children?: React.ReactNode }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const ICONS: Record<string, JSX.Element> = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </Icon>
  ),
  products: (
    <Icon>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </Icon>
  ),
  categories: (
    <Icon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="12" y2="13"/>
    </Icon>
  ),
  stock: (
    <Icon>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </Icon>
  ),
  sales: (
    <Icon>
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </Icon>
  ),
  purchases: (
    <Icon>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </Icon>
  ),
  orders: (
    <Icon>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </Icon>
  ),
  clients: (
    <Icon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </Icon>
  ),
  suppliers: (
    <Icon>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </Icon>
  ),
  invoices: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </Icon>
  ),
  hr: (
    <Icon>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </Icon>
  ),
  finance: (
    <Icon>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </Icon>
  ),
  logistics: (
    <Icon>
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </Icon>
  ),
  production: (
    <Icon>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M2 12h2M20 12h2M17.66 17.66l1.41 1.41M5.34 6.34L3.93 4.93"/>
      <path d="M12 2v2M12 20v2"/>
    </Icon>
  ),
  ai: (
    <Icon>
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/>
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="12" y2="17"/>
    </Icon>
  ),
  analytics: (
    <Icon>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </Icon>
  ),
  profile: (
    <Icon>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </Icon>
  ),
  adminClients: (
    <Icon>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </Icon>
  ),
  adminModules: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M17.5 14v7M14 17.5h7"/>
    </Icon>
  ),
  shipments: (
    <Icon>
      <rect x="9" y="11" width="14" height="10" rx="1"/>
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </Icon>
  ),
  menu: (
    <Icon d="M3 12h18M3 6h18M3 18h18"/>
  ),
  close: (
    <Icon d="M18 6L6 18M6 6l12 12"/>
  ),
  logout: (
    <Icon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </Icon>
  ),
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  phone?: string;
}

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  textSecondary: string;
  border: string;
  gradient: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, themeId } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [userModules, setUserModules] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [localTheme, setLocalTheme] = useState<ThemeColors | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setLocalTheme(theme); }, [theme, themeId]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (mobileMoreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMoreOpen]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userData) {
      try {
        const u = JSON.parse(userData);
        setUser(u);
        if (u.id && token) fetchUserModules(u.id, token);
        else setLoading(false);
      } catch { setLoading(false); }
    } else { setLoading(false); }
  }, []);

  const fetchUserModules = async (userId: string, token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUserModules(await res.json());
    } catch {}
    setLoading(false);
  };

  const isModuleActive = (id: string) => !userModules || userModules[id] !== false;

  const handleNavigation = async (path: string, label: string) => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    try {
      await router.push(path);
      if (isMobile) {
        setSidebarOpen(false);
        setMobileMoreOpen(false);
      }
      setTimeout(() => setNavigationError(null), 3000);
    } catch (e: any) {
      setNavigationError(`Erreur navigation: ${e.message}`);
    }
  };

  const logout = () => {
    if (confirm(t("common.logoutWarning") || "Confirmer la déconnexion ?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
    }
  };

  const getLabel = (key: string) => {
    try {
      const v = t(key);
      return v === key ? key.split(".").pop() ?? key : v;
    } catch {
      return key.split(".").pop() ?? key;
    }
  };

  const role = user?.role;

  const allModules = [
    { id: "dashboard",  path: "/dashboard",            label: "common.dashboard",  iconKey: "dashboard" },
    { id: "products",   path: "/dashboard/products",   label: "common.products",   iconKey: "products" },
    { id: "categories", path: "/dashboard/categories", label: "common.categories", iconKey: "categories" },
    { id: "stock",      path: "/dashboard/stock",      label: "common.stock",      iconKey: "stock" },
    { id: "sales",      path: "/dashboard/sales",      label: "common.sales",      iconKey: "sales" },
    { id: "purchases",  path: "/dashboard/purchases",  label: "common.purchases",  iconKey: "purchases" },
    { id: "orders",     path: "/dashboard/orders",     label: "common.orders",     iconKey: "orders" },
    { id: "clients",    path: "/dashboard/clients",    label: "common.clients",    iconKey: "clients" },
    { id: "suppliers",  path: "/dashboard/suppliers",  label: "common.suppliers",  iconKey: "suppliers" },
    { id: "invoices",   path: "/dashboard/invoices",   label: "common.invoices",   iconKey: "invoices" },
    { id: "hr",         path: "/dashboard/hr",         label: "common.hr",         iconKey: "hr" },
    { id: "finance",    path: "/dashboard/finance",    label: "common.finance",    iconKey: "finance" },
    { id: "logistics",  path: "/dashboard/logistics",  label: "common.logistics",  iconKey: "logistics" }, 
    { id: "ai",         path: "/dashboard/ai",         label: "common.ai",         iconKey: "ai" },
    { id: "reports",    path: "/dashboard/reports",    label: "common.reports",    iconKey: "reports" },
    { id: "analytics",  path: "/dashboard/analytics",  label: "common.analytics",  iconKey: "analytics" },
    { id: "profile",    path: "/dashboard/profile",    label: "common.profile",    iconKey: "profile" },
    { id: "settings",   path: "/dashboard/settings",   label: "common.settings",   iconKey: "settings" },
  ];

  const clientMenuItems = allModules.filter(m => isModuleActive(m.id));

  const adminMenuItems = [
    { id: "adminClients", path: "/admin/clients",      label: "admin.clients",    iconKey: "adminClients" },
    { id: "adminModules", path: "/admin/modules",      label: "admin.modules",    iconKey: "adminModules" },
    { id: "profile",      path: "/dashboard/profile",  label: "common.profile",   iconKey: "profile" },
    { id: "settings",     path: "/dashboard/settings", label: "common.settings",  iconKey: "settings" },
  ];

  const transporteurMenuItems = [
    { id: "shipments", path: "/transporteur/shipments", label: "logistics.shipments", iconKey: "shipments" },
    { id: "profile",   path: "/dashboard/profile",      label: "common.profile",      iconKey: "profile" },
    { id: "settings",  path: "/dashboard/settings",     label: "common.settings",     iconKey: "settings" },
  ];

  let menuItems = clientMenuItems;
  if (role === "admin") menuItems = adminMenuItems;
  if (role === "transporteur") menuItems = transporteurMenuItems;

  // Styles avec typage correct
  const defaultStyles: ThemeColors = {
    background: "#0a0a0a",
    surface: "#111111",
    primary: "#667eea",
    textSecondary: "#94a3b8",
    border: "#222222",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  };

  const ct = localTheme || defaultStyles;

  // ✅ Correction: Typage explicite des styles avec CSSProperties
  const styles: Record<string, CSSProperties> = {
    mobileBottomNav: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(17,17,17,0.97)",
      backdropFilter: "blur(20px)",
      borderTop: `1px solid ${ct.primary}26`,
      borderRadius: "24px 24px 0 0",
      padding: "0px 8px",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 1000,
      boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
    },
    mobileNavBtn: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "3px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: "12px",
      flex: 1,
      transition: "all 0.2s ease",
    },
    mobileNavLabel: {
      fontSize: "10px",
      fontWeight: 400,
      letterSpacing: "0.01em",
      lineHeight: 1,
    },
    mobileMoreOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)",
      zIndex: 1001,
    },
    mobileMoreDrawer: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: `linear-gradient(180deg, ${ct.surface} 0%, ${ct.background} 100%)`,
      borderTop: `1px solid ${ct.primary}26`,
      borderRadius: "24px 24px 0 0",
      padding: "20px 16px 20px", // ✅ Changé de 90px à 20px pour enlever l'espace vide
      zIndex: 1002,
      maxHeight: "75vh",
      overflowY: "auto",
    },
    mobileMoreHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px",
      paddingBottom: "12px",
      borderBottom: `1px solid ${ct.primary}14`,
    },
    mobileMoreTitle: {
      fontSize: "13px",
      fontWeight: 600,
      color: ct.textSecondary,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 998,
    },
    sidebar: {
      width: "280px",
      background: `linear-gradient(180deg, ${ct.background} 0%, ${ct.surface} 100%)`,
      borderRight: `1px solid ${ct.primary}18`,
      position: "fixed",
      height: "100vh",
      overflowY: "auto",
      overflowX: "hidden",
      zIndex: 1000,
      top: 0,
      left: 0,
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      transform: "translateX(-100%)",
      boxShadow: "2px 0 20px rgba(0,0,0,0.1)",
    },
    sidebarOpen: { transform: "translateX(0)" },
    sidebarDesktop: {
      transform: "translateX(0)",
      position: "fixed",
    },
    header: {
      padding: "20px 16px 18px",
      borderBottom: `1px solid ${ct.primary}14`,
      background: `linear-gradient(135deg, ${ct.primary}0d 0%, transparent 100%)`,
      flexShrink: 0,
    },
    logoWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      cursor: "pointer",
    },
    logoImage: {
      width: "60px",
      height: "60px",
      borderRadius: "10px",
      display: "block",
      flexShrink: 0,
    },
    brandContainer: { flex: 1, minWidth: 0 },
    logoTitle: {
      fontWeight: 700,
      fontSize: "17px",
      letterSpacing: "-0.02em",
      
    },
    logoRole: {
      fontSize: "10px",
      fontWeight: 500,
      letterSpacing: "0.04em",
      opacity: 0.72,
      marginTop: "1px",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },
    nav: { padding: "12px 10px", flex: 1 },
    navItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 12px 9px 14px",
      marginBottom: "2px",
      cursor: "pointer",
      borderRadius: "10px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
    },
    navLabel: {
      fontSize: "13.2px",
      fontWeight: 400,
      letterSpacing: "-0.01em",
      lineHeight: 1,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    activeIndicator: {
      position: "absolute",
      left: 0,
      top: "20%",
      height: "60%",
      width: "3px",
      borderRadius: "0 3px 3px 0",
    },
    divider: {
      height: "1px",
      margin: "10px 0",
      opacity: 0.5,
      background: `linear-gradient(90deg, transparent, ${ct.primary}30, transparent)`,
    },
    logoutBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 12px 9px 14px",
      background: "rgba(239,68,68,0.08)",
      color: "#f87171",
      border: "1px solid rgba(239,68,68,0.14)",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "13.2px",
      fontWeight: 400,
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    loadingContainer: {
      width: "280px",
      background: ct.background,
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: {
      width: "28px",
      height: "28px",
      border: `2px solid ${ct.border}`,
      borderTopColor: ct.primary,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
    errorToast: {
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(239,68,68,0.96)",
      color: "white",
      padding: "10px 20px",
      borderRadius: "10px",
      zIndex: 2000,
      fontSize: "13px",
      boxShadow: "0 8px 32px rgba(239,68,68,0.25)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.15)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
  };

  const handleMouseEnter = (itemId: string) => setHoveredItem(itemId);
  const handleMouseLeave = () => setHoveredItem(null);

  // For mobile bottom nav: show first 3-4 items prominently, rest in "More" drawer
  const MOBILE_PRIMARY_COUNT = 4;
  const mobilePrimaryItems = menuItems.slice(0, MOBILE_PRIMARY_COUNT);
  const mobileMoreItems = menuItems.slice(MOBILE_PRIMARY_COUNT);

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.path;
    const isHovered = hoveredItem === item.path;
    const label = getLabel(item.label);
    const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];

    const getNavItemStyle = (): CSSProperties => {
      if (isActive) {
        return {
          ...styles.navItem,
          background: `linear-gradient(135deg, ${ct.primary}1a 0%, ${ct.primary}0d 100%)`,
          color: ct.primary,
        };
      } else if (isHovered) {
        return {
          ...styles.navItem,
          background: `${ct.primary}0f`,
          color: ct.primary,
          transform: "translateX(4px)",
        };
      }
      return {
        ...styles.navItem,
        background: "transparent",
        color: ct.textSecondary,
      };
    };

    return (
      <div
        key={item.path}
        onClick={() => handleNavigation(item.path, label)}
        onMouseEnter={() => handleMouseEnter(item.path)}
        onMouseLeave={handleMouseLeave}
        style={getNavItemStyle()}
      >
        {isActive && <div style={{ ...styles.activeIndicator, background: ct.primary }} />}
        <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
        <span style={styles.navLabel}>{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <>
      {navigationError && (
        <div onClick={() => setNavigationError(null)} style={styles.errorToast}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {navigationError}
          <span style={{ opacity: 0.6, marginLeft: "4px" }}>✕</span>
        </div>
      )}

      {/* ── MOBILE: bottom tab bar ───────────────────────────── */}
      {mounted && isMobile && (
        <>
          {/* More drawer overlay */}
          {mobileMoreOpen && (
            <>
              <div style={styles.mobileMoreOverlay} onClick={() => setMobileMoreOpen(false)} />
              <div style={styles.mobileMoreDrawer}>
                <div style={styles.mobileMoreHeader}>
                  <span style={styles.mobileMoreTitle}>Menu</span>
                  <button
                    onClick={() => setMobileMoreOpen(false)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: ct.textSecondary, padding: "4px" }}
                  >
                    {ICONS.close}
                  </button>
                </div>
                {mobileMoreItems.map((item: any) => {
                  const isActive = pathname === item.path;
                  const label = getLabel(item.label);
                  const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];
                  return (
                    <div
                      key={item.path}
                      onClick={() => handleNavigation(item.path, label)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        marginBottom: "4px",
                        borderRadius: "12px",
                        background: isActive ? `linear-gradient(135deg, ${ct.primary}1a 0%, ${ct.primary}0d 100%)` : "transparent",
                        color: isActive ? ct.primary : ct.textSecondary,
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {isActive && <div style={{ ...styles.activeIndicator, background: ct.primary }} />}
                      <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: "14px", fontWeight: isActive ? 600 : 400 }}>{label}</span>
                    </div>
                  );
                })}
                <div style={styles.divider} />
                <div
                  onClick={logout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "rgba(239,68,68,0.08)",
                    color: "#f87171",
                    cursor: "pointer",
                    border: "1px solid rgba(239,68,68,0.14)",
                  }}
                >
                  <span style={{ display: "flex", flexShrink: 0 }}>{ICONS.logout}</span>
                  <span style={{ fontSize: "14px" }}>{getLabel("common.logout")}</span>
                </div>
              </div>
            </>
          )}

          {/* Bottom tab bar */}
          <div style={styles.mobileBottomNav}>
            {mobilePrimaryItems.map((item: any) => {
              const isActive = pathname === item.path;
              const label = getLabel(item.label);
              const icon = ICONS[item.iconKey] ?? ICONS["dashboard"];
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path, label)}
                  style={{
                    ...(styles.mobileNavBtn as CSSProperties),
                    color: isActive ? ct.primary : ct.textSecondary,
                  }}
                >
                  <div style={{
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "28px",
                    borderRadius: "10px",
                    background: isActive ? `${ct.primary}18` : "transparent",
                  }}>
                    {icon}
                  </div>
                  <span style={{
                    ...(styles.mobileNavLabel as CSSProperties),
                    color: isActive ? ct.primary : ct.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}

            {/* "More" button if there are extra items */}
            {mobileMoreItems.length > 0 && (
              <button
                onClick={() => setMobileMoreOpen((p) => !p)}
                style={{
                  ...(styles.mobileNavBtn as CSSProperties),
                  color: mobileMoreOpen ? ct.primary : ct.textSecondary,
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "28px",
                  borderRadius: "10px",
                  background: mobileMoreOpen ? `${ct.primary}18` : "transparent",
                  transition: "all 0.2s",
                }}>
                  {mobileMoreOpen ? ICONS.close : ICONS.menu}
                </div>
                <span style={{
                  ...(styles.mobileNavLabel as CSSProperties),
                  color: mobileMoreOpen ? ct.primary : ct.textSecondary,
                  fontWeight: mobileMoreOpen ? 600 : 400,
                }}>
                  Plus
                </span>
              </button>
            )}

            {/* Logout tab if there are only a few items and no "More" */}
            {mobileMoreItems.length === 0 && (
              <button
                onClick={logout}
                style={{
                  ...(styles.mobileNavBtn as CSSProperties),
                  color: "#f87171",
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "28px",
                  borderRadius: "10px",
                  background: "rgba(239,68,68,0.08)",
                  transition: "all 0.2s",
                }}>
                  {ICONS.logout}
                </div>
                <span style={{ ...(styles.mobileNavLabel as CSSProperties), color: "#f87171" }}>
                  {getLabel("common.logout")}
                </span>
              </button>
            )}
          </div>
        </>
      )}

      {/* ── DESKTOP: fixed sidebar (sans bouton de menu) ───────────────────────────── */}
      {mounted && !isMobile && (
        <div style={{ ...styles.sidebar, ...styles.sidebarDesktop }}>
          <div style={styles.header}>
            <div
              style={styles.logoWrapper}
              onClick={() => handleNavigation("/dashboard", "Dashboard")}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src="public/logo.png"
                  alt="Logo"
                  style={styles.logoImage}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "-1px",
                  right: "-1px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  border: `1.5px solid ${ct.background}`,
                }} />
              </div>

              <div style={styles.brandContainer}>
                <div style={styles.logoTitle}>Inovexa ERP</div>
                <div style={{
                  ...styles.logoRole,
                  color: role === "admin" ? "#f59e0b" : role === "transporteur" ? "#10b981" : ct.primary,
                }}>
                  {role === "admin" && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                  {role === "admin"
                    ? getLabel("admin.title")
                    : role === "transporteur"
                    ? "Transporteur"
                    : getLabel("common.profile")}
                </div>
              </div>
            </div>
          </div>

          <nav style={styles.nav}>
            {menuItems.map((item) => renderNavItem(item))}
            <div style={styles.divider} />
            <div
              onClick={logout}
              style={styles.logoutBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={{ display: "flex", flexShrink: 0 }}>{ICONS.logout}</span>
              <span>{getLabel("common.logout")}</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}