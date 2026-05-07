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
import { useSidebarWidth } from "@/hooks/useSidebarWidth";

// ── SVG Icons ──────────────────────────────────────────────
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
    <path d="M20 7L12 12L4 7M12 22V12M4 7L12 2L20 7M4 7V17L12 22M20 7V17L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDollar = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconList = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconPlus = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconEdit = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconSave = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconSearch = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconFolder = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── SelectAllCheckbox ──────────────────────────────────────
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

// ── Page principale ────────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [modal, setModal] = useState({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [importing, setImporting] = useState(false);
  const sidebarWidth = useSidebarWidth();

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "16px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const statusFontSize = isMobile ? "10px" : "12px";
  const buttonPadding = isMobile ? "6px 12px" : "8px 16px";
  const modalWidth = isMobile ? "95%" : "500px";
  const modalPadding = isMobile ? "20px" : "32px";
  const gridMinWidth = isMobile ? "280px" : "320px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    loadInitialData();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const loadInitialData = async () => { await fetchCategories(); };

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/categories", { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await fetch("http://localhost:3001/products", { headers: { Authorization: `Bearer ${token}` } });
      let data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch(e) { console.error("Erreur chargement produits:", e); }
    finally { setLoading(false); }
  };

  const createProduct = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: modal.form.name, sku: modal.form.sku || "", price: modal.form.price || 0, quantity: modal.form.quantity || 0, categoryId: modal.form.categoryId ? parseInt(modal.form.categoryId) : null })
      });
      if (res.ok) { setModal({ open: false, form: {}, editMode: false, editId: null }); fetchProducts(); showMessage(t("products.productCreated"), "success"); }
      else { const err = await res.json(); showMessage(err.message || t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const updateProduct = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/products/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: modal.form.name, sku: modal.form.sku || "", price: modal.form.price || 0, quantity: modal.form.quantity || 0, categoryId: modal.form.categoryId ? parseInt(modal.form.categoryId) : null })
      });
      if (res.ok) { setModal({ open: false, form: {}, editMode: false, editId: null }); fetchProducts(); showMessage(t("products.productUpdated"), "success"); }
      else { const err = await res.json(); showMessage(err.message || t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const deleteProduct = async (id) => {
    if (confirm(t("products.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchProducts();
      showMessage(t("products.productDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("products.confirmBulkDelete").replace("{count}", selectedIds.length))) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`http://localhost:3001/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      fetchProducts();
      setSelectedIds([]);
      showMessage(t("products.productsImported").replace("{count}", selectedIds.length), "success");
    }
  };

  const importProducts = async (data) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ products: data })
      });
      const result = await res.json();
      if (res.ok) { showMessage(`${result.success} produit(s) importé(s)${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success"); fetchProducts(); }
      else showMessage(result.message || "Erreur lors de l'import", "error");
    } catch(e) { showMessage("Erreur de connexion lors de l'import", "error"); }
    finally { setImporting(false); }
  };

  const showMessage = (msg, type) => { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(""), 3000); };

  const openEditModal = (product) => {
    setModal({ open: true, editMode: true, editId: product.id, form: { name: product.name || "", sku: product.sku || "", price: product.price || 0, quantity: product.quantity || 0, categoryId: product.categoryId || "" } });
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return "-";
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return cat ? cat.name : "-";
  };

  const getStatusText = (qty) => {
    if (qty <= 0) return t("products.outOfStock");
    if (qty < 10) return t("products.lowStock");
    return t("products.inStock");
  };

  const getStatusColor = (qty) => {
    if (qty <= 0) return "#ef4444";
    if (qty < 10) return "#f59e0b";
    return "#10b981";
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "all" || String(p.categoryId) === String(selectedCategory);
    return matchSearch && matchCat;
  });

  const calculateTotalValue = (list) => list.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);

  const stats = {
    total: products.length,
    lowStock: products.filter(p => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length,
    outOfStock: products.filter(p => (p.quantity || 0) === 0).length,
    totalValue: calculateTotalValue(products)
  };

  const statsCards = [
    { Icon: IconBox,          label: t("products.totalProducts"), value: stats.total,                    color: theme.primary },
    { Icon: IconDollar,       label: t("products.totalValue"),    value: formatCurrency(stats.totalValue), color: theme.accent },
    { Icon: IconAlertTriangle,label: t("products.lowStock"),      value: stats.lowStock,                  color: stats.lowStock > 0 ? "#f59e0b" : theme.accent },
    { Icon: IconXCircle,      label: t("products.outOfStock"),    value: stats.outOfStock,                color: stats.outOfStock > 0 ? "#ef4444" : theme.accent },
  ];

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeInUp   { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn    { from { opacity:0; transform:translateX(-15px); } to { opacity:1; transform:translateX(0); } }
  `;

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: theme.textSecondary }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <style>{animations}</style>

          {/* ── Header ── */}
          <div style={{ marginBottom: sectionMargin, animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0, transform: animateCards ? "translateY(0)" : "translateY(-20px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconBox size={isMobile ? 22 : 28} />
                  {t("common.products")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("products.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {/* View toggle */}
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setViewMode("list")}
                    style={{ padding: "6px 12px", background: viewMode === "list" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: viewMode === "list" ? "white" : theme.text, cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "11px" : "13px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <IconList size={14} />
                    {!isMobile && (t("clients.listView") || "Liste")}
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    style={{ padding: "6px 12px", background: viewMode === "grid" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: viewMode === "grid" ? "white" : theme.text, cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "11px" : "13px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <IconGrid size={14} />
                    {!isMobile && (t("clients.gridView") || "Grille")}
                  </button>
                </div>
                <ImportButton onImport={importProducts} label={isMobile ? <IconBox size={14} /> : t("common.import")} />
                <ExportButtons data={filteredProducts} filename="produits" />
                <button
                  onClick={() => setModal({ open: true, editMode: false, form: { name: "", sku: "", price: 0, quantity: 0, categoryId: "" } })}
                  style={{ background: theme.gradient, color: "white", padding: buttonPadding, border: "none", borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <IconPlus size={16} />
                  {isMobile ? t("common.add").substring(0, 3) + "..." : t("common.add")}
                </button>
              </div>
            </div>
          </div>

          {/* ── Message ── */}
          {message && (
            <div style={{ background: messageType === "success" ? `${theme.accent}15` : "rgba(239,68,68,0.1)", border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`, color: messageType === "success" ? theme.accent : "#f87171", padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", animation: "fadeInUp 0.3s ease", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {messageType === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
              {message}
            </div>
          )}

          {/* ── Stats cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "160px" : "200px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{ background: theme.surface, borderRadius: cardRadius, padding: cardPadding, textAlign: "center", border: `1px solid ${theme.border}`, animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`, opacity: animateCards ? 1 : 0, transition: "transform 0.3s", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: card.color }}>
                  <card.Icon size={isMobile ? 28 : 32} />
                </div>
                <div style={{ fontSize: isMobile ? "22px" : "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* ── Filtres ── */}
          <div style={{ marginBottom: "20px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 2, position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "12px", color: theme.textSecondary, display: "flex" }}>
                  <IconSearch size={16} />
                </span>
                <input
                  type="text"
                  placeholder={`${t("common.search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px 10px 36px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "12px", color: theme.textSecondary, display: "flex", zIndex: 1, pointerEvents: "none" }}>
                  <IconFolder size={16} />
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ padding: "10px 12px 10px 36px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, minWidth: isMobile ? "100%" : "200px", cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
                >
                  <option value="all">{t("products.allCategories") || "Toutes les catégories"}</option>
                  {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox items={filteredProducts} selectedIds={selectedIds} onSelect={setSelectedIds} onSelectAll={(ids) => setSelectedIds(ids)} getItemId={(item) => item.id} />
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{ background: "#c33", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <IconTrash size={14} />
                  {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* ── Vue Liste ── */}
          {viewMode === "list" && (
            <div style={{ background: theme.surface, borderRadius: cardRadius, padding: "16px", border: `1px solid ${theme.border}`, overflowX: "auto", animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0 }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "600px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "10px", width: "40px" }}>
                        <input type="checkbox" checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} onChange={() => { if (selectedIds.length === filteredProducts.length) setSelectedIds([]); else setSelectedIds(filteredProducts.map(p => p.id)); }} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                      </th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                      {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>SKU</th>}
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.category")}</th>
                      <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.price")}</th>
                      <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.quantity")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, idx) => {
                      const statusColor = getStatusColor(p.quantity);
                      const isChecked = selectedIds.includes(p.id);
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.2s", animation: `slideIn 0.3s ease ${idx * 0.03}s` }} onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <input type="checkbox" checked={isChecked} onChange={() => { if (isChecked) setSelectedIds(selectedIds.filter(id => id !== p.id)); else setSelectedIds([...selectedIds, p.id]); }} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                          </td>
                          <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {p.quantity <= 0 ? (
                                <IconXCircle size={16} color="#ef4444" />
                              ) : p.quantity < 10 ? (
                                <IconAlertTriangle size={16} color="#f59e0b" />
                              ) : (
                                <IconPackage size={16} color="#10b981" />
                              )}
                              {p.name?.length > (isMobile ? 15 : 20) ? p.name.substring(0, isMobile ? 12 : 17) + "..." : p.name}
                            </div>
                          </td>
                          {!isMobile && <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{p.sku || "-"}</td>}
                          <td style={{ padding: "10px" }}>
                            <span style={{ background: `${theme.primary}20`, color: theme.primary, padding: "2px 8px", borderRadius: "12px", fontSize: statusFontSize }}>{getCategoryName(p.categoryId)}</span>
                          </td>
                          <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>{formatCurrency(p.price)}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: p.quantity < 10 ? "#f59e0b" : theme.text, fontSize: tableFontSize }}>{p.quantity || 0}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <span style={{ background: `${statusColor}20`, color: statusColor, padding: "2px 8px", borderRadius: "16px", fontSize: statusFontSize }}>{getStatusText(p.quantity)}</span>
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button onClick={() => openEditModal(p)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", transition: "opacity 0.2s", display: "flex", alignItems: "center" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"} title={t("common.edit")}>
                                <IconEdit size={13} />
                              </button>
                              <button onClick={() => deleteProduct(p.id)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", transition: "opacity 0.2s", display: "flex", alignItems: "center" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"} title={t("common.delete")}>
                                <IconTrash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: theme.textSecondary }}><IconBox size={isMobile ? 36 : 48} /></div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{searchTerm ? t("common.noResults") : t("common.noData")}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Vue Grille ── */}
          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`, gap: gridGap, animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0 }}>
              {filteredProducts.map((p, idx) => {
                const statusColor = getStatusColor(p.quantity);
                const stockIconColor = p.quantity <= 0 ? "#ef4444" : (p.quantity < 10 ? "#f59e0b" : "#10b981");
                return (
                  <div key={p.id} style={{ background: theme.surface, borderRadius: cardRadius, padding: "16px", border: `1px solid ${statusColor}`, transition: "transform 0.3s, box-shadow 0.3s", animation: `fadeInUp 0.3s ease ${idx * 0.05}s` }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ color: theme.primary, flexShrink: 0 }}>
                        {p.quantity <= 0 ? (
                          <IconXCircle size={isMobile ? 32 : 40} color="#ef4444" />
                        ) : p.quantity < 10 ? (
                          <IconAlertTriangle size={isMobile ? 32 : 40} color="#f59e0b" />
                        ) : (
                          <IconBox size={isMobile ? 32 : 40} />
                        )}
                      </div>
                      <div>
                        <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "13px" : "15px" }}>{p.name?.length > (isMobile ? 15 : 20) ? p.name.substring(0, isMobile ? 12 : 17) + "..." : p.name}</div>
                        <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{p.sku || t("products.noSku") || "Pas de SKU"}</div>
                      </div>
                    </div>
                    {[
                      { label: t("common.category"), value: getCategoryName(p.categoryId), style: { color: theme.primary, background: `${theme.primary}20`, padding: "2px 6px", borderRadius: "10px", fontSize: isMobile ? "9px" : "11px", fontWeight: "bold" } },
                      { label: t("common.price"), value: formatCurrency(p.price), style: { color: theme.accent, fontSize: isMobile ? "11px" : "13px", fontWeight: "bold" } },
                      { label: t("common.quantity"), value: `${p.quantity || 0}${!isMobile ? ` ${t("products.units") || "unités"}` : ""}`, style: { color: p.quantity < 10 ? "#f59e0b" : theme.text, fontSize: isMobile ? "11px" : "13px", fontWeight: "bold" } },
                      { label: t("common.status"), value: getStatusText(p.quantity), style: { color: statusColor, fontSize: isMobile ? "9px" : "11px" } },
                    ].map((row, i) => (
                      <div key={i} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{row.label}</span>
                        <span style={row.style}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", marginTop: "12px", gap: "6px" }}>
                      <button onClick={() => openEditModal(p)} style={{ flex: 1, padding: "6px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                        <IconEdit size={12} />{!isMobile && t("common.edit")}
                      </button>
                      <button onClick={() => deleteProduct(p.id)} style={{ flex: 1, padding: "6px", background: "#c33", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "10px" : "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                        <IconTrash size={12} />{!isMobile && t("common.delete")}
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: theme.textSecondary }}><IconBox size={isMobile ? 36 : 48} /></div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{searchTerm ? t("common.noResults") : t("common.noData")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "24px", width: modalWidth, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              {modal.editMode ? <IconEdit size={20} /> : <IconPlus size={20} />}
              {modal.editMode ? t("products.editProduct") : t("products.addProduct")}
            </h2>

            {[
              { label: `${t("common.name")} *`, key: "name", type: "text", placeholder: t("products.productName") },
              { label: "SKU", key: "sku", type: "text", placeholder: t("products.sku") },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: "14px" }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{label}</label>
                <input type={type} placeholder={placeholder} value={modal.form[key] || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, [key]: e.target.value } })} style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }} onFocus={(e) => e.currentTarget.style.borderColor = theme.primary} onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              </div>
            ))}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.category")}</label>
              <select value={modal.form.categoryId || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, categoryId: e.target.value } })} style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}>
                <option value="">{t("products.selectCategory") || "Sélectionner une catégorie"}</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.price")} *</label>
              <input type="number" step="0.01" placeholder={t("common.price")} value={modal.form.price || 0} onChange={(e) => setModal({ ...modal, form: { ...modal.form, price: parseFloat(e.target.value) || 0 } })} style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.quantity")}</label>
              <input type="number" placeholder={t("common.quantity")} value={modal.form.quantity || 0} onChange={(e) => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) || 0 } })} style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={modal.editMode ? updateProduct : createProduct} style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                <IconSave size={16} />
                {modal.editMode ? t("common.edit") : t("common.add")}
              </button>
              <button onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })} style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                <IconX size={16} />
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}