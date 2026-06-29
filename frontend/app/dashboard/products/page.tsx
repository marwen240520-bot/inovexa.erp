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
import Spinner from "@/components/ui/Spinner";

// -- Types --------------------------------------------------
interface Product {
  id: number | string;
  name: string;
  sku?: string;
  price?: number;
  quantity?: number;
  categoryId?: number | string;
  [key: string]: any;
}

interface Category {
  id: number | string;
  name: string;
  [key: string]: any;
}

interface ModalForm {
  name?: string;
  sku?: string;
  price?: number;
  categoryId?: string | number;
  [key: string]: any;
}

interface ModalState {
  open: boolean;
  form: ModalForm;
  editMode: boolean;
  editId?: number | string | null;
}

// -- SVG Icons ----------------------------------------------
const IconBox = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IconAlertTriangle = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconXCircle = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const IconPackage = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7L12 12L4 7M12 22V12M4 7L12 2L20 7M4 7V17L12 22M20 7V17L12 22"/>
  </svg>
);

const IconDollar = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconList = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconPlus = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconEdit = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconSave = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconSearch = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconFolder = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconCheck = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconInfo = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

// -- SelectAllCheckbox --------------------------------------
function SelectAllCheckbox({ items, selectedIds, onSelect, onSelectAll, getItemId }: {
  items: Product[];
  selectedIds: (number | string)[];
  onSelect: (ids: (number | string)[]) => void;
  onSelectAll: (ids: (number | string)[]) => void;
  getItemId: (item: Product) => number | string;
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
        style={{ width: "16px", height: "16px", cursor: "pointer" }}
      />
      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>
        {t("common.selectAll")}
      </span>
    </label>
  );
}

