"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import ExportButtons from "@/components/ui/ExportButtons";
import AdvancedFilters from "@/components/ui/AdvancedFilters";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import Spinner from "@/components/ui/Spinner";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
);

// --- TYPES --------------------------------------------------------------------
interface ProductionOrder {
  id: number;
  orderNumber?: string;
  productName: string;
  quantity: number;
  priority: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  progress?: number;
  completedQuantity?: number;
}

interface ModalForm {
  productName: string;
  quantity: number;
  priority: string;
  assignedTo: string;
  startDate: string;
  status: string;
}

interface ModalState {
  open: boolean;
  form: ModalForm;
  editMode: boolean;
  editId: number | null;
}

// --- SelectAllCheckbox --------------------------------------------------------
function LocalSelectAllCheckbox({
  items,
  selectedIds,
  onSelect,
  onSelectAll,
  getItemId,
}: {
  items: ProductionOrder[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onSelectAll: (ids: number[]) => void;
  getItemId: (item: ProductionOrder) => number;
}) {
  const { language } = useLanguage();

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelect([]);
    } else {
      onSelectAll(items.map(getItemId));
    }
  };

  const getSelectAllText = () => {
    if (language === "fr") return "Tout sélectionner";
    if (language === "es") return "Seleccionar todo";
    return "Select all";
  };

  return (
    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={isAllSelected}
        ref={(input) => { if (input) input.indeterminate = isIndeterminate; }}
        onChange={handleSelectAll}
        style={{ width: "18px", height: "18px", cursor: "pointer" }}
      />
      <span style={{ color: "#94a3b8", fontSize: "13px" }}>{getSelectAllText()}</span>
    </label>
  );
}

// --- Utilitaires --------------------------------------------------------------
const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString();
};

