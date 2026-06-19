"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number | string;
  name: string;
  sku?: string;
  price?: number;
  quantity?: number;
  [key: string]: any;
}

interface Sale {
  id: number;
  productId: number;
  quantity: number;
  total: number;
  createdAt: string;
}

interface Purchase {
  id: number;
  productId: number;
  quantity: number;
  total: number;
  createdAt: string;
}

interface StockMovement {
  productId: number;
  productName: string;
  quantity: number;
  type: "in" | "out";
  date: string;
  reference: string;
}

interface ProductWithStock extends Product {
  currentStock: number;
}

// ─── Icon Components ─────────────────────────────────────────────────────────────
const IconBox = ({ size = 20, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/>
    <path d="M12 22V12"/>
  </svg>
);

const IconTrendingUp = ({ size = 16, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconAlertTriangle = ({ size = 20, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const IconBan = ({ size = 20, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m4.9 4.9 14.2 14.2"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);

const IconBarChart = ({ size = 20, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconRefresh = ({ size = 16, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconSearch = ({ size = 16, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconFilter = ({ size = 16, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconHistory = ({ size = 16, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
    <path d="M4 4v6h6"/>
  </svg>
);

const IconX = ({ size = 16, color = "currentColor", style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Traductions ──────────────────────────────────────────────────────────────
const stockTranslations: Record<string, Record<string, string>> = {
  fr: {
    title: "Gestion du Stock",
    subtitle: "Stock basé sur les achats et ventes",
    totalProducts: "Total produits",
    totalValue: "Valeur totale",
    lowStock: "Stock faible",
    outOfStock: "Rupture",
    stockTurnover: "Rotation stock",
    thisWeek: "Cette semaine",
    thisMonth: "Ce mois",
    thisYear: "Cette année",
    allTime: "Tout",
    refresh: "Actualiser",
    searchPlaceholder: "Rechercher un produit...",
    filterAll: "Tous les produits",
    filterWell: "Stock élevé (≥10)",
    filterLow: "Stock faible (<10)",
    filterOut: "Rupture (=0)",
    product: "Produit",
    sku: "SKU",
    price: "Prix",
    stock: "Stock",
    value: "Valeur",
    status: "Statut",
    history: "Historique",
    noResults: "Aucun résultat",
    noProducts: "Aucun produit dans le stock",
    movementsTitle: "Mouvements de stock",
    date: "Date",
    type: "Type",
    quantity: "Quantité",
    reference: "Référence",
    entry: "Entrée",
    exit: "Sortie",
    noMovements: "Aucun mouvement pour ce produit",
    periodAnalyzed: "Période analysée",
    last7Days: "7 derniers jours",
    last30Days: "30 derniers jours",
    last12Months: "12 derniers mois",
    allData: "Toutes les données",
    salesCount: "ventes",
    purchasesCount: "achats",
    stockStatus: "Statut du stock",
    outOfStockStatus: "Rupture",
    lowStockStatus: "Stock faible",
    mediumStockStatus: "Stock moyen",
    highStockStatus: "Stock élevé",
    outOfStockDesc: "Nécessite un réapprovisionnement urgent",
    lowStockDesc: "À réapprovisionner bientôt",
    mediumStockDesc: "Stock suffisant",
    highStockDesc: "Stock confortable",
    legend: "Légende des statuts de stock",
    infoMessage: "ℹ️ Le stock est calculé automatiquement à partir des achats et des ventes.",
    close: "Fermer"
  },
  es: {
    title: "Gestión de Stock",
    subtitle: "Stock basado en compras y ventas",
    totalProducts: "Total productos",
    totalValue: "Valor total",
    lowStock: "Stock bajo",
    outOfStock: "Agotado",
    stockTurnover: "Rotación stock",
    thisWeek: "Esta semana",
    thisMonth: "Este mes",
    thisYear: "Este año",
    allTime: "Todo",
    refresh: "Actualizar",
    searchPlaceholder: "Buscar producto...",
    filterAll: "Todos los productos",
    filterWell: "Stock alto (≥10)",
    filterLow: "Stock bajo (<10)",
    filterOut: "Agotado (=0)",
    product: "Producto",
    sku: "SKU",
    price: "Precio",
    stock: "Stock",
    value: "Valor",
    status: "Estado",
    history: "Historial",
    noResults: "Sin resultados",
    noProducts: "No hay productos en stock",
    movementsTitle: "Movimientos de stock",
    date: "Fecha",
    type: "Tipo",
    quantity: "Cantidad",
    reference: "Referencia",
    entry: "Entrada",
    exit: "Salida",
    noMovements: "No hay movimientos para este producto",
    periodAnalyzed: "Período analizado",
    last7Days: "últimos 7 días",
    last30Days: "últimos 30 días",
    last12Months: "últimos 12 meses",
    allData: "Todos los datos",
    salesCount: "ventas",
    purchasesCount: "compras",
    stockStatus: "Estado del stock",
    outOfStockStatus: "Agotado",
    lowStockStatus: "Stock bajo",
    mediumStockStatus: "Stock medio",
    highStockStatus: "Stock alto",
    outOfStockDesc: "Requiere reabastecimiento urgente",
    lowStockDesc: "Reabastecer pronto",
    mediumStockDesc: "Stock suficiente",
    highStockDesc: "Stock confortable",
    legend: "Leyenda de estados de stock",
    infoMessage: "ℹ️ El stock se calcula automáticamente a partir de compras y ventas.",
    close: "Cerrar"
  },
  en: {
    title: "Stock Management",
    subtitle: "Stock based on purchases and sales",
    totalProducts: "Total products",
    totalValue: "Total value",
    lowStock: "Low stock",
    outOfStock: "Out of stock",
    stockTurnover: "Stock turnover",
    thisWeek: "This week",
    thisMonth: "This month",
    thisYear: "This year",
    allTime: "All time",
    refresh: "Refresh",
    searchPlaceholder: "Search product...",
    filterAll: "All products",
    filterWell: "High stock (≥10)",
    filterLow: "Low stock (<10)",
    filterOut: "Out of stock (=0)",
    product: "Product",
    sku: "SKU",
    price: "Price",
    stock: "Stock",
    value: "Value",
    status: "Status",
    history: "History",
    noResults: "No results",
    noProducts: "No products in stock",
    movementsTitle: "Stock movements",
    date: "Date",
    type: "Type",
    quantity: "Quantity",
    reference: "Reference",
    entry: "In",
    exit: "Out",
    noMovements: "No movements for this product",
    periodAnalyzed: "Period analyzed",
    last7Days: "last 7 days",
    last30Days: "last 30 days",
    last12Months: "last 12 months",
    allData: "All data",
    salesCount: "sales",
    purchasesCount: "purchases",
    stockStatus: "Stock status",
    outOfStockStatus: "Out of stock",
    lowStockStatus: "Low stock",
    mediumStockStatus: "Medium stock",
    highStockStatus: "High stock",
    outOfStockDesc: "Requires urgent restocking",
    lowStockDesc: "Restock soon",
    mediumStockDesc: "Sufficient stock",
    highStockDesc: "Comfortable stock",
    legend: "Stock status legend",
    infoMessage: "ℹ️ Stock is automatically calculated from purchases and sales.",
    close: "Close"
  }
};

export default function StockPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile } = useResponsive();
  const { theme } = useTheme();
  
  const t = stockTranslations[language] || stockTranslations.fr;
  
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showMovements, setShowMovements] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [stats, setStats] = useState({ total: 0, value: 0, lowStock: 0, outOfStock: 0, turnover: 0 });
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year" | "all">("all");
  const [showInfo, setShowInfo] = useState(true);

  const contentMarginLeft = isMobile ? "0" : "0px";
  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "16px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const statusFontSize = isMobile ? "10px" : "12px";
  const legendFontSize = isMobile ? "10px" : "12px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchAllData();
    setTimeout(() => setAnimateCards(true), 100);
  }, [selectedPeriod]);

  const fetchAllData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      // 1. Récupérer les produits (stock initial)
      const productsRes = await fetch("http://localhost:3001/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      const productsList: Product[] = Array.isArray(productsData) ? productsData : [];
      
      // 2. Récupérer les ventes
      const salesRes = await fetch("http://localhost:3001/sales", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let salesData = await salesRes.json();
      let salesList: Sale[] = Array.isArray(salesData) ? salesData : [];
      
      // 3. Récupérer les achats
      const purchasesRes = await fetch("http://localhost:3001/purchases", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let purchasesData = await purchasesRes.json();
      let purchasesList: Purchase[] = Array.isArray(purchasesData) ? purchasesData : [];
      
      // Filtrer par période
      const now = new Date();
      let startDate: Date | null = null;
      if (selectedPeriod === "week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (selectedPeriod === "month") {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      } else if (selectedPeriod === "year") {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      if (startDate) {
        salesList = salesList.filter(s => new Date(s.createdAt) >= startDate!);
        purchasesList = purchasesList.filter(p => new Date(p.createdAt) >= startDate!);
      }
      
      setSales(salesList);
      setPurchases(purchasesList);
      
      // ✅ CALCUL DU STOCK CORRECT
      // On commence par le stock initial des produits (quantity dans la table products)
      const productStockMap: Record<number, { quantity: number; product: Product }> = {};
      
      productsList.forEach(p => {
        productStockMap[p.id as number] = {
          quantity: p.quantity || 0, // Stock initial depuis la base
          product: p
        };
      });
      
      // Ajouter les achats (augmentent le stock)
      purchasesList.forEach(purchase => {
        if (productStockMap[purchase.productId]) {
          productStockMap[purchase.productId].quantity += purchase.quantity;
        }
      });
      
      // Soustraire les ventes (diminuent le stock)
      salesList.forEach(sale => {
        if (productStockMap[sale.productId]) {
          productStockMap[sale.productId].quantity -= sale.quantity;
        }
      });
      
      // Construire les mouvements
      const movements: StockMovement[] = [];
      
      purchasesList.forEach(purchase => {
        const product = productsList.find(p => p.id === purchase.productId);
        if (product) {
          movements.push({
            productId: purchase.productId,
            productName: product.name,
            quantity: purchase.quantity,
            type: "in",
            date: purchase.createdAt,
            reference: `Achat #${purchase.id}`
          });
        }
      });
      
      salesList.forEach(sale => {
        const product = productsList.find(p => p.id === sale.productId);
        if (product) {
          movements.push({
            productId: sale.productId,
            productName: product.name,
            quantity: sale.quantity,
            type: "out",
            date: sale.createdAt,
            reference: `Vente #${sale.id}`
          });
        }
      });
      
      movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setStockMovements(movements);
      
      // Mettre à jour les produits avec leur stock calculé
      const updatedProducts: ProductWithStock[] = productsList.map(p => ({
        ...p,
        currentStock: Math.max(0, productStockMap[p.id as number]?.quantity || 0)
      }));
      
      setProducts(updatedProducts);
      
      // Calculer les stats
      const totalSalesQuantity = salesList.reduce((sum, s) => sum + s.quantity, 0);
      const avgStock = updatedProducts.reduce((sum, p) => sum + p.currentStock, 0) / (updatedProducts.length || 1);
      const turnoverRate = avgStock > 0 ? (totalSalesQuantity / avgStock) : 0;
      
      const totalValue = updatedProducts.reduce((sum, p) => sum + ((p.price || 0) * p.currentStock), 0);
      const lowStockCount = updatedProducts.filter(p => p.currentStock < 10 && p.currentStock > 0).length;
      const outOfStockCount = updatedProducts.filter(p => p.currentStock === 0).length;
      
      setStats({
        total: updatedProducts.length,
        value: totalValue,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        turnover: turnoverRate
      });
      
    } catch(e) { 
      console.error("Erreur:", e); 
    }
    setLoading(false);
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return {
      text: t.outOfStockStatus,
      color: "#ef4444",
      icon: <IconBan size={13} color="#ef4444" />,
      bgColor: "rgba(239,68,68,0.1)"
    };
    if (quantity < 10) return {
      text: t.lowStockStatus,
      color: "#f59e0b",
      icon: <IconAlertTriangle size={13} color="#f59e0b" />,
      bgColor: "rgba(245,158,11,0.1)"
    };
    if (quantity < 50) return {
      text: t.mediumStockStatus,
      color: theme.primary,
      icon: <IconBox size={13} color={theme.primary} />,
      bgColor: `${theme.primary}15`
    };
    return {
      text: t.highStockStatus,
      color: theme.accent,
      icon: <IconCheckCircle size={13} color={theme.accent} />,
      bgColor: `${theme.accent}15`
    };
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (filterStatus === "low") matchesStatus = p.currentStock < 10 && p.currentStock > 0;
    if (filterStatus === "out") matchesStatus = p.currentStock === 0;
    if (filterStatus === "well") matchesStatus = p.currentStock >= 10;
    return matchesSearch && matchesStatus;
  });

  const getProductMovements = (productId: number) => {
    return stockMovements.filter(m => m.productId === productId).slice(0, 10);
  };

  const periodButtons = [
    { value: "week", label: t.thisWeek },
    { value: "month", label: t.thisMonth },
    { value: "year", label: t.thisYear },
    { value: "all", label: t.allTime }
  ];

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; overflow: hidden; }
    .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    @media (max-width: 768px) { .card-hover:hover { transform: translateY(-2px); } }
  `;

  const statsCards = [
    { icon: <IconBox size={isMobile ? 28 : 32} color={theme.primary} />, label: t.totalProducts, value: stats.total, color: theme.primary },
    { icon: <IconCurrencyDollar size={isMobile ? 28 : 32} color={theme.accent} />, label: t.totalValue, value: formatCurrency(stats.value), color: theme.accent },
    { icon: <IconAlertTriangle size={isMobile ? 28 : 32} color={stats.lowStock > 0 ? "#f59e0b" : theme.accent} />, label: t.lowStock, value: stats.lowStock, color: stats.lowStock > 0 ? "#f59e0b" : theme.accent },
    { icon: <IconBan size={isMobile ? 28 : 32} color={stats.outOfStock > 0 ? "#ef4444" : theme.accent} />, label: t.outOfStock, value: stats.outOfStock, color: stats.outOfStock > 0 ? "#ef4444" : theme.accent },
    { icon: <IconTrendingUp size={isMobile ? 24 : 28} color="#10b981" />, label: t.stockTurnover, value: stats.turnover.toFixed(1), color: "#10b981" }
  ];

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <IconLoader size={isMobile ? 40 : 48} color={theme.primary} />
          <p style={{ color: theme.textSecondary, marginTop: "16px" }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: contentMarginLeft, padding: isMobile ? "12px" : "24px", paddingBottom: isMobile ? "70px" : "24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <style>{animations}</style>

          {/* Header */}
          <div style={{ marginBottom: sectionMargin, animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: headerTitleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconBarChart size={isMobile ? 22 : 28} color={theme.primary} />
                  {t.title}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>
                  {t.subtitle}
                </p>
              </div>
              <button onClick={() => fetchAllData()} style={{ padding: "8px 16px", background: `${theme.primary}15`, border: `1px solid ${theme.primary}30`, borderRadius: "10px", color: theme.primary, cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <IconRefresh size={14} /> {t.refresh}
              </button>
            </div>
          </div>

          {/* Info Banner */}
          {showInfo && (
            <div style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}30`, borderRadius: "12px", padding: "12px 16px", marginBottom: sectionMargin, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", animation: "fadeInUp 0.5s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                <IconBox size={20} color={theme.primary} />
                <span style={{ color: theme.text, fontSize: isMobile ? "11px" : "13px" }}>{t.infoMessage}</span>
              </div>
              <button onClick={() => setShowInfo(false)} style={{ background: "transparent", border: "none", color: theme.textSecondary, cursor: "pointer", padding: "4px" }}><IconX size={14} /></button>
            </div>
          )}

          {/* Period selector */}
          <div style={{ marginBottom: sectionMargin, display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", animation: "fadeInUp 0.5s ease 0.1s", opacity: animateCards ? 1 : 0 }}>
            {periodButtons.map(period => (
              <button key={period.value} onClick={() => setSelectedPeriod(period.value as any)} style={{ padding: isMobile ? "6px 12px" : "8px 20px", background: selectedPeriod === period.value ? theme.primary : "transparent", border: `1px solid ${selectedPeriod === period.value ? theme.primary : theme.border}`, borderRadius: "20px", color: selectedPeriod === period.value ? "white" : theme.textSecondary, cursor: "pointer", fontSize: isMobile ? "11px" : "13px" }}>
                {period.label}
              </button>
            ))}
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "140px" : "180px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {statsCards.map((card, idx) => (
              <div key={idx} className="card-hover" style={{ background: theme.surface, borderRadius: cardRadius, padding: cardPadding, textAlign: "center", border: `1px solid ${theme.border}`, animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`, opacity: animateCards ? 1 : 0 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "20px" : "26px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Period info */}
          <div style={{ background: theme.surface, borderRadius: cardRadius, padding: "16px", marginBottom: sectionMargin, border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <IconHistory size={20} color={theme.primary} />
              <span style={{ color: theme.text }}><strong>{t.periodAnalyzed} :</strong> {selectedPeriod === "week" ? t.last7Days : selectedPeriod === "month" ? t.last30Days : selectedPeriod === "year" ? t.last12Months : t.allData}</span>
              <span style={{ color: theme.textSecondary, marginLeft: "auto" }}>📊 {sales.length} {t.salesCount} • {purchases.length} {t.purchasesCount}</span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 2, position: "relative" }}>
                <IconSearch size={15} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 36px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, fontSize: isMobile ? "13px" : "14px" }} />
              </div>
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "180px" }}>
                <IconFilter size={14} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 32px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}>
                  <option value="all">{t.filterAll}</option>
                  <option value="well">{t.filterWell}</option>
                  <option value="low">{t.filterLow}</option>
                  <option value="out">{t.filterOut}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div style={{ background: theme.surface, borderRadius: cardRadius, padding: "16px", border: `1px solid ${theme.border}`, overflowX: "auto" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "600px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>{t.product}</th>
                    {!isMobile && <th style={{ padding: "10px", textAlign: "left" }}>{t.sku}</th>}
                    <th style={{ padding: "10px", textAlign: "right" }}>{t.price}</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>{t.stock}</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>{t.value}</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>{t.status}</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, idx) => {
                    const status = getStockStatus(p.currentStock);
                    const value = (p.price || 0) * p.currentStock;
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${theme.surfaceHover}` }}>
                        <td style={{ padding: "10px", color: theme.text }}>{p.name}</td>
                        {!isMobile && <td style={{ padding: "10px", color: theme.textSecondary }}>{p.sku || "-"}</td>}
                        <td style={{ padding: "10px", textAlign: "right", color: theme.accent }}>{formatCurrency(p.price || 0)}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: status.color, fontWeight: "bold" }}>{p.currentStock}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary }}>{formatCurrency(value)}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span style={{ background: status.bgColor, color: status.color, padding: "3px 8px", borderRadius: "16px", fontSize: statusFontSize, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            {status.icon}
                            {!isMobile && status.text}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button onClick={() => { setSelectedProduct(p); setShowMovements(true); }} style={{ background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "6px 12px", color: theme.textSecondary, cursor: "pointer", fontSize: isMobile ? "10px" : "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <IconHistory size={12} />
                            {!isMobile && t.history}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <IconBox size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block" }} />
                <p style={{ color: theme.textSecondary }}>{searchTerm ? t.noResults : t.noProducts}</p>
              </div>
            )}
          </div>

          {/* Stock Movements Modal */}
          {showMovements && selectedProduct && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
              <div style={{ background: theme.surface, borderRadius: "20px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ color: theme.text, margin: 0 }}>{t.movementsTitle} - {selectedProduct.name}</h3>
                  <button onClick={() => { setShowMovements(false); setSelectedProduct(null); }} style={{ background: "none", border: "none", color: theme.textSecondary, fontSize: "20px", cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                  {getProductMovements(selectedProduct.id as number).length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                          <th style={{ padding: "8px", textAlign: "left" }}>{t.date}</th>
                          <th style={{ padding: "8px", textAlign: "left" }}>{t.type}</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>{t.quantity}</th>
                          <th style={{ padding: "8px", textAlign: "left" }}>{t.reference}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getProductMovements(selectedProduct.id as number).map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.surfaceHover}` }}>
                            <td style={{ padding: "8px", color: theme.textSecondary, fontSize: "12px" }}>{new Date(m.date).toLocaleDateString()}</td>
                            <td style={{ padding: "8px" }}><span style={{ background: m.type === "in" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: m.type === "in" ? "#10b981" : "#ef4444", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{m.type === "in" ? `📥 ${t.entry}` : `📤 ${t.exit}`}</span></td>
                            <td style={{ padding: "8px", textAlign: "right", color: m.type === "in" ? "#10b981" : "#ef4444" }}>{m.quantity}</td>
                            <td style={{ padding: "8px", color: theme.textSecondary, fontSize: "12px" }}>{m.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p style={{ textAlign: "center", color: theme.textSecondary, padding: "40px" }}>{t.noMovements}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: "24px", padding: "16px", background: theme.surface, borderRadius: cardRadius, border: `1px solid ${theme.border}` }}>
            <h4 style={{ color: theme.text, fontSize: isMobile ? "12px" : "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>{t.legend}</h4>
            <div style={{ display: "flex", gap: isMobile ? "12px" : "24px", flexWrap: "wrap" }}>
              {[
                { icon: <IconBan size={12} color="#ef4444" />, label: t.outOfStockStatus, desc: t.outOfStockDesc, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
                { icon: <IconAlertTriangle size={12} color="#f59e0b" />, label: t.lowStockStatus, desc: t.lowStockDesc, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
                { icon: <IconBox size={12} color={theme.primary} />, label: t.mediumStockStatus, desc: t.mediumStockDesc, color: theme.primary, bg: `${theme.primary}15` },
                { icon: <IconCheckCircle size={12} color={theme.accent} />, label: t.highStockStatus, desc: t.highStockDesc, color: theme.accent, bg: `${theme.accent}15` }
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ background: item.bg, color: item.color, padding: "2px 8px", borderRadius: "16px", fontSize: legendFontSize, display: "inline-flex", alignItems: "center", gap: "4px" }}>{item.icon} {item.label}</span>
                  <span style={{ fontSize: isMobile ? "9px" : "11px", color: theme.textSecondary }}>→ {item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}