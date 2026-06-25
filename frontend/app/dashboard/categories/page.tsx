"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";

// -- SVG Icons ----------------------------------------------
const IconTag = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconFolder = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconBox = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
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
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconSearch = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconAlertTriangle = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconEye = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconSave = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

// -- Types --------------------------------------------------
interface Category {
  id: number | string;
  name: string;
  description?: string;
  productCount?: number;
  [key: string]: any;
}

interface Product {
  id: number | string;
  name: string;
  categoryId?: number | string;
  quantity?: number;
  price?: number | string;
  sku?: string;
  [key: string]: any;
}

interface ModalState {
  open: boolean;
  form: { name?: string; description?: string; [key: string]: any };
  editMode: boolean;
  editId?: number | string | null;
}

// -- Page principale ----------------------------------------
export default function CategoriesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // Margin left pour desktop (sidebar fixe)
  const contentMarginLeft = isMobile ? "0" : "0px";

  // Traduction directe pour totalProducts
  const getTotalProductsLabel = () => {
    switch(language) {
      case 'fr':
        return 'Produits totaux';
      case 'es':
        return 'Productos totales';
      default:
        return 'Total products';
    }
  };

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "16px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const modalWidth = isMobile ? "95%" : "450px";
  const modalPadding = isMobile ? "20px" : "32px";
  const productsModalWidth = isMobile ? "95%" : "800px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const buttonPadding = isMobile ? "6px 12px" : "8px 16px";

  const getProductCountForCategory = (categoryId) =>
    products.filter(p => p.categoryId === categoryId).length;

  const getProductsForCategory = (categoryId) =>
    products.filter(p => p.categoryId === categoryId);

  const getStockStatusText = (quantity) => {
    if (quantity <= 0) return t("products.outOfStock") || "Rupture";
    if (quantity < 10) return t("products.lowStock") || "Stock faible";
    return t("products.inStock") || "En stock";
  };

  const getStockStatusColor = (quantity) => {
    if (quantity <= 0) return "#ef4444";
    if (quantity < 10) return "#f59e0b";
    return "#10b981";
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchCategories();
    fetchAllProducts();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      setCategories(prev => prev.map(cat => ({ ...cat, productCount: getProductCountForCategory(cat.id) })));
    }
  }, [products]);

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const categoriesData = Array.isArray(data) ? data : [];
      setCategories(categoriesData.map(cat => ({ ...cat, productCount: getProductCountForCategory(cat.id) })));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchAllProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  const createCategory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        await fetchCategories(); await fetchAllProducts();
        showMessage(t("categories.categoryCreated"), "success");
      } else {
        const error = await res.json();
        showMessage(error.message?.includes("already exists") ? t("categories.categoryExists") : t("common.error"), "error");
      }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const updateCategory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        await fetchCategories();
        showMessage(t("categories.categoryUpdated"), "success");
      } else {
        const error = await res.json();
        showMessage(error.message?.includes("already exists") ? t("categories.categoryExists") : t("common.error"), "error");
      }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const deleteCategory = async (id, hasProducts = false) => {
    if (hasProducts) { showMessage(t("categories.cannotDelete"), "error"); return; }
    if (confirm(t("categories.confirmDelete"))) {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { await fetchCategories(); showMessage(t("categories.categoryDeleted"), "success"); }
      else {
        const error = await res.json();
        showMessage(error.message?.includes("products") ? t("categories.cannotDelete") : t("common.error"), "error");
      }
    }
  };

  const viewCategoryProducts = (category) => {
    setSelectedCategory(category);
    setCategoryProducts(getProductsForCategory(category.id));
    setShowProductsModal(true);
  };

  const navigateToCategoryProducts = (categoryId, categoryName) => {
    sessionStorage.setItem("selectedCategoryId", categoryId);
    sessionStorage.setItem("selectedCategoryName", categoryName);
    router.push("/dashboard/products");
  };

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (category) => {
    setModal({ open: true, editMode: true, editId: category.id, form: { name: category.name || "", description: category.description || "" } });
  };

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProductsInCategories = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const activeCategories = categories.filter(c => (c.productCount || 0) > 0).length;

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeInUp   { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
    @keyframes slideIn    { from { opacity:0; transform:translateX(-15px); } to { opacity:1; transform:translateX(0); } }
  `;

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: isMobile ? "40px" : "48px", height: isMobile ? "40px" : "48px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: isMobile ? "12px" : "14px", color: theme.textSecondary }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
      <div style={{ 
        marginLeft: contentMarginLeft, 
        flex: 1, 
        padding: isMobile ? "12px" : "24px", 
        paddingBottom: isMobile ? "70px" : "24px",
        overflowX: "hidden", 
        background: theme.background 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          <style>{animations}</style>

          {/* -- Header -- */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sectionMargin, flexWrap: "wrap", gap: "16px", animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0, transform: animateCards ? "translateY(0)" : "translateY(-20px)" }}>
            <div>
              <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                <IconTag size={isMobile ? 22 : 28} />
                {t("common.categories")}
              </h1>
              <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("categories.subtitle")}</p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setViewMode("list")}
                  style={{ padding: buttonPadding, background: viewMode === "list" ? theme.primary : theme.surfaceHover, border: `1px solid ${viewMode === "list" ? theme.primary : theme.border}`, borderRadius: "8px", color: viewMode === "list" ? "white" : theme.text, cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "11px" : "13px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <IconList size={14} />
                  {!isMobile && (t("clients.listView") || "Liste")}
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  style={{ padding: buttonPadding, background: viewMode === "grid" ? theme.primary : theme.surfaceHover, border: `1px solid ${viewMode === "grid" ? theme.primary : theme.border}`, borderRadius: "8px", color: viewMode === "grid" ? "white" : theme.text, cursor: "pointer", transition: "all 0.2s", fontSize: isMobile ? "11px" : "13px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <IconGrid size={14} />
                  {!isMobile && (t("clients.gridView") || "Grille")}
                </button>
              </div>
              <button
                onClick={() => setModal({ open: true, editMode: false, form: { name: "", description: "" } })}
                style={{ background: theme.gradient, color: "white", padding: isMobile ? "8px 16px" : "12px 24px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "500", transition: "transform 0.2s, opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <IconPlus size={16} />
                {isMobile ? t("categories.addCategory").substring(0, 8) + "..." : t("categories.addCategory")}
              </button>
            </div>
          </div>

          {/* -- Message -- */}
          {message && (
            <div style={{ background: messageType === "success" ? `${theme.accent}15` : "rgba(239,68,68,0.1)", border: `1px solid ${messageType === "success" ? theme.accent : "#ef4444"}`, color: messageType === "success" ? theme.accent : "#f87171", padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", animation: "fadeInUp 0.3s ease", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {messageType === "success" ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
              {message}
            </div>
          )}

          {/* -- Recherche -- */}
          <div style={{ marginBottom: "20px", animation: "fadeInUp 0.5s ease 0.2s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: "12px", color: theme.textSecondary, display: "flex" }}>
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                placeholder={`${t("common.search")}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "12px 12px 12px 38px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px" }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
              />
            </div>
          </div>

          {/* -- Stats -- */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "150px" : "200px"}, 1fr))`, gap: "16px", marginBottom: "24px", animation: "fadeInUp 0.5s ease 0.3s", opacity: animateCards ? 1 : 0 }}>
            {[
              { Icon: IconFolder, value: categories.length,          color: theme.primary, label: t("categories.totalCategories") },
              { Icon: IconTag,    value: activeCategories,           color: theme.accent,  label: t("categories.activeCategories") },
              { Icon: IconBox,    value: totalProductsInCategories,  color: "#f59e0b",     label: getTotalProductsLabel() },
            ].map(({ Icon, value, color, label }, i) => (
              <div key={i} style={{ background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.surfaceHover} 100%)`, borderRadius: cardRadius, padding: "16px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color }}>
                  <Icon size={isMobile ? 24 : 28} />
                </div>
                <div style={{ fontSize: isMobile ? "20px" : "24px", color, fontWeight: "bold" }}>{value}</div>
                <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>{label}</div>
              </div>
            ))}
          </div>

          {/* -- Vue Liste -- */}
          {viewMode === "list" && (
            <div style={{ background: theme.surface, borderRadius: cardRadius, padding: "16px", border: `1px solid ${theme.border}`, overflowX: "auto", animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0 }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "500px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                      <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("categories.description")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("categories.productCount")}</th>
                      <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((c, idx) => {
                      const hasProducts = (c.productCount || 0) > 0;
                      return (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.2s", animation: `slideIn 0.3s ease ${idx * 0.03}s` }} onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "10px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>{c.name}</td>
                          <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{c.description || "-"}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <span
                              style={{ background: hasProducts ? `${theme.accent}20` : "transparent", color: hasProducts ? theme.accent : theme.textSecondary, padding: "2px 10px", borderRadius: "20px", fontSize: tableFontSize, cursor: hasProducts ? "pointer" : "default", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              onClick={() => hasProducts && viewCategoryProducts(c)}
                            >
                              <IconBox size={12} /> {c.productCount || 0}
                            </span>
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button onClick={() => navigateToCategoryProducts(c.id, c.name)} style={{ background: theme.primary, color: "white", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", transition: "opacity 0.2s", display: "flex", alignItems: "center" }} title={t("categories.viewProducts")} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                                <IconEye size={13} />
                              </button>
                              <button onClick={() => openEditModal(c)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", transition: "opacity 0.2s", display: "flex", alignItems: "center" }} title={t("common.edit")} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                                <IconEdit size={13} />
                              </button>
                              <button onClick={() => deleteCategory(c.id, hasProducts)} style={{ background: hasProducts ? theme.borderHover : "#c33", color: "white", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: hasProducts ? "not-allowed" : "pointer", transition: "opacity 0.2s", opacity: hasProducts ? 0.5 : 1, display: "flex", alignItems: "center" }} title={hasProducts ? t("categories.cannotDelete") : t("common.delete")} disabled={hasProducts}>
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
              {filteredCategories.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: theme.textSecondary }}><IconTag size={isMobile ? 36 : 48} /></div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>{searchTerm ? t("common.noResults") : t("categories.noCategories")}</p>
                </div>
              )}
            </div>
          )}

          {/* -- Vue Grille -- */}
          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "280px" : "350px"}, 1fr))`, gap: gridGap, marginBottom: "20px" }}>
              {filteredCategories.map((c, idx) => {
                const hasProducts = (c.productCount || 0) > 0;
                return (
                  <div key={c.id} style={{ background: theme.surface, borderRadius: cardRadius, padding: cardPadding, border: `1px solid ${hasProducts ? `${theme.primary}40` : theme.border}`, transition: "transform 0.2s, box-shadow 0.2s", animation: `fadeInUp 0.3s ease ${idx * 0.05}s`, cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ color: theme.primary }}><IconTag size={isMobile ? 32 : 40} /></div>
                      {hasProducts && (
                        <div
                          style={{ background: `${theme.accent}20`, padding: "4px 10px", borderRadius: "20px", fontSize: isMobile ? "10px" : "11px", color: theme.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                          onClick={(e) => { e.stopPropagation(); viewCategoryProducts(c); }}
                        >
                          <IconBox size={12} />
                          {c.productCount} {!isMobile && t("common.products")}
                        </div>
                      )}
                    </div>
                    <h3 style={{ color: theme.text, fontSize: isMobile ? "16px" : "18px", marginBottom: "8px" }}>{c.name}</h3>
                    <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "13px", marginBottom: "16px", minHeight: "40px" }}>
                      {c.description || t("categories.noDescription")}
                    </p>

                    {hasProducts && (
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "10px" }}>{t("categories.productsInCategory")}</span>
                          <span style={{ color: theme.accent, fontSize: isMobile ? "9px" : "10px", fontWeight: "bold" }}>{c.productCount}</span>
                        </div>
                        <div style={{ background: theme.surfaceHover, borderRadius: "10px", height: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(((c.productCount ?? 0) / 50) * 100, 100)}%`, background: theme.accent, height: "4px", borderRadius: "10px", transition: "width 0.5s" }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateToCategoryProducts(c.id, c.name); }}
                        style={{ flex: 1, padding: "8px", background: theme.primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "11px" : "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        <IconEye size={13} />
                        {!isMobile && t("categories.viewProducts")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(c); }}
                        style={{ padding: "8px 12px", background: "#f59e0b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", transition: "opacity 0.2s", display: "flex", alignItems: "center" }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCategory(c.id, hasProducts); }}
                        style={{ padding: "8px 12px", background: hasProducts ? theme.borderHover : "#c33", color: "white", border: "none", borderRadius: "8px", cursor: hasProducts ? "not-allowed" : "pointer", transition: "opacity 0.2s", opacity: hasProducts ? 0.5 : 1, display: "flex", alignItems: "center" }}
                        title={hasProducts ? t("categories.cannotDelete") : t("common.delete")}
                        disabled={hasProducts}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>

                    {hasProducts && (
                      <div style={{ marginTop: "8px", fontSize: isMobile ? "9px" : "10px", color: "#f59e0b", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <IconAlertTriangle size={11} />
                        {t("categories.hasProductsWarning")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* -- Empty state -- */}
          {filteredCategories.length === 0 && viewMode === "grid" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "40px", textAlign: "center", border: `1px solid ${theme.border}`, animation: "fadeInUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: theme.textSecondary }}><IconTag size={isMobile ? 36 : 48} /></div>
              <p style={{ color: theme.textSecondary, marginBottom: "20px", fontSize: isMobile ? "12px" : "14px" }}>
                {searchTerm ? t("common.noResults") : t("categories.noCategories")}
              </p>
              {!searchTerm && (
                <button onClick={() => setModal({ open: true, editMode: false, form: { name: "", description: "" } })} style={{ background: theme.gradient, color: "white", padding: "8px 16px", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: isMobile ? "12px" : "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <IconPlus size={14} /> {t("categories.addCategory")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* -- Modal Ajout/Modification -- */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px" }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "24px", width: modalWidth, maxWidth: "95%", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "18px" : "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              {modal.editMode ? <IconEdit size={20} /> : <IconPlus size={20} />}
              {modal.editMode ? t("categories.editCategory") : t("categories.addCategory")}
            </h2>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("common.name")} *</label>
              <input type="text" placeholder={t("categories.categoryName")} value={modal.form.name || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px" }} onFocus={(e) => e.currentTarget.style.borderColor = theme.primary} onBlur={(e) => e.currentTarget.style.borderColor = theme.border} autoFocus />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "14px" }}>{t("categories.description")}</label>
              <textarea placeholder={t("categories.description")} value={modal.form.description || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, description: e.target.value } })} rows={3} style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, resize: "vertical", fontSize: isMobile ? "13px" : "14px" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={modal.editMode ? updateCategory : createCategory} style={{ flex: 1, padding: "10px", background: theme.gradient, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                <IconSave size={16} />
                {modal.editMode ? t("common.edit") : t("common.add")}
              </button>
              <button onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })} style={{ flex: 1, padding: "10px", background: theme.surfaceHover, color: theme.text, border: "none", borderRadius: "10px", cursor: "pointer", transition: "opacity 0.2s", fontSize: isMobile ? "13px" : "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                <IconX size={16} />
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Modal Produits de la cat�gorie -- */}
      {showProductsModal && selectedCategory && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, animation: "fadeIn 0.2s ease", padding: "16px" }}>
          <div style={{ background: theme.surface, padding: "20px", borderRadius: "24px", width: productsModalWidth, maxWidth: "95%", maxHeight: "80vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ color: theme.text, fontSize: isMobile ? "16px" : "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <IconBox size={isMobile ? 16 : 20} />
                {t("categories.productsIn")} "{selectedCategory.name}"
              </h2>
              <button onClick={() => setShowProductsModal(false)} style={{ background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: isMobile ? "12px" : "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconX size={14} /> {t("common.close")}
              </button>
            </div>

            {categoryProducts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {categoryProducts.map((product, idx) => {
                  const statusColor = getStockStatusColor(product.quantity);
                  return (
                    <div key={product.id} style={{ background: theme.surfaceHover, borderRadius: "12px", padding: "12px", animation: `slideIn 0.3s ease ${idx * 0.05}s`, borderLeft: `4px solid ${statusColor}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "13px" : "16px" }}>{product.name}</div>
                          <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px", marginTop: "4px" }}>SKU: {product.sku || "-"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "13px" : "16px" }}>{product.price} �</div>
                          <div style={{ color: statusColor, fontSize: isMobile ? "10px" : "12px", marginTop: "4px" }}>
                            {getStockStatusText(product.quantity)} ({product.quantity || 0} {!isMobile && t("products.units")})
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: "12px" }}>
                        <button onClick={() => { setShowProductsModal(false); navigateToCategoryProducts(selectedCategory.id, selectedCategory.name); }} style={{ padding: "6px 12px", background: theme.primary, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: isMobile ? "10px" : "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <IconEye size={12} /> {t("categories.viewAllProducts")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: theme.textSecondary }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}><IconBox size={isMobile ? 36 : 48} /></div>
                <p style={{ fontSize: isMobile ? "12px" : "14px" }}>{t("categories.noProductsInCategory")}</p>
              </div>
            )}

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button onClick={() => { setShowProductsModal(false); navigateToCategoryProducts(selectedCategory.id, selectedCategory.name); }} style={{ padding: "10px 20px", background: theme.primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: isMobile ? "12px" : "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconEye size={16} /> {t("categories.viewAllProductsIn")} {selectedCategory.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}