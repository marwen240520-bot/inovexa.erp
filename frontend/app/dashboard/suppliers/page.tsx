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

const IconFactory = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20V9l6-4v4l6-4v4l6-4v15H2z" />
    <rect x="6" y="14" width="3" height="6" />
    <rect x="10.5" y="14" width="3" height="6" />
    <rect x="15" y="14" width="3" height="6" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconUsers = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconDollar = ({ size = 24, color = "currentColor" }) => (
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

const IconList = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconGrid = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconEdit = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

const IconSave = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconX = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconCheck = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconBuilding = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M3 9h6" />
    <path d="M3 15h6" />
    <path d="M13 7h5" />
    <path d="M13 12h5" />
    <path d="M13 17h5" />
  </svg>
);

const IconMapPin = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconMail = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.79-1.79a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconUser = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [updatingTotal, setUpdatingTotal] = useState(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, totalPurchases: 0 });

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "16px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const buttonPadding = isMobile ? "8px 16px" : "10px 20px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";
  const gridMinWidth = isMobile ? "280px" : "320px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchSuppliers();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/suppliers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const suppliersData = Array.isArray(data) ? data : [];
      setSuppliers(suppliersData);
      setStats({
        total: suppliersData.length,
        active: suppliersData.filter(s => s.status !== "inactive").length,
        totalPurchases: suppliersData.reduce((s, sup) => s + (Number(sup.totalPurchases) || 0), 0)
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateTotalPurchases = async (id, newTotal) => {
    if (newTotal < 0) { showMessage(t("suppliers.negativeAmount"), "error"); return; }
    const token = localStorage.getItem("token");
    setUpdatingTotal(id);
    try {
      const supplier = suppliers.find(s => s.id === id);
      const res = await fetch(`http://localhost:3001/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...supplier, totalPurchases: newTotal })
      });
      if (res.ok) { fetchSuppliers(); showMessage(t("suppliers.totalPurchasesUpdated"), "success"); }
      else showMessage(t("common.error"), "error");
    } catch (e) { showMessage(t("common.error"), "error"); }
    finally { setUpdatingTotal(null); }
  };

  const createSupplier = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name,
          contact: modal.form.contact || "",
          email: modal.form.email || "",
          phone: modal.form.phone || "",
          address: modal.form.address || "",
          totalPurchases: Number(modal.form.totalPurchases) || 0,
          status: "active"
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchSuppliers();
        showMessage(t("suppliers.supplierCreated"), "success");
      } else showMessage(t("common.error"), "error");
    } catch (e) { showMessage(t("common.error"), "error"); }
  };

  const updateSupplier = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/suppliers/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name,
          contact: modal.form.contact || "",
          email: modal.form.email || "",
          phone: modal.form.phone || "",
          address: modal.form.address || "",
          totalPurchases: Number(modal.form.totalPurchases) || 0
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchSuppliers();
        showMessage(t("suppliers.supplierUpdated"), "success");
      } else showMessage(t("common.error"), "error");
    } catch (e) { showMessage(t("common.error"), "error"); }
  };

  const deleteSupplier = async (id) => {
    if (confirm(t("suppliers.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSuppliers();
      showMessage(t("suppliers.supplierDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("suppliers.confirmBulkDelete")?.replace("{count}", selectedIds.length) || `Supprimer ${selectedIds.length} fournisseur(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`http://localhost:3001/suppliers/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchSuppliers();
      setSelectedIds([]);
      showMessage(t("suppliers.suppliersDeleted")?.replace("{count}", selectedIds.length) || `${selectedIds.length} fournisseur(s) supprimé(s)`, "success");
    }
  };

  const importSuppliers = async (data) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/suppliers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ suppliers: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(`${result.success} fournisseur(s) importé(s)${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success");
        fetchSuppliers();
      } else showMessage(result.message || "Erreur lors de l'import", "error");
    } catch (error) {
      showMessage("Erreur de connexion lors de l'import", "error");
    } finally { setImporting(false); }
  };

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (s) => {
    setModal({
      open: true, editMode: true, editId: s.id,
      form: { name: s.name || "", contact: s.contact || "", email: s.email || "", phone: s.phone || "", address: s.address || "", totalPurchases: s.totalPurchases || 0 }
    });
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;

  const statsCards = [
    { icon: <IconFactory size={isMobile ? 28 : 32} />, label: t("suppliers.totalSuppliers"), value: stats.total, color: theme.primary },
    { icon: <IconUsers size={isMobile ? 28 : 32} />, label: t("suppliers.activeSuppliers"), value: stats.active, color: theme.accent },
    { icon: <IconDollar size={isMobile ? 28 : 32} />, label: t("suppliers.totalPurchases"), value: formatCurrency(stats.totalPurchases), color: "#f59e0b" }
  ];

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      <div style={{ marginLeft: isMobile ? "0px" : "280px", flex: 1, padding: isMobile ? "12px" : "24px", overflowX: "hidden" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>

          <style>{animations}</style>

          {/* Header */}
          <div style={{ marginBottom: sectionMargin, animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0, transform: animateCards ? "translateY(0)" : "translateY(-20px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconFactory size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.suppliers")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("suppliers.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {/* View toggle */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setViewMode("list")}
                    style={{ padding: "6px 12px", background: viewMode === "list" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: "white", cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "11px" : "13px", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <IconList size={14} color="white" />
                    {!isMobile && (t("suppliers.listView") || "Liste")}
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    style={{ padding: "6px 12px", background: viewMode === "grid" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: "white", cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "11px" : "13px", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <IconGrid size={14} color="white" />
                    {!isMobile && (t("suppliers.gridView") || "Grille")}
                  </button>
                </div>
                <ImportButton onImport={importSuppliers} label={t("common.import")} />
                <ExportButtons data={filteredSuppliers} filename="fournisseurs" />
                <button
                  onClick={() => setModal({ open: true, editMode: false, form: { name: "", contact: "", email: "", phone: "", address: "", totalPurchases: 0 } })}
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
              background: messageType === "success" ? `${theme.accent}15` : "#ef444415",
              border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`,
              color: messageType === "success" ? theme.accent : "#f87171",
              padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center",
              animation: "fadeInUp 0.3s ease", fontSize: isMobile ? "12px" : "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
              {messageType === "success"
                ? <IconCheck size={16} color={theme.accent} />
                : <IconX size={16} color="#f87171" />}
              {message}
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "180px" : "220px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.surfaceHover} 100%)`,
                  borderRadius: cardRadius, padding: cardPadding, textAlign: "center",
                  border: `1px solid ${theme.border}`,
                  animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`,
                  opacity: animateCards ? 1 : 0, transition: "transform 0.3s", cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: card.color }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: isMobile ? "22px" : "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Select */}
          <div style={{ marginBottom: "20px", animation: `fadeInUp 0.5s ease 0.4s`, opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "10px", display: "flex", pointerEvents: "none" }}>
                  <IconSearch size={16} color={theme.textSecondary} />
                </span>
                <input
                  type="text"
                  placeholder={`${t("common.search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px 10px 34px",
                    background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                    borderRadius: "10px", color: theme.text, transition: "border-color 0.2s",
                    fontSize: isMobile ? "13px" : "14px"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox
                items={filteredSuppliers}
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

          {/* ── List View ── */}
          {viewMode === "list" && (
            <div style={{ background: theme.surface, borderRadius: cardRadius, padding: "16px", border: `1px solid ${theme.border}`, overflowX: "auto", animation: `fadeInUp 0.5s ease 0.5s`, opacity: animateCards ? 1 : 0 }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "750px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "10px", width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                          onChange={() => { if (selectedIds.length === filteredSuppliers.length) setSelectedIds([]); else setSelectedIds(filteredSuppliers.map(s => s.id)); }}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                      </th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("suppliers.contactPerson")}</th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.email")}</th>
                      {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.phone")}</th>}
                      {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.address")}</th>}
                      <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("suppliers.totalPurchases")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier, idx) => (
                      <tr
                        key={supplier.id}
                        style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.2s", animation: `slideIn 0.3s ease ${idx * 0.03}s` }}
                        onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(supplier.id)}
                            onChange={() => { if (selectedIds.includes(supplier.id)) setSelectedIds(selectedIds.filter(id => id !== supplier.id)); else setSelectedIds([...selectedIds, supplier.id]); }}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>{supplier.name?.length > (isMobile ? 15 : 20) ? supplier.name.substring(0, isMobile ? 12 : 17) + "..." : supplier.name}</td>
                        <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{supplier.contact?.length > (isMobile ? 15 : 20) ? supplier.contact.substring(0, isMobile ? 12 : 17) + "..." : supplier.contact || "-"}</td>
                        <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{supplier.email?.length > (isMobile ? 20 : 30) ? supplier.email.substring(0, isMobile ? 17 : 27) + "..." : supplier.email || "-"}</td>
                        {!isMobile && <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{supplier.phone || "-"}</td>}
                        {!isMobile && <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{supplier.address?.length > 35 ? supplier.address.substring(0, 32) + "..." : supplier.address || "-"}</td>}
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          {updatingTotal === supplier.id ? (
                            <input
                              type="number" step="0.01" defaultValue={supplier.totalPurchases || 0} autoFocus
                              onBlur={(e) => updateTotalPurchases(supplier.id, parseFloat(e.target.value) || 0)}
                              onKeyPress={(e) => { if (e.key === "Enter") updateTotalPurchases(supplier.id, parseFloat(e.target.value) || 0); }}
                              style={{ width: isMobile ? "80px" : "100px", padding: "4px 6px", background: theme.surfaceHover, border: `1px solid ${theme.accent}`, borderRadius: "6px", color: theme.text, textAlign: "right", fontSize: tableFontSize }}
                            />
                          ) : (
                            <span
                              onClick={() => setUpdatingTotal(supplier.id)}
                              style={{ color: theme.accent, fontWeight: "bold", cursor: "pointer", display: "inline-block", padding: "2px 6px", borderRadius: "4px", transition: "background 0.2s", fontSize: tableFontSize }}
                              onMouseEnter={(e) => e.currentTarget.style.background = `${theme.accent}15`}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                              {formatCurrency(supplier.totalPurchases)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => openEditModal(supplier)}
                              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.color = "white"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; e.currentTarget.style.color = "#f59e0b"; }}
                              title={t("common.edit")}
                            >
                              <IconEdit size={isMobile ? 12 : 14} color="currentColor" />
                            </button>
                            <button
                              onClick={() => deleteSupplier(supplier.id)}
                              style={{ background: "rgba(204,51,51,0.12)", color: "#ef4444", border: "1px solid rgba(204,51,51,0.3)", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#c33"; e.currentTarget.style.color = "white"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(204,51,51,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
                              title={t("common.delete")}
                            >
                              <IconTrash size={isMobile ? 12 : 14} color="currentColor" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSuppliers.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", opacity: 0.3 }}>
                    <IconFactory size={isMobile ? 36 : 48} color={theme.textSecondary} />
                  </div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{searchTerm ? t("common.noResults") : t("suppliers.noSuppliers")}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Grid View ── */}
          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`, gap: gridGap, animation: `fadeInUp 0.5s ease 0.5s`, opacity: animateCards ? 1 : 0 }}>
              {filteredSuppliers.map((supplier, idx) => (
                <div
                  key={supplier.id}
                  style={{ background: theme.surface, borderRadius: cardRadius, padding: "16px", border: `1px solid ${theme.border}`, transition: "transform 0.3s, box-shadow 0.3s", animation: `fadeInUp 0.3s ease ${idx * 0.05}s` }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ width: isMobile ? "40px" : "50px", height: isMobile ? "40px" : "50px", borderRadius: "50%", background: theme.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconBuilding size={isMobile ? 20 : 24} color="white" />
                    </div>
                    <div>
                      <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "13px" : "15px" }}>
                        {supplier.name?.length > (isMobile ? 15 : 20) ? supplier.name.substring(0, isMobile ? 12 : 17) + "..." : supplier.name}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <IconUser size={10} color={theme.textSecondary} />
                        {supplier.contact?.length > (isMobile ? 15 : 20) ? supplier.contact.substring(0, isMobile ? 12 : 17) + "..." : supplier.contact || t("suppliers.noContact")}
                      </div>
                    </div>
                  </div>

                  {/* Card fields */}
                  {[
                    { icon: <IconMail size={11} color={theme.textSecondary} />, label: t("common.email"), value: supplier.email?.length > (isMobile ? 20 : 25) ? supplier.email.substring(0, isMobile ? 17 : 22) + "..." : supplier.email || "-" },
                    { icon: <IconPhone size={11} color={theme.textSecondary} />, label: t("common.phone"), value: supplier.phone?.length > (isMobile ? 12 : 15) ? supplier.phone.substring(0, isMobile ? 9 : 12) + "..." : supplier.phone || "-" },
                    { icon: <IconMapPin size={11} color={theme.textSecondary} />, label: t("common.address"), value: supplier.address?.length > (isMobile ? 20 : 30) ? supplier.address.substring(0, isMobile ? 17 : 27) + "..." : supplier.address || "-" },
                  ].map((row, i) => (
                    <div key={i} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                        {row.icon} {row.label}
                      </span>
                      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{row.value}</span>
                    </div>
                  ))}

                  {/* Total purchases */}
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <IconDollar size={11} color={theme.textSecondary} />
                      {t("suppliers.totalPurchases")}
                    </span>
                    {updatingTotal === supplier.id ? (
                      <input
                        type="number" step="0.01" defaultValue={supplier.totalPurchases || 0} autoFocus
                        onBlur={(e) => updateTotalPurchases(supplier.id, parseFloat(e.target.value) || 0)}
                        onKeyPress={(e) => { if (e.key === "Enter") updateTotalPurchases(supplier.id, parseFloat(e.target.value) || 0); }}
                        style={{ width: isMobile ? "80px" : "100px", padding: "4px 6px", background: theme.surfaceHover, border: `1px solid ${theme.accent}`, borderRadius: "6px", color: theme.text, textAlign: "right", fontSize: isMobile ? "11px" : "13px" }}
                      />
                    ) : (
                      <span
                        onClick={() => setUpdatingTotal(supplier.id)}
                        style={{ color: theme.accent, fontSize: isMobile ? "11px" : "13px", fontWeight: "bold", cursor: "pointer", display: "inline-block", padding: "2px 6px", borderRadius: "4px", transition: "background 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = `${theme.accent}15`}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {formatCurrency(supplier.totalPurchases)}
                      </span>
                    )}
                  </div>

                  {/* Card actions */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => openEditModal(supplier)}
                      style={{ flex: 1, padding: "7px", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.12)"; e.currentTarget.style.color = "#f59e0b"; }}
                    >
                      <IconEdit size={12} color="currentColor" />
                      {!isMobile && t("common.edit")}
                    </button>
                    <button
                      onClick={() => deleteSupplier(supplier.id)}
                      style={{ flex: 1, padding: "7px", background: "rgba(204,51,51,0.12)", color: "#ef4444", border: "1px solid rgba(204,51,51,0.3)", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#c33"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(204,51,51,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
                    >
                      <IconTrash size={12} color="currentColor" />
                      {!isMobile && t("common.delete")}
                    </button>
                  </div>
                </div>
              ))}
              {filteredSuppliers.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", opacity: 0.3 }}>
                    <IconFactory size={isMobile ? 36 : 48} color={theme.textSecondary} />
                  </div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{searchTerm ? t("common.noResults") : t("suppliers.noSuppliers")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout/Modification */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px" }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "24px", width: modalWidth, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              {modal.editMode
                ? <><IconEdit size={isMobile ? 20 : 24} color={theme.primary} /> {t("suppliers.editSupplier")}</>
                : <><IconFactory size={isMobile ? 20 : 24} color={theme.primary} /> {t("suppliers.addSupplier")}</>
              }
            </h2>

            {[
              { label: `${t("common.name")} *`, key: "name", type: "text", placeholder: t("suppliers.supplierName"), autoFocus: true },
              { label: t("suppliers.contactPerson"), key: "contact", type: "text", placeholder: t("suppliers.contactPerson") },
              { label: t("common.email"), key: "email", type: "email", placeholder: "Email" },
              { label: t("common.phone"), key: "phone", type: "tel", placeholder: t("common.phone") },
              { label: t("common.address"), key: "address", type: "text", placeholder: t("common.address") },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: "14px" }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={modal.form[field.key] || ""}
                  onChange={e => setModal({ ...modal, form: { ...modal.form, [field.key]: e.target.value } })}
                  autoFocus={field.autoFocus}
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("suppliers.totalPurchases")}</label>
              <input
                type="number" step="0.01"
                placeholder={t("suppliers.totalPurchases")}
                value={modal.form.totalPurchases || 0}
                onChange={e => setModal({ ...modal, form: { ...modal.form, totalPurchases: parseFloat(e.target.value) || 0 } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={modal.editMode ? updateSupplier : createSupplier}
                style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={16} color="white" />
                {modal.editMode ? t("common.edit") : t("common.add")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })}
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