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

// --- Interfaces ----------------------------------------------------------------

interface Purchase {
  id: number;
  supplierId?: number;
  supplierName: string;
  productId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  createdAt: string;
}

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  price: number;
  quantity?: number;
}

interface PurchaseForm {
  supplierId?: number;
  supplierName?: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  status?: string;
}

interface ModalState {
  open: boolean;
  form: PurchaseForm;
}

interface StatsState {
  total: number;
  amount: number;
  average: number;
  pending: number;
  delivered: number;
}

// --- SVG Icon Components -------------------------------------------------------

const IconShoppingCart = ({ size = 22, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconTruck = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconClock = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCheckCircle = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const IconDollarSign = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconTrendingUp = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconBarChart = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconPlus = ({ size = 15, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconSearch = ({ size = 15, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconFilter = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconBuilding = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const IconSave = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconX = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPackage = ({ size = 40, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconChevronDown = ({ size = 10, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// --- Status helpers -------------------------------------------------------------

function getStatusColor(status: string) {
  if (status === "delivered") return "#10b981";
  if (status === "pending") return "#f59e0b";
  if (status === "cancelled") return "#ef4444";
  return "#94a3b8";
}

interface StatusSelectProps {
  purchaseId: number;
  status: string;
  onUpdate: (id: number, status: string) => void;
  updatingStatus: number | null;
  isMobile: boolean;
  t: (key: string) => string;
  theme: Record<string, string>;
}

function StatusSelect({ purchaseId, status, onUpdate, updatingStatus, isMobile, t, theme }: StatusSelectProps) {
  const color = getStatusColor(status);
  const Icon = status === "delivered" ? IconCheckCircle : status === "cancelled" ? IconXCircle : IconClock;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: `${color}18`, border: `1px solid ${color}55`,
      borderRadius: "8px", padding: "0 4px 0 8px",
      opacity: updatingStatus === purchaseId ? 0.6 : 1,
      transition: "opacity 0.2s"
    }}>
      <Icon size={12} color={color} style={{ flexShrink: 0 }} />
      <select
        value={status}
        onChange={(e) => onUpdate(purchaseId, e.target.value)}
        disabled={updatingStatus === purchaseId}
        style={{
          background: "transparent", color, border: "none",
          padding: isMobile ? "4px 2px" : "5px 2px",
          cursor: updatingStatus === purchaseId ? "wait" : "pointer",
          fontWeight: "500", fontSize: isMobile ? "10px" : "12px",
          appearance: "none", outline: "none"
        }}
      >
        <option value="pending">{t("purchases.pending")}</option>
        <option value="delivered">{t("purchases.delivered")}</option>
        <option value="cancelled">{t("purchases.cancelled")}</option>
      </select>
      <IconChevronDown size={10} color={color} style={{ flexShrink: 0, pointerEvents: "none" }} />
    </div>
  );
}

// --- Main Component -------------------------------------------------------------

export default function PurchasesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();

  // FIX: Margin left for desktop sidebar (280px)
  const contentMarginLeft = isMobile ? "0" : "0px";

  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [modal, setModal] = useState<ModalState>({ open: false, form: {} });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<StatsState>({ total: 0, amount: 0, average: 0, pending: 0, delivered: 0 });

  const cardRadius = isMobile ? "16px" : "18px";
  const gridGap = isMobile ? "10px" : "16px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const modalWidth = isMobile ? "95%" : "520px";
  const modalPadding = isMobile ? "20px" : "32px";

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
      from { opacity: 0; transform: translateX(-20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes cardPop {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
    setTimeout(() => setAnimateCards(true), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSupplier, searchTerm, allPurchases]);

  // -- Data fetching ----------------------------------------------------------

  const fetchPurchases = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data: Purchase[] = await res.json();
      data = Array.isArray(data) ? data : [];
      setAllPurchases(data);
      const totalAmount = data.reduce((sum, p) => sum + (p.total || 0), 0);
      setStats({
        total: data.length,
        amount: totalAmount,
        average: data.length > 0 ? totalAmount / data.length : 0,
        pending: data.filter(p => p.status === "pending").length,
        delivered: data.filter(p => p.status === "delivered").length
      });
    } catch (e) { console.error(e); }
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: Supplier[] = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: Product[] = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // -- CRUD -------------------------------------------------------------------

  const createPurchase = async () => {
    // Validation côté client : évite les POST vides rejetés en 400 par le backend
    // ("Le produit est requis" quand aucun produit n'est sélectionné).
    const f: any = modal.form || {};
    const productName = String(f.productName ?? "").trim();
    const quantity = Number(f.quantity);
    if (!productName || !(quantity > 0)) {
      showMessage(t("logistics.fillRequiredFields") || "Veuillez remplir les champs obligatoires", "error");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...f, productName, supplierName: String(f.supplierName ?? "").trim() })
      });
      if (res.ok) {
        // Le stock est déjà mis à jour par le backend (purchases.service.create).
        // Ne PAS refaire de PATCH /products ici, sinon le stock est incrémenté 2 fois.
        setModal({ open: false, form: {} });
        await fetchPurchases();
        await fetchProducts();
        showMessage(t("purchases.purchaseCreated") || "Achat créé avec succès", "success");
      } else {
        const error = await res.json().catch(() => ({} as any));
        const msg = Array.isArray(error?.message) ? error.message[0] : error?.message;
        showMessage(msg || t("common.error") || "Erreur lors de la création", "error");
      }
    } catch (e) {
      showMessage(t("common.error") || "Erreur de connexion", "error");
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchPurchases();
        showMessage(t("purchases.statusUpdated") || "Statut mis é jour", "success");
      } else {
        const purchase = allPurchases.find(p => p.id === id);
        if (purchase) {
          const putRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...purchase, status: newStatus })
          });
          if (putRes.ok) {
            await fetchPurchases();
            showMessage(t("purchases.statusUpdated") || "Statut mis é jour", "success");
          } else {
            showMessage(t("common.error") || "Erreur", "error");
          }
        } else {
          showMessage(t("common.error") || "Erreur", "error");
        }
      }
    } catch (e) {
      showMessage(t("common.error") || "Erreur", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deletePurchase = async (id: number) => {
    if (confirm(t("purchases.confirmDelete") || "Supprimer cet achat ?")) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      // Le stock est rétabli par le backend (purchases.service.delete).
      // Pas de PATCH /products ici, sinon la quantité est déduite 2 fois.
      await fetchPurchases();
      await fetchProducts();
      showMessage(t("purchases.purchaseDeleted") || "Achat supprimé", "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`${t("purchases.confirmBulkDelete") || "Supprimer"} ${selectedIds.length} achat(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        // Stock rétabli par le backend ; pas de PATCH /products (sinon double déduction).
      }
      await fetchPurchases();
      await fetchProducts();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} achat(s) supprimé(s)`, "success");
    }
  };

  // -- Import -----------------------------------------------------------------

  const importPurchases = async (data: Partial<Purchase>[]) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ purchases: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(
          `${result.success} achat(s) importé(s)${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`,
          "success"
        );
        fetchPurchases();
      } else {
        showMessage(result.message || "Erreur lors de l'import", "error");
      }
    } catch (error) {
      showMessage("Erreur de connexion lors de l'import", "error");
    } finally {
      setImporting(false);
    }
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  // -- Handlers pour le formulaire (sélection dynamique) ----------------------

  const handleSupplierChange = (supplierId: number) => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    if (selectedSupplier) {
      setModal({
        ...modal,
        form: {
          ...modal.form,
          supplierId: selectedSupplier.id,
          supplierName: selectedSupplier.name
        }
      });
    }
  };

  const handleProductChange = (productId: number) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setModal({
        ...modal,
        form: {
          ...modal.form,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          unitPrice: selectedProduct.price,
          total: (modal.form.quantity ?? 1) * selectedProduct.price
        }
      });
    }
  };

  // -- Stats cards config -----------------------------------------------------

  const statsCards = [
    {
      icon: <IconBarChart size={isMobile ? 20 : 24} color={theme.primary} />,
      label: t("purchases.totalPurchases") || "Total achats",
      value: stats.total,
      color: theme.primary,
      bg: `${theme.primary}15`,
      border: `${theme.primary}30`,
    },
    {
      icon: <IconDollarSign size={isMobile ? 20 : 24} color={theme.accent} />,
      label: t("purchases.totalSpent") || "Total dépensé",
      value: formatCurrency(stats.amount),
      color: theme.accent,
      bg: `${theme.accent}15`,
      border: `${theme.accent}30`,
    },
    {
      icon: <IconTrendingUp size={isMobile ? 20 : 24} color="#f59e0b" />,
      label: t("purchases.averagePurchase") || "Moyenne",
      value: formatCurrency(Math.round(stats.average)),
      color: "#f59e0b",
      bg: "#f59e0b15",
      border: "#f59e0b30",
    },
    {
      icon: <IconCheckCircle size={isMobile ? 20 : 24} color="#10b981" />,
      label: t("purchases.delivered") || "Livrés",
      value: stats.delivered,
      color: "#10b981",
      bg: "#10b98115",
      border: "#10b98130",
    },
    {
      icon: <IconClock size={isMobile ? 20 : 24} color="#f59e0b" />,
      label: t("purchases.pending") || "En attente",
      value: stats.pending,
      color: "#f59e0b",
      bg: "#f59e0b15",
      border: "#f59e0b30",
    }
  ];

  // -- Loading screen with sidebar ----------------------------------------------

  if (loading) {
    return <Spinner fullScreen />;
  }

  // -- Render -----------------------------------------------------------------

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.background, 
      display: "flex",
      padding: 0,
      margin: 0
    }}>
      <div style={{
        flex: 1,
        marginLeft: contentMarginLeft,
        padding: isMobile ? "14px 12px" : "24px",
        paddingBottom: isMobile ? "80px" : "24px",
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
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "14px" : "16px",
            }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: isMobile ? "20px" : "28px", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                  <IconShoppingCart size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.purchases") || "Achats"}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>
                  {t("purchases.subtitle") || "Gestion des achats et fournisseurs"}
                </p>
              </div>

              {/* -- Action buttons -- */}
              <div style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                width: isMobile ? "100%" : "auto",
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}>
                <div style={{ display: "flex", gap: "8px", flex: isMobile ? "0 0 auto" : "unset" }}>
                  <ImportButton onImport={importPurchases} label={isMobile ? "" : (t("common.import") || "Importer")} />
                  <ExportButtons data={purchases} filename="achats" iconOnly={isMobile} />
                </div>

                <button
                  onClick={() => setModal({
                    open: true,
                    form: { supplierId: undefined, supplierName: "", productId: undefined, productName: "", quantity: 1, unitPrice: 0, total: 0, status: "pending" }
                  })}
                  style={{
                    background: theme.gradient,
                    color: "white",
                    padding: isMobile ? "11px 16px" : "11px 22px",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: isMobile ? "13px" : "14px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    flex: isMobile ? "1 1 auto" : "unset",
                    minHeight: "42px",
                    boxShadow: `0 2px 12px ${theme.primary}40`,
                    WebkitTapHighlightColor: "transparent",
                    transition: "opacity 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                  onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <IconPlus size={15} color="white" />
                  {t("purchases.newPurchase") || "Nouvel achat"}
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
              padding: "12px 16px", borderRadius: "12px", marginBottom: "20px",
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
            gridTemplateColumns: isMobile
              ? "repeat(3, 1fr)"
              : "repeat(5, 1fr)",
            gap: gridGap,
            marginBottom: sectionMargin,
          }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: theme.surface,
                  borderRadius: cardRadius,
                  padding: isMobile ? "12px 8px" : "18px 16px",
                  border: `1px solid ${card.border}`,
                  animation: `cardPop 0.45s ease ${0.05 + idx * 0.07}s both`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMobile ? "center" : "flex-start",
                  gap: isMobile ? "6px" : "10px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                  transition: "transform 0.25s, box-shadow 0.25s",
                  ...(isMobile && idx === 3 ? { gridColumn: "1 / span 2" } : {}),
                  ...(isMobile && idx === 4 ? { gridColumn: "3 / span 1" } : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${card.color}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: isMobile ? "-12px" : "-18px",
                  right: isMobile ? "-12px" : "-18px",
                  width: isMobile ? "48px" : "72px",
                  height: isMobile ? "48px" : "72px",
                  borderRadius: "50%",
                  background: card.bg,
                  pointerEvents: "none",
                }} />

                <div style={{
                  width: isMobile ? "34px" : "42px",
                  height: isMobile ? "34px" : "42px",
                  borderRadius: isMobile ? "10px" : "12px",
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>

                <div style={{ textAlign: isMobile ? "center" : "left" }}>
                  <div style={{
                    fontSize: isMobile ? "15px" : "22px",
                    color: card.color,
                    fontWeight: "700",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}>
                    {card.value}
                  </div>
                  <div style={{
                    fontSize: isMobile ? "9px" : "11px",
                    color: theme.textSecondary,
                    marginTop: "3px",
                    fontWeight: "500",
                    lineHeight: 1.2,
                  }}>
                    {card.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* -- Filters -- */}
          <div style={{ marginBottom: "20px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>

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

              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "160px" }}>
                <IconFilter size={13} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px 10px 30px",
                    background: theme.surface, border: `1px solid ${theme.border}`,
                    borderRadius: "10px", color: theme.text, cursor: "pointer",
                    fontSize: isMobile ? "13px" : "14px", appearance: "none"
                  }}
                >
                  <option value="all">{t("purchases.allStatus") || "Tous les statuts"}</option>
                  <option value="pending">{t("purchases.pending") || "En attente"}</option>
                  <option value="delivered">{t("purchases.delivered") || "Livrés"}</option>
                  <option value="cancelled">{t("purchases.cancelled") || "Annulés"}</option>
                </select>
              </div>

              {suppliers.length > 0 && (
                <div style={{ position: "relative", minWidth: isMobile ? "100%" : "180px" }}>
                  <IconBuilding size={13} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <select
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px 10px 30px",
                      background: theme.surface, border: `1px solid ${theme.border}`,
                      borderRadius: "10px", color: theme.text, cursor: "pointer",
                      fontSize: isMobile ? "13px" : "14px", appearance: "none"
                    }}
                  >
                    <option value="all">{t("purchases.allSuppliers") || "Tous les fournisseurs"}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === purchases.length && purchases.length > 0}
                  ref={(el) => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < purchases.length; }}
                  onChange={() => {
                    if (selectedIds.length === purchases.length) setSelectedIds([]);
                    else setSelectedIds(purchases.map(p => p.id));
                  }}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: theme.primary }}
                />
                <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>
                  {t("common.selectAll") || "Tout sélectionner"}
                </span>
              </label>

              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: isMobile ? "12px" : "13px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    WebkitTapHighlightColor: "transparent",
                    transition: "opacity 0.2s",
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

          {/* -- Table -- */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: isMobile ? "12px" : "16px",
            border: `1px solid ${theme.border}`,
            overflowX: "auto",
            animation: "fadeInUp 0.5s ease 0.5s",
            opacity: animateCards ? 1 : 0
          }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "700px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontSize: tableFontSize }}>
                    <th style={{ padding: "10px", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === purchases.length && purchases.length > 0}
                        onChange={() => {
                          if (selectedIds.length === purchases.length) setSelectedIds([]);
                          else setSelectedIds(purchases.map(p => p.id));
                        }}
                        style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: theme.primary }}
                      />
                    </th>
                    <th style={{ padding: "10px", textAlign: "left" }}>ID</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>{t("purchases.supplier") || "Fournisseur"}</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>{t("common.product") || "Produit"}</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>{t("common.quantity") || "Qté"}</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>{t("purchases.unitPrice") || "P.U."}</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>{t("common.total") || "Total"}</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>{t("common.status") || "Statut"}</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>{t("common.date") || "Date"}</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>{t("common.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase, idx) => (
                    <tr
                      key={purchase.id}
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
                          checked={selectedIds.includes(purchase.id)}
                          onChange={() => {
                            if (selectedIds.includes(purchase.id))
                              setSelectedIds(selectedIds.filter(id => id !== purchase.id));
                            else
                              setSelectedIds([...selectedIds, purchase.id]);
                          }}
                          style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: theme.primary }}
                        />
                      </td>
                      <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>#{purchase.id}</td>
                      <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>
                        {purchase.supplierName?.length > (isMobile ? 14 : 20)
                          ? purchase.supplierName.substring(0, isMobile ? 11 : 17) + "..."
                          : purchase.supplierName || "-"}
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {purchase.productName?.length > (isMobile ? 14 : 20)
                          ? purchase.productName.substring(0, isMobile ? 11 : 17) + "..."
                          : purchase.productName || "-"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{purchase.quantity || 0}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{formatCurrency(purchase.unitPrice || 0)}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>{formatCurrency(purchase.total || 0)}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <StatusSelect
                          purchaseId={purchase.id}
                          status={purchase.status}
                          onUpdate={updateStatus}
                          updatingStatus={updatingStatus}
                          isMobile={isMobile}
                          t={t}
                          theme={theme}
                        />
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>
                        {purchase.createdAt
                          ? new Date(purchase.createdAt).toLocaleDateString(
                              language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US"
                            )
                          : "-"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button
                          onClick={() => deletePurchase(purchase.id)}
                          title={t("common.delete") || "Supprimer"}
                          style={{
                            background: "#ef444420",
                            color: "#ef4444",
                            border: "1px solid #ef444440",
                            borderRadius: "8px",
                            width: isMobile ? "32px" : "30px",
                            height: isMobile ? "32px" : "30px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                            WebkitTapHighlightColor: "transparent",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "white"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#ef444420"; e.currentTarget.style.color = "#ef4444"; }}
                        >
                          <IconTrash size={isMobile ? 13 : 12} color="currentColor" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {purchases.length === 0 && (
              <div style={{ textAlign: "center", padding: isMobile ? "32px 16px" : "48px" }}>
                <IconPackage size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                  {searchTerm
                    ? t("common.noResults") || "Aucun résultat"
                    : t("purchases.noPurchases") || "Aucun achat trouvé."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -- Modal création achat avec sélection dynamique -- */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px"
        }}>
          <div style={{
            background: theme.surface,
            padding: modalPadding,
            borderRadius: "20px",
            width: modalWidth,
            maxWidth: "95%",
            maxHeight: "90vh",
            overflowY: "auto",
            border: `1px solid ${theme.border}`
          }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "17px" : "22px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconShoppingCart size={isMobile ? 18 : 22} color={theme.primary} />
              {t("purchases.newPurchase") || "Nouvel achat"}
            </h2>

            {/* Fournisseur - SELECT dynamique */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                {t("purchases.supplier") || "Fournisseur"} *
              </label>
              <select
                value={modal.form.supplierId ?? ""}
                onChange={(e) => handleSupplierChange(parseInt(e.target.value))}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: "10px", color: theme.text,
                  fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                  cursor: "pointer"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
              >
                <option value="">-- Sélectionner un fournisseur --</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.companyName ? `(${supplier.companyName})` : ""}
                  </option>
                ))}
              </select>
              {/* Afficher le nom du fournisseur sélectionné en lecture seule si nécessaire */}
              {modal.form.supplierName && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: theme.textSecondary, display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconBuilding size={11} color={theme.accent} />
                  Fournisseur: {modal.form.supplierName}
                </div>
              )}
              {/* Saisie libre : si le fournisseur n'existe pas, il sera créé automatiquement dans le module Fournisseurs */}
              <input
                type="text"
                placeholder="Ou saisir le nom d'un nouveau fournisseur (créé automatiquement)"
                value={!modal.form.supplierId ? (modal.form.supplierName || "") : ""}
                onChange={(e) => {
                  const name = e.target.value;
                  setModal(prev => ({
                    ...prev,
                    form: { ...prev.form, supplierId: undefined, supplierName: name }
                  }));
                }}
                style={{ width: "100%", marginTop: "8px", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "12px" : "13px", boxSizing: "border-box" }}
              />
            </div>

            {/* Produit - SELECT dynamique */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                {t("common.product") || "Produit"} *
              </label>
              <select
                value={modal.form.productId ?? ""}
                onChange={(e) => handleProductChange(parseInt(e.target.value))}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: "10px", color: theme.text,
                  fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                  cursor: "pointer"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
              >
                <option value="">-- Sélectionner un produit --</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ""} - {formatCurrency(product.price)}
                  </option>
                ))}
              </select>
              {modal.form.productName && modal.form.unitPrice !== undefined && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: theme.textSecondary, display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconPackage size={11} color={theme.accent} />
                  Produit: {modal.form.productName} - Prix unitaire: {formatCurrency(modal.form.unitPrice)}
                </div>
              )}
            </div>

            {/* Quantité */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                {t("common.quantity") || "Quantité"} *
              </label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={modal.form.quantity ?? 1}
                onChange={e => {
                  const qty = parseInt(e.target.value) || 1;
                  setModal({ ...modal, form: { ...modal.form, quantity: qty, total: (modal.form.unitPrice ?? 0) * qty } });
                }}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: "10px", color: theme.text,
                  fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
              />
            </div>

            {/* Prix unitaire - peut étre modifié méme si sélectionné depuis produit */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                {t("purchases.unitPrice") || "Prix unitaire"} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={modal.form.unitPrice ?? 0}
                onChange={e => {
                  const price = parseFloat(e.target.value) || 0;
                  setModal({ ...modal, form: { ...modal.form, unitPrice: price, total: price * (modal.form.quantity ?? 1) } });
                }}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: "10px", color: theme.text,
                  fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
              />
            </div>

            {/* Total preview */}
            <div style={{
              marginBottom: "16px",
              padding: "14px",
              background: `${theme.accent}10`,
              border: `1px solid ${theme.accent}30`,
              borderRadius: "12px",
              textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
              <IconDollarSign size={16} color={theme.accent} />
              <span style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "13px" }}>
                {t("common.total") || "Total"} :
              </span>
              <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "18px" : "22px" }}>
                {formatCurrency(modal.form.total ?? 0)}
              </span>
            </div>

            {/* Status */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                {t("common.status") || "Statut"}
              </label>
              <select
                value={modal.form.status ?? "pending"}
                onChange={e => setModal({ ...modal, form: { ...modal.form, status: e.target.value } })}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                  borderRadius: "10px", color: theme.text, cursor: "pointer",
                  fontSize: isMobile ? "13px" : "14px"
                }}
              >
                <option value="pending">{t("purchases.pending") || "En attente"}</option>
                <option value="delivered">{t("purchases.delivered") || "Livrée"}</option>
                <option value="cancelled">{t("purchases.cancelled") || "Annulée"}</option>
              </select>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={createPurchase}
                disabled={!String((modal.form as any)?.productName ?? "").trim() || !(Number((modal.form as any)?.quantity) > 0)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: theme.gradient,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: (!String((modal.form as any)?.productName ?? "").trim() || !(Number((modal.form as any)?.quantity) > 0)) ? "not-allowed" : "pointer",
                  opacity: (!String((modal.form as any)?.productName ?? "").trim() || !(Number((modal.form as any)?.quantity) > 0)) ? 0.5 : 1,
                  fontWeight: "600",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  minHeight: "44px",
                  WebkitTapHighlightColor: "transparent",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = "1"; }}
              >
                <IconSave size={14} color="white" />
                {t("common.save") || "Enregistrer"}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {} })}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: theme.surfaceHover,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: "500",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  minHeight: "44px",
                  WebkitTapHighlightColor: "transparent",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconX size={14} color={theme.text} />
                {t("common.cancel") || "Annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}