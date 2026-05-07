"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
} from "chart.js";
import { Bar, Line, Doughnut, Radar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler, RadialLinearScale
);

// ─── SVG Icon Components ───────────────────────────────────────────────────────
const Icon = ({ children, size = 18, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

const Icons = {
  BarChart2: ({ size, style }) => <Icon size={size} style={style}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Icon>,
  TrendingUp: ({ size, style }) => <Icon size={size} style={style}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Icon>,
  Donut: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></Icon>,
  PieChart: ({ size, style }) => <Icon size={size} style={style}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></Icon>,
  Radar: ({ size, style }) => <Icon size={size} style={style}><polygon points="12 2 19 8.5 19 15.5 12 22 5 15.5 5 8.5"/><polygon points="12 6 16 9.5 16 14.5 12 18 8 14.5 8 9.5"/><circle cx="12" cy="12" r="1.5"/></Icon>,
  DollarSign: ({ size, style }) => <Icon size={size} style={style}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>,
  ShoppingCart: ({ size, style }) => <Icon size={size} style={style}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></Icon>,
  Package: ({ size, style }) => <Icon size={size} style={style}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Icon>,
  Users: ({ size, style }) => <Icon size={size} style={style}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  FileText: ({ size, style }) => <Icon size={size} style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Icon>,
  Receipt: ({ size, style }) => <Icon size={size} style={style}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></Icon>,
  Briefcase: ({ size, style }) => <Icon size={size} style={style}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Icon>,
  Truck: ({ size, style }) => <Icon size={size} style={style}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Icon>,
  Activity: ({ size, style }) => <Icon size={size} style={style}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>,
  AlertTriangle: ({ size, style }) => <Icon size={size} style={style}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>,
  AlertCircle: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>,
  Info: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Icon>,
  Plus: ({ size, style }) => <Icon size={size} style={style}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>,
  X: ({ size, style }) => <Icon size={size} style={style}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>,
  Eye: ({ size, style }) => <Icon size={size} style={style}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>,
  CheckCircle: ({ size, style }) => <Icon size={size} style={style}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>,
  Clock: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  Award: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Icon>,
  Star: ({ size, style }) => <Icon size={size} style={style}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>,
  Target: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>,
  RefreshCw: ({ size, style }) => <Icon size={size} style={style}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Icon>,
  Globe: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>,
  Loader: ({ size, style }) => <Icon size={size} style={style}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></Icon>,
  Calendar: ({ size, style }) => <Icon size={size} style={style}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>,
  Ban: ({ size, style }) => <Icon size={size} style={style}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Icon>,
  ArrowUpRight: ({ size, style }) => <Icon size={size} style={style}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></Icon>,
  Cpu: ({ size, style }) => <Icon size={size} style={style}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></Icon>,
  UserCheck: ({ size, style }) => <Icon size={size} style={style}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></Icon>,
  UserPlus: ({ size, style }) => <Icon size={size} style={style}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></Icon>,
  Layers: ({ size, style }) => <Icon size={size} style={style}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>,
  Inbox: ({ size, style }) => <Icon size={size} style={style}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Icon>,
  CheckSquare: ({ size, style }) => <Icon size={size} style={style}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Icon>,
  Zap: ({ size, style }) => <Icon size={size} style={style}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
};

// ─── Custom Chart Modal ────────────────────────────────────────────────────────
function CustomChartModal({ isOpen, onClose, onCreate, modulesData, trends, topProducts, topClients, t, formatCurrency, theme }) {
  const [config, setConfig] = useState({
    title: "",
    type: "bar",
    module: "sales",
    dataType: "total",
    period: "month",
    compare: false
  });
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState("");

  const generateRealData = (module, dataType, period, compare = false) => {
    let labels = [];
    let dataValues = [];
    let compareValues = [];

    if (period === "week") {
      labels = [t("analytics.mon"), t("analytics.tue"), t("analytics.wed"), t("analytics.thu"), t("analytics.fri"), t("analytics.sat"), t("analytics.sun")];
    } else if (period === "month") {
      labels = [t("analytics.jan"), t("analytics.feb"), t("analytics.mar"), t("analytics.apr"), t("analytics.may"), t("analytics.jun"), t("analytics.jul"), t("analytics.aug"), t("analytics.sep"), t("analytics.oct"), t("analytics.nov"), t("analytics.dec")];
    } else if (period === "quarter") {
      labels = [t("analytics.q1"), t("analytics.q2"), t("analytics.q3"), t("analytics.q4")];
    } else if (period === "year") {
      labels = ["2021", "2022", "2023", "2024"];
    } else {
      labels = [t("analytics.jan"), t("analytics.feb"), t("analytics.mar"), t("analytics.apr"), t("analytics.may"), t("analytics.jun")];
    }

    switch(module) {
      case "sales":
        if (dataType === "total") dataValues = [modulesData.sales?.total || 0];
        else if (dataType === "trend") dataValues = trends.length > 0 ? trends.map(t => t.sales) : [0, 0, 0, 0, 0, 0];
        else if (dataType === "count") dataValues = [modulesData.sales?.count || 0];
        else if (dataType === "average") dataValues = [modulesData.sales?.average || 0];
        break;
      case "purchases":
        if (dataType === "total") dataValues = [modulesData.purchases?.total || 0];
        else if (dataType === "count") dataValues = [modulesData.purchases?.count || 0];
        else if (dataType === "average") dataValues = [modulesData.purchases?.average || 0];
        break;
      case "products":
        if (dataType === "evolution") {
          labels = topProducts.length > 0 ? topProducts.map(p => p.name) : [t("analytics.productA"), t("analytics.productB"), t("analytics.productC")];
          dataValues = topProducts.length > 0 ? topProducts.map(p => p.amount) : [0, 0, 0];
        } else if (dataType === "stock") {
          labels = [t("analytics.totalStock"), t("analytics.lowStock"), t("analytics.outOfStock")];
          dataValues = [modulesData.products?.total || 0, modulesData.products?.lowStock || 0, modulesData.products?.outOfStock || 0];
        } else if (dataType === "value") dataValues = [modulesData.products?.totalValue || 0];
        break;
      case "clients":
        if (dataType === "top") {
          labels = topClients.length > 0 ? topClients.map(c => c.name) : [t("analytics.clientA"), t("analytics.clientB"), t("analytics.clientC")];
          dataValues = topClients.length > 0 ? topClients.map(c => c.amount) : [0, 0, 0];
        } else if (dataType === "status") {
          labels = [t("analytics.active"), t("analytics.inactive"), t("analytics.new")];
          dataValues = [modulesData.clients?.active || 0, (modulesData.clients?.total || 0) - (modulesData.clients?.active || 0), modulesData.clients?.new || 0];
        } else if (dataType === "total") dataValues = [modulesData.clients?.total || 0];
        break;
      case "orders":
        if (dataType === "status") {
          labels = [t("analytics.pending"), t("analytics.processing"), t("analytics.completed"), t("analytics.cancelled")];
          dataValues = [modulesData.orders?.pending || 0, modulesData.orders?.processing || 0, modulesData.orders?.completed || 0, modulesData.orders?.cancelled || 0];
        } else if (dataType === "total") dataValues = [modulesData.orders?.total || 0];
        else if (dataType === "evolution") dataValues = [0, 0, 0, 0, 0, 0];
        break;
      case "invoices":
        if (dataType === "status") {
          labels = [t("analytics.paid"), t("analytics.unpaid"), t("analytics.overdue")];
          dataValues = [modulesData.invoices?.paid || 0, modulesData.invoices?.pending || 0, modulesData.invoices?.overdue || 0];
        } else if (dataType === "amount") dataValues = [modulesData.invoices?.totalAmount || 0];
        else if (dataType === "evolution") dataValues = [0, 0, 0, 0, 0, 0];
        break;
      case "employees":
        if (dataType === "status") {
          labels = [t("analytics.active"), t("analytics.onLeave"), t("analytics.inactive")];
          dataValues = [modulesData.employees?.active || 0, modulesData.employees?.onLeave || 0, modulesData.employees?.inactive || 0];
        } else if (dataType === "payroll") dataValues = [modulesData.employees?.totalPayroll || 0];
        else if (dataType === "total") dataValues = [modulesData.employees?.total || 0];
        break;
      case "logistics":
        if (dataType === "status") {
          labels = [t("analytics.delivered"), t("analytics.inTransit"), t("analytics.pending")];
          dataValues = [modulesData.logistics?.delivered || 0, modulesData.logistics?.inTransit || 0, modulesData.logistics?.pending || 0];
        } else if (dataType === "performance") dataValues = [modulesData.logistics?.onTime || 0];
        else if (dataType === "total") dataValues = [modulesData.logistics?.total || 0];
        break;
      default:
        labels = [t("analytics.data1"), t("analytics.data2"), t("analytics.data3")];
        dataValues = [0, 0, 0];
    }

    if (compare && compareValues.length > 0) return { labels, dataValues, compareValues };
    return { labels, dataValues };
  };

  useEffect(() => {
    if (isOpen) {
      const { labels, dataValues, compareValues } = generateRealData(config.module, config.dataType, config.period, config.compare);
      const datasets = [{
        label: getFieldLabel(config.module, config.dataType),
        data: dataValues,
        backgroundColor: config.type === "line" ? `${theme.primary}20` : [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6"],
        borderColor: theme.primary,
        borderWidth: 2,
        fill: config.type === "line",
        tension: 0.4,
        pointBackgroundColor: config.type === "line" ? theme.primary : undefined,
        pointBorderColor: config.type === "line" ? theme.text : undefined,
        pointRadius: config.type === "line" ? 4 : undefined,
        pointHoverRadius: config.type === "line" ? 6 : undefined
      }];
      if (config.compare && compareValues && compareValues.length > 0) {
        datasets.push({
          label: `${getFieldLabel(config.module, config.dataType)} (${t("analytics.comparison")})`,
          data: compareValues,
          backgroundColor: `${theme.accent}20`,
          borderColor: theme.accent,
          borderWidth: 2,
          fill: config.type === "line",
          tension: 0.4,
          pointBackgroundColor: theme.accent,
          pointBorderColor: theme.text,
          pointRadius: config.type === "line" ? 4 : undefined,
          pointHoverRadius: config.type === "line" ? 6 : undefined
        });
      }
      setPreviewData({ labels, datasets });
      setError("");
    }
  }, [config, isOpen, modulesData, trends, topProducts, topClients]);

  const getFieldLabel = (module, dataType) => {
    const labels = {
      sales: { total: t("analytics.totalRevenue"), trend: t("analytics.salesTrend"), count: t("analytics.numberOfSales"), average: t("analytics.averageTicket") },
      purchases: { total: t("analytics.totalPurchases"), count: t("analytics.numberOfPurchases"), average: t("analytics.averagePurchase") },
      products: { evolution: t("analytics.productEvolution"), stock: t("analytics.stockStatus"), value: t("analytics.stockValue") },
      clients: { top: t("analytics.topClients"), status: t("analytics.clientDistribution"), total: t("analytics.totalClients") },
      orders: { status: t("analytics.orderDistribution"), total: t("analytics.totalOrders"), evolution: t("analytics.orderEvolution") },
      invoices: { status: t("analytics.invoiceDistribution"), amount: t("analytics.totalAmount"), evolution: t("analytics.invoiceEvolution") },
      employees: { status: t("analytics.employeeDistribution"), payroll: t("analytics.totalPayroll"), total: t("analytics.totalEmployees") },
      logistics: { status: t("analytics.shipmentDistribution"), performance: t("analytics.deliveryPerformance"), total: t("analytics.totalShipments") }
    };
    return labels[module]?.[dataType] || t("analytics.data");
  };

  const chartTypes = [
    { value: "bar", label: t("analytics.barChart"), Icon: Icons.BarChart2, description: t("analytics.barChartDesc") },
    { value: "line", label: t("analytics.lineChart"), Icon: Icons.TrendingUp, description: t("analytics.lineChartDesc") },
    { value: "doughnut", label: t("analytics.doughnutChart"), Icon: Icons.Donut, description: t("analytics.doughnutChartDesc") },
    { value: "pie", label: t("analytics.pieChart"), Icon: Icons.PieChart, description: t("analytics.pieChartDesc") },
    { value: "radar", label: t("analytics.radarChart"), Icon: Icons.Radar, description: t("analytics.radarChartDesc") }
  ];

  const periodOptions = [
    { value: "week", label: t("analytics.weekly"), Icon: Icons.Calendar },
    { value: "month", label: t("analytics.monthly"), Icon: Icons.BarChart2 },
    { value: "quarter", label: t("analytics.quarterly"), Icon: Icons.TrendingUp },
    { value: "year", label: t("analytics.yearly"), Icon: Icons.Activity }
  ];

  const modules = [
    { value: "sales", label: t("common.sales"), Icon: Icons.DollarSign, color: theme.accent },
    { value: "purchases", label: t("common.purchases"), Icon: Icons.Inbox, color: "#f59e0b" },
    { value: "products", label: t("common.products"), Icon: Icons.Package, color: "#3b82f6" },
    { value: "clients", label: t("common.clients"), Icon: Icons.Users, color: theme.primary },
    { value: "orders", label: t("common.orders"), Icon: Icons.FileText, color: theme.primary },
    { value: "invoices", label: t("common.invoices"), Icon: Icons.Receipt, color: theme.accent },
    { value: "employees", label: t("common.hr"), Icon: Icons.Briefcase, color: "#14b8a6" },
    { value: "logistics", label: t("common.logistics"), Icon: Icons.Truck, color: "#3b82f6" }
  ];

  const dataTypes = {
    sales: [
      { value: "total", label: t("analytics.totalRevenue"), Icon: Icons.DollarSign },
      { value: "trend", label: t("analytics.salesTrend"), Icon: Icons.TrendingUp },
      { value: "count", label: t("analytics.numberOfSales"), Icon: Icons.BarChart2 },
      { value: "average", label: t("analytics.averageTicket"), Icon: Icons.Activity }
    ],
    purchases: [
      { value: "total", label: t("analytics.totalPurchases"), Icon: Icons.DollarSign },
      { value: "count", label: t("analytics.numberOfPurchases"), Icon: Icons.BarChart2 },
      { value: "average", label: t("analytics.averagePurchase"), Icon: Icons.TrendingUp }
    ],
    products: [
      { value: "evolution", label: t("analytics.productEvolution"), Icon: Icons.TrendingUp },
      { value: "stock", label: t("analytics.stockStatus"), Icon: Icons.Package },
      { value: "value", label: t("analytics.stockValue"), Icon: Icons.DollarSign }
    ],
    clients: [
      { value: "top", label: t("analytics.topClients"), Icon: Icons.Award },
      { value: "status", label: t("analytics.clientDistribution"), Icon: Icons.Users },
      { value: "total", label: t("analytics.totalClients"), Icon: Icons.BarChart2 }
    ],
    orders: [
      { value: "status", label: t("analytics.orderDistribution"), Icon: Icons.BarChart2 },
      { value: "total", label: t("analytics.totalOrders"), Icon: Icons.FileText },
      { value: "evolution", label: t("analytics.orderEvolution"), Icon: Icons.TrendingUp }
    ],
    invoices: [
      { value: "status", label: t("analytics.invoiceDistribution"), Icon: Icons.BarChart2 },
      { value: "amount", label: t("analytics.totalAmount"), Icon: Icons.DollarSign },
      { value: "evolution", label: t("analytics.invoiceEvolution"), Icon: Icons.TrendingUp }
    ],
    employees: [
      { value: "status", label: t("analytics.employeeDistribution"), Icon: Icons.Users },
      { value: "payroll", label: t("analytics.totalPayroll"), Icon: Icons.DollarSign },
      { value: "total", label: t("analytics.totalEmployees"), Icon: Icons.Briefcase }
    ],
    logistics: [
      { value: "status", label: t("analytics.shipmentDistribution"), Icon: Icons.BarChart2 },
      { value: "performance", label: t("analytics.deliveryPerformance"), Icon: Icons.TrendingUp },
      { value: "total", label: t("analytics.totalShipments"), Icon: Icons.Truck }
    ]
  };

  const handleCreate = () => {
    if (!config.title.trim()) { setError(t("analytics.titleRequired")); return; }
    const { labels, dataValues, compareValues } = generateRealData(config.module, config.dataType, config.period, config.compare);
    if (dataValues.length === 0 || dataValues.every(v => v === 0)) { setError(t("analytics.noDataAvailable")); return; }
    const datasets = [{
      label: config.title,
      data: dataValues,
      backgroundColor: config.type === "line" ? `${theme.primary}20` : [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6"],
      borderColor: theme.primary,
      borderWidth: 2,
      fill: config.type === "line",
      tension: 0.4,
      pointBackgroundColor: config.type === "line" ? theme.primary : undefined,
      pointBorderColor: config.type === "line" ? theme.text : undefined,
      pointRadius: config.type === "line" ? 4 : undefined,
      pointHoverRadius: config.type === "line" ? 6 : undefined
    }];
    if (config.compare && compareValues && compareValues.length > 0) {
      datasets.push({ label: `${config.title} (${t("analytics.comparison")})`, data: compareValues, backgroundColor: `${theme.accent}20`, borderColor: theme.accent, borderWidth: 2, fill: config.type === "line", tension: 0.4 });
    }
    onCreate({ id: Date.now(), title: config.title, type: config.type, module: config.module, dataType: config.dataType, period: config.period, compare: config.compare, chartData: { labels, datasets } });
    setConfig({ title: "", type: "bar", module: "sales", dataType: "total", period: "month", compare: false });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease" }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div style={{ background: theme.surface, padding: "32px", borderRadius: "24px", width: "700px", maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${theme.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ color: theme.text, margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
            <Icons.BarChart2 size={22} /> {t("analytics.createCustomChart")}
          </h2>
          <button onClick={onClose} style={{ background: theme.surfaceHover, border: "none", borderRadius: "8px", color: theme.text, cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" }}>
            <Icons.X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: "20px", padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171", textAlign: "center", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
            <Icons.AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Title input */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: "13px" }}>
            {t("analytics.chartTitle")} *
          </label>
          <input
            type="text"
            placeholder={t("analytics.chartTitlePlaceholder")}
            value={config.title}
            onChange={e => setConfig({ ...config, title: e.target.value })}
            style={{ width: "100%", padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s", boxSizing: "border-box" }}
            onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
            autoFocus
          />
        </div>

        {/* Chart type */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: "13px" }}>{t("analytics.chartType")} *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
            {chartTypes.map(type => (
              <button key={type.value} onClick={() => setConfig({ ...config, type: type.value })}
                style={{ padding: "12px 8px", background: config.type === type.value ? theme.primary : theme.surfaceHover, border: `2px solid ${config.type === type.value ? theme.primary : theme.border}`, borderRadius: "10px", color: config.type === type.value ? "white" : theme.textSecondary, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                <type.Icon size={22} />
                <span style={{ fontSize: "11px", fontWeight: "600" }}>{type.label}</span>
                <span style={{ fontSize: "9px", opacity: 0.7 }}>{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: "13px" }}>{t("analytics.period")} *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {periodOptions.map(period => (
              <button key={period.value} onClick={() => setConfig({ ...config, period: period.value })}
                style={{ padding: "10px", background: config.period === period.value ? theme.primary : theme.surfaceHover, border: `1px solid ${config.period === period.value ? theme.primary : theme.border}`, borderRadius: "8px", color: config.period === period.value ? "white" : theme.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
                <period.Icon size={14} />
                <span style={{ fontSize: "12px" }}>{period.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: "13px" }}>{t("analytics.module")} *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {modules.map(module => (
              <button key={module.value} onClick={() => setConfig({ ...config, module: module.value, dataType: dataTypes[module.value]?.[0]?.value || "total" })}
                style={{ padding: "10px", background: config.module === module.value ? module.color : theme.surfaceHover, border: `1px solid ${config.module === module.value ? module.color : theme.border}`, borderRadius: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
                <module.Icon size={16} />
                <span style={{ fontSize: "12px", fontWeight: "600" }}>{module.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data field */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: "13px" }}>{t("analytics.dataField")} *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {dataTypes[config.module]?.map(field => (
              <button key={field.value} onClick={() => setConfig({ ...config, dataType: field.value })}
                style={{ padding: "10px", background: config.dataType === field.value ? theme.primary : theme.surfaceHover, border: `1px solid ${config.dataType === field.value ? theme.primary : theme.border}`, borderRadius: "8px", color: config.dataType === field.value ? "white" : theme.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
                <field.Icon size={16} />
                <span style={{ fontSize: "12px", fontWeight: "600" }}>{field.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Compare toggle */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: theme.textSecondary, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px" }}>
            <input type="checkbox" checked={config.compare} onChange={(e) => setConfig({ ...config, compare: e.target.checked })} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            {t("analytics.addComparison")}
          </label>
        </div>

        {/* Preview */}
        {previewData && previewData.labels.length > 0 && (
          <div style={{ marginBottom: "24px", padding: "20px", background: theme.surfaceHover, borderRadius: "16px", border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ color: theme.textSecondary, margin: 0, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Eye size={14} /> {t("analytics.preview")}
              </h4>
              <span style={{ fontSize: "10px", color: theme.textSecondary }}>{previewData.labels.length} {t("analytics.elements")}</span>
            </div>
            <div style={{ height: "240px" }}>
              {config.type === "bar" && <Bar data={previewData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: theme.textSecondary } } } }} />}
              {config.type === "line" && <Line data={previewData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: theme.textSecondary } } } }} />}
              {config.type === "doughnut" && <Doughnut data={previewData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: theme.textSecondary } } } }} />}
              {config.type === "pie" && <Pie data={previewData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: theme.textSecondary } } } }} />}
              {config.type === "radar" && <Radar data={previewData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: theme.textSecondary } } } }} />}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={handleCreate}
            style={{ flex: 1, padding: "14px", background: theme.primary, color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.secondary; e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.primary; e.currentTarget.style.transform = "scale(1)"; }}>
            <Icons.CheckCircle size={16} /> {t("common.create")}
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: "14px", background: theme.surfaceHover, color: theme.text, border: "none", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s", fontSize: "14px" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Analytics Page ───────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [activeModule, setActiveModule] = useState("global");
  const [chartType, setChartType] = useState("bar");
  const [customCharts, setCustomCharts] = useState([]);
  const [showCustomChartModal, setShowCustomChartModal] = useState(false);
  const [data, setData] = useState({
    sales: { total: 0, count: 0, average: 0, evolution: 0 },
    purchases: { total: 0, count: 0, average: 0, evolution: 0 },
    products: { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
    clients: { total: 0, active: 0, new: 0, evolution: 0 },
    orders: { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0, evolution: 0 },
    invoices: { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0 },
    employees: { total: 0, active: 0, onLeave: 0, inactive: 0, totalPayroll: 0 },
    logistics: { total: 0, delivered: 0, inTransit: 0, pending: 0, onTime: 0 }
  });
  const [trends, setTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchAnalytics();
    setTimeout(() => setAnimateCards(true), 100);
  }, [period]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const [salesRes, purchasesRes, productsRes, clientsRes, ordersRes, invoicesRes, employeesRes, shipmentsRes] = await Promise.all([
        fetch("http://localhost:3001/sales", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/purchases", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/products", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/clients", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/orders", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/invoices", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/employees", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/logistics/shipments", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let sales = await salesRes.json();
      let purchases = await purchasesRes.json();
      let products = await productsRes.json();
      let clients = await clientsRes.json();
      let orders = await ordersRes.json();
      let invoices = await invoicesRes.json();
      let employees = await employeesRes.json();
      let shipments = await shipmentsRes.json();

      sales = Array.isArray(sales) ? sales : [];
      purchases = Array.isArray(purchases) ? purchases : [];
      products = Array.isArray(products) ? products : [];
      clients = Array.isArray(clients) ? clients : [];
      orders = Array.isArray(orders) ? orders : [];
      invoices = Array.isArray(invoices) ? invoices : [];
      employees = Array.isArray(employees) ? employees : [];
      shipments = Array.isArray(shipments) ? shipments : [];

      const totalSales = sales.reduce((s, item) => s + (Number(item.total) || 0), 0);
      const totalPurchases = purchases.reduce((s, item) => s + (Number(item.total) || 0), 0);
      const lowStock = products.filter(p => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
      const outOfStock = products.filter(p => (p.quantity || 0) === 0).length;
      const totalProductsValue = products.reduce((s, p) => s + ((Number(p.price) || 0) * (Number(p.quantity) || 0)), 0);
      const activeClients = clients.filter(c => c.status === "active").length;
      const pendingOrders = orders.filter(o => o.status === "pending").length;
      const processingOrders = orders.filter(o => o.status === "processing").length;
      const completedOrders = orders.filter(o => o.status === "completed" || o.status === "delivered").length;
      const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
      const paidInvoices = invoices.filter(i => i.status === "paid").length;
      const pendingInvoices = invoices.filter(i => i.status !== "paid").length;
      const overdueInvoices = invoices.filter(i => i.status === "overdue" || (i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "paid")).length;
      const totalInvoicesAmount = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const activeEmployees = employees.filter(e => e.status === "active").length;
      const onLeaveEmployees = employees.filter(e => e.status === "leave").length;
      const inactiveEmployees = employees.filter(e => e.status === "inactive").length;
      const totalPayroll = employees.reduce((s, e) => s + (Number(e.salary) || 0), 0);
      const deliveredShipments = shipments.filter(s => s.status === "delivered").length;
      const inTransitShipments = shipments.filter(s => s.status === "in_transit").length;
      const pendingShipments = shipments.filter(s => s.status === "pending").length;

      setData({
        sales: { total: totalSales, count: sales.length, average: sales.length > 0 ? totalSales / sales.length : 0, evolution: 12.5 },
        purchases: { total: totalPurchases, count: purchases.length, average: purchases.length > 0 ? totalPurchases / purchases.length : 0, evolution: -5.2 },
        products: { total: products.length, lowStock, outOfStock, totalValue: totalProductsValue },
        clients: { total: clients.length, active: activeClients, new: Math.floor(clients.length * 0.15), evolution: 8.3 },
        orders: { total: orders.length, pending: pendingOrders, processing: processingOrders, completed: completedOrders, cancelled: cancelledOrders, evolution: 15.2 },
        invoices: { total: invoices.length, paid: paidInvoices, pending: pendingInvoices, overdue: overdueInvoices, totalAmount: totalInvoicesAmount },
        employees: { total: employees.length, active: activeEmployees, onLeave: onLeaveEmployees, inactive: inactiveEmployees, totalPayroll },
        logistics: { total: shipments.length, delivered: deliveredShipments, inTransit: inTransitShipments, pending: pendingShipments, onTime: shipments.length > 0 ? (deliveredShipments / shipments.length * 100).toFixed(1) : 0 }
      });

      const months = [t("analytics.jan"), t("analytics.feb"), t("analytics.mar"), t("analytics.apr"), t("analytics.may"), t("analytics.jun"), t("analytics.jul"), t("analytics.aug"), t("analytics.sep"), t("analytics.oct"), t("analytics.nov"), t("analytics.dec")];
      const monthlySales = Array(12).fill(0);
      sales.forEach(s => { if (s.createdAt) { const month = new Date(s.createdAt).getMonth(); monthlySales[month] += Number(s.total) || 0; } });
      setTrends(months.map((m, i) => ({ month: m, sales: monthlySales[i] })));

      const productSales = {};
      sales.forEach(s => { if (s.productName) productSales[s.productName] = (productSales[s.productName] || 0) + (Number(s.total) || 0); });
      setTopProducts(Object.entries(productSales).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5));

      const clientSales = {};
      sales.forEach(s => { if (s.clientName) clientSales[s.clientName] = (clientSales[s.clientName] || 0) + (Number(s.total) || 0); });
      setTopClients(Object.entries(clientSales).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5));

      const newAlerts = [];
      if (lowStock > 0) newAlerts.push({ type: "warning", message: `${lowStock} ${t("analytics.lowStockAlert")}`, module: "products", alertType: "warning" });
      if (outOfStock > 0) newAlerts.push({ type: "danger", message: `${outOfStock} ${t("analytics.outOfStockAlert")}`, module: "products", alertType: "danger" });
      if (pendingOrders > 5) newAlerts.push({ type: "info", message: `${pendingOrders} ${t("analytics.pendingOrdersAlert")}`, module: "orders", alertType: "info" });
      if (pendingInvoices > 3) newAlerts.push({ type: "warning", message: `${pendingInvoices} ${t("analytics.pendingInvoicesAlert")}`, module: "invoices", alertType: "warning" });
      setAlerts(newAlerts);

    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const addCustomChart = (chart) => setCustomCharts(prev => [...prev, chart]);
  const removeCustomChart = (id) => setCustomCharts(customCharts.filter(chart => chart.id !== id));

  const getFilteredSalesData = () => {
    let labels = [], dataValues = [];
    if (period === "week") {
      labels = [t("analytics.mon"), t("analytics.tue"), t("analytics.wed"), t("analytics.thu"), t("analytics.fri"), t("analytics.sat"), t("analytics.sun")];
      dataValues = trends.slice(-7).map(t => t.sales);
      while (dataValues.length < 7) dataValues.unshift(0);
    } else if (period === "month") {
      labels = trends.map(t => t.month); dataValues = trends.map(t => t.sales);
    } else if (period === "quarter") {
      labels = [t("analytics.q1"), t("analytics.q2"), t("analytics.q3"), t("analytics.q4")];
      const q = [0, 0, 0, 0];
      trends.forEach((t, idx) => { const qi = Math.floor(idx / 3); if (qi < 4) q[qi] += t.sales; });
      dataValues = q;
    } else if (period === "year") {
      labels = ["2021", "2022", "2023", "2024"];
      const y = [0, 0, 0, 0];
      trends.forEach((t, idx) => { const yi = Math.floor(idx / 12); if (yi < 4) y[yi] += t.sales; });
      dataValues = y;
    } else {
      labels = trends.map(t => t.month); dataValues = trends.map(t => t.sales);
    }
    return { labels, dataValues };
  };

  const filteredSalesData = getFilteredSalesData();

  const salesChartData = {
    labels: filteredSalesData.labels,
    datasets: [{ label: t("dashboard.revenue"), data: filteredSalesData.dataValues, backgroundColor: `${theme.primary}80`, borderColor: theme.primary, borderWidth: 2, fill: true, tension: 0.4 }]
  };
  const topProductsChartData = {
    labels: topProducts.map(p => p.name),
    datasets: [{ label: t("dashboard.topProducts"), data: topProducts.map(p => p.amount), backgroundColor: [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6"], borderWidth: 0 }]
  };
  const topClientsChartData = {
    labels: topClients.map(c => c.name),
    datasets: [{ label: t("dashboard.topClients"), data: topClients.map(c => c.amount), backgroundColor: [theme.accent, "#f59e0b", theme.primary, "#8b5cf6", "#ef4444"], borderWidth: 0 }]
  };
  const radarChartData = {
    labels: [t("dashboard.revenue"), t("dashboard.profit"), t("dashboard.activeClients"), t("common.products"), t("common.orders"), t("common.invoices")],
    datasets: [{ label: t("analytics.performance"), data: [data.sales.total / 1000, (data.sales.total - data.purchases.total) / 1000, data.clients.active, data.products.total / 10, data.orders.total, data.invoices.total], backgroundColor: `${theme.primary}20`, borderColor: theme.primary, borderWidth: 2, pointBackgroundColor: theme.primary, pointBorderColor: theme.text, pointHoverRadius: 8 }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: theme.textSecondary, font: { size: 11 } }, position: "bottom" },
      tooltip: { backgroundColor: theme.surface, titleColor: theme.text, bodyColor: theme.textSecondary, borderColor: theme.primary, borderWidth: 1, callbacks: { label: function(context) { return `${context.dataset.label || ''}: ${formatCurrency(context.raw || 0)}`; } } }
    },
    scales: { y: { ticks: { color: theme.textSecondary }, grid: { color: theme.border } }, x: { ticks: { color: theme.textSecondary }, grid: { color: theme.border } } }
  };
  const barChartOptions = { ...chartOptions, scales: { y: { ticks: { color: theme.textSecondary }, grid: { color: theme.border } }, x: { ticks: { color: theme.textSecondary, rotation: 45 }, grid: { color: theme.border } } } };

  const animations = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  `;

  const modulesList = [
    { id: "global", label: t("analytics.global"), Icon: Icons.Globe, color: theme.primary },
    { id: "sales", label: t("common.sales"), Icon: Icons.DollarSign, color: theme.accent },
    { id: "purchases", label: t("common.purchases"), Icon: Icons.Inbox, color: "#f59e0b" },
    { id: "products", label: t("common.products"), Icon: Icons.Package, color: "#3b82f6" },
    { id: "clients", label: t("common.clients"), Icon: Icons.Users, color: theme.primary },
    { id: "orders", label: t("common.orders"), Icon: Icons.FileText, color: theme.primary },
    { id: "invoices", label: t("common.invoices"), Icon: Icons.Receipt, color: theme.accent },
    { id: "employees", label: t("common.hr"), Icon: Icons.Briefcase, color: "#14b8a6" },
    { id: "logistics", label: t("common.logistics"), Icon: Icons.Truck, color: "#3b82f6" }
  ];

  const periodOptionsList = [
    { value: "week", label: t("analytics.weekly") },
    { value: "month", label: t("analytics.monthly") },
    { value: "quarter", label: t("analytics.quarterly") },
    { value: "year", label: t("analytics.yearly") }
  ];

  const chartTypeOptionsList = [
    { value: "bar", label: t("analytics.barChart") },
    { value: "line", label: t("analytics.lineChart") },
    { value: "doughnut", label: t("analytics.doughnutChart") },
    { value: "radar", label: t("analytics.radarChart") }
  ];

  const profit = data.sales.total - data.purchases.total;
  const profitMargin = data.sales.total > 0 ? (profit / data.sales.total * 100).toFixed(1) : 0;
  const inventoryTurnover = data.products.total > 0 ? (data.sales.total / data.products.total / 100).toFixed(1) : 0;
  const loyaltyRate = data.clients.total > 0 ? ((data.clients.total - (data.orders.pending || 0)) / data.clients.total * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div style={{ background: theme.background, minHeight: "100vh", color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{animations}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: (typeof window !== "undefined" && window.innerWidth > 1024 ? "280px" : window.innerWidth > 768 ? "240px" : "0"), flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <style>{animations}</style>

          {/* ── Header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px", animation: "fadeInUp 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <div>
              <h1 style={{ color: theme.text, fontSize: "28px", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                <Icons.Activity size={28} /> {t("common.analytics")}
              </h1>
              <p style={{ color: theme.textSecondary, marginTop: "4px" }}>{t("analytics.subtitle")}</p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}
                style={{ padding: "10px 16px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, cursor: "pointer" }}>
                {periodOptionsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button onClick={() => setShowCustomChartModal(true)}
                style={{ padding: "10px 16px", background: theme.primary, border: "none", borderRadius: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme.secondary}
                onMouseLeave={(e) => e.currentTarget.style.background = theme.primary}>
                <Icons.Plus size={16} /> {t("analytics.createCustomChart")}
              </button>
            </div>
          </div>

          {/* ── Alerts ── */}
          {alerts.length > 0 && (
            <div style={{ marginBottom: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
              {alerts.map((alert, idx) => {
                const isDanger = alert.type === "danger";
                const isWarning = alert.type === "warning";
                const bgColor = isDanger ? "rgba(239,68,68,0.1)" : isWarning ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)";
                const borderColor = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : theme.accent;
                const AlertIcon = isDanger ? Icons.AlertCircle : isWarning ? Icons.AlertTriangle : Icons.Info;
                return (
                  <div key={idx} style={{ background: bgColor, borderLeft: `4px solid ${borderColor}`, padding: "12px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", transition: "transform 0.2s", color: theme.text }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(5px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                    <AlertIcon size={20} style={{ color: borderColor, flexShrink: 0 }} />
                    <span>{alert.message}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            {[
              { Icon: Icons.DollarSign, label: t("dashboard.revenue"), value: formatCurrency(data.sales.total), color: theme.accent, sub: `${data.sales.count} ${t("analytics.sales")}`, delay: "0s" },
              { Icon: Icons.TrendingUp, label: t("dashboard.profit"), value: formatCurrency(profit), color: profit >= 0 ? theme.accent : "#ef4444", sub: `${t("dashboard.profitMargin")}: ${profitMargin}%`, subColor: "#f59e0b", delay: "0.1s" },
              { Icon: Icons.Users, label: t("common.clients"), value: data.clients.total, color: theme.primary, sub: `${data.clients.active} ${t("analytics.active")}`, delay: "0.2s" },
              { Icon: Icons.Package, label: t("common.products"), value: data.products.total, color: "#3b82f6", sub: `${data.products.lowStock} ${t("stock.lowStock")}`, subColor: data.products.lowStock > 0 ? "#f59e0b" : theme.accent, delay: "0.3s" }
            ].map((card, i) => (
              <div key={i} style={{ background: theme.surface, borderRadius: "16px", padding: "20px", border: `1px solid ${theme.border}`, transition: "transform 0.3s", animation: animateCards ? `fadeInUp 0.5s ease ${card.delay}` : "none" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ fontSize: "12px", color: theme.textSecondary, display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <card.Icon size={14} /> {card.label}
                </div>
                <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                <div style={{ fontSize: "11px", color: card.subColor || theme.textSecondary, marginTop: "4px" }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Sales Evolution Chart ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "32px", animation: "fadeInUp 0.5s ease 0.35s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <h3 style={{ color: theme.text, margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icons.TrendingUp size={18} /> {t("analytics.salesEvolution")} ({periodOptionsList.find(p => p.value === period)?.label || t("analytics.monthly")})
                </h3>
                <select value={chartType} onChange={(e) => setChartType(e.target.value)}
                  style={{ padding: "6px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "6px", color: theme.text, cursor: "pointer", fontSize: "12px" }}>
                  {chartTypeOptionsList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {filteredSalesData.dataValues.some(v => v > 0) ? (
                <div style={{ height: "350px" }}>
                  {chartType === "bar" && <Bar data={salesChartData} options={barChartOptions} />}
                  {chartType === "line" && <Line data={salesChartData} options={chartOptions} />}
                  {chartType === "doughnut" && <Doughnut data={{ labels: [t("analytics.sales")], datasets: [{ data: [data.sales.total], backgroundColor: [theme.accent] }] }} options={chartOptions} />}
                  {chartType === "radar" && <Radar data={radarChartData} options={chartOptions} />}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "80px", color: theme.textSecondary }}>
                  <Icons.BarChart2 size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p>{t("analytics.noSalesData")}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Top Products & Clients ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", marginBottom: "32px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Award size={18} /> {t("dashboard.topProducts")}
              </h3>
              {topProducts.length > 0 ? (
                <div style={{ height: "280px" }}><Bar data={topProductsChartData} options={barChartOptions} /></div>
              ) : (
                <div style={{ textAlign: "center", padding: "80px", color: theme.textSecondary }}>
                  <Icons.Package size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p>{t("analytics.noProductsSold")}</p>
                </div>
              )}
            </div>
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Star size={18} /> {t("dashboard.topClients")}
              </h3>
              {topClients.length > 0 ? (
                <div style={{ height: "280px" }}><Bar data={topClientsChartData} options={barChartOptions} /></div>
              ) : (
                <div style={{ textAlign: "center", padding: "80px", color: theme.textSecondary }}>
                  <Icons.Users size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                  <p>{t("analytics.noClientsWithSales")}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Custom Charts ── */}
          {customCharts.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Layers size={20} /> {t("analytics.myCustomCharts")} ({customCharts.length})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))", gap: "20px" }}>
                {customCharts.map(chart => (
                  <div key={chart.id} style={{ background: theme.surface, borderRadius: "20px", padding: "20px", border: `1px solid ${theme.border}`, position: "relative" }}>
                    <button onClick={() => removeCustomChart(chart.id)}
                      style={{ position: "absolute", top: "12px", right: "12px", background: "#c33", border: "none", borderRadius: "6px", color: "white", cursor: "pointer", padding: "5px", display: "flex", alignItems: "center" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#ff4444"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#c33"}>
                      <Icons.X size={12} />
                    </button>
                    <h4 style={{ color: theme.text, marginBottom: "16px", fontSize: "14px", paddingRight: "30px" }}>{chart.title}</h4>
                    <div style={{ height: "220px" }}>
                      {chart.type === "bar" && <Bar data={chart.chartData} options={barChartOptions} />}
                      {chart.type === "line" && <Line data={chart.chartData} options={chartOptions} />}
                      {chart.type === "doughnut" && <Doughnut data={chart.chartData} options={chartOptions} />}
                      {chart.type === "pie" && <Pie data={chart.chartData} options={chartOptions} />}
                      {chart.type === "radar" && <Radar data={chart.chartData} options={chartOptions} />}
                    </div>
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                      <span style={{ fontSize: "10px", color: theme.textSecondary, background: theme.surfaceHover, padding: "2px 8px", borderRadius: "12px" }}>
                        {modulesList.find(m => m.id === chart.module)?.label || chart.module}
                      </span>
                      <span style={{ fontSize: "10px", color: theme.textSecondary, background: theme.surfaceHover, padding: "2px 8px", borderRadius: "12px" }}>
                        {chart.period === "week" ? t("analytics.weekly") : chart.period === "month" ? t("analytics.monthly") : chart.period === "quarter" ? t("analytics.quarterly") : t("analytics.yearly")}
                      </span>
                      {chart.compare && (
                        <span style={{ fontSize: "10px", color: "#ef4444", background: theme.surfaceHover, padding: "2px 8px", borderRadius: "12px" }}>
                          {t("analytics.comparison")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Module Tabs ── */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", animation: "fadeInUp 0.5s ease 0.45s", opacity: animateCards ? 1 : 0 }}>
            {modulesList.map(module => (
              <button key={module.id} onClick={() => setActiveModule(module.id)}
                style={{ padding: "10px 20px", background: activeModule === module.id ? module.color : theme.surfaceHover, border: `1px solid ${activeModule === module.id ? module.color : theme.border}`, borderRadius: "8px", color: activeModule === module.id ? "white" : theme.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
                onMouseEnter={(e) => { if (activeModule !== module.id) { e.currentTarget.style.background = theme.surface; e.currentTarget.style.color = theme.text; } }}
                onMouseLeave={(e) => { if (activeModule !== module.id) { e.currentTarget.style.background = theme.surfaceHover; e.currentTarget.style.color = theme.textSecondary; } }}>
                <module.Icon size={15} />
                <span style={{ fontSize: "13px" }}>{module.label}</span>
              </button>
            ))}
          </div>

          {/* ── Global KPIs ── */}
          {activeModule === "global" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.text, marginBottom: "20px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Cpu size={18} /> {t("dashboard.strategicKpis")}
              </h3>
              {[
                { label: t("dashboard.profitMargin"), value: `${profitMargin}%`, pct: Math.min(parseFloat(profitMargin), 100), color: theme.accent, Icon: Icons.Target },
                { label: t("dashboard.inventoryTurnover"), value: `${inventoryTurnover}x`, pct: Math.min((data.sales.total / (data.products.total * 1000 || 1)) * 100, 100), color: "#f59e0b", Icon: Icons.RefreshCw },
                { label: t("dashboard.loyaltyRate"), value: `${loyaltyRate}%`, pct: Math.min(parseFloat(loyaltyRate), 100), color: theme.primary, Icon: Icons.Star }
              ].map((kpi, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? "16px" : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ color: theme.textSecondary, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                      <kpi.Icon size={14} /> {kpi.label}
                    </span>
                    <span style={{ color: kpi.color, fontWeight: "bold" }}>{kpi.value}</span>
                  </div>
                  <div style={{ background: theme.surfaceHover, borderRadius: "10px", height: "8px" }}>
                    <div style={{ width: `${kpi.pct}%`, background: kpi.color, height: "8px", borderRadius: "10px", transition: "width 0.5s" }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Sales Module ── */}
          {activeModule === "sales" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {[
                  { Icon: Icons.DollarSign, label: t("dashboard.revenue"), value: formatCurrency(data.sales.total), color: theme.accent },
                  { Icon: Icons.BarChart2, label: t("analytics.numberOfSales"), value: data.sales.count, color: "#f59e0b" },
                  { Icon: Icons.TrendingUp, label: t("analytics.averageTicket"), value: formatCurrency(data.sales.average), color: theme.accent }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Purchases Module ── */}
          {activeModule === "purchases" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {[
                  { Icon: Icons.DollarSign, label: t("purchases.totalPurchases"), value: formatCurrency(data.purchases.total), color: "#f59e0b" },
                  { Icon: Icons.BarChart2, label: t("purchases.numberOfPurchases"), value: data.purchases.count, color: theme.primary },
                  { Icon: Icons.TrendingUp, label: t("purchases.averagePurchase"), value: formatCurrency(data.purchases.average), color: "#f59e0b" }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Products Module ── */}
          {activeModule === "products" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" }}>
                {[
                  { Icon: Icons.Package, label: t("products.totalProducts"), value: data.products.total, color: theme.primary },
                  { Icon: Icons.DollarSign, label: t("stock.totalValue"), value: formatCurrency(data.products.totalValue), color: theme.accent },
                  { Icon: Icons.AlertTriangle, label: t("stock.lowStock"), value: data.products.lowStock, color: "#f59e0b" },
                  { Icon: Icons.Ban, label: t("products.outOfStock"), value: data.products.outOfStock, color: "#ef4444" }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
              {topProducts.length > 0 && (
                <div style={{ marginTop: "24px", height: "300px" }}>
                  <h4 style={{ color: theme.textSecondary, marginBottom: "16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icons.BarChart2 size={14} /> {t("analytics.salesByProduct")}
                  </h4>
                  <Bar data={topProductsChartData} options={barChartOptions} />
                </div>
              )}
            </div>
          )}

          {/* ── Clients Module ── */}
          {activeModule === "clients" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
                {[
                  { Icon: Icons.Users, label: t("clients.totalClients"), value: data.clients.total, color: theme.primary },
                  { Icon: Icons.UserCheck, label: t("clients.activeClients"), value: data.clients.active, color: theme.accent },
                  { Icon: Icons.UserPlus, label: t("clients.newClients"), value: data.clients.new, color: "#3b82f6" }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
              {topClients.length > 0 && (
                <div style={{ marginTop: "24px", height: "300px" }}>
                  <h4 style={{ color: theme.textSecondary, marginBottom: "16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icons.BarChart2 size={14} /> {t("analytics.purchasesByClient")}
                  </h4>
                  <Bar data={topClientsChartData} options={barChartOptions} />
                </div>
              )}
            </div>
          )}

          {/* ── Orders Module ── */}
          {activeModule === "orders" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {[
                  { Icon: Icons.FileText, label: t("orders.totalOrders"), value: data.orders.total, color: theme.primary },
                  { Icon: Icons.CheckSquare, label: t("orders.delivered"), value: data.orders.completed, color: theme.accent },
                  { Icon: Icons.Clock, label: t("orders.pending"), value: data.orders.pending, color: "#f59e0b" }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Invoices Module ── */}
          {activeModule === "invoices" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {[
                  { Icon: Icons.Receipt, label: t("invoices.totalInvoices"), value: data.invoices.total, color: theme.primary },
                  { Icon: Icons.CheckCircle, label: t("invoices.paidInvoices"), value: data.invoices.paid, color: theme.accent },
                  { Icon: Icons.DollarSign, label: t("invoices.totalAmount"), value: formatCurrency(data.invoices.totalAmount), color: "#f59e0b" }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Employees Module ── */}
          {activeModule === "employees" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {[
                  { Icon: Icons.Briefcase, label: t("hr.totalEmployees"), value: data.employees.total, color: theme.primary },
                  { Icon: Icons.UserCheck, label: t("hr.activeEmployees"), value: data.employees.active, color: theme.accent },
                  { Icon: Icons.DollarSign, label: t("hr.totalPayroll"), value: formatCurrency(data.employees.totalPayroll), color: "#f59e0b" }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Logistics Module ── */}
          {activeModule === "logistics" && (
            <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {[
                  { Icon: Icons.Truck, label: t("logistics.totalShipments"), value: data.logistics.total, color: theme.primary },
                  { Icon: Icons.CheckCircle, label: t("logistics.delivered"), value: data.logistics.delivered, color: theme.accent },
                  { Icon: Icons.Zap, label: t("logistics.onTimeDelivery"), value: `${data.logistics.onTime}%`, color: theme.accent }
                ].map((card, i) => (
                  <div key={i} style={{ background: theme.surfaceHover, padding: "20px", borderRadius: "16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    <card.Icon size={32} style={{ margin: "0 auto 8px", color: card.color }} />
                    <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <CustomChartModal
        isOpen={showCustomChartModal}
        onClose={() => setShowCustomChartModal(false)}
        onCreate={addCustomChart}
        modulesData={data}
        trends={trends}
        topProducts={topProducts}
        topClients={topClients}
        t={t}
        formatCurrency={formatCurrency}
        theme={theme}
      />
    </div>
  );
}