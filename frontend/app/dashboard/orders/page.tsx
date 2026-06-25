"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";

// --- Interfaces ----------------------------------------------------------------

interface Order {
  id: number;
  clientName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  createdAt: string;
}

interface Client {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price?: number;
}

interface OrderForm {
  clientName?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  status?: string;
}

interface ModalState {
  open: boolean;
  form: OrderForm;
}

interface StatsState {
  total: number;
  pending: number;
  processing: number;
  delivered: number;
  cancelled: number;
  totalAmount: number;
}

// --- SVG Icon Components -------------------------------------------------------

const IconChart = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconClock = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconRefresh = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconCheck = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconDollar = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconPlus = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconSearch = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconFilter = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconFileText = ({ size = 40, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconSave = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconOrder = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

// --- SelectAllCheckbox ---------------------------------------------------------

interface SelectAllCheckboxProps {
  items: Order[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onSelectAll: (ids: number[]) => void;
  getItemId: (item: Order) => number;
}

function SelectAllCheckbox({ items, selectedIds, onSelect, onSelectAll, getItemId }: SelectAllCheckboxProps) {
  const { t } = useLanguage();
  const { isMobile } = useResponsive();
  const { theme } = useTheme();

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelect([]);
    } else {
      onSelectAll(items.map(getItemId));
    }
  };

  return (
    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", minHeight: "44px" }}>
      <input
        type="checkbox"
        checked={isAllSelected}
        ref={(input) => {
          if (input) input.indeterminate = isIndeterminate;
        }}
        onChange={handleSelectAll}
        style={{ width: isMobile ? "18px" : "16px", height: isMobile ? "18px" : "16px", cursor: "pointer", accentColor: theme.primary }}
      />
      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "13px" }}>
        {t("common.selectAll")}
      </span>
    </label>
  );
}

// --- Main Component ------------------------------------------------------------

