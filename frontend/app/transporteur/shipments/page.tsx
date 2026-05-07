"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

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
  XCircle: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  List: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Grid: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Search: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  X: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Filter: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Calendar: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  BarChart: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  TrendingUp: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Hash: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/>
      <line x1="4" y1="15" x2="20" y2="15"/>
      <line x1="10" y1="3" x2="8" y2="21"/>
      <line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
  User: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  DollarSign: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  MapPin: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Phone: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  ArrowUp: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  ArrowDown: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
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
  SearchLg: ({ size = 40, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  FilterOff: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="22" y2="22"/>
      <path d="M10.84 10.84A7 7 0 1 0 9.16 9.16"/>
      <path d="M10 10H3l7 9v-4.87"/>
    </svg>
  ),
  ChevronLeft: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronsLeft: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11 17 6 12 11 7"/>
      <polyline points="18 17 13 12 18 7"/>
    </svg>
  ),
  ChevronsRight: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 17 18 12 13 7"/>
      <polyline points="6 17 11 12 6 7"/>
    </svg>
  ),
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TransporteurShipmentsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency, currency } = useAppSettings();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getTranslation = (key: string): string => {
    const directTranslations: Record<string, Record<string, string>> = {
      'transporteur.shipments.title': { fr: 'Mes livraisons', en: 'My deliveries', es: 'Mis entregas' },
      'transporteur.shipments.subtitle': { fr: 'Gérez vos livraisons assignées', en: 'Manage your assigned deliveries', es: 'Gestione sus entregas asignadas' },
      'transporteur.shipments.search_placeholder': { fr: 'N° suivi, client, adresse...', en: 'Tracking number, client, address...', es: 'Nº seguimiento, cliente, dirección...' },
      'transporteur.shipments.total': { fr: 'Total', en: 'Total', es: 'Total' },
      'transporteur.shipments.results_count': { fr: 'résultat(s)', en: 'result(s)', es: 'resultado(s)' },
      'transporteur.shipments.page': { fr: 'Page', en: 'Page', es: 'Página' },
      'transporteur.shipments.list_view': { fr: 'Liste', en: 'List', es: 'Lista' },
      'transporteur.shipments.grid_view': { fr: 'Grille', en: 'Grid', es: 'Cuadrícula' },
      'transporteur.shipments.unknown_client': { fr: 'Client inconnu', en: 'Unknown client', es: 'Cliente desconocido' },
      'transporteur.shipments.no_address': { fr: 'Sans adresse', en: 'No address', es: 'Sin dirección' },
      'transporteur.shipments.no_phone': { fr: 'Sans téléphone', en: 'No phone', es: 'Sin teléfono' },
      'transporteur.shipments.order_date': { fr: 'Date commande', en: 'Order date', es: 'Fecha pedido' },
      'transporteur.shipments.sort_by_date': { fr: 'Date', en: 'Date', es: 'Fecha' },
      'transporteur.shipments.sort_by_tracking': { fr: 'N° suivi', en: 'Tracking number', es: 'Nº seguimiento' },
      'transporteur.shipments.sort_by_client': { fr: 'Client', en: 'Client', es: 'Cliente' },
      'transporteur.shipments.sort_by_amount': { fr: 'Montant', en: 'Amount', es: 'Monto' },
      'transporteur.shipments.sort_by_address': { fr: 'Adresse', en: 'Address', es: 'Dirección' },
      'transporteur.shipments.sort_by_estimated_delivery': { fr: 'Livraison estimée', en: 'Estimated delivery', es: 'Entrega estimada' },
      'transporteur.shipments.sort_by_status': { fr: 'Statut', en: 'Status', es: 'Estado' },
      'transporteur.shipments.all_status': { fr: 'Tous les statuts', en: 'All statuses', es: 'Todos los estados' },
      'transporteur.shipments.all_periods': { fr: 'Toutes les périodes', en: 'All periods', es: 'Todos los períodos' },
      'transporteur.shipments.today': { fr: "Aujourd'hui", en: 'Today', es: 'Hoy' },
      'transporteur.shipments.this_week': { fr: 'Cette semaine', en: 'This week', es: 'Esta semana' },
      'transporteur.shipments.this_month': { fr: 'Ce mois', en: 'This month', es: 'Este mes' },
      'transporteur.shipments.this_year': { fr: 'Cette année', en: 'This year', es: 'Este año' },
      'transporteur.shipments.ascending': { fr: 'Ascendant', en: 'Ascending', es: 'Ascendente' },
      'transporteur.shipments.descending': { fr: 'Descendant', en: 'Descending', es: 'Descendente' },
      'transporteur.shipments.no_results': { fr: 'Aucun résultat pour vos filtres', en: 'No results for your filters', es: 'No hay resultados para sus filtros' },
      'transporteur.shipments.clear_filters': { fr: 'Effacer les filtres', en: 'Clear filters', es: 'Limpiar filtros' },
      'transporteur.shipments.tracking_number': { fr: 'N° de suivi', en: 'Tracking number', es: 'Nº de seguimiento' },
      'transporteur.shipments.client': { fr: 'Client', en: 'Client', es: 'Cliente' },
      'transporteur.shipments.amount': { fr: 'Montant', en: 'Amount', es: 'Monto' },
      'transporteur.shipments.phone': { fr: 'Téléphone', en: 'Phone', es: 'Teléfono' },
      'transporteur.shipments.address': { fr: 'Adresse', en: 'Address', es: 'Dirección' },
      'transporteur.shipments.date': { fr: 'Date', en: 'Date', es: 'Fecha' },
      'transporteur.shipments.estimated_delivery': { fr: 'Livraison estimée', en: 'Estimated delivery', es: 'Entrega estimada' },
      'transporteur.shipments.status': { fr: 'Statut', en: 'Status', es: 'Estado' },
      'transporteur.shipments.action': { fr: 'Action', en: 'Action', es: 'Acción' },
      'transporteur.shipments.no_shipments': { fr: 'Aucune livraison', en: 'No shipments', es: 'No hay envíos' },
      'transporteur.status.pending': { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
      'transporteur.status.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'transporteur.status.delivered': { fr: 'Livré', en: 'Delivered', es: 'Entregada' },
      'transporteur.status.cancelled': { fr: 'Annulé', en: 'Cancelled', es: 'Cancelada' },
      'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
      'common.error': { fr: 'Erreur', en: 'Error', es: 'Error' },
      'common.transporter': { fr: 'Transporteur', en: 'Transporter', es: 'Transportista' },
      'transporteur.dashboard.all': { fr: 'Toutes', en: 'All', es: 'Todas' },
      'transporteur.dashboard.pending': { fr: 'En attente', en: 'Pending', es: 'Pendientes' },
      'transporteur.dashboard.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'transporteur.dashboard.delivered': { fr: 'Livrées', en: 'Delivered', es: 'Entregadas' },
      'transporteur.dashboard.refresh': { fr: 'Actualiser', en: 'Refresh', es: 'Actualizar' }
    };
    if (directTranslations[key] && directTranslations[key][language]) return directTranslations[key][language];
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
  };

  const currencySymbols: Record<string, string> = { eur: "€", usd: "$", gbp: "£", tnd: "DT" };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return `0 ${currencySymbols[currency] || "€"}`;
    if (formatCurrency) return formatCurrency(amount);
    const symbol = currencySymbols[currency] || "€";
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency === 'eur' ? 'EUR' : currency === 'usd' ? 'USD' : currency === 'gbp' ? 'GBP' : 'EUR',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(amount).replace(/[A-Z]/g, '').trim() + ` ${symbol}`;
  };

  const filterByPeriod = (shipment) => {
    if (filterPeriod === "all") return true;
    const date = new Date(shipment.createdAt || shipment.updatedAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    switch (filterPeriod) {
      case "day": return date >= today;
      case "week": return date >= startOfWeek;
      case "month": return date >= startOfMonth;
      case "year": return date >= startOfYear;
      default: return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/auth/login"); return; }
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== "transporteur") { router.push("/dashboard"); return; }
      } catch (e) { router.push("/auth/login"); return; }
    }
    fetchShipments();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchShipments = async () => {
    const token = localStorage.getItem("token");
    setLoading(true); setError(null);
    try {
      const res = await fetch("http://localhost:3001/transporteur/shipments", { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/auth/login"); return; }
      const data = await res.json();
      setShipments(Array.isArray(data) ? data : []);
      setCurrentPage(1);
      if (Array.isArray(data) && data.length === 0) setError(getTranslation("transporteur.shipments.no_shipments"));
    } catch (e) { console.error("Erreur:", e); setError(getTranslation("common.error")); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");
    setUpdating(id);
    try {
      const res = await fetch(`http://localhost:3001/transporteur/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) { setShipments(prev => prev.map(s => s.id === id ? { ...s, status } : s)); }
      else { const error = await res.json(); alert(error.message || getTranslation("common.error")); }
    } catch (e) { console.error(e); alert(getTranslation("common.error")); }
    finally { setUpdating(null); }
  };

  const getStatusColor = (status) => {
    if (status === "delivered") return "#10b981";
    if (status === "in_transit") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return "#94a3b8";
  };

  const getStatusText = (status) => {
    if (status === "delivered") return getTranslation("transporteur.status.delivered");
    if (status === "in_transit") return getTranslation("transporteur.status.in_transit");
    if (status === "pending") return getTranslation("transporteur.status.pending");
    if (status === "cancelled") return getTranslation("transporteur.status.cancelled");
    return status;
  };

  const getStatusIcon = (status, size = 14) => {
    if (status === "delivered") return <Ic.CheckCircle size={size} color="#10b981" />;
    if (status === "in_transit") return <Ic.Truck size={size} color="#3b82f6" />;
    if (status === "pending") return <Ic.Clock size={size} color="#f59e0b" />;
    if (status === "cancelled") return <Ic.XCircle size={size} color="#ef4444" />;
    return <Ic.Package size={size} color="#94a3b8" />;
  };

  const filteredShipments = shipments
    .filter(s => filterByPeriod(s))
    .filter(s => {
      const matchesSearch =
        s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = filterStatus === "all" || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "date") { aVal = new Date(a.createdAt || a.updatedAt); bVal = new Date(b.createdAt || b.updatedAt); }
      else if (sortBy === "tracking") { aVal = a.trackingNumber || ""; bVal = b.trackingNumber || ""; }
      else if (sortBy === "client") { aVal = a.clientName || ""; bVal = b.clientName || ""; }
      else if (sortBy === "amount") { aVal = a.amount || 0; bVal = b.amount || 0; }
      else if (sortBy === "address") { aVal = a.address || ""; bVal = b.address || ""; }
      else if (sortBy === "estimatedDelivery") { aVal = new Date(a.estimatedDelivery || 0); bVal = new Date(b.estimatedDelivery || 0); }
      else { aVal = a.status || ""; bVal = b.status || ""; }
      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === "pending").length,
    inTransit: shipments.filter(s => s.status === "in_transit").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
    cancelled: shipments.filter(s => s.status === "cancelled").length
  };

  const headerTitleSize = "25px";
  const cardPadding = "14px";
  const cardValueSize = "22px";
  const cardLabelSize = "10px";
  const tablePadding = "11px";
  const tableFontSize = "12px";
  const statusFontSize = "11px";
  const buttonPaddingSmall = "5px 11px";
  const inputPadding = "11px";
  const gridGap = "18px";
  const gridMinWidth = "324px";
  const paginationPadding = "6px 10px";

  const localeStr = language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';

  const PaginationBar = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "7px", marginTop: "22px", paddingTop: "14px", borderTop: "1px solid #222" }}>
      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: paginationPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, display: "flex", alignItems: "center" }}>
        <Ic.ChevronsLeft size={14} color="white" />
      </button>
      <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ padding: paginationPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, display: "flex", alignItems: "center" }}>
        <Ic.ChevronLeft size={14} color="white" />
      </button>
      <span style={{ padding: paginationPadding, color: "#94a3b8", fontSize: "12px" }}>{getTranslation("transporteur.shipments.page")} {currentPage} / {totalPages}</span>
      <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} style={{ padding: paginationPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1, display: "flex", alignItems: "center" }}>
        <Ic.ChevronRight size={14} color="white" />
      </button>
      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: paginationPadding, background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1, display: "flex", alignItems: "center" }}>
        <Ic.ChevronsRight size={14} color="white" />
      </button>
    </div>
  );

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ animation: animateCards ? "fadeInDown 0.5s ease" : "none" }}>
          <h1 style={{ color: "white", fontSize: headerTitleSize, margin: 0, display: "flex", alignItems: "center", gap: "11px" }}>
            <Ic.Truck size={26} color="#667eea" />
            {getTranslation("transporteur.shipments.title")}
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "4px", fontSize: "13px" }}>{getTranslation("transporteur.shipments.subtitle")}</p>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: "7px", animation: animateCards ? "fadeInDown 0.5s ease" : "none" }}>
          {[
            { mode: "list", Icon: Ic.List, label: getTranslation("transporteur.shipments.list_view") },
            { mode: "grid", Icon: Ic.Grid, label: getTranslation("transporteur.shipments.grid_view") },
          ].map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{ padding: "7px 18px", background: viewMode === mode ? "#667eea" : "#1a1a1a", border: "1px solid #333", borderRadius: "7px", color: "white", cursor: "pointer", transition: "all 0.2s", fontSize: "13px", fontWeight: viewMode === mode ? "600" : "400", display: "flex", alignItems: "center", gap: "7px" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = viewMode === mode ? "#667eea" : "#2a2a2a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = viewMode === mode ? "#667eea" : "#1a1a1a"; }}
            >
              <Icon size={15} color="white" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(144px, 1fr))", gap: "14px", marginBottom: "22px", animation: animateCards ? "fadeInUp 0.5s ease 0.1s" : "none", opacity: animateCards ? 1 : 0 }}>
        {[
          { Icon: Ic.Package, value: stats.total, color: "#667eea", label: getTranslation("transporteur.shipments.total") },
          { Icon: Ic.Clock, value: stats.pending, color: "#f59e0b", label: getTranslation("transporteur.status.pending") },
          { Icon: Ic.Truck, value: stats.inTransit, color: "#3b82f6", label: getTranslation("transporteur.status.in_transit") },
          { Icon: Ic.CheckCircle, value: stats.delivered, color: "#10b981", label: getTranslation("transporteur.status.delivered") },
        ].map(({ Icon, value, color, label }, i) => (
          <div key={i} style={{ background: "#111", borderRadius: "14px", padding: cardPadding, textAlign: "center", border: "1px solid #222", transition: "transform 0.3s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "7px" }}>
              <Icon size={26} color={color} />
            </div>
            <div style={{ fontSize: cardValueSize, color, fontWeight: "bold" }}>{value}</div>
            <div style={{ fontSize: cardLabelSize, color: "#94a3b8" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div style={{ marginBottom: "18px", animation: animateCards ? "fadeInUp 0.5s ease 0.2s" : "none", opacity: animateCards ? 1 : 0 }}>
        <div style={{ display: "flex", gap: "11px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: 2 }}>
            <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
              <Ic.Search size={15} color="#666" />
            </span>
            <input
              type="text"
              placeholder={getTranslation("transporteur.shipments.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: `${inputPadding}px ${inputPadding}px ${inputPadding}px 36px`, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", fontSize: "13px", transition: "border-color 0.2s" }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#333"}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Ic.X size={14} color="#666" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: `${inputPadding}px 14px`, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", cursor: "pointer", minWidth: "126px", fontSize: "13px" }}>
            <option value="all">{getTranslation("transporteur.shipments.all_status")}</option>
            <option value="pending">{getTranslation("transporteur.status.pending")}</option>
            <option value="in_transit">{getTranslation("transporteur.status.in_transit")}</option>
            <option value="delivered">{getTranslation("transporteur.status.delivered")}</option>
            <option value="cancelled">{getTranslation("transporteur.status.cancelled")}</option>
          </select>

          {/* Period filter */}
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} style={{ padding: `${inputPadding}px 14px`, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", cursor: "pointer", minWidth: "126px", fontSize: "13px" }}>
            <option value="all">{getTranslation("transporteur.shipments.all_periods")}</option>
            <option value="day">{getTranslation("transporteur.shipments.today")}</option>
            <option value="week">{getTranslation("transporteur.shipments.this_week")}</option>
            <option value="month">{getTranslation("transporteur.shipments.this_month")}</option>
            <option value="year">{getTranslation("transporteur.shipments.this_year")}</option>
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: `${inputPadding}px 14px`, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", cursor: "pointer", minWidth: "144px", fontSize: "13px" }}>
            <option value="date">{getTranslation("transporteur.shipments.sort_by_date")}</option>
            <option value="tracking">{getTranslation("transporteur.shipments.sort_by_tracking")}</option>
            <option value="client">{getTranslation("transporteur.shipments.sort_by_client")}</option>
            <option value="amount">{getTranslation("transporteur.shipments.sort_by_amount")}</option>
            <option value="address">{getTranslation("transporteur.shipments.sort_by_address")}</option>
            <option value="estimatedDelivery">{getTranslation("transporteur.shipments.sort_by_estimated_delivery")}</option>
            <option value="status">{getTranslation("transporteur.shipments.sort_by_status")}</option>
          </select>

          {/* Sort direction */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            style={{ padding: `${inputPadding}px 14px`, background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            {sortOrder === "asc" ? <Ic.ArrowUp size={14} color="#94a3b8" /> : <Ic.ArrowDown size={14} color="#94a3b8" />}
            {sortOrder === "asc" ? getTranslation("transporteur.shipments.ascending") : getTranslation("transporteur.shipments.descending")}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "7px" }}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>
            {filteredShipments.length} {getTranslation("transporteur.shipments.results_count")}
          </div>
        </div>
      </div>

      {/* Empty state helper */}
      {filteredShipments.length === 0 && (
        <div style={{ textAlign: "center", padding: "54px", background: "#111", borderRadius: "18px", border: "1px solid #222" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px", opacity: 0.3 }}>
            <Ic.SearchLg size={43} color="#94a3b8" />
          </div>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            {searchTerm || filterPeriod !== "all" || filterStatus !== "all" ? getTranslation("transporteur.shipments.no_results") : getTranslation("transporteur.shipments.no_shipments")}
          </p>
          {(searchTerm || filterPeriod !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterPeriod("all"); }} style={{ marginTop: "14px", padding: buttonPaddingSmall, background: "#667eea", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Ic.FilterOff size={14} color="white" />
              {getTranslation("transporteur.shipments.clear_filters")}
            </button>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filteredShipments.length > 0 && (
        <div style={{ background: "#111", borderRadius: "18px", padding: "22px", border: "1px solid #222", overflowX: "auto", animation: animateCards ? "fadeInUp 0.5s ease 0.3s" : "none", opacity: animateCards ? 1 : 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "810px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
                {[
                  getTranslation("transporteur.shipments.tracking_number"),
                  getTranslation("transporteur.shipments.client"),
                  getTranslation("transporteur.shipments.amount"),
                  getTranslation("transporteur.shipments.phone"),
                  getTranslation("transporteur.shipments.address"),
                  getTranslation("transporteur.shipments.date"),
                  getTranslation("transporteur.shipments.estimated_delivery"),
                  getTranslation("transporteur.shipments.status"),
                  getTranslation("transporteur.shipments.action"),
                ].map((h, i) => (
                  <th key={i} style={{ padding: tablePadding, textAlign: i === 2 ? "right" : i >= 7 ? "center" : "left", fontSize: tableFontSize }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #1a1a1a", transition: "background 0.2s", animation: animateCards ? `slideIn 0.3s ease ${idx * 0.03}s` : "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#1a1a1a"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: tablePadding, color: "white", fontWeight: "500", fontFamily: "monospace", fontSize: tableFontSize }}>{s.trackingNumber}</td>
                  <td style={{ padding: tablePadding, color: "#94a3b8", fontSize: tableFontSize }}>{s.clientName || "-"}</td>
                  <td style={{ padding: tablePadding, textAlign: "right", color: "#10b981", fontWeight: "bold", fontSize: tableFontSize }}>{formatAmount(s.amount)}</td>
                  <td style={{ padding: tablePadding, color: "#94a3b8", fontSize: tableFontSize }}>{s.phone || "-"}</td>
                  <td style={{ padding: tablePadding, color: "#94a3b8", fontSize: tableFontSize }}>{s.address?.substring(0, 32) || "-"}{s.address?.length > 32 ? "…" : ""}</td>
                  <td style={{ padding: tablePadding, color: "#94a3b8", fontSize: tableFontSize }}>{new Date(s.createdAt).toLocaleDateString(localeStr)}</td>
                  <td style={{ padding: tablePadding, color: s.estimatedDelivery && new Date(s.estimatedDelivery) < new Date() && s.status !== "delivered" ? "#ef4444" : "#94a3b8", fontSize: tableFontSize }}>
                    {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString(localeStr) : "-"}
                  </td>
                  <td style={{ padding: tablePadding, textAlign: "center" }}>
                    <span style={{ background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), padding: "4px 11px", borderRadius: "18px", fontSize: statusFontSize, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      {getStatusIcon(s.status, 12)} {getStatusText(s.status)}
                    </span>
                  </td>
                  <td style={{ padding: tablePadding, textAlign: "center" }}>
                    <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} disabled={updating === s.id} style={{ padding: "5px 11px", background: "#1a1a1a", border: `1px solid ${getStatusColor(s.status)}`, borderRadius: "7px", color: getStatusColor(s.status), cursor: updating === s.id ? "wait" : "pointer", fontSize: "11px", opacity: updating === s.id ? 0.7 : 1, transition: "all 0.2s" }}>
                      <option value="pending">{getTranslation("transporteur.status.pending")}</option>
                      <option value="in_transit">{getTranslation("transporteur.status.in_transit")}</option>
                      <option value="delivered">{getTranslation("transporteur.status.delivered")}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && <PaginationBar />}
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && filteredShipments.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`, gap: gridGap, animation: animateCards ? "fadeInUp 0.5s ease 0.3s" : "none", opacity: animateCards ? 1 : 0 }}>
            {paginatedShipments.map((s, idx) => (
              <div key={s.id}
                style={{ background: "#111", borderRadius: "14px", padding: "18px", border: `1px solid ${getStatusColor(s.status)}`, transition: "transform 0.3s, box-shadow 0.3s", animation: animateCards ? `fadeInUp 0.3s ease ${idx * 0.05}s` : "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 9px 27px rgba(0,0,0,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "14px" }}>
                  <div style={{ width: "45px", height: "45px", borderRadius: "23px", background: `${getStatusColor(s.status)}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getStatusIcon(s.status, 22)}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: "bold", fontSize: "14px", fontFamily: "monospace" }}>{s.trackingNumber}</div>
                    <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Ic.User size={11} color="#94a3b8" />
                      {s.clientName || getTranslation("transporteur.shipments.unknown_client")}
                    </div>
                  </div>
                </div>

                {/* Card details */}
                <div style={{ marginBottom: "11px" }}>
                  {[
                    { Icon: Ic.DollarSign, label: getTranslation("transporteur.shipments.amount"), value: formatAmount(s.amount), valueColor: "#10b981" },
                    { Icon: Ic.Phone, label: getTranslation("transporteur.shipments.phone"), value: s.phone || "-", valueColor: "#94a3b8" },
                    { Icon: Ic.MapPin, label: getTranslation("transporteur.shipments.address"), value: (s.address?.substring(0, 23) || "-") + (s.address?.length > 23 ? "…" : ""), valueColor: "#94a3b8" },
                    { Icon: Ic.Calendar, label: getTranslation("transporteur.shipments.order_date"), value: new Date(s.createdAt).toLocaleDateString(localeStr), valueColor: "#94a3b8" },
                    { Icon: Ic.Package, label: getTranslation("transporteur.shipments.estimated_delivery"), value: s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString(localeStr) : "-", valueColor: s.estimatedDelivery && new Date(s.estimatedDelivery) < new Date() && s.status !== "delivered" ? "#ef4444" : "#94a3b8" },
                  ].map(({ Icon, label, value, valueColor }, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                      <span style={{ color: "#666", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon size={11} color="#555" /> {label}
                      </span>
                      <span style={{ color: valueColor, fontSize: "10px", textAlign: "right" }}>{value}</span>
                    </div>
                  ))}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#666", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Ic.BarChart size={11} color="#555" /> {getTranslation("transporteur.shipments.status")}
                    </span>
                    <span style={{ background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), padding: "2px 7px", borderRadius: "11px", fontSize: "9px", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {getStatusIcon(s.status, 10)} {getStatusText(s.status)}
                    </span>
                  </div>
                </div>

                <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} disabled={updating === s.id} style={{ width: "100%", padding: "7px 11px", marginTop: "7px", background: "#1a1a1a", border: `1px solid ${getStatusColor(s.status)}`, borderRadius: "7px", color: getStatusColor(s.status), cursor: updating === s.id ? "wait" : "pointer", fontSize: "11px", opacity: updating === s.id ? 0.7 : 1, transition: "all 0.2s" }}>
                  <option value="pending">{getTranslation("transporteur.status.pending")}</option>
                  <option value="in_transit">{getTranslation("transporteur.status.in_transit")}</option>
                  <option value="delivered">{getTranslation("transporteur.status.delivered")}</option>
                </select>
              </div>
            ))}
          </div>
          {totalPages > 1 && <PaginationBar />}
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
      ` }} />
    </div>
  );
}