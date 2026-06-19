"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

// Types
interface Shipment {
  id: number;
  trackingNumber: string;
  clientName: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface NotificationType {
  id: number;
  message: string;
  time: string;
  read: boolean;
  type: string;
  color: string;
}

interface Stats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
}

// Icônes SVG
const Ic = {
  Truck: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Package: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 1 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Clock: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  CheckCircle: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  BarChart: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Star: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Trophy: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  Bell: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  RefreshCw: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Calendar: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Clock2: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  User: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  MapPin: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  TrendingUp: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  AlertTriangle: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Loader: ({ size = 40, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" style={{ animation: "spin 1s linear infinite" }}>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Menu: ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

export default function TransporteurDashboard() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [animateCards, setAnimateCards] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [periodData, setPeriodData] = useState<{ labels: string[]; deliveries: number[]; completed: number[] }>({ labels: [], deliveries: [], completed: [] });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [selectedChart, setSelectedChart] = useState("deliveries");
  const [hoveredShipment, setHoveredShipment] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
      'common.error': { fr: 'Erreur', en: 'Error', es: 'Error' },
      'dashboard.greeting_morning': { fr: 'Bonjour', en: 'Good morning', es: 'Buenos días' },
      'dashboard.greeting_afternoon': { fr: 'Bon après-midi', en: 'Good afternoon', es: 'Buenas tardes' },
      'dashboard.greeting_evening': { fr: 'Bonsoir', en: 'Good evening', es: 'Buenas noches' },
      'dashboard.completed_deliveries': { fr: 'livraisons complétées', en: 'completed deliveries', es: 'entregas completadas' },
      'dashboard.pending_notification': { fr: 'livraison(s) en attente', en: 'pending delivery(ies)', es: 'entrega(s) pendiente(s)' },
      'dashboard.all_up_to_date': { fr: 'Tout est à jour', en: 'All up to date', es: 'Todo está al día' },
      'dashboard.refresh': { fr: 'Actualiser', en: 'Refresh', es: 'Actualizar' },
      'dashboard.notifications_title': { fr: 'Notifications', en: 'Notifications', es: 'Notificaciones' },
      'dashboard.now': { fr: 'Maintenant', en: 'Now', es: 'Ahora' },
      'dashboard.today': { fr: "Aujourd'hui", en: 'Today', es: 'Hoy' },
      'dashboard.shipment': { fr: 'Livraison', en: 'Shipment', es: 'Envío' },
      'dashboard.delivered_status': { fr: 'livrée', en: 'delivered', es: 'entregado' },
      'dashboard.in_transit_status': { fr: 'en transit', en: 'in transit', es: 'en tránsito' },
      'dashboard.pending_status': { fr: 'en attente', en: 'pending', es: 'pendiente' },
      'dashboard.total_deliveries': { fr: 'Livraisons totales', en: 'Total deliveries', es: 'Entregas totales' },
      'dashboard.pending': { fr: 'En attente', en: 'Pending', es: 'Pendientes' },
      'dashboard.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'dashboard.delivered': { fr: 'Livrées', en: 'Delivered', es: 'Entregadas' },
      'dashboard.success_rate': { fr: 'Taux de réussite', en: 'Success rate', es: 'Tasa de éxito' },
      'dashboard.performance': { fr: 'Performance', en: 'Performance', es: 'Rendimiento' },
      'dashboard.to_process': { fr: 'À traiter', en: 'To process', es: 'Por procesar' },
      'dashboard.in_progress': { fr: 'En cours', en: 'In progress', es: 'En progreso' },
      'dashboard.excellent': { fr: 'Excellent', en: 'Excellent', es: 'Excelente' },
      'dashboard.to_improve': { fr: 'À améliorer', en: 'To improve', es: 'Por mejorar' },
      'dashboard.progressing': { fr: 'Progression', en: 'Progressing', es: 'Progresando' },
      'dashboard.new': { fr: 'Nouveau', en: 'New', es: 'Nuevo' },
      'dashboard.delivery_evolution': { fr: 'Évolution des livraisons', en: 'Delivery evolution', es: 'Evolución de entregas' },
      'dashboard.week': { fr: 'Semaine', en: 'Week', es: 'Semana' },
      'dashboard.month': { fr: 'Mois', en: 'Month', es: 'Mes' },
      'dashboard.year': { fr: 'Année', en: 'Year', es: 'Año' },
      'dashboard.no_data': { fr: 'Aucune donnée disponible', en: 'No data available', es: 'No hay datos disponibles' },
      'dashboard.assigned_shipments': { fr: 'Livraisons assignées', en: 'Assigned shipments', es: 'Envíos asignados' },
      'dashboard.completed_shipments': { fr: 'Livraisons complétées', en: 'Completed shipments', es: 'Entregas completadas' },
      'dashboard.my_deliveries': { fr: 'Mes livraisons', en: 'My deliveries', es: 'Mis entregas' },
      'dashboard.all': { fr: 'Toutes', en: 'All', es: 'Todas' },
      'dashboard.no_deliveries': { fr: 'Aucune livraison assignée', en: 'No deliveries assigned', es: 'No hay entregas asignadas' },
      'dashboard.admin_will_assign': { fr: 'Un administrateur vous assignera des livraisons', en: 'An administrator will assign deliveries to you', es: 'Un administrador le asignará entregas' },
      'status.delivered': { fr: 'Livrée', en: 'Delivered', es: 'Entregado' },
      'status.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'status.pending': { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
      'shipments.unknown_client': { fr: 'Client inconnu', en: 'Unknown client', es: 'Cliente desconocido' },
      'shipments.no_address': { fr: 'Adresse non disponible', en: 'Address not available', es: 'Dirección no disponible' },
    };
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/auth/login"); return; }
    if (userData) {
      try {
        const u = JSON.parse(userData);
        if (u.role !== "transporteur") { router.push("/dashboard"); return; }
        setUser(u);
      } catch (e) { router.push("/auth/login"); return; }
    }
    fetchData();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  useEffect(() => { processPeriodData(); }, [selectedPeriod, shipments]);

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return getTranslation("dashboard.greeting_morning");
    if (hour < 18) return getTranslation("dashboard.greeting_afternoon");
    return getTranslation("dashboard.greeting_evening");
  };

  const getStatusColor = (status: string): string => {
    if (status === "delivered") return "#10b981";
    if (status === "in_transit") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    return "#94a3b8";
  };

  const getStatusText = (status: string): string => {
    if (status === "delivered") return getTranslation("status.delivered");
    if (status === "in_transit") return getTranslation("status.in_transit");
    if (status === "pending") return getTranslation("status.pending");
    return status;
  };

  const getStatusIcon = (status: string) => {
    if (status === "delivered") return <Ic.CheckCircle size={16} color="#10b981" />;
    if (status === "in_transit") return <Ic.Truck size={16} color="#3b82f6" />;
    return <Ic.Clock size={16} color="#f59e0b" />;
  };

  const getNotifIcon = (type: string, color: string) => {
    if (type === "warning") return <Ic.AlertTriangle size={14} color={color} />;
    if (type === "success") return <Ic.CheckCircle size={14} color={color} />;
    return <Ic.Package size={14} color={color} />;
  };

  const getCurrentDate = () => {
    const now = new Date();
    const locale = language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US";
    return now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getFormattedTime = () => {
    const locale = language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US";
    return currentTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const shipmentsRes = await fetch("http://localhost:3001/transporteur/shipments", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const statsRes = await fetch("http://localhost:3001/transporteur/stats", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (shipmentsRes.ok) {
        const data = await shipmentsRes.json();
        const arr = Array.isArray(data) ? data : [];
        setShipments(arr);
        
        const pendingCount = arr.filter((s: Shipment) => s.status === "pending").length;
        if (pendingCount > 0) {
          setNotifications([
            { id: 1, message: `${pendingCount} ${getTranslation("dashboard.pending_notification")}`, time: getTranslation("dashboard.now"), read: false, type: "warning", color: "#f59e0b" },
            { id: 2, message: `${arr.length} ${getTranslation("dashboard.assigned_shipments")}`, time: getTranslation("dashboard.today"), read: false, type: "info", color: "#667eea" }
          ]);
        }
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({ 
          total: data.total || 0, 
          pending: data.pending || 0, 
          inTransit: data.inTransit || 0, 
          delivered: data.delivered || 0, 
          cancelled: data.cancelled || 0 
        });
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const processPeriodData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let labels: string[] = [];
    let deliveries: number[] = [];
    let completed: number[] = [];

    const safeDate = (val: any): Date | null => { 
      if (!val) return null; 
      const d = new Date(val); 
      return isNaN(d.getTime()) ? null : d; 
    };

    if (selectedPeriod === "week") {
      for (let i = 5; i >= 0; i--) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - i * 7);
        labels.push(`S${getWeekNumber(weekDate)}`);
        const weekStart = new Date(weekDate);
        weekStart.setDate(weekDate.getDate() - weekDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        deliveries.push(shipments.filter(s => {
          const sd = safeDate(s.createdAt);
          return sd && sd >= weekStart && sd <= weekEnd;
        }).length);
        completed.push(shipments.filter(s => {
          const sd = safeDate(s.updatedAt || s.createdAt);
          return s.status === "delivered" && sd && sd >= weekStart && sd <= weekEnd;
        }).length);
      }
    } else if (selectedPeriod === "month") {
      for (let i = 5; i >= 0; i--) {
        const monthIndex = currentMonth - i;
        const year = monthIndex < 0 ? currentYear - 1 : currentYear;
        const realMonthIndex = ((monthIndex % 12) + 12) % 12;
        const date = new Date(year, realMonthIndex, 1);
        const locale = language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US";
        labels.push(date.toLocaleDateString(locale, { month: 'short' }));
        const monthStart = new Date(year, realMonthIndex, 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(year, realMonthIndex + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        deliveries.push(shipments.filter(s => {
          const sd = safeDate(s.createdAt);
          return sd && sd >= monthStart && sd <= monthEnd;
        }).length);
        completed.push(shipments.filter(s => {
          const sd = safeDate(s.updatedAt || s.createdAt);
          return s.status === "delivered" && sd && sd >= monthStart && sd <= monthEnd;
        }).length);
      }
    } else {
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        labels.push(year.toString());
        const yearStart = new Date(year, 0, 1);
        yearStart.setHours(0, 0, 0, 0);
        const yearEnd = new Date(year, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);
        
        deliveries.push(shipments.filter(s => {
          const sd = safeDate(s.createdAt);
          return sd && sd >= yearStart && sd <= yearEnd;
        }).length);
        completed.push(shipments.filter(s => {
          const sd = safeDate(s.updatedAt || s.createdAt);
          return s.status === "delivered" && sd && sd >= yearStart && sd <= yearEnd;
        }).length);
      }
    }

    setPeriodData({ labels, deliveries, completed });
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/transporteur/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setShipments(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        setStats(prev => {
          const newStats = { ...prev };
          const oldShipment = shipments.find(s => s.id === id);
          if (oldShipment) {
            if (oldShipment.status === "pending") newStats.pending--;
            else if (oldShipment.status === "in_transit") newStats.inTransit--;
            else if (oldShipment.status === "delivered") newStats.delivered--;
          }
          if (newStatus === "pending") newStats.pending++;
          else if (newStatus === "in_transit") newStats.inTransit++;
          else if (newStatus === "delivered") newStats.delivered++;
          return newStats;
        });
        let statusMessage = "";
        if (newStatus === "delivered") statusMessage = getTranslation("dashboard.delivered_status");
        else if (newStatus === "in_transit") statusMessage = getTranslation("dashboard.in_transit_status");
        else statusMessage = getTranslation("dashboard.pending_status");
        
        setNotifications(prev => [{
          id: Date.now(),
          message: `${getTranslation("dashboard.shipment")} ${id} ${statusMessage}`,
          time: getTranslation("dashboard.now"),
          read: false,
          type: newStatus === "delivered" ? "success" : newStatus === "in_transit" ? "info" : "warning",
          color: newStatus === "delivered" ? "#10b981" : newStatus === "in_transit" ? "#3b82f6" : "#f59e0b"
        }, ...prev].slice(0, 10));
      } else { alert(getTranslation("common.error")); }
    } catch (err) { console.error(err); alert(getTranslation("common.error")); }
  };

  const successRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(0) : "0";
  const maxDeliveries = Math.max(...periodData.deliveries, ...periodData.completed, 1);

  const statsCards = [
    { Icon: Ic.Package, label: getTranslation("dashboard.total_deliveries"), value: stats.total, color: "#667eea", trend: stats.total > 0 ? `+${stats.total}` : "0" },
    { Icon: Ic.Clock, label: getTranslation("dashboard.pending"), value: stats.pending, color: "#f59e0b", trend: stats.pending > 0 ? getTranslation("dashboard.to_process") : "OK" },
    { Icon: Ic.Truck, label: getTranslation("dashboard.in_transit"), value: stats.inTransit, color: "#3b82f6", trend: getTranslation("dashboard.in_progress") },
    { Icon: Ic.CheckCircle, label: getTranslation("dashboard.delivered"), value: stats.delivered, color: "#10b981", trend: `${successRate}% ${getTranslation("dashboard.success_rate")}` },
    { Icon: Ic.BarChart, label: getTranslation("dashboard.success_rate"), value: successRate, suffix: "%", color: "#8b5cf6", trend: Number(successRate) >= 80 ? getTranslation("dashboard.excellent") : getTranslation("dashboard.to_improve") },
    { Icon: Ic.Star, label: getTranslation("dashboard.performance"), value: stats.delivered > 0 ? Math.min(5, (stats.delivered / Math.max(stats.total, 1)) * 5).toFixed(1) : "0", suffix: "/5", color: "#f59e0b", trend: stats.delivered > 5 ? getTranslation("dashboard.progressing") : getTranslation("dashboard.new") }
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <div style={{ textAlign: "center" }}>
          <Ic.Loader size={40} color="#667eea" />
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "14px" }}>{getTranslation("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: isMobile ? "16px" : "22px", 
      background: "#0a0a0a", 
      minHeight: "100vh",
      paddingBottom: isMobile ? "80px" : "22px"
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .stats-card-value {
            font-size: 22px !important;
          }
          .stats-card {
            padding: 14px !important;
          }
          .chart-container {
            padding: 16px !important;
          }
          .chart-bars {
            gap: 4px !important;
          }
          .filter-buttons {
            flex-wrap: wrap !important;
          }
          h1 {
            font-size: 20px !important;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: isMobile ? "20px" : "29px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "11px", flexWrap: "wrap" }}>
              <h1 style={{ color: "white", fontSize: isMobile ? "20px" : "25px", margin: 0, display: "flex", alignItems: "center", gap: "11px" }}>
                <Ic.Truck size={isMobile ? 24 : 28} color="#667eea" />
                {getGreeting()}, {user?.name?.split(' ')[0] || "Transporteur"} !
              </h1>
              {stats.delivered > 0 && !isMobile && (
                <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", padding: "4px 14px", borderRadius: "18px", fontSize: "11px", color: "white", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Ic.Trophy size={12} color="white" />
                  {stats.delivered} {getTranslation("dashboard.completed_deliveries")}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "7px" }}>
              <p style={{ color: "#94a3b8", margin: 0, display: "flex", alignItems: "center", gap: "7px", fontSize: isMobile ? "11px" : "13px" }}>
                <Ic.Calendar size={isMobile ? 11 : 13} color="#94a3b8" /> {getCurrentDate()}
                <span style={{ color: "#666" }}>•</span>
                <Ic.Clock2 size={isMobile ? 11 : 13} color="#94a3b8" /> {getFormattedTime()}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: stats.pending > 0 ? "#f59e0b" : "#10b981", animation: stats.pending > 0 ? "pulse 1.5s infinite" : "none" }}></span>
                <span style={{ color: "#666", fontSize: isMobile ? "10px" : "11px" }}>
                  {stats.pending > 0 ? `${stats.pending} ${getTranslation("dashboard.pending_notification")}` : getTranslation("dashboard.all_up_to_date")}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "11px", alignItems: "center" }}>
            <button onClick={fetchData} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "36px", padding: isMobile ? "6px 12px" : "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", fontSize: isMobile ? "11px" : "12px" }}>
              <Ic.RefreshCw size={isMobile ? 12 : 14} color="#94a3b8" />
              {!isMobile && <span style={{ color: "#94a3b8" }}>{getTranslation("dashboard.refresh")}</span>}
            </button>

            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "36px", padding: isMobile ? "6px 10px" : "7px 11px", cursor: "pointer", position: "relative" }}>
                <Ic.Bell size={isMobile ? 16 : 18} color="#94a3b8" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", fontSize: "9px", borderRadius: "9px", padding: "2px 5px", minWidth: "16px", textAlign: "center" }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{ position: "absolute", top: "45px", right: 0, width: isMobile ? "280px" : "252px", background: "#111", border: "1px solid #222", borderRadius: "11px", overflow: "hidden", zIndex: 100 }}>
                  <div style={{ padding: "11px 14px", borderBottom: "1px solid #222", color: "white", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <Ic.Bell size={14} color="#667eea" />
                    {getTranslation("dashboard.notifications_title")}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "18px", color: "#666", fontSize: "12px", textAlign: "center" }}>{getTranslation("dashboard.all_up_to_date")}</div>
                  ) : notifications.map(n => (
                    <div key={n.id} style={{ padding: "11px 14px", borderBottom: "1px solid #222", background: n.read ? "transparent" : "rgba(102,126,234,0.1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `${n.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {getNotifIcon(n.type, n.color)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#94a3b8", fontSize: "11px" }}>{n.message}</div>
                          <div style={{ color: "#666", fontSize: "9px", marginTop: "4px" }}>{n.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards - Responsive grid */}
      <div className="stats-grid" style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(160px, 1fr))", 
        gap: isMobile ? "12px" : "18px", 
        marginBottom: isMobile ? "20px" : "29px" 
      }}>
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="stats-card"
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: "linear-gradient(135deg, #111, #1a1a1a)", 
              borderRadius: "18px", 
              padding: isMobile ? "14px" : "18px", 
              textAlign: "center",
              border: `1px solid ${hoveredCard === idx ? card.color : "#222"}`,
              transition: "all 0.3s", 
              transform: !isMobile && hoveredCard === idx ? "translateY(-5px)" : "translateY(0)",
              cursor: "pointer"
            }}
          >
            <card.Icon size={isMobile ? 24 : 30} color={card.color} />
            <div className="stats-card-value" style={{ fontSize: isMobile ? "22px" : "29px", color: card.color, fontWeight: "bold" }}>{card.value}{card.suffix || ""}</div>
            <div style={{ fontSize: isMobile ? "10px" : "11px", color: "#94a3b8", marginTop: "4px" }}>{card.label}</div>
            <div style={{ fontSize: isMobile ? "8px" : "9px", color: card.color, marginTop: "6px", opacity: 0.8 }}>{card.trend}</div>
          </div>
        ))}
      </div>

      {/* Chart Section - Responsive */}
      <div className="chart-container" style={{ 
        background: "#111", 
        borderRadius: "18px", 
        padding: isMobile ? "16px" : "22px", 
        border: "1px solid #222", 
        marginBottom: "22px" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "11px" }}>
          <h3 style={{ color: "white", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontSize: isMobile ? "14px" : "16px" }}>
            <Ic.BarChart size={isMobile ? 16 : 18} color="#667eea" />
            {getTranslation("dashboard.delivery_evolution")}
          </h3>
          <div className="filter-buttons" style={{ display: "flex", gap: "7px", background: "#1a1a1a", padding: "4px", borderRadius: "32px" }}>
            {[
              { id: "week", label: getTranslation("dashboard.week") },
              { id: "month", label: getTranslation("dashboard.month") },
              { id: "year", label: getTranslation("dashboard.year") }
            ].map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                style={{
                  padding: isMobile ? "4px 12px" : "6px 16px", 
                  borderRadius: "28px",
                  background: selectedPeriod === period.id ? "#667eea" : "transparent",
                  color: selectedPeriod === period.id ? "white" : "#94a3b8",
                  border: "none", 
                  cursor: "pointer", 
                  fontSize: isMobile ? "11px" : "12px"
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ 
          minHeight: isMobile ? "250px" : "320px", 
          background: "#0a0a0a", 
          borderRadius: "12px", 
          padding: isMobile ? "20px 12px 12px" : "30px 20px 20px",
          overflowX: "auto"
        }}>
          {periodData.labels.length === 0 ? (
            <div style={{ textAlign: "center", padding: isMobile ? "40px" : "60px", color: "#666" }}>
              <Ic.BarChart size={isMobile ? 30 : 40} color="#333" />
              <p style={{ fontSize: isMobile ? "12px" : "14px" }}>{getTranslation("dashboard.no_data")}</p>
            </div>
          ) : (
            <>
              <div className="chart-bars" style={{ 
                display: "flex", 
                justifyContent: "space-around", 
                alignItems: "flex-end", 
                height: isMobile ? "160px" : "200px", 
                gap: isMobile ? "4px" : "6px",
                minWidth: isMobile ? "400px" : "auto"
              }}>
                {periodData.labels.map((label, idx) => {
                  const deliveriesValue = periodData.deliveries[idx] || 0;
                  const completedValue = periodData.completed[idx] || 0;
                  const deliveriesHeight = deliveriesValue > 0 ? Math.max((deliveriesValue / maxDeliveries) * (isMobile ? 156 : 196), 6) : 2;
                  const completedHeight = completedValue > 0 ? Math.max((completedValue / maxDeliveries) * (isMobile ? 156 : 196), 6) : 2;
                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: isMobile ? "160px" : "200px" }}>
                        <div style={{ width: isMobile ? "clamp(12px, 4vw, 30px)" : "clamp(16px, 3vw, 36px)", height: `${deliveriesHeight}px`, background: "linear-gradient(180deg, #667eea, #764ba2)", borderRadius: "4px 4px 0 0" }}>
                          {deliveriesHeight > 20 && <span style={{ position: "relative", top: "-18px", display: "block", textAlign: "center", fontSize: "8px", color: "#667eea" }}>{deliveriesValue}</span>}
                        </div>
                        <div style={{ width: isMobile ? "clamp(12px, 4vw, 30px)" : "clamp(16px, 3vw, 36px)", height: `${completedHeight}px`, background: "linear-gradient(180deg, #10b981, #059669)", borderRadius: "4px 4px 0 0" }}>
                          {completedHeight > 20 && <span style={{ position: "relative", top: "-18px", display: "block", textAlign: "center", fontSize: "8px", color: "#10b981" }}>{completedValue}</span>}
                        </div>
                      </div>
                      <div style={{ marginTop: "8px", color: "#555", fontSize: isMobile ? "8px" : "9px", textAlign: "center" }}>{label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? "16px" : "32px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #1a1a1a", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "20px", height: "10px", background: "linear-gradient(90deg, #667eea, #764ba2)", borderRadius: "3px" }} />
                  <span style={{ color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("dashboard.assigned_shipments")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "20px", height: "10px", background: "linear-gradient(90deg, #10b981, #059669)", borderRadius: "3px" }} />
                  <span style={{ color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("dashboard.completed_shipments")}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deliveries list - Responsive */}
      <div style={{ background: "#111", borderRadius: "18px", padding: isMobile ? "16px" : "22px", border: "1px solid #222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "11px" }}>
          <h3 style={{ color: "white", margin: 0, display: "flex", alignItems: "center", gap: "7px", fontSize: isMobile ? "12px" : "13px" }}>
            <Ic.Truck size={isMobile ? 14 : 16} color="#667eea" />
            {getTranslation("dashboard.my_deliveries")}
            <span style={{ background: "#667eea20", color: "#667eea", padding: "2px 9px", borderRadius: "18px", fontSize: isMobile ? "10px" : "11px" }}>{shipments.length}</span>
          </h3>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
            {[
              { key: "deliveries", label: getTranslation("dashboard.all"), color: "#667eea" },
              { key: "pending", label: getTranslation("dashboard.pending"), color: "#f59e0b" },
              { key: "transit", label: getTranslation("dashboard.in_transit"), color: "#3b82f6" },
              { key: "delivered", label: getTranslation("dashboard.delivered"), color: "#10b981" }
            ].map(btn => (
              <button key={btn.key} onClick={() => setSelectedChart(btn.key)} style={{ 
                padding: isMobile ? "3px 8px" : "4px 11px", 
                borderRadius: "14px", 
                background: selectedChart === btn.key ? btn.color : "#1a1a1a", 
                border: "none", 
                color: "white", 
                cursor: "pointer", 
                fontSize: isMobile ? "9px" : "10px" 
              }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {shipments.length === 0 ? (
          <div style={{ textAlign: "center", padding: isMobile ? "40px" : "54px" }}>
            <Ic.Truck size={isMobile ? 40 : 58} color="#94a3b8" />
            <p style={{ color: "#94a3b8", fontSize: isMobile ? "12px" : "14px", marginTop: "14px" }}>{getTranslation("dashboard.no_deliveries")}</p>
            <p style={{ color: "#666", fontSize: isMobile ? "10px" : "12px", marginTop: "7px" }}>{getTranslation("dashboard.admin_will_assign")}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", maxHeight: isMobile ? "400px" : "450px", overflowY: "auto" }}>
            {shipments
              .filter(s => {
                if (selectedChart === "pending") return s.status === "pending";
                if (selectedChart === "transit") return s.status === "in_transit";
                if (selectedChart === "delivered") return s.status === "delivered";
                return true;
              })
              .map((shipment) => (
                <div
                  key={shipment.id}
                  onMouseEnter={() => setHoveredShipment(shipment.id)}
                  onMouseLeave={() => setHoveredShipment(null)}
                  style={{ 
                    background: hoveredShipment === shipment.id ? "#1a1a1a" : "transparent", 
                    borderRadius: "14px", 
                    padding: isMobile ? "12px" : "14px", 
                    borderLeft: `4px solid ${getStatusColor(shipment.status)}`, 
                    transition: "all 0.3s" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "11px" }}>
                    <div>
                      <div style={{ color: "white", fontWeight: "bold", fontSize: isMobile ? "12px" : "14px", fontFamily: "monospace" }}>{shipment.trackingNumber}</div>
                      <div style={{ color: "#94a3b8", fontSize: isMobile ? "10px" : "11px", marginTop: "5px", display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                        <Ic.User size={isMobile ? 10 : 11} color="#94a3b8" /> {shipment.clientName || getTranslation("shipments.unknown_client")}
                        <span style={{ color: "#666" }}>•</span>
                        <Ic.MapPin size={isMobile ? 10 : 11} color="#94a3b8" /> {(shipment.address || "").substring(0, isMobile ? 20 : 30) || getTranslation("shipments.no_address")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "11px", flexWrap: "wrap" }}>
                      <div style={{ background: `${getStatusColor(shipment.status)}20`, color: getStatusColor(shipment.status), padding: isMobile ? "3px 8px" : "4px 11px", borderRadius: "18px", fontSize: isMobile ? "9px" : "10px", display: "flex", alignItems: "center", gap: "5px" }}>
                        {getStatusIcon(shipment.status)}
                        {getStatusText(shipment.status)}
                      </div>
                      <select
                        value={shipment.status}
                        onChange={(e) => updateStatus(shipment.id, e.target.value)}
                        style={{ 
                          padding: isMobile ? "4px 8px" : "5px 11px", 
                          background: "#1a1a1a", 
                          border: `1px solid ${getStatusColor(shipment.status)}`, 
                          borderRadius: "7px", 
                          color: getStatusColor(shipment.status), 
                          cursor: "pointer", 
                          fontSize: isMobile ? "10px" : "11px" 
                        }}
                      >
                        <option value="pending">{getTranslation("status.pending")}</option>
                        <option value="in_transit">{getTranslation("status.in_transit")}</option>
                        <option value="delivered">{getTranslation("status.delivered")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}