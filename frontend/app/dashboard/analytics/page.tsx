"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
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
  RadialLinearScale
} from "chart.js";
import { Bar, Line, Doughnut, Pie, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler, RadialLinearScale
);

// --- SVG Icon Components ------------------------------------------------------
const Icon = ({ children, size = 18, style = {} }: { children: React.ReactNode; size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>{children}</svg>
);

const Icons = {
  BarChart2: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Icon>,
  TrendingUp: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Icon>,
  Donut: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></Icon>,
  PieChart: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></Icon>,
  Radar: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polygon points="12 2 19 8.5 19 15.5 12 22 5 15.5 5 8.5"/><polygon points="12 6 16 9.5 16 14.5 12 18 8 14.5 8 9.5"/><circle cx="12" cy="12" r="1.5"/></Icon>,
  DollarSign: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>,
  Package: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Icon>,
  Users: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  FileText: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Icon>,
  Receipt: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></Icon>,
  Briefcase: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Icon>,
  Truck: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Icon>,
  Activity: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>,
  AlertTriangle: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>,
  AlertCircle: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>,
  Info: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Icon>,
  Plus: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>,
  X: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>,
  Eye: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>,
  CheckCircle: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>,
  Clock: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  Award: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Icon>,
  Star: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>,
  Target: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>,
  RefreshCw: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Icon>,
  Globe: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>,
  Loader: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></Icon>,
  Calendar: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>,
  Ban: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Icon>,
  ChevronDown: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polyline points="6 9 12 15 18 9"/></Icon>,
  ChevronRight: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polyline points="9 18 15 12 9 6"/></Icon>,
  ChevronLeft: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polyline points="15 18 9 12 15 6"/></Icon>,
  Menu: ({ size = 24, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></Icon>,
  Layers: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>,
  Cpu: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></Icon>,
  UserCheck: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></Icon>,
  UserPlus: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></Icon>,
  CheckSquare: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Icon>,
  Zap: ({ size, style }: { size?: number; style?: React.CSSProperties }) => <Icon size={size} style={style}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>
};

// Helper functions pour les labels
const getMonthLabelsByLang = (language: string): string[] => {
  if (language === 'fr') return ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoé", "Sep", "Oct", "Nov", "Déc"];
  if (language === 'es') return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
};

const getWeekDaysByLang = (language: string): string[] => {
  if (language === 'fr') return ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  if (language === 'es') return ["Lun", "Mar", "Mié", "Jue", "Vie", "Séb", "Dom"];
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
};

// --- Mobile Bottom Sheet Modal ------------------------------------------------
function MobileBottomSheetModal({ isOpen, onClose, children, title, theme }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  theme: any;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };
  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    if (diff > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 1000, backdropFilter: "blur(4px)",
          animation: "fadeInBg 0.25s ease"
        }}
      />
      <div
        ref={sheetRef}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: theme.surface,
          borderRadius: "24px 24px 0 0",
          zIndex: 1001,
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transition: "transform 0.1s ease",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
          border: `1px solid ${theme.border}`,
          borderBottom: "none"
        }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", flexShrink: 0 }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
            <h2 style={{ color: theme.text, fontSize: "17px", fontWeight: "700" }}>{title}</h2>
            <button
              onClick={onClose}
              style={{ background: theme.surfaceHover, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: theme.text }}
            >
              <Icons.X size={16} />
            </button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 16px 32px", WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>
      </div>
    </>
  );
}

