"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";

// ─── SVG Icon Components ───────────────────────────────────────────────────────

const IconBox = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/>
    <path d="M12 22V12"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);

const IconAlertTriangle = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const IconBan = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m4.9 4.9 14.2 14.2"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconSearch = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconFilter = ({ size = 16, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconEdit = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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

const IconBarChart = ({ size = 20, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
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

const IconRefreshCcw = ({ size = 14, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 2v6h6"/>
    <path d="M21 12A9 9 0 0 0 6 5.3L3 8"/>
    <path d="M21 22v-6h-6"/>
    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/>
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StockPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState({ total: 0, value: 0, lowStock: 0, outOfStock: 0 });
  const [animateCards, setAnimateCards] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  const headerTitleSize = isMobile ? "22px" : "28px";
  const cardPadding = isMobile ? "16px" : "20px";
  const cardRadius = isMobile ? "14px" : "16px";
  const gridGap = isMobile ? "12px" : "20px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const statusFontSize = isMobile ? "10px" : "12px";
  const buttonPadding = isMobile ? "4px 8px" : "6px 12px";
  const legendFontSize = isMobile ? "10px" : "12px";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchProducts();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const productsData = Array.isArray(data) ? data : [];
      setProducts(productsData);

      const totalValue = productsData.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
      const lowStockCount = productsData.filter(p => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
      const outOfStockCount = productsData.filter(p => (p.quantity || 0) === 0).length;

      setStats({
        total: productsData.length,
        value: totalValue,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const updateStock = async (id, newQuantity) => {
    if (newQuantity < 0) {
      showMessage(t("stock.negativeQuantity") || "La quantité ne peut pas être négative", "error");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const product = products.find(p => p.id === id);
      const res = await fetch(`http://localhost:3001/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...product, quantity: newQuantity })
      });
      if (res.ok) {
        fetchProducts();
        showMessage(t("stock.stockUpdated") || "Stock mis à jour avec succès !", "success");
        setEditingStock(null);
      } else {
        showMessage(t("common.error"), "error");
      }
    } catch(e) {
      showMessage(t("common.error"), "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0) return {
      text: t("stock.outOfStock"),
      color: "#ef4444",
      icon: <IconBan size={13} color="#ef4444" />,
      bgColor: "rgba(239,68,68,0.1)"
    };
    if (quantity < 10) return {
      text: t("stock.lowStock"),
      color: "#f59e0b",
      icon: <IconAlertTriangle size={13} color="#f59e0b" />,
      bgColor: "rgba(245,158,11,0.1)"
    };
    if (quantity < 50) return {
      text: t("stock.mediumStock"),
      color: theme.primary,
      icon: <IconBox size={13} color={theme.primary} />,
      bgColor: `${theme.primary}15`
    };
    return {
      text: t("stock.highStock"),
      color: theme.accent,
      icon: <IconCheckCircle size={13} color={theme.accent} />,
      bgColor: `${theme.accent}15`
    };
  };

  const getStockLevelClass = (quantity) => {
    if (quantity <= 0) return "critical";
    if (quantity < 10) return "warning";
    return "normal";
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (filterStatus === "low") matchesStatus = (p.quantity || 0) < 10 && (p.quantity || 0) > 0;
    if (filterStatus === "out") matchesStatus = (p.quantity || 0) === 0;
    if (filterStatus === "well") matchesStatus = (p.quantity || 0) >= 10;
    return matchesSearch && matchesStatus;
  });

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
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .card-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    }
    @media (max-width: 768px) {
      .card-hover:hover { transform: translateY(-2px); }
    }
  `;

  const statsCards = [
    {
      icon: <IconBox size={isMobile ? 28 : 32} color={theme.primary} />,
      label: t("stock.totalProducts"),
      value: stats.total,
      color: theme.primary
    },
    {
      icon: <IconCurrencyDollar size={isMobile ? 28 : 32} color={theme.accent} />,
      label: t("stock.totalValue"),
      value: formatCurrency(stats.value),
      color: theme.accent
    },
    {
      icon: <IconAlertTriangle size={isMobile ? 28 : 32} color={stats.lowStock > 0 ? "#f59e0b" : theme.accent} />,
      label: t("stock.lowStock"),
      value: stats.lowStock,
      color: stats.lowStock > 0 ? "#f59e0b" : theme.accent
    },
    {
      icon: <IconBan size={isMobile ? 28 : 32} color={stats.outOfStock > 0 ? "#ef4444" : theme.accent} />,
      label: t("stock.outOfStock"),
      value: stats.outOfStock,
      color: stats.outOfStock > 0 ? "#ef4444" : theme.accent
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
        marginLeft: isMobile ? "0px" : "280px",
        flex: 1,
        padding: isMobile ? "12px" : "24px",
        overflowX: "hidden"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>

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
                  <IconBarChart size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("stock.title")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("stock.subtitle")}</p>
              </div>
              <ExportButtons data={filteredProducts} filename="stock" />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              background: messageType === "success" ? `${theme.accent}10` : "rgba(239,68,68,0.1)",
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
                : <IconBan size={16} color="#f87171" />}
              {message}
            </div>
          )}

          {/* 4 Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "150px" : "200px"}, 1fr))`, gap: gridGap, marginBottom: sectionMargin }}>
            {statsCards.map((card, idx) => (
              <div key={idx} className="card-hover" style={{
                background: theme.surface,
                borderRadius: cardRadius,
                padding: cardPadding,
                textAlign: "center",
                border: `1px solid ${theme.border}`,
                animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`,
                opacity: animateCards ? 1 : 0
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>{card.icon}</div>
                <div style={{ fontSize: isMobile ? "22px" : "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? "10px" : "12px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{
            marginBottom: "20px",
            animation: "fadeInUp 0.5s ease 0.4s",
            opacity: animateCards ? 1 : 0
          }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
              {/* Search */}
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
                    background: theme.surface,
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

              {/* Filter select */}
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "180px" }}>
                <IconFilter size={14} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 32px",
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    color: theme.text,
                    cursor: "pointer",
                    fontSize: isMobile ? "13px" : "14px",
                    appearance: "none"
                  }}
                >
                  <option value="all">{t("stock.allProducts")}</option>
                  <option value="well">{t("stock.highStock")}</option>
                  <option value="low">{t("stock.lowStock")}</option>
                  <option value="out">{t("stock.outOfStock")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: theme.surface,
            borderRadius: cardRadius,
            padding: "16px",
            border: `1px solid ${theme.border}`,
            overflowX: "auto",
            animation: "fadeInUp 0.5s ease 0.5s",
            opacity: animateCards ? 1 : 0
          }}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "600px" : "100%" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>{t("common.name")}</th>
                    {!isMobile && <th style={{ padding: "10px", textAlign: "left", fontSize: tableFontSize }}>SKU</th>}
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.price")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("common.quantity")}</th>
                    <th style={{ padding: "10px", textAlign: "right", fontSize: tableFontSize }}>{t("stock.stockValue")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.status")}</th>
                    <th style={{ padding: "10px", textAlign: "center", fontSize: tableFontSize }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, idx) => {
                    const status = getStockStatus(p.quantity || 0);
                    const value = (p.price || 0) * (p.quantity || 0);
                    const stockLevel = getStockLevelClass(p.quantity || 0);

                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: `1px solid ${theme.surfaceHover}`,
                          transition: "background 0.2s",
                          animation: `slideIn 0.3s ease ${idx * 0.03}s`
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "10px", color: theme.text, fontWeight: stockLevel === "critical" ? "bold" : "normal", fontSize: tableFontSize }}>{p.name}</td>
                        {!isMobile && <td style={{ padding: "10px", color: theme.textSecondary, fontSize: tableFontSize }}>{p.sku || "-"}</td>}
                        <td style={{ padding: "10px", textAlign: "right", color: theme.accent, fontSize: tableFontSize }}>{formatCurrency(p.price)}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: status.color, fontWeight: "bold", fontSize: tableFontSize }}>
                          {editingStock === p.id ? (
                            <input
                              type="number"
                              defaultValue={p.quantity || 0}
                              onBlur={(e) => updateStock(p.id, parseInt(e.target.value) || 0)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") updateStock(p.id, parseInt(e.target.value) || 0);
                              }}
                              autoFocus
                              style={{
                                width: isMobile ? "60px" : "80px",
                                padding: "4px 6px",
                                background: theme.surfaceHover,
                                border: `1px solid ${status.color}`,
                                borderRadius: "6px",
                                color: theme.text,
                                textAlign: "center",
                                fontSize: tableFontSize
                              }}
                            />
                          ) : (
                            <span style={{ cursor: "pointer" }} onClick={() => setEditingStock(p.id)}>
                              {p.quantity || 0}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right", color: theme.textSecondary, fontSize: tableFontSize }}>{formatCurrency(value)}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span style={{
                            background: status.bgColor,
                            color: status.color,
                            padding: "3px 8px",
                            borderRadius: "16px",
                            fontSize: statusFontSize,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {status.icon}
                            {!isMobile && status.text}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            onClick={() => setEditingStock(p.id)}
                            style={{
                              background: editingStock === p.id ? theme.accent : theme.primary,
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: buttonPadding,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: isMobile ? "10px" : "12px"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          >
                            {editingStock === p.id
                              ? <IconSave size={13} color="white" />
                              : <IconEdit size={13} color="white" />}
                            {!isMobile && (editingStock === p.id ? t("common.save") : t("stock.updateStock"))}
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
                <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                  {searchTerm ? t("common.noResults") : t("stock.noProducts")}
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: "24px",
            padding: "16px",
            background: theme.surface,
            borderRadius: cardRadius,
            border: `1px solid ${theme.border}`,
            animation: "fadeInUp 0.5s ease 0.6s",
            opacity: animateCards ? 1 : 0
          }}>
            <h4 style={{ color: theme.text, fontSize: isMobile ? "12px" : "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <IconList size={14} color={theme.textSecondary} />
              {t("stock.stockLegend") || "Légende des statuts"}
            </h4>
            <div style={{ display: "flex", gap: isMobile ? "12px" : "24px", flexWrap: "wrap" }}>
              {[
                {
                  icon: <IconBan size={12} color="#ef4444" />,
                  label: t("stock.outOfStock"),
                  desc: t("stock.needsReorder") || "Nécessite un réapprovisionnement",
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.1)"
                },
                {
                  icon: <IconAlertTriangle size={12} color="#f59e0b" />,
                  label: t("stock.lowStock"),
                  desc: t("stock.reorderSoon") || "À réapprovisionner bientôt",
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.1)"
                },
                {
                  icon: <IconBox size={12} color={theme.primary} />,
                  label: t("stock.mediumStock"),
                  desc: t("stock.stockOk") || "Stock suffisant",
                  color: theme.primary,
                  bg: `${theme.primary}15`
                },
                {
                  icon: <IconCheckCircle size={12} color={theme.accent} />,
                  label: t("stock.highStock"),
                  desc: t("stock.stockExcess") || "Stock élevé",
                  color: theme.accent,
                  bg: `${theme.accent}15`
                }
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{
                    background: item.bg,
                    color: item.color,
                    padding: "2px 8px",
                    borderRadius: "16px",
                    fontSize: legendFontSize,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    {item.icon} {item.label}
                  </span>
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