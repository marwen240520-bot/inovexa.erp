"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Shipment {
  id: number;
  trackingNumber: string;
  clientName: string;
  amount: number;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
}

const Ic = {
  Truck: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Package: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 1 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
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
  XCircle: ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  List: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Grid: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Search: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  X: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  FilterOff: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <line x1="2" y1="2" x2="22" y2="22"/><path d="M10.84 10.84A7 7 0 1 0 9.16 9.16"/><path d="M10 10H3l7 9v-4.87"/>
    </svg>
  ),
  ChevronLeft: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronsLeft: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
    </svg>
  ),
  ChevronsRight: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
    </svg>
  ),
  ArrowUp: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  ArrowDown: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
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
  SearchLg: ({ size = 40, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.3">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  User: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  DollarSign: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  MapPin: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Phone: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Calendar: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  BarChart: ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Menu: ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
};

export default function TransporteurShipmentsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = 10;

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
      'shipments.title': { fr: 'Mes livraisons', en: 'My shipments', es: 'Mis entregas' },
      'shipments.subtitle': { fr: 'Gérez vos livraisons assignées', en: 'Manage your assigned shipments', es: 'Gestione sus entregas asignadas' },
      'shipments.list': { fr: 'Liste', en: 'List', es: 'Lista' },
      'shipments.grid': { fr: 'Grille', en: 'Grid', es: 'Cuadrícula' },
      'shipments.total': { fr: 'Total', en: 'Total', es: 'Total' },
      'shipments.pending': { fr: 'En attente', en: 'Pending', es: 'Pendientes' },
      'shipments.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'shipments.delivered': { fr: 'Livrées', en: 'Delivered', es: 'Entregadas' },
      'shipments.search_placeholder': { fr: 'N° suivi, client, adresse...', en: 'Tracking #, client, address...', es: 'Nº seguimiento, cliente, dirección...' },
      'shipments.all_statuses': { fr: 'Tous les statuts', en: 'All statuses', es: 'Todos los estados' },
      'shipments.status_pending': { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
      'shipments.status_in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'shipments.status_delivered': { fr: 'Livrée', en: 'Delivered', es: 'Entregado' },
      'shipments.status_cancelled': { fr: 'Annulée', en: 'Cancelled', es: 'Cancelado' },
      'shipments.all_periods': { fr: 'Toutes les périodes', en: 'All periods', es: 'Todos los períodos' },
      'shipments.today': { fr: "Aujourd'hui", en: 'Today', es: 'Hoy' },
      'shipments.this_week': { fr: 'Cette semaine', en: 'This week', es: 'Esta semana' },
      'shipments.this_month': { fr: 'Ce mois', en: 'This month', es: 'Este mes' },
      'shipments.this_year': { fr: 'Cette année', en: 'This year', es: 'Este año' },
      'shipments.sort_by_date': { fr: 'Trier par date', en: 'Sort by date', es: 'Ordenar por fecha' },
      'shipments.sort_by_tracking': { fr: 'Trier par N° suivi', en: 'Sort by tracking #', es: 'Ordenar por Nº seguimiento' },
      'shipments.sort_by_client': { fr: 'Trier par client', en: 'Sort by client', es: 'Ordenar por cliente' },
      'shipments.sort_by_amount': { fr: 'Trier par montant', en: 'Sort by amount', es: 'Ordenar por monto' },
      'shipments.sort_by_address': { fr: 'Trier par adresse', en: 'Sort by address', es: 'Ordenar por dirección' },
      'shipments.sort_by_status': { fr: 'Trier par statut', en: 'Sort by status', es: 'Ordenar por estado' },
      'shipments.ascending': { fr: 'Ascendant', en: 'Ascending', es: 'Ascendente' },
      'shipments.descending': { fr: 'Descendant', en: 'Descending', es: 'Descendente' },
      'shipments.results': { fr: 'résultat(s)', en: 'result(s)', es: 'resultado(s)' },
      'shipments.tracking_number': { fr: 'N° suivi', en: 'Tracking #', es: 'Nº seguimiento' },
      'shipments.client': { fr: 'Client', en: 'Client', es: 'Cliente' },
      'shipments.amount': { fr: 'Montant', en: 'Amount', es: 'Monto' },
      'shipments.phone': { fr: 'Téléphone', en: 'Phone', es: 'Teléfono' },
      'shipments.address': { fr: 'Adresse', en: 'Address', es: 'Dirección' },
      'shipments.date': { fr: 'Date', en: 'Date', es: 'Fecha' },
      'shipments.status': { fr: 'Statut', en: 'Status', es: 'Estado' },
      'shipments.action': { fr: 'Action', en: 'Action', es: 'Acción' },
      'status.delivered': { fr: 'Livrée', en: 'Delivered', es: 'Entregado' },
      'status.in_transit': { fr: 'En transit', en: 'In transit', es: 'En tránsito' },
      'status.pending': { fr: 'En attente', en: 'Pending', es: 'Pendiente' },
      'status.cancelled': { fr: 'Annulée', en: 'Cancelled', es: 'Cancelado' },
      'shipments.no_results': { fr: 'Aucun résultat pour vos filtres', en: 'No results for your filters', es: 'No hay resultados para sus filtros' },
      'shipments.no_shipments': { fr: 'Aucune livraison', en: 'No shipments', es: 'No hay entregas' },
      'shipments.clear_filters': { fr: 'Effacer les filtres', en: 'Clear filters', es: 'Borrar filtros' },
      'shipments.page': { fr: 'Page', en: 'Page', es: 'Página' },
      'shipments.of': { fr: '/', en: '/', es: '/' },
      'shipments.unknown_client': { fr: 'Client inconnu', en: 'Unknown client', es: 'Cliente desconocido' },
    };
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    const translated = t(key);
    return translated !== key ? translated : key.split('.').pop() || key;
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
  }, []);

  const fetchShipments = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("https://api-inovexa.ngrok.app/transporteur/shipments", { 
        headers: { Authorization: "Bearer " + token } 
      });
      if (res.status === 401) { 
        localStorage.removeItem("token"); 
        localStorage.removeItem("user"); 
        router.push("/auth/login"); 
        return; 
      }
      const data = await res.json();
      setShipments(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (e) { 
      console.error("Erreur:", e); 
    }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    setUpdating(id);
    try {
      const res = await fetch(`https://api-inovexa.ngrok.app/transporteur/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ status })
      });
      if (res.ok) { 
        setShipments(prev => prev.map(s => s.id === id ? { ...s, status } : s)); 
      }
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const getStatusColor = (status: string): string => {
    if (status === "delivered") return "#10b981";
    if (status === "in_transit") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return "#94a3b8";
  };

  const getStatusText = (status: string): string => {
    if (status === "delivered") return getTranslation("status.delivered");
    if (status === "in_transit") return getTranslation("status.in_transit");
    if (status === "pending") return getTranslation("status.pending");
    if (status === "cancelled") return getTranslation("status.cancelled");
    return status;
  };

  const getStatusIcon = (status: string, size: number = 14) => {
    if (status === "delivered") return <Ic.CheckCircle size={size} color="#10b981" />;
    if (status === "in_transit") return <Ic.Truck size={size} color="#3b82f6" />;
    if (status === "pending") return <Ic.Clock size={size} color="#f59e0b" />;
    if (status === "cancelled") return <Ic.XCircle size={size} color="#ef4444" />;
    return <Ic.Package size={size} color="#94a3b8" />;
  };

  const filterByPeriod = (shipment: Shipment): boolean => {
    if (filterPeriod === "all") return true;
    const date = new Date(shipment.createdAt || shipment.updatedAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today); 
    startOfWeek.setDate(today.getDate() - today.getDay());
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

  const filteredShipments = shipments
    .filter(s => filterByPeriod(s))
    .filter(s => {
      const matchesSearch = 
        s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === "date") { 
        aVal = new Date(a.createdAt || a.updatedAt); 
        bVal = new Date(b.createdAt || b.updatedAt); 
      } else if (sortBy === "tracking") { 
        aVal = a.trackingNumber || ""; 
        bVal = b.trackingNumber || ""; 
      } else if (sortBy === "client") { 
        aVal = a.clientName || ""; 
        bVal = b.clientName || ""; 
      } else if (sortBy === "amount") { 
        aVal = a.amount || 0; 
        bVal = b.amount || 0; 
      } else if (sortBy === "address") { 
        aVal = a.address || ""; 
        bVal = b.address || ""; 
      } else { 
        aVal = a.status || ""; 
        bVal = b.status || ""; 
      }
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

  const formatAmount = (amount?: number): string => {
    if (!amount && amount !== 0) return "0 €";
    return amount.toLocaleString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US") + (language === "fr" ? " €" : language === "es" ? " €" : " €");
  };

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
    <div style={{ 
      padding: isMobile ? "16px" : "22px", 
      background: "#0a0a0a", 
      minHeight: "100vh",
      paddingBottom: isMobile ? "80px" : "22px"
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .filters-row { flex-direction: column !important; }
          .filters-row > div, .filters-row select, .filters-row button { width: 100% !important; }
          .grid-cards { grid-template-columns: 1fr !important; }
        }
      ` }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ color: "white", fontSize: isMobile ? "20px" : "25px", margin: 0, display: "flex", alignItems: "center", gap: "11px" }}>
            <Ic.Truck size={isMobile ? 22 : 26} color="#667eea" />
            {getTranslation("shipments.title")}
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "4px", fontSize: isMobile ? "11px" : "13px" }}>{getTranslation("shipments.subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: "7px" }}>
          {[
            { mode: "list", Icon: Ic.List, label: getTranslation("shipments.list") },
            { mode: "grid", Icon: Ic.Grid, label: getTranslation("shipments.grid") },
          ].map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as "list" | "grid")}
              style={{ 
                padding: isMobile ? "5px 12px" : "7px 18px", 
                background: viewMode === mode ? "#667eea" : "#1a1a1a", 
                border: "1px solid #333", 
                borderRadius: "7px", 
                color: "white", 
                cursor: "pointer", 
                fontSize: isMobile ? "11px" : "13px", 
                display: "flex", 
                alignItems: "center", 
                gap: "7px" 
              }}
            >
              <Icon size={isMobile ? 13 : 15} color="white" />
              {!isMobile && label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards - Responsive grid */}
      <div className="stats-grid" style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(144px, 1fr))", 
        gap: isMobile ? "12px" : "14px", 
        marginBottom: "22px" 
      }}>
        {[
          { Icon: Ic.Package, value: stats.total, color: "#667eea", label: getTranslation("shipments.total") },
          { Icon: Ic.Clock, value: stats.pending, color: "#f59e0b", label: getTranslation("shipments.pending") },
          { Icon: Ic.Truck, value: stats.inTransit, color: "#3b82f6", label: getTranslation("shipments.in_transit") },
          { Icon: Ic.CheckCircle, value: stats.delivered, color: "#10b981", label: getTranslation("shipments.delivered") },
        ].map(({ Icon, value, color, label }, i) => (
          <div key={i} style={{ background: "#111", borderRadius: "14px", padding: isMobile ? "12px" : "14px", textAlign: "center", border: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "7px" }}>
              <Icon size={isMobile ? 22 : 26} color={color} />
            </div>
            <div style={{ fontSize: isMobile ? "18px" : "22px", color, fontWeight: "bold" }}>{value}</div>
            <div style={{ fontSize: isMobile ? "9px" : "10px", color: "#94a3b8" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters bar - Responsive */}
      <div style={{ marginBottom: "18px" }}>
        <div className="filters-row" style={{ display: "flex", gap: "11px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: isMobile ? "1" : "2", width: isMobile ? "100%" : "auto" }}>
            <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }}>
              <Ic.Search size={isMobile ? 13 : 15} color="#666" />
            </span>
            <input
              type="text"
              placeholder={getTranslation("shipments.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: isMobile ? "10px 10px 10px 34px" : "11px 11px 11px 36px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", fontSize: isMobile ? "12px" : "13px" }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", cursor: "pointer" }}>
                <Ic.X size={isMobile ? 12 : 14} color="#666" />
              </button>
            )}
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: isMobile ? "10px 12px" : "11px 14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", cursor: "pointer", minWidth: isMobile ? "auto" : "126px", fontSize: isMobile ? "12px" : "13px", flex: isMobile ? "1" : "auto" }}>
            <option value="all">{getTranslation("shipments.all_statuses")}</option>
            <option value="pending">{getTranslation("shipments.status_pending")}</option>
            <option value="in_transit">{getTranslation("shipments.status_in_transit")}</option>
            <option value="delivered">{getTranslation("shipments.status_delivered")}</option>
            <option value="cancelled">{getTranslation("shipments.status_cancelled")}</option>
          </select>
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} style={{ padding: isMobile ? "10px 12px" : "11px 14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", cursor: "pointer", minWidth: isMobile ? "auto" : "126px", fontSize: isMobile ? "12px" : "13px", flex: isMobile ? "1" : "auto" }}>
            <option value="all">{getTranslation("shipments.all_periods")}</option>
            <option value="day">{getTranslation("shipments.today")}</option>
            <option value="week">{getTranslation("shipments.this_week")}</option>
            <option value="month">{getTranslation("shipments.this_month")}</option>
            <option value="year">{getTranslation("shipments.this_year")}</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: isMobile ? "10px 12px" : "11px 14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "white", cursor: "pointer", minWidth: isMobile ? "auto" : "144px", fontSize: isMobile ? "12px" : "13px", flex: isMobile ? "1" : "auto" }}>
            <option value="date">{getTranslation("shipments.sort_by_date")}</option>
            <option value="tracking">{getTranslation("shipments.sort_by_tracking")}</option>
            <option value="client">{getTranslation("shipments.sort_by_client")}</option>
            <option value="amount">{getTranslation("shipments.sort_by_amount")}</option>
            <option value="address">{getTranslation("shipments.sort_by_address")}</option>
            <option value="status">{getTranslation("shipments.sort_by_status")}</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            style={{ padding: isMobile ? "10px 12px" : "11px 14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "11px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: isMobile ? "12px" : "13px", flex: isMobile ? "1" : "auto", justifyContent: "center" }}
          >
            {sortOrder === "asc" ? <Ic.ArrowUp size={14} color="#94a3b8" /> : <Ic.ArrowDown size={14} color="#94a3b8" />}
            {!isMobile && (sortOrder === "asc" ? getTranslation("shipments.ascending") : getTranslation("shipments.descending"))}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "7px" }}>
          <div style={{ color: "#94a3b8", fontSize: isMobile ? "11px" : "12px" }}>{filteredShipments.length} {getTranslation("shipments.results")}</div>
        </div>
      </div>

      {/* Empty state */}
      {filteredShipments.length === 0 && (
        <div style={{ textAlign: "center", padding: isMobile ? "40px" : "54px", background: "#111", borderRadius: "18px", border: "1px solid #222" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px", opacity: 0.3 }}>
            <Ic.SearchLg size={isMobile ? 35 : 43} color="#94a3b8" />
          </div>
          <p style={{ color: "#94a3b8", fontSize: isMobile ? "12px" : "14px" }}>
            {searchTerm || filterPeriod !== "all" || filterStatus !== "all" ? getTranslation("shipments.no_results") : getTranslation("shipments.no_shipments")}
          </p>
          {(searchTerm || filterPeriod !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setSearchTerm(""); setFilterStatus("all"); setFilterPeriod("all"); }} style={{ marginTop: "14px", padding: "5px 11px", background: "#667eea", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Ic.FilterOff size={14} color="white" />
              {getTranslation("shipments.clear_filters")}
            </button>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filteredShipments.length > 0 && (
        <div style={{ background: "#111", borderRadius: "18px", padding: isMobile ? "16px" : "22px", border: "1px solid #222", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "700px" : "810px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
                <th style={{ padding: "11px", textAlign: "left", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.tracking_number")}</th>
                <th style={{ padding: "11px", textAlign: "left", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.client")}</th>
                <th style={{ padding: "11px", textAlign: "right", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.amount")}</th>
                <th style={{ padding: "11px", textAlign: "left", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.phone")}</th>
                <th style={{ padding: "11px", textAlign: "left", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.address")}</th>
                <th style={{ padding: "11px", textAlign: "left", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.date")}</th>
                <th style={{ padding: "11px", textAlign: "center", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.status")}</th>
                <th style={{ padding: "11px", textAlign: "center", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.action")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={{ padding: "11px", color: "white", fontWeight: "500", fontFamily: "monospace", fontSize: isMobile ? "10px" : "12px" }}>{s.trackingNumber}</td>
                  <td style={{ padding: "11px", color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{s.clientName || getTranslation("shipments.unknown_client")}</td>
                  <td style={{ padding: "11px", textAlign: "right", color: "#10b981", fontWeight: "bold", fontSize: isMobile ? "10px" : "12px" }}>{formatAmount(s.amount)}</td>
                  <td style={{ padding: "11px", color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{s.phone || "-"}</td>
                  <td style={{ padding: "11px", color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{s.address?.substring(0, isMobile ? 20 : 32) || "-"}</td>
                  <td style={{ padding: "11px", color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{new Date(s.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US")}</td>
                  <td style={{ padding: "11px", textAlign: "center" }}>
                    <span style={{ background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), padding: isMobile ? "3px 8px" : "4px 11px", borderRadius: "18px", fontSize: isMobile ? "9px" : "11px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      {getStatusIcon(s.status, isMobile ? 10 : 12)} {getStatusText(s.status)}
                    </span>
                  </td>
                  <td style={{ padding: "11px", textAlign: "center" }}>
                    <select 
                      value={s.status} 
                      onChange={(e) => updateStatus(s.id, e.target.value)} 
                      disabled={updating === s.id} 
                      style={{ padding: isMobile ? "4px 8px" : "5px 11px", background: "#1a1a1a", border: `1px solid ${getStatusColor(s.status)}`, borderRadius: "7px", color: getStatusColor(s.status), cursor: updating === s.id ? "wait" : "pointer", fontSize: isMobile ? "9px" : "11px" }}
                    >
                      <option value="pending">{getTranslation("shipments.status_pending")}</option>
                      <option value="in_transit">{getTranslation("shipments.status_in_transit")}</option>
                      <option value="delivered">{getTranslation("shipments.status_delivered")}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "7px", marginTop: "22px", paddingTop: "14px", borderTop: "1px solid #222", flexWrap: "wrap" }}>
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
                <Ic.ChevronsLeft size={14} color="white" />
              </button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
                <Ic.ChevronLeft size={14} color="white" />
              </button>
              <span style={{ padding: "6px 10px", color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.page")} {currentPage} {getTranslation("shipments.of")} {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
                <Ic.ChevronRight size={14} color="white" />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
                <Ic.ChevronsRight size={14} color="white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* GRID VIEW - Responsive */}
      {viewMode === "grid" && filteredShipments.length > 0 && (
        <>
          <div className="grid-cards" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(324px, 1fr))", gap: "18px" }}>
            {paginatedShipments.map((s) => (
              <div key={s.id} style={{ background: "#111", borderRadius: "14px", padding: "16px", border: `1px solid ${getStatusColor(s.status)}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "14px" }}>
                  <div style={{ width: "45px", height: "45px", borderRadius: "23px", background: `${getStatusColor(s.status)}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getStatusIcon(s.status, 22)}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: "bold", fontSize: "13px", fontFamily: "monospace" }}>{s.trackingNumber}</div>
                    <div style={{ color: "#94a3b8", fontSize: "10px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Ic.User size={10} color="#94a3b8" /> {s.clientName || getTranslation("shipments.unknown_client")}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                    <span style={{ color: "#666", fontSize: "9px", display: "flex", alignItems: "center", gap: "4px" }}><Ic.DollarSign size={10} color="#555" /> {getTranslation("shipments.amount")}</span>
                    <span style={{ color: "#10b981", fontSize: "10px" }}>{formatAmount(s.amount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                    <span style={{ color: "#666", fontSize: "9px", display: "flex", alignItems: "center", gap: "4px" }}><Ic.Phone size={10} color="#555" /> {getTranslation("shipments.phone")}</span>
                    <span style={{ color: "#94a3b8", fontSize: "10px" }}>{s.phone || "-"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                    <span style={{ color: "#666", fontSize: "9px", display: "flex", alignItems: "center", gap: "4px" }}><Ic.MapPin size={10} color="#555" /> {getTranslation("shipments.address")}</span>
                    <span style={{ color: "#94a3b8", fontSize: "10px", textAlign: "right" }}>{s.address?.substring(0, 20) || "-"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#666", fontSize: "9px", display: "flex", alignItems: "center", gap: "4px" }}><Ic.BarChart size={10} color="#555" /> {getTranslation("shipments.status")}</span>
                    <span style={{ background: `${getStatusColor(s.status)}20`, color: getStatusColor(s.status), padding: "2px 7px", borderRadius: "11px", fontSize: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {getStatusIcon(s.status, 9)} {getStatusText(s.status)}
                    </span>
                  </div>
                </div>
                <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} disabled={updating === s.id} style={{ width: "100%", padding: "7px 11px", marginTop: "7px", background: "#1a1a1a", border: `1px solid ${getStatusColor(s.status)}`, borderRadius: "7px", color: getStatusColor(s.status), cursor: updating === s.id ? "wait" : "pointer", fontSize: "10px" }}>
                  <option value="pending">{getTranslation("shipments.status_pending")}</option>
                  <option value="in_transit">{getTranslation("shipments.status_in_transit")}</option>
                  <option value="delivered">{getTranslation("shipments.status_delivered")}</option>
                </select>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "7px", marginTop: "22px", paddingTop: "14px", borderTop: "1px solid #222", flexWrap: "wrap" }}>
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
                <Ic.ChevronsLeft size={14} color="white" />
              </button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
                <Ic.ChevronLeft size={14} color="white" />
              </button>
              <span style={{ padding: "6px 10px", color: "#94a3b8", fontSize: isMobile ? "10px" : "12px" }}>{getTranslation("shipments.page")} {currentPage} {getTranslation("shipments.of")} {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
                <Ic.ChevronRight size={14} color="white" />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: "6px 10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px", color: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
                <Ic.ChevronsRight size={14} color="white" />
              </button>
            </div>
          )}
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}