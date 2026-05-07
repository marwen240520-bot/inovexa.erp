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

const IconUsers = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconUserCheck = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
);

const IconUserX = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="17" y1="11" x2="23" y2="17"/>
    <line x1="23" y1="11" x2="17" y2="17"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);

const IconSearch = ({ size = 15, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconList = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconEdit = ({ size = 13, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconPlus = ({ size = 15, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSave = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

// Small filled circle dots for active/inactive status indicator
const IconDotFilled = ({ size = 8, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" style={style}>
    <circle cx="4" cy="4" r="4" fill={color}/>
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

export default function ClientsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [modal, setModal] = useState({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalSpent: 0 });

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "16px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const statusFontSize = isMobile ? "10px" : "12px";
  const buttonPadding = isMobile ? "8px 16px" : "10px 20px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";
  const gridMinWidth = isMobile ? "280px" : "320px";

  const mainContainerStyle = {
    flex: 1,
    margin: isMobile ? "0px" : "6px",
    marginLeft: isMobile ? "0px" : "280px",
    padding: isMobile ? "12px" : "16px",
    width: "100%",
    minHeight: "100vh",
    overflowX: "hidden" as const,
    background: theme.background
  };

  const innerContainerStyle = {
    maxWidth: isMobile ? "100%" : "1400px",
    margin: "0 auto",
    width: "100%"
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchClients();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/clients", { headers: { Authorization: `Bearer ${token}` } });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setClients(data);
      const totalSpent = data.reduce((s, c) => s + (Number(c.totalSpent) || 0), 0);
      setStats({
        total: data.length,
        active: data.filter(c => c.status === "active").length,
        inactive: data.filter(c => c.status === "inactive").length,
        totalSpent
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createClient = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name, email: modal.form.email,
          phone: modal.form.phone || "", address: modal.form.address || "",
          totalSpent: Number(modal.form.totalSpent) || 0, status: modal.form.status || "active"
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchClients();
        showMessage(t("clients.clientCreated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const updateClient = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/clients/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name, email: modal.form.email,
          phone: modal.form.phone || "", address: modal.form.address || "",
          totalSpent: Number(modal.form.totalSpent) || 0, status: modal.form.status || "active"
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchClients();
        showMessage(t("clients.clientUpdated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const deleteClient = async (id) => {
    if (confirm(t("clients.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/clients/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchClients();
      showMessage(t("clients.clientDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("clients.confirmBulkDelete")?.replace("{count}", selectedIds.length) || `Supprimer ${selectedIds.length} client(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`http://localhost:3001/clients/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      fetchClients();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} client(s) supprimé(s)`, "success");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`http://localhost:3001/clients/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchClients();
        const statusText = newStatus === "active" ? t("clients.activated") : t("clients.deactivated");
        showMessage(statusText, "success");
      } else {
        const client = clients.find(c => c.id === id);
        if (client) {
          const putRes = await fetch(`http://localhost:3001/clients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...client, status: newStatus })
          });
          if (putRes.ok) {
            await fetchClients();
            showMessage(newStatus === "active" ? t("clients.activated") : t("clients.deactivated"), "success");
          } else { showMessage(t("common.error"), "error"); }
        } else { showMessage(t("common.error"), "error"); }
      }
    } catch(e) { showMessage(t("common.error"), "error"); }
    finally { setUpdatingStatus(null); }
  };

  const importClients = async (data) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clients: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(`${result.success} client(s) importé(s) avec succès${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success");
        fetchClients();
      } else { showMessage(result.message || "Erreur lors de l'import", "error"); }
    } catch (error) {
      showMessage("Erreur de connexion lors de l'import", "error");
    } finally { setImporting(false); }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (client) => {
    setModal({
      open: true, editMode: true, editId: client.id,
      form: {
        name: client.name || "", email: client.email || "",
        phone: client.phone || "", address: client.address || "",
        totalSpent: client.totalSpent || 0, status: client.status || "active"
      }
    });
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

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
      from { opacity: 0; transform: translateX(-15px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: ${cardRadius};
    }
    .card-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      border-color: ${theme.primary};
    }
    @media (max-width: 768px) {
      .card-hover:hover { transform: translateY(-2px); }
    }
  `;

  const statsCards = [
    { icon: <IconUsers size={isMobile ? 26 : 30} color={theme.primary} />, label: t("clients.totalClients"), value: stats.total, color: theme.primary },
    { icon: <IconUserCheck size={isMobile ? 26 : 30} color={theme.accent} />, label: t("clients.activeClients"), value: stats.active, color: theme.accent },
    { icon: <IconUserX size={isMobile ? 26 : 30} color={stats.inactive > 0 ? "#f59e0b" : theme.textSecondary} />, label: t("clients.inactiveClients"), value: stats.inactive, color: stats.inactive > 0 ? "#f59e0b" : theme.textSecondary },
    { icon: <IconCurrencyDollar size={isMobile ? 26 : 30} color={theme.accent} />, label: t("clients.totalSpent"), value: formatCurrency(stats.totalSpent), color: theme.accent }
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

  // ── Status badge helper ──
  const StatusBadge = ({ client, onClick }) => (
    <button
      onClick={onClick}
      disabled={updatingStatus === client.id}
      style={{
        background: client.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        color: client.status === "active" ? theme.accent : "#ef4444",
        border: "none",
        borderRadius: "20px",
        padding: "4px 10px",
        cursor: updatingStatus === client.id ? "wait" : "pointer",
        transition: "opacity 0.2s",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        opacity: updatingStatus === client.id ? 0.6 : 1,
        fontSize: statusFontSize
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.75"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      <IconDotFilled size={7} color={client.status === "active" ? theme.accent : "#ef4444"} />
      {isMobile
        ? (client.status === "active" ? "A" : "I")
        : (client.status === "active" ? t("clients.active") : t("clients.inactive"))}
    </button>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: theme.background, margin: 0, padding: 0 }}>
      <Sidebar />
      <div style={mainContainerStyle}>
        <div style={innerContainerStyle}>
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
                  <IconUsers size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.clients")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("clients.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {/* View toggle */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setViewMode("list")}
                    style={{
                      padding: "6px 10px",
                      background: viewMode === "list" ? theme.primary : theme.surfaceHover,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: isMobile ? "11px" : "13px"
                    }}
                  >
                    <IconList size={13} color={viewMode === "list" ? "white" : theme.textSecondary} />
                    {!isMobile && (t("clients.listView") || "Liste")}
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    style={{
                      padding: "6px 10px",
                      background: viewMode === "grid" ? theme.primary : theme.surfaceHover,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: isMobile ? "11px" : "13px"
                    }}
                  >
                    <IconGrid size={13} color={viewMode === "grid" ? "white" : theme.textSecondary} />
                    {!isMobile && (t("clients.gridView") || "Grille")}
                  </button>
                </div>
                <ImportButton onImport={importClients} label={t("common.import")} />
                <ExportButtons data={filteredClients} filename="clients" />
                <button
                  onClick={() => setModal({ open: true, editMode: false, form: { name: "", email: "", phone: "", address: "", totalSpent: 0, status: "active" } })}
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
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
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
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "160px" : "200px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
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
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox
                items={filteredClients}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onSelectAll={(ids) => setSelectedIds(ids)}
                getItemId={(item) => item.id}
              />
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{
                    background: "#c33", color: "white", border: "none", borderRadius: "8px",
                    padding: "8px 16px", cursor: "pointer", transition: "opacity 0.2s",
                    fontSize: isMobile ? "12px" : "14px",
                    display: "inline-flex", alignItems: "center", gap: "6px"
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

          {/* ── List View ── */}
          {viewMode === "list" && (
            <div style={{
              background: theme.surface, borderRadius: cardRadius, padding: "16px",
              border: `1px solid ${theme.border}`, overflowX: "auto",
              animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0
            }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "700px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "10px", width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredClients.length && filteredClients.length > 0}
                          onChange={() => {
                            if (selectedIds.length === filteredClients.length) setSelectedIds([]);
                            else setSelectedIds(filteredClients.map(c => c.id));
                          }}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                      </th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.email")}</th>
                      {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.phone")}</th>}
                      {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.address")}</th>}
                      <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("clients.totalSpent")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, idx) => (
                      <tr
                        key={client.id}
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
                            checked={selectedIds.includes(client.id)}
                            onChange={() => {
                              if (selectedIds.includes(client.id)) setSelectedIds(selectedIds.filter(id => id !== client.id));
                              else setSelectedIds([...selectedIds, client.id]);
                            }}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>
                          {client.name?.length > (isMobile ? 15 : 20) ? client.name.substring(0, isMobile ? 12 : 17) + "..." : client.name}
                        </td>
                        <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                          {client.email?.length > (isMobile ? 20 : 30) ? client.email.substring(0, isMobile ? 17 : 27) + "..." : client.email}
                        </td>
                        {!isMobile && <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{client.phone || "-"}</td>}
                        {!isMobile && <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{client.address?.length > 30 ? client.address.substring(0, 27) + "..." : client.address || "-"}</td>}
                        <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>
                          {formatCurrency(client.totalSpent)}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <StatusBadge client={client} onClick={() => toggleStatus(client.id, client.status)} />
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => openEditModal(client)}
                              title={t("common.edit")}
                              style={{
                                background: "#f59e0b", color: "white", border: "none",
                                borderRadius: "6px", padding: "5px 8px", cursor: "pointer",
                                transition: "opacity 0.2s", display: "inline-flex", alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              <IconEdit size={13} color="white" />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              title={t("common.delete")}
                              style={{
                                background: "#c33", color: "white", border: "none",
                                borderRadius: "6px", padding: "5px 8px", cursor: "pointer",
                                transition: "opacity 0.2s", display: "inline-flex", alignItems: "center"
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
              {filteredClients.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <IconUsers size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block" }} />
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                    {searchTerm ? t("common.noResults") : t("clients.noClients")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Grid View ── */}
          {viewMode === "grid" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`,
              gap: gridGap,
              animation: "fadeInUp 0.5s ease 0.5s",
              opacity: animateCards ? 1 : 0
            }}>
              {filteredClients.map((client, idx) => (
                <div
                  key={client.id}
                  style={{
                    background: theme.surface,
                    borderRadius: cardRadius,
                    padding: "16px",
                    border: `1px solid ${client.status === "active" ? theme.accent : theme.border}`,
                    transition: "transform 0.3s, box-shadow 0.3s",
                    animation: `fadeInUp 0.3s ease ${idx * 0.05}s`
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Avatar + info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{
                      width: isMobile ? "40px" : "50px",
                      height: isMobile ? "40px" : "50px",
                      borderRadius: "50%",
                      background: theme.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile ? "16px" : "20px",
                      color: "white",
                      fontWeight: "bold",
                      flexShrink: 0
                    }}>
                      {client.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "13px" : "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {client.name?.length > (isMobile ? 15 : 20) ? client.name.substring(0, isMobile ? 12 : 17) + "..." : client.name}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {client.email?.length > (isMobile ? 20 : 25) ? client.email.substring(0, isMobile ? 17 : 22) + "..." : client.email}
                      </div>
                    </div>
                  </div>

                  {[
                    { label: t("common.phone"), value: client.phone?.length > (isMobile ? 12 : 15) ? client.phone.substring(0, isMobile ? 9 : 12) + "..." : client.phone || "-" },
                    { label: t("clients.totalSpent"), value: formatCurrency(client.totalSpent), bold: true, color: theme.accent }
                  ].map((row, i) => (
                    <div key={i} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{row.label}</span>
                      <span style={{ color: row.color || theme.textSecondary, fontSize: isMobile ? row.bold ? "11px" : "9px" : row.bold ? "13px" : "11px", fontWeight: row.bold ? "bold" : "normal" }}>{row.value}</span>
                    </div>
                  ))}

                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{t("common.status")}</span>
                    <StatusBadge client={client} onClick={() => toggleStatus(client.id, client.status)} />
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => openEditModal(client)}
                      style={{
                        flex: 1, padding: "7px", background: "#f59e0b", color: "white", border: "none",
                        borderRadius: "6px", cursor: "pointer", transition: "opacity 0.2s",
                        fontSize: isMobile ? "10px" : "12px",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                      <IconEdit size={12} color="white" />
                      {!isMobile && t("common.edit")}
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      style={{
                        flex: 1, padding: "7px", background: "#c33", color: "white", border: "none",
                        borderRadius: "6px", cursor: "pointer", transition: "opacity 0.2s",
                        fontSize: isMobile ? "10px" : "12px",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                      <IconTrash size={12} color="white" />
                      {!isMobile && t("common.delete")}
                    </button>
                  </div>
                </div>
              ))}

              {filteredClients.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", gridColumn: "1 / -1" }}>
                  <IconUsers size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block" }} />
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                    {searchTerm ? t("common.noResults") : t("clients.noClients")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal — Add / Edit */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px"
        }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "24px", width: modalWidth, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              {modal.editMode
                ? <><IconEdit size={isMobile ? 16 : 20} color={theme.primary} /> {t("clients.editClient")}</>
                : <><IconPlus size={isMobile ? 16 : 20} color={theme.primary} /> {t("clients.addClient")}</>}
            </h2>

            {[
              { label: t("common.name") + " *", key: "name", type: "text", placeholder: t("clients.clientName"), autoFocus: true },
              { label: t("common.email") + " *", key: "email", type: "email", placeholder: "Email" },
              { label: t("common.phone"), key: "phone", type: "tel", placeholder: t("common.phone") },
              { label: t("common.address"), key: "address", type: "text", placeholder: t("common.address") },
              { label: t("clients.totalSpent"), key: "totalSpent", type: "number", placeholder: t("clients.totalSpent"), step: "0.01" }
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: "14px" }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{field.label}</label>
                <input
                  type={field.type}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={modal.form[field.key] || (field.type === "number" ? 0 : "")}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, [field.key]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value } })}
                  autoFocus={field.autoFocus}
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.status")}</label>
              <select
                value={modal.form.status || "active"}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, status: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
              >
                <option value="active">{t("clients.active")}</option>
                <option value="inactive">{t("clients.inactive")}</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={modal.editMode ? updateClient : createClient}
                style={{
                  flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none",
                  borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={14} color="white" />
                {modal.editMode ? t("common.edit") : t("common.add")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })}
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