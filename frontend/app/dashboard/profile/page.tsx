"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";

// ==================== SVG ICONS ====================
const Icons = {
  Moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Waves: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  ),
  Sunset: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/>
      <path d="M22 22H2"/><path d="M16 6l-4 4-4-4"/>
      <path d="M16 18a4 4 0 0 0-8 0"/>
    </svg>
  ),
  DollarSign: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Crown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Truck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  ShieldLock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  BarChart2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Palette: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/>
      <circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Key: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Hourglass: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  XCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Spinner: ({ color, size = 48 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

// ==================== THÈMES DISPONIBLES ====================
const THEMES = {
  dark: {
    id: "dark",
    name: "Sombre",
    nameEn: "Dark",
    nameEs: "Oscuro",
    primary: "#667eea",
    primaryRgb: "102, 126, 234",
    secondary: "#764ba2",
    accent: "#10b981",
    background: "#0a0a0a",
    surface: "#111111",
    surfaceHover: "#1a1a1a",
    text: "#ffffff",
    textSecondary: "#94a3b8",
    border: "#222222",
    borderHover: "#333333",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    Icon: Icons.Moon
  },
  blue: {
    id: "blue",
    name: "Bleu Océan",
    nameEn: "Ocean Blue",
    nameEs: "Azul Océano",
    primary: "#0284c7",
    primaryRgb: "2, 132, 199",
    secondary: "#0369a1",
    accent: "#0ea5e9",
    background: "#082f49",
    surface: "#0f172a",
    surfaceHover: "#1e293b",
    text: "#f8fafc",
    textSecondary: "#94a3b8",
    border: "#334155",
    borderHover: "#475569",
    gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    Icon: Icons.Waves
  },
  sunset: {
    id: "sunset",
    name: "Coucher de Soleil",
    nameEn: "Sunset",
    nameEs: "Atardecer",
    primary: "#ea580c",
    primaryRgb: "234, 88, 12",
    secondary: "#f97316",
    accent: "#fb923c",
    background: "#1c1917",
    surface: "#292524",
    surfaceHover: "#3f3e3d",
    text: "#fff7ed",
    textSecondary: "#fdba74",
    border: "#44403c",
    borderHover: "#57534e",
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    Icon: Icons.Sunset
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const fileInputRef = useRef(null);
  const [currentTheme, setCurrentTheme] = useState("dark");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalClients: 0,
    memberSince: "",
    lastLogin: new Date().toLocaleString()
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const theme = THEMES[currentTheme];
    if (theme) {
      document.documentElement.style.setProperty('--theme-primary', theme.primary);
      document.documentElement.style.setProperty('--theme-primary-rgb', theme.primaryRgb);
      document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
      document.documentElement.style.setProperty('--theme-accent', theme.accent);
      document.documentElement.style.setProperty('--theme-background', theme.background);
      document.documentElement.style.setProperty('--theme-surface', theme.surface);
      document.documentElement.style.setProperty('--theme-surface-hover', theme.surfaceHover);
      document.documentElement.style.setProperty('--theme-text', theme.text);
      document.documentElement.style.setProperty('--theme-text-secondary', theme.textSecondary);
      document.documentElement.style.setProperty('--theme-border', theme.border);
      document.documentElement.style.setProperty('--theme-border-hover', theme.borderHover);
      document.documentElement.style.setProperty('--theme-gradient', theme.gradient);
    }
  }, [currentTheme]);

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem("app_theme", themeId);
    setShowThemeMenu(false);
    showMessage(`✅ ${t("settings.themeChanged") || "Thème changé"} : ${getThemeName(themeId)}`, "success");
    setTimeout(() => window.location.reload(), 300);
  };

  const getThemeName = (themeId) => {
    const theme = THEMES[themeId];
    if (language === 'fr') return theme.name;
    if (language === 'es') return theme.nameEs;
    return theme.nameEn;
  };

  const getCurrentThemeObject = () => THEMES[currentTheme] || THEMES.dark;

  const loadUserFromBackend = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const res = await fetch("http://localhost:3001/users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
    } catch(e) {
      console.error("Erreur chargement utilisateur:", e);
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    const initPage = async () => {
      const freshUser = await loadUserFromBackend();
      if (freshUser) {
        setUser(freshUser);
        setForm({ name: freshUser.name || "", email: freshUser.email || "", phone: freshUser.phone || "", companyName: freshUser.companyName || "" });
        setProfileImage(freshUser.profileImage || null);
      } else {
        const userData = localStorage.getItem("user");
        if (userData) {
          const u = JSON.parse(userData);
          setUser(u);
          setForm({ name: u.name || "", email: u.email || "", phone: u.phone || "", companyName: u.companyName || "" });
          setProfileImage(u.profileImage || null);
        }
      }
      await fetchUserStats();
      setTimeout(() => setAnimateCards(true), 100);
    };
    initPage();
  }, []);

  const fetchUserStats = async () => {
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const locale = language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';
    try {
      const salesRes = await fetch("http://localhost:3001/sales", { headers: { Authorization: `Bearer ${token}` } });
      let sales = await salesRes.json();
      sales = Array.isArray(sales) ? sales : [];
      let userSales = sales;
      if (currentUser.role !== 'admin') {
        userSales = sales.filter(sale => sale.userId === currentUser.id || sale.createdBy === currentUser.id || sale.user_id === currentUser.id);
      }
      const totalSalesAmount = userSales.reduce((sum, sale) => {
        let amount = sale.total || sale.amount || sale.price || sale.totalAmount || 0;
        return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
      }, 0);

      const ordersRes = await fetch("http://localhost:3001/orders", { headers: { Authorization: `Bearer ${token}` } });
      let orders = await ordersRes.json();
      orders = Array.isArray(orders) ? orders : [];
      let userOrders = orders;
      if (currentUser.role !== 'admin') {
        userOrders = orders.filter(o => o.userId === currentUser.id || o.createdBy === currentUser.id);
      }

      const clientsRes = await fetch("http://localhost:3001/clients", { headers: { Authorization: `Bearer ${token}` } });
      let clients = await clientsRes.json();
      clients = Array.isArray(clients) ? clients : [];
      let userClients = clients;
      if (currentUser.role !== 'admin') {
        userClients = clients.filter(c => c.userId === currentUser.id || c.createdBy === currentUser.id);
      }

      const memberDate = new Date();
      setStats({
        totalSales: totalSalesAmount,
        totalOrders: userOrders.length,
        totalClients: userClients.length,
        memberSince: memberDate.toLocaleDateString(locale, { year: "numeric", month: "long" }),
        lastLogin: new Date().toLocaleString(locale)
      });
    } catch(e) {
      console.error('Erreur fetchUserStats:', e);
      const memberDate = new Date();
      setStats({ totalSales: 0, totalOrders: 0, totalClients: 0, memberSince: memberDate.toLocaleDateString(), lastLogin: new Date().toLocaleString() });
    }
    setLoading(false);
  };

  const updateProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const freshUser = await loadUserFromBackend();
        if (freshUser) { setUser(freshUser); setProfileImage(freshUser.profileImage || null); }
        showMessage(t("profile.profileUpdated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const optimizeImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.95) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
          if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadProfileImage = async (file) => {
    const token = localStorage.getItem("token");
    setUploadingImage(true);
    try {
      const optimizedFile = await optimizeImage(file, 400, 400, 0.95);
      const formData = new FormData();
      formData.append("image", optimizedFile);
      const res = await fetch("http://localhost:3001/users/profile-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.profileImage || `/uploads/profiles/${data.filename}`;
        setProfileImage(imageUrl);
        setImageTimestamp(Date.now());
        const freshUser = await loadUserFromBackend();
        if (freshUser) setUser(freshUser);
        showMessage("Photo de profil mise à jour", "success");
      } else {
        const error = await res.json();
        showMessage(error.error || error.message || "Erreur lors de l'upload", "error");
      }
    } catch(e) { showMessage("Erreur de connexion", "error"); }
    finally { setUploadingImage(false); }
  };

  const handleImageClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^(image\/jpeg|image\/png)$/)) { showMessage("Veuillez sélectionner une image JPEG ou PNG", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showMessage("L'image ne doit pas dépasser 5MB", "error"); return; }
    uploadProfileImage(file);
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showMessage(t("profile.passwordMismatch"), "error"); return; }
    if (passwordForm.newPassword.length < 6) { showMessage(t("profile.passwordMinLength"), "error"); return; }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/users/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });
      if (res.ok) { setPasswordForm({ newPassword: "", confirmPassword: "" }); showMessage(t("profile.passwordChanged"), "success"); }
      else { const err = await res.json(); showMessage(err.message || t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const logoutAllDevices = async () => {
    if (confirm(t("profile.logoutAllWarning"))) {
      const token = localStorage.getItem("token");
      try {
        await fetch("http://localhost:3001/users/logout-all", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        localStorage.clear();
        router.push("/");
      } catch(e) { console.error(e); }
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const getRandomColor = () => {
    const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec489a"];
    return colors[(user?.name?.length || 0) % colors.length];
  };

  const getRoleIcon = (role) => {
    if (role === "admin") return <Icons.Crown />;
    if (role === "transporteur") return <Icons.Truck />;
    return <Icons.User />;
  };

  const getRoleText = (role) => {
    if (role === "admin") return t("profile.admin");
    if (role === "transporteur") return t("profile.transporter");
    return t("profile.client");
  };

  const currentThemeObj = getCurrentThemeObject();

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  `;

  const statsCards = [
    { Icon: Icons.TrendingUp, label: t("profile.revenueGenerated"), value: formatCurrency(stats.totalSales), color: currentThemeObj.accent },
    { Icon: Icons.ClipboardList, label: t("common.orders"), value: stats.totalOrders, color: currentThemeObj.primary },
    { Icon: Icons.Users, label: t("common.clients"), value: stats.totalClients, color: currentThemeObj.secondary }
  ];

  if (loading) {
    return (
      <div style={{ background: currentThemeObj.background, minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <Icons.Spinner color={currentThemeObj.primary} size={48} />
          <p style={{ marginTop: "16px", color: currentThemeObj.textSecondary }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: currentThemeObj.background, display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <style>{animations}</style>

          {/* Header avec image de profil */}
          <div style={{ marginBottom: "32px", animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0, transform: animateCards ? "translateY(0)" : "translateY(-20px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              
              {/* Avatar */}
              <div style={{ position: "relative", cursor: "pointer" }} onClick={handleImageClick}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png" style={{ display: "none" }} />
                {profileImage ? (
                  <img
                    src={`http://localhost:3001${profileImage}?t=${imageTimestamp}`}
                    alt="Profile"
                    style={{ width: "100px", height: "100px", borderRadius: "50px", objectFit: "cover", objectPosition: "center", border: `3px solid ${currentThemeObj.primary}`, transition: "transform 0.3s, box-shadow 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = `0 0 20px ${currentThemeObj.primary}80`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                    onError={() => setProfileImage(null)}
                  />
                ) : (
                  <div
                    style={{ width: "100px", height: "100px", borderRadius: "50px", background: `linear-gradient(135deg, ${getRandomColor()} 0%, #764ba2 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", color: "white", transition: "transform 0.3s", cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {getInitials(user?.name)}
                  </div>
                )}

                {/* Camera badge */}
                <div
                  style={{ position: "absolute", bottom: "0", right: "0", background: currentThemeObj.primary, borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${currentThemeObj.background}`, cursor: "pointer", transition: "transform 0.2s", color: "white" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Icons.Camera />
                </div>

                {uploadingImage && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.7)", borderRadius: "50px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icons.Spinner color="white" size={24} />
                  </div>
                )}
              </div>

              {/* Infos utilisateur */}
              <div>
                <h1 style={{ color: currentThemeObj.text, fontSize: "32px", margin: 0 }}>{user?.name}</h1>
                <p style={{ color: currentThemeObj.textSecondary, margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                  {getRoleIcon(user?.role)} {getRoleText(user?.role)}
                </p>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
                  <span style={{ color: "#666", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Icons.Calendar /> {t("profile.memberSince")} {stats.memberSince}
                  </span>
                  <span style={{ color: "#666", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Icons.Lock /> {t("profile.lastLogin")}: {stats.lastLogin}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{ background: currentThemeObj.surface, borderRadius: "16px", padding: "20px", textAlign: "center", border: `1px solid ${currentThemeObj.border}`, animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`, opacity: animateCards ? 1 : 0, transition: "transform 0.3s", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: card.color }}>
                  <card.Icon />
                </div>
                <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: "12px", color: currentThemeObj.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div style={{ background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`, color: messageType === "success" ? "#10b981" : "#f87171", padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", animation: "fadeInUp 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {messageType === "success" ? <Icons.CheckCircle /> : <Icons.XCircle />}
              {message}
            </div>
          )}

          {/* Tabs + Theme selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px", borderBottom: `1px solid ${currentThemeObj.border}`, animation: `fadeInUp 0.5s ease 0.3s`, opacity: animateCards ? 1 : 0 }}>
            
            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
              {[
                { id: "info", label: t("profile.personalInfo"), Icon: Icons.FileText },
                { id: "security", label: t("profile.security"), Icon: Icons.ShieldLock },
                { id: "activity", label: t("profile.activity"), Icon: Icons.BarChart2 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ padding: "12px 20px", background: activeTab === tab.id ? currentThemeObj.primary : "transparent", border: "none", borderRadius: "12px 12px 0 0", color: activeTab === tab.id ? "white" : currentThemeObj.textSecondary, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "7px", fontSize: "14px" }}
                >
                  <tab.Icon /> {tab.label}
                </button>
              ))}
            </div>

            {/* Theme selector */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: currentThemeObj.surface, border: `1px solid ${currentThemeObj.border}`, borderRadius: "12px", color: currentThemeObj.text, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = currentThemeObj.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.background = currentThemeObj.surface}
              >
                <span style={{ color: currentThemeObj.primary }}><currentThemeObj.Icon /></span>
                <span style={{ fontSize: "13px" }}>{getThemeName(currentTheme)}</span>
                <Icons.ChevronDown />
              </button>

              {showThemeMenu && (
                <div style={{ position: "absolute", top: "45px", right: "0", background: currentThemeObj.surface, border: `1px solid ${currentThemeObj.border}`, borderRadius: "16px", padding: "8px", minWidth: "210px", zIndex: 100, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", animation: "fadeInUp 0.2s ease" }}>
                  <div style={{ padding: "8px 12px", borderBottom: `1px solid ${currentThemeObj.border}`, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icons.Palette />
                    <span style={{ color: currentThemeObj.textSecondary, fontSize: "12px" }}>
                      {language === 'fr' ? "Choisir un thème" : language === 'es' ? "Elegir un tema" : "Choose a theme"}
                    </span>
                  </div>
                  {Object.entries(THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => changeTheme(key)}
                      style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 12px", background: currentTheme === key ? `${currentThemeObj.primary}20` : "transparent", border: "none", borderRadius: "10px", color: currentThemeObj.text, cursor: "pointer", transition: "all 0.2s", marginBottom: "2px" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = currentThemeObj.surfaceHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = currentTheme === key ? `${currentThemeObj.primary}20` : "transparent"}
                    >
                      <span style={{ color: theme.primary }}><theme.Icon /></span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: "13px", fontWeight: currentTheme === key ? "bold" : "normal" }}>{getThemeName(key)}</div>
                        <div style={{ width: "100%", height: "3px", background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`, borderRadius: "3px", marginTop: "4px" }} />
                      </div>
                      {currentTheme === key && <span style={{ color: currentThemeObj.primary }}><Icons.Check /></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div style={{ background: currentThemeObj.surface, borderRadius: "20px", padding: "32px", border: `1px solid ${currentThemeObj.border}`, animation: "fadeInUp 0.3s ease" }}>
              {[
                { label: t("common.name"), key: "name", type: "text" },
                { label: t("common.email"), key: "email", type: "email" },
                { label: t("common.phone"), key: "phone", type: "tel" },
                { label: t("profile.company"), key: "companyName", type: "text" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: "20px" }}>
                  <label style={{ color: currentThemeObj.textSecondary, display: "block", marginBottom: "8px", fontSize: "14px" }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: currentThemeObj.surfaceHover, border: `1px solid ${currentThemeObj.border}`, borderRadius: "10px", color: currentThemeObj.text, boxSizing: "border-box", outline: "none", fontSize: "14px" }}
                  />
                </div>
              ))}
              <button
                onClick={updateProfile}
                style={{ width: "100%", padding: "12px", background: currentThemeObj.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "15px", fontWeight: "500" }}
              >
                <Icons.Save /> {t("common.save")}
              </button>
            </div>
          )}

          {/* Tab: Security */}
          {activeTab === "security" && (
            <div style={{ background: currentThemeObj.surface, borderRadius: "20px", padding: "32px", border: `1px solid ${currentThemeObj.border}`, animation: "fadeInUp 0.3s ease" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: currentThemeObj.textSecondary, display: "block", marginBottom: "8px", fontSize: "14px" }}>{t("profile.newPassword")}</label>
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={{ width: "100%", padding: "12px", background: currentThemeObj.surfaceHover, border: `1px solid ${currentThemeObj.border}`, borderRadius: "10px", color: currentThemeObj.text, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ color: currentThemeObj.textSecondary, display: "block", marginBottom: "8px", fontSize: "14px" }}>{t("profile.confirmPassword")}</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} style={{ width: "100%", padding: "12px", background: currentThemeObj.surfaceHover, border: `1px solid ${currentThemeObj.border}`, borderRadius: "10px", color: currentThemeObj.text, boxSizing: "border-box" }} />
              </div>
              <button
                onClick={changePassword}
                style={{ width: "100%", padding: "12px", background: currentThemeObj.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "15px", fontWeight: "500" }}
              >
                <Icons.Key /> {t("profile.changePassword")}
              </button>

              <div style={{ marginTop: "32px", padding: "20px", background: "rgba(239,68,68,0.08)", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <Icons.AlertTriangle />
                  <div>
                    <div style={{ color: "#f87171", fontWeight: "bold", fontSize: "15px" }}>{t("profile.dangerZone")}</div>
                    <div style={{ color: currentThemeObj.textSecondary, fontSize: "12px", marginTop: "2px" }}>{t("profile.logoutAllWarning")}</div>
                  </div>
                </div>
                <button
                  onClick={logoutAllDevices}
                  style={{ width: "100%", padding: "10px", background: "#b91c1c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", fontWeight: "500" }}
                >
                  <Icons.LogOut /> {t("profile.logoutAllDevices")}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Activity */}
          {activeTab === "activity" && (
            <div style={{ background: currentThemeObj.surface, borderRadius: "20px", padding: "32px", border: `1px solid ${currentThemeObj.border}`, animation: "fadeInUp 0.3s ease" }}>
              <h3 style={{ color: currentThemeObj.text, marginBottom: "20px", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.BarChart2 /> {t("profile.personalStats")}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {[
                  { Icon: Icons.TrendingUp, value: formatCurrency(stats.totalSales), label: t("profile.revenueGenerated"), color: currentThemeObj.accent },
                  { Icon: Icons.ClipboardList, value: stats.totalOrders, label: t("common.orders"), color: currentThemeObj.primary },
                  { Icon: Icons.Users, value: stats.totalClients, label: t("common.clients"), color: currentThemeObj.secondary },
                  { Icon: Icons.Clock, value: stats.memberSince, label: t("profile.memberSince"), color: "#f59e0b" },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "16px", background: currentThemeObj.surfaceHover, borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: item.color }}><item.Icon /></div>
                    <div style={{ fontSize: "22px", color: item.color, fontWeight: "bold" }}>{item.value}</div>
                    <div style={{ fontSize: "11px", color: currentThemeObj.textSecondary, marginTop: "4px" }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px", background: currentThemeObj.surfaceHover, borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ color: currentThemeObj.primary }}><Icons.Shield /></span>
                  <div>
                    <div style={{ color: currentThemeObj.text, fontWeight: "bold" }}>{t("profile.currentSession")}</div>
                    <div style={{ color: currentThemeObj.textSecondary, fontSize: "12px" }}>
                      {t("profile.connectedSince")} {new Date().toLocaleString(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US')}
                    </div>
                  </div>
                </div>
                <div style={{ height: "4px", background: currentThemeObj.border, borderRadius: "2px", marginTop: "8px" }}>
                  <div style={{ width: "100%", height: "4px", background: currentThemeObj.accent, borderRadius: "2px" }} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}