// --- Custom Chart Modal --------------------------------------------------------
function CustomChartModal({ isOpen, onClose, onCreate, modulesData, trends, topProducts, topClients, rawSales, t, formatCurrency, theme, isMobile, language }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (chart: any) => void;
  modulesData: any;
  trends: { month: string; sales: number }[];
  topProducts: { name: string; amount: number }[];
  topClients: { name: string; amount: number }[];
  rawSales: any[];
  t: (key: string) => string;
  formatCurrency: (val: number) => string;
  theme: any;
  isMobile: boolean;
  language: string;
}) {
  const [config, setConfig] = useState<{
    title: string;
    type: string;
    module: string;
    dataType: string;
    period: string;
  }>({
    title: "",
    type: "bar",
    module: "sales",
    dataType: "trend",
    period: "month"
  });
  const [previewData, setPreviewData] = useState<{ labels: string[]; datasets: any[] } | null>(null);
  const [error, setError] = useState("");

  const monthLabels = getMonthLabelsByLang(language);
  const weekLabels = getWeekDaysByLang(language);
  const currentYear = new Date().getFullYear();

  // Fonction pour générer les données de maniére dynamique
  const generateRealData = useCallback((module: string, dataType: string, period: string) => {
    let labels: string[] = [];
    let dataValues: number[] = [];

    if (period === "week") {
      // Données pour les 7 derniers jours (aujourd'hui + 6 jours précédents)
      labels = weekLabels;
      dataValues = Array(7).fill(0);
      
      if (rawSales && Array.isArray(rawSales)) {
        const today = new Date();
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - i));
          const dateStr = date.toISOString().split('T')[0];
          
          const dayTotal = rawSales
            .filter((s: any) => s.createdAt && s.createdAt.split('T')[0] === dateStr)
            .reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
          dataValues[i] = dayTotal;
        }
      }
      
    } else if (period === "month") {
      labels = monthLabels;
      dataValues = Array(12).fill(0);
      
      if (rawSales && Array.isArray(rawSales)) {
        rawSales.forEach((s: any) => {
          if (s.createdAt) {
            const date = new Date(s.createdAt);
            if (date.getFullYear() === currentYear) {
              const month = date.getMonth();
              dataValues[month] += Number(s.total) || 0;
            }
          }
        });
      }
      
      // Appliquer le dataType
      if (dataType === "total") {
        const total = dataValues.reduce((a, b) => a + b, 0);
        dataValues = [total];
        labels = [t("analytics.totalRevenue")];
      } else if (dataType === "count") {
        const count = rawSales?.filter((s: any) => {
          if (!s.createdAt) return false;
          const date = new Date(s.createdAt);
          return date.getFullYear() === currentYear;
        }).length || 0;
        dataValues = [count];
        labels = [t("analytics.numberOfSales")];
      } else if (dataType === "average") {
        const total = dataValues.reduce((a, b) => a + b, 0);
        const count = rawSales?.filter((s: any) => {
          if (!s.createdAt) return false;
          const date = new Date(s.createdAt);
          return date.getFullYear() === currentYear;
        }).length || 1;
        dataValues = [total / count];
        labels = [t("analytics.averageTicket")];
      }
      
    } else if (period === "quarter") {
      labels = [t("analytics.q1"), t("analytics.q2"), t("analytics.q3"), t("analytics.q4")];
      const q = [0, 0, 0, 0];
      
      if (rawSales && Array.isArray(rawSales)) {
        rawSales.forEach((s: any) => {
          if (s.createdAt) {
            const date = new Date(s.createdAt);
            if (date.getFullYear() === currentYear) {
              const quarter = Math.floor(date.getMonth() / 3);
              if (quarter >= 0 && quarter < 4) {
                q[quarter] += Number(s.total) || 0;
              }
            }
          }
        });
      }
      dataValues = q;
      
    } else if (period === "year") {
      labels = [];
      const yearlyData: number[] = [];
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        labels.push(year.toString());
        let yearTotal = 0;
        if (rawSales && Array.isArray(rawSales)) {
          yearTotal = rawSales
            .filter((s: any) => s.createdAt && new Date(s.createdAt).getFullYear() === year)
            .reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
        }
        yearlyData.push(yearTotal);
      }
      dataValues = yearlyData;
    }

    // Pour les modules autres que sales
    if (module === "products" && dataType === "evolution") {
      if (topProducts.length > 0) {
        dataValues = topProducts.map(p => p.amount);
        labels = topProducts.map(p => p.name.substring(0, 15));
      } else {
        dataValues = [modulesData.products?.total || 0];
        labels = [t("analytics.totalProducts")];
      }
    } else if (module === "clients" && dataType === "top") {
      if (topClients.length > 0) {
        dataValues = topClients.map(c => c.amount);
        labels = topClients.map(c => c.name.substring(0, 15));
      } else {
        dataValues = [modulesData.clients?.total || 0];
        labels = [t("analytics.totalClients")];
      }
    }

    // Nettoyer les données
    while (dataValues.length < labels.length) dataValues.push(0);
    if (dataValues.length > labels.length) dataValues = dataValues.slice(0, labels.length);

    return { labels, dataValues };
  }, [rawSales, topProducts, topClients, modulesData, monthLabels, weekLabels, currentYear, language, t]);

  useEffect(() => {
    if (isOpen) {
      const { labels, dataValues } = generateRealData(config.module, config.dataType, config.period);
      const datasets = [{
        label: config.title || getFieldLabel(config.module, config.dataType),
        data: dataValues,
        backgroundColor: config.type === "line" ? `${theme.primary}20` : [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6"],
        borderColor: theme.primary,
        borderWidth: 2,
        fill: config.type === "line",
        tension: 0.4,
        pointBackgroundColor: config.type === "line" ? theme.primary : undefined,
        pointBorderColor: config.type === "line" ? theme.text : undefined,
        pointRadius: config.type === "line" ? 4 : undefined,
        pointHoverRadius: config.type === "line" ? 6 : undefined
      }];
      setPreviewData({ labels, datasets });
      setError("");
    }
  }, [config, isOpen, generateRealData, theme]);

  const getFieldLabel = (module: string, dataType: string) => {
    const labels: Record<string, Record<string, string>> = {
      sales: { total: t("analytics.totalRevenue"), trend: t("analytics.salesTrend"), count: t("analytics.numberOfSales"), average: t("analytics.averageTicket") },
      products: { evolution: t("analytics.productEvolution"), stock: t("analytics.stockStatus") },
      clients: { top: t("analytics.topClients"), status: t("analytics.clientDistribution") }
    };
    return labels[module]?.[dataType] || t("analytics.data");
  };

  const chartTypes = [
    { value: "bar", label: t("analytics.barChart"), Icon: Icons.BarChart2 },
    { value: "line", label: t("analytics.lineChart"), Icon: Icons.TrendingUp },
    { value: "doughnut", label: t("analytics.doughnutChart"), Icon: Icons.Donut },
    { value: "pie", label: t("analytics.pieChart"), Icon: Icons.PieChart },
    { value: "radar", label: t("analytics.radarChart"), Icon: Icons.Radar }
  ];

  const periodOptions = [
    { value: "week", label: t("analytics.weekly") },
    { value: "month", label: t("analytics.monthly") },
    { value: "quarter", label: t("analytics.quarterly") },
    { value: "year", label: t("analytics.yearly") }
  ];

  const modulesList = [
    { value: "sales", label: t("common.sales"), Icon: Icons.DollarSign, color: theme.accent },
    { value: "products", label: t("common.products"), Icon: Icons.Package, color: "#3b82f6" },
    { value: "clients", label: t("common.clients"), Icon: Icons.Users, color: theme.primary }
  ];

  const dataTypes: Record<string, { value: string; label: string; Icon: any }[]> = {
    sales: [
      { value: "trend", label: t("analytics.salesTrend"), Icon: Icons.TrendingUp },
      { value: "total", label: t("analytics.totalRevenue"), Icon: Icons.DollarSign },
      { value: "count", label: t("analytics.numberOfSales"), Icon: Icons.BarChart2 },
      { value: "average", label: t("analytics.averageTicket"), Icon: Icons.Activity }
    ],
    products: [
      { value: "evolution", label: t("analytics.productEvolution"), Icon: Icons.TrendingUp }
    ],
    clients: [
      { value: "top", label: t("analytics.topClients"), Icon: Icons.Award }
    ]
  };

  const handleCreate = () => {
    if (!config.title.trim()) { setError(t("analytics.titleRequired")); return; }
    const { labels, dataValues } = generateRealData(config.module, config.dataType, config.period);
    if (dataValues.length === 0 || dataValues.every(v => v === 0)) { setError(t("analytics.noDataAvailable")); return; }
    const datasets = [{
      label: config.title,
      data: dataValues,
      backgroundColor: config.type === "line" ? `${theme.primary}20` : [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6"],
      borderColor: theme.primary,
      borderWidth: 2,
      fill: config.type === "line",
      tension: 0.4,
      pointBackgroundColor: config.type === "line" ? theme.primary : undefined,
      pointBorderColor: config.type === "line" ? theme.text : undefined,
      pointRadius: config.type === "line" ? 4 : undefined,
      pointHoverRadius: config.type === "line" ? 6 : undefined
    }];
    onCreate({ id: Date.now(), title: config.title, type: config.type, module: config.module, dataType: config.dataType, period: config.period, chartData: { labels, datasets } });
    setConfig({ title: "", type: "bar", module: "sales", dataType: "trend", period: "month" });
    setError("");
    onClose();
  };

  const renderPreview = () => {
    if (!previewData || previewData.labels.length === 0) return null;
    const h = isMobile ? "180px" : "220px";
    const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: theme.textSecondary, font: { size: isMobile ? 9 : 11 } } } } };
    return (
      <div style={{ marginBottom: "20px", padding: "16px", background: theme.surfaceHover, borderRadius: "14px", border: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", color: theme.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}>
            <Icons.Eye size={12} /> {t("analytics.preview")}
          </span>
        </div>
        <div style={{ height: h }}>
          {config.type === "bar" && <Bar data={previewData} options={opts} />}
          {config.type === "line" && <Line data={previewData} options={opts} />}
          {config.type === "doughnut" && <Doughnut data={previewData} options={opts} />}
          {config.type === "pie" && <Pie data={previewData} options={opts} />}
          {config.type === "radar" && <Radar data={previewData} options={opts} />}
        </div>
      </div>
    );
  };

  const sectionLabel = (label: string) => (
    <p style={{ fontSize: "12px", fontWeight: "700", color: theme.textSecondary, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
  );

  const formContent = (
    <div>
      {error && (
        <div style={{ marginBottom: "16px", padding: "12px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "10px", color: "#f87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Icons.AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        {sectionLabel(`${t("analytics.chartTitle")} *`)}
        <input
          type="text"
          placeholder={t("analytics.chartTitlePlaceholder")}
          value={config.title}
          onChange={e => setConfig({ ...config, title: e.target.value })}
          style={{
            width: "100%", padding: "13px 14px",
            background: theme.surfaceHover,
            border: `1.5px solid ${config.title ? theme.primary : theme.border}`,
            borderRadius: "12px", color: theme.text, fontSize: "15px",
            outline: "none", boxSizing: "border-box"
          }}
          autoFocus={!isMobile}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        {sectionLabel(`${t("analytics.chartType")} *`)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
          {chartTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setConfig({ ...config, type: type.value })}
              style={{
                padding: isMobile ? "10px 4px" : "12px 6px",
                background: config.type === type.value ? theme.primary : theme.surfaceHover,
                border: `2px solid ${config.type === type.value ? theme.primary : theme.border}`,
                borderRadius: "10px",
                color: config.type === type.value ? "white" : theme.textSecondary,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                cursor: "pointer"
              }}
            >
              <type.Icon size={isMobile ? 18 : 20} />
              <span style={{ fontSize: "9px", fontWeight: "600" }}>{type.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {sectionLabel(`${t("analytics.period")} *`)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {periodOptions.map(p => (
            <button
              key={p.value}
              onClick={() => setConfig({ ...config, period: p.value })}
              style={{
                padding: "10px 4px",
                background: config.period === p.value ? theme.primary : theme.surfaceHover,
                border: `1px solid ${config.period === p.value ? theme.primary : theme.border}`,
                borderRadius: "10px",
                color: config.period === p.value ? "white" : theme.text,
                fontSize: "11px", fontWeight: "600", cursor: "pointer"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {sectionLabel(`${t("analytics.module")} *`)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {modulesList.map(m => (
            <button
              key={m.value}
              onClick={() => setConfig({ ...config, module: m.value, dataType: dataTypes[m.value]?.[0]?.value || "trend" })}
              style={{
                padding: "10px 12px",
                background: config.module === m.value ? m.color : theme.surfaceHover,
                border: `1px solid ${config.module === m.value ? m.color : theme.border}`,
                borderRadius: "10px",
                color: config.module === m.value ? "white" : theme.text,
                display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", textAlign: "left"
              }}
            >
              <m.Icon size={14} />
              <span style={{ fontSize: "12px", fontWeight: "600" }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {dataTypes[config.module] && (
        <div style={{ marginBottom: "20px" }}>
          {sectionLabel(`${t("analytics.dataField")} *`)}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {dataTypes[config.module].map(field => (
              <button
                key={field.value}
                onClick={() => setConfig({ ...config, dataType: field.value })}
                style={{
                  padding: "10px 12px",
                  background: config.dataType === field.value ? theme.primary : theme.surfaceHover,
                  border: `1px solid ${config.dataType === field.value ? theme.primary : theme.border}`,
                  borderRadius: "10px",
                  color: config.dataType === field.value ? "white" : theme.text,
                  display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", textAlign: "left"
                }}
              >
                <field.Icon size={14} />
                <span style={{ fontSize: "12px", fontWeight: "600" }}>{field.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {renderPreview()}

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={handleCreate} style={{ flex: 1, padding: "14px", background: theme.primary, color: "white", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
          <Icons.CheckCircle size={16} /> {t("common.create")}
        </button>
        <button onClick={onClose} style={{ flex: 1, padding: "14px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "12px", fontWeight: "600", fontSize: "15px", cursor: "pointer" }}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <MobileBottomSheetModal isOpen={isOpen} onClose={onClose} title={t("analytics.createCustomChart")} theme={theme}>
        {formContent}
      </MobileBottomSheetModal>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeInBg 0.2s ease" }}>
      <div style={{ background: theme.surface, padding: "32px", borderRadius: "24px", width: "700px", maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${theme.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ color: theme.text, display: "flex", alignItems: "center", gap: "12px" }}>
            <Icons.BarChart2 size={22} /> {t("analytics.createCustomChart")}
          </h2>
          <button onClick={onClose} style={{ background: theme.surfaceHover, border: "none", borderRadius: "8px", color: theme.text, cursor: "pointer", padding: "8px" }}>
            <Icons.X size={16} />
          </button>
        </div>
        {formContent}
      </div>
    </div>
  );
}

// --- Mobile Period Selector ---------------------------------------------------
function MobilePeriodSheet({ isOpen, onClose, period, setPeriod, options, theme, t }: {
  isOpen: boolean; onClose: () => void; period: string; setPeriod: (v: string) => void;
  options: { value: string; label: string }[]; theme: any; t: (k: string) => string;
}) {
  if (!isOpen) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 901,
        background: theme.surface, borderRadius: "20px 20px 0 0",
        padding: "16px 16px 36px",
        border: `1px solid ${theme.border}`,
        animation: "slideUp 0.25s ease"
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border, margin: "0 auto 16px" }} />
        <p style={{ color: theme.textSecondary, fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>{t("analytics.selectPeriod")}</p>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setPeriod(opt.value); onClose(); }}
            style={{
              width: "100%", padding: "14px 16px", marginBottom: "8px",
              background: period === opt.value ? `${theme.primary}15` : "transparent",
              border: `1.5px solid ${period === opt.value ? theme.primary : theme.border}`,
              borderRadius: "12px", color: period === opt.value ? theme.primary : theme.text,
              textAlign: "left", fontSize: "15px", fontWeight: period === opt.value ? "700" : "500",
              display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer"
            }}
          >
            {opt.label}
            {period === opt.value && <Icons.CheckCircle size={16} style={{ color: theme.primary }} />}
          </button>
        ))}
      </div>
    </>
  );
}

// --- KPI Card -----------------------------------------------------------------
function KpiCard({ Icon, label, value, color, sub, isMobile, theme, animDelay }: any) {
  return (
    <div
      style={{
        background: theme.surface,
        borderRadius: "16px",
        padding: isMobile ? "14px" : "20px",
        border: `1px solid ${theme.border}`,
        transition: "transform 0.2s, box-shadow 0.2s",
        animation: `fadeInUp 0.5s ease ${animDelay}s both`,
        cursor: "default"
      }}
      onMouseEnter={!isMobile ? e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; } : undefined}
      onMouseLeave={!isMobile ? e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; } : undefined}
    >
      <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary, display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <Icon size={isMobile ? 12 : 14} /> {label}
      </div>
      <div style={{ fontSize: isMobile ? "20px" : "28px", color, fontWeight: "800", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: isMobile ? "10px" : "11px", color: theme.textSecondary, marginTop: "5px" }}>{sub}</div>
    </div>
  );
}

// --- Module Stat Card ---------------------------------------------------------
function ModuleStatCard({ Icon, label, value, color, isMobile, theme }: any) {
  return (
    <div style={{ background: theme.surfaceHover, padding: isMobile ? "14px" : "20px", borderRadius: "14px", textAlign: "center" }}>
      <Icon size={isMobile ? 26 : 32} style={{ margin: "0 auto 8px", color }} />
      <div style={{ fontSize: isMobile ? "18px" : "28px", color, fontWeight: "800" }}>{value}</div>
      <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary, marginTop: "4px" }}>{label}</div>
    </div>
  );
}

// --- Main Analytics Page -------------------------------------------------------
export default function AnalyticsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { theme } = useTheme();
  const { isMobile } = useResponsive();

  // FIX: Margin left for desktop sidebar (280px)
  const contentMarginLeft = 0;

  const [showPeriodSheet, setShowPeriodSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [activeModule, setActiveModule] = useState("global");
  const [chartType, setChartType] = useState("bar");
  const [customCharts, setCustomCharts] = useState<{ id: number; type?: string; title?: string; [key: string]: any }[]>([]);
  const [showCustomChartModal, setShowCustomChartModal] = useState(false);
  const [data, setData] = useState({
    sales: { total: 0, count: 0, average: 0 },
    purchases: { total: 0, count: 0, average: 0 },
    products: { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
    clients: { total: 0, active: 0, new: 0 },
    orders: { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 },
    invoices: { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0 },
    employees: { total: 0, active: 0, onLeave: 0, inactive: 0, totalPayroll: 0 },
    logistics: { total: 0, delivered: 0, inTransit: 0, pending: 0, onTime: 0 }
  });
  const [trends, setTrends] = useState<{ month: string; sales: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; amount: number }[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; amount: number }[]>([]);
  const [alerts, setAlerts] = useState<{ type: string; message: string }[]>([]);
  const [animateCards, setAnimateCards] = useState(false);
  const [rawSales, setRawSales] = useState<any[]>([]);

  const monthLabels = getMonthLabelsByLang(language);
  const weekLabels = getWeekDaysByLang(language);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchAnalytics();
    setTimeout(() => setAnimateCards(true), 100);
  }, [period]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const [salesRes, productsRes, clientsRes, ordersRes, invoicesRes, employeesRes, shipmentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/shipments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let sales = await salesRes.json();
      let products = await productsRes.json();
      let clients = await clientsRes.json();
      let orders = await ordersRes.json();
      let invoices = await invoicesRes.json();
      let employees = await employeesRes.json();
      let shipments = await shipmentsRes.json();

      sales = Array.isArray(sales) ? sales : [];
      products = Array.isArray(products) ? products : [];
      clients = Array.isArray(clients) ? clients : [];
      orders = Array.isArray(orders) ? orders : [];
      invoices = Array.isArray(invoices) ? invoices : [];
      employees = Array.isArray(employees) ? employees : [];
      shipments = Array.isArray(shipments) ? shipments : [];

      setRawSales(sales);

      const totalSales = sales.reduce((s: number, item: any) => s + (Number(item.total) || 0), 0);
      const lowStock = products.filter((p: any) => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
      const outOfStock = products.filter((p: any) => (p.quantity || 0) === 0).length;
      const totalProductsValue = products.reduce((s: number, p: any) => s + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0);
      const activeClients = clients.filter((c: any) => c.status === "active").length;
      const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
      const completedOrders = orders.filter((o: any) => o.status === "completed" || o.status === "delivered").length;
      const paidInvoices = invoices.filter((i: any) => i.status === "paid").length;
      const totalInvoicesAmount = invoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
      const activeEmployees = employees.filter((e: any) => e.status === "active").length;
      const totalPayroll = employees.reduce((s: number, e: any) => s + (Number(e.salary) || 0), 0);
      const deliveredShipments = shipments.filter((s: any) => s.status === "delivered").length;

      setData({
        sales: { total: totalSales, count: sales.length, average: sales.length > 0 ? totalSales / sales.length : 0 },
        purchases: { total: 0, count: 0, average: 0 },
        products: { total: products.length, lowStock, outOfStock, totalValue: totalProductsValue },
        clients: { total: clients.length, active: activeClients, new: Math.floor(clients.length * 0.15) },
        orders: { total: orders.length, pending: pendingOrders, processing: 0, completed: completedOrders, cancelled: 0 },
        invoices: { total: invoices.length, paid: paidInvoices, pending: invoices.length - paidInvoices, overdue: 0, totalAmount: totalInvoicesAmount },
        employees: { total: employees.length, active: activeEmployees, onLeave: 0, inactive: 0, totalPayroll },
        logistics: { total: shipments.length, delivered: deliveredShipments, inTransit: 0, pending: 0, onTime: shipments.length > 0 ? (deliveredShipments / shipments.length * 100) : 0 }
      });

      // Calculer les ventes mensuelles pour l'année en cours
      const monthlySales = Array(12).fill(0);
      sales.forEach((s: any) => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          if (date.getFullYear() === currentYear) {
            const month = date.getMonth();
            monthlySales[month] += Number(s.total) || 0;
          }
        }
      });
      
      setTrends(monthLabels.map((month, i) => ({ month, sales: monthlySales[i] })));

      // Top produits
      const productSales: Record<string, number> = {};
      sales.forEach((s: any) => { 
        if (s.productName) productSales[s.productName] = (productSales[s.productName] || 0) + (Number(s.total) || 0);
      });
      setTopProducts(Object.entries(productSales).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5));

      // Top clients
      const clientSales: Record<string, number> = {};
      sales.forEach((s: any) => { 
        if (s.clientName) clientSales[s.clientName] = (clientSales[s.clientName] || 0) + (Number(s.total) || 0);
      });
      setTopClients(Object.entries(clientSales).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5));

      // Alertes
      const newAlerts: { type: string; message: string }[] = [];
      if (lowStock > 0) newAlerts.push({ type: "warning", message: `${lowStock} ${t("analytics.lowStockAlert")}` });
      if (outOfStock > 0) newAlerts.push({ type: "danger", message: `${outOfStock} ${t("analytics.outOfStockAlert")}` });
      if (pendingOrders > 5) newAlerts.push({ type: "info", message: `${pendingOrders} ${t("analytics.pendingOrdersAlert")}` });
      setAlerts(newAlerts.slice(0, isMobile ? 2 : 4));

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addCustomChart = (chart: any) => setCustomCharts(prev => [...prev, chart]);
  const removeCustomChart = (id: number) => setCustomCharts(customCharts.filter(chart => chart.id !== id));

  const getFilteredSalesData = () => {
    let labels: string[] = [];
    let dataValues: number[] = [];
    
    if (period === "week") {
      // Données pour les 7 derniers jours (aujourd'hui + 6 jours précédents)
      labels = weekLabels;
      dataValues = Array(7).fill(0);
      
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTotal = rawSales
          .filter((s: any) => s.createdAt && s.createdAt.split('T')[0] === dateStr)
          .reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
        dataValues[i] = dayTotal;
      }
    } else if (period === "month") {
      labels = monthLabels;
      dataValues = Array(12).fill(0);
      rawSales.forEach((s: any) => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          if (date.getFullYear() === currentYear) {
            dataValues[date.getMonth()] += Number(s.total) || 0;
          }
        }
      });
    } else if (period === "quarter") {
      labels = [t("analytics.q1"), t("analytics.q2"), t("analytics.q3"), t("analytics.q4")];
      const q = [0, 0, 0, 0];
      rawSales.forEach((s: any) => {
        if (s.createdAt) {
          const date = new Date(s.createdAt);
          if (date.getFullYear() === currentYear) {
            const quarter = Math.floor(date.getMonth() / 3);
            if (quarter >= 0 && quarter < 4) {
              q[quarter] += Number(s.total) || 0;
            }
          }
        }
      });
      dataValues = q;
    } else if (period === "year") {
      labels = [];
      const yearlyData: number[] = [];
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        labels.push(year.toString());
        const yearTotal = rawSales
          .filter((s: any) => s.createdAt && new Date(s.createdAt).getFullYear() === year)
          .reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
        yearlyData.push(yearTotal);
      }
      dataValues = yearlyData;
    }

    return { labels, dataValues };
  };

  const filteredSalesData = getFilteredSalesData();

  const salesChartData = {
    labels: filteredSalesData.labels,
    datasets: [{ 
      label: t("dashboard.revenue"), 
      data: filteredSalesData.dataValues, 
      backgroundColor: `${theme.primary}80`, 
      borderColor: theme.primary, 
      borderWidth: 2, 
      fill: true, 
      tension: 0.4,
      pointBackgroundColor: theme.primary,
      pointBorderColor: theme.text,
      pointRadius: isMobile ? 2 : 3,
      pointHoverRadius: isMobile ? 4 : 6
    }]
  };

  const topProductsChartData = {
    labels: topProducts.map(p => isMobile && p.name.length > 10 ? p.name.substring(0, 8) + "é" : p.name),
    datasets: [{ 
      label: t("dashboard.topProducts"), 
      data: topProducts.map(p => p.amount), 
      backgroundColor: [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6"], 
      borderWidth: 0,
      borderRadius: 8
    }]
  };

  const topClientsChartData = {
    labels: topClients.map(c => isMobile && c.name.length > 10 ? c.name.substring(0, 8) + "é" : c.name),
    datasets: [{ 
      label: t("dashboard.topClients"), 
      data: topClients.map(c => c.amount), 
      backgroundColor: [theme.accent, "#f59e0b", theme.primary, "#8b5cf6", "#ef4444"], 
      borderWidth: 0,
      borderRadius: 8
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: theme.textSecondary, font: { size: isMobile ? 9 : 11 }, boxWidth: isMobile ? 8 : 10, usePointStyle: true, pointStyle: "circle" as const },
        position: (isMobile ? "bottom" : "top") as "bottom" | "top"
      },
      tooltip: {
        backgroundColor: theme.surface, 
        titleColor: theme.text, 
        bodyColor: theme.textSecondary,
        borderColor: theme.primary, 
        borderWidth: 1,
        callbacks: { 
          label: (context: any) => `${context.dataset.label || ""}: ${formatCurrency(context.raw || 0)}` 
        }
      }
    },
    scales: {
      y: { 
        ticks: { 
          color: theme.textSecondary, 
          font: { size: isMobile ? 9 : 11 }, 
          maxTicksLimit: isMobile ? 5 : 8,
          callback: (val: any) => formatCurrency(val)
        }, 
        grid: { color: `${theme.border}40`, drawBorder: false },
        border: { display: false }
      },
      x: { 
        ticks: { color: theme.textSecondary, font: { size: isMobile ? 9 : 11 }, maxRotation: isMobile ? 45 : 0, minRotation: isMobile ? 45 : 0 }, 
        grid: { display: false },
        border: { display: false }
      }
    }
  };

  const periodOptionsList = [
    { value: "week", label: t("analytics.weekly") },
    { value: "month", label: t("analytics.monthly") },
    { value: "quarter", label: t("analytics.quarterly") },
    { value: "year", label: t("analytics.yearly") }
  ];

  const currentPeriodLabel = periodOptionsList.find(p => p.value === period)?.label || "";

  const modulesList = [
    { id: "global", label: t("analytics.global"), Icon: Icons.Globe, color: theme.primary },
    { id: "sales", label: t("common.sales"), Icon: Icons.DollarSign, color: theme.accent },
    { id: "products", label: t("common.products"), Icon: Icons.Package, color: "#3b82f6" },
    { id: "clients", label: t("common.clients"), Icon: Icons.Users, color: theme.primary },
    { id: "orders", label: t("common.orders"), Icon: Icons.FileText, color: theme.primary },
    { id: "invoices", label: t("common.invoices"), Icon: Icons.Receipt, color: theme.accent },
    { id: "employees", label: t("common.hr"), Icon: Icons.Briefcase, color: "#14b8a6" },
    { id: "logistics", label: t("common.logistics"), Icon: Icons.Truck, color: "#3b82f6" }
  ];

  const chartTypeOptionsList = [
    { value: "bar", label: t("analytics.barChart") },
    { value: "line", label: t("analytics.lineChart") },
    { value: "doughnut", label: t("analytics.doughnutChart") },
    { value: "radar", label: t("analytics.radarChart") }
  ];

  const profit = data.sales.total - data.purchases.total;
  const profitMargin = data.sales.total > 0 ? (profit / data.sales.total * 100).toFixed(1) : "0";
  const inventoryTurnover = data.products.total > 0 ? (data.sales.total / data.products.total / 100).toFixed(1) : "0";
  const loyaltyRate = data.clients.total > 0 ? ((data.clients.total - (data.orders.pending || 0)) / data.clients.total * 100).toFixed(1) : "0";

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    * { -webkit-tap-highlight-color: transparent; }
  `;

  // FIX: Loading state with sidebar
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        minHeight: "100vh", 
        width: "100%", 
        background: theme.background,
        padding: 0,
        margin: 0
      }}>
        <div style={{ 
          flex: 1,
          marginLeft: 0,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          minHeight: "100vh",
          background: theme.background
        }}>
          <style>{animations}</style>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: "14px", color: theme.textSecondary }}>{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderChartByType = (type: string, data: any, opts: any) => {
    switch (type) {
      case "bar": return <Bar data={data} options={opts} />;
      case "line": return <Line data={data} options={opts} />;
      case "doughnut": return <Doughnut data={data} options={opts} />;
      case "pie": return <Pie data={data} options={opts} />;
      case "radar": return <Radar data={data} options={opts} />;
      default: return <Bar data={data} options={opts} />;
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.background, 
      display: "flex", 
      overflowX: "hidden",
      padding: 0,
      margin: 0
    }}>
      <style>{animations}</style>

      {/* Sidebar - comme sur les autres pages */}

      {/* Main Content */}
      <div style={{
        marginLeft: contentMarginLeft,
        flex: 1,
        paddingTop: isMobile ? "12px" : "32px",
        paddingLeft: isMobile ? "16px" : "32px",
        paddingRight: isMobile ? "16px" : "32px",
        paddingBottom: isMobile ? "70px" : "32px",
        minWidth: 0,
        minHeight: "100vh",
        background: theme.background,
        transition: "all 0.3s ease"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Header - Desktop et Mobile unifié */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: isMobile ? "flex-start" : "center", 
            flexDirection: isMobile ? "column" : "row",
            marginBottom: isMobile ? "20px" : "32px",
            gap: isMobile ? "16px" : "0",
            animation: "fadeInUp 0.5s ease both"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: isMobile ? "40px" : "44px",
                height: isMobile ? "40px" : "44px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent || theme.primary})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 14px ${theme.primary}40`,
                flexShrink: 0,
              }}>
                <Icons.Activity size={isMobile ? 18 : 22} style={{ color: "white" }} />
              </div>
              <div>
                <h1 style={{ color: theme.text, fontSize: isMobile ? "20px" : "26px", fontWeight: "800", letterSpacing: "-0.02em" }}>
                  {t("common.analytics")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "2px", fontSize: isMobile ? "11px" : "13px" }}>{t("analytics.subtitle")}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", color: theme.primary, zIndex: 1 }}>
                  <Icons.Calendar size={14} />
                </div>
                <select 
                  value={period} 
                  onChange={e => setPeriod(e.target.value)} 
                  style={{ 
                    padding: isMobile ? "8px 32px 8px 34px" : "10px 36px 10px 34px", 
                    background: theme.surfaceHover, 
                    border: `1px solid ${theme.border}`, 
                    borderRadius: "10px", 
                    color: theme.text, 
                    cursor: "pointer", 
                    fontSize: isMobile ? "12px" : "13px", 
                    fontWeight: "600", 
                    appearance: "none", 
                    WebkitAppearance: "none", 
                    outline: "none" 
                  }}
                >
                  {periodOptionsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: theme.textSecondary }}>
                  <Icons.ChevronDown size={isMobile ? 12 : 14} />
                </div>
              </div>
              <button 
                onClick={() => setShowCustomChartModal(true)} 
                style={{ 
                  padding: isMobile ? "8px 12px" : "10px 18px", 
                  background: theme.primary, 
                  border: "none", 
                  borderRadius: "10px", 
                  color: "white", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: isMobile ? "4px" : "8px", 
                  fontSize: isMobile ? "12px" : "13px", 
                  fontWeight: "700", 
                  boxShadow: `0 4px 14px ${theme.primary}45`, 
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap"
                }}
              >
                <Icons.Plus size={isMobile ? 14 : 16} /> 
                {isMobile ? t("analytics.createCustomChart") : t("analytics.createCustomChart")}
              </button>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {alerts.map((alert, idx) => {
                const isDanger = alert.type === "danger";
                const isWarning = alert.type === "warning";
                const bgColor = isDanger ? "rgba(239,68,68,0.1)" : isWarning ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)";
                const borderColor = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : theme.accent;
                const AlertIcon = isDanger ? Icons.AlertCircle : isWarning ? Icons.AlertTriangle : Icons.Info;
                return (
                  <div key={idx} style={{ background: bgColor, borderLeft: `4px solid ${borderColor}`, padding: isMobile ? "10px 14px" : "12px 16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: isMobile ? "12px" : "13px" }}>
                    <AlertIcon size={16} style={{ color: borderColor, flexShrink: 0 }} />
                    <span>{alert.message}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            {[
              { Icon: Icons.DollarSign, label: t("dashboard.revenue"), value: formatCurrency(data.sales.total), color: theme.accent, sub: `${data.sales.count} ${t("analytics.sales")}`, animDelay: 0 },
              { Icon: Icons.TrendingUp, label: t("dashboard.profit"), value: formatCurrency(profit), color: profit >= 0 ? theme.accent : "#ef4444", sub: `${t("dashboard.profitMargin")}: ${profitMargin}%`, animDelay: 0.05 },
              { Icon: Icons.Users, label: t("common.clients"), value: data.clients.total, color: theme.primary, sub: `${data.clients.active} ${t("analytics.active")}`, animDelay: 0.1 },
              { Icon: Icons.Package, label: t("common.products"), value: data.products.total, color: "#3b82f6", sub: `${data.products.lowStock} ${t("stock.lowStock")}`, animDelay: 0.15 }
            ].map((card, i) => (
              <KpiCard key={i} {...card} isMobile={isMobile} theme={theme} />
            ))}
          </div>

          {/* Sales Evolution Chart */}
          <div style={{ marginBottom: "32px", animation: "fadeInUp 0.5s ease 0.25s both" }}>
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ color: theme.text, fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icons.TrendingUp size={isMobile ? 15 : 18} style={{ color: theme.primary }} />
                  {t("analytics.salesEvolution")}
                  <span style={{ fontSize: isMobile ? "11px" : "12px", color: theme.textSecondary, background: theme.surfaceHover, padding: "2px 8px", borderRadius: "10px" }}>{currentPeriodLabel}</span>
                </h3>
                {!isMobile && (
                  <select value={chartType} onChange={e => setChartType(e.target.value)} style={{ padding: "6px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "6px", color: theme.text, cursor: "pointer", fontSize: "12px" }}>
                    {chartTypeOptionsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                )}
              </div>
              {filteredSalesData.dataValues.some(v => v > 0) ? (
                <div style={{ height: isMobile ? "200px" : "320px" }}>
                  {renderChartByType(chartType, salesChartData, chartOptions)}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: isMobile ? "40px" : "80px", color: theme.textSecondary }}>
                  <Icons.BarChart2 size={isMobile ? 32 : 48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p style={{ fontSize: isMobile ? "12px" : "14px" }}>{t("analytics.noSalesData")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products & Clients */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "20px", marginBottom: "32px" }}>
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Award size={isMobile ? 15 : 18} style={{ color: theme.primary }} /> {t("dashboard.topProducts")}
              </h3>
              {topProducts.length > 0 ? (
                <div style={{ height: isMobile ? "200px" : "260px" }}>
                  <Bar data={topProductsChartData} options={chartOptions} />
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: isMobile ? "40px" : "80px", color: theme.textSecondary }}>
                  <Icons.Package size={isMobile ? 32 : 48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p style={{ fontSize: isMobile ? "12px" : "14px" }}>{t("analytics.noProductsSold")}</p>
                </div>
              )}
            </div>
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Star size={isMobile ? 15 : 18} style={{ color: theme.primary }} /> {t("dashboard.topClients")}
              </h3>
              {topClients.length > 0 ? (
                <div style={{ height: isMobile ? "200px" : "260px" }}>
                  <Bar data={topClientsChartData} options={chartOptions} />
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: isMobile ? "40px" : "80px", color: theme.textSecondary }}>
                  <Icons.Users size={isMobile ? 32 : 48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p style={{ fontSize: isMobile ? "12px" : "14px" }}>{t("analytics.noClientsWithSales")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Charts */}
          {customCharts.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ color: theme.text, marginBottom: "14px", fontSize: isMobile ? "15px" : "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Layers size={isMobile ? 16 : 20} /> {t("analytics.myCustomCharts")}
                <span style={{ fontSize: "12px", color: theme.textSecondary, background: theme.surfaceHover, padding: "2px 8px", borderRadius: "10px" }}>{customCharts.length}</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
                {customCharts.map(chart => (
                  <div key={chart.id} style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}`, position: "relative" }}>
                    <button onClick={() => removeCustomChart(chart.id)} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", cursor: "pointer", padding: "5px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icons.X size={12} />
                    </button>
                    <h4 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "13px" : "14px", paddingRight: "36px" }}>{chart.title}</h4>
                    <div style={{ height: isMobile ? "180px" : "200px" }}>
                      {renderChartByType(chart.type || "bar", chart.chartData, chartOptions)}
                    </div>
                    <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "10px", color: theme.textSecondary, background: theme.surfaceHover, padding: "3px 10px", borderRadius: "12px" }}>
                        {modulesList.find(m => m.id === chart.module)?.label || chart.module}
                      </span>
                      <span style={{ fontSize: "10px", color: theme.textSecondary, background: theme.surfaceHover, padding: "3px 10px", borderRadius: "12px" }}>
                        {chart.period === "week" ? t("analytics.weekly") : chart.period === "month" ? t("analytics.monthly") : chart.period === "quarter" ? t("analytics.quarterly") : t("analytics.yearly")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module Tabs */}
          <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            {modulesList.map(module => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                style={{
                  padding: isMobile ? "9px 14px" : "10px 20px",
                  background: activeModule === module.id ? module.color : theme.surfaceHover,
                  border: `1px solid ${activeModule === module.id ? module.color : theme.border}`,
                  borderRadius: "10px",
                  color: activeModule === module.id ? "white" : theme.textSecondary,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  whiteSpace: "nowrap", fontSize: isMobile ? "12px" : "13px", flexShrink: 0
                }}
              >
                <module.Icon size={isMobile ? 13 : 14} />
                <span>{module.label}</span>
              </button>
            ))}
          </div>

          {/* Module Detail Panels */}
          {activeModule === "global" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Cpu size={isMobile ? 15 : 18} style={{ color: theme.primary }} /> {t("dashboard.strategicKpis")}
              </h3>
              {[
                { label: t("dashboard.profitMargin"), value: `${profitMargin}%`, pct: Math.min(parseFloat(profitMargin), 100), color: theme.accent, Icon: Icons.Target },
                { label: t("dashboard.inventoryTurnover"), value: `${inventoryTurnover}x`, pct: Math.min((data.sales.total / (data.products.total * 1000 || 1)) * 100, 100), color: "#f59e0b", Icon: Icons.RefreshCw },
                { label: t("dashboard.loyaltyRate"), value: `${loyaltyRate}%`, pct: Math.min(parseFloat(loyaltyRate), 100), color: theme.primary, Icon: Icons.Star }
              ].map((kpi, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? "20px" : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ color: theme.textSecondary, display: "flex", alignItems: "center", gap: "7px", fontSize: isMobile ? "12px" : "13px" }}>
                      <kpi.Icon size={isMobile ? 12 : 14} /> {kpi.label}
                    </span>
                    <span style={{ color: kpi.color, fontWeight: "700", fontSize: isMobile ? "13px" : "14px" }}>{kpi.value}</span>
                  </div>
                  <div style={{ background: theme.surfaceHover, borderRadius: "10px", height: isMobile ? "6px" : "8px" }}>
                    <div style={{ width: `${kpi.pct}%`, background: kpi.color, height: isMobile ? "6px" : "8px", borderRadius: "10px", transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeModule === "sales" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" }}>
                <ModuleStatCard Icon={Icons.DollarSign} label={t("dashboard.revenue")} value={formatCurrency(data.sales.total)} color={theme.accent} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.BarChart2} label={t("analytics.numberOfSales")} value={data.sales.count} color="#f59e0b" isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.TrendingUp} label={t("analytics.averageTicket")} value={formatCurrency(data.sales.average)} color={theme.accent} isMobile={isMobile} theme={theme} />
              </div>
            </div>
          )}

          {activeModule === "products" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <ModuleStatCard Icon={Icons.Package} label={t("products.totalProducts")} value={data.products.total} color={theme.primary} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.DollarSign} label={t("stock.totalValue")} value={formatCurrency(data.products.totalValue)} color={theme.accent} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.AlertTriangle} label={t("stock.lowStock")} value={data.products.lowStock} color="#f59e0b" isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.Ban} label={t("products.outOfStock")} value={data.products.outOfStock} color="#ef4444" isMobile={isMobile} theme={theme} />
              </div>
            </div>
          )}

          {activeModule === "clients" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" }}>
                <ModuleStatCard Icon={Icons.Users} label={t("clients.totalClients")} value={data.clients.total} color={theme.primary} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.UserCheck} label={t("clients.activeClients")} value={data.clients.active} color={theme.accent} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.UserPlus} label={t("clients.newClients")} value={data.clients.new} color="#3b82f6" isMobile={isMobile} theme={theme} />
              </div>
            </div>
          )}

          {activeModule === "orders" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" }}>
                <ModuleStatCard Icon={Icons.FileText} label={t("orders.totalOrders")} value={data.orders.total} color={theme.primary} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.CheckSquare} label={t("orders.delivered")} value={data.orders.completed} color={theme.accent} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.Clock} label={t("orders.pending")} value={data.orders.pending} color="#f59e0b" isMobile={isMobile} theme={theme} />
              </div>
            </div>
          )}

          {activeModule === "invoices" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" }}>
                <ModuleStatCard Icon={Icons.Receipt} label={t("invoices.totalInvoices")} value={data.invoices.total} color={theme.primary} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.CheckCircle} label={t("invoices.paidInvoices")} value={data.invoices.paid} color={theme.accent} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.DollarSign} label={t("invoices.totalAmount")} value={formatCurrency(data.invoices.totalAmount)} color="#f59e0b" isMobile={isMobile} theme={theme} />
              </div>
            </div>
          )}

          {activeModule === "employees" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" }}>
                <ModuleStatCard Icon={Icons.Briefcase} label={t("hr.totalEmployees")} value={data.employees.total} color={theme.primary} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.UserCheck} label={t("hr.activeEmployees")} value={data.employees.active} color={theme.accent} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.DollarSign} label={t("hr.totalPayroll")} value={formatCurrency(data.employees.totalPayroll)} color="#f59e0b" isMobile={isMobile} theme={theme} />
              </div>
            </div>
          )}

          {activeModule === "logistics" && (
            <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "16px" : "20px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "12px" }}>
                <ModuleStatCard Icon={Icons.Truck} label={t("logistics.totalShipments")} value={data.logistics.total} color={theme.primary} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.CheckCircle} label={t("logistics.delivered")} value={data.logistics.delivered} color={theme.accent} isMobile={isMobile} theme={theme} />
                <ModuleStatCard Icon={Icons.Zap} label={t("logistics.onTimeDelivery")} value={`${Math.round(data.logistics.onTime)}%`} color={theme.accent} isMobile={isMobile} theme={theme} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modals */}
      <MobilePeriodSheet isOpen={showPeriodSheet} onClose={() => setShowPeriodSheet(false)} period={period} setPeriod={setPeriod} options={periodOptionsList} theme={theme} t={t} />
      <CustomChartModal 
        isOpen={showCustomChartModal} 
        onClose={() => setShowCustomChartModal(false)} 
        onCreate={addCustomChart} 
        modulesData={data} 
        trends={trends} 
        topProducts={topProducts} 
        topClients={topClients}
        rawSales={rawSales}
        t={t} 
        formatCurrency={formatCurrency} 
        theme={theme} 
        isMobile={isMobile}
        language={language}
      />
    </div>
  );
}