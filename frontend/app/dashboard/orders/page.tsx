"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";

// ─── SVG Icon Components ───────────────────────────────────────────────────────

const IconChart = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconClock = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconRefresh = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconCheck = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconDollar = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconPlus = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconSearch = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconFilter = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconFileText = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconSave = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconOrder = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

// ─── SelectAllCheckbox ─────────────────────────────────────────────────────────

function SelectAllCheckbox({ items, selectedIds, onSelect, onSelectAll, getItemId }) {
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
    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={isAllSelected}
        ref={(input) => {
          if (input) input.indeterminate = isIndeterminate;
        }}
        onChange={handleSelectAll}
        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: theme.primary }}
      />
      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>
        {t("common.selectAll")}
      </span>
    </label>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [allOrders, setAllOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0, totalAmount: 0 });

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "12px" : "16px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "16px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const buttonPadding = isMobile ? "8px 16px" : "10px 20px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";

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
      const res = await fetch("http://localhost:3001/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setAllOrders(data);
      const totalAmount = data.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
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
      const res = await fetch("http://localhost:3001/clients", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/products", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const createOrder = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/orders", {
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

  const updateStatus = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`http://localhost:3001/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchOrders();
        showMessage(`✓ ${t("orders.statusUpdated")}`, "success");
      } else {
        const order = allOrders.find(o => o.id === id);
        if (order) {
          const putRes = await fetch(`http://localhost:3001/orders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...order, status: newStatus })
          });
          if (putRes.ok) {
            await fetchOrders();
            showMessage(`✓ ${t("orders.statusUpdated")}`, "success");
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

  const deleteOrder = async (id) => {
    if (confirm(t("orders.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/orders/${id}`, {
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
    if (confirm(t("orders.confirmBulkDelete")?.replace("{count}", selectedIds.length) || `Supprimer ${selectedIds.length} commande(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`http://localhost:3001/orders/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchOrders();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} commande(s) supprimée(s)`, "success");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getStatusColor = (status) => {
    if (status === "delivered") return "#10b981";
    if (status === "processing") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return "#94a3b8";
  };

  const getStatusText = (status) => {
    if (status === "delivered") return t("orders.delivered");
    if (status === "processing") return t("orders.processing");
    if (status === "pending") return t("orders.pending");
    if (status === "cancelled") return t("orders.cancelled");
    return status;
  };

  // Inline SVG for select options (used as data-icon attribute, not in JSX)
  const getStatusIcon = (status) => {
    if (status === "delivered") return <IconCheck size={12} color="#10b981" />;
    if (status === "processing") return <IconRefresh size={12} color="#3b82f6" />;
    if (status === "pending") return <IconClock size={12} color="#f59e0b" />;
    if (status === "cancelled") return <IconX size={12} color="#ef4444" />;
    return null;
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
          <p style={{ fontSize: isMobile ? "12px" : "14px", color: theme.textSecondary }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
      <div style={{
        marginLeft: isMobile ? "0px" : "280px",
        flex: 1,
        padding: isMobile ? "12px" : "24px",
        overflowX: "hidden",
        background: theme.background
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>

          <style>{animations}</style>

          {/* Header */}
          <div style={{
            marginBottom: sectionMargin,
            animation: "fadeInDown 0.5s ease",
            opacity: animateCards ? 1 : 0,
            transform: animateCards ? "translateY(0)" : "translateY(-20px)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconOrder size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.orders")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("orders.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <ExportButtons data={orders} filename="commandes" />
                <button
                  onClick={() => setModal({ open: true, form: { clientName: "", productName: "", quantity: 1, unitPrice: 0, total: 0, status: "pending" } })}
                  style={{ background: theme.gradient, color: "white", padding: buttonPadding, border: "none", borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <IconPlus size={16} color="white" />
                  {isMobile ? t("common.add").substring(0, 3) + "..." : t("common.add")}
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              background: messageType === "success" ? `${theme.accent}15` : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`,
              color: messageType === "success" ? theme.accent : "#f87171",
              padding: "12px",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center",
              animation: "fadeInUp 0.3s ease",
              fontSize: isMobile ? "12px" : "14px",
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

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "120px" : "150px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
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
                  transition: "transform 0.3s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px", color: card.color }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: isMobile ? "16px" : "20px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "8px" : "10px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{
            marginBottom: "20px",
            animation: `fadeInUp 0.5s ease 0.4s`,
            opacity: animateCards ? 1 : 0
          }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", flexDirection: isMobile ? "column" : "row" }}>
              {/* Search input wrapper */}
              <div style={{ flex: 2, position: "relative", display: "flex", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
                <span style={{ position: "absolute", left: "10px", color: theme.textSecondary, pointerEvents: "none", display: "flex" }}>
                  <IconSearch size={16} color={theme.textSecondary} />
                </span>
                <input
                  type="text"
                  placeholder={`${t("common.search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 34px",
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    transition: "border-color 0.2s",
                    fontSize: isMobile ? "13px" : "14px"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>

              {/* Filter select wrapper */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", minWidth: isMobile ? "100%" : "160px" }}>
                <span style={{ position: "absolute", left: "10px", pointerEvents: "none", display: "flex" }}>
                  <IconFilter size={14} color={theme.textSecondary} />
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 30px",
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    cursor: "pointer",
                    fontSize: isMobile ? "13px" : "14px",
                    appearance: "none"
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox
                items={orders}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onSelectAll={(ids) => setSelectedIds(ids)}
                getItemId={(item) => item.id}
              />
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{ background: "#c33", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <IconTrash size={14} color="white" />
                  {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: "16px",
            border: `1px solid ${theme.border}`,
            overflowX: "auto",
            animation: `fadeInUp 0.5s ease 0.5s`,
            opacity: animateCards ? 1 : 0
          }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "750px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "10px", width: "40px" }}>
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
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: theme.primary }}
                      />
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>ID</th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.client")}</th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.product")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.quantity")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.total")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.date")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
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
                      <td style={{ padding: "10px", textAlign: "center" }}>
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
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: theme.primary }}
                        />
                      </td>
                      <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>#{order.id}</td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {order.clientName?.length > (isMobile ? 15 : 20) ? order.clientName.substring(0, isMobile ? 12 : 17) + "..." : order.clientName || "-"}
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {order.productName?.length > (isMobile ? 15 : 20) ? order.productName.substring(0, isMobile ? 12 : 17) + "..." : order.productName || "-"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{order.quantity || 0}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>{formatCurrency(parseFloat(order.total))}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        {/* Status badge with inline icon */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: `${getStatusColor(order.status)}18`, border: `1px solid ${getStatusColor(order.status)}55`, borderRadius: "8px", padding: "3px 8px" }}>
                          <span style={{ color: getStatusColor(order.status), display: "flex" }}>
                            {order.status === "delivered" && <IconCheck size={11} color={getStatusColor(order.status)} />}
                            {order.status === "processing" && <IconRefresh size={11} color={getStatusColor(order.status)} />}
                            {order.status === "pending" && <IconClock size={11} color={getStatusColor(order.status)} />}
                            {order.status === "cancelled" && <IconX size={11} color={getStatusColor(order.status)} />}
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
                              fontWeight: "500",
                              opacity: updatingStatus === order.id ? 0.7 : 1,
                              fontSize: isMobile ? "10px" : "12px",
                              outline: "none",
                              appearance: "none",
                              padding: 0
                            }}
                          >
                            <option value="pending">{t("orders.pending")}</option>
                            <option value="processing">{t("orders.processing")}</option>
                            <option value="delivered">{t("orders.delivered")}</option>
                            <option value="cancelled">{t("orders.cancelled")}</option>
                          </select>
                        </div>
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {new Date(order.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US')}
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          style={{ background: "rgba(204,51,51,0.12)", color: "#ef4444", border: "1px solid rgba(204,51,51,0.3)", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#c33"; e.currentTarget.style.color = "white"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(204,51,51,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
                        >
                          <IconTrash size={isMobile ? 12 : 14} color="currentColor" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: theme.textSecondary, opacity: 0.4 }}>
                  <IconFileText size={isMobile ? 36 : 48} color={theme.textSecondary} />
                </div>
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                  {searchTerm ? t("common.noResults") : t("orders.noOrders")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal création commande */}
      {modal.open && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease",
          padding: "16px"
        }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "24px", width: modalWidth, maxWidth: "95%", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconOrder size={isMobile ? 20 : 24} color={theme.primary} />
              {t("orders.addOrder")}
            </h2>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.client")} *</label>
              <input
                type="text"
                placeholder={t("orders.clientName")}
                value={modal.form.clientName || ""}
                onChange={e => setModal({ ...modal, form: { ...modal.form, clientName: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.product")} *</label>
              <input
                type="text"
                placeholder={t("orders.productName")}
                value={modal.form.productName || ""}
                onChange={e => setModal({ ...modal, form: { ...modal.form, productName: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.quantity")} *</label>
                <input
                  type="number"
                  placeholder="Quantité"
                  value={modal.form.quantity || 1}
                  onChange={e => {
                    const qty = parseInt(e.target.value) || 1;
                    setModal({ ...modal, form: { ...modal.form, quantity: qty, total: (modal.form.unitPrice || 0) * qty } });
                  }}
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.price")} *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Prix unitaire"
                  value={modal.form.unitPrice || 0}
                  onChange={e => {
                    const price = parseFloat(e.target.value) || 0;
                    setModal({ ...modal, form: { ...modal.form, unitPrice: price, total: price * (modal.form.quantity || 1) } });
                  }}
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px", padding: "12px", background: theme.surfaceHover, borderRadius: "12px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <IconDollar size={16} color={theme.accent} />
              <span style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{t("common.total")}: </span>
              <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "16px" : "20px" }}>{formatCurrency(modal.form.total || 0)}</span>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={createOrder}
                style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={16} color="white" />
                {t("common.save")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {} })}
                style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
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