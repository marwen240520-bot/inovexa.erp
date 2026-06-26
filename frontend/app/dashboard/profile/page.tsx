"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme, THEMES } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";

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
  User: ({ size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { theme: globalTheme, themeId: globalThemeId, setTheme: setGlobalTheme } = useTheme();
  const { isMobile } = useResponsive();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalClients: 0,
    memberSince: "",
    lastLogin: new Date().toLocaleString()
  });

  const currentTheme = globalTheme;
  const currentThemeId = globalThemeId;

  const themeTranslations = {
    fr: { themeChanged: "Théme changé", chooseTheme: "Choisir un théme" },
    en: { themeChanged: "Theme changed", chooseTheme: "Choose a theme" },
    es: { themeChanged: "Tema cambiado", chooseTheme: "Elegir un tema" }
  };
  const themeT = themeTranslations[language as keyof typeof themeTranslations] || themeTranslations.fr;

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeTheme = (themeId: string) => {
    setGlobalTheme(themeId);
    setShowThemeMenu(false);
    showMessage(`${themeT.themeChanged}`, "success");
  };

  const getThemeName = (themeId: string) => {
    const themesMap: Record<string, Record<string, string>> = {
      dark: { fr: "Sombre", en: "Dark", es: "Oscuro" },
      light: { fr: "Clair", en: "Light", es: "Claro" },
      lightPremium: { fr: "Premium Clair", en: "Premium Light", es: "Premium Claro" },
      blue: { fr: "Bleu Océan", en: "Ocean Blue", es: "Azul Océano" },
      purple: { fr: "Violet", en: "Purple", es: "Pérpura" },
      green: { fr: "Forét", en: "Forest", es: "Bosque" },
      sunset: { fr: "Coucher de Soleil", en: "Sunset", es: "Atardecer" },
      rose: { fr: "Rose", en: "Rose", es: "Rosa" }
    };
    return themesMap[themeId]?.[language as keyof typeof themesMap.dark] || themeId;
  };

  const getThemeIcon = (themeId: string) => {
    const icons: Record<string, JSX.Element> = {
      dark: <Icons.Moon />,
      blue: <Icons.Waves />,
      sunset: <Icons.Sunset />,
    };
    return icons[themeId] || <Icons.Moon />;
  };

  const loadUserFromBackend = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
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
        setProfileImage(freshUser.avatar || freshUser.profileImage || null);
      } else {
        const userData = localStorage.getItem("user");
        if (userData) {
          const u = JSON.parse(userData);
          setUser(u);
          setForm({ name: u.name || "", email: u.email || "", phone: u.phone || "", companyName: u.companyName || "" });
          setProfileImage(u.avatar || u.profileImage || null);
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
      const salesRes = await fetch(`${API_URL}/sales`, { headers: { Authorization: `Bearer ${token}` } });
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

      const ordersRes = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
      let orders = await ordersRes.json();
      orders = Array.isArray(orders) ? orders : [];
      let userOrders = orders;
      if (currentUser.role !== 'admin') {
        userOrders = orders.filter(o => o.userId === currentUser.id || o.createdBy === currentUser.id);
      }

      const clientsRes = await fetch(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const freshUser = await loadUserFromBackend();
        if (freshUser) { setUser(freshUser); setProfileImage(freshUser.avatar || freshUser.profileImage || null); }
        showMessage(t("profile.profileUpdated") || "? Profil mis é jour", "success");
      } else { showMessage(t("common.error") || "? Erreur", "error"); }
    } catch(e) { showMessage(t("common.error") || "? Erreur de connexion", "error"); }
  };

  const uploadProfileImage = async (file: File) => {
    const token = localStorage.getItem("token");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_URL}/upload/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        const filename = data.avatar || data.filename || data.url;
        if (filename) {
          setProfileImage(filename);
          setImageTimestamp(Date.now());
          const freshUser = await loadUserFromBackend();
          if (freshUser) setUser(freshUser);
          showMessage("? Photo de profil mise é jour", "success");
        } else {
          showMessage(" Image uploadée", "warning");
        }
      } else {
        const error = await res.json();
        showMessage(error.message || "? Erreur lors de l'upload", "error");
      }
    } catch(e) {
      console.error("Erreur upload:", e);
      showMessage("? Erreur de connexion", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteProfileImage = async () => {
    const token = localStorage.getItem("token");
    setDeletingImage(true);
    try {
      const res = await fetch(`${API_URL}/upload/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setProfileImage(null);
        setImageTimestamp(Date.now());
        const freshUser = await loadUserFromBackend();
        if (freshUser) setUser(freshUser);
        showMessage("? Photo de profil supprimée", "success");
      } else {
        showMessage("? Erreur lors de la suppression", "error");
      }
    } catch(e) {
      console.error("Erreur suppression:", e);
      showMessage("? Erreur de connexion", "error");
    } finally {
      setDeletingImage(false);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^(image\/jpeg|image\/png|image\/webp)$/)) { 
      showMessage("Veuillez sélectionner une image JPEG, PNG ou WEBP", "error"); 
      return; 
    }
    if (file.size > 5 * 1024 * 1024) { 
      showMessage("L'image ne doit pas dépasser 5MB", "error"); 
      return; 
    }
    uploadProfileImage(file);
    e.target.value = "";
  };

  const changePassword = async () => {
    if (!passwordForm.oldPassword) {
      showMessage(t("profile.oldPasswordRequired") || "Veuillez entrer votre mot de passe actuel", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage(t("profile.passwordMismatch") || "Les mots de passe ne correspondent pas", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showMessage(t("profile.passwordMinLength") || "Le mot de passe doit contenir au moins 6 caractéres", "error");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      if (res.ok) {
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        showMessage(t("profile.passwordChanged") || "? Mot de passe changé", "success");
      } else {
        const err = await res.json();
        showMessage(err.message || t("common.error") || "? Erreur", "error");
      }
    } catch(e) {
      showMessage(t("common.error") || "? Erreur de connexion", "error");
    }
  };

  const logoutAllDevices = async () => {
    if (confirm(t("profile.logoutAllWarning") || " Se déconnecter de tous les appareils ")) {
      const token = localStorage.getItem("token");
      try {
        await fetch(`${API_URL}/users/logout-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        localStorage.clear();
        router.push("/");
      } catch(e) { console.error(e); }
    }
  };

  const showMessage = (msg: string, type: "success" | "error" | "warning") => {
    setMessage(msg); 
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : "?";
  const getRandomColor = () => {
    const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec489a"];
    return colors[(user?.name?.length || 0) % colors.length];
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Icons.Crown />;
    if (role === "transporteur") return <Icons.Truck />;
    return <Icons.User />;
  };

  const getRoleText = (role: string) => {
    if (role === "admin") return t("profile.admin") || "Administrateur";
    if (role === "transporteur") return t("profile.transporter") || "Transporteur";
    return t("profile.client") || "Client";
  };

  const getImageUrl = () => {
    if (!profileImage) return null;
    if (profileImage.includes('/uploads/')) {
      return `${API_URL}${profileImage}?t=${imageTimestamp}`;
    }
    if (profileImage.startsWith('http')) {
      return `${profileImage}?t=${imageTimestamp}`;
    }
    return `${API_URL}/uploads/avatars/${profileImage}?t=${imageTimestamp}`;
  };

  const imageUrl = getImageUrl();

  const responsive = {
    contentPadding: isMobile ? "16px" : "32px",
    cardPadding: isMobile ? "20px" : "32px",
    avatarSize: isMobile ? "80px" : "100px",
    titleSize: isMobile ? "24px" : "32px"
  };

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  `;

  if (loading) {
    return (
      <div style={{ background: currentTheme.background, minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <Icons.Spinner color={currentTheme.primary} size={isMobile ? 40 : 48} />
          <p style={{ marginTop: "16px", color: currentTheme.textSecondary, fontSize: isMobile ? "13px" : "14px" }}>{t("common.loading") || "Chargement..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: currentTheme.background, display: "flex" }}>
      <style>{animations}</style>
      
      <Sidebar />
      
      <div style={{ 
        marginLeft: "0px",
        flex: 1, 
        padding: isMobile ? `${responsive.contentPadding} ${responsive.contentPadding} 80px ${responsive.contentPadding}` : responsive.contentPadding,
        paddingTop: isMobile ? "12px" : responsive.contentPadding,
        paddingBottom: isMobile ? "70px" : responsive.contentPadding
      }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ 
            marginBottom: isMobile ? "24px" : "32px", 
            animation: "fadeInDown 0.5s ease", 
            opacity: animateCards ? 1 : 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "16px" : "0"
          }}>
            <div>
              <h1 style={{ color: currentTheme.text, fontSize: responsive.titleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                <Icons.User size={isMobile ? 24 : 28} />
                {t("common.profile") || "Mon Profil"}
              </h1>
              <p style={{ color: currentTheme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>
                {user?.email}
              </p>
            </div>
            
            {/* Bouton Théme */}
            <div style={{ position: "relative" }} ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  gap: isMobile ? "4px" : "8px",
                  padding: isMobile ? "6px 10px" : "8px 16px",
                  width: isMobile ? "160px" : "210px",
                  maxWidth: isMobile ? "90vw" : "none",
                  background: currentTheme.surface, 
                  border: `1px solid ${currentTheme.border}`, 
                  borderRadius: "30px", 
                  color: currentTheme.text, 
                  cursor: "pointer", 
                  fontSize: isMobile ? "11px" : "13px",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ color: currentTheme.primary, display: "flex", alignItems: "center" }}>{getThemeIcon(currentThemeId)}</span>
                {!isMobile && <span>{getThemeName(currentThemeId)}</span>}
                <Icons.ChevronDown />
              </button>

              {showThemeMenu && (
                <div style={{ 
                  position: "absolute", 
                  top: "calc(100% + 8px)", 
                  right: isMobile ? "-10px" : "0",
                  left: isMobile ? "-10px" : "auto",
                  background: currentTheme.surface, 
                  border: `1px solid ${currentTheme.border}`, 
                  borderRadius: "16px", 
                  padding: "8px", 
                  minWidth: isMobile ? "calc(100% + 20px)" : "210px", 
                  zIndex: 100, 
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)", 
                  animation: "fadeInUp 0.2s ease",
                  maxHeight: "400px",
                  overflowY: "auto"
                }}>
                  <div style={{ padding: "8px 12px", borderBottom: `1px solid ${currentTheme.border}`, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icons.Palette />
                    <span style={{ color: currentTheme.textSecondary, fontSize: isMobile ? "11px" : "12px" }}>
                      {themeT.chooseTheme}
                    </span>
                  </div>
                  {Object.keys(THEMES).map((key) => (
                    <button
                      key={key}
                      onClick={() => changeTheme(key)}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        width: "100%", 
                        padding: isMobile ? "8px 10px" : "10px 12px", 
                        background: currentThemeId === key ? `${currentTheme.primary}20` : "transparent", 
                        border: "none", 
                        borderRadius: "10px", 
                        color: currentTheme.text, 
                        cursor: "pointer", 
                        transition: "all 0.2s", 
                        marginBottom: "2px",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ color: THEMES[key]?.primary, fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center" }}>{getThemeIcon(key)}</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: isMobile ? "12px" : "13px", fontWeight: currentThemeId === key ? "bold" : "normal" }}>{getThemeName(key)}</div>
                        <div style={{ width: "100%", height: "3px", background: THEMES[key]?.gradient, borderRadius: "3px", marginTop: "4px" }} />
                      </div>
                      {currentThemeId === key && <span style={{ color: currentTheme.primary, display: "flex", alignItems: "center" }}><Icons.Check /></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Avatar section */}
          <div style={{ marginBottom: isMobile ? "24px" : "32px", animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: isMobile ? "center" : "center", gap: isMobile ? "20px" : "24px", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
              
              {/* Avatar avec upload et suppression */}
              <div style={{ position: "relative" }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/jpeg,image/png,image/webp" 
                  style={{ display: "none" }} 
                />
                
                <div 
                  onClick={handleImageClick}
                  style={{ 
                    cursor: "pointer",
                    position: "relative",
                    width: isMobile ? "80px" : "100px",
                    height: isMobile ? "80px" : "100px"
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Profile"
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        borderRadius: "50%", 
                        objectFit: "cover",
                        objectPosition: "center",
                        border: `3px solid ${currentTheme.primary}`,
                        background: currentTheme.surface,
                        display: "block",
                        transition: "transform 0.3s, box-shadow 0.3s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = `0 0 20px ${currentTheme.primary}80`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                      onError={() => setProfileImage(null)}
                    />
                  ) : (
                    <div
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        borderRadius: "50%", 
                        background: `linear-gradient(135deg, ${getRandomColor()} 0%, #764ba2 100%)`, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: isMobile ? "36px" : "48px", 
                        color: "white",
                        transition: "transform 0.3s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      {getInitials(user?.name)}
                    </div>
                  )}

                  {/* Camera badge */}
                  <div
                    style={{ 
                      position: "absolute", 
                      bottom: "0", 
                      right: "0", 
                      background: currentTheme.primary, 
                      borderRadius: "50%", 
                      width: isMobile ? "24px" : "28px", 
                      height: isMobile ? "24px" : "28px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      border: `2px solid ${currentTheme.background}`, 
                      cursor: "pointer", 
                      color: "white",
                      fontSize: isMobile ? "12px" : "14px",
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <Icons.Camera />
                  </div>

                  {uploadingImage && (
                    <div style={{ 
                      position: "absolute", 
                      top: "50%", 
                      left: "50%", 
                      transform: "translate(-50%, -50%)", 
                      background: "rgba(0,0,0,0.7)", 
                      borderRadius: "50%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      width: "100%",
                      height: "100%"
                    }}>
                      <Icons.Spinner color="white" size={24} />
                    </div>
                  )}
                </div>

                {/* Bouton Supprimer */}
                {imageUrl && (
                  <button
                    onClick={deleteProfileImage}
                    disabled={deletingImage}
                    style={{
                      position: "absolute",
                      bottom: "-8px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "20px",
                      padding: isMobile ? "4px 12px" : "6px 16px",
                      fontSize: isMobile ? "10px" : "12px",
                      cursor: deletingImage ? "not-allowed" : "pointer",
                      opacity: deletingImage ? 0.6 : 1,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {deletingImage ? "?" : ""} {t("common.delete") || "Supprimer"}
                  </button>
                )}
              </div>

              {/* Infos utilisateur */}
              <div style={{ textAlign: isMobile ? "center" : "left", flex: 1 }}>
                <h2 style={{ color: currentTheme.text, fontSize: isMobile ? "20px" : "24px", marginBottom: "4px" }}>{user?.name}</h2>
                <p style={{ color: currentTheme.textSecondary, margin: "4px 0 0 0", display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: "6px", fontSize: isMobile ? "13px" : "14px" }}>
                  {getRoleIcon(user?.role)} {getRoleText(user?.role)}
                </p>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                  <span style={{ color: currentTheme.textSecondary, fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Icons.Calendar /> {t("profile.memberSince") || "Membre depuis"} {stats.memberSince}
                  </span>
                  <span style={{ color: currentTheme.textSecondary, fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Icons.Lock /> {t("profile.lastLogin") || "Derniére connexion"}: {stats.lastLogin}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{ 
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : messageType === "warning" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", 
              border: `1px solid ${messageType === "success" ? "#10b981" : messageType === "warning" ? "#f59e0b" : "#ef4444"}`, 
              color: messageType === "success" ? "#10b981" : messageType === "warning" ? "#f59e0b" : "#f87171", 
              padding: "12px", 
              borderRadius: "12px", 
              marginBottom: "20px", 
              textAlign: "center", 
              animation: "fadeInUp 0.3s ease", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "8px", 
              fontSize: isMobile ? "12px" : "14px" 
            }}>
              {messageType === "success" ? <Icons.CheckCircle /> : messageType === "warning" ? <Icons.AlertTriangle /> : <Icons.XCircle />}
              {message}
            </div>
          )}

          {/* Tabs */}
          <div style={{ 
            display: "flex", 
            gap: "8px", 
            marginBottom: "24px", 
            borderBottom: `1px solid ${currentTheme.border}`, 
            overflowX: "auto", 
            animation: `fadeInUp 0.5s ease 0.3s`, 
            opacity: animateCards ? 1 : 0 
          }}>
            {[
              { id: "info", label: t("profile.personalInfo") || " Informations", Icon: Icons.FileText },
              { id: "security", label: t("profile.security") || " Sécurité", Icon: Icons.ShieldLock },
              { id: "activity", label: t("profile.activity") || " Activité", Icon: Icons.BarChart2 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  padding: isMobile ? "10px 16px" : "12px 20px", 
                  background: activeTab === tab.id ? currentTheme.primary : "transparent", 
                  border: "none", 
                  borderRadius: "12px 12px 0 0", 
                  color: activeTab === tab.id ? "white" : currentTheme.textSecondary, 
                  cursor: "pointer", 
                  transition: "all 0.2s", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "7px", 
                  fontSize: isMobile ? "12px" : "14px", 
                  whiteSpace: "nowrap" 
                }}
              >
                <tab.Icon /> {!isMobile && tab.label}
                {isMobile && (tab.id === "info" ? "Info" : tab.id === "security" ? "Sécurité" : "Activité")}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div style={{ 
              background: currentTheme.surface, 
              borderRadius: "20px", 
              padding: responsive.cardPadding, 
              border: `1px solid ${currentTheme.border}`, 
              animation: "fadeInUp 0.3s ease" 
            }}>
              {[
                { label: t("common.name") || "Nom complet", key: "name", type: "text" },
                { label: t("common.email") || "Email", key: "email", type: "email" },
                { label: t("common.phone") || "Téléphone", key: "phone", type: "tel" },
                { label: t("profile.company") || "Société", key: "companyName", type: "text" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: "20px" }}>
                  <label style={{ color: currentTheme.textSecondary, display: "block", marginBottom: "8px", fontSize: isMobile ? "13px" : "14px" }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form] || ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: isMobile ? "10px" : "12px", 
                      background: currentTheme.surfaceHover, 
                      border: `1px solid ${currentTheme.border}`, 
                      borderRadius: "10px", 
                      color: currentTheme.text, 
                      boxSizing: "border-box", 
                      outline: "none", 
                      fontSize: isMobile ? "13px" : "14px" 
                    }}
                  />
                </div>
              ))}
              <button
                onClick={updateProfile}
                style={{ 
                  width: "100%", 
                  padding: isMobile ? "10px" : "12px", 
                  background: currentTheme.gradient, 
                  color: "white", 
                  border: "none", 
                  borderRadius: "10px", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "8px", 
                  fontSize: isMobile ? "14px" : "15px", 
                  fontWeight: "500" 
                }}
              >
                <Icons.Save /> {t("common.save") || "Enregistrer"}
              </button>
            </div>
          )}

          {/* Tab: Security */}
          {activeTab === "security" && (
            <div style={{ 
              background: currentTheme.surface, 
              borderRadius: "20px", 
              padding: responsive.cardPadding, 
              border: `1px solid ${currentTheme.border}`, 
              animation: "fadeInUp 0.3s ease" 
            }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: currentTheme.textSecondary, display: "block", marginBottom: "8px", fontSize: isMobile ? "13px" : "14px" }}>
                  {t("profile.oldPassword") || "Ancien mot de passe"}
                </label>
                <input 
                  type="password" 
                  value={passwordForm.oldPassword} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} 
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? "10px" : "12px", 
                    background: currentTheme.surfaceHover, 
                    border: `1px solid ${currentTheme.border}`, 
                    borderRadius: "10px", 
                    color: currentTheme.text, 
                    boxSizing: "border-box", 
                    fontSize: isMobile ? "13px" : "14px" 
                  }} 
                />
              </div>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: currentTheme.textSecondary, display: "block", marginBottom: "8px", fontSize: isMobile ? "13px" : "14px" }}>
                  {t("profile.newPassword") || "Nouveau mot de passe"}
                </label>
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={{ 
                  width: "100%", 
                  padding: isMobile ? "10px" : "12px", 
                  background: currentTheme.surfaceHover, 
                  border: `1px solid ${currentTheme.border}`, 
                  borderRadius: "10px", 
                  color: currentTheme.text, 
                  boxSizing: "border-box", 
                  fontSize: isMobile ? "13px" : "14px" 
                }} />
              </div>
              
              <div style={{ marginBottom: "24px" }}>
                <label style={{ color: currentTheme.textSecondary, display: "block", marginBottom: "8px", fontSize: isMobile ? "13px" : "14px" }}>
                  {t("profile.confirmPassword") || "Confirmer le mot de passe"}
                </label>
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} style={{ 
                  width: "100%", 
                  padding: isMobile ? "10px" : "12px", 
                  background: currentTheme.surfaceHover, 
                  border: `1px solid ${currentTheme.border}`, 
                  borderRadius: "10px", 
                  color: currentTheme.text, 
                  boxSizing: "border-box", 
                  fontSize: isMobile ? "13px" : "14px" 
                }} />
              </div>
              
              <button
                onClick={changePassword}
                style={{ 
                  width: "100%", 
                  padding: isMobile ? "10px" : "12px", 
                  background: currentTheme.gradient, 
                  color: "white", 
                  border: "none", 
                  borderRadius: "10px", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "8px", 
                  fontSize: isMobile ? "14px" : "15px", 
                  fontWeight: "500" 
                }}
              >
                <Icons.Key /> {t("profile.changePassword") || "Changer le mot de passe"}
              </button>

              <div style={{ 
                marginTop: "32px", 
                padding: "20px", 
                background: "rgba(239,68,68,0.08)", 
                borderRadius: "12px", 
                border: "1px solid rgba(239,68,68,0.4)" 
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <Icons.AlertTriangle />
                  <div>
                    <div style={{ color: "#f87171", fontWeight: "bold", fontSize: isMobile ? "14px" : "15px" }}>
                      {t("profile.dangerZone") || "Zone de danger"}
                    </div>
                    <div style={{ color: currentTheme.textSecondary, fontSize: isMobile ? "11px" : "12px", marginTop: "2px" }}>
                      {t("profile.logoutAllWarning") || "Déconnexion de tous les appareils"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={logoutAllDevices}
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? "8px" : "10px", 
                    background: "#b91c1c", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "8px", 
                    fontSize: isMobile ? "13px" : "14px", 
                    fontWeight: "500" 
                  }}
                >
                  <Icons.LogOut /> {t("profile.logoutAllDevices") || "Se déconnecter de tous les appareils"}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Activity */}
          {activeTab === "activity" && (
            <div style={{ 
              background: currentTheme.surface, 
              borderRadius: "20px", 
              padding: responsive.cardPadding, 
              border: `1px solid ${currentTheme.border}`, 
              animation: "fadeInUp 0.3s ease" 
            }}>
              <h3 style={{ color: currentTheme.text, marginBottom: "20px", fontSize: isMobile ? "16px" : "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.BarChart2 /> {t("profile.personalStats") || "Statistiques personnelles"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {[
                  { Icon: Icons.TrendingUp, value: formatCurrency(stats.totalSales), label: t("profile.revenueGenerated") || "CA généré", color: currentTheme.accent },
                  { Icon: Icons.ClipboardList, value: stats.totalOrders, label: t("common.orders") || "Commandes", color: currentTheme.primary },
                  { Icon: Icons.Users, value: stats.totalClients, label: t("common.clients") || "Clients", color: currentTheme.secondary },
                  { Icon: Icons.Clock, value: stats.memberSince, label: t("profile.memberSince") || "Membre depuis", color: "#f59e0b" },
                ].map((item, i) => (
                  <div key={i} style={{ padding: isMobile ? "12px" : "16px", background: currentTheme.surfaceHover, borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: item.color }}><item.Icon /></div>
                    <div style={{ fontSize: isMobile ? "18px" : "22px", color: item.color, fontWeight: "bold" }}>{item.value}</div>
                    <div style={{ fontSize: isMobile ? "10px" : "11px", color: currentTheme.textSecondary, marginTop: "4px" }}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px", background: currentTheme.surfaceHover, borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span style={{ color: currentTheme.primary }}><Icons.Shield /></span>
                  <div>
                    <div style={{ color: currentTheme.text, fontWeight: "bold", fontSize: isMobile ? "13px" : "14px" }}>
                      {t("profile.currentSession") || "Session actuelle"}
                    </div>
                    <div style={{ color: currentTheme.textSecondary, fontSize: isMobile ? "10px" : "12px" }}>
                      {t("profile.connectedSince") || "Connecté depuis"} {new Date().toLocaleString(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US')}
                    </div>
                  </div>
                </div>
                <div style={{ height: "4px", background: currentTheme.border, borderRadius: "2px", marginTop: "8px" }}>
                  <div style={{ width: "100%", height: "4px", background: currentTheme.accent, borderRadius: "2px" }} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}