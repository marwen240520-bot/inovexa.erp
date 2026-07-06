"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";
import ImportButton from "@/components/ui/ImportButton";
import Spinner from "@/components/ui/Spinner";

// --- SVG Icon Components -------------------------------------------------------

const IconUsers = ({ size = 20, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconUserCheck = ({ size = 16, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
);

const IconUserX = ({ size = 16, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="17" y1="11" x2="23" y2="17"/>
    <line x1="23" y1="11" x2="17" y2="17"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);

const IconSearch = ({ size = 15, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconList = ({ size = 14, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = ({ size = 14, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconEdit = ({ size = 13, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconPlus = ({ size = 15, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSave = ({ size = 14, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style = {} as React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

const IconDotFilled = ({ size = 8, color = "currentColor", style = undefined as React.CSSProperties | undefined }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" style={style}>
    <circle cx="4" cy="4" r="4" fill={color}/>
  </svg>
);

// --- SelectAllCheckbox ---------------------------------------------------------

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
      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "13px" }}>
        {t("common.selectAll")}
      </span>
    </label>
  );
}

// --- Types ---------------------------------------------------------------------

type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalSpent?: number;
  status?: string;
  [key: string]: unknown;
};

type ModalForm = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  totalSpent?: number;
  status?: string;
  [key: string]: string | number | undefined;
};

type ModalState = {
  open: boolean;
  form: ModalForm;
  editMode: boolean;
  editId: string | null;
};

// --- Main Component ------------------------------------------------------------

export default function ClientsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();

  // FIX: Margin left for desktop sidebar (280px)
  const contentMarginLeft = isMobile ? "0" : "0px";

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalSpent: 0 });

  // -- Responsive sizing tokens --
  const headerTitleSize = isMobile ? "20px" : "28px";
  const cardPadding = isMobile ? "14px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "10px" : "20px";
  const sectionMargin = isMobile ? "16px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const statusFontSize = isMobile ? "11px" : "12px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";

  // FIX: Main container with proper sidebar offset
  const mainContainerStyle = {
    flex: 1,
    marginLeft: contentMarginLeft,
    padding: isMobile ? "12px" : "16px",
    paddingBottom: isMobile ? "70px" : "24px",
    width: "100%",
    minHeight: "100vh",
    overflowX: "hidden" as const,
    background: theme.background,
  };

  const innerContainerStyle = {
    maxWidth: isMobile ? "100%" : "1400px",
    margin: "0 auto",
    width: "100%",
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchClients();
    setTimeout(() => setAnimateCards(true), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setClients(data);
      const totalSpent = data.reduce((s: number, c: Client) => s + (Number(c.totalSpent) || 0), 0);
      setStats({
        total: data.length,
        active: data.filter((c: Client) => c.status === "active").length,
        inactive: data.filter((c: Client) => c.status === "inactive").length,
        totalSpent,
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const createClient = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name, email: modal.form.email,
          phone: modal.form.phone || "", address: modal.form.address || "",
          totalSpent: Number(modal.form.totalSpent) || 0, status: modal.form.status || "active",
        }),
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchClients();
        showMessage(t("clients.clientCreated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch (e) { showMessage(t("common.error"), "error"); }
  };

  const updateClient = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name, email: modal.form.email,
          phone: modal.form.phone || "", address: modal.form.address || "",
          totalSpent: Number(modal.form.totalSpent) || 0, status: modal.form.status || "active",
        }),
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchClients();
        showMessage(t("clients.clientUpdated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch (e) { showMessage(t("common.error"), "error"); }
  };

  const deleteClient = async (id: string) => {
    if (confirm(t("clients.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      fetchClients();
      showMessage(t("clients.clientDeleted"), "success");
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(
      t("clients.confirmBulkDelete")?.replace("{count}", String(selectedIds.length)) ||
      `Supprimer ${selectedIds.length} client(s) ?`
    )) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchClients();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} client(s) supprimé(s)`, "success");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchClients();
        showMessage(newStatus === "active" ? t("clients.activated") : t("clients.deactivated"), "success");
      } else {
        const client = clients.find((c) => c.id === id);
        if (client) {
          const putRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...client, status: newStatus }),
          });
          if (putRes.ok) {
            await fetchClients();
            showMessage(newStatus === "active" ? t("clients.activated") : t("clients.deactivated"), "success");
          } else { showMessage(t("common.error"), "error"); }
        } else { showMessage(t("common.error"), "error"); }
      }
    } catch (e) { showMessage(t("common.error"), "error"); }
    finally { setUpdatingStatus(null); }
  };

  const importClients = async (data: Client[]) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clients: data }),
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(
          `${result.success} client(s) importé(s) avec succés${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`,
          "success"
        );
        fetchClients();
      } else { showMessage(result.message || "Erreur lors de l'import", "error"); }
    } catch (error) {
      showMessage("Erreur de connexion lors de l'import", "error");
    } finally { setImporting(false); }
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (client: Client) => {
    setModal({
      open: true, editMode: true, editId: client.id,
      form: {
        name: client.name || "", email: client.email || "",
        phone: (client.phone as string) || "", address: (client.address as string) || "",
        totalSpent: client.totalSpent || 0, status: (client.status as string) || "active",
      },
    });
  };

  const filteredClients = clients.filter((client) =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone as string | undefined)?.includes(searchTerm)
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
  `;

  // -- Shared button style helpers --
  const viewToggleBtnStyle = (active: boolean): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: active ? theme.primary : "transparent",
    border: `1px solid ${active ? theme.primary : theme.border}`,
    borderRadius: "7px",
    color: active ? "white" : theme.textSecondary,
    cursor: "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
  });

  const iconOnlyBtnStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme.surfaceHover,
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    color: theme.textSecondary,
    cursor: "pointer",
    transition: "opacity 0.2s",
    flexShrink: 0,
  };

  // -- Stat icon bubble --
  const statIconBubble = (bg: string): React.CSSProperties => ({
    width: isMobile ? "36px" : "44px",
    height: isMobile ? "36px" : "44px",
    borderRadius: "10px",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  const statsCards = [
    {
      icon: <IconUsers size={isMobile ? 20 : 24} color={theme.primary} />,
      iconBg: `${theme.primary}22`,
      label: t("clients.totalClients"),
      value: stats.total,
      color: theme.primary,
    },
    {
      icon: <IconUserCheck size={isMobile ? 20 : 24} color={theme.accent} />,
      iconBg: `${theme.accent}22`,
      label: t("clients.activeClients"),
      value: stats.active,
      color: theme.accent,
    },
    {
      icon: <IconUserX size={isMobile ? 20 : 24} color={stats.inactive > 0 ? "#f59e0b" : theme.textSecondary} />,
      iconBg: stats.inactive > 0 ? "rgba(245,158,11,0.15)" : `${theme.textSecondary}20`,
      label: t("clients.inactiveClients"),
      value: stats.inactive,
      color: stats.inactive > 0 ? "#f59e0b" : theme.textSecondary,
    },
    {
      icon: <IconCurrencyDollar size={isMobile ? 20 : 24} color={theme.accent} />,
      iconBg: `${theme.accent}22`,
      label: t("clients.totalSpent"),
      value: formatCurrency(stats.totalSpent),
      color: theme.accent,
    },
  ];

  // FIX: Loading state with sidebar
  if (loading) {
    return <Spinner fullScreen />;
  }

  // -- Status Badge --
  const StatusBadge = ({ client, onClick }: { client: Client; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={updatingStatus === client.id}
      style={{
        background: client.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
        color: client.status === "active" ? theme.accent : "#b45309",
        border: "none",
        borderRadius: "20px",
        padding: "4px 10px",
        cursor: updatingStatus === client.id ? "wait" : "pointer",
        transition: "opacity 0.2s",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        opacity: updatingStatus === client.id ? 0.6 : 1,
        fontSize: statusFontSize,
        fontWeight: "500",
        minHeight: "28px",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <IconDotFilled size={6} color={client.status === "active" ? theme.accent : "#b45309"} />
      {client.status === "active" ? t("clients.active") : t("clients.inactive")}
    </button>
  );

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      width: "100%", 
      background: theme.background, 
      padding: 0,
      margin: 0
    }}>
      <div style={mainContainerStyle}>
        <div style={innerContainerStyle}>
          <style>{animations}</style>

          {/* -- Header -- */}
          <div style={{
            marginBottom: sectionMargin,
            animation: "fadeInDown 0.5s ease",
            opacity: animateCards ? 1 : 0,
            transform: animateCards ? "translateY(0)" : "translateY(-20px)",
          }}>
            {/* Row 1: title + subtitle */}
            <div style={{ marginBottom: "12px" }}>
              <h1 style={{
                color: theme.text,
                fontSize: headerTitleSize,
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <IconUsers size={isMobile ? 20 : 26} color={theme.primary} />
                {t("common.clients")}
              </h1>
              <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>
                {t("clients.subtitle")}
              </p>
            </div>

            {/* Row 2: actions */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {/* View toggle */}
              <div style={{
                display: "flex",
                gap: "4px",
                background: theme.surfaceHover,
                borderRadius: "9px",
                padding: "3px",
              }}>
                <button
                  onClick={() => setViewMode("list")}
                  style={viewToggleBtnStyle(viewMode === "list")}
                  title={t("clients.listView") || "Liste"}
                >
                  <IconList size={14} color={viewMode === "list" ? "white" : theme.textSecondary} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  style={viewToggleBtnStyle(viewMode === "grid")}
                  title={t("clients.gridView") || "Grille"}
                >
                  <IconGrid size={14} color={viewMode === "grid" ? "white" : theme.textSecondary} />
                </button>
              </div>

              {/* Import */}
              <ImportButton onImport={importClients} label={isMobile ? "" : t("common.import")} />

              {/* Export */}
              <ExportButtons data={filteredClients} filename="clients" />

              {/* Add */}
              <button
                onClick={() => setModal({ open: true, editMode: false, editId: null, form: { name: "", email: "", phone: "", address: "", totalSpent: 0, status: "active" } })}
                style={{
                  background: theme.gradient,
                  color: "white",
                  padding: "0 16px",
                  height: "36px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: "500",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <IconPlus size={14} color="white" />
                {t("common.add")}
              </button>
            </div>
          </div>

          {/* -- Message -- */}
          {message && (
            <div style={{
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`,
              color: messageType === "success" ? theme.accent : "#f87171",
              padding: "12px",
              borderRadius: "12px",
              marginBottom: "16px",
              textAlign: "center",
              animation: "fadeInUp 0.3s ease",
              fontSize: isMobile ? "12px" : "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}>
              {messageType === "success"
                ? <IconCheckCircle size={16} color={theme.accent} />
                : <IconXCircle size={16} color="#f87171" />}
              {message}
            </div>
          )}

          {/* -- Stats Cards é 2 colonnes fixes sur mobile -- */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(auto-fit, minmax(200px, 1fr))",
            gap: gridGap,
            marginBottom: sectionMargin,
          }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: theme.surface,
                  borderRadius: cardRadius,
                  padding: cardPadding,
                  border: `1px solid ${theme.border}`,
                  animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`,
                  opacity: animateCards ? 1 : 0,
                  transition: "transform 0.3s",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "10px" : "14px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div style={statIconBubble(card.iconBg)}>{card.icon}</div>
                <div>
                  <div style={{ fontSize: isMobile ? "20px" : "26px", color: card.color, fontWeight: "600", lineHeight: 1.1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary, marginTop: "2px", lineHeight: 1.3 }}>
                    {card.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* -- Filters -- */}
          <div style={{ marginBottom: "16px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <IconSearch
                size={15}
                color={theme.textSecondary}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                type="text"
                placeholder={`${t("common.search")}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px 0 36px",
                  background: theme.surfaceHover,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  color: theme.text,
                  transition: "border-color 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
              />
            </div>

            {/* Select all + bulk delete */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <SelectAllCheckbox
                items={filteredClients}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onSelectAll={(ids: string[]) => setSelectedIds(ids)}
                getItemId={(item: Client) => item.id}
              />
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{
                    background: "rgba(204,51,51,0.1)",
                    color: "#c33",
                    border: "1px solid rgba(204,51,51,0.25)",
                    borderRadius: "8px",
                    padding: "0 14px",
                    height: "34px",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    fontSize: isMobile ? "12px" : "14px",
                    fontWeight: "500",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <IconTrash size={13} color="#c33" />
                  {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* -- LIST VIEW -- */}
          {viewMode === "list" && (
            <div style={{
              background: theme.surface,
              borderRadius: cardRadius,
              padding: isMobile ? "10px" : "16px",
              border: `1px solid ${theme.border}`,
              overflowX: "auto",
              animation: "fadeInUp 0.5s ease 0.5s",
              opacity: animateCards ? 1 : 0,
            }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "600px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "10px 8px", width: "36px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredClients.length && filteredClients.length > 0}
                          onChange={() => {
                            if (selectedIds.length === filteredClients.length) setSelectedIds([]);
                            else setSelectedIds(filteredClients.map((c) => c.id));
                          }}
                          style={{ width: "15px", height: "15px", cursor: "pointer" }}
                        />
                      </th>
                      <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                      <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize }}>{t("common.email")}</th>
                      {!isMobile && <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize }}>{t("common.phone")}</th>}
                      {!isMobile && <th style={{ padding: "10px 8px", textAlign: "left", fontSize: tableFontSize }}>{t("common.address")}</th>}
                      <th style={{ padding: "10px 8px", textAlign: "right", fontSize: tableFontSize }}>{t("clients.totalSpent")}</th>
                      <th style={{ padding: "10px 8px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                      <th style={{ padding: "10px 8px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, idx) => (
                      <tr
                        key={client.id}
                        style={{
                          borderBottom: `1px solid ${theme.surfaceHover}`,
                          transition: "background 0.2s",
                          animation: `slideIn 0.3s ease ${idx * 0.03}s`,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = theme.surfaceHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(client.id)}
                            onChange={() => {
                              if (selectedIds.includes(client.id)) setSelectedIds(selectedIds.filter((id) => id !== client.id));
                              else setSelectedIds([...selectedIds, client.id]);
                            }}
                            style={{ width: "15px", height: "15px", cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "10px 8px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>
                          {(client.name?.length ?? 0) > (isMobile ? 14 : 20)
                            ? client.name.substring(0, isMobile ? 11 : 17) + "..."
                            : client.name}
                        </td>
                        <td style={{ padding: "10px 8px", color: theme.textSecondary, fontSize: tableFontSize }}>
                          {(client.email?.length ?? 0) > (isMobile ? 18 : 30)
                            ? client.email.substring(0, isMobile ? 15 : 27) + "..."
                            : client.email}
                        </td>
                        {!isMobile && (
                          <td style={{ padding: "10px 8px", color: theme.textSecondary, fontSize: tableFontSize }}>
                            {(client.phone as string) || "-"}
                          </td>
                        )}
                        {!isMobile && (
                          <td style={{ padding: "10px 8px", color: theme.textSecondary, fontSize: tableFontSize }}>
                            {(client.address?.length ?? 0) > 30
                              ? (client.address as string).substring(0, 27) + "..."
                              : (client.address as string) || "-"}
                          </td>
                        )}
                        <td style={{ padding: "10px 8px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>
                          {formatCurrency(client.totalSpent)}
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <StatusBadge client={client} onClick={() => toggleStatus(client.id, client.status)} />
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(client)}
                              title={t("common.edit")}
                              style={{
                                width: "32px",
                                height: "32px",
                                background: "rgba(245,158,11,0.12)",
                                color: "#b45309",
                                border: "1px solid rgba(245,158,11,0.25)",
                                borderRadius: "7px",
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <IconEdit size={13} color="#b45309" />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => deleteClient(client.id)}
                              title={t("common.delete")}
                              style={{
                                width: "32px",
                                height: "32px",
                                background: "rgba(204,51,51,0.1)",
                                color: "#c33",
                                border: "1px solid rgba(204,51,51,0.2)",
                                borderRadius: "7px",
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <IconTrash size={13} color="#c33" />
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

          {/* -- GRID VIEW -- */}
          {viewMode === "grid" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(1, minmax(0, 1fr))"
                : "repeat(auto-fill, minmax(320px, 1fr))",
              gap: gridGap,
              animation: "fadeInUp 0.5s ease 0.5s",
              opacity: animateCards ? 1 : 0,
            }}>
              {filteredClients.map((client, idx) => (
                <div
                  key={client.id}
                  style={{
                    background: theme.surface,
                    borderRadius: cardRadius,
                    padding: "14px",
                    border: `1px solid ${client.status === "active" ? theme.accent : theme.border}`,
                    transition: "transform 0.3s, box-shadow 0.3s",
                    animation: `fadeInUp 0.3s ease ${idx * 0.04}s`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: theme.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      color: "white",
                      fontWeight: "600",
                      flexShrink: 0,
                    }}>
                      {client.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: theme.text, fontWeight: "600", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {client.name}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {client.email}
                      </div>
                    </div>
                    <StatusBadge client={client} onClick={() => toggleStatus(client.id, client.status)} />
                  </div>

                  {/* Info rows */}
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "10px", marginBottom: "12px" }}>
                    {[
                      { label: t("common.phone"), value: (client.phone as string) || "-", accent: false },
                      { label: t("clients.totalSpent"), value: formatCurrency(client.totalSpent), accent: true },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i === 0 ? "6px" : 0 }}>
                        <span style={{ color: theme.textSecondary, fontSize: "11px" }}>{row.label}</span>
                        <span style={{
                          color: row.accent ? theme.accent : theme.textSecondary,
                          fontSize: row.accent ? "13px" : "12px",
                          fontWeight: row.accent ? "600" : "400",
                        }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => openEditModal(client)}
                      style={{
                        flex: 1,
                        height: "38px",
                        background: "rgba(245,158,11,0.12)",
                        color: "#b45309",
                        border: "1px solid rgba(245,158,11,0.25)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                        fontSize: "13px",
                        fontWeight: "500",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <IconEdit size={13} color="#b45309" />
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      style={{
                        flex: 1,
                        height: "38px",
                        background: "rgba(204,51,51,0.1)",
                        color: "#c33",
                        border: "1px solid rgba(204,51,51,0.2)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                        fontSize: "13px",
                        fontWeight: "500",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <IconTrash size={13} color="#c33" />
                      {t("common.delete")}
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

      {/* -- MODAL é Add / Edit -- */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.2s ease",
          padding: "16px",
        }}>
          <div style={{
            background: theme.surface,
            padding: modalPadding,
            borderRadius: "20px",
            width: modalWidth,
            maxWidth: "95%",
            maxHeight: "90vh",
            overflowY: "auto",
            border: `1px solid ${theme.border}`,
          }}>
            <h2 style={{
              color: theme.text,
              marginBottom: "20px",
              fontSize: isMobile ? "17px" : "22px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              {modal.editMode
                ? <><IconEdit size={isMobile ? 16 : 20} color={theme.primary} /> {t("clients.editClient")}</>
                : <><IconPlus size={isMobile ? 16 : 20} color={theme.primary} /> {t("clients.addClient")}</>}
            </h2>

            {[
              { label: t("common.name") + " *", key: "name", type: "text", placeholder: t("clients.clientName"), autoFocus: true },
              { label: t("common.email") + " *", key: "email", type: "email", placeholder: "Email" },
              { label: t("common.phone"), key: "phone", type: "tel", placeholder: t("common.phone") },
              { label: t("common.address"), key: "address", type: "text", placeholder: t("common.address") },
              { label: t("clients.totalSpent"), key: "totalSpent", type: "number", placeholder: t("clients.totalSpent"), step: "0.01" },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: "14px" }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={modal.form[field.key] || (field.type === "number" ? 0 : "")}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, [field.key]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value } })}
                  autoFocus={field.autoFocus}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 12px",
                    background: theme.surfaceHover,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    fontSize: isMobile ? "13px" : "14px",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
                />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                {t("common.status")}
              </label>
              <select
                value={modal.form.status || "active"}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, status: e.target.value } })}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  background: theme.surfaceHover,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  color: theme.text,
                  cursor: "pointer",
                  fontSize: isMobile ? "13px" : "14px",
                }}
              >
                <option value="active">{t("clients.active")}</option>
                <option value="inactive">{t("clients.inactive")}</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={modal.editMode ? updateClient : createClient}
                style={{
                  flex: 1,
                  height: "44px",
                  background: theme.gradient,
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "opacity 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <IconSave size={14} color="white" />
                {modal.editMode ? t("common.edit") : t("common.add")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })}
                style={{
                  flex: 1,
                  height: "44px",
                  background: theme.surfaceHover,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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