"use client";
import { useAppSettings } from '@/hooks/useAppSettings';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  TooltipItem
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

// --- TYPES -------------------------------------------------------------------
type SalesDataPoint = { month: string; sales: number };
type ProfitDataPoint = { month: string; profit: number };
type TopItem = { name: string; amount: number };
type Activity = { type: string; data: any; date: any };

// --- SVG ICONS ---------------------------------------------------------------
const Icons = {
  Sun: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Cloud: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  Moon: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Clock: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  DollarSign: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  TrendingDown: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  Users: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Package: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  FileText: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  UserCheck: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
      <polyline points="17 11 19 13 23 9"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="9" y1="8" x2="9.01" y2="8"/>
    </svg>
  ),
  ShoppingCart: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  PlusCircle: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  BarChart2: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  User: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Settings: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Building: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/>
      <rect x="8" y="18" width="8" height="4"/>
    </svg>
  ),
  Star: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Target: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Zap: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Lightbulb: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  Activity: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Keyboard: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6.01" y2="10"/><line x1="10" y1="10" x2="10.01" y2="10"/>
      <line x1="14" y1="10" x2="14.01" y2="10"/><line x1="18" y1="10" x2="18.01" y2="10"/>
      <line x1="8" y1="14" x2="16" y2="14"/>
    </svg>
  ),
  MousePointer: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>
    </svg>
  ),
  Receipt: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
      <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/>
    </svg>
  ),
  ShoppingBag: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  DayIcon: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8.01" y2="14"/>
    </svg>
  ),
  WeekIcon: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="16" y2="14"/>
    </svg>
  ),
  MonthIcon: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  QuarterIcon: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  YearIcon: () => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
};

const Icon = ({ name, size = "1em", color = "currentColor", style = {} }: { name: keyof typeof Icons; size?: string; color?: string; style?: React.CSSProperties }) => {
  const Comp = Icons[name];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size, color, lineHeight: 1, ...style }}>
      <Comp />
    </span>
  );
};

