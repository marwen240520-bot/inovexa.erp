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

// --- SVG Icon Components -------------------------------------------------------

const IconBuilding2 = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
    <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
  </svg>
);

const IconBuildingCheck = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M12 22V11H4v11"/>
    <path d="M4 11V7l8-5 8 5v4"/>
    <path d="M2 22h20"/>
    <path d="M16 16.5 18 18.5 22 14.5"/>
  </svg>
);

const IconBuildingX = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M12 22V11H4v11"/>
    <path d="M4 11V7l8-5 8 5v4"/>
    <path d="M2 22h14"/>
    <path d="m17 17 5 5"/><path d="m22 17-5 5"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);

const IconTruck = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 5v3h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconSearch = ({ size = 15, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconList = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconEdit = ({ size = 13, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconPlus = ({ size = 15, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSave = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

const IconDotFilled = ({ size = 8, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" style={style}>
    <circle cx="4" cy="4" r="4" fill={color}/>
  </svg>
);

const IconMail = ({ size = 11, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconPhone = ({ size = 11, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.59a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
  </svg>
);

// --- Types ---------------------------------------------------------------------

type Supplier = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalPurchases?: number;
  status?: string;
  [key: string]: unknown;
};

type ModalForm = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  totalPurchases?: number;
  status?: string;
  [key: string]: string | number | undefined;
};

type ModalState = {
  open: boolean;
  form: ModalForm;
  editMode: boolean;
  editId: string | null;
};

// --- SelectAllCheckbox ---------------------------------------------------------

function SelectAllCheckbox({
  items, selectedIds, onSelect, onSelectAll, getItemId
}: {
  items: Supplier[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onSelectAll: (ids: string[]) => void;
  getItemId: (item: Supplier) => string;
}) {
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
        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: theme.primary }}
      />
      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>
        {t("common.selectAll")}
      </span>
    </label>
  );
}

// --- Main Component ------------------------------------------------------------

export default function SuppliersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();

  // FIX: Margin left for desktop sidebar (280px)
  const contentMarginLeft = isMobile ? "0" : "0px";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalPurchases: 0 });

  // -- Responsive sizing --
  const headerTitleSize = isMobile ? "20px" : "28px";
  const cardPadding = isMobile ? "14px" : "20px";
  const cardRadius = isMobile ? "16px" : "16px";
  const gridGap = isMobile ? "10px" : "20px";
  const sectionMargin = isMobile ? "16px" : "32px";
  const tableFontSize = isMobile ? "12px" : "13px";
  const statusFontSize = isMobile ? "11px" : "12px";
  const buttonPadding = isMobile ? "10px 14px" : "10px 20px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";
  const gridMinWidth = isMobile ? "calc(50% - 5px)" : "320px";

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-15px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchSuppliers();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  // -- Data fetching ----------------------------------------------------------

  const fetchSuppliers = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setSuppliers(data);
      const totalPurchases = data.reduce((s: number, sup: Supplier) => s + (Number(sup.totalPurchases) || 0), 0);
      setStats({
        total: data.length,
        active: data.filter((s: Supplier) => s.status === "active").length,
        inactive: data.filter((s: Supplier) => s.status === "inactive").length,
        totalPurchases
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // -- CRUD -------------------------------------------------------------------

  const createSupplier = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name,
          email: modal.form.email,
          phone: modal.form.phone || "",
          address: modal.form.address || "",
          totalPurchases: Number(modal.form.totalPurchases) || 0,
          status: modal.form.status || "active"
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchSuppliers();
        showMessage(t("suppliers.supplierCreated") || "Fournisseur créé", "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch (e) { showMessage(t("common.error"), "error"); }
  };

  const updateSupplier = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name,
          email: modal.form.email,
          phone: modal.form.phone || "",
          address: modal.form.address || "",
          totalPurchases: Number(modal.form.totalPurchases) || 0,
          status: modal.form.status || "active"
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchSuppliers();
        showMessage(t("suppliers.supplierUpdated") || "Fournisseur mis é jour", "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch (e) { showMessage(t("common.error"), "error"); }
  };

  const deleteSupplier = async (id: string) => {
    if (confirm(t("suppliers.confirmDelete") || "Supprimer ce fournisseur ?")) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSuppliers();
      showMessage(t("suppliers.supplierDeleted") || "Fournisseur supprimé", "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`${t("suppliers.confirmBulkDelete") || "Supprimer"} ${selectedIds.length} fournisseur(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchSuppliers();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} fournisseur(s) supprimé(s)`, "success");
    }
  };

  const toggleStatus = async (id: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchSuppliers();
        showMessage(newStatus === "active"
          ? (t("suppliers.activated") || "Activé")
          : (t("suppliers.deactivated") || "Désactivé"), "success");
      } else {
        const supplier = suppliers.find(s => s.id === id);
        if (supplier) {
          const putRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...supplier, status: newStatus })
          });
          if (putRes.ok) {
            await fetchSuppliers();
            showMessage(newStatus === "active"
              ? (t("suppliers.activated") || "Activé")
              : (t("suppliers.deactivated") || "Désactivé"), "success");
          } else { showMessage(t("common.error"), "error"); }
        } else { showMessage(t("common.error"), "error"); }
      }
    } catch (e) { showMessage(t("common.error"), "error"); }
    finally { setUpdatingStatus(null); }
  };

  const importSuppliers = async (data: Supplier[]) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ suppliers: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(
          `${result.success} fournisseur(s) importé(s)${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`,
          "success"
        );
        fetchSuppliers();
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

  const openEditModal = (supplier: Supplier) => {
    setModal({
      open: true, editMode: true, editId: supplier.id,
      form: {
        name: supplier.name || "",
        email: supplier.email || "",
        phone: (supplier.phone as string) || "",
        address: (supplier.address as string) || "",
        totalPurchases: supplier.totalPurchases || 0,
        status: (supplier.status as string) || "active"
      }
    });
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone as string | undefined)?.includes(searchTerm)
  );

  // -- Stats cards ------------------------------------------------------------

  const statsCards = [
    {
      icon: <IconBuilding2 size={isMobile ? 26 : 30} color={theme.primary} />,
      label: t("suppliers.totalSuppliers") || "Total fournisseurs",
      value: stats.total,
      color: theme.primary
    },
    {
      icon: <IconBuildingCheck size={isMobile ? 26 : 30} color={theme.accent} />,
      label: t("suppliers.activeSuppliers") || "Actifs",
      value: stats.active,
      color: theme.accent
    },
    {
      icon: <IconBuildingX size={isMobile ? 26 : 30} color={stats.inactive > 0 ? "#f59e0b" : theme.textSecondary} />,
      label: t("suppliers.inactiveSuppliers") || "Inactifs",
      value: stats.inactive,
      color: stats.inactive > 0 ? "#f59e0b" : theme.textSecondary
    },
    {
      icon: <IconCurrencyDollar size={isMobile ? 26 : 30} color={theme.accent} />,
      label: t("suppliers.totalPurchases") || "Total achats",
      value: formatCurrency(stats.totalPurchases),
      color: theme.accent
    }
  ];

  // FIX: Loading state with sidebar
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: theme.background }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <IconLoader size={isMobile ? 40 : 48} color={theme.primary} style={{ margin: "0 auto 16px", display: "block" }} />
          <p style={{ fontSize: isMobile ? "12px" : "14px", color: theme.textSecondary }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // -- Status badge -----------------------------------------------------------

  const StatusBadge = ({ supplier, onClick }: { supplier: Supplier; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={updatingStatus === supplier.id}
      style={{
        background: supplier.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        color: supplier.status === "active" ? theme.accent : "#ef4444",
        border: `1px solid ${supplier.status === "active" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
        borderRadius: "20px",
        padding: isMobile ? "5px 10px" : "4px 10px",
        cursor: updatingStatus === supplier.id ? "wait" : "pointer",
        transition: "opacity 0.2s",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        opacity: updatingStatus === supplier.id ? 0.6 : 1,
        fontSize: statusFontSize,
        fontWeight: "500",
        minHeight: isMobile ? "28px" : "auto",
        whiteSpace: "nowrap"
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.75"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      <IconDotFilled size={7} color={supplier.status === "active" ? theme.accent : "#ef4444"} />
      {supplier.status === "active"
        ? (t("suppliers.active") || "Actif")
        : (t("suppliers.inactive") || "Inactif")}
    </button>
  );

  // -- Render -----------------------------------------------------------------

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      width: "100%", 
      background: theme.background,
      padding: 0,
      margin: 0
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: contentMarginLeft,
        padding: isMobile ? "12px" : "16px",
        paddingBottom: isMobile ? "70px" : "24px",
        overflowX: "hidden",
        background: theme.background,
        minHeight: "100vh"
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconTruck size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.suppliers") || "Fournisseurs"}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>
                  {t("suppliers.subtitle") || "Gestion des fournisseurs et partenaires"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {/* View toggle */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {[
                    { mode: "list", Icon: IconList, label: t("suppliers.listView") || "Liste" },
                    { mode: "grid", Icon: IconGrid, label: t("suppliers.gridView") || "Grille" }
                  ].map(({ mode, Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: isMobile ? "8px 10px" : "6px 10px",
                        background: viewMode === mode ? theme.primary : theme.surfaceHover,
                        border: `1px solid ${theme.border}`,
                        borderRadius: "8px",
                        color: viewMode === mode ? "white" : theme.textSecondary,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: isMobile ? "11px" : "13px",
                        minHeight: isMobile ? "36px" : "auto"
                      }}
                    >
                      <Icon size={13} color={viewMode === mode ? "white" : theme.textSecondary} />
                      {!isMobile && label}
                    </button>
                  ))}
                </div>

                <ImportButton onImport={importSuppliers} label={t("common.import") || "Importer"} />
                <ExportButtons data={filteredSuppliers} filename="fournisseurs" />

                <button
                  onClick={() => setModal({
                    open: true, editMode: false, editId: null,
                    form: { name: "", email: "", phone: "", address: "", totalPurchases: 0, status: "active" }
                  })}
                  style={{
                    background: theme.gradient, color: "white", padding: buttonPadding,
                    border: "none", borderRadius: "10px", cursor: "pointer",
                    transition: "transform 0.2s", fontSize: isMobile ? "13px" : "14px",
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    fontWeight: "600", whiteSpace: "nowrap", minHeight: "40px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <IconPlus size={14} color="white" />
                  {t("common.add") || "Ajouter"}
                </button>
              </div>
            </div>
          </div>

          {/* -- Message -- */}
          {message && (
            <div style={{
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`,
              color: messageType === "success" ? theme.accent : "#f87171",
              padding: "12px", borderRadius: "12px", marginBottom: "20px",
              textAlign: "center", animation: "fadeInUp 0.3s ease",
              fontSize: isMobile ? "12px" : "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
              {messageType === "success"
                ? <IconCheckCircle size={16} color={theme.accent} />
                : <IconXCircle size={16} color="#f87171" />}
              {message}
            </div>
          )}

          {/* -- Stats Cards -- */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : `repeat(auto-fit, minmax(200px, 1fr))`,
            gap: gridGap, marginBottom: sectionMargin
          }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: theme.surface, borderRadius: cardRadius, padding: cardPadding,
                  textAlign: "center", border: `1px solid ${theme.border}`,
                  animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`,
                  opacity: animateCards ? 1 : 0,
                  transition: "transform 0.3s", cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "24px" : "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "11px" : "12px", color: theme.textSecondary, marginTop: "2px", lineHeight: "1.3" }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* -- Filters -- */}
          <div style={{ marginBottom: "20px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 2, position: "relative", width: isMobile ? "100%" : "auto" }}>
                <IconSearch size={15} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder={`${t("common.search") || "Rechercher"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px 10px 36px",
                    background: theme.surface, border: `1px solid ${theme.border}`,
                    borderRadius: "10px", color: theme.text,
                    transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
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
                  style={{
                    background: "#c33", color: "white", border: "none", borderRadius: "10px",
                    padding: isMobile ? "10px 14px" : "8px 16px", cursor: "pointer", transition: "opacity 0.2s",
                    fontSize: isMobile ? "13px" : "14px",
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    fontWeight: "500", minHeight: "40px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <IconTrash size={13} color="white" />
                  {t("common.delete") || "Supprimer"} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* -- List View -- */}
          {viewMode === "list" && (
            <div style={{
              background: theme.surface, borderRadius: cardRadius, padding: "16px",
              border: `1px solid ${theme.border}`, overflowX: "auto",
              animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0
            }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "650px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "10px", width: "36px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                          onChange={() => {
                            if (selectedIds.length === filteredSuppliers.length) setSelectedIds([]);
                            else setSelectedIds(filteredSuppliers.map(s => s.id));
                          }}
                          style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: theme.primary }}
                        />
                      </th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.email")}</th>
                      {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.phone")}</th>}
                      {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.address")}</th>}
                      <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("suppliers.totalPurchases") || "Total achats"}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier, idx) => (
                      <tr
                        key={supplier.id}
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
                            checked={selectedIds.includes(supplier.id)}
                            onChange={() => {
                              if (selectedIds.includes(supplier.id))
                                setSelectedIds(selectedIds.filter(id => id !== supplier.id));
                              else
                                setSelectedIds([...selectedIds, supplier.id]);
                            }}
                            style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: theme.primary }}
                          />
                        </td>
                        <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>
                          {(supplier.name?.length ?? 0) > (isMobile ? 15 : 20)
                            ? supplier.name.substring(0, isMobile ? 12 : 17) + "..."
                            : supplier.name}
                        </td>
                        <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                          {(supplier.email?.length ?? 0) > (isMobile ? 20 : 30)
                            ? supplier.email.substring(0, isMobile ? 17 : 27) + "..."
                            : supplier.email}
                        </td>
                        {!isMobile && (
                          <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                            {(supplier.phone as string) || "-"}
                           </td>
                        )}
                        {!isMobile && (
                          <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                            {(supplier.address?.length ?? 0) > 30
                              ? (supplier.address as string).substring(0, 27) + "..."
                              : (supplier.address as string) || "-"}
                           </td>
                        )}
                        <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>
                          {formatCurrency(supplier.totalPurchases)}
                         </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <StatusBadge supplier={supplier} onClick={() => toggleStatus(supplier.id, supplier.status)} />
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => openEditModal(supplier)}
                              title={t("common.edit")}
                              style={{
                                background: "#f59e0b", color: "white", border: "none",
                                borderRadius: "8px", padding: isMobile ? "8px 10px" : "5px 8px", cursor: "pointer",
                                transition: "opacity 0.2s", display: "inline-flex", alignItems: "center",
                                minHeight: isMobile ? "34px" : "auto", minWidth: isMobile ? "34px" : "auto"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              <IconEdit size={13} color="white" />
                            </button>
                            <button
                              onClick={() => deleteSupplier(supplier.id)}
                              title={t("common.delete")}
                              style={{
                                background: "#c33", color: "white", border: "none",
                                borderRadius: "8px", padding: isMobile ? "8px 10px" : "5px 8px", cursor: "pointer",
                                transition: "opacity 0.2s", display: "inline-flex", alignItems: "center",
                                minHeight: isMobile ? "34px" : "auto", minWidth: isMobile ? "34px" : "auto"
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

              {filteredSuppliers.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <IconBuilding2 size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                    {searchTerm
                      ? t("common.noResults")
                      : t("suppliers.noSuppliers") || "Aucun fournisseur. Cliquez sur '+ Ajouter' pour en créer un."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* -- Grid View -- */}
          {viewMode === "grid" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`,
              gap: gridGap,
              animation: "fadeInUp 0.5s ease 0.5s",
              opacity: animateCards ? 1 : 0
            }}>
              {filteredSuppliers.map((supplier, idx) => (
                <div
                  key={supplier.id}
                  style={{
                    background: theme.surface,
                    borderRadius: cardRadius,
                    padding: isMobile ? "12px" : "16px",
                    border: `1px solid ${supplier.status === "active" ? theme.accent : theme.border}`,
                    transition: "transform 0.3s, box-shadow 0.3s",
                    animation: `fadeInUp 0.3s ease ${idx * 0.05}s`,
                    display: "flex", flexDirection: "column"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Card header é avatar + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{
                      width: isMobile ? "38px" : "52px",
                      height: isMobile ? "38px" : "52px",
                      borderRadius: "10px",
                      background: theme.gradient,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <IconBuilding2 size={isMobile ? 18 : 24} color="white" />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        color: theme.text, fontWeight: "bold",
                        fontSize: isMobile ? "13px" : "15px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {supplier.name}
                      </div>
                      <div style={{
                        color: theme.textSecondary, fontSize: isMobile ? "10px" : "11px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        display: "flex", alignItems: "center", gap: "4px", marginTop: "2px"
                      }}>
                        <IconMail size={10} color={theme.textSecondary} />
                        {supplier.email}
                      </div>
                    </div>
                  </div>

                  {/* Info rows */}
                  {[
                    {
                      label: t("common.phone"),
                      value: (supplier.phone as string) || "-",
                      icon: <IconPhone size={11} color={theme.textSecondary} />
                    },
                    {
                      label: t("common.address"),
                      value: (supplier.address as string) || "-"
                    },
                    {
                      label: t("suppliers.totalPurchases") || "Total achats",
                      value: formatCurrency(supplier.totalPurchases),
                      bold: true,
                      color: theme.accent
                    }
                  ].map((row, i) => (
                    <div key={i} style={{ marginBottom: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                        {row.icon}
                        {row.label}
                      </span>
                      <span style={{
                        color: row.color || theme.textSecondary,
                        fontSize: isMobile ? (row.bold ? "12px" : "10px") : (row.bold ? "13px" : "11px"),
                        fontWeight: row.bold ? "bold" : "normal",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        textAlign: "right"
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}

                  {/* Status */}
                  <div style={{ marginBottom: "10px", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: theme.textSecondary, fontSize: isMobile ? "10px" : "11px" }}>{t("common.status")}</span>
                    <StatusBadge supplier={supplier} onClick={() => toggleStatus(supplier.id, supplier.status)} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                    <button
                      onClick={() => openEditModal(supplier)}
                      style={{
                        flex: 1, padding: isMobile ? "9px 6px" : "7px", background: "#f59e0b", color: "white", border: "none",
                        borderRadius: "8px", cursor: "pointer", transition: "opacity 0.2s",
                        fontSize: isMobile ? "12px" : "12px",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
                        fontWeight: "500", minHeight: "36px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                      <IconEdit size={13} color="white" />
                      {t("common.edit") || "Modifier"}
                    </button>
                    <button
                      onClick={() => deleteSupplier(supplier.id)}
                      style={{
                        flex: 1, padding: isMobile ? "9px 6px" : "7px", background: "#c33", color: "white", border: "none",
                        borderRadius: "8px", cursor: "pointer", transition: "opacity 0.2s",
                        fontSize: isMobile ? "12px" : "12px",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
                        fontWeight: "500", minHeight: "36px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                      <IconTrash size={13} color="white" />
                      {t("common.delete") || "Supprimer"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredSuppliers.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", gridColumn: "1 / -1" }}>
                  <IconBuilding2 size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                    {searchTerm ? t("common.noResults") : t("suppliers.noSuppliers") || "Aucun fournisseur"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* -- Modal Add / Edit -- */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px"
        }}>
          <div style={{
            background: theme.surface, padding: modalPadding, borderRadius: "24px",
            width: modalWidth, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto",
            border: `1px solid ${theme.border}`
          }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              {modal.editMode
                ? <><IconEdit size={isMobile ? 16 : 20} color={theme.primary} /> {t("suppliers.editSupplier") || "Modifier fournisseur"}</>
                : <><IconPlus size={isMobile ? 16 : 20} color={theme.primary} /> {t("suppliers.addSupplier") || "Ajouter fournisseur"}</>}
            </h2>

            {([
              { label: (t("common.name") || "Nom") + " *", key: "name", type: "text", placeholder: t("suppliers.supplierName") || "Nom du fournisseur", autoFocus: true },
              { label: (t("common.email") || "Email") + " *", key: "email", type: "email", placeholder: "Email" },
              { label: t("common.phone") || "Téléphone", key: "phone", type: "tel", placeholder: t("common.phone") || "Téléphone" },
              { label: t("common.address") || "Adresse", key: "address", type: "text", placeholder: t("common.address") || "Adresse" },
              { label: (t("suppliers.totalPurchases") || "Total achats"), key: "totalPurchases", type: "number", placeholder: "0", step: "0.01" }
            ] as { label: string; key: string; type: string; placeholder: string; step?: string; autoFocus?: boolean }[]).map((field) => (
              <div key={field.key} style={{ marginBottom: "14px" }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={modal.form[field.key] || (field.type === "number" ? 0 : "")}
                  onChange={(e) => setModal({
                    ...modal,
                    form: {
                      ...modal.form,
                      [field.key]: field.type === "number"
                        ? parseFloat(e.target.value) || 0
                        : e.target.value
                    }
                  })}
                  autoFocus={field.autoFocus}
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                    borderRadius: "10px", color: theme.text,
                    fontSize: isMobile ? "13px" : "14px",
                    boxSizing: "border-box", transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>
                {t("common.status") || "Statut"}
              </label>
              <select
                value={modal.form.status || "active"}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, status: e.target.value } })}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: "10px", color: theme.text,
                  cursor: "pointer", fontSize: isMobile ? "13px" : "14px"
                }}
              >
                <option value="active">{t("suppliers.active") || "Actif"}</option>
                <option value="inactive">{t("suppliers.inactive") || "Inactif"}</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={modal.editMode ? updateSupplier : createSupplier}
                style={{
                  flex: 1, padding: "10px", background: theme.gradient, color: "white",
                  border: "none", borderRadius: "10px", cursor: "pointer",
                  fontWeight: "500", transition: "opacity 0.2s",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={14} color="white" />
                {modal.editMode ? (t("common.edit") || "Modifier") : (t("common.add") || "Ajouter")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })}
                style={{
                  flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text,
                  border: `1px solid ${theme.border}`, borderRadius: "10px",
                  cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {t("common.cancel") || "Annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}