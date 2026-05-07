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
import SelectAllCheckbox from "@/components/ui/SelectAllCheckbox";

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

const IconSearch = ({ size = 15, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconFilter = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconFactory = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
    <path d="M17 18h1"/>
    <path d="M12 18h1"/>
    <path d="M7 18h1"/>
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

const IconDownload = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

const IconChevronDown = ({ size = 11, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [allPurchases, setAllPurchases] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [modal, setModal] = useState({ open: false, form: {} });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, amount: 0, average: 0, pending: 0, delivered: 0 });

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "12px" : "16px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const buttonPadding = isMobile ? "8px 16px" : "10px 20px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterStatus, filterSupplier, searchTerm, allPurchases]);

  const fetchPurchases = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/purchases", { headers: { Authorization: `Bearer ${token}` } });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setAllPurchases(data);
      const totalAmount = data.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      setStats({
        total: data.length,
        amount: totalAmount,
        average: data.length > 0 ? totalAmount / data.length : 0,
        pending: data.filter(p => p.status === "pending").length,
        delivered: data.filter(p => p.status === "delivered").length
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allPurchases];
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "all") filtered = filtered.filter(p => p.status === filterStatus);
    if (filterSupplier !== "all") filtered = filtered.filter(p => p.supplierName === filterSupplier);
    setPurchases(filtered);
    setSelectedIds([]);
  };

  const fetchSuppliers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/suppliers", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/products", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const createPurchase = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {} });
        fetchPurchases();
        showMessage(t("purchases.purchaseCreated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const importPurchases = async (data) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/purchases/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purchases: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(`${result.success} achat(s) importé(s) avec succès${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success");
        fetchPurchases();
      } else { showMessage(result.message || "Erreur lors de l'import", "error"); }
    } catch (error) {
      showMessage("Erreur de connexion lors de l'import", "error");
    } finally { setImporting(false); }
  };

  const updateStatus = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`http://localhost:3001/purchases/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchPurchases();
        const statusText = newStatus === "delivered" ? t("purchases.delivered") : t("purchases.pendingDelivery");
        showMessage(`${t("purchases.statusUpdated")}: ${statusText}`, "success");
      } else {
        const error = await res.json();
        showMessage(error.message || t("common.error"), "error");
      }
    } catch(e) { showMessage(t("common.error"), "error"); }
    finally { setUpdatingStatus(null); }
  };

  const deletePurchase = async (id) => {
    if (confirm(t("purchases.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/purchases/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchPurchases();
      showMessage(t("purchases.purchaseDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("purchases.confirmBulkDelete").replace("{count}", selectedIds.length))) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`http://localhost:3001/purchases/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      fetchPurchases();
      setSelectedIds([]);
      showMessage(t("purchases.purchasesDeleted").replace("{count}", selectedIds.length), "success");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getStatusColor = (status) => {
    if (status === "delivered") return theme.accent;
    if (status === "pending") return "#f59e0b";
    return theme.textSecondary;
  };

  const getStatusText = (status) => {
    if (status === "delivered") return t("purchases.delivered");
    if (status === "pending") return t("purchases.pendingDelivery");
    return status;
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
    { icon: <IconBarChart2 size={isMobile ? 22 : 26} color={theme.primary} />, label: t("purchases.totalPurchases"), value: stats.total, color: theme.primary },
    { icon: <IconCurrencyDollar size={isMobile ? 22 : 26} color={theme.accent} />, label: t("purchases.totalSpent"), value: formatCurrency(stats.amount), color: theme.accent },
    { icon: <IconTrendingUp size={isMobile ? 22 : 26} color="#f59e0b" />, label: t("purchases.averagePurchase"), value: formatCurrency(Math.round(stats.average)), color: "#f59e0b" },
    { icon: <IconCheckCircle size={isMobile ? 22 : 26} color={theme.accent} />, label: t("purchases.delivered"), value: stats.delivered, color: theme.accent },
    { icon: <IconClock size={isMobile ? 22 : 26} color="#f59e0b" />, label: t("purchases.pendingDelivery"), value: stats.pending, color: "#f59e0b" }
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
            marginBottom: sectionMargin,
            animation: "fadeInDown 0.5s ease",
            opacity: animateCards ? 1 : 0,
            transform: animateCards ? "translateY(0)" : "translateY(-20px)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconDownload size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.purchases")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("purchases.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <ImportButton onImport={importPurchases} label={t("common.import")} />
                <ExportButtons data={purchases} filename="achats" />
                <button
                  onClick={() => setModal({ open: true, form: { supplierName: "", productName: "", quantity: 1, unitPrice: 0, total: 0, status: "pending" } })}
                  style={{
                    background: theme.gradient,
                    color: "white",
                    padding: buttonPadding,
                    border: "none",
                    borderRadius: "8px",
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
                  <IconPlus size={14} color="white" />
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
                ? <IconCheckCircle size={16} color={theme.accent} />
                : <IconXCircle size={16} color="#f87171" />}
              {message}
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "140px" : "180px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
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
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "18px" : "20px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "9px" : "11px", color: theme.textSecondary }}>{card.label}</div>
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
                  <option value="all">{t("purchases.allStatus")}</option>
                  <option value="delivered">{t("purchases.delivered")}</option>
                  <option value="pending">{t("purchases.pendingDelivery")}</option>
                </select>
              </div>

              {/* Supplier filter */}
              {suppliers.length > 0 && (
                <div style={{ position: "relative", minWidth: isMobile ? "100%" : "180px" }}>
                  <IconFactory size={13} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <select
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
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
                    <option value="all">{t("purchases.allSuppliers")}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox
                items={purchases}
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
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "700px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "10px", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === purchases.length && purchases.length > 0}
                        onChange={() => {
                          if (selectedIds.length === purchases.length) setSelectedIds([]);
                          else setSelectedIds(purchases.map(p => p.id));
                        }}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.supplier")}</th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.product")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.quantity")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.price")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.total")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase, idx) => (
                    <tr
                      key={purchase.id}
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        transition: "background 0.2s",
                        animation: `slideIn 0.3s ease ${idx * 0.03}s`
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(purchase.id)}
                          onChange={() => {
                            if (selectedIds.includes(purchase.id)) setSelectedIds(selectedIds.filter(id => id !== purchase.id));
                            else setSelectedIds([...selectedIds, purchase.id]);
                          }}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "10px", color: theme.text, fontSize: tableFontSize }}>
                        {purchase.supplierName?.length > (isMobile ? 15 : 20) ? purchase.supplierName.substring(0, isMobile ? 12 : 17) + "..." : purchase.supplierName}
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {purchase.productName?.length > (isMobile ? 15 : 20) ? purchase.productName.substring(0, isMobile ? 12 : 17) + "..." : purchase.productName}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{purchase.quantity || 0}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{formatCurrency(purchase.unitPrice || 0)}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>{formatCurrency(parseFloat(purchase.total))}</td>

                      {/* Status select styled as badge */}
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: `${getStatusColor(purchase.status)}20`,
                            border: `1px solid ${getStatusColor(purchase.status)}60`,
                            borderRadius: "8px",
                            padding: "0",
                            opacity: updatingStatus === purchase.id ? 0.6 : 1,
                            transition: "opacity 0.2s"
                          }}>
                            {purchase.status === "delivered"
                              ? <IconCheckCircle size={12} color={getStatusColor(purchase.status)} style={{ marginLeft: "8px", flexShrink: 0 }} />
                              : <IconClock size={12} color={getStatusColor(purchase.status)} style={{ marginLeft: "8px", flexShrink: 0 }} />
                            }
                            <select
                              value={purchase.status}
                              onChange={(e) => updateStatus(purchase.id, e.target.value)}
                              disabled={updatingStatus === purchase.id}
                              style={{
                                background: "transparent",
                                color: getStatusColor(purchase.status),
                                border: "none",
                                padding: isMobile ? "4px 4px 4px 2px" : "5px 6px 5px 2px",
                                cursor: updatingStatus === purchase.id ? "wait" : "pointer",
                                fontWeight: "500",
                                fontSize: isMobile ? "10px" : "12px",
                                appearance: "none",
                                outline: "none"
                              }}
                            >
                              <option value="pending">{isMobile ? t("purchases.pendingDelivery").substring(0, 3) + "." : t("purchases.pendingDelivery")}</option>
                              <option value="delivered">{isMobile ? t("purchases.delivered").substring(0, 3) + "." : t("purchases.delivered")}</option>
                            </select>
                            <IconChevronDown size={10} color={getStatusColor(purchase.status)} style={{ marginRight: "6px", flexShrink: 0, pointerEvents: "none" }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button
                          onClick={() => deletePurchase(purchase.id)}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {purchases.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <IconDownload size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block" }} />
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                  {searchTerm ? t("common.noResults") : t("purchases.noPurchases")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal — Create Purchase */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px"
        }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "24px", width: modalWidth, maxWidth: "95%", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconDownload size={isMobile ? 18 : 22} color={theme.primary} />
              {t("purchases.addPurchase")}
            </h2>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.supplier")} *</label>
              <input
                type="text"
                placeholder={t("purchases.supplierName")}
                value={modal.form.supplierName || ""}
                onChange={e => setModal({ ...modal, form: { ...modal.form, supplierName: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.product")} *</label>
              <input
                type="text"
                placeholder={t("purchases.productName")}
                value={modal.form.productName || ""}
                onChange={e => setModal({ ...modal, form: { ...modal.form, productName: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.quantity")} *</label>
                <input
                  type="number"
                  placeholder="Quantité"
                  value={modal.form.quantity || 1}
                  onChange={e => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) || 1, total: (modal.form.unitPrice || 0) * (parseInt(e.target.value) || 1) } })}
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
                  onChange={e => setModal({ ...modal, form: { ...modal.form, unitPrice: parseFloat(e.target.value) || 0, total: (parseFloat(e.target.value) || 0) * (modal.form.quantity || 1) } })}
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px", padding: "12px", background: theme.surfaceHover, borderRadius: "12px", textAlign: "center" }}>
              <span style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{t("common.total")}: </span>
              <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "16px" : "20px" }}>{formatCurrency(modal.form.total || 0)}</span>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={createPurchase}
                style={{
                  flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none",
                  borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={14} color="white" /> {t("common.save")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {} })}
                style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px" }}
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