export default function DashboardPage() { 
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency, formatDateTime } = useAppSettings();
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [stats, setStats] = useState({
    totalSales: 0, totalPurchases: 0, totalClients: 0, totalProducts: 0,
    pendingInvoices: 0, lowStock: 0, activeEmployees: 0, pendingOrders: 0,
    salesGrowth: 0, clientGrowth: 0, profitGrowth: 0
  });
  // -- FIX: typed state arrays (was never[]) ----------------------------------
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [profitData, setProfitData] = useState<ProfitDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopItem[]>([]);
  const [topClients, setTopClients] = useState<TopItem[]>([]);
  // -- FIX: typed hover state (was null ? never accepts number) --------------
  const [animateCards, setAnimateCards] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [refreshTime, setRefreshTime] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [rawSales, setRawSales] = useState<any[]>([]);
  const [rawPurchases, setRawPurchases] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [imageError, setImageError] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getTempTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      "dashboard.profile": { fr: "Mon profil", en: "My profile", es: "Mi perfil" },
      "dashboard.settings": { fr: "Param�tres", en: "Settings", es: "Ajustes" },
      "common.profile": { fr: "Profil", en: "Profile", es: "Perfil" },
      "common.settings": { fr: "Param�tres", en: "Settings", es: "Ajustes" }
    };
    if (translations[key] && translations[key][language]) return translations[key][language];
    const translated = t(key);
    return translated !== key ? translated : key;
  };

  const getResponsiveStyle = () => {
    if (isMobile) {
      return {
        headerTitleSize: "18px", headerEmojiSize: "20px", headerNameSize: "14px",
        dateSize: "9px", kpiValueSize: "20px", kpiLabelSize: "9px", kpiIconSize: "18px",
        chartHeight: "180px", profileImageSize: "40px", profileImageRadius: "12px",
        companyFontSize: "7px", cardPadding: "10px", cardRadius: "12px",
        gridGap: "10px", sectionMargin: "16px", secondaryCardPadding: "8px",
        secondaryCardValueSize: "16px"
      };
    } else if (isTablet) {
      return {
        headerTitleSize: "22px", headerEmojiSize: "24px", headerNameSize: "18px",
        dateSize: "11px", kpiValueSize: "24px", kpiLabelSize: "10px", kpiIconSize: "22px",
        chartHeight: "220px", profileImageSize: "60px", profileImageRadius: "20px",
        companyFontSize: "8px", cardPadding: "14px", cardRadius: "14px",
        gridGap: "14px", sectionMargin: "20px", secondaryCardPadding: "10px",
        secondaryCardValueSize: "20px"
      };
    } else {
      return {
        headerTitleSize: "24px", headerEmojiSize: "28px", headerNameSize: "20px",
        dateSize: "12px", kpiValueSize: "28px", kpiLabelSize: "11px", kpiIconSize: "24px",
        chartHeight: "250px", profileImageSize: "75px", profileImageRadius: "25px",
        companyFontSize: "9px", cardPadding: "16px", cardRadius: "16px",
        gridGap: "16px", sectionMargin: "24px", secondaryCardPadding: "12px",
        secondaryCardValueSize: "22px"
      };
    }
  };

  const responsive = getResponsiveStyle();

  const loadUserFromBackend = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
    } catch(e) { console.error("Erreur chargement utilisateur:", e); }
    return null;
  };

  const refreshUserData = async () => {
    const freshUser = await loadUserFromBackend();
    if (freshUser) {
      setUser(freshUser);
      if (freshUser.profileImage) {
        setProfileImage(freshUser.profileImage);
        setImageError(false);
        setImageTimestamp(Date.now());
      } else { setProfileImage(null); }
    } else {
      const userData = localStorage.getItem("user");
      if (userData) {
        const u = JSON.parse(userData);
        setUser(u);
        if (u.profileImage) { setProfileImage(u.profileImage); setImageError(false); setImageTimestamp(Date.now()); }
      }
    }
  };

  const getLocale = () => {
    switch(language) {
      case 'fr': return 'fr-FR';
      case 'es': return 'es-ES';
      default: return 'en-US';
    }
  };

  const getCurrentDate = () => {
    const now = new Date();
    const locale = getLocale();
    const options: Intl.DateTimeFormatOptions = isMobile ? 
      { weekday: "short", day: "numeric", month: "short" } : 
      { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    let dateStr = now.toLocaleDateString(locale, options);
    if (language === 'fr' && dateStr) dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    return dateStr;
  };

  const getWeatherIcon = (): keyof typeof Icons => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Sun";
    if (hour >= 12 && hour < 18) return "Cloud";
    return "Moon";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.goodMorning") || "Bonjour";
    if (hour < 18) return t("dashboard.goodAfternoon") || "Bon apr�s-midi";
    return t("dashboard.goodEvening") || "Bonsoir";
  };

  // -- FIX: explicit return type so icon field is keyof typeof Icons ----------
  const getPeriodOptions = (): { value: string; label: string; icon: keyof typeof Icons }[] => [
    { value: "day",     label: language === 'fr' ? "Jour"      : language === 'es' ? "D�a"       : "Day",     icon: "DayIcon"     },
    { value: "week",    label: language === 'fr' ? "Semaine"   : language === 'es' ? "Semana"    : "Week",    icon: "WeekIcon"    },
    { value: "month",   label: language === 'fr' ? "Mois"      : language === 'es' ? "Mes"       : "Month",   icon: "MonthIcon"   },
    { value: "quarter", label: language === 'fr' ? "Trimestre" : language === 'es' ? "Trimestre" : "Quarter", icon: "QuarterIcon" },
    { value: "year",    label: language === 'fr' ? "Ann�e"     : language === 'es' ? "A�o"       : "Year",    icon: "YearIcon"    }
  ];

  const periodOptions = getPeriodOptions();

  const getPeriodLabels = (period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    if (period === "day") {
      const labels: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(); date.setDate(now.getDate() - i);
        if (isMobile) {
          labels.push(date.toLocaleDateString(getLocale(), { weekday: 'short' }).substring(0, 1) + date.getDate());
        } else {
          const day = date.toLocaleDateString(getLocale(), { weekday: 'short' });
          const dayNum = date.getDate();
          labels.push(`${day} ${dayNum}`);
        }
      }
      return labels;
    } else if (period === "week") {
      return ["S1", "S2", "S3", "S4"];
    } else if (period === "month") {
      if (language === 'fr') return ["Jan", "F�v", "Mar", "Avr", "Mai", "Juin", "Juil", "Ao�", "Sep", "Oct", "Nov", "D�c"];
      else if (language === 'es') return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      else return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    } else if (period === "quarter") {
      return [`T1`, `T2`, `T3`, `T4`];
    } else {
      const labels: string[] = [];
      for (let i = 4; i >= 0; i--) labels.push(`${currentYear - i}`);
      return labels;
    }
  };

  const aggregateDataByPeriod = (sales: any[], purchases: any[], period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const salesMap = new Map<any, number>();
    const profitMap = new Map<any, number>();

    if (period === "day") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(); date.setDate(now.getDate() - i);
        const key = date.toISOString().split('T')[0];
        salesMap.set(key, 0); profitMap.set(key, 0);
      }
      sales.forEach(s => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff <= 6) {
            const key = date.toISOString().split('T')[0];
            salesMap.set(key, (salesMap.get(key) || 0) + (parseFloat(s.total) || 0));
            profitMap.set(key, (profitMap.get(key) || 0) + (parseFloat(s.total) || 0));
          }
        }
      });
      purchases.forEach(p => {
        if (p.createdAt) {
          const date = new Date(p.createdAt);
          const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff <= 6) {
            const key = date.toISOString().split('T')[0];
            profitMap.set(key, (profitMap.get(key) || 0) - (parseFloat(p.total) || 0));
          }
        }
      });
    } else if (period === "week") {
      for (let i = 3; i >= 0; i--) { const key = `S${4 - i}`; salesMap.set(key, 0); profitMap.set(key, 0); }
      sales.forEach(s => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff <= 27) {
            const weekIndex = Math.floor(daysDiff / 7);
            const key = `S${4 - weekIndex}`;
            salesMap.set(key, (salesMap.get(key) || 0) + (parseFloat(s.total) || 0));
            profitMap.set(key, (profitMap.get(key) || 0) + (parseFloat(s.total) || 0));
          }
        }
      });
      purchases.forEach(p => {
        if (p.createdAt) {
          const date = new Date(p.createdAt);
          const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff <= 27) {
            const weekIndex = Math.floor(daysDiff / 7);
            const key = `S${4 - weekIndex}`;
            profitMap.set(key, (profitMap.get(key) || 0) - (parseFloat(p.total) || 0));
          }
        }
      });
    } else if (period === "month") {
      for (let i = 0; i < 12; i++) { salesMap.set(i, 0); profitMap.set(i, 0); }
      sales.forEach(s => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          if (date.getFullYear() === currentYear) {
            const month = date.getMonth();
            salesMap.set(month, (salesMap.get(month) || 0) + (parseFloat(s.total) || 0));
            profitMap.set(month, (profitMap.get(month) || 0) + (parseFloat(s.total) || 0));
          }
        }
      });
      purchases.forEach(p => {
        if (p.createdAt) {
          const date = new Date(p.createdAt);
          if (date.getFullYear() === currentYear) {
            const month = date.getMonth();
            profitMap.set(month, (profitMap.get(month) || 0) - (parseFloat(p.total) || 0));
          }
        }
      });
    } else if (period === "quarter") {
      for (let i = 0; i < 4; i++) { salesMap.set(i, 0); profitMap.set(i, 0); }
      sales.forEach(s => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          if (date.getFullYear() === currentYear) {
            const quarter = Math.floor(date.getMonth() / 3);
            salesMap.set(quarter, (salesMap.get(quarter) || 0) + (parseFloat(s.total) || 0));
            profitMap.set(quarter, (profitMap.get(quarter) || 0) + (parseFloat(s.total) || 0));
          }
        }
      });
      purchases.forEach(p => {
        if (p.createdAt) {
          const date = new Date(p.createdAt);
          if (date.getFullYear() === currentYear) {
            const quarter = Math.floor(date.getMonth() / 3);
            profitMap.set(quarter, (profitMap.get(quarter) || 0) - (parseFloat(p.total) || 0));
          }
        }
      });
    } else {
      for (let i = currentYear - 4; i <= currentYear; i++) { salesMap.set(i, 0); profitMap.set(i, 0); }
      sales.forEach(s => {
        if (s.createdAt) {
          const year = new Date(s.createdAt).getFullYear();
          if (year >= currentYear - 4 && year <= currentYear) {
            salesMap.set(year, (salesMap.get(year) || 0) + (parseFloat(s.total) || 0));
            profitMap.set(year, (profitMap.get(year) || 0) + (parseFloat(s.total) || 0));
          }
        }
      });
      purchases.forEach(p => {
        if (p.createdAt) {
          const year = new Date(p.createdAt).getFullYear();
          if (year >= currentYear - 4 && year <= currentYear) {
            profitMap.set(year, (profitMap.get(year) || 0) - (parseFloat(p.total) || 0));
          }
        }
      });
    }

    const labels = getPeriodLabels(period);
    const salesValues = Array.from(salesMap.values());
    const profitValues = Array.from(profitMap.values());
    return { labels, salesValues, profitValues };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    const initPage = async () => {
      const freshUser = await loadUserFromBackend();
      if (freshUser) { setUser(freshUser); if (freshUser.profileImage) { setProfileImage(freshUser.profileImage); setImageError(false); } }
      else { const userData = localStorage.getItem("user"); if (userData) { const u = JSON.parse(userData); setUser(u); if (u.profileImage) { setProfileImage(u.profileImage); setImageError(false); } } }
      await fetchDashboardData();
      setRefreshTime(formatDateTime(new Date()));
      setTimeout(() => setAnimateCards(true), 100);
    };
    initPage();
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refreshUserData);
    window.addEventListener("focus", refreshUserData);
    return () => { window.removeEventListener("storage", refreshUserData); window.removeEventListener("focus", refreshUserData); };
  }, []);

  useEffect(() => {
    if (rawSales.length > 0 || rawPurchases.length > 0) updateChartsByPeriod();
  }, [selectedPeriod, rawSales, rawPurchases]);

  const updateChartsByPeriod = () => {
    const { labels, salesValues, profitValues } = aggregateDataByPeriod(rawSales, rawPurchases, selectedPeriod);
    setSalesData(labels.map((label, i) => ({ month: label, sales: salesValues[i] })));
    setProfitData(labels.map((label, i) => ({ month: label, profit: profitValues[i] })));
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const [salesRes, purchasesRes, clientsRes, productsRes, invoicesRes, ordersRes, employeesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let sales = await salesRes.json();
      let purchases = await purchasesRes.json();
      let clients = await clientsRes.json();
      let products = await productsRes.json();
      let invoices = await invoicesRes.json();
      let orders = await ordersRes.json();
      let employees = await employeesRes.json();

      sales = Array.isArray(sales) ? sales : [];
      purchases = Array.isArray(purchases) ? purchases : [];
      clients = Array.isArray(clients) ? clients : [];
      products = Array.isArray(products) ? products : [];
      invoices = Array.isArray(invoices) ? invoices : [];
      orders = Array.isArray(orders) ? orders : [];
      employees = Array.isArray(employees) ? employees : [];

      setRawSales(sales); setRawPurchases(purchases);

      const totalSales = sales.reduce((s: number, item: any) => s + (parseFloat(item.total) || 0), 0);
      const totalPurchases = purchases.reduce((s: number, item: any) => s + (parseFloat(item.total) || 0), 0);
      const totalClients = clients.length;
      const totalProducts = products.length;
      const pendingInvoices = invoices.filter((i: any) => i.status !== "paid").length;
      const lowStock = products.filter((p: any) => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
      const activeEmployees = employees.filter((e: any) => e.status === "active").length;
      const pendingOrders = orders.filter((o: any) => o.status === "pending").length;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      let lastMonthYear = currentYear; let lastMonth = currentMonth - 1;
      if (lastMonth < 0) { lastMonth = 11; lastMonthYear = currentYear - 1; }

      let currentMonthSales = 0; let lastMonthSalesTotal = 0;
      let currentMonthProfit = 0; let lastMonthProfitTotal = 0;
      let currentMonthNewClients = 0; let lastMonthNewClients = 0;

      sales.forEach((s: any) => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) { currentMonthSales += parseFloat(s.total) || 0; }
          if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) { lastMonthSalesTotal += parseFloat(s.total) || 0; }
        }
      });
      purchases.forEach((p: any) => {
        if (p.createdAt) {
          const date = new Date(p.createdAt);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) { currentMonthProfit -= parseFloat(p.total) || 0; }
          if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) { lastMonthProfitTotal -= parseFloat(p.total) || 0; }
        }
      });
      sales.forEach((s: any) => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) { currentMonthProfit += parseFloat(s.total) || 0; }
          if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) { lastMonthProfitTotal += parseFloat(s.total) || 0; }
        }
      });
      clients.forEach((c: any) => {
        if (c.createdAt) {
          const date = new Date(c.createdAt);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) { currentMonthNewClients++; }
          if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) { lastMonthNewClients++; }
        }
      });

      // -- FIX: all growth values are numbers (parseFloat eliminates string | 0 | 100) --
      const salesGrowth = lastMonthSalesTotal > 0
        ? parseFloat(((currentMonthSales - lastMonthSalesTotal) / lastMonthSalesTotal * 100).toFixed(1))
        : currentMonthSales > 0 ? 100 : 0;
      const profitGrowth = lastMonthProfitTotal > 0
        ? parseFloat(((currentMonthProfit - lastMonthProfitTotal) / lastMonthProfitTotal * 100).toFixed(1))
        : currentMonthProfit > 0 ? 100 : 0;
      const clientGrowth = lastMonthNewClients > 0
        ? parseFloat(((currentMonthNewClients - lastMonthNewClients) / lastMonthNewClients * 100).toFixed(1))
        : currentMonthNewClients > 0 ? 100 : 0;

      setStats({ totalSales, totalPurchases, totalClients, totalProducts, pendingInvoices, lowStock, activeEmployees, pendingOrders, salesGrowth, clientGrowth, profitGrowth });

      const { labels, salesValues, profitValues } = aggregateDataByPeriod(sales, purchases, "month");
      setSalesData(labels.map((label, i) => ({ month: label, sales: salesValues[i] })));
      setProfitData(labels.map((label, i) => ({ month: label, profit: profitValues[i] })));

      // -- FIX: cast Object.entries values to number --------------------------
      const productSales: Record<string, number> = {};
      sales.forEach((s: any) => {
        if (s.productName) productSales[s.productName] = (productSales[s.productName] || 0) + (parseFloat(s.total) || 0);
      });
      setTopProducts(
        Object.entries(productSales)
          .map(([name, amount]) => ({ name, amount: amount as number }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      );

      const clientSales: Record<string, number> = {};
      sales.forEach((s: any) => {
        if (s.clientName) clientSales[s.clientName] = (clientSales[s.clientName] || 0) + (parseFloat(s.total) || 0);
      });
      setTopClients(
        Object.entries(clientSales)
          .map(([name, amount]) => ({ name, amount: amount as number }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      );

      // -- FIX: typed Activity array ------------------------------------------
      const recent: Activity[] = [];
      orders.slice(0, 5).forEach((o: any) => recent.push({ type: "order", data: o, date: o.createdAt }));
      invoices.slice(0, 5).forEach((i: any) => recent.push({ type: "invoice", data: i, date: i.createdAt }));
      recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(recent.slice(0, 8));

    } catch(e) { console.error("Erreur:", e); }
    setLoading(false);
  };

  const profit = stats.totalSales - stats.totalPurchases;
  const margin = stats.totalSales > 0 ? (profit / stats.totalSales * 100).toFixed(1) : 0;

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: theme.textSecondary, font: { size: isMobile ? 7 : isTablet ? 9 : 10 }, usePointStyle: true, pointStyle: "circle" as const, boxWidth: isMobile ? 6 : 8 }, position: "bottom" as const },
      tooltip: {
        backgroundColor: theme.surface, titleColor: theme.text, bodyColor: theme.textSecondary,
        borderColor: theme.primary, borderWidth: 1, bodyFont: { size: isMobile ? 10 : 12 }, titleFont: { size: isMobile ? 11 : 13 },
        callbacks: { label: function(context: TooltipItem<"line">) { return `${context.dataset.label || ''}: ${formatCurrency(context.raw as number)}`; } }
      }
    },
    scales: {
      y: { ticks: { color: theme.textSecondary, font: { size: isMobile ? 7 : isTablet ? 8 : 10 } }, grid: { color: theme.border }, beginAtZero: true },
      x: { ticks: { color: theme.textSecondary, font: { size: isMobile ? 7 : isTablet ? 8 : 10 }, maxRotation: isMobile ? 45 : 0 }, grid: { color: theme.border } }
    },
    interaction: { mode: 'index' as const, intersect: false },
    elements: { line: { tension: 0.4, borderWidth: isMobile ? 1.5 : 2 } }
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: theme.textSecondary, font: { size: isMobile ? 7 : isTablet ? 8 : 9 }, boxWidth: isMobile ? 6 : 8 }, position: "bottom" as const },
      tooltip: {
        backgroundColor: theme.surface, titleColor: theme.text, bodyColor: theme.textSecondary,
        borderColor: theme.primary, borderWidth: 1, bodyFont: { size: isMobile ? 10 : 12 }, titleFont: { size: isMobile ? 11 : 13 },
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: isMobile ? '55%' : '60%'
  };

  const salesChartData = {
    labels: salesData.map(d => d.month),
    datasets: [{
      label: t("dashboard.revenue"), data: salesData.map(d => d.sales),
      backgroundColor: `${theme.primary}20`, borderColor: theme.primary, borderWidth: isMobile ? 1.5 : 2,
      fill: true, tension: 0.4, pointBackgroundColor: theme.primary, pointBorderColor: theme.text,
      pointRadius: isMobile ? 1 : 2, pointHoverRadius: isMobile ? 3 : 4
    }]
  };
  const profitChartData = {
    labels: profitData.map(d => d.month),
    datasets: [{
      label: t("dashboard.profit"), data: profitData.map(d => d.profit),
      backgroundColor: `${theme.accent}20`, borderColor: theme.accent, borderWidth: isMobile ? 1.5 : 2,
      fill: true, tension: 0.4, pointBackgroundColor: theme.accent, pointBorderColor: theme.text,
      pointRadius: isMobile ? 1 : 2, pointHoverRadius: isMobile ? 3 : 4
    }]
  };
  const topProductsData = {
    labels: topProducts.map(p => p.name.length > (isMobile ? 8 : 12) ? p.name.substring(0, isMobile ? 6 : 12) + "..." : p.name),
    datasets: [{ data: topProducts.map(p => p.amount), backgroundColor: ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec489a"], borderWidth: 0, hoverOffset: 10 }]
  };

  const quickActions = [
    { icon: "PlusCircle" as keyof typeof Icons, label: t("dashboard.newSale"), path: "/dashboard/sales", color: "#10b981", bgColor: `${theme.primary}15` },
    { icon: "Package" as keyof typeof Icons, label: t("dashboard.addProduct"), path: "/dashboard/products", color: "#3b82f6", bgColor: `${theme.secondary}15` },
    { icon: "Users" as keyof typeof Icons, label: t("dashboard.newClient"), path: "/dashboard/clients", color: "#667eea", bgColor: `${theme.primary}15` },
    { icon: "BarChart2" as keyof typeof Icons, label: t("dashboard.reports"), path: "/dashboard/reports", color: "#a855f7", bgColor: `${theme.secondary}15` },
    { icon: "User" as keyof typeof Icons, label: getTempTranslation("dashboard.profile"), path: "/dashboard/profile", color: "#f59e0b", bgColor: `${theme.accent}15` },
    { icon: "Settings" as keyof typeof Icons, label: getTempTranslation("dashboard.settings"), path: "/dashboard/settings", color: "#ec489a", bgColor: `${theme.accent}15` }
  ];

  const kpiCards = [
    { icon: "DollarSign" as keyof typeof Icons, label: t("dashboard.revenue"), value: formatCurrency(stats.totalSales), color: theme.accent, growth: stats.salesGrowth, link: "/dashboard/sales", trend: stats.salesGrowth >= 0 ? "up" : "down" },
    { icon: "TrendingUp" as keyof typeof Icons, label: t("dashboard.profit"), value: formatCurrency(profit), color: profit >= 0 ? theme.accent : "#ef4444", growth: stats.profitGrowth, link: "/dashboard/finance", trend: stats.profitGrowth >= 0 ? "up" : "down" },
    { icon: "Users" as keyof typeof Icons, label: t("dashboard.activeClients"), value: stats.totalClients.toLocaleString(), color: theme.primary, growth: stats.clientGrowth, link: "/dashboard/clients", trend: stats.clientGrowth >= 0 ? "up" : "down" },
    { icon: "Package" as keyof typeof Icons, label: t("dashboard.products"), value: stats.totalProducts.toLocaleString(), color: "#f59e0b", growth: 0, link: "/dashboard/products", trend: "stable" }
  ];

  const secondaryCards = [
    { icon: "Receipt" as keyof typeof Icons, label: t("dashboard.pendingInvoices"), value: stats.pendingInvoices, color: stats.pendingInvoices > 0 ? "#f59e0b" : theme.accent },
    { icon: "AlertTriangle" as keyof typeof Icons, label: t("dashboard.lowStock"), value: stats.lowStock, color: stats.lowStock > 0 ? "#f59e0b" : theme.accent },
    { icon: "UserCheck" as keyof typeof Icons, label: t("dashboard.activeEmployees"), value: stats.activeEmployees, color: theme.textSecondary },
    { icon: "ClipboardList" as keyof typeof Icons, label: t("dashboard.pendingOrders"), value: stats.pendingOrders, color: stats.pendingOrders > 0 ? "#f59e0b" : theme.accent },
    { icon: "ShoppingBag" as keyof typeof Icons, label: t("dashboard.purchases"), value: formatCurrency(stats.totalPurchases), color: theme.textSecondary }
  ];

  const mainContainerStyle = { 
    flex: 1, margin: isMobile ? "0" : "6px", marginLeft: isMobile ? "0" : "0", 
    padding: isMobile ? "10px" : "16px", paddingBottom: isMobile ? "70px" : "16px",
    width: "100%", minHeight: "100vh", overflowX: "hidden" as const, background: theme.background 
  };
  const innerContainerStyle = { maxWidth: isMobile ? "100%" : "1400px", margin: "0 auto", width: "100%" };

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: isMobile ? "12px" : "14px", color: theme.textSecondary }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: theme.background, padding: 0 }}>
      <Sidebar />
      <div style={mainContainerStyle}>
        <div style={innerContainerStyle}>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes slideIn { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }
            @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
            .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; overflow: hidden; background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: ${responsive.cardRadius}; }
            .card-hover::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent); transition: left 0.5s ease; pointer-events: none; }
            .card-hover:hover::after { left: 100%; }
            .card-hover:active { transform: scale(0.98); }
            @media (hover: hover) {
              .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.4); border-color: ${theme.primary}; }
            }
            .action-item { transition: all 0.25s ease; cursor: pointer; position: relative; overflow: hidden; border-radius: 10px; }
            .action-item::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transition: left 0.4s ease; pointer-events: none; }
            @media (hover: hover) {
              .action-item:hover::before { left: 100%; }
              .action-item:hover { transform: translateX(5px); filter: brightness(1.05); }
            }
            .action-item:active { transform: scale(0.98); }
            .activity-item { transition: all 0.25s ease; cursor: pointer; }
            @media (hover: hover) {
              .activity-item:hover { transform: translateX(5px); background: ${theme.surfaceHover} !important; }
            }
            .activity-item:active { transform: scale(0.98); }
            .trend-up { color: #10b981; }
            .trend-down { color: #ef4444; }
            .greeting-text { background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
            .profile-menu { animation: fadeInDown 0.2s ease; background: ${theme.surface}; border: 1px solid ${theme.border}; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
            .period-selector { transition: all 0.2s ease; -webkit-tap-highlight-color: transparent; }
            .period-selector:active { transform: scale(0.95); }
            @media (max-width: 768px) { 
              .card-hover:active { transform: scale(0.98); } 
              .action-item:active { transform: scale(0.98); }
              * { -webkit-tap-highlight-color: transparent; }
            }
            @media (hover: hover) and (max-width: 768px) {
              .card-hover:hover { transform: translateY(-2px); }
              .action-item:hover { transform: translateX(3px); }
            }
            .no-touch-scroll { -webkit-overflow-scrolling: touch; }
          `}</style>

          {/* Header */}
          <div style={{ marginBottom: responsive.sectionMargin, animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: isMobile ? "180px" : "auto" }}>
                <h1 style={{ color: theme.text, fontSize: responsive.headerTitleSize, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <Icon name={getWeatherIcon()} size={responsive.headerEmojiSize} color={theme.primary} />
                  <span style={{ fontSize: responsive.headerNameSize }}>
                    {getGreeting()}, <span className="greeting-text">{user?.name?.split(' ')[0] || "Utilisateur"}</span> !
                  </span>
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: responsive.dateSize }}>
                  <Icon name="Calendar" size="0.9em" />
                  {getCurrentDate()}
                  {!isMobile && (
                    <span style={{ marginLeft: "6px", fontSize: responsive.dateSize, color: "#666", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Icon name="Clock" size="0.8em" /> {t("common.lastUpdate") || "Derni�re mise � jour"}: {refreshTime}
                    </span>
                  )}
                </p>
              </div>

              {/* Image de profil */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ position: "relative" }}>
                  <div 
                    onClick={() => setShowProfileMenu(!showProfileMenu)} 
                    style={{ cursor: "pointer", transition: "transform 0.3s ease", transform: showProfileMenu ? "scale(1.05)" : "scale(1)", WebkitTapHighlightColor: "transparent" }}
                  >
                    {profileImage && !imageError ? (
                      <img 
                        src={`$RENDER_API_URL${profileImage}?t=${imageTimestamp}`} 
                        alt="Profile" 
                        style={{ width: responsive.profileImageSize, height: responsive.profileImageSize, borderRadius: responsive.profileImageRadius, objectFit: "cover", border: `2px solid ${theme.primary}`, boxShadow: `0 4px 15px ${theme.primary}80` }}
                        onError={() => { setImageError(true); refreshUserData(); }} 
                        loading="lazy" 
                      />
                    ) : (
                      <div style={{ width: isMobile ? "40px" : responsive.profileImageSize, height: isMobile ? "40px" : responsive.profileImageSize, borderRadius: isMobile ? "12px" : responsive.profileImageRadius, background: theme.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", color: "white", border: `2px solid ${theme.primary}`, boxShadow: `0 4px 15px ${theme.primary}80` }}>
                        {getInitials(user?.name)}
                      </div>
                    )}
                  </div>

                  {showProfileMenu && (
                    <div className="profile-menu" style={{ position: "absolute", top: isMobile ? "45px" : "60px", right: "0", background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`, minWidth: isMobile ? "160px" : "200px", overflow: "hidden", zIndex: 1000, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                      <div style={{ padding: "12px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                        {profileImage && !imageError ? (
                          <img src={`$RENDER_API_URL${profileImage}?t=${imageTimestamp}`} alt="Profile" style={{ width: "35px", height: "35px", borderRadius: "17px", objectFit: "cover" }} onError={() => setImageError(true)} />
                        ) : (
                          <div style={{ width: "35px", height: "35px", borderRadius: "17px", background: theme.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold", color: "white" }}>{getInitials(user?.name)}</div>
                        )}
                        <div>
                          <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "11px" : "13px" }}>{user?.name}</div>
                          <div style={{ color: theme.textSecondary, fontSize: isMobile ? "8px" : "10px" }}>{user?.email}</div>
                        </div>
                      </div>
                      <div onClick={() => { router.push("/dashboard/profile"); setShowProfileMenu(false); setTimeout(() => refreshUserData(), 500); }} style={{ padding: "10px 16px", color: theme.textSecondary, cursor: "pointer", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <Icon name="User" size="0.9em" /> {getTempTranslation("common.profile")}
                      </div>
                      <div onClick={() => { router.push("/dashboard/settings"); setShowProfileMenu(false); }} style={{ padding: "10px 16px", color: theme.textSecondary, cursor: "pointer", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <Icon name="Settings" size="0.9em" /> {getTempTranslation("common.settings")}
                      </div>
                      <div style={{ height: "1px", background: theme.border }} />
                      <div onClick={() => { localStorage.clear(); router.push("/"); setShowProfileMenu(false); }} style={{ padding: "10px 16px", color: "#f87171", cursor: "pointer", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <Icon name="LogOut" size="0.9em" color="#f87171" /> {t("common.logout")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Cartes KPI */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : `repeat(auto-fit, minmax(${isMobile ? "140px" : "200px"}, 1fr))`, gap: responsive.gridGap, marginBottom: responsive.sectionMargin }}>
            {kpiCards.map((card, idx) => (
              <div key={idx} className="card-hover" style={{ padding: responsive.cardPadding, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: responsive.cardRadius, animation: `fadeInUp 0.5s ease ${idx * 0.1}s`, opacity: animateCards ? 1 : 0 }} onMouseEnter={() => setHoveredCard(idx)} onMouseLeave={() => setHoveredCard(null)} onClick={() => router.push(card.link)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: responsive.kpiLabelSize, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</span>
                  <span style={{ transition: "transform 0.3s ease", transform: hoveredCard === idx ? "scale(1.1) rotate(5deg)" : "scale(1)", display: "inline-flex" }}>
                    <Icon name={card.icon} size={responsive.kpiIconSize} color={card.color} />
                  </span>
                </div>
                <div style={{ fontSize: responsive.kpiValueSize, color: card.color, fontWeight: "bold", wordBreak: "break-word" }}>{card.value}</div>
                {card.growth !== 0 && (
                  <div style={{ fontSize: isMobile ? "8px" : responsive.kpiLabelSize, color: card.growth >= 0 ? "#10b981" : "#ef4444", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                    <span className={card.trend === "up" ? "trend-up" : card.trend === "down" ? "trend-down" : ""} style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <Icon name={card.growth >= 0 ? "TrendingUp" : "TrendingDown"} size="0.9em" /> {Math.abs(card.growth)}%
                    </span>
                    <span style={{ color: "#666" }}>{t("dashboard.vsPreviousPeriod")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 5 Cartes secondaires */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : `repeat(auto-fit, minmax(${isMobile ? "100px" : "140px"}, 1fr))`, gap: isMobile ? "8px" : responsive.gridGap, marginBottom: responsive.sectionMargin }}>
            {secondaryCards.map((card, idx) => (
              <div key={idx} className="card-hover" style={{ padding: responsive.secondaryCardPadding, textAlign: "center", animation: `fadeInUp 0.5s ease ${0.4 + idx * 0.05}s`, opacity: animateCards ? 1 : 0 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                  <Icon name={card.icon} size={responsive.kpiIconSize} color={card.color} />
                </div>
                <div style={{ fontSize: responsive.secondaryCardValueSize, color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: responsive.kpiLabelSize, color: theme.textSecondary, marginTop: "4px", lineHeight: "1.3" }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* S�lecteur de p�riode */}
          <div style={{ marginBottom: isMobile ? "12px" : responsive.sectionMargin, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", gap: "4px", background: theme.surface, padding: "4px", borderRadius: "32px", border: `1px solid ${theme.border}`, flexWrap: "wrap", justifyContent: "center", width: isMobile ? "100%" : "auto" }}>
              {periodOptions.map((option) => (
                <button key={option.value} onClick={() => setSelectedPeriod(option.value)} className="period-selector" style={{ padding: isMobile ? "6px 12px" : "6px 16px", borderRadius: "28px", background: selectedPeriod === option.value ? theme.primary : "transparent", color: selectedPeriod === option.value ? "white" : theme.textSecondary, border: "none", cursor: "pointer", fontSize: isMobile ? "10px" : "11px", fontWeight: selectedPeriod === option.value ? "500" : "normal", display: "flex", alignItems: "center", gap: "3px", transition: "all 0.2s", flex: isMobile ? "1" : "auto", justifyContent: "center" }}>
                  <Icon name={option.icon} size={isMobile ? "10px" : "12px"} color={selectedPeriod === option.value ? "white" : theme.textSecondary} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Graphiques */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: responsive.gridGap, marginBottom: responsive.sectionMargin }}>
            <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <h3 style={{ color: theme.text, fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="TrendingUp" size="1em" color={theme.primary} /> {t("dashboard.salesEvolution")}
                </h3>
                <div style={{ background: theme.surfaceHover, padding: "2px 8px", borderRadius: "16px", fontSize: isMobile ? "9px" : "10px", color: stats.salesGrowth >= 0 ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Icon name={stats.salesGrowth >= 0 ? "TrendingUp" : "TrendingDown"} size="0.8em" /> {Math.abs(stats.salesGrowth)}%
                </div>
              </div>
              {salesData.length > 0 && salesData.some(d => d.sales > 0) ? (
                <div style={{ height: responsive.chartHeight }}><Line data={salesChartData} options={chartOptions} /></div>
              ) : (
                <div style={{ height: responsive.chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textSecondary, fontSize: isMobile ? "11px" : "12px" }}>Aucune donn�e pour cette p�riode</div>
              )}
            </div>
            <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <h3 style={{ color: theme.text, fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="DollarSign" size="1em" color={theme.accent} /> {t("dashboard.profitEvolution") || "�volution du b�n�fice"}
                </h3>
                <div style={{ background: theme.surfaceHover, padding: "2px 8px", borderRadius: "16px", fontSize: isMobile ? "9px" : "10px", color: stats.profitGrowth >= 0 ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Icon name={stats.profitGrowth >= 0 ? "TrendingUp" : "TrendingDown"} size="0.8em" /> {Math.abs(stats.profitGrowth)}%
                </div>
              </div>
              {profitData.length > 0 && profitData.some(d => d.profit !== 0) ? (
                <div style={{ height: responsive.chartHeight }}><Line data={profitChartData} options={chartOptions} /></div>
              ) : (
                <div style={{ height: responsive.chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textSecondary, fontSize: isMobile ? "11px" : "12px" }}>Aucune donn�e pour cette p�riode</div>
              )}
            </div>
          </div>

          {/* Top produits + Top clients */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: responsive.gridGap, marginBottom: responsive.sectionMargin }}>
            <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <h3 style={{ color: theme.text, fontSize: isMobile ? "13px" : "14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="Trophy" size="1em" color="#f59e0b" /> {t("dashboard.topProducts")}
              </h3>
              {topProducts.length > 0 ? (
                <div style={{ height: isMobile ? "200px" : "220px" }}><Doughnut data={topProductsData} options={doughnutOptions} /></div>
              ) : <p style={{ textAlign: "center", padding: "30px", color: theme.textSecondary, fontSize: isMobile ? "11px" : "12px" }}>{t("dashboard.topProductsEmpty")}</p>}
            </div>
            <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <h3 style={{ color: theme.text, fontSize: isMobile ? "13px" : "14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="Star" size="1em" color="#f59e0b" /> {t("dashboard.topClients")}
              </h3>
              {topClients.length > 0 ? (
                <div style={{ maxHeight: isMobile ? "200px" : "220px", overflowY: "auto" }}>
                  {topClients.map((c, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${theme.border}`, animation: `slideIn 0.3s ease ${idx * 0.05}s`, transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(5px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                      <span style={{ color: theme.text, fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: isMobile ? "16px" : "18px", height: isMobile ? "16px" : "18px", background: `${theme.primary}20`, borderRadius: "4px", fontSize: isMobile ? "9px" : "10px" }}>{idx + 1}</span>
                        <span style={{ wordBreak: "break-word" }}>{c.name.length > (isMobile ? 15 : 20) ? c.name.substring(0, isMobile ? 12 : 17) + "..." : c.name}</span>
                      </span>
                      <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "11px" : "12px", marginLeft: "8px" }}>{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ textAlign: "center", padding: "30px", color: theme.textSecondary, fontSize: isMobile ? "11px" : "12px" }}>{t("dashboard.topClientsEmpty")}</p>}
            </div>
          </div>

          {/* KPIs strat�giques */}
          <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, marginBottom: responsive.sectionMargin, transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
            <h3 style={{ color: theme.text, fontSize: isMobile ? "13px" : "14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="BarChart2" size="1em" color={theme.primary} /> {t("dashboard.strategicKpis")}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? "12px" : "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icon name="Target" size="0.9em" color={theme.accent} /> {t("dashboard.profitMargin")}
                  </span>
                  <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "9px" : "11px" }}>{margin}%</span>
                </div>
                <div style={{ background: theme.surfaceHover, borderRadius: "8px", height: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(parseFloat(String(margin)), 100)}%`, background: `linear-gradient(90deg, ${theme.accent}, #059669)`, height: "4px", borderRadius: "8px", transition: "width 0.5s" }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icon name="RefreshCw" size="0.9em" color="#f59e0b" /> {t("dashboard.inventoryTurnover")}
                  </span>
                  <span style={{ color: "#f59e0b", fontWeight: "bold", fontSize: isMobile ? "9px" : "11px" }}>{stats.totalProducts > 0 ? (stats.totalSales / stats.totalProducts / 100).toFixed(1) : 0}x</span>
                </div>
                <div style={{ background: theme.surfaceHover, borderRadius: "8px", height: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min((stats.totalSales / (stats.totalProducts * 1000 || 1)) * 100, 100)}%`, background: "linear-gradient(90deg, #f59e0b, #d97706)", height: "4px", borderRadius: "8px", transition: "width 0.5s" }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icon name="Star" size="0.9em" color={theme.primary} /> {t("dashboard.loyaltyRate")}
                  </span>
                  <span style={{ color: theme.primary, fontWeight: "bold", fontSize: isMobile ? "9px" : "11px" }}>{stats.totalClients > 0 ? ((stats.totalClients - (stats.pendingOrders || 0)) / stats.totalClients * 100).toFixed(1) : 0}%</span>
                </div>
                <div style={{ background: theme.surfaceHover, borderRadius: "8px", height: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(((stats.totalClients - (stats.pendingOrders || 0)) / (stats.totalClients || 1)) * 100, 100)}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`, height: "4px", borderRadius: "8px", transition: "width 0.5s" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, marginBottom: responsive.sectionMargin }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
              <h3 style={{ color: theme.text, fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="Zap" size="1em" color="#f59e0b" /> {t("dashboard.quickActions")}
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : `repeat(auto-fill, minmax(${isMobile ? "140px" : "170px"}, 1fr))`, gap: "8px" }}>
              {quickActions.map((action, idx) => (
                <div key={action.label} onClick={() => router.push(action.path)} className="action-item" style={{ background: action.bgColor, padding: isMobile ? "8px" : "10px", display: "flex", alignItems: "center", gap: "8px", borderLeft: `3px solid ${action.color}`, transition: "all 0.25s ease", WebkitTapHighlightColor: "transparent" }} onMouseEnter={() => setHoveredAction(idx)} onMouseLeave={() => setHoveredAction(null)}>
                  <div style={{ width: isMobile ? "28px" : "30px", height: isMobile ? "28px" : "30px", display: "flex", alignItems: "center", justifyContent: "center", background: `${action.color}20`, borderRadius: "8px", transition: "transform 0.2s", transform: hoveredAction === idx ? "scale(1.1)" : "scale(1)" }}>
                    <Icon name={action.icon} size={isMobile ? "16px" : "18px"} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.text, fontSize: isMobile ? "11px" : "12px", fontWeight: "500" }}>{action.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activit�s r�centes */}
          <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}` }}>
            <h3 style={{ color: theme.text, fontSize: isMobile ? "13px" : "14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="Activity" size="1em" color={theme.primary} /> {t("dashboard.recentActivities")}
            </h3>
            {recentActivities.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recentActivities.slice(0, isMobile ? 5 : 8).map((activity, idx) => {
                  const typeLabel = activity.type === "order"
                    ? (language === 'fr' ? "Commande" : language === 'es' ? "Pedido" : "Order")
                    : (language === 'fr' ? "Facture" : language === 'es' ? "Factura" : "Invoice");
                  const typeIcon: keyof typeof Icons = activity.type === "order" ? "ClipboardList" : "Receipt";
                  const typeColor = activity.type === "order" ? "#f59e0b" : theme.primary;
                  return (
                    <div key={idx} className="activity-item" style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", padding: isMobile ? "8px" : "10px", background: theme.surfaceHover, borderRadius: "10px", borderLeft: `3px solid ${typeColor}`, animation: `slideIn 0.3s ease ${idx * 0.05}s`, transition: "all 0.25s ease", WebkitTapHighlightColor: "transparent" }} onMouseEnter={() => setHoveredActivity(idx)} onMouseLeave={() => setHoveredActivity(null)} onClick={() => router.push(activity.type === "order" ? "/dashboard/orders" : "/dashboard/invoices")}>
                      <div style={{ width: isMobile ? "28px" : "30px", height: isMobile ? "28px" : "30px", display: "flex", alignItems: "center", justifyContent: "center", background: `${typeColor}20`, borderRadius: "8px", transition: "transform 0.2s", transform: hoveredActivity === idx ? "scale(1.1)" : "scale(1)" }}>
                        <Icon name={typeIcon} size={isMobile ? "16px" : "18px"} color={typeColor} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: theme.text, fontSize: isMobile ? "11px" : "12px", fontWeight: "500" }}>{typeLabel} #{activity.data.id}</div>
                        <div style={{ color: theme.textSecondary, fontSize: isMobile ? "8px" : "10px", marginTop: "2px" }}>{formatDateTime(activity.date)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", transition: "transform 0.2s", transform: hoveredActivity === idx ? "translateX(5px)" : "translateX(0)", color: typeColor }}>
                        <Icon name="ArrowRight" size={isMobile ? "14px" : "16px"} color={typeColor} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p style={{ textAlign: "center", padding: "30px", color: theme.textSecondary, fontSize: isMobile ? "11px" : "12px" }}>{t("dashboard.recentActivitiesEmpty")}</p>}
          </div>

          {/* Footer */}
          <div style={{ marginTop: responsive.sectionMargin, textAlign: "center", padding: isMobile ? "12px" : "10px", borderTop: `1px solid ${theme.border}`, fontSize: isMobile ? "8px" : "10px", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Icon name="Clock" size="0.9em" /> {t("common.lastUpdate") || "Derni�re mise � jour"}: {refreshTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