// --- Page ---------------------------------------------------------------------
export default function ProductionPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  // -- FIX: typed state arrays ------------------------------------------------
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  // -- FIX: modal has complete typed initial state (editId included) ----------
  const emptyForm: ModalForm = {
    productName: "",
    quantity: 1,
    priority: "medium",
    assignedTo: "",
    startDate: "",
    status: "pending",
  };
  const [modal, setModal] = useState<ModalState>({
    open: false,
    form: emptyForm,
    editMode: false,
    editId: null,
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0,
    totalQuantity: 0, completedQuantity: 0, avgProgress: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchProductionOrders();
    fetchProducts();
    setTimeout(() => setAnimateCards(true), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProductionOrders = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/production/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data: ProductionOrder[] = await res.json();
      data = Array.isArray(data) ? data : [];
      setProductionOrders(data);

      const pending = data.filter((o) => o.status === "pending").length;
      const inProgress = data.filter((o) => o.status === "in_progress").length;
      const completed = data.filter((o) => o.status === "completed").length;
      const cancelled = data.filter((o) => o.status === "cancelled").length;
      const totalQuantity = data.reduce((s, o) => s + (Number(o.quantity) || 0), 0);
      const completedQuantity = data.reduce((s, o) => s + (Number(o.completedQuantity) || 0), 0);
      const avgProgress =
        data.length > 0
          ? Math.round(data.reduce((s, o) => s + (Number(o.progress) || 0), 0) / data.length)
          : 0;

      setStats({ total: data.length, pending, inProgress, completed, cancelled, totalQuantity, completedQuantity, avgProgress });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const createProductionOrder = async () => {
    const token = localStorage.getItem("token");
    try {
      if (!modal.form.productName || modal.form.productName.trim() === "") {
        showMessage(t("production.productRequired"), "error");
        return;
      }
      if (!modal.form.quantity || modal.form.quantity <= 0) {
        showMessage(t("production.quantityRequired"), "error");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/production/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productName: modal.form.productName,
          quantity: Number(modal.form.quantity),
          priority: modal.form.priority || "medium",
          assignedTo: modal.form.assignedTo || "",
          startDate: modal.form.startDate || null,
          status: "pending",
          progress: 0,
          completedQuantity: 0,
        }),
      });
      if (res.ok) {
        setModal({ open: false, form: emptyForm, editMode: false, editId: null });
        fetchProductionOrders();
        showMessage(t("production.orderCreated"), "success");
      } else {
        const error = await res.json();
        showMessage(error.message || t("common.error"), "error");
      }
    } catch (e) {
      showMessage(t("common.error"), "error");
    }
  };

  const updateProductionOrder = async () => {
    const token = localStorage.getItem("token");
    try {
      if (!modal.form.productName || modal.form.productName.trim() === "") {
        showMessage(t("production.productRequired"), "error");
        return;
      }
      if (!modal.form.quantity || modal.form.quantity <= 0) {
        showMessage(t("production.quantityRequired"), "error");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/production/orders/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productName: modal.form.productName,
          quantity: Number(modal.form.quantity),
          priority: modal.form.priority || "medium",
          assignedTo: modal.form.assignedTo || "",
          startDate: modal.form.startDate || null,
          status: modal.form.status || "pending",
        }),
      });
      if (res.ok) {
        setModal({ open: false, form: emptyForm, editMode: false, editId: null });
        fetchProductionOrders();
        showMessage(t("production.orderUpdated"), "success");
      } else {
        showMessage(t("common.error"), "error");
      }
    } catch (e) {
      showMessage(t("common.error"), "error");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/production/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchProductionOrders();
        showMessage(`? ${t("production.statusUpdated")}: ${getStatusText(status)}`, "success");
      } else {
        showMessage(t("common.error"), "error");
      }
    } catch (e) {
      console.error(e);
      showMessage(t("common.error"), "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateProgress = async (id: number, progress: number) => {
    const token = localStorage.getItem("token");
    setUpdatingProgress(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/production/orders/${id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ progress }),
      });
      if (res.ok) {
        await fetchProductionOrders();
        showMessage(`? ${t("production.progressUpdated")}: ${progress}%`, "success");
      } else {
        showMessage(t("common.error"), "error");
      }
    } catch (e) {
      console.error(e);
      showMessage(t("common.error"), "error");
    } finally {
      setUpdatingProgress(null);
    }
  };

  const deleteOrder = async (id: number) => {
    if (confirm(t("production.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/production/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProductionOrders();
      showMessage(t("production.orderDeleted"), "success");
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    // -- FIX: String.replace expects string, not number ---------------------
    if (confirm(t("production.confirmBulkDelete").replace("{count}", String(selectedIds.length)))) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/production/orders/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchProductionOrders();
      setSelectedIds([]);
      showMessage(t("production.ordersDeleted").replace("{count}", String(selectedIds.length)), "success");
    }
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (order: ProductionOrder) => {
    setModal({
      open: true,
      editMode: true,
      editId: order.id,
      form: {
        productName: order.productName || "",
        quantity: order.quantity || 1,
        priority: order.priority || "medium",
        assignedTo: order.assignedTo || "",
        startDate: order.startDate ? order.startDate.split("T")[0] : "",
        status: order.status || "pending",
      },
    });
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return theme.accent;
    if (status === "in_progress") return "#3b82f6";
    if (status === "pending") return "#f59e0b";
    if (status === "cancelled") return "#ef4444";
    return theme.textSecondary;
  };

  const getStatusText = (status: string) => {
    if (status === "completed") return t("production.completed");
    if (status === "in_progress") return t("production.inProgress");
    if (status === "pending") return t("production.pending");
    if (status === "cancelled") return t("production.cancelled");
    return status;
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") return "?";
    if (status === "in_progress") return "??";
    if (status === "pending") return "?";
    if (status === "cancelled") return "?";
    return "??";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "#ef4444";
    if (priority === "medium") return "#f59e0b";
    return theme.accent;
  };

  const getPriorityText = (priority: string) => {
    if (priority === "high") return t("production.high");
    if (priority === "medium") return t("production.medium");
    return t("production.low");
  };

  const filteredOrders = productionOrders.filter((o) => {
    const matchSearch =
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchPriority = filterPriority === "all" || o.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
  `;

  const statusChartData = {
    labels: [t("production.pending"), t("production.inProgress"), t("production.completed"), t("production.cancelled")],
    datasets: [{
      data: [stats.pending, stats.inProgress, stats.completed, stats.cancelled],
      backgroundColor: ["#f59e0b", "#3b82f6", theme.accent, "#ef4444"],
      borderWidth: 0,
    }],
  };

  const priorityChartData = {
    labels: [t("production.high"), t("production.medium"), t("production.low")],
    datasets: [{
      data: [
        productionOrders.filter((o) => o.priority === "high").length,
        productionOrders.filter((o) => o.priority === "medium").length,
        productionOrders.filter((o) => o.priority === "low").length,
      ],
      backgroundColor: ["#ef4444", "#f59e0b", theme.accent],
      borderWidth: 0,
    }],
  };

  // -- FIX: position typed as const to satisfy Chart.js ----------------------
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { color: theme.textSecondary, font: { size: 11 } },
        position: "bottom" as const,
      },
      tooltip: {
        backgroundColor: theme.surface,
        titleColor: theme.text,
        bodyColor: theme.textSecondary,
        borderColor: theme.primary,
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const statsCards = [
    { icon: "??", label: t("production.totalOrders"), value: formatNumber(stats.total), color: theme.primary },
    { icon: "?", label: t("production.pending"), value: formatNumber(stats.pending), color: stats.pending > 0 ? "#f59e0b" : theme.textSecondary },
    { icon: "??", label: t("production.inProgress"), value: formatNumber(stats.inProgress), color: stats.inProgress > 0 ? "#3b82f6" : theme.textSecondary },
    { icon: "?", label: t("production.completed"), value: formatNumber(stats.completed), color: stats.completed > 0 ? theme.accent : theme.textSecondary },
    { icon: "?", label: t("production.cancelled"), value: formatNumber(stats.cancelled), color: stats.cancelled > 0 ? "#ef4444" : theme.textSecondary },
    { icon: "??", label: t("production.totalUnits"), value: formatNumber(stats.totalQuantity), color: theme.primary },
    { icon: "?", label: t("production.producedUnits"), value: formatNumber(stats.completedQuantity), color: stats.completedQuantity > 0 ? theme.accent : theme.textSecondary },
    { icon: "??", label: t("production.avgProgress"), value: formatNumber(stats.avgProgress), suffix: "%", color: stats.avgProgress > 0 ? "#f59e0b" : theme.textSecondary },
  ];

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "0px", flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <style>{animations}</style>

          {/* Header */}
          <div style={{ marginBottom: "32px", animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0, transform: animateCards ? "translateY(0)" : "translateY(-20px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: "28px", }}>?? {t("common.production")}</h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px" }}>{t("production.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setViewMode("list")} style={{ padding: "8px 16px", background: viewMode === "list" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: "white", cursor: "pointer", transition: "all 0.2s" }}>
                    ?? {t("production.listView") || "Liste"}
                  </button>
                  <button onClick={() => setViewMode("grid")} style={{ padding: "8px 16px", background: viewMode === "grid" ? theme.primary : theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: "white", cursor: "pointer", transition: "all 0.2s" }}>
                    ??? {t("production.gridView") || "Grille"}
                  </button>
                </div>
                <ExportButtons data={filteredOrders} filename="production" />
                <button
                  onClick={() => setModal({ open: true, editMode: false, editId: null, form: { productName: "", quantity: 1, priority: "medium", assignedTo: "", startDate: "", status: "pending" } })}
                  style={{ background: theme.primary, color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  + {t("common.add")}
                </button>
              </div>
            </div>
          </div>

          {/* Notification */}
          {message && (
            <div style={{ background: messageType === "success" ? `rgba(16,185,129,0.1)` : `rgba(239,68,68,0.1)`, border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`, color: messageType === "success" ? "#10b981" : "#f87171", padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", animation: "fadeInUp 0.3s ease" }}>
              {message}
            </div>
          )}

          {/* 8 Cartes statistiques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "32px" }}>
            {statsCards.map((card, idx) => (
              <div key={idx}
                style={{ background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.surfaceHover} 100%)`, borderRadius: "16px", padding: "12px", textAlign: "center", border: `1px solid ${theme.border}`, animation: `fadeInUp 0.5s ease ${0.05 + idx * 0.02}s`, opacity: animateCards ? 1 : 0, transition: "transform 0.3s", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>{card.icon}</div>
                <div style={{ fontSize: "20px", color: card.color, fontWeight: "bold" }}>{card.value} {card.suffix || ""}</div>
                <div style={{ fontSize: "10px", color: theme.textSecondary }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", marginBottom: "32px", animation: `fadeInUp 0.5s ease 0.35s`, opacity: animateCards ? 1 : 0 }}>
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: "16px" }}>?? {t("production.statusDistribution")}</h3>
              <div style={{ height: "220px" }}>
                <Doughnut data={statusChartData} options={chartOptions} />
              </div>
            </div>
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: "16px" }}>?? {t("production.priorityDistribution")}</h3>
              <div style={{ height: "220px" }}>
                <Doughnut data={priorityChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div style={{ marginBottom: "20px", animation: `fadeInUp 0.5s ease 0.4s`, opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
              <input type="text" placeholder={`?? ${t("common.search")}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 2, padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s" }} onFocus={(e) => e.currentTarget.style.borderColor = theme.primary} onBlur={(e) => e.currentTarget.style.borderColor = theme.border} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, minWidth: "150px", cursor: "pointer" }}>
                <option value="all">?? {t("production.allStatus")}</option>
                <option value="pending">? {t("production.pending")}</option>
                <option value="in_progress">?? {t("production.inProgress")}</option>
                <option value="completed">? {t("production.completed")}</option>
                <option value="cancelled">? {t("production.cancelled")}</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, minWidth: "150px", cursor: "pointer" }}>
                <option value="all">?? {t("production.allPriorities")}</option>
                <option value="high">?? {t("production.high")}</option>
                <option value="medium">?? {t("production.medium")}</option>
                <option value="low">?? {t("production.low")}</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <LocalSelectAllCheckbox items={filteredOrders} selectedIds={selectedIds} onSelect={setSelectedIds} onSelectAll={(ids) => setSelectedIds(ids)} getItemId={(item) => item.id} />
              {selectedIds.length > 0 && (
                <button onClick={deleteSelected} style={{ background: "#c33", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                  ??? {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Vue Liste */}
          {viewMode === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredOrders.map((order, idx) => (
                <div key={order.id}
                  style={{ background: theme.surface, borderRadius: "20px", padding: "20px", border: `2px solid ${getPriorityColor(order.priority)}`, transition: "transform 0.3s, box-shadow 0.3s", animation: `slideIn 0.3s ease ${idx * 0.03}s` }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.3)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: theme.textSecondary, fontFamily: "monospace" }}>{order.orderNumber || `#${order.id}`}</div>
                      <div style={{ fontSize: "18px", color: theme.text, fontWeight: "bold" }}>{order.productName}</div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ background: getPriorityColor(order.priority) + "20", color: getPriorityColor(order.priority), padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "500" }}>
                        {getPriorityText(order.priority)}
                      </span>
                      <span style={{ background: getStatusColor(order.status) + "20", color: getStatusColor(order.status), padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "500" }}>
                        {getStatusIcon(order.status)} {getStatusText(order.status)}
                      </span>
                      <span style={{ color: theme.accent, fontSize: "16px", fontWeight: "bold" }}>{formatNumber(order.quantity)} {t("production.units")}</span>
                      <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} disabled={updatingStatus === order.id} style={{ background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "6px 12px", cursor: updatingStatus === order.id ? "wait" : "pointer", fontSize: "12px", opacity: updatingStatus === order.id ? 0.7 : 1 }}>
                        <option value="pending">? {t("production.pending")}</option>
                        <option value="in_progress">?? {t("production.inProgress")}</option>
                        <option value="completed">? {t("production.completed")}</option>
                        <option value="cancelled">? {t("production.cancelled")}</option>
                      </select>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => openEditModal(order)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"} title={t("common.edit")}>??</button>
                        <button onClick={() => deleteOrder(order.id)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"} title={t("common.delete")}>???</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: theme.textSecondary, fontSize: "12px" }}>{t("production.progress")}</span>
                      <span style={{ color: theme.accent, fontSize: "12px", fontWeight: "bold" }}>{order.progress || 0}%</span>
                    </div>
                    <div
                      style={{ background: theme.surfaceHover, borderRadius: "10px", height: "10px", overflow: "hidden", cursor: updatingProgress === order.id ? "wait" : "pointer", opacity: updatingProgress === order.id ? 0.7 : 1 }}
                      onClick={() => {
                        if (updatingProgress === order.id) return;
                        const newProgress = prompt(t("production.progressPrompt"), String(order.progress || 0));
                        // -- FIX: parse to number before comparisons --------
                        if (newProgress !== null) {
                          const parsed = parseInt(newProgress, 10);
                          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                            updateProgress(order.id, parsed);
                          }
                        }
                      }}
                    >
                      <div style={{ width: `${order.progress || 0}%`, background: theme.gradient, height: "100%", transition: "width 0.5s", borderRadius: "10px" }}></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ color: "#666", fontSize: "11px" }}>
                        ?? {t("production.startDate")}: {order.startDate ? new Date(order.startDate).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US") : "-"}
                      </span>
                      {order.endDate && (
                        <span style={{ color: "#666", fontSize: "11px" }}>
                          ?? {t("production.endDate")}: {new Date(order.endDate).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US")}
                        </span>
                      )}
                      {order.assignedTo && (
                        <span style={{ color: "#666", fontSize: "11px" }}>
                          ?? {t("production.assignedTo")}: {order.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px", background: theme.surface, borderRadius: "20px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>??</div>
                  <p style={{ color: theme.textSecondary }}>{searchTerm ? t("common.noResults") : t("production.noOrders")}</p>
                </div>
              )}
            </div>
          )}

          {/* Vue Grille */}
          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px", animation: `fadeInUp 0.5s ease 0.5s`, opacity: animateCards ? 1 : 0 }}>
              {filteredOrders.map((order, idx) => (
                <div key={order.id}
                  style={{ background: theme.surface, borderRadius: "16px", padding: "20px", border: `2px solid ${getPriorityColor(order.priority)}`, transition: "transform 0.3s, box-shadow 0.3s", animation: `fadeInUp 0.3s ease ${idx * 0.05}s` }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.3)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "32px" }}>??</div>
                    <div>
                      <div style={{ fontSize: "11px", color: theme.textSecondary, fontFamily: "monospace" }}>{order.orderNumber || `#${order.id}`}</div>
                      <div style={{ color: theme.text, fontWeight: "bold" }}>{order.productName}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.textSecondary, fontSize: "11px" }}>{t("production.quantity")}</span>
                    <span style={{ color: theme.accent, fontSize: "13px", fontWeight: "bold" }}>{formatNumber(order.quantity)} {t("production.units")}</span>
                  </div>
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.textSecondary, fontSize: "11px" }}>{t("production.priority")}</span>
                    <span style={{ color: getPriorityColor(order.priority), fontSize: "11px", fontWeight: "bold" }}>{getPriorityText(order.priority)}</span>
                  </div>
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.textSecondary, fontSize: "11px" }}>{t("common.status")}</span>
                    <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} disabled={updatingStatus === order.id} style={{ background: getStatusColor(order.status) + "20", color: getStatusColor(order.status), border: `1px solid ${getStatusColor(order.status)}`, borderRadius: "20px", padding: "4px 12px", cursor: updatingStatus === order.id ? "wait" : "pointer", fontSize: "11px", fontWeight: "500", opacity: updatingStatus === order.id ? 0.7 : 1 }}>
                      <option value="pending">? {t("production.pending")}</option>
                      <option value="in_progress">?? {t("production.inProgress")}</option>
                      <option value="completed">? {t("production.completed")}</option>
                      <option value="cancelled">? {t("production.cancelled")}</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ color: theme.textSecondary, fontSize: "10px" }}>{t("production.progress")}</span>
                      <span style={{ color: theme.accent, fontSize: "10px" }}>{order.progress || 0}%</span>
                    </div>
                    <div
                      style={{ background: theme.surfaceHover, borderRadius: "10px", height: "6px", overflow: "hidden", cursor: updatingProgress === order.id ? "wait" : "pointer", opacity: updatingProgress === order.id ? 0.7 : 1 }}
                      onClick={() => {
                        if (updatingProgress === order.id) return;
                        const newProgress = prompt(t("production.progressPrompt"), String(order.progress || 0));
                        if (newProgress !== null) {
                          const parsed = parseInt(newProgress, 10);
                          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                            updateProgress(order.id, parsed);
                          }
                        }
                      }}
                    >
                      <div style={{ width: `${order.progress || 0}%`, background: theme.gradient, height: "100%", transition: "width 0.5s" }}></div>
                    </div>
                  </div>
                  <div style={{ marginBottom: "16px", fontSize: "10px", color: "#666" }}>
                    {order.assignedTo && <div>?? {order.assignedTo}</div>}
                    <div>?? {order.startDate ? new Date(order.startDate).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US") : "-"}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openEditModal(order)} style={{ flex: 1, padding: "8px", background: "#f59e0b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                      ?? {t("common.edit")}
                    </button>
                    <button onClick={() => deleteOrder(order.id)} style={{ flex: 1, padding: "8px", background: "#c33", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                      ??? {t("common.delete")}
                    </button>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px", gridColumn: "1 / -1", background: theme.surface, borderRadius: "16px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>??</div>
                  <p style={{ color: theme.textSecondary }}>{searchTerm ? t("common.noResults") : t("production.noOrders")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: theme.surface, padding: "32px", borderRadius: "24px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "24px" }}>
              {modal.editMode ? `?? ${t("production.editOrder")}` : `?? ${t("production.addOrder")}`}
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px" }}>{t("common.product")} *</label>
              <input type="text" placeholder={t("production.productName")} value={modal.form.productName || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, productName: e.target.value } })} style={{ width: "100%", padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s" }} onFocus={(e) => e.currentTarget.style.borderColor = theme.primary} onBlur={(e) => e.currentTarget.style.borderColor = theme.border} autoFocus />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px" }}>{t("production.quantity")} *</label>
              <input type="number" placeholder="0" value={modal.form.quantity || 1} onChange={(e) => setModal({ ...modal, form: { ...modal.form, quantity: parseInt(e.target.value) || 1 } })} style={{ width: "100%", padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text }} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px" }}>{t("production.priority")}</label>
              <select value={modal.form.priority || "medium"} onChange={(e) => setModal({ ...modal, form: { ...modal.form, priority: e.target.value } })} style={{ width: "100%", padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer" }}>
                <option value="low">?? {t("production.low")}</option>
                <option value="medium">?? {t("production.medium")}</option>
                <option value="high">?? {t("production.high")}</option>
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px" }}>{t("production.assignedTo")}</label>
              <input type="text" placeholder={t("production.operatorName")} value={modal.form.assignedTo || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, assignedTo: e.target.value } })} style={{ width: "100%", padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text }} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px" }}>{t("production.startDate")}</label>
              <input type="date" value={modal.form.startDate || ""} onChange={(e) => setModal({ ...modal, form: { ...modal.form, startDate: e.target.value } })} style={{ width: "100%", padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={modal.editMode ? updateProductionOrder : createProductionOrder} style={{ flex: 1, padding: "12px", background: theme.primary, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "500", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                ?? {modal.editMode ? t("common.edit") : t("common.add")}
              </button>
              <button onClick={() => setModal({ open: false, form: emptyForm, editMode: false, editId: null })} style={{ flex: 1, padding: "12px", background: theme.surfaceHover, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