// -- Page principale ----------------------------------------
export default function ProductsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [importing, setImporting] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  const headerTitleSize = isMobile ? "20px" : "28px";
  const cardPadding = isMobile ? "12px" : "20px";
  const cardRadius = isMobile ? "12px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "12px" : "32px";
  const tableFontSize = isMobile ? "10px" : "13px";
  const statusFontSize = isMobile ? "9px" : "12px";
  const buttonPadding = isMobile ? "6px 10px" : "8px 16px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";
  const gridMinWidth = isMobile ? "160px" : "280px";
  // FIX: Set proper margin-left for desktop (280px for sidebar)
  const contentMarginLeft = isMobile ? "0" : "0px";

  // suppress unused warnings
  void isTablet; void isDesktop; void language; void importing;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    loadInitialData();
    setTimeout(() => setAnimateCards(true), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => { await fetchCategories(); };

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      await fetchProducts();
    } catch(e) {
      console.error("Erreur chargement catégories:", e);
      await fetchProducts();
    }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch(e) { console.error("Erreur chargement produits:", e); }
    finally { setLoading(false); }
  };

  const createProduct = async () => {
    const token = localStorage.getItem("token");
    try {
      const productData = {
        name: modal.form.name,
        sku: modal.form.sku || "",
        price: modal.form.price || 0,
        categoryId: modal.form.categoryId ? parseInt(String(modal.form.categoryId)) : null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(productData)
      });
      
      if (res.ok) { 
        setModal({ open: false, form: {}, editMode: false, editId: null }); 
        await fetchProducts(); 
        showMessage(t("products.productCreated"), "success"); 
      } else { 
        const err = await res.json(); 
        console.error("Erreur création produit:", err);
        showMessage(err.message || t("common.error"), "error"); 
      }
    } catch(e) { 
      console.error("Exception création produit:", e);
      showMessage(t("common.error"), "error"); 
    }
  };

  const updateProduct = async () => {
    const token = localStorage.getItem("token");
    try {
      const productData = {
        name: modal.form.name,
        sku: modal.form.sku || "",
        price: modal.form.price || 0,
        categoryId: modal.form.categoryId ? parseInt(String(modal.form.categoryId)) : null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${modal.editId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(productData)
      });
      
      if (res.ok) { 
        setModal({ open: false, form: {}, editMode: false, editId: null }); 
        await fetchProducts(); 
        showMessage(t("products.productUpdated"), "success"); 
      } else { 
        const err = await res.json(); 
        console.error("Erreur mise à jour produit:", err);
        showMessage(err.message || t("common.error"), "error"); 
      }
    } catch(e) { 
      console.error("Exception mise à jour produit:", e);
      showMessage(t("common.error"), "error"); 
    }
  };

  const deleteProduct = async (id: number | string) => {
    if (confirm(t("products.confirmDelete"))) {
      const token = localStorage.getItem("token");
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, { 
          method: "DELETE", 
          headers: { Authorization: `Bearer ${token}` } 
        });
        await fetchProducts();
        showMessage(t("products.productDeleted"), "success");
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      } catch(e) {
        console.error("Erreur suppression produit:", e);
        showMessage(t("common.error"), "error");
      }
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (confirm(t("products.confirmBulkDelete").replace("{count}", String(count)))) {
      const token = localStorage.getItem("token");
      try {
        for (const id of selectedIds) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, { 
            method: "DELETE", 
            headers: { Authorization: `Bearer ${token}` } 
          });
        }
        await fetchProducts();
        setSelectedIds([]);
        showMessage(`${count} produit(s) supprim(s)`, "success");
      } catch(e) {
        console.error("Erreur suppression en masse:", e);
        showMessage(t("common.error"), "error");
      }
    }
  };

  const importProducts = async (data: any[]) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const productsWithZeroStock = data.map(p => ({ ...p, quantity: 0 }));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/import`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ products: productsWithZeroStock })
      });
      const result = await res.json();
      if (res.ok) { 
        showMessage(`${result.success} produit(s) importé(s)${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success"); 
        await fetchProducts(); 
      } else { 
        showMessage(result.message || "Erreur lors de l'import", "error"); 
      }
    } catch(e) { 
      console.error("Erreur import:", e);
      showMessage("Erreur de connexion lors de l'import", "error"); 
    }
    finally { setImporting(false); }
  };

  const showMessage = (msg: string, type: string) => { 
    setMessage(msg); 
    setMessageType(type); 
    setTimeout(() => setMessage(""), 3000); 
  };

  const openEditModal = (product: Product) => {
    setModal({ 
      open: true, 
      editMode: true, 
      editId: product.id, 
      form: { 
        name: product.name || "", 
        sku: product.sku || "", 
        price: product.price || 0, 
        categoryId: product.categoryId || "",
      } 
    });
  };

  const openCreateModal = () => {
    setModal({ 
      open: true, 
      editMode: false, 
      editId: null,
      form: { 
        name: "", 
        sku: "", 
        price: 0, 
        categoryId: "" 
      } 
    });
  };

  const getCategoryName = (categoryId: number | string | undefined) => {
    if (!categoryId) return "-";
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return cat ? cat.name : "-";
  };

  const getStatusText = (qty: number) => {
    if (qty <= 0) return t("products.outOfStock");
    if (qty < 10) return t("products.lowStock");
    return t("products.inStock");
  };

  const getStatusColor = (qty: number) => {
    if (qty <= 0) return "#ef4444";
    if (qty < 10) return "#f59e0b";
    return "#10b981";
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "all" || String(p.categoryId) === String(selectedCategory);
    return matchSearch && matchCat;
  });

  const calculateTotalValue = (list: Product[]) => list.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);

  const stats = {
    total: products.length,
    totalValue: calculateTotalValue(products)
  };

  const statsCards = [
    { Icon: IconBox,           label: t("products.totalProducts"), value: stats.total,                     color: theme.primary },
    { Icon: IconDollar,        label: t("products.totalValue"),    value: formatCurrency(stats.totalValue), color: theme.accent },
  ];

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeInUp   { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn    { from { opacity:0; transform:translateX(-15px); } to { opacity:1; transform:translateX(0); } }
  `;

  // FIX: Loading state with sidebar
  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.background, 
      display: "flex", 
      position: "relative",
      padding: 0,
      margin: 0
    }}>
      <Sidebar />

      <div style={{ 
        flex: 1, 
        padding: isMobile ? "12px" : "24px", 
        width: "100%", 
        overflowX: "hidden",
        marginLeft: contentMarginLeft,
        paddingBottom: isMobile ? "70px" : "24px",
        minHeight: "100vh"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          <style>{animations}</style>

          {/* Header */}
          <div style={{ marginBottom: sectionMargin, animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "12px" : "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconBox size={isMobile ? 20 : 28} />
                  {t("common.products")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "2px", fontSize: isMobile ? "10px" : "14px" }}>{t("products.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => setViewMode("list")} style={{ padding: buttonPadding, background: viewMode === "list" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: viewMode === "list" ? "white" : theme.text, cursor: "pointer", fontSize: isMobile ? "10px" : "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconList size={12} />{!isMobile && (t("clients.listView") || "Liste")}
                  </button>
                  <button onClick={() => setViewMode("grid")} style={{ padding: buttonPadding, background: viewMode === "grid" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: viewMode === "grid" ? "white" : theme.text, cursor: "pointer", fontSize: isMobile ? "10px" : "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IconGrid size={12} />{!isMobile && (t("clients.gridView") || "Grille")}
                  </button>
                </div>
                {!isMobile && (
                  <>
                    <ImportButton onImport={importProducts} label={t("common.import")} />
                    <ExportButtons data={filteredProducts} filename="produits" />
                    <button onClick={openCreateModal} style={{ background: theme.gradient, color: "white", padding: buttonPadding, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <IconPlus size={14} />{t("common.add")}
                    </button>
                  </>
                )}
              </div>
            </div>
            {isMobile && (
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                <ImportButton onImport={importProducts} label={<IconBox size={14} />} />
                <ExportButtons data={filteredProducts} filename="produits" />
                <button onClick={openCreateModal} style={{ background: theme.gradient, color: "white", padding: buttonPadding, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconPlus size={12} />{t("common.add")}
                </button>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div style={{ background: messageType === "success" ? `${theme.accent}15` : "rgba(239,68,68,0.1)", border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`, color: messageType === "success" ? theme.accent : "#f87171", padding: "10px", borderRadius: "10px", marginBottom: "16px", textAlign: "center", animation: "fadeInUp 0.3s ease", fontSize: isMobile ? "11px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {messageType === "success" ? <IconCheck size={14} /> : <IconX size={14} />}
              {message}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "140px" : "200px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {statsCards.map((card, idx) => (
              <div key={idx} style={{ background: theme.surface, borderRadius: cardRadius, padding: cardPadding, textAlign: "center", border: `1px solid ${theme.border}`, animation: `fadeInUp 0.5s ease ${0.05 + idx * 0.05}s`, opacity: animateCards ? 1 : 0, transition: "transform 0.2s", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px", color: card.color }}>
                  <card.Icon size={isMobile ? 24 : 32} color={card.color} />
                </div>
                <div style={{ fontSize: isMobile ? "18px" : "24px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "9px" : "12px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ marginBottom: "16px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 2, position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "10px", color: theme.textSecondary, display: "flex" }}><IconSearch size={14} /></span>
                <input type="text" placeholder={`${t("common.search")}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px 8px 32px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: isMobile ? "12px" : "14px" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary} onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
                <span style={{ position: "absolute", left: "10px", color: theme.textSecondary, display: "flex", zIndex: 1, pointerEvents: "none" }}><IconFolder size={14} /></span>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px 8px 32px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, minWidth: isMobile ? "100%" : "180px", cursor: "pointer", fontSize: isMobile ? "12px" : "14px" }}>
                  <option value="all">{t("products.allCategories") || "Toutes les catégories"}</option>
                  {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
              <SelectAllCheckbox items={filteredProducts} selectedIds={selectedIds} onSelect={setSelectedIds} onSelectAll={(ids) => setSelectedIds(ids)} getItemId={(item) => item.id} />
              {selectedIds.length > 0 && (
                <button onClick={deleteSelected} style={{ background: "#c33", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: isMobile ? "11px" : "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconTrash size={12} />{t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Vue Liste */}
          {viewMode === "list" && (
            <div style={{ background: theme.surface, borderRadius: cardRadius, padding: isMobile ? "8px" : "16px", border: `1px solid ${theme.border}`, overflowX: "auto", animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0 }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "450px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "8px", width: "32px" }}>
                        <input type="checkbox" checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={() => { if (selectedIds.length === filteredProducts.length) setSelectedIds([]); else setSelectedIds(filteredProducts.map(p => p.id)); }}
                          style={{ width: "14px", height: "14px", cursor: "pointer" }} />
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                      {!isMobile && <th style={{ padding: "8px", textAlign: "left", fontSize: tableFontSize }}>SKU</th>}
                      <th style={{ padding: "8px", textAlign: "left", fontSize: tableFontSize }}>{t("common.category")}</th>
                      <th style={{ padding: "8px", textAlign: "right", fontSize: tableFontSize }}>{t("common.price")}</th>
                      <th style={{ padding: "8px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                      <th style={{ padding: "8px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, idx) => {
                      const statusColor = getStatusColor(p.quantity || 0);
                      const isChecked = selectedIds.includes(p.id);
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.2s", animation: `slideIn 0.3s ease ${idx * 0.03}s` }}
                          onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <input type="checkbox" checked={isChecked} onChange={() => { if (isChecked) setSelectedIds(selectedIds.filter(id => id !== p.id)); else setSelectedIds([...selectedIds, p.id]); }} style={{ width: "14px", height: "14px", cursor: "pointer" }} />
                          </td>
                          <td style={{ padding: "8px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {(p.quantity || 0) <= 0 ? <IconXCircle size={14} color="#ef4444" /> : (p.quantity || 0) < 10 ? <IconAlertTriangle size={14} color="#f59e0b" /> : <IconPackage size={14} color="#10b981" />}
                              <span style={{ wordBreak: "break-word" }}>{p.name?.length > (isMobile ? 12 : 20) ? p.name.substring(0, isMobile ? 10 : 17) + "..." : p.name}</span>
                            </div>
                          </td>
                          {!isMobile && <td style={{ padding: "8px", color: theme.textSecondary, fontSize: tableFontSize }}>{p.sku || "-"}</td>}
                          <td style={{ padding: "8px" }}>
                            <span style={{ background: `${theme.primary}20`, color: theme.primary, padding: "2px 6px", borderRadius: "10px", fontSize: statusFontSize, display: "inline-block", whiteSpace: "nowrap" }}>{getCategoryName(p.categoryId)}</span>
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>{formatCurrency(p.price || 0)}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <span style={{ background: `${statusColor}20`, color: statusColor, padding: "2px 6px", borderRadius: "12px", fontSize: statusFontSize, whiteSpace: "nowrap" }}>{getStatusText(p.quantity || 0)}</span>
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                              <button onClick={() => openEditModal(p)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "5px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}><IconEdit size={11} /></button>
                              <button onClick={() => deleteProduct(p.id)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "5px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}><IconTrash size={11} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: theme.textSecondary }}><IconBox size={isMobile ? 32 : 48} /></div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "14px" }}>{searchTerm ? t("common.noResults") : t("common.noData")}</p>
                </div>
              )}
            </div>
          )}

          {/* Vue Grille */}
          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`, gap: gridGap, animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0 }}>
              {filteredProducts.map((p, idx) => {
                const statusColor = getStatusColor(p.quantity || 0);
                return (
                  <div key={p.id} style={{ background: theme.surface, borderRadius: cardRadius, padding: "12px", border: `1px solid ${statusColor}40`, transition: "transform 0.2s, box-shadow 0.2s", animation: `fadeInUp 0.3s ease ${idx * 0.05}s` }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ color: theme.primary, flexShrink: 0 }}>
                        {(p.quantity || 0) <= 0 ? <IconXCircle size={isMobile ? 28 : 36} color="#ef4444" /> : (p.quantity || 0) < 10 ? <IconAlertTriangle size={isMobile ? 28 : 36} color="#f59e0b" /> : <IconBox size={isMobile ? 28 : 36} />}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "12px" : "14px", wordBreak: "break-word" }}>{p.name?.length > (isMobile ? 15 : 20) ? p.name.substring(0, isMobile ? 12 : 17) + "..." : p.name}</div>
                        <div style={{ color: theme.textSecondary, fontSize: isMobile ? "8px" : "10px" }}>{p.sku || t("products.noSku") || "Pas de SKU"}</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: "8px", padding: "4px 0", borderTop: `1px solid ${theme.surfaceHover}`, borderBottom: `1px solid ${theme.surfaceHover}` }}>
                      {[
                        { label: t("common.category"), value: getCategoryName(p.categoryId), style: { color: theme.primary, background: `${theme.primary}15`, padding: "2px 6px", borderRadius: "8px", fontSize: isMobile ? "8px" : "10px", fontWeight: "bold", display: "inline-block" as const } },
                        { label: t("common.price"), value: formatCurrency(p.price || 0), style: { color: theme.accent, fontSize: isMobile ? "11px" : "13px", fontWeight: "bold" } },
                        { label: t("common.status"), value: getStatusText(p.quantity || 0), style: { color: statusColor, fontSize: isMobile ? "8px" : "10px", fontWeight: "bold" } },
                      ].map((row, i) => (
                        <div key={i} style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                          <span style={{ color: theme.textSecondary, fontSize: isMobile ? "8px" : "10px" }}>{row.label}</span>
                          <span style={row.style}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => openEditModal(p)} style={{ flex: 1, padding: "5px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                        <IconEdit size={10} />{!isMobile && t("common.edit")}
                      </button>
                      <button onClick={() => deleteProduct(p.id)} style={{ flex: 1, padding: "5px", background: "#c33", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                        <IconTrash size={10} />{!isMobile && t("common.delete")}
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", color: theme.textSecondary }}><IconBox size={isMobile ? 32 : 48} /></div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "14px" }}>{searchTerm ? t("common.noResults") : t("common.noData")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Formulaire sans champ quantité */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "20px", width: modalWidth, maxWidth: "95%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "18px" : "22px", display: "flex", alignItems: "center", gap: "8px" }}>
              {modal.editMode ? <IconEdit size={18} /> : <IconPlus size={18} />}
              {modal.editMode ? t("products.editProduct") : t("products.addProduct")}
            </h2>
            
            {/* Message d'information sur la quantité */}
           

            {[
              { label: `${t("common.name")} *`, key: "name", type: "text", placeholder: t("products.productName") },
              { label: "SKU", key: "sku", type: "text", placeholder: t("products.sku") },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "4px", fontSize: isMobile ? "11px" : "13px" }}>{label}</label>
                <input type={type} placeholder={placeholder} value={modal.form[key] || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, [key]: e.target.value } })}
                  style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: isMobile ? "12px" : "14px" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary} onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              </div>
            ))}
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "4px", fontSize: isMobile ? "11px" : "13px" }}>{t("common.category")}</label>
              <select value={String(modal.form.categoryId || "")} onChange={(e) => setModal({ ...modal, form: { ...modal.form, categoryId: e.target.value } })}
                style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "12px" : "14px" }}>
                <option value="">{t("products.selectCategory") || "Sélectionner une catégorie"}</option>
                {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
              </select>
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "4px", fontSize: isMobile ? "11px" : "13px" }}>{t("common.price")} *</label>
              <input type="number" step="0.01" placeholder={t("common.price")} value={modal.form.price || 0} onChange={(e) => setModal({ ...modal, form: { ...modal.form, price: parseFloat(e.target.value) || 0 } })}
                style={{ width: "100%", padding: "8px 10px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, fontSize: isMobile ? "12px" : "14px" }} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={modal.editMode ? updateProduct : createProduct} style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <IconSave size={14} />{modal.editMode ? t("common.edit") : t("common.add")}
              </button>
              <button onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })} style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "8px", cursor: "pointer", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <IconX size={14} />{t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}