"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
);

// --- SVG Icon Components -------------------------------------------------------

const IconTruck = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
    <rect x="9" y="11" width="14" height="10" rx="2"/>
    <circle cx="12" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
  </svg>
);

const IconPackage = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15"/>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/>
    <path d="M12 22V12"/>
  </svg>
);

const IconClock = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCheckCircle = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconXCircle = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const IconBarChart = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconTrendingUp = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);

const IconPlus = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconList = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconEdit = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconSearch = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconSave = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconX = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconUser = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconMail = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconPhone = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconDollarSign = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconCalendar = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconMapPin = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconAlertCircle = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconLoader = ({ size = 48, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

const IconTag = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconBuilding = ({ size = 28, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const IconLock = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconCheck = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

interface Shipment {
  id: number;
  trackingNumber: string;
  clientName: string;
  address: string;
  transporteurId: number | null;
  estimatedDelivery: string | null;
  status: string;
  amount: number;
  phone: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

interface Transporteur {
  id: number;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  status?: string;
}

export default function LogisticsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const { formatCurrency, getCurrencySymbol } = useAppSettings();

  // Margin left pour desktop (sidebar fixe)
  const contentMarginLeft = isMobile ? "0" : "0px";

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState({ open: false, form: {} as any, editMode: false, editId: null as number | null });
  const [carrierModal, setCarrierModal] = useState({ open: false, form: {} as any, editMode: false, editId: null as number | null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("shipments");
  const [stats, setStats] = useState({ total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0, onTime: 0 });

  const sectionMargin = isMobile ? "16px" : "24px";
  const headerTitleSize = isMobile ? "20px" : "28px";
  const buttonPadding = isMobile ? "6px 10px" : "8px 16px";
  const contentPadding = isMobile ? "12px" : "24px";
  const cardGap = isMobile ? "12px" : "16px";
  const gridMinWidth = isMobile ? "280px" : "320px";
  const tableMinWidth = isMobile ? "750px" : "100%";

  const currencySymbol = getCurrencySymbol();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchShipments();
    fetchTransporteurs();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchShipments = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/client/shipments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setShipments(data);

      const pending = data.filter((s: Shipment) => s.status === "pending").length;
      const inTransit = data.filter((s: Shipment) => s.status === "in_transit").length;
      const delivered = data.filter((s: Shipment) => s.status === "delivered").length;
      const cancelled = data.filter((s: Shipment) => s.status === "cancelled").length;
      const deliveredOnTime = data.filter((s: Shipment) => s.status === "delivered" && s.estimatedDelivery && new Date(s.estimatedDelivery) >= new Date(s.updatedAt)).length;

      setStats({
        total: data.length,
        pending, inTransit, delivered, cancelled,
        onTime: data.length > 0 && delivered > 0 ? Number((deliveredOnTime / delivered * 100).toFixed(1)) : 0
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchTransporteurs = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transporteurs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTransporteurs(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const formatAmount = (amount: number) => {
    if (!amount && amount !== 0) return `0 ${currencySymbol}`;
    return `${amount.toLocaleString()} ${currencySymbol}`;
  };

  const getStatusText = (status: string) => {
    if (status === "delivered") return t("common.delivered");
    if (status === "in_transit") return t("common.inTransit");
    if (status === "pending") return t("common.pending");
    if (status === "cancelled") return t("common.cancelled");
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "delivered") return "#10b981";
    if (status === "in_transit") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return "#94a3b8";
  };

  const getStatusIcon = (status: string) => {
    if (status === "delivered") return <IconCheckCircle size={18} color="#10b981" />;
    if (status === "in_transit") return <IconTruck size={18} color="#3b82f6" />;
    if (status === "pending") return <IconClock size={18} color="#f59e0b" />;
    if (status === "cancelled") return <IconXCircle size={18} color="#ef4444" />;
    return <IconPackage size={18} color="#94a3b8" />;
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const createTransporteur = async () => {
    const token = localStorage.getItem("token");

    if (!carrierModal.form.name || !carrierModal.form.email || !carrierModal.form.password) {
      showMessage(t("logistics.fillRequiredFields"), "error");
      return;
    }

    if (carrierModal.form.password.length < 6) {
      showMessage(t("logistics.passwordMinLength"), "error");
      return;
    }

    if (carrierModal.form.password !== carrierModal.form.confirmPassword) {
      showMessage(t("logistics.passwordMismatch"), "error");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transporteurs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: carrierModal.form.name,
          email: carrierModal.form.email,
          password: carrierModal.form.password,
          phone: carrierModal.form.phone || "",
          companyName: carrierModal.form.companyName || "",
          address: carrierModal.form.address || ""
        })
      });

      if (res.ok) {
        setCarrierModal({ open: false, form: {}, editMode: false, editId: null });
        await fetchTransporteurs();
        showMessage(t("logistics.carrierCreated"), "success");
      } else {
        const data = await res.json();
        showMessage(data.message || data.error || t("common.error"), "error");
      }
    } catch(e) {
      console.error(e);
      showMessage(t("common.error"), "error");
    }
  };

  const updateTransporteur = async () => {
    const token = localStorage.getItem("token");

    try {
      const updateData: any = {
        name: carrierModal.form.name,
        email: carrierModal.form.email,
        phone: carrierModal.form.phone || "",
        companyName: carrierModal.form.companyName || "",
        address: carrierModal.form.address || "",
        status: carrierModal.form.status || "active"
      };

      if (carrierModal.form.password && carrierModal.form.password.trim() !== "") {
        if (carrierModal.form.password.length < 6) {
          showMessage(t("logistics.passwordMinLength"), "error");
          return;
        }
        if (carrierModal.form.password !== carrierModal.form.confirmPassword) {
          showMessage(t("logistics.passwordMismatch"), "error");
          return;
        }
        updateData.password = carrierModal.form.password;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transporteurs/${carrierModal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setCarrierModal({ open: false, form: {}, editMode: false, editId: null });
        await fetchTransporteurs();
        showMessage(t("logistics.carrierUpdated"), "success");
      } else {
        const data = await res.json();
        showMessage(data.message || data.error || t("common.error"), "error");
      }
    } catch(e) {
      console.error(e);
      showMessage(t("common.error"), "error");
    }
  };

  const deleteTransporteur = async (id: number) => {
    if (confirm(t("logistics.confirmDeleteCarrier"))) {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transporteurs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchTransporteurs();
        showMessage(t("logistics.carrierDeleted"), "success");
        if (selectedCarrierId === id) setSelectedCarrierId(null);
      } else {
        const error = await res.json();
        showMessage(error.message || t("common.error"), "error");
      }
    }
  };

  const createShipment = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/client/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchShipments();
        showMessage(t("logistics.shipmentCreated"), "success");
      } else {
        showMessage(t("common.error"), "error");
      }
    } catch(e) {
      showMessage(t("common.error"), "error");
    }
  };

  const updateShipment = async () => {
    const token = localStorage.getItem("token");

    if (!modal.form.trackingNumber || !modal.form.clientName || !modal.form.address) {
      showMessage(t("logistics.fillRequiredFields"), "error");
      return;
    }

    try {
      const updateData = {
        trackingNumber: modal.form.trackingNumber,
        clientName: modal.form.clientName,
        address: modal.form.address,
        transporteurId: modal.form.transporteurId ? parseInt(modal.form.transporteurId) : null,
        estimatedDelivery: modal.form.estimatedDelivery || null,
        status: modal.form.status || "pending",
        amount: parseFloat(modal.form.amount) || 0,
        phone: modal.form.phone || ""
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/client/shipments/${modal.editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        await fetchShipments();
        showMessage(t("logistics.shipmentUpdated"), "success");
      } else {
        const data = await res.json();
        showMessage(data.message || data.error || t("common.error"), "error");
      }
    } catch(e) {
      console.error("Network error:", e);
      showMessage(t("common.error"), "error");
    }
  };

  const deleteShipment = async (id: number) => {
    if (confirm(t("logistics.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/client/shipments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchShipments();
      showMessage(t("logistics.shipmentDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("logistics.confirmBulkDelete").replace("{count}", String(selectedIds.length)))) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/client/shipments/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchShipments();
      setSelectedIds([]);
      showMessage(t("logistics.shipmentsDeleted").replace("{count}", String(selectedIds.length)), "success");
    }
  };

  const openEditModal = (shipment: Shipment) => {
    setModal({
      open: true,
      editMode: true,
      editId: shipment.id,
      form: {
        trackingNumber: shipment.trackingNumber || "",
        clientName: shipment.clientName || "",
        address: shipment.address || "",
        transporteurId: shipment.transporteurId || "",
        estimatedDelivery: shipment.estimatedDelivery ? shipment.estimatedDelivery.split("T")[0] : "",
        status: shipment.status || "pending",
        amount: shipment.amount || 0,
        phone: shipment.phone || ""
      }
    });
  };

  const openCarrierEditModal = (carrier: Transporteur) => {
    setCarrierModal({
      open: true,
      editMode: true,
      editId: carrier.id,
      form: {
        name: carrier.name || "",
        email: carrier.email || "",
        phone: carrier.phone || "",
        companyName: carrier.companyName || "",
        address: carrier.address || "",
        status: carrier.status || "active",
        password: "",
        confirmPassword: ""
      }
    });
  };

  const filteredShipments = shipments.filter(s => {
    const matchSearch =
      s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (s.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const animations = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes svgSpin {
      to { transform: rotate(360deg); }
    }
  `;

  const statusChartData = {
    labels: [t("common.pending"), t("common.inTransit"), t("common.delivered"), t("common.cancelled")],
    datasets: [{
      data: [stats.pending, stats.inTransit, stats.delivered, stats.cancelled],
      backgroundColor: ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: isMobile ? 9 : 11 } }
      }
    }
  };

  const inputStyle = {
    width: "100%",
    padding: isMobile ? "8px 10px" : "10px 12px",
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    color: theme.text,
    boxSizing: "border-box" as const,
    fontSize: isMobile ? "13px" : "14px"
  };

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ animation: "svgSpin 1s linear infinite", display: "inline-block", marginBottom: "16px" }}>
            <IconLoader size={isMobile ? 40 : 48} color={theme.primary} />
          </div>
          <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
      <div style={{ 
        marginLeft: contentMarginLeft, 
        flex: 1, 
        padding: contentPadding, 
        paddingBottom: isMobile ? "70px" : "24px",
        paddingTop: contentPadding, 
        width: isMobile ? "100%" : "auto", 
        overflowX: "hidden" 
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>

          <style>{animations}</style>

          {/* Header */}
          <div style={{
            marginBottom: sectionMargin,
            animation: "fadeInDown 0.5s ease",
            opacity: animateCards ? 1 : 0
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: isMobile ? "12px" : "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconTruck size={isMobile ? 20 : 28} color={theme.primary} />
                  {t("common.logistics")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "11px" : "14px" }}>
                  {t("logistics.subtitle")}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setViewMode("list")}
                    style={{ padding: buttonPadding, background: viewMode === "list" ? theme.primary : theme.surface, border: `1px solid ${theme.border}`, borderRadius: "8px", color: viewMode === "list" ? "white" : theme.text, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px", fontSize: isMobile ? "10px" : "13px" }}
                  >
                    <IconList size={12} />
                    {!isMobile && t("common.listView")}
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    style={{ padding: buttonPadding, background: viewMode === "grid" ? theme.primary : theme.surface, border: `1px solid ${theme.border}`, borderRadius: "8px", color: viewMode === "grid" ? "white" : theme.text, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px", fontSize: isMobile ? "10px" : "13px" }}
                  >
                    <IconGrid size={12} />
                    {!isMobile && t("common.gridView")}
                  </button>
                </div>
                <button
                  onClick={() => setModal({ open: true, editMode: false, editId: null, form: { trackingNumber: "", clientName: "", address: "", transporteurId: "", estimatedDelivery: "", status: "pending", amount: 0, phone: "" } })}
                  style={{ background: theme.gradient, color: "white", padding: buttonPadding, border: "none", borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <IconPlus size={12} color="white" />
                  {t("common.add")}
                </button>
              </div>
            </div>
          </div>

          {/* Notification */}
          {message && (
            <div style={{
              background: messageType === "success" ? `${theme.accent}15` : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`,
              color: messageType === "success" ? theme.accent : "#f87171",
              padding: isMobile ? "8px 12px" : "12px 16px",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "fadeInUp 0.3s ease",
              fontSize: isMobile ? "11px" : "14px"
            }}>
              {messageType === "success" ? <IconCheck size={14} color={theme.accent} /> : <IconAlertCircle size={14} color="#f87171" />}
              {message}
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "130px" : "150px"}, 1fr))`, gap: cardGap, marginBottom: sectionMargin }}>
            {[
              { icon: <IconPackage size={isMobile ? 18 : 22} color={theme.primary} />, label: t("logistics.totalShipments"), value: stats.total, color: theme.primary },
              { icon: <IconClock size={isMobile ? 18 : 22} color="#f59e0b" />, label: t("common.pending"), value: stats.pending, color: "#f59e0b" },
              { icon: <IconTruck size={isMobile ? 18 : 22} color="#3b82f6" />, label: t("common.inTransit"), value: stats.inTransit, color: "#3b82f6" },
              { icon: <IconCheckCircle size={isMobile ? 18 : 22} color="#10b981" />, label: t("common.delivered"), value: stats.delivered, color: "#10b981" },
              { icon: <IconXCircle size={isMobile ? 18 : 22} color="#ef4444" />, label: t("common.cancelled"), value: stats.cancelled, color: "#ef4444" },
              { icon: <IconBarChart size={isMobile ? 18 : 22} color="#10b981" />, label: t("logistics.onTimeDeliveries"), value: stats.onTime, suffix: "%", color: "#10b981" }
            ].map((card, idx) => (
              <div key={idx} style={{
                background: theme.surface,
                borderRadius: "16px",
                padding: isMobile ? "10px 8px" : "14px 12px",
                textAlign: "center",
                border: `1px solid ${theme.border}`,
                animation: `fadeInUp 0.5s ease ${0.03 + idx * 0.02}s`,
                opacity: animateCards ? 1 : 0,
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer"
              }}>
                <div style={{ marginBottom: "4px", display: "flex", justifyContent: "center" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "18px" : "20px", color: card.color, fontWeight: "700" }}>{card.value}{card.suffix || ""}</div>
                <div style={{ fontSize: isMobile ? "8px" : "9px", color: theme.textSecondary, marginTop: "2px", lineHeight: 1.2 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            gap: "2px",
            marginBottom: "20px",
            borderBottom: `1px solid ${theme.border}`,
            flexWrap: "wrap"
          }}>
            {[
              { key: "shipments", icon: <IconPackage size={isMobile ? 13 : 15} />, label: t("logistics.shipments") },
              { key: "carriers", icon: <IconTruck size={isMobile ? 13 : 15} />, label: t("logistics.carriers") },
              { key: "analytics", icon: <IconBarChart size={isMobile ? 13 : 15} />, label: t("logistics.analytics") }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: isMobile ? "8px 12px" : "10px 20px",
                  background: activeTab === tab.key ? theme.primary : "transparent",
                  border: "none",
                  borderRadius: "8px 8px 0 0",
                  color: activeTab === tab.key ? "white" : theme.textSecondary,
                  cursor: "pointer",
                  fontSize: isMobile ? "11px" : "14px",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Shipments */}
          {activeTab === "shipments" && (
            <>
              {/* Filters */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: isMobile ? "8px" : "12px", flexWrap: "wrap", marginBottom: "12px", flexDirection: isMobile ? "column" : "row" }}>
                  <div style={{ flex: 2, position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: "10px", color: theme.textSecondary, pointerEvents: "none" }}>
                      <IconSearch size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder={`${t("common.search")}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: "32px", flex: 1 }}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ ...inputStyle, width: isMobile ? "100%" : "160px", cursor: "pointer" }}
                  >
                    <option value="all">{t("logistics.allStatus")}</option>
                    <option value="pending">{t("common.pending")}</option>
                    <option value="in_transit">{t("common.inTransit")}</option>
                    <option value="delivered">{t("common.delivered")}</option>
                    <option value="cancelled">{t("common.cancelled")}</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
                  {selectedIds.length > 0 && (
                    <button
                      onClick={deleteSelected}
                      style={{ background: "#c33", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "11px" : "14px", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <IconTrash size={12} color="white" />
                      {t("common.delete")} ({selectedIds.length})
                    </button>
                  )}
                </div>
              </div>

              {/* List View */}
              {viewMode === "list" && (
                <div style={{
                  background: theme.surface,
                  borderRadius: "16px",
                  padding: isMobile ? "8px" : "16px",
                  border: `1px solid ${theme.border}`,
                  overflowX: "auto"
                }}>
                  {filteredShipments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: isMobile ? "30px" : "40px" }}>
                      <div style={{ marginBottom: "12px", opacity: 0.3 }}><IconTruck size={isMobile ? 40 : 48} color={theme.text} /></div>
                      <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                        {searchTerm ? t("common.noResults") : t("logistics.noShipments")}
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: tableMinWidth }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                            <th style={{ padding: isMobile ? "6px" : "10px", width: "35px" }}>
                              <input type="checkbox" style={{ width: "14px", height: "14px", cursor: "pointer" }} />
                            </th>
                            <th style={{ padding: isMobile ? "6px" : "10px", textAlign: "left" }}>{t("common.trackingNumber")}</th>
                            <th style={{ padding: isMobile ? "6px" : "10px", textAlign: "left" }}>{t("common.client")}</th>
                            <th style={{ padding: isMobile ? "6px" : "10px", textAlign: "right" }}>{t("common.amount")}</th>
                            <th style={{ padding: isMobile ? "6px" : "10px", textAlign: "center" }}>{t("common.status")}</th>
                            <th style={{ padding: isMobile ? "6px" : "10px", textAlign: "left" }}>{t("common.carrier")}</th>
                            <th style={{ padding: isMobile ? "6px" : "10px", textAlign: "left" }}>{t("common.estimatedDelivery")}</th>
                            <th style={{ padding: isMobile ? "6px" : "10px", textAlign: "center" }}>{t("common.actions")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredShipments.slice(0, 10).map((shipment) => {
                            const transporteur = transporteurs.find(t => t.id === shipment.transporteurId);
                            const isChecked = selectedIds.includes(shipment.id);
                            return (
                              <tr key={shipment.id} style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.15s" }}>
                                <td style={{ padding: isMobile ? "6px" : "10px", textAlign: "center" }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) setSelectedIds(selectedIds.filter(id => id !== shipment.id));
                                      else setSelectedIds([...selectedIds, shipment.id]);
                                    }}
                                    style={{ width: "14px", height: "14px", cursor: "pointer" }} 
                                  />
                                </td>
                                <td style={{ padding: isMobile ? "6px" : "10px" }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: theme.text, fontWeight: "500", fontSize: isMobile ? "10px" : "13px" }}>
                                    <IconTag size={10} color={theme.textSecondary} />
                                    {shipment.trackingNumber}
                                  </span>
                                </td>
                                <td style={{ padding: isMobile ? "6px" : "10px", color: theme.textSecondary, fontSize: isMobile ? "10px" : "13px" }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <IconUser size={10} color={theme.textSecondary} />
                                    {shipment.clientName}
                                  </span>
                                </td>
                                <td style={{ padding: isMobile ? "6px" : "10px", textAlign: "right", color: "#10b981", fontWeight: "bold", fontSize: isMobile ? "10px" : "13px" }}>
                                  {formatAmount(shipment.amount)}
                                </td>
                                <td style={{ padding: isMobile ? "6px" : "10px", textAlign: "center" }}>
                                  <span style={{
                                    background: `${getStatusColor(shipment.status)}18`,
                                    color: getStatusColor(shipment.status),
                                    padding: "2px 8px",
                                    borderRadius: "16px",
                                    fontSize: isMobile ? "9px" : "11px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    fontWeight: 500
                                  }}>
                                    {getStatusIcon(shipment.status)}
                                    {getStatusText(shipment.status)}
                                  </span>
                                </td>
                                <td style={{ padding: isMobile ? "6px" : "10px", color: theme.textSecondary, fontSize: isMobile ? "10px" : "13px" }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <IconTruck size={10} color={theme.textSecondary} />
                                    {shipment.transporteurId ? transporteur?.name : t("common.unassigned")}
                                  </span>
                                </td>
                                <td style={{ padding: isMobile ? "6px" : "10px", color: theme.textSecondary, fontSize: isMobile ? "10px" : "13px" }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <IconCalendar size={10} color={theme.textSecondary} />
                                    {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : "-"}
                                  </span>
                                </td>
                                <td style={{ padding: isMobile ? "6px" : "10px", textAlign: "center" }}>
                                  <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                    <button
                                      onClick={() => openEditModal(shipment)}
                                      style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "5px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}
                                      title={t("common.edit")}
                                    >
                                      <IconEdit size={11} color="white" />
                                    </button>
                                    <button
                                      onClick={() => deleteShipment(shipment.id)}
                                      style={{ background: "#c33", color: "white", border: "none", borderRadius: "5px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}
                                      title={t("common.delete")}
                                    >
                                      <IconTrash size={11} color="white" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Grid View */}
              {viewMode === "grid" && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`,
                  gap: "12px"
                }}>
                  {filteredShipments.slice(0, 12).map((shipment) => (
                    <div key={shipment.id} style={{
                      background: theme.surface,
                      borderRadius: "12px",
                      padding: "12px",
                      border: `1px solid ${getStatusColor(shipment.status)}50`,
                      transition: "transform 0.2s, box-shadow 0.2s"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${getStatusColor(shipment.status)}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {getStatusIcon(shipment.status)}
                        </div>
                        <div>
                          <div style={{ color: theme.text, fontWeight: "600", fontSize: isMobile ? "12px" : "13px" }}>{shipment.trackingNumber}</div>
                          <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <IconUser size={9} color={theme.textSecondary} />
                            {shipment.clientName}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "10px" }}>{t("common.amount")}</span>
                        <span style={{ color: "#10b981", fontSize: isMobile ? "11px" : "12px", fontWeight: "bold" }}>{formatAmount(shipment.amount)}</span>
                      </div>
                      <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "10px" }}>{t("common.status")}</span>
                        <span style={{ color: getStatusColor(shipment.status), fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", gap: "3px", fontWeight: 500 }}>
                          {getStatusIcon(shipment.status)}
                          {getStatusText(shipment.status)}
                        </span>
                      </div>
                      <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "10px" }}>{t("common.carrier")}</span>
                        <span style={{ color: theme.textSecondary, fontSize: isMobile ? "10px" : "11px" }}>
                          {shipment.transporteurId ? transporteurs.find(t => t.id === shipment.transporteurId)?.name : "-"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => openEditModal(shipment)}
                          style={{ flex: 1, padding: "5px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}
                        >
                          <IconEdit size={10} color="white" />
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => deleteShipment(shipment.id)}
                          style={{ flex: 1, padding: "5px", background: "#c33", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}
                        >
                          <IconTrash size={10} color="white" />
                          {t("common.delete")}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredShipments.length === 0 && (
                    <div style={{ textAlign: "center", padding: "30px", gridColumn: "1 / -1" }}>
                      <div style={{ marginBottom: "12px", opacity: 0.3 }}><IconTruck size={isMobile ? 40 : 48} color={theme.text} /></div>
                      <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{t("logistics.noShipments")}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Tab 2: Carriers */}
          {activeTab === "carriers" && (
            <div style={{
              background: theme.surface,
              borderRadius: "16px",
              padding: isMobile ? "12px" : "16px",
              border: `1px solid ${theme.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ color: theme.text, fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconTruck size={isMobile ? 16 : 18} color={theme.primary} />
                  {t("logistics.carriers")}
                </h3>
                <button
                  onClick={() => setCarrierModal({ open: true, editMode: false, editId: null, form: { name: "", email: "", password: "", confirmPassword: "", phone: "", companyName: "", address: "" } })}
                  style={{ background: theme.accent, color: "white", padding: isMobile ? "6px 12px" : "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: isMobile ? "11px" : "14px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <IconPlus size={12} color="white" />
                  {t("logistics.addCarrier")}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {transporteurs.map(carrier => (
                  <div key={carrier.id} style={{
                    background: selectedCarrierId === carrier.id ? `${theme.primary}12` : theme.surfaceHover,
                    borderRadius: "12px",
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    border: `1px solid ${selectedCarrierId === carrier.id ? theme.primary : theme.border}`,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                    onClick={() => setSelectedCarrierId(selectedCarrierId === carrier.id ? null : carrier.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${theme.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <IconBuilding size={isMobile ? 18 : 22} color={theme.primary} />
                      </div>
                      <div>
                        <div style={{ color: theme.text, fontWeight: "600", fontSize: isMobile ? "13px" : "14px" }}>{carrier.name}</div>
                        <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                          <IconMail size={10} color={theme.textSecondary} />
                          {carrier.email}
                        </div>
                        {carrier.phone && (
                          <div style={{ color: theme.textSecondary, fontSize: isMobile ? "8px" : "10px", display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                            <IconPhone size={9} color={theme.textSecondary} />
                            {carrier.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openCarrierEditModal(carrier); }}
                        style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", gap: "3px" }}
                      >
                        <IconEdit size={11} color="white" />
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTransporteur(carrier.id); }}
                        style={{ background: "#c33", color: "white", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", gap: "3px" }}
                      >
                        <IconTrash size={11} color="white" />
                        {t("common.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {transporteurs.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <div style={{ marginBottom: "12px", opacity: 0.3 }}><IconTruck size={isMobile ? 40 : 48} color={theme.text} /></div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{t("logistics.noCarriers")}</p>
                  <button
                    onClick={() => setCarrierModal({ open: true, editMode: false, editId: null, form: { name: "", email: "", password: "", confirmPassword: "", phone: "", companyName: "", address: "" } })}
                    style={{ marginTop: "12px", padding: isMobile ? "6px 12px" : "8px 16px", background: theme.primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: isMobile ? "11px" : "14px" }}
                  >
                    <IconPlus size={12} color="white" />
                    {t("logistics.addCarrier")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Analytics */}
          {activeTab === "analytics" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "16px"
            }}>
              <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "12px" : "16px", border: `1px solid ${theme.border}` }}>
                <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconBarChart size={14} color={theme.primary} />
                  {t("logistics.statusDistribution")}
                </h3>
                <div style={{ height: isMobile ? "180px" : "200px" }}>
                  <Doughnut data={statusChartData} options={chartOptions} />
                </div>
              </div>
              <div style={{ background: theme.surface, borderRadius: "16px", padding: isMobile ? "12px" : "16px", border: `1px solid ${theme.border}` }}>
                <h3 style={{ color: theme.text, marginBottom: "12px", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconTrendingUp size={14} color={theme.primary} />
                  {t("logistics.deliveryPerformance")}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center", height: isMobile ? "180px" : "200px" }}>
                  {[
                    { label: t("logistics.onTimeDeliveries"), value: stats.onTime, color: "#10b981" },
                    { label: t("logistics.deliveryRate"), value: stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0, color: "#3b82f6" },
                    { label: t("logistics.cancellationRate"), value: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0, color: "#ef4444" }
                  ].map((bar, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: theme.textSecondary, fontSize: isMobile ? "10px" : "11px" }}>{bar.label}</span>
                        <span style={{ color: bar.color, fontWeight: "bold", fontSize: isMobile ? "11px" : "12px" }}>{bar.value.toFixed(1)}%</span>
                      </div>
                      <div style={{ background: theme.surfaceHover, borderRadius: "6px", height: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(bar.value, 100)}%`, background: bar.color, height: "6px", borderRadius: "6px", transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Carrier */}
      {carrierModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: theme.surface, padding: isMobile ? "20px" : "28px", borderRadius: "20px", width: isMobile ? "95%" : "480px", maxWidth: "95%", border: `1px solid ${theme.border}`, maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "18px" : "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              {carrierModal.editMode
                ? <><IconEdit size={16} color={theme.primary} /> {t("logistics.editCarrier")}</>
                : <><IconUser size={16} color={theme.primary} /> {t("logistics.addCarrier")}</>
              }
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconUser size={13} /></span>
                <input type="text" placeholder={`${t("common.name")} *`} value={carrierModal.form.name || ""} onChange={e => setCarrierModal({ ...carrierModal, form: { ...carrierModal.form, name: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconMail size={13} /></span>
                <input type="email" placeholder={`${t("common.email")} *`} value={carrierModal.form.email || ""} onChange={e => setCarrierModal({ ...carrierModal, form: { ...carrierModal.form, email: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconLock size={13} /></span>
                <input type="password" placeholder={carrierModal.editMode ? t("logistics.newPasswordOptional") : `${t("common.password")} *`} value={carrierModal.form.password || ""} onChange={e => setCarrierModal({ ...carrierModal, form: { ...carrierModal.form, password: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconLock size={13} /></span>
                <input type="password" placeholder={t("common.confirmPassword")} value={carrierModal.form.confirmPassword || ""} onChange={e => setCarrierModal({ ...carrierModal, form: { ...carrierModal.form, confirmPassword: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconPhone size={13} /></span>
                <input type="text" placeholder={t("common.phone")} value={carrierModal.form.phone || ""} onChange={e => setCarrierModal({ ...carrierModal, form: { ...carrierModal.form, phone: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconBuilding size={13} /></span>
                <input type="text" placeholder={t("logistics.companyName")} value={carrierModal.form.companyName || ""} onChange={e => setCarrierModal({ ...carrierModal, form: { ...carrierModal.form, companyName: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconMapPin size={13} /></span>
                <input type="text" placeholder={t("common.address")} value={carrierModal.form.address || ""} onChange={e => setCarrierModal({ ...carrierModal, form: { ...carrierModal.form, address: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={carrierModal.editMode ? updateTransporteur : createTransporteur}
                style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: isMobile ? "13px" : "14px" }}
              >
                <IconSave size={13} color="white" />
                {t("common.save")}
              </button>
              <button
                onClick={() => setCarrierModal({ open: false, form: {}, editMode: false, editId: null })}
                style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: isMobile ? "13px" : "14px" }}
              >
                <IconX size={13} color={theme.text} />
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Shipment */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: theme.surface, padding: isMobile ? "20px" : "28px", borderRadius: "20px", width: isMobile ? "95%" : "480px", maxWidth: "95%", border: `1px solid ${theme.border}`, maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "18px" : "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              {modal.editMode
                ? <><IconEdit size={16} color={theme.primary} /> {t("logistics.editShipment")}</>
                : <><IconTruck size={16} color={theme.primary} /> {t("logistics.addShipment")}</>
              }
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconTag size={13} /></span>
                <input type="text" placeholder={`${t("common.trackingNumber")} *`} value={modal.form.trackingNumber || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, trackingNumber: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconUser size={13} /></span>
                <input type="text" placeholder={`${t("common.client")} *`} value={modal.form.clientName || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, clientName: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconMapPin size={13} /></span>
                <input type="text" placeholder={`${t("common.address")} *`} value={modal.form.address || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, address: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconPhone size={13} /></span>
                <input type="text" placeholder={t("common.phone")} value={modal.form.phone || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconDollarSign size={13} /></span>
                <input type="number" placeholder={`${t("common.amount")} (${currencySymbol})`} value={modal.form.amount || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, amount: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: theme.textSecondary }}><IconCalendar size={13} /></span>
                <input type="date" placeholder={t("common.estimatedDelivery")} value={modal.form.estimatedDelivery || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, estimatedDelivery: e.target.value } })} style={{ ...inputStyle, paddingLeft: "32px" }} />
              </div>
              <select
                value={modal.form.transporteurId || ""}
                onChange={e => setModal({ ...modal, form: { ...modal.form, transporteurId: e.target.value } })}
                style={{ ...inputStyle }}
              >
                <option value="">{t("logistics.selectCarrier")}</option>
                {transporteurs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={modal.editMode ? updateShipment : createShipment}
                style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: isMobile ? "13px" : "14px" }}
              >
                <IconSave size={13} color="white" />
                {t("common.save")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })}
                style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: isMobile ? "13px" : "14px" }}
              >
                <IconX size={13} color={theme.text} />
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}