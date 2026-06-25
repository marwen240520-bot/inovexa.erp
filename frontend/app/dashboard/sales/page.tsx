"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";
import ImportButton from "@/components/ui/ImportButton";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

interface Sale {
  id: string | number;
  clientId?: string | number;
  clientName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface SaleForm {
  clientId?: number;
  clientName?: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  status?: string;
}

interface ModalState {
  open: boolean;
  form: SaleForm;
}

interface EditModalState {
  open: boolean;
  sale: Sale | null;
  status: string;
}

// ─── SVG Icon Components ───────────────────────────────────────────────────────

const IconBarChart2 = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>
  </svg>
);

const IconTrendingUp = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconClock = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </svg>
);

const IconSearch = ({ size = 15, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconCalendar = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconFilter = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconEdit = ({ size = 13, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 1-2 2v14a2 2 0 0 1 2 2h14a2 2 0 0 1 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconSave = ({ size = 14, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconPlus = ({ size = 15, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconShoppingCart = ({ size = 20, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconChevronDown = ({ size = 12, color = "currentColor", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─── Status helpers ────────────────────────────────────────────────────────────

function StatusIcon({ status, size = 13 }: { status: string; size?: number }) {
  if (status === "paid") return <IconCheckCircle size={size} color="#10b981" />;
  if (status === "pending") return <IconClock size={size} color="#f59e0b" />;
  if (status === "cancelled") return <IconXCircle size={size} color="#ef4444" />;
  return <IconBarChart2 size={size} color="currentColor" />;
}

// ─── SelectAllCheckbox ─────────────────────────────────────────────────────────

function SelectAllCheckbox({ items, selectedIds, onSelect, onSelectAll, getItemId }: any) {
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
      <input type="checkbox" checked={isAllSelected} ref={(input) => { if (input) input.indeterminate = isIndeterminate; }} onChange={handleSelectAll} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>{t("common.selectAll")}</span>
    </label>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SalesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile } = useResponsive();
  const { theme } = useTheme();

  const contentMarginLeft = isMobile ? "0" : "0px";

  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ 
    open: false, 
    form: { 
      status: "pending", 
      quantity: 1,
      productId: undefined,
      clientId: undefined,
      unitPrice: 0,
      total: 0
    } 
  });
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, sale: null, status: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [stats, setStats] = useState({ total: 0, amount: 0, average: 0 });
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | number | null>(null);
  const [importing, setImporting] = useState(false);

  const cardRadius = isMobile ? "16px" : "18px";
  const gridGap = isMobile ? "10px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const statusFontSize = isMobile ? "10px" : "12px";
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
      const res = await fetch("https://api-inovexa.ngrok.app/sales", { headers: { Authorization: `Bearer ${token}` } });
      let data = await res.json();
      data = Array.isArray(data) ? data : [];
      setAllSales(data);
      const totalAmount = data.reduce((sum: number, sale: Sale) => sum + (parseFloat(String(sale.total)) || 0), 0);
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
      const res = await fetch("https://api-inovexa.ngrok.app/products", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      console.log("📦 Produits chargés:", data);
      setProducts(Array.isArray(data) ? data : []);
    } catch(e) { console.error("❌ Erreur chargement produits:", e); }
  };

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("https://api-inovexa.ngrok.app/clients", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const importSales = async (data: any[]) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("https://api-inovexa.ngrok.app/sales/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sales: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(`${result.success} vente(s) importée(s) avec succès${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success");
        fetchSales();
      } else { showMessage(result.message || "Erreur lors de l'import", "error"); }
    } catch (error) { showMessage("Erreur de connexion lors de l'import", "error"); }
    finally { setImporting(false); }
  };

  const createSale = async () => {
    console.log("🔍 Formulaire avant création:", modal.form);

    if (!modal.form.productId) {
      showMessage("Veuillez sélectionner un produit", "error");
      return;
    }

    if (!modal.form.quantity || modal.form.quantity <= 0) {
      showMessage("La quantité doit être supérieure à 0", "error");
      return;
    }

    if (!modal.form.unitPrice || modal.form.unitPrice <= 0) {
      showMessage("Le prix unitaire doit être supérieur à 0", "error");
      return;
    }

    const token = localStorage.getItem("token");
    
    const productId = typeof modal.form.productId === 'string' 
      ? parseInt(modal.form.productId) 
      : modal.form.productId;

    const product = products.find(p => p.id === productId);
    if (!product) {
      showMessage("Produit non trouvé", "error");
      return;
    }

    if (product.quantity < (modal.form.quantity || 0)) {
      showMessage(`Stock insuffisant. Disponible: ${product.quantity}`, "error");
      return;
    }

    const formData = {
      productId: productId,
      quantity: modal.form.quantity || 1,
      unitPrice: modal.form.unitPrice || 0,
      clientName: modal.form.clientName || "",
      productName: product.name,
      status: modal.form.status || "pending"
    };

    console.log("📦 Données envoyées au backend:", formData);

    try {
      const res = await fetch("https://api-inovexa.ngrok.app/sales", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      console.log("📥 Réponse du backend:", result);

      if (res.ok) {
        setModal({ open: false, form: { status: "pending", quantity: 1, productId: undefined, clientId: undefined, unitPrice: 0, total: 0 } });
        setSelectedProduct(null);
        setSelectedClient(null);
        await fetchSales();
        await fetchProducts();
        showMessage("Vente créée avec succès !", "success");
      } else {
        showMessage(result.message || "Erreur lors de la création de la vente", "error");
      }
    } catch(e) {
      console.error("❌ Erreur lors de la création:", e);
      showMessage("Erreur de connexion au serveur", "error");
    }
  };

  const updateSaleStatus = async (id: string | number, newStatus: string) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`https://api-inovexa.ngrok.app/sales/${id}/status`, {
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

  const deleteSale = async (id: string | number) => {
    if (confirm(t("sales.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`https://api-inovexa.ngrok.app/sales/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchSales();
      showMessage(t("sales.saleDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm((t("sales.confirmBulkDelete") || "Supprimer {count} vente(s) ?").replace("{count}", String(selectedIds.length)))) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`https://api-inovexa.ngrok.app/sales/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      fetchSales();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} vente(s) supprimée(s)`, "success");
    }
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getStatusColor = (status: string) => {
    if (status === "paid") return "#10b981";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return theme.textSecondary;
  };

  const getStatusText = (status: string) => {
    if (status === "paid") return t("sales.paid");
    if (status === "pending") return t("sales.pending");
    if (status === "cancelled") return t("sales.cancelled");
    return status;
  };

  // ✅ HANDLE PRODUCT SELECT - VERSION CORRIGÉE
  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("🔄 Produit sélectionné - valeur brute:", value);
    
    if (!value || value === "") {
      setSelectedProduct(null);
      setModal(prev => ({
        ...prev,
        form: {
          ...prev.form,
          productId: undefined,
          productName: "",
          unitPrice: 0,
          total: 0
        }
      }));
      return;
    }
    
    const productId = parseInt(value, 10);
    console.log("🔄 ID produit converti:", productId);
    
    const product = products.find(p => p.id === productId);
    console.log("🔄 Produit trouvé:", product);
    
    if (product) {
      setSelectedProduct(product);
      const quantity = modal.form.quantity || 1;
      const unitPrice = product.price || 0;
      
      setModal(prev => ({
        ...prev,
        form: {
          ...prev.form,
          productId: product.id,
          productName: product.name,
          unitPrice: unitPrice,
          total: quantity * unitPrice
        }
      }));
    } else {
      setSelectedProduct(null);
      setModal(prev => ({
        ...prev,
        form: {
          ...prev.form,
          productId: undefined,
          productName: "",
          unitPrice: 0,
          total: 0
        }
      }));
    }
  };

  // ✅ HANDLE CLIENT SELECT - VERSION CORRIGÉE
  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("🔄 Client sélectionné - valeur brute:", value);
    
    if (!value || value === "") {
      setSelectedClient(null);
      setModal(prev => ({
        ...prev,
        form: {
          ...prev.form,
          clientId: undefined,
          clientName: ""
        }
      }));
      return;
    }
    
    const clientId = parseInt(value, 10);
    const client = clients.find(c => c.id === clientId);
    console.log("🔄 Client trouvé:", client);
    
    if (client) {
      setSelectedClient(client);
      setModal(prev => ({
        ...prev,
        form: {
          ...prev.form,
          clientId: client.id,
          clientName: client.name
        }
      }));
    } else {
      setSelectedClient(null);
      setModal(prev => ({
        ...prev,
        form: {
          ...prev.form,
          clientId: undefined,
          clientName: ""
        }
      }));
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 1;
    const price = modal.form.unitPrice || 0;
    
    if (selectedProduct && quantity > selectedProduct.quantity) {
      showMessage(`Stock disponible: ${selectedProduct.quantity}`, "error");
    }
    
    setModal(prev => ({
      ...prev,
      form: {
        ...prev.form,
        quantity: quantity,
        total: quantity * price
      }
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0;
    const quantity = modal.form.quantity || 1;
    
    setModal(prev => ({
      ...prev,
      form: {
        ...prev.form,
        unitPrice: price,
        total: quantity * price
      }
    }));
  };

  const openEditStatusModal = (sale: Sale) => {
    setEditModal({ open: true, sale, status: sale.status });
  };

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cardPop { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `;

  const statsCards = [
    {
      icon: <IconBarChart2 size={isMobile ? 22 : 28} color={theme.primary} />,
      label: t("sales.totalSales"),
      value: stats.total,
      color: theme.primary,
    },
    {
      icon: <IconCurrencyDollar size={isMobile ? 22 : 28} color={theme.accent} />,
      label: t("dashboard.revenue"),
      value: formatCurrency(stats.amount),
      color: theme.accent,
    },
    {
      icon: <IconTrendingUp size={isMobile ? 22 : 28} color="#f59e0b" />,
      label: t("sales.averageSale"),
      value: formatCurrency(Math.round(stats.average)),
      color: "#f59e0b",
    }
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
        flex: 1,
        marginLeft: contentMarginLeft,
        padding: isMobile ? "14px 12px" : "24px",
        paddingBottom: isMobile ? "80px" : "24px",
        overflowX: "hidden",
        background: theme.background
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          <style>{animations}</style>

          {/* ── Header ── */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            marginBottom: sectionMargin,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "14px" : "16px",
            animation: "fadeInDown 0.5s ease",
          }}>
            <div>
              <h1 style={{ color: theme.text, fontSize: isMobile ? "20px" : "28px", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                <IconShoppingCart size={isMobile ? 22 : 28} color={theme.primary} />
                {t("common.sales")}
              </h1>
              <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("sales.subtitle")}</p>
            </div>

            <div style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              width: isMobile ? "100%" : "auto",
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}>
              <div style={{ display: "flex", gap: "8px", flex: isMobile ? "0 0 auto" : "unset" }}>
                <ImportButton onImport={importSales} label={isMobile ? "" : t("common.import")} />
                <ExportButtons data={sales} filename="ventes" iconOnly={isMobile} />
              </div>

              <button
                onClick={() => setModal({ 
                  open: true, 
                  form: { 
                    clientName: "", 
                    productName: "", 
                    quantity: 1, 
                    unitPrice: 0, 
                    total: 0, 
                    status: "pending",
                    productId: undefined,
                    clientId: undefined
                  } 
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
              >
                <IconPlus size={15} color="white" />
                {t("sales.addSale")}
              </button>
            </div>
          </div>

          {/* ── Message ── */}
          {message && (
            <div style={{
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`,
              color: messageType === "success" ? "#10b981" : "#f87171",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center",
              animation: "fadeInUp 0.3s ease",
              fontSize: isMobile ? "12px" : "14px",
            }}>
              {message}
            </div>
          )}

          {/* ── Stats Cards ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 1fr)",
            gap: gridGap,
            marginBottom: sectionMargin,
          }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: theme.surface,
                  borderRadius: cardRadius,
                  padding: isMobile ? "14px 10px" : "20px",
                  border: `1px solid ${theme.border}`,
                  animation: `cardPop 0.45s ease ${0.05 + idx * 0.08}s both`,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "center",
                  gap: isMobile ? "6px" : "12px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                  transition: "transform 0.25s, box-shadow 0.25s",
                }}
              >
                <div style={{
                  width: isMobile ? "36px" : "44px",
                  height: isMobile ? "36px" : "44px",
                  borderRadius: isMobile ? "10px" : "12px",
                  background: `${card.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>

                <div style={{ textAlign: isMobile ? "center" : "left" }}>
                  <div style={{
                    fontSize: isMobile ? "17px" : "26px",
                    color: card.color,
                    fontWeight: "700",
                    lineHeight: 1.1,
                  }}>
                    {card.value}
                  </div>
                  <div style={{
                    fontSize: isMobile ? "9px" : "12px",
                    color: theme.textSecondary,
                    marginTop: "2px",
                    fontWeight: "500",
                  }}>
                    {card.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div style={{ marginBottom: "20px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 2, position: "relative", width: isMobile ? "100%" : "auto" }}>
                <IconSearch size={15} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder={`${t("common.search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px 10px 36px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box", transition: "border-color 0.2s" }}
                />
              </div>
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "160px" }}>
                <IconCalendar size={14} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 32px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px", appearance: "none" }}>
                  <option value="all">{t("sales.allPeriods")}</option>
                  <option value="week">{t("sales.thisWeek")}</option>
                  <option value="month">{t("sales.thisMonth")}</option>
                </select>
              </div>
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "150px" }}>
                <IconFilter size={13} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 30px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px", appearance: "none" }}>
                  <option value="all">{t("sales.allStatus")}</option>
                  <option value="paid">{t("sales.paid")}</option>
                  <option value="pending">{t("sales.pending")}</option>
                  <option value="cancelled">{t("sales.cancelled")}</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <SelectAllCheckbox items={sales} selectedIds={selectedIds} onSelect={setSelectedIds} onSelectAll={(ids: (string|number)[]) => setSelectedIds(ids)} getItemId={(item: Sale) => item.id} />
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
                  }}
                >
                  <IconTrash size={13} color="white" />
                  {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* ── Table ── */}
          <div style={{ background: theme.surface, borderRadius: cardRadius, padding: isMobile ? "12px" : "16px", border: `1px solid ${theme.border}`, overflowX: "auto", animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "620px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "10px", width: "40px" }}>
                      <input type="checkbox" checked={selectedIds.length === sales.length && sales.length > 0} onChange={() => { if (selectedIds.length === sales.length) setSelectedIds([]); else setSelectedIds(sales.map(s => s.id)); }} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
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
                      style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.2s", animation: `slideIn 0.3s ease ${idx * 0.03}s` }}
                    >
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <input type="checkbox" checked={selectedIds.includes(sale.id)} onChange={() => { if (selectedIds.includes(sale.id)) setSelectedIds(selectedIds.filter(id => id !== sale.id)); else setSelectedIds([...selectedIds, sale.id]); }} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                      </td>
                      <td style={{ padding: "10px", color: theme.text, fontSize: tableFontSize }}>{sale.clientName || "-"}</td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{sale.productName || "-"}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{sale.quantity || 1}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>{formatCurrency(parseFloat(String(sale.total)))}</td>
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
                            transition: "all 0.2s",
                          }}
                        >
                          <StatusIcon status={sale.status} size={isMobile ? 10 : 12} />
                          {!isMobile && getStatusText(sale.status)}
                          {!isMobile && <IconChevronDown size={10} color={getStatusColor(sale.status)} />}
                        </button>
                      </td>
                      <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{new Date(sale.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US")}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => openEditStatusModal(sale)}
                            title={t("common.edit")}
                            style={{
                              background: "#3b82f620",
                              color: "#3b82f6",
                              border: "1px solid #3b82f640",
                              borderRadius: "8px",
                              width: isMobile ? "32px" : "30px",
                              height: isMobile ? "32px" : "30px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                              flexShrink: 0,
                            }}
                          >
                            <IconEdit size={isMobile ? 13 : 12} color="currentColor" />
                          </button>
                          <button
                            onClick={() => deleteSale(sale.id)}
                            title={t("common.delete")}
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
                              flexShrink: 0,
                            }}
                          >
                            <IconTrash size={isMobile ? 13 : 12} color="currentColor" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sales.length === 0 && (
              <div style={{ textAlign: "center", padding: isMobile ? "32px 16px" : "48px" }}>
                <IconShoppingCart size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{searchTerm ? t("common.noResults") : t("sales.noSales")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal — New Sale ── */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px" }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "20px", width: modalWidth, maxWidth: "95%", border: `1px solid ${theme.border}`, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "17px" : "22px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconShoppingCart size={isMobile ? 18 : 22} color={theme.primary} />
              {t("sales.addSale")}
            </h2>

            {/* Client Selection */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>{t("common.client")}</label>
              <select 
                onChange={handleClientSelect}
                value={modal.form.clientId ? String(modal.form.clientId) : ""}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
              >
                <option value="">{t("sales.selectClient") || "Sélectionner un client"}</option>
                {clients.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
              {selectedClient && (
                <div style={{ marginTop: "6px", fontSize: isMobile ? "10px" : "11px", color: theme.accent, display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconCheckCircle size={12} color={theme.accent} />
                  {t("sales.clientSelected") || "Client sélectionné"}: {selectedClient.name}
                </div>
              )}
            </div>

            {/* Product Selection - CORRIGÉE */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>
                {t("common.product")} *
              </label>
              <select 
                onChange={handleProductSelect}
                value={modal.form.productId ? String(modal.form.productId) : ""}
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  background: theme.surfaceHover, 
                  border: `1px solid ${theme.border}`, 
                  borderRadius: "10px", 
                  color: theme.text, 
                  cursor: "pointer", 
                  fontSize: isMobile ? "13px" : "14px" 
                }}
              >
                <option value="">{t("sales.selectProduct")}</option>
                {products.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.name} - {formatCurrency(p.price)} (Stock: {p.quantity})
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div style={{ 
                  marginTop: "6px", 
                  fontSize: isMobile ? "10px" : "11px", 
                  color: selectedProduct.quantity >= (modal.form.quantity || 0) ? theme.accent : "#ef4444", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px" 
                }}>
                  {selectedProduct.quantity >= (modal.form.quantity || 0) ? (
                    <IconCheckCircle size={12} color={theme.accent} />
                  ) : (
                    <IconXCircle size={12} color="#ef4444" />
                  )}
                  {t("sales.productSelected")}: {selectedProduct.name} (Stock: {selectedProduct.quantity})
                  {selectedProduct.quantity < (modal.form.quantity || 0) && (
                    <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                      {" "}- Stock insuffisant!
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>{t("common.quantity")} *</label>
                <input 
                  type="number" 
                  min="1"
                  value={modal.form.quantity || 1} 
                  onChange={handleQuantityChange} 
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>{t("common.price")} *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={modal.form.unitPrice || 0} 
                  onChange={handlePriceChange} 
                  style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>{t("common.status")}</label>
              <select value={modal.form.status || "pending"} onChange={(e) => setModal(prev => ({ ...prev, form: { ...prev.form, status: e.target.value } }))} style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}>
                <option value="pending">{t("sales.pending")}</option>
                <option value="paid">{t("sales.paid")}</option>
                <option value="cancelled">{t("sales.cancelled")}</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px", padding: "14px", background: `${theme.accent}10`, border: `1px solid ${theme.accent}30`, borderRadius: "12px", textAlign: "center" }}>
              <span style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "13px" }}>{t("common.total")}: </span>
              <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "18px" : "22px" }}>{formatCurrency(modal.form.total || 0)}</span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={createSale}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: theme.gradient,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  minHeight: "44px",
                }}
              >
                <IconSave size={14} color="white" /> {t("common.save")}
              </button>
              <button
                onClick={() => { 
                  setModal({ 
                    open: false, 
                    form: { 
                      status: "pending", 
                      quantity: 1,
                      productId: undefined,
                      clientId: undefined,
                      unitPrice: 0,
                      total: 0
                    } 
                  }); 
                  setSelectedProduct(null); 
                  setSelectedClient(null); 
                }}
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
                  minHeight: "44px",
                }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal — Edit Status ── */}
      {editModal.open && editModal.sale && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px" }}>
          <div style={{ background: theme.surface, padding: isMobile ? "20px" : "28px", borderRadius: "20px", width: isMobile ? "95%" : "420px", maxWidth: "95%", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "17px" : "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconEdit size={isMobile ? 16 : 18} color={theme.primary} />
              {t("sales.editStatus") || "Modifier le statut"}
            </h2>

            <div style={{ background: theme.surfaceHover, padding: "14px", borderRadius: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>{t("common.client")}</span>
                <span style={{ color: theme.text, fontSize: isMobile ? "11px" : "13px" }}>{editModal.sale.clientName || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>{t("common.product")}</span>
                <span style={{ color: theme.text, fontSize: isMobile ? "11px" : "13px" }}>{editModal.sale.productName || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>{t("common.amount")}</span>
                <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "11px" : "13px" }}>{formatCurrency(parseFloat(String(editModal.sale.total)))}</span>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>{t("common.status")}</label>
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

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => updateSaleStatus(editModal.sale!.id, editModal.status)}
                disabled={updatingStatus === editModal.sale.id}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: theme.gradient,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: isMobile ? "13px" : "14px",
                  opacity: updatingStatus === editModal.sale.id ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  minHeight: "44px",
                }}
              >
                {updatingStatus === editModal.sale.id
                  ? <><IconLoader size={14} color="white" /> {t("common.loading")}</>
                  : <><IconSave size={14} color="white" /> {t("common.save")}</>}
              </button>
              <button
                onClick={() => setEditModal({ open: false, sale: null, status: "" })}
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
                  minHeight: "44px",
                }}
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