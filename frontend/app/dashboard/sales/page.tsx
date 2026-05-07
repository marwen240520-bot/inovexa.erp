"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";
import ImportButton from "@/components/ui/ImportButton";

// ─── SVG Icon Components ───────────────────────────────────────────────────────

const IconBarChart2 = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);

const IconTrendingUp = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconClock = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

const IconSearch = ({ size = 15, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconCalendar = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconFilter = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconEdit = ({ size = 13, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconSave = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconPlus = ({ size = 15, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconShoppingCart = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconChevronDown = ({ size = 12, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─── Status helpers ────────────────────────────────────────────────────────────

function StatusIcon({ status, size = 13 }) {
  if (status === "paid") return <IconCheckCircle size={size} color="#10b981" />;
  if (status === "pending") return <IconClock size={size} color="#f59e0b" />;
  if (status === "cancelled") return <IconXCircle size={size} color="#ef4444" />;
  return <IconBarChart2 size={size} color="currentColor" />;
}

// ─── SelectAllCheckbox ─────────────────────────────────────────────────────────

function SelectAllCheckbox({ items, selectedIds, onSelect, onSelectAll, getItemId }) {
  const { t } = useLanguage();
  const { isMobile } = useResponsive();
  const { theme } = useTheme();

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  const handleSelectAll = () => {
    if (isAllSelected) onSelect([]);
    else onSelectAll(items.map(getItemId));
  };

  return (
    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={isAllSelected}
        ref={(input) => { if (input) input.indeterminate = isIndeterminate; }}
        onChange={handleSelectAll}
        style={{ width: "16px", height: "16px", cursor: "pointer" }}
      />
      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>
        {t("common.selectAll")}
      </span>
    </label>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SalesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [allSales, setAllSales] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {} });
  const [editModal, setEditModal] = useState({ open: false, sale: null, status: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [stats, setStats] = useState({ total: 0, amount: 0, average: 0 });
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [importing, setImporting] = useState(false);

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "16px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const statusFontSize = isMobile ? "10px" : "12px";
  const buttonPadding = isMobile ? "8px 16px" : "12px 24px";
  const modalWidth = isMobile ? "95%" : "550px";
  const modalPadding = isMobile ? "20px" : "32px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchSales();
    fetchProducts();
    fetchClients();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterPeriod, filterStatus, searchTerm, allSales]);

  const fetchSales = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/sales", { headers: { Authorization: `Bearer ${token}` } });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setAllSales(data);
      const totalAmount = data.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
      setStats({ total: data.length, amount: totalAmount, average: data.length > 0 ? totalAmount / data.length : 0 });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allSales];
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "all") filtered = filtered.filter(sale => sale.status === filterStatus);
    if (filterPeriod !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        if (filterPeriod === "week") { const w = new Date(today); w.setDate(today.getDate() - 7); return saleDate >= w; }
        if (filterPeriod === "month") { const m = new Date(today); m.setMonth(today.getMonth() - 1); return saleDate >= m; }
        return true;
      });
    }
    setSales(filtered);
    setSelectedIds([]);
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/products", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/clients", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const importSales = async (data) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/sales/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sales: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(`${result.success} vente(s) importée(s) avec succès${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success");
        fetchSales();
      } else {
        showMessage(result.message || "Erreur lors de l'import", "error");
      }
    } catch (error) {
      showMessage("Erreur de connexion lors de l'import", "error");
    } finally {
      setImporting(false);
    }
  };

  const createSale = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        setSelectedProduct(null);
        fetchSales();
        showMessage(t("sales.saleCreated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const updateSaleStatus = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`http://localhost:3001/sales/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSales();
        showMessage(`${t("sales.statusUpdated")}: ${getStatusText(newStatus)}`, "success");
        setEditModal({ open: false, sale: null, status: "" });
      } else {
        const error = await res.json();
        showMessage(error.message || t("common.error"), "error");
      }
    } catch(e) { showMessage(t("common.error"), "error"); }
    finally { setUpdatingStatus(null); }
  };

  const deleteSale = async (id) => {
    if (confirm(t("sales.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/sales/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchSales();
      showMessage(t("sales.saleDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("sales.confirmBulkDelete")?.replace("{count}", selectedIds.length) || `Supprimer ${selectedIds.length} vente(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`http://localhost:3001/sales/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      fetchSales();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} vente(s) supprimée(s)`, "success");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getStatusColor = (status) => {
    if (status === "paid") return "#10b981";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return theme.textSecondary;
  };

  const getStatusText = (status) => {
    if (status === "paid") return t("sales.paid");
    if (status === "pending") return t("sales.pending");
    if (status === "cancelled") return t("sales.cancelled");
    return status;
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      setSelectedProduct(product);
      setModal({ ...modal, form: { ...modal.form, productName: product.name, unitPrice: product.price, total: (modal.form.quantity || 1) * product.price } });
    }
  };

  const openEditStatusModal = (sale) => {
    setEditModal({ open: true, sale, status: sale.status });
  };

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
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
    { icon: <IconBarChart2 size={isMobile ? 28 : 32} color={theme.primary} />, label: t("sales.totalSales"), value: stats.total, color: theme.primary },
    { icon: <IconCurrencyDollar size={isMobile ? 28 : 32} color={theme.accent} />, label: t("dashboard.revenue"), value: formatCurrency(stats.amount), color: theme.accent },
    { icon: <IconTrendingUp size={isMobile ? 28 : 32} color="#f59e0b" />, label: t("sales.averageSale"), value: formatCurrency(Math.round(stats.average)), color: "#f59e0b" }
  ];

  const periodOptions = [
    { value: "all", label: t("sales.allPeriods") },
    { value: "week", label: t("sales.thisWeek") },
    { value: "month", label: t("sales.thisMonth") }
  ];

  const statusOptions = [
    { value: "all", label: t("sales.allStatus") },
    { value: "paid", label: t("sales.paid") },
    { value: "pending", label: t("sales.pending") },
    { value: "cancelled", label: t("sales.cancelled") }
  ];

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <IconLoader size={isMobile ? 40 : 48} color={theme.primary} style={{ margin: "0 auto 16px", display: "block" }} />
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: sectionMargin,
            flexWrap: "wrap",
            gap: "16px",
            animation: "fadeInDown 0.5s ease",
            opacity: animateCards ? 1 : 0,
            transform: animateCards ? "translateY(0)" : "translateY(-20px)"
          }}>
            <div>
              <h1 style={{ color: theme.text, fontSize: headerTitleSize, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <IconShoppingCart size={isMobile ? 22 : 28} color={theme.primary} />
                {t("common.sales")}
              </h1>
              <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("sales.subtitle")}</p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <ImportButton onImport={importSales} label={t("common.import")} />
              <ExportButtons data={sales} filename="ventes" />
              <button
                onClick={() => setModal({ open: true, form: { clientName: "", productName: "", quantity: 1, unitPrice: 0, total: 0, status: "pending" } })}
                style={{
                  background: theme.gradient,
                  color: "white",
                  padding: buttonPadding,
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <IconPlus size={15} color="white" />
                {isMobile ? t("sales.addSale").substring(0, 8) + "..." : t("sales.addSale")}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`,
              color: messageType === "success" ? "#10b981" : "#f87171",
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
                ? <IconCheckCircle size={16} color="#10b981" />
                : <IconXCircle size={16} color="#f87171" />}
              {message}
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "200px" : "250px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: theme.surface,
                  borderRadius: cardRadius,
                  padding: cardPadding,
                  textAlign: "center",
                  border: `1px solid ${theme.border}`,
                  animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`,
                  opacity: animateCards ? 1 : 0,
                  transition: "transform 0.3s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "22px" : "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ marginBottom: "20px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", flexDirection: isMobile ? "column" : "row" }}>

              {/* Search */}
              <div style={{ flex: 2, position: "relative", width: isMobile ? "100%" : "auto" }}>
                <IconSearch size={15} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder={`${t("common.search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    transition: "border-color 0.2s",
                    fontSize: isMobile ? "13px" : "14px",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>

              {/* Period filter */}
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "160px" }}>
                <IconCalendar size={14} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 32px",
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    cursor: "pointer",
                    fontSize: isMobile ? "13px" : "14px",
                    appearance: "none"
                  }}
                >
                  {periodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "150px" }}>
                <IconFilter size={13} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
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
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox
                items={sales}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onSelectAll={(ids) => setSelectedIds(ids)}
                getItemId={(item) => item.id}
              />
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{
                    background: "#c33",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    fontSize: isMobile ? "12px" : "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <IconTrash size={13} color="white" />
                  {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: "16px",
            border: `1px solid ${theme.border}`,
            overflowX: "auto",
            animation: "fadeInUp 0.5s ease 0.5s",
            opacity: animateCards ? 1 : 0
          }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "650px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "10px", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === sales.length && sales.length > 0}
                        onChange={() => {
                          if (selectedIds.length === sales.length) setSelectedIds([]);
                          else setSelectedIds(sales.map(s => s.id));
                        }}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.client")}</th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.product")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.quantity")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.amount")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.date")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, idx) => (
                    <tr
                      key={sale.id}
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
                          checked={selectedIds.includes(sale.id)}
                          onChange={() => {
                            if (selectedIds.includes(sale.id)) setSelectedIds(selectedIds.filter(id => id !== sale.id));
                            else setSelectedIds([...selectedIds, sale.id]);
                          }}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "10px", color: theme.text, fontSize: tableFontSize }}>
                        {sale.clientName?.length > (isMobile ? 15 : 20) ? sale.clientName.substring(0, isMobile ? 12 : 17) + "..." : sale.clientName || "-"}
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {sale.productName?.length > (isMobile ? 15 : 20) ? sale.productName.substring(0, isMobile ? 12 : 17) + "..." : sale.productName || "-"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{sale.quantity || 1}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>{formatCurrency(parseFloat(sale.total))}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button
                          onClick={() => openEditStatusModal(sale)}
                          style={{
                            background: getStatusColor(sale.status) + "20",
                            color: getStatusColor(sale.status),
                            padding: isMobile ? "4px 8px" : "5px 10px",
                            borderRadius: "20px",
                            fontSize: statusFontSize,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                            border: "none",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.opacity = "0.8"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
                        >
                          <StatusIcon status={sale.status} size={12} />
                          {!isMobile && getStatusText(sale.status)}
                          {!isMobile && <IconChevronDown size={10} color={getStatusColor(sale.status)} />}
                        </button>
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {new Date(sale.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US")}
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => openEditStatusModal(sale)}
                            title="Modifier le statut"
                            style={{
                              background: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "5px 8px",
                              cursor: "pointer",
                              transition: "opacity 0.2s",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          >
                            <IconEdit size={13} color="white" />
                          </button>
                          <button
                            onClick={() => deleteSale(sale.id)}
                            title="Supprimer"
                            style={{
                              background: "#c33",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "5px 8px",
                              cursor: "pointer",
                              transition: "opacity 0.2s",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          >
                            <IconTrash size={13} color="white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sales.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <IconShoppingCart size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block" }} />
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                  {searchTerm ? t("common.noResults") : t("sales.noSales")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal — New Sale */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px"
        }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "24px", width: modalWidth, maxWidth: "95%", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconShoppingCart size={isMobile ? 18 : 22} color={theme.primary} />
              {t("sales.addSale")}
            </h2>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.client")} *</label>
              <input
                type="text"
                placeholder={t("sales.clientName")}
                value={modal.form.clientName || ""}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, clientName: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.product")} *</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
                <select
                  onChange={(e) => handleProductSelect(e.target.value)}
                  style={{ flex: 2, padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
                  defaultValue=""
                >
                  <option value="" disabled>{t("sales.selectProduct")}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={t("sales.productName")}
                  value={modal.form.productName || ""}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, productName: e.target.value } })}
                  style={{ flex: 1, padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }}
                />
              </div>
              {selectedProduct && (
                <div style={{ marginTop: "6px", fontSize: isMobile ? "10px" : "11px", color: theme.accent, display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconCheckCircle size={12} color={theme.accent} />
                  {t("sales.productSelected")}: {selectedProduct.name} (Stock: {selectedProduct.quantity})
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.quantity")} *</label>
                <input
                  type="number"
                  placeholder="Quantité"
                  value={modal.form.quantity || 1}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) || 1, total: (modal.form.unitPrice || 0) * (parseInt(e.target.value) || 1) } })}
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.price")} *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Prix unitaire"
                  value={modal.form.unitPrice || 0}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, unitPrice: parseFloat(e.target.value) || 0, total: (parseFloat(e.target.value) || 0) * (modal.form.quantity || 1) } })}
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.status")}</label>
              <select
                value={modal.form.status || "pending"}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, status: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
              >
                <option value="pending">{t("sales.pending")}</option>
                <option value="paid">{t("sales.paid")}</option>
                <option value="cancelled">{t("sales.cancelled")}</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px", padding: "12px", background: theme.surfaceHover, borderRadius: "12px", textAlign: "center" }}>
              <span style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{t("common.total")}: </span>
              <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "16px" : "20px" }}>{formatCurrency(modal.form.total || 0)}</span>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={createSale}
                style={{
                  flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none",
                  borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s",
                  fontSize: isMobile ? "13px" : "14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={14} color="white" /> {t("common.save")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {}, selectedProduct: null })}
                style={{ flex: 1, padding: "10px", background: theme.borderHover, color: theme.text, border: "none", borderRadius: "10px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Edit Status */}
      {editModal.open && editModal.sale && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px"
        }}>
          <div style={{ background: theme.surface, padding: "20px", borderRadius: "24px", width: isMobile ? "95%" : "450px", maxWidth: "95%", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconEdit size={isMobile ? 16 : 20} color={theme.primary} />
              {t("sales.editStatus") || "Modifier le statut"}
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ background: theme.surfaceHover, padding: "12px", borderRadius: "12px", marginBottom: "16px" }}>
                {[
                  { label: t("common.client"), value: editModal.sale.clientName || "-", color: theme.text },
                  { label: t("common.product"), value: editModal.sale.productName || "-", color: theme.text },
                  { label: t("common.amount"), value: formatCurrency(parseFloat(editModal.sale.total)), color: theme.accent }
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 2 ? "6px" : 0, flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: row.color === theme.accent ? "bold" : "normal", fontSize: isMobile ? "11px" : "13px" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.status")}</label>
              <select
                value={editModal.status}
                onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
              >
                <option value="pending">{t("sales.pending")}</option>
                <option value="paid">{t("sales.paid")}</option>
                <option value="cancelled">{t("sales.cancelled")}</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => updateSaleStatus(editModal.sale.id, editModal.status)}
                disabled={updatingStatus === editModal.sale.id}
                style={{
                  flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none",
                  borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s",
                  opacity: updatingStatus === editModal.sale.id ? 0.7 : 1,
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
              >
                {updatingStatus === editModal.sale.id
                  ? <><IconLoader size={14} color="white" /> {t("common.loading")}</>
                  : <><IconSave size={14} color="white" /> {t("common.save")}</>}
              </button>
              <button
                onClick={() => setEditModal({ open: false, sale: null, status: "" })}
                style={{ flex: 1, padding: "10px", background: theme.borderHover, color: theme.text, border: "none", borderRadius: "10px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}