export default function OrdersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const contentMarginLeft = isMobile ? "0" : "0px";

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState<ModalState>({ open: false, form: {} });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [stats, setStats] = useState<StatsState>({ total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0, totalAmount: 0 });

  const headerTitleSize = isMobile ? "20px" : "28px";
  const cardPadding = isMobile ? "12px 10px" : "16px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "10px" : "16px";
  const sectionMargin = isMobile ? "18px" : "32px";
  const tableFontSize = isMobile ? "12px" : "13px";
  // ? Touch targets = 44px sur mobile
  const buttonPadding = isMobile ? "12px 16px" : "10px 20px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";
  // ? Hauteur minimum des inputs sur mobile
  const inputPadding = isMobile ? "13px 12px" : "10px 12px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchOrders();
    fetchClients();
    fetchProducts();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterStatus, searchTerm, allOrders]);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data: Order[] = await res.json();
      data = Array.isArray(data) ? data : [];
      setAllOrders(data);
      const totalAmount = data.reduce((s, o) => s + (parseFloat(String(o.total)) || 0), 0);
      setStats({
        total: data.length,
        pending: data.filter(o => o.status === "pending").length,
        processing: data.filter(o => o.status === "processing").length,
        delivered: data.filter(o => o.status === "delivered").length,
        cancelled: data.filter(o => o.status === "cancelled").length,
        totalAmount
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allOrders];
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toString().includes(searchTerm)
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    setOrders(filtered);
    setSelectedIds([]);
  };

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/clients", { headers: { Authorization: `Bearer ${token}` } });
      const data: Client[] = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/products", { headers: { Authorization: `Bearer ${token}` } });
      const data: Product[] = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const createOrder = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchOrders();
        showMessage(t("orders.orderCreated"), "success");
      } else {
        showMessage(t("common.error"), "error");
      }
    } catch (e) {
      showMessage(t("common.error"), "error");
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchOrders();
        showMessage(`? ${t("orders.statusUpdated")}`, "success");
      } else {
        const order = allOrders.find(o => o.id === id);
        if (order) {
          const putRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...order, status: newStatus })
          });
          if (putRes.ok) {
            await fetchOrders();
            showMessage(`? ${t("orders.statusUpdated")}`, "success");
          } else {
            showMessage(t("common.error"), "error");
          }
        } else {
          showMessage(t("common.error"), "error");
        }
      }
    } catch (e) {
      console.error(e);
      showMessage(t("common.error"), "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteOrder = async (id: number) => {
    if (confirm(t("orders.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
      showMessage(t("orders.orderDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("orders.confirmBulkDelete")?.replace("{count}", String(selectedIds.length)) || `Supprimer ${selectedIds.length} commande(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchOrders();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} commande(s) supprim�e(s)`, "success");
    }
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getStatusColor = (status: string) => {
    if (status === "delivered") return "#10b981";
    if (status === "processing") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return "#94a3b8";
  };

  const getStatusText = (status: string) => {
    if (status === "delivered") return t("orders.delivered");
    if (status === "processing") return t("orders.processing");
    if (status === "pending") return t("orders.pending");
    if (status === "cancelled") return t("orders.cancelled");
    return status;
  };

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
  `;

  const statsCards = [
    { icon: <IconChart size={isMobile ? 20 : 24} />, label: t("orders.totalOrders"), value: stats.total, color: theme.primary },
    { icon: <IconClock size={isMobile ? 20 : 24} />, label: t("orders.pending"), value: stats.pending, color: "#f59e0b" },
    { icon: <IconRefresh size={isMobile ? 20 : 24} />, label: t("orders.processing"), value: stats.processing, color: "#3b82f6" },
    { icon: <IconCheck size={isMobile ? 20 : 24} />, label: t("orders.delivered"), value: stats.delivered, color: "#10b981" },
    { icon: <IconX size={isMobile ? 20 : 24} />, label: t("orders.cancelled"), value: stats.cancelled, color: "#ef4444" },
    { icon: <IconDollar size={isMobile ? 20 : 24} />, label: t("orders.totalAmount"), value: formatCurrency(stats.totalAmount), color: theme.accent }
  ];

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <style>{animations}</style>
          <p style={{ fontSize: isMobile ? "13px" : "14px", color: theme.textSecondary }}>{t("common.loading")}</p>
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
        padding: isMobile ? "12px" : "24px",
        paddingBottom: isMobile ? "80px" : "24px",
        overflowX: "hidden",
        background: theme.background
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>

          <style>{animations}</style>

          {/* -- Header -- */}
          <div style={{
            marginBottom: sectionMargin,
            animation: "fadeInDown 0.5s ease",
            opacity: animateCards ? 1 : 0,
            transform: animateCards ? "translateY(0)" : "translateY(-20px)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                  <IconOrder size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.orders")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px", margin: "4px 0 0" }}>
                  {t("orders.subtitle")}
                </p>
              </div>

              {/* ? Boutons header � touch targets larges sur mobile */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <ExportButtons data={orders} filename="commandes" />
                <button
                  onClick={() => setModal({ open: true, form: { clientName: "", productName: "", quantity: 1, unitPrice: 0, total: 0, status: "pending" } })}
                  style={{
                    background: theme.gradient,
                    color: "white",
                    padding: buttonPadding,
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "transform 0.2s, opacity 0.2s",
                    fontSize: isMobile ? "13px" : "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "44px",          // ? touch target
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <IconPlus size={16} color="white" />
                  {t("common.add")}   {/* ? texte complet, pas de troncature */}
                </button>
              </div>
            </div>
          </div>

          {/* -- Message -- */}
          {message && (
            <div style={{
              background: messageType === "success" ? `${theme.accent}15` : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`,
              color: messageType === "success" ? theme.accent : "#f87171",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center",
              animation: "fadeInUp 0.3s ease",
              fontSize: isMobile ? "13px" : "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              {messageType === "success"
                ? <IconCheck size={16} color={theme.accent} />
                : <IconX size={16} color="#f87171" />
              }
              {message}
            </div>
          )}

          {/* -- Stats Cards -- */}
          {/* ? Grid: 3 colonnes sur mobile pour tout afficher sans scroll */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fit, minmax(150px, 1fr))",
            gap: gridGap,
            marginBottom: sectionMargin
          }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: theme.surface,
                  borderRadius: cardRadius,
                  padding: cardPadding,
                  textAlign: "center",
                  border: `1px solid ${theme.border}`,
                  animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.05}s`,
                  opacity: animateCards ? 1 : 0,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  cursor: "pointer",
                  // ? l�g�re ombre sur mobile pour mieux s�parer les cards
                  boxShadow: isMobile ? `0 2px 8px rgba(0,0,0,0.15)` : "none"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.2)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isMobile ? "0 2px 8px rgba(0,0,0,0.15)" : "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px", color: card.color }}>
                  {card.icon}
                </div>
                {/* ? Valeur lisible sur mobile */}
                <div style={{
                  fontSize: isMobile ? "15px" : "20px",
                  color: card.color,
                  fontWeight: "bold",
                  lineHeight: 1.2,
                  wordBreak: "break-all"
                }}>
                  {card.value}
                </div>
                {/* ? Label: 10px min (pas 8px) */}
                <div style={{ fontSize: isMobile ? "10px" : "11px", color: theme.textSecondary, marginTop: "3px", lineHeight: 1.3 }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* -- Filtres -- */}
          <div style={{ marginBottom: "20px", animation: `fadeInUp 0.5s ease 0.4s`, opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>

              {/* ? Search input � hauteur 44px+ sur mobile */}
              <div style={{ flex: 2, position: "relative", display: "flex", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
                <span style={{ position: "absolute", left: "12px", color: theme.textSecondary, pointerEvents: "none", display: "flex" }}>
                  <IconSearch size={16} color={theme.textSecondary} />
                </span>
                <input
                  type="text"
                  placeholder={`${t("common.search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: isMobile ? "13px 12px 13px 38px" : "10px 12px 10px 34px",
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    transition: "border-color 0.2s",
                    fontSize: isMobile ? "14px" : "14px",
                    minHeight: "44px"             // ? touch target
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>

              {/* ? Select filtre � hauteur 44px+ sur mobile */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", minWidth: isMobile ? "100%" : "160px" }}>
                <span style={{ position: "absolute", left: "12px", pointerEvents: "none", display: "flex" }}>
                  <IconFilter size={14} color={theme.textSecondary} />
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: isMobile ? "13px 12px 13px 34px" : "10px 12px 10px 30px",
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    cursor: "pointer",
                    fontSize: isMobile ? "14px" : "14px",
                    appearance: "none",
                    minHeight: "44px"             // ? touch target
                  }}
                >
                  <option value="all">{t("orders.allStatus")}</option>
                  <option value="pending">{t("orders.pending")}</option>
                  <option value="processing">{t("orders.processing")}</option>
                  <option value="delivered">{t("orders.delivered")}</option>
                  <option value="cancelled">{t("orders.cancelled")}</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", flexWrap: "wrap", gap: "10px" }}>
              <SelectAllCheckbox
                items={orders}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onSelectAll={(ids: number[]) => setSelectedIds(ids)}
                getItemId={(item: Order) => item.id}
              />
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{
                    background: "#c33",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: isMobile ? "11px 18px" : "8px 16px",  // ? touch target
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    fontSize: isMobile ? "13px" : "14px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "44px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <IconTrash size={14} color="white" />
                  {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* -- Orders Table -- */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: isMobile ? "12px 8px" : "16px",
            border: `1px solid ${theme.border}`,
            overflowX: "auto",
            animation: `fadeInUp 0.5s ease 0.5s`,
            opacity: animateCards ? 1 : 0,
            boxShadow: isMobile ? "0 2px 12px rgba(0,0,0,0.15)" : "none"
          }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "700px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "10px 8px", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === orders.length && orders.length > 0}
                        onChange={() => {
                          if (selectedIds.length === orders.length) {
                            setSelectedIds([]);
                          } else {
                            setSelectedIds(orders.map(o => o.id));
                          }
                        }}
                        style={{ width: isMobile ? "18px" : "16px", height: isMobile ? "18px" : "16px", cursor: "pointer", accentColor: theme.primary }}
                      />
                    </th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize, fontWeight: "600" }}>ID</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize, fontWeight: "600" }}>{t("common.client")}</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize, fontWeight: "600" }}>{t("common.product")}</th>
                    <th style={{ padding: "10px 8px", textAlign: "right", fontSize: tableFontSize, fontWeight: "600" }}>{t("common.quantity")}</th>
                    <th style={{ padding: "10px 8px", textAlign: "right", fontSize: tableFontSize, fontWeight: "600" }}>{t("common.total")}</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", fontSize: tableFontSize, fontWeight: "600" }}>{t("common.status")}</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize, fontWeight: "600" }}>{t("common.date")}</th>
                    {/* ? Colonne actions � label visible */}
                    <th style={{ padding: "10px 8px", textAlign: "center", fontSize: tableFontSize, fontWeight: "600" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: `1px solid ${theme.surfaceHover}`,
                        transition: "background 0.2s",
                        animation: `slideIn 0.3s ease ${idx * 0.03}s`
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => {
                            if (selectedIds.includes(order.id)) {
                              setSelectedIds(selectedIds.filter(id => id !== order.id));
                            } else {
                              setSelectedIds([...selectedIds, order.id]);
                            }
                          }}
                          style={{ width: isMobile ? "18px" : "16px", height: isMobile ? "18px" : "16px", cursor: "pointer", accentColor: theme.primary }}
                        />
                      </td>
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", color: theme.text, fontWeight: "600", fontSize: tableFontSize }}>
                        #{order.id}
                      </td>
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {order.clientName?.length > (isMobile ? 12 : 20)
                          ? order.clientName.substring(0, isMobile ? 10 : 17) + "�"
                          : order.clientName || "-"}
                      </td>
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {order.productName?.length > (isMobile ? 12 : 20)
                          ? order.productName.substring(0, isMobile ? 10 : 17) + "�"
                          : order.productName || "-"}
                      </td>
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {order.quantity || 0}
                      </td>
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>
                        {formatCurrency(parseFloat(String(order.total)))}
                      </td>

                      {/* ? Badge statut + select � taille lisible sur mobile */}
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", textAlign: "center" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: `${getStatusColor(order.status)}18`,
                          border: `1px solid ${getStatusColor(order.status)}55`,
                          borderRadius: "8px",
                          padding: isMobile ? "5px 8px" : "3px 8px"   // ? plus de padding vertical
                        }}>
                          <span style={{ color: getStatusColor(order.status), display: "flex", flexShrink: 0 }}>
                            {order.status === "delivered"  && <IconCheck size={12} color={getStatusColor(order.status)} />}
                            {order.status === "processing" && <IconRefresh size={12} color={getStatusColor(order.status)} />}
                            {order.status === "pending"    && <IconClock size={12} color={getStatusColor(order.status)} />}
                            {order.status === "cancelled"  && <IconX size={12} color={getStatusColor(order.status)} />}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            disabled={updatingStatus === order.id}
                            style={{
                              background: "transparent",
                              color: getStatusColor(order.status),
                              border: "none",
                              cursor: updatingStatus === order.id ? "wait" : "pointer",
                              fontWeight: "600",
                              opacity: updatingStatus === order.id ? 0.7 : 1,
                              fontSize: isMobile ? "11px" : "12px",  // ? 11px min (pas 10px)
                              outline: "none",
                              appearance: "none",
                              padding: 0,
                              minWidth: isMobile ? "60px" : "auto"
                            }}
                          >
                            <option value="pending">{t("orders.pending")}</option>
                            <option value="processing">{t("orders.processing")}</option>
                            <option value="delivered">{t("orders.delivered")}</option>
                            <option value="cancelled">{t("orders.cancelled")}</option>
                          </select>
                        </div>
                      </td>

                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {new Date(order.createdAt).toLocaleDateString(
                          language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US"
                        )}
                      </td>

                      {/* ? Bouton delete � touch target 44px sur mobile */}
                      <td style={{ padding: isMobile ? "13px 8px" : "10px 8px", textAlign: "center" }}>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          style={{
                            background: "rgba(204,51,51,0.12)",
                            color: "#ef4444",
                            border: "1px solid rgba(204,51,51,0.3)",
                            borderRadius: "8px",
                            padding: isMobile ? "10px 13px" : "5px 8px",  // ? touch target
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: isMobile ? "40px" : "auto",
                            minWidth: isMobile ? "40px" : "auto"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#c33"; e.currentTarget.style.color = "white"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(204,51,51,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
                        >
                          <IconTrash size={isMobile ? 14 : 14} color="currentColor" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: theme.textSecondary, opacity: 0.4 }}>
                  <IconFileText size={isMobile ? 40 : 48} color={theme.textSecondary} />
                </div>
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "13px" : "14px" }}>
                  {searchTerm ? t("common.noResults") : t("orders.noOrders")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -- Modal cr�ation commande -- */}
      {modal.open && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: isMobile ? "flex-end" : "center",  // ? bottom sheet sur mobile
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease",
          padding: isMobile ? "0" : "16px"
        }}>
          <div style={{
            background: theme.surface,
            padding: modalPadding,
            borderRadius: isMobile ? "24px 24px 0 0" : "24px",  // ? bottom sheet radius
            width: isMobile ? "100%" : modalWidth,
            maxWidth: isMobile ? "100%" : "95%",
            border: `1px solid ${theme.border}`,
            maxHeight: isMobile ? "90vh" : "auto",
            overflowY: "auto"
          }}>
            {/* ? Drag handle visible sur mobile */}
            {isMobile && (
              <div style={{ width: "40px", height: "4px", background: theme.border, borderRadius: "2px", margin: "0 auto 16px" }} />
            )}

            <h2 style={{
              color: theme.text,
              marginBottom: "20px",
              fontSize: isMobile ? "18px" : "22px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              margin: "0 0 20px"
            }}>
              <IconOrder size={isMobile ? 20 : 24} color={theme.primary} />
              {t("orders.addOrder")}
            </h2>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: "13px" }}>
                {t("common.client")} *
              </label>
              <input
                type="text"
                placeholder={t("orders.clientName")}
                value={modal.form.clientName ?? ""}
                onChange={e => setModal({ ...modal, form: { ...modal.form, clientName: e.target.value } })}
                style={{
                  width: "100%",
                  padding: inputPadding,             // ? 44px+ hauteur sur mobile
                  background: theme.surfaceHover,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  color: theme.text,
                  fontSize: "14px",
                  minHeight: "44px"
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: "13px" }}>
                {t("common.product")} *
              </label>
              <input
                type="text"
                placeholder={t("orders.productName")}
                value={modal.form.productName ?? ""}
                onChange={e => setModal({ ...modal, form: { ...modal.form, productName: e.target.value } })}
                style={{
                  width: "100%",
                  padding: inputPadding,
                  background: theme.surfaceHover,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  color: theme.text,
                  fontSize: "14px",
                  minHeight: "44px"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: "13px" }}>
                  {t("common.quantity")} *
                </label>
                <input
                  type="number"
                  placeholder="Quantit�"
                  value={modal.form.quantity ?? 1}
                  onChange={e => {
                    const qty = parseInt(e.target.value) || 1;
                    setModal({ ...modal, form: { ...modal.form, quantity: qty, total: (modal.form.unitPrice ?? 0) * qty } });
                  }}
                  style={{
                    width: "100%",
                    padding: inputPadding,
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    fontSize: "14px",
                    minHeight: "44px"
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: "13px" }}>
                  {t("common.price")} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Prix unitaire"
                  value={modal.form.unitPrice ?? 0}
                  onChange={e => {
                    const price = parseFloat(e.target.value) || 0;
                    setModal({ ...modal, form: { ...modal.form, unitPrice: price, total: price * (modal.form.quantity ?? 1) } });
                  }}
                  style={{
                    width: "100%",
                    padding: inputPadding,
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    fontSize: "14px",
                    minHeight: "44px"
                  }}
                />
              </div>
            </div>

            {/* Total */}
            <div style={{
              marginBottom: "20px",
              padding: "14px",
              background: theme.surfaceHover,
              borderRadius: "12px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <IconDollar size={16} color={theme.accent} />
              <span style={{ color: theme.textSecondary, fontSize: "14px" }}>{t("common.total")}: </span>
              <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "18px" : "20px" }}>
                {formatCurrency(modal.form.total ?? 0)}
              </span>
            </div>

            {/* ? Boutons modal � colonne sur mobile, rang�e sur desktop */}
            <div style={{ display: "flex", gap: "12px", flexDirection: isMobile ? "column" : "row" }}>
              <button
                onClick={createOrder}
                style={{
                  flex: 1,
                  padding: isMobile ? "14px" : "10px",
                  background: theme.gradient,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "opacity 0.2s",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  minHeight: "48px"             // ? touch target g�n�reux
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={16} color="white" />
                {t("common.save")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {} })}
                style={{
                  flex: 1,
                  padding: isMobile ? "14px" : "10px",
                  background: theme.surfaceHover,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  minHeight: "48px"             // ? touch target g�n�reux
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconX size={16} color={theme.text} />
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}