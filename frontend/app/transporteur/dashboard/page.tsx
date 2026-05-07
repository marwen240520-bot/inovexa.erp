"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── SVG Icon Library ──────────────────────────────────────────────────────────

const Ic = {
  Truck: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Package: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 1 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Clock: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  CheckCircle: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  BarChart: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Star: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Trophy: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  Bell: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  RefreshCw: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Calendar: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Clock2: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  User: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  MapPin: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Activity: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  MessageCircle: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  TrendingUp: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  AlertTriangle: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Loader: ({ size = 40, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  ChevronRight: ({ size = 12, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Zap: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TransporteurDashboard() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [animateCards, setAnimateCards] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [periodData, setPeriodData] = useState({ labels: [], deliveries: [], completed: [] });
  const [hoveredShipment, setHoveredShipment] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedChart, setSelectedChart] = useState("deliveries");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const getTranslation = (key: string): string => {
    const directTranslations: Record<string, Record<string, string>> = {
      'transporteur.dashboard.day': { fr: 'Jour', en: 'Day', es: 'Día' },
      'transporteur.dashboard.week': { fr: 'Semaine', en: 'Week', es: 'Semana' },
      'transporteur.dashboard.month': { fr: 'Mois', en: 'Month', es: 'Mes' },
      'transporteur.dashboard.year': { fr: 'Année', en: 'Year', es: 'Año' },
      'transporteur.dashboard.completed_deliveries': { fr: 'livraisons complétées', en: 'completed deliveries', es: 'entregas completadas' },
      'transporteur.dashboard.pending_notification': { fr: 'livraison(s) en attente', en: 'delivery(ies) pending', es: 'entrega(s) pendiente(s)' },
      'transporteur.dashboard.assigned_notification': { fr: 'livraison(s) assignée(s)', en: 'delivery(ies) assigned', es: 'entrega(s) asignada(s)' },
      'transporteur.dashboard.now': { fr: 'Maintenant', en: 'Now', es: 'Ahora' },
      'transporteur.dashboard.today': { fr: "Aujourd'hui", en: 'Today', es: 'Hoy' },
      'transporteur.dashboard.assigned_shipments': { fr: 'Envois assignés', en: 'Assigned shipments', es: 'Envíos asignados' },
      'transporteur.dashboard.completed_shipments': { fr: 'Envois complétés', en: 'Completed shipments', es: 'Envíos completados' },
      'transporteur.dashboard.to_process': { fr: 'À traiter', en: 'To process', es: 'Por procesar' },
      'transporteur.dashboard.in_progress': { fr: 'En cours', en: 'In progress', es: 'En progreso' },
      'transporteur.dashboard.excellent': { fr: 'Excellent', en: 'Excellent', es: 'Excelente' },
      'transporteur.dashboard.to_improve': { fr: 'À améliorer', en: 'To improve', es: 'Por mejorar' },
      'transporteur.dashboard.progressing': { fr: 'Progression', en: 'Progressing', es: 'Progresando' },
      'transporteur.dashboard.new': { fr: 'Nouveau', en: 'New', es: 'Nuevo' },
      'transporteur.dashboard.all_up_to_date': { fr: 'Tout est à jour', en: 'All up to date', es: 'Todo está al día' },
      'transporteur.dashboard.notifications_title': { fr: 'Notifications', en: 'Notifications', es: 'Notificaciones' },
      'transporteur.dashboard.shipment': { fr: 'Envoi', en: 'Shipment', es: 'Envío' },
      'transporteur.dashboard.delivered_status': { fr: 'livré', en: 'delivered', es: 'entregado' },
      'transporteur.dashboard.in_transit_status': { fr: 'en transit', en: 'in transit', es: 'en tránsito' },
      'transporteur.dashboard.pending_status': { fr: 'en attente', en: 'pending', es: 'pendiente' },
      'transporteur.dashboard.admin_will_assign': { fr: 'Les administrateurs vous assigneront des livraisons', en: 'Administrators will assign you deliveries', es: 'Los administradores le asignarán entregas' },
      'transporteur.dashboard.no_activities': { fr: 'Aucune activité récente', en: 'No recent activity', es: 'No hay actividad reciente' },
      'transporteur.dashboard.quote': { fr: 'La ponctualité est la politesse des transporteurs.', en: 'Punctuality is the politeness of carriers.', es: 'La puntualidad es la cortesía de los transportistas.' },
      'transporteur.status.pending': { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
      'transporteur.status.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'transporteur.status.delivered': { fr: 'Livré', en: 'Delivered', es: 'Entregada' },
      'transporteur.status.cancelled': { fr: 'Annulé', en: 'Cancelled', es: 'Cancelada' },
      'transporteur.shipments.unknown_client': { fr: 'Client inconnu', en: 'Unknown client', es: 'Cliente desconocido' },
      'transporteur.shipments.no_address': { fr: 'Sans adresse', en: 'No address', es: 'Sin dirección' },
      'common.transporter': { fr: 'Transporteur', en: 'Transporter', es: 'Transportista' },
      'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
      'common.error': { fr: 'Erreur', en: 'Error', es: 'Error' },
      'transporteur.dashboard.refresh': { fr: 'Actualiser', en: 'Refresh', es: 'Actualizar' },
      'transporteur.dashboard.all': { fr: 'Toutes', en: 'All', es: 'Todas' },
      'transporteur.dashboard.pending': { fr: 'En attente', en: 'Pending', es: 'Pendientes' },
      'transporteur.dashboard.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'transporteur.dashboard.delivered': { fr: 'Livrées', en: 'Delivered', es: 'Entregadas' },
      'transporteur.dashboard.delivery_evolution': { fr: 'Évolution des livraisons', en: 'Delivery evolution', es: 'Evolución de entregas' },
      'transporteur.dashboard.my_deliveries': { fr: 'Mes livraisons', en: 'My deliveries', es: 'Mis entregas' },
      'transporteur.dashboard.no_deliveries': { fr: 'Aucune livraison assignée', en: 'No deliveries assigned', es: 'No hay entregas asignadas' },
      'transporteur.dashboard.recent_activities': { fr: 'Activités récentes', en: 'Recent activities', es: 'Actividades recientes' },
      'transporteur.dashboard.total_deliveries': { fr: 'Livraisons totales', en: 'Total deliveries', es: 'Entregas totales' },
      'transporteur.dashboard.success_rate': { fr: 'Taux de réussite', en: 'Success rate', es: 'Tasa de éxito' },
      'transporteur.dashboard.performance': { fr: 'Performance', en: 'Performance', es: 'Rendimiento' },
      'transporteur.dashboard.greeting_morning': { fr: 'Bonjour', en: 'Good morning', es: 'Buenos días' },
      'transporteur.dashboard.greeting_afternoon': { fr: 'Bon après-midi', en: 'Good afternoon', es: 'Buenas tardes' },
      'transporteur.dashboard.greeting_evening': { fr: 'Bonsoir', en: 'Good evening', es: 'Buenas noches' },
      'transporteur.dashboard.no_data': { fr: 'Aucune donnée disponible', en: 'No data available', es: 'Sin datos disponibles' },
    };
    if (directTranslations[key] && directTranslations[key][language]) {
      return directTranslations[key][language];
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

  const getCurrentDate = () => {
    const now = new Date();
    let locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateStr = now.toLocaleDateString(locale, options);
    if (language === 'fr') dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    return dateStr;
  };

  const getFormattedTime = () => {
    let locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';
    return currentTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true); setError(null);
    try {
      const [shipmentsRes, statsRes] = await Promise.all([
        fetch("http://localhost:3001/transporteur/shipments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/transporteur/stats", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (shipmentsRes.ok) {
        const data = await shipmentsRes.json();
        const arr = Array.isArray(data) ? data : [];
        setShipments(arr);
        const activities = arr.slice(0, 5).map(s => ({
          id: s.id, trackingNumber: s.trackingNumber,
          clientName: s.clientName || getTranslation("transporteur.shipments.unknown_client"),
          status: s.status, date: s.updatedAt || s.createdAt,
          color: s.status === "delivered" ? "#10b981" : s.status === "in_transit" ? "#3b82f6" : "#f59e0b"
        }));
        setRecentActivities(activities);
        const pendingCount = arr.filter(s => s.status === "pending").length;
        if (pendingCount > 0) {
          setNotifications([
            { id: 1, message: `${pendingCount} ${getTranslation("transporteur.dashboard.pending_notification")}`, time: getTranslation("transporteur.dashboard.now"), read: false, type: "warning", color: "#f59e0b" },
            { id: 2, message: `${arr.length} ${getTranslation("transporteur.dashboard.assigned_notification")}`, time: getTranslation("transporteur.dashboard.today"), read: false, type: "info", color: "#667eea" }
          ]);
        }
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({ total: data.total || 0, pending: data.pending || 0, inTransit: data.inTransit || 0, delivered: data.delivered || 0, cancelled: data.cancelled || 0 });
      }
    } catch (err) { console.error(err); setError(getTranslation("common.error")); }
    finally { setLoading(false); }
  };

  const processPeriodData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthLocale = language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';
    const safeDate = (val: any): Date | null => { if (!val) return null; const d = new Date(val); return isNaN(d.getTime()) ? null : d; };
    let labels: string[] = [], deliveries: number[] = [], completed: number[] = [];

    if (selectedPeriod === "day") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now); date.setDate(now.getDate() - i);
        const dayName = date.toLocaleDateString(monthLocale, { weekday: 'short' });
        labels.push(`${dayName} ${date.getDate()}`);
        deliveries.push(shipments.filter(s => { const sd = safeDate(s.createdAt); return sd && sd.toDateString() === date.toDateString(); }).length);
        completed.push(shipments.filter(s => { const sd = safeDate(s.updatedAt || s.createdAt); return s.status === "delivered" && sd && sd.toDateString() === date.toDateString(); }).length);
      }
    } else if (selectedPeriod === "week") {
      for (let i = 5; i >= 0; i--) {
        const weekDate = new Date(now); weekDate.setDate(now.getDate() - i * 7);
        labels.push(`S${getWeekNumber(weekDate)}`);
        const weekStart = new Date(weekDate); weekStart.setDate(weekDate.getDate() - weekDate.getDay()); weekStart.setHours(0,0,0,0);
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
        deliveries.push(shipments.filter(s => { const sd = safeDate(s.createdAt); return sd && sd >= weekStart && sd <= weekEnd; }).length);
        completed.push(shipments.filter(s => { const sd = safeDate(s.updatedAt || s.createdAt); return s.status === "delivered" && sd && sd >= weekStart && sd <= weekEnd; }).length);
      }
    } else if (selectedPeriod === "month") {
      for (let i = 5; i >= 0; i--) {
        const monthIndex = currentMonth - i;
        const year = monthIndex < 0 ? currentYear - 1 : currentYear;
        const realMonthIndex = ((monthIndex % 12) + 12) % 12;
        const date = new Date(year, realMonthIndex, 1);
        labels.push(date.toLocaleDateString(monthLocale, { month: 'short' }));
        const monthStart = new Date(year, realMonthIndex, 1); monthStart.setHours(0,0,0,0);
        const monthEnd = new Date(year, realMonthIndex + 1, 0); monthEnd.setHours(23,59,59,999);
        deliveries.push(shipments.filter(s => { const sd = safeDate(s.createdAt); return sd && sd >= monthStart && sd <= monthEnd; }).length);
        completed.push(shipments.filter(s => { const sd = safeDate(s.updatedAt || s.createdAt); return s.status === "delivered" && sd && sd >= monthStart && sd <= monthEnd; }).length);
      }
    } else if (selectedPeriod === "year") {
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i; labels.push(year.toString());
        const yearStart = new Date(year, 0, 1); yearStart.setHours(0,0,0,0);
        const yearEnd = new Date(year, 11, 31); yearEnd.setHours(23,59,59,999);
        deliveries.push(shipments.filter(s => { const sd = safeDate(s.createdAt); return sd && sd >= yearStart && sd <= yearEnd; }).length);
        completed.push(shipments.filter(s => { const sd = safeDate(s.updatedAt || s.createdAt); return s.status === "delivered" && sd && sd >= yearStart && sd <= yearEnd; }).length);
      }
    }

    const totalMapped = deliveries.reduce((a, b) => a + b, 0);
    if (totalMapped === 0 && shipments.length > 0) {
      deliveries[deliveries.length - 1] = shipments.length;
      completed[completed.length - 1] = shipments.filter(s => s.status === "delivered").length;
    }
    setPeriodData({ labels, deliveries, completed });
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const updateStatus = async (id: any, newStatus: string) => {
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
        setNotifications(prev => [{
          id: Date.now(),
          message: `${getTranslation("transporteur.dashboard.shipment")} ${id} ${newStatus === "delivered" ? getTranslation("transporteur.dashboard.delivered_status") : newStatus === "in_transit" ? getTranslation("transporteur.dashboard.in_transit_status") : getTranslation("transporteur.dashboard.pending_status")}`,
          time: getTranslation("transporteur.dashboard.now"),
          read: false,
          type: newStatus === "delivered" ? "success" : newStatus === "in_transit" ? "info" : "warning",
          color: newStatus === "delivered" ? "#10b981" : newStatus === "in_transit" ? "#3b82f6" : "#f59e0b"
        }, ...prev].slice(0, 10));
      } else { alert(getTranslation("common.error")); }
    } catch (err) { console.error(err); alert(getTranslation("common.error")); }
  };

  const getStatusColor = (status: string) => {
    if (status === "delivered") return "#10b981";
    if (status === "in_transit") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return "#94a3b8";
  };

  const getStatusText = (status: string) => {
    if (status === "delivered") return getTranslation("transporteur.status.delivered");
    if (status === "in_transit") return getTranslation("transporteur.status.in_transit");
    if (status === "pending") return getTranslation("transporteur.status.pending");
    if (status === "cancelled") return getTranslation("transporteur.status.cancelled");
    return status;
  };

  // Icon per status for activities
  const getStatusIcon = (status: string) => {
    if (status === "delivered") return <Ic.CheckCircle size={16} color="#10b981" />;
    if (status === "in_transit") return <Ic.Truck size={16} color="#3b82f6" />;
    return <Ic.Clock size={16} color="#f59e0b" />;
  };

  const getNotifIcon = (type: string, color: string) => {
    if (type === "warning") return <Ic.AlertTriangle size={14} color={color} />;
    if (type === "success") return <Ic.CheckCircle size={14} color={color} />;
    if (type === "info") return <Ic.Package size={14} color={color} />;
    return <Ic.Bell size={14} color={color} />;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return getTranslation("transporteur.dashboard.greeting_morning");
    if (hour < 18) return getTranslation("transporteur.dashboard.greeting_afternoon");
    return getTranslation("transporteur.dashboard.greeting_evening");
  };

  const successRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(0) : 0;
  const maxDeliveries = Math.max(...(periodData.deliveries.length ? periodData.deliveries : [0]), ...(periodData.completed.length ? periodData.completed : [0]), 1);

  const statsCards = [
    { Icon: Ic.Package, label: getTranslation("transporteur.dashboard.total_deliveries"), value: stats.total, color: "#667eea", bgGradient: "linear-gradient(135deg, #667eea20, #764ba220)", delay: 0.1, trend: stats.total > 0 ? `+${stats.total}` : "0", trendIcon: <Ic.TrendingUp size={11} color="#667eea" /> },
    { Icon: Ic.Clock, label: getTranslation("transporteur.dashboard.pending"), value: stats.pending, color: "#f59e0b", bgGradient: "linear-gradient(135deg, #f59e0b20, #d9770620)", delay: 0.2, trend: stats.pending > 0 ? getTranslation("transporteur.dashboard.to_process") : "OK", trendIcon: stats.pending > 0 ? <Ic.AlertTriangle size={11} color="#f59e0b" /> : <Ic.CheckCircle size={11} color="#10b981" /> },
    { Icon: Ic.Truck, label: getTranslation("transporteur.dashboard.in_transit"), value: stats.inTransit, color: "#3b82f6", bgGradient: "linear-gradient(135deg, #3b82f620, #2563eb20)", delay: 0.3, trend: getTranslation("transporteur.dashboard.in_progress"), trendIcon: <Ic.Zap size={11} color="#3b82f6" /> },
    { Icon: Ic.CheckCircle, label: getTranslation("transporteur.dashboard.delivered"), value: stats.delivered, color: "#10b981", bgGradient: "linear-gradient(135deg, #10b98120, #05966920)", delay: 0.4, trend: `${successRate}% ${getTranslation("transporteur.dashboard.success_rate")}`, trendIcon: <Ic.TrendingUp size={11} color="#10b981" /> },
    { Icon: Ic.BarChart, label: getTranslation("transporteur.dashboard.success_rate"), value: successRate, suffix: "%", color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #8b5cf620, #6d28d920)", delay: 0.5, trend: Number(successRate) >= 80 ? getTranslation("transporteur.dashboard.excellent") : getTranslation("transporteur.dashboard.to_improve"), trendIcon: Number(successRate) >= 80 ? <Ic.Trophy size={11} color="#8b5cf6" /> : <Ic.TrendingUp size={11} color="#8b5cf6" /> },
    { Icon: Ic.Star, label: getTranslation("transporteur.dashboard.performance"), value: stats.delivered > 0 ? Math.min(5, (stats.delivered / Math.max(stats.total, 1)) * 5).toFixed(1) : "0", suffix: "/5", color: "#f59e0b", bgGradient: "linear-gradient(135deg, #f59e0b20, #d9770620)", delay: 0.6, trend: stats.delivered > 5 ? getTranslation("transporteur.dashboard.progressing") : getTranslation("transporteur.dashboard.new"), trendIcon: stats.delivered > 5 ? <Ic.Zap size={11} color="#f59e0b" /> : <Ic.Star size={11} color="#f59e0b" /> }
  ];

  const periodOptions = [
    { id: "day", label: getTranslation("transporteur.dashboard.day"), Icon: Ic.Calendar },
    { id: "week", label: getTranslation("transporteur.dashboard.week"), Icon: Ic.Calendar },
    { id: "month", label: getTranslation("transporteur.dashboard.month"), Icon: Ic.BarChart },
    { id: "year", label: getTranslation("transporteur.dashboard.year"), Icon: Ic.TrendingUp }
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
            <Ic.Loader size={40} color="#667eea" />
          </div>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>{getTranslation("common.loading")}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "22px", background: "#0a0a0a", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: "29px", animation: animateCards ? "fadeInDown 0.5s ease" : "none", opacity: animateCards ? 1 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "11px", flexWrap: "wrap" }}>
              <h1 style={{ color: "white", fontSize: "25px", margin: 0, display: "flex", alignItems: "center", gap: "11px" }}>
                <Ic.Truck size={28} color="#667eea" />
                {getGreeting()}, {user?.name?.split(' ')[0] || getTranslation("common.transporter")} !
              </h1>
              {stats.delivered > 0 && (
                <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", padding: "4px 14px", borderRadius: "18px", fontSize: "11px", color: "white", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Ic.Trophy size={12} color="white" />
                  {stats.delivered} {getTranslation("transporteur.dashboard.completed_deliveries")}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "7px" }}>
              <p style={{ color: "#94a3b8", margin: 0, display: "flex", alignItems: "center", gap: "7px", fontSize: "13px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Ic.Calendar size={13} color="#94a3b8" /> {getCurrentDate()}</span>
                <span style={{ color: "#666" }}>•</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Ic.Clock2 size={13} color="#94a3b8" /> {getFormattedTime()}</span>
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: stats.pending > 0 ? "#f59e0b" : "#10b981", animation: stats.pending > 0 ? "pulse 1.5s infinite" : "none", display: "inline-block" }}></span>
                <span style={{ color: "#666", fontSize: "11px" }}>
                  {stats.pending > 0 ? `${stats.pending} ${getTranslation("transporteur.dashboard.pending_notification")}` : getTranslation("transporteur.dashboard.all_up_to_date")}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "11px", alignItems: "center" }}>
            <button
              onClick={fetchData}
              style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "36px", padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", transition: "all 0.2s", fontSize: "12px" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.borderColor = "#667eea"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#333"; }}
            >
              <Ic.RefreshCw size={14} color="#94a3b8" />
              <span style={{ color: "#94a3b8" }}>{getTranslation("transporteur.dashboard.refresh")}</span>
            </button>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "36px", padding: "7px 11px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center" }}
              >
                <Ic.Bell size={18} color="#94a3b8" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", fontSize: "9px", borderRadius: "9px", padding: "2px 5px", minWidth: "16px", textAlign: "center" }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{ position: "absolute", top: "45px", right: 0, width: "252px", background: "#111", border: "1px solid #222", borderRadius: "11px", overflow: "hidden", zIndex: 100, boxShadow: "0 9px 27px rgba(0,0,0,0.5)" }}>
                  <div style={{ padding: "11px 14px", borderBottom: "1px solid #222", color: "white", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <Ic.Bell size={14} color="#667eea" />
                    {getTranslation("transporteur.dashboard.notifications_title")}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "18px", color: "#666", fontSize: "12px", textAlign: "center" }}>{getTranslation("transporteur.dashboard.all_up_to_date")}</div>
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

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "18px", marginBottom: "29px" }}>
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: card.bgGradient, borderRadius: "18px", padding: "18px", textAlign: "center",
              border: `1px solid ${hoveredCard === idx ? card.color : "#222"}`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hoveredCard === idx ? "translateY(-5px)" : "translateY(0)",
              cursor: "pointer", animation: `fadeInUp 0.5s ease ${card.delay}s`, opacity: animateCards ? 1 : 0
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "7px", transition: "transform 0.3s", transform: hoveredCard === idx ? "scale(1.15)" : "scale(1)" }}>
              <card.Icon size={30} color={card.color} />
            </div>
            <div style={{ fontSize: "29px", color: card.color, fontWeight: "bold", fontFamily: "monospace" }}>{card.value}{card.suffix || ""}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{card.label}</div>
            <div style={{ fontSize: "9px", color: card.color, marginTop: "6px", opacity: 0.8, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              {card.trendIcon}
              {card.trend}
            </div>
            {card.label === getTranslation("transporteur.dashboard.success_rate") && (
              <div style={{ marginTop: "11px", background: "#1a1a1a", borderRadius: "9px", height: "5px", overflow: "hidden" }}>
                <div style={{ width: `${card.value}%`, background: card.color, height: "5px", borderRadius: "9px", transition: "width 0.5s" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "#111", borderRadius: "18px", padding: "22px", border: "1px solid #222", marginBottom: "22px", animation: animateCards ? "fadeInUp 0.5s ease 0.7s" : "none", opacity: animateCards ? 1 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "11px" }}>
          <h3 style={{ color: "white", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}>
            <Ic.BarChart size={18} color="#667eea" />
            {getTranslation("transporteur.dashboard.delivery_evolution")}
          </h3>
          <div style={{ display: "flex", gap: "7px", background: "#1a1a1a", padding: "4px", borderRadius: "32px" }}>
            {periodOptions.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                style={{
                  padding: "6px 16px", borderRadius: "28px",
                  background: selectedPeriod === period.id ? "#667eea" : "transparent",
                  color: selectedPeriod === period.id ? "white" : "#94a3b8",
                  border: "none", cursor: "pointer", fontSize: "12px", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: "6px",
                  fontWeight: selectedPeriod === period.id ? "500" : "400"
                }}
              >
                <period.Icon size={12} color={selectedPeriod === period.id ? "white" : "#94a3b8"} />
                <span>{period.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ minHeight: "320px", background: "#0a0a0a", borderRadius: "12px", padding: "30px 20px 20px" }}>
          {periodData.labels.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}><Ic.BarChart size={40} color="#333" /></div>
              <p>{getTranslation("transporteur.dashboard.no_data")}</p>
            </div>
          ) : (
            <>
              <div style={{ position: "relative" }}>
                {[maxDeliveries, Math.round(maxDeliveries * 0.75), Math.round(maxDeliveries * 0.5), Math.round(maxDeliveries * 0.25), 0].map((val, i) => (
                  <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i / 4) * 200}px`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#444", fontSize: "9px", minWidth: "20px", textAlign: "right" }}>{val}</span>
                    <div style={{ flex: 1, height: "1px", background: "#1a1a1a" }} />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "200px", paddingLeft: "30px", gap: "6px" }}>
                  {periodData.labels.map((label, idx) => {
                    const deliveriesValue = periodData.deliveries[idx] || 0;
                    const completedValue = periodData.completed[idx] || 0;
                    const deliveriesHeight = deliveriesValue > 0 ? Math.max((deliveriesValue / maxDeliveries) * 196, 6) : 2;
                    const completedHeight = completedValue > 0 ? Math.max((completedValue / maxDeliveries) * 196, 6) : 2;
                    const isHovered = hoveredPoint?.index === idx;
                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "200px" }}>
                          <div
                            style={{ width: "clamp(16px, 3vw, 36px)", height: `${deliveriesHeight}px`, background: isHovered && hoveredPoint?.type === "deliveries" ? "linear-gradient(180deg, #8899ff, #667eea)" : "linear-gradient(180deg, #667eea, #764ba2)", borderRadius: "4px 4px 0 0", transition: "height 0.6s cubic-bezier(0.4,0,0.2,1), background 0.2s", position: "relative", cursor: "pointer", boxShadow: isHovered && hoveredPoint?.type === "deliveries" ? "0 0 12px #667eea66" : "none" }}
                            onMouseEnter={() => setHoveredPoint({ type: "deliveries", index: idx, value: deliveriesValue, label })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            {deliveriesHeight > 20 && <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", color: "#667eea", fontWeight: "bold", whiteSpace: "nowrap" }}>{deliveriesValue}</span>}
                          </div>
                          <div
                            style={{ width: "clamp(16px, 3vw, 36px)", height: `${completedHeight}px`, background: isHovered && hoveredPoint?.type === "completed" ? "linear-gradient(180deg, #34d399, #10b981)" : "linear-gradient(180deg, #10b981, #059669)", borderRadius: "4px 4px 0 0", transition: "height 0.6s cubic-bezier(0.4,0,0.2,1), background 0.2s", position: "relative", cursor: "pointer", boxShadow: isHovered && hoveredPoint?.type === "completed" ? "0 0 12px #10b98166" : "none" }}
                            onMouseEnter={() => setHoveredPoint({ type: "completed", index: idx, value: completedValue, label })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            {completedHeight > 20 && <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", color: "#10b981", fontWeight: "bold", whiteSpace: "nowrap" }}>{completedValue}</span>}
                          </div>
                        </div>
                        <div style={{ marginTop: "8px", color: "#555", fontSize: "9px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60px" }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "24px", height: "12px", background: "linear-gradient(90deg, #667eea, #764ba2)", borderRadius: "3px" }} />
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>{getTranslation("transporteur.dashboard.assigned_shipments")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "24px", height: "12px", background: "linear-gradient(90deg, #10b981, #059669)", borderRadius: "3px" }} />
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>{getTranslation("transporteur.dashboard.completed_shipments")}</span>
                </div>
              </div>

              {hoveredPoint && (
                <div style={{ position: "fixed", left: "50%", bottom: "80px", transform: "translateX(-50%)", background: "#1a1a1a", border: `1px solid ${hoveredPoint.type === "deliveries" ? "#667eea" : "#10b981"}`, borderRadius: "10px", padding: "10px 18px", fontSize: "12px", zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.6)", pointerEvents: "none", minWidth: "160px", textAlign: "center" }}>
                  <div style={{ color: hoveredPoint.type === "deliveries" ? "#667eea" : "#10b981", fontWeight: "bold", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    {hoveredPoint.type === "deliveries" ? <Ic.Package size={13} color="#667eea" /> : <Ic.CheckCircle size={13} color="#10b981" />}
                    {hoveredPoint.type === "deliveries" ? getTranslation("transporteur.dashboard.assigned_shipments") : getTranslation("transporteur.dashboard.completed_shipments")}
                  </div>
                  <div style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>{hoveredPoint.value}</div>
                  <div style={{ color: "#94a3b8", fontSize: "10px", marginTop: "3px" }}>{hoveredPoint.label}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "22px" }}>

        {/* Deliveries list */}
        <div style={{ background: "#111", borderRadius: "18px", padding: "22px", border: "1px solid #222", animation: animateCards ? "fadeInUp 0.5s ease 0.8s" : "none", opacity: animateCards ? 1 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "11px" }}>
            <h3 style={{ color: "white", margin: 0, display: "flex", alignItems: "center", gap: "7px", fontSize: "13px" }}>
              <Ic.Truck size={16} color="#667eea" />
              {getTranslation("transporteur.dashboard.my_deliveries")}
              <span style={{ background: "#667eea20", color: "#667eea", padding: "2px 9px", borderRadius: "18px", fontSize: "11px" }}>{shipments.length}</span>
            </h3>
            <div style={{ display: "flex", gap: "7px" }}>
              {[
                { key: "deliveries", label: getTranslation("transporteur.dashboard.all"), color: "#667eea" },
                { key: "pending", label: getTranslation("transporteur.dashboard.pending"), color: "#f59e0b" },
                { key: "transit", label: getTranslation("transporteur.dashboard.in_transit"), color: "#3b82f6" },
                { key: "delivered", label: getTranslation("transporteur.dashboard.delivered"), color: "#10b981" },
              ].map(btn => (
                <button key={btn.key} onClick={() => setSelectedChart(btn.key)} style={{ padding: "4px 11px", borderRadius: "14px", background: selectedChart === btn.key ? btn.color : "#1a1a1a", border: "none", color: "white", cursor: "pointer", fontSize: "10px", transition: "background 0.2s" }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {shipments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "54px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px", opacity: 0.3 }}><Ic.Truck size={58} color="#94a3b8" /></div>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>{getTranslation("transporteur.dashboard.no_deliveries")}</p>
              <p style={{ color: "#666", fontSize: "12px", marginTop: "7px" }}>{getTranslation("transporteur.dashboard.admin_will_assign")}</p>
              <button onClick={fetchData} style={{ marginTop: "14px", padding: "7px 18px", background: "#667eea", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Ic.RefreshCw size={13} color="white" />
                {getTranslation("transporteur.dashboard.refresh")}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "11px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
              {shipments
                .filter(s => {
                  if (selectedChart === "pending") return s.status === "pending";
                  if (selectedChart === "transit") return s.status === "in_transit";
                  if (selectedChart === "delivered") return s.status === "delivered";
                  return true;
                })
                .map((shipment, idx) => (
                  <div
                    key={shipment.id}
                    onMouseEnter={() => setHoveredShipment(shipment.id)}
                    onMouseLeave={() => setHoveredShipment(null)}
                    style={{ background: hoveredShipment === shipment.id ? "#1a1a1a" : "transparent", borderRadius: "14px", padding: "14px", borderLeft: `4px solid ${getStatusColor(shipment.status)}`, transition: "all 0.3s ease", transform: hoveredShipment === shipment.id ? "translateX(5px)" : "translateX(0)", animation: animateCards ? `slideIn 0.3s ease ${idx * 0.05}s` : "none" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "11px" }}>
                      <div>
                        <div style={{ color: "white", fontWeight: "bold", fontSize: "14px", fontFamily: "monospace" }}>{shipment.trackingNumber}</div>
                        <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "5px", display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Ic.User size={11} color="#94a3b8" /> {shipment.clientName || getTranslation("transporteur.shipments.unknown_client")}</span>
                          <span style={{ color: "#666" }}>•</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Ic.MapPin size={11} color="#94a3b8" /> {(shipment.address || "").substring(0, 30) || getTranslation("transporteur.shipments.no_address")}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "11px", flexWrap: "wrap" }}>
                        <div style={{ background: `${getStatusColor(shipment.status)}20`, color: getStatusColor(shipment.status), padding: "4px 11px", borderRadius: "18px", fontSize: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
                          {getStatusIcon(shipment.status)}
                          {getStatusText(shipment.status)}
                        </div>
                        <select
                          value={shipment.status}
                          onChange={(e) => updateStatus(shipment.id, e.target.value)}
                          style={{ padding: "5px 11px", background: "#1a1a1a", border: `1px solid ${getStatusColor(shipment.status)}`, borderRadius: "7px", color: getStatusColor(shipment.status), cursor: "pointer", fontSize: "11px" }}
                        >
                          <option value="pending">{getTranslation("transporteur.status.pending")}</option>
                          <option value="in_transit">{getTranslation("transporteur.status.in_transit")}</option>
                          <option value="delivered">{getTranslation("transporteur.status.delivered")}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right col */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* Recent activities */}
          <div style={{ background: "#111", borderRadius: "18px", padding: "22px", border: "1px solid #222", animation: animateCards ? "fadeInUp 0.5s ease 0.85s" : "none", opacity: animateCards ? 1 : 0 }}>
            <h3 style={{ color: "white", marginBottom: "18px", display: "flex", alignItems: "center", gap: "7px", fontSize: "13px" }}>
              <Ic.Activity size={15} color="#667eea" />
              {getTranslation("transporteur.dashboard.recent_activities")}
            </h3>
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: "center", padding: "36px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px", opacity: 0.3 }}><Ic.Activity size={40} color="#94a3b8" /></div>
                <p style={{ color: "#666", fontSize: "12px" }}>{getTranslation("transporteur.dashboard.no_activities")}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                {recentActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", alignItems: "center", gap: "11px", padding: "11px", background: "#1a1a1a", borderRadius: "11px", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(5px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "16px", background: `${activity.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {getStatusIcon(activity.status)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "white", fontSize: "11px", fontWeight: "500" }}>{activity.trackingNumber} - {activity.clientName}</div>
                      <div style={{ color: activity.color, fontSize: "9px", marginTop: "2px" }}>{getStatusText(activity.status)}</div>
                    </div>
                    <div style={{ color: "#666", fontSize: "9px" }}>
                      {new Date(activity.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quote */}
          <div style={{ background: "linear-gradient(135deg, #667eea15, #764ba215)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(102,126,234,0.3)", textAlign: "center", animation: animateCards ? "fadeInUp 0.5s ease 0.9s" : "none", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <Ic.MessageCircle size={24} color="#667eea" />
            </div>
            <p style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>
              "{getTranslation("transporteur.dashboard.quote")}"
            </p>
            <p style={{ color: "#667eea", fontSize: "10px", marginTop: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <Ic.ChevronRight size={10} color="#667eea" />
              Inovexa ERP
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
}