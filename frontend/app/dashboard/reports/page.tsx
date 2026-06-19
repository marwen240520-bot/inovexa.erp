"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";

// ── SVG Icon Components ────────────────────────────────────────────────────────

const IconFileText = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconBarChart = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconFolder = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconDollarSign = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconShoppingCart = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconBox = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IconUsers = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconTrendingUp = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconTag = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconBriefcase = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const IconTruck = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconSettings = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconInfo = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const IconLightbulb = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/>
    <line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
);

const IconDownload = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconLoader = ({ size = 48, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

const IconClock = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCheckCircle = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconAlertTriangle = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconJSON = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);

const IconCSV = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="21"/>
    <line x1="15" y1="9" x2="15" y2="21"/>
  </svg>
);

// Report type → icon map
const REPORT_ICONS = {
  sales: IconDollarSign,
  purchases: IconShoppingCart,
  inventory: IconBox,
  clients: IconUsers,
  financial: IconTrendingUp,
  products: IconTag,
  employees: IconBriefcase,
  logistics: IconTruck,
};

const animations = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-15px); } to { opacity:1; transform:translateX(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @media (max-width: 768px) {
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  }
`;

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { theme } = useTheme();
  const { isMobile } = useResponsive();

  // Margin left pour desktop (sidebar fixe)
  const contentMarginLeft = isMobile ? "0" : "0px";

  const [animateCards, setAnimateCards] = useState(true);
  const [reportType, setReportType] = useState("sales");
  const [reportFormat, setReportFormat] = useState("json");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [activeTab, setActiveTab] = useState("generate");
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [hoveredReport, setHoveredReport] = useState<number | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // Responsive styles
  const responsive = {
    contentPadding: isMobile ? "16px" : "32px",
    cardPadding: isMobile ? "20px" : "24px",
    cardRadius: "16px",
    titleSize: isMobile ? "24px" : "28px",
    gapMedium: isMobile ? "16px" : "24px",
    gapLarge: isMobile ? "20px" : "32px"
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchSavedReports();
  }, [router]);

  const fetchSavedReports = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/reports/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedReports(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRealData = async () => {
    const token = localStorage.getItem("token");
    try {
      let url = "";
      let response: Response | null = null;

      switch (reportType) {
        case "sales":
          url = "http://localhost:3001/sales";
          response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          let sales = await response.json();
          sales = Array.isArray(sales) ? sales : [];
          let filteredSales = [...sales];
          if (dateRange.start) filteredSales = filteredSales.filter(s => new Date(s.createdAt) >= new Date(dateRange.start));
          if (dateRange.end) { const e = new Date(dateRange.end); e.setHours(23,59,59); filteredSales = filteredSales.filter(s => new Date(s.createdAt) <= e); }
          const totalSales = filteredSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
          return { type:"sales", generatedAt:new Date().toISOString(), total:totalSales, count:filteredSales.length, average: filteredSales.length>0?totalSales/filteredSales.length:0, items:filteredSales.map(s=>({id:s.id,clientName:s.clientName,productName:s.productName,quantity:s.quantity,total:s.total,status:s.status,createdAt:s.createdAt})) };

        case "purchases":
          url = "http://localhost:3001/purchases";
          response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          let purchases = await response.json();
          purchases = Array.isArray(purchases) ? purchases : [];
          let filteredPurchases = [...purchases];
          if (dateRange.start) filteredPurchases = filteredPurchases.filter(p => new Date(p.createdAt) >= new Date(dateRange.start));
          if (dateRange.end) { const e = new Date(dateRange.end); e.setHours(23,59,59); filteredPurchases = filteredPurchases.filter(p => new Date(p.createdAt) <= e); }
          const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
          return { type:"purchases", generatedAt:new Date().toISOString(), total:totalPurchases, count:filteredPurchases.length, average:filteredPurchases.length>0?totalPurchases/filteredPurchases.length:0, items:filteredPurchases.map(p=>({id:p.id,supplierName:p.supplierName,productName:p.productName,quantity:p.quantity,total:p.total,createdAt:p.createdAt})) };

        case "clients":
          url = "http://localhost:3001/clients";
          response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          let clients = await response.json();
          clients = Array.isArray(clients) ? clients : [];
          return { type:"clients", generatedAt:new Date().toISOString(), total:clients.length, items:clients.map(c=>({id:c.id,name:c.name,email:c.email,phone:c.phone,address:c.address,totalSpent:c.totalSpent||0,status:c.status||"active",createdAt:c.createdAt})) };

        case "products":
          url = "http://localhost:3001/products";
          response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          let products = await response.json();
          products = Array.isArray(products) ? products : [];
          return { type:"products", generatedAt:new Date().toISOString(), total:products.length, lowStock:products.filter(p=>(p.quantity||0)<10&&(p.quantity||0)>0).length, outOfStock:products.filter(p=>(p.quantity||0)===0).length, totalValue:products.reduce((sum,p)=>sum+((Number(p.price)||0)*(Number(p.quantity)||0)),0), items:products.map(p=>({id:p.id,name:p.name,sku:p.sku,price:p.price,quantity:p.quantity,value:(Number(p.price)||0)*(Number(p.quantity)||0)})) };

        case "inventory":
          url = "http://localhost:3001/products";
          response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          let inventory = await response.json();
          inventory = Array.isArray(inventory) ? inventory : [];
          return { type:"inventory", generatedAt:new Date().toISOString(), totalProducts:inventory.length, lowStock:inventory.filter(p=>(p.quantity||0)<10&&(p.quantity||0)>0).length, outOfStock:inventory.filter(p=>(p.quantity||0)===0).length, totalValue:inventory.reduce((sum,p)=>sum+((Number(p.price)||0)*(Number(p.quantity)||0)),0), items:inventory.map(p=>({id:p.id,name:p.name,sku:p.sku,price:p.price,quantity:p.quantity,value:(Number(p.price)||0)*(Number(p.quantity)||0)})) };

        case "financial":
          const [salesRes, purchasesRes] = await Promise.all([
            fetch("http://localhost:3001/sales", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:3001/purchases", { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          let allSales = await salesRes.json(); let allPurchases = await purchasesRes.json();
          allSales = Array.isArray(allSales)?allSales:[]; allPurchases = Array.isArray(allPurchases)?allPurchases:[];
          let fS=[...allSales],fP=[...allPurchases];
          if (dateRange.start) { const d=new Date(dateRange.start); fS=fS.filter(s=>new Date(s.createdAt)>=d); fP=fP.filter(p=>new Date(p.createdAt)>=d); }
          if (dateRange.end) { const d=new Date(dateRange.end); d.setHours(23,59,59); fS=fS.filter(s=>new Date(s.createdAt)<=d); fP=fP.filter(p=>new Date(p.createdAt)<=d); }
          const revenue=fS.reduce((s,x)=>s+(Number(x.total)||0),0), expenses=fP.reduce((s,x)=>s+(Number(x.total)||0),0), profit=revenue-expenses;
          return { type:"financial", generatedAt:new Date().toISOString(), revenue, expenses, profit, margin:revenue>0?parseFloat((profit/revenue*100).toFixed(1)):0 };

        case "employees":
          url = "http://localhost:3001/employees";
          response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          let employees = await response.json();
          employees = Array.isArray(employees)?employees:[];
          const totalSalary=employees.reduce((s,e)=>s+(Number(e.salary)||0),0);
          return { type:"employees", generatedAt:new Date().toISOString(), total:employees.length, totalSalary, averageSalary:employees.length>0?totalSalary/employees.length:0, items:employees.map(e=>({id:e.id,name:e.name,position:e.position,department:e.department,salary:e.salary,status:e.status,hireDate:e.hireDate})) };

        case "logistics":
          url = "http://localhost:3001/logistics/shipments";
          response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          let shipments = await response.json();
          shipments = Array.isArray(shipments)?shipments:[];
          const delivered=shipments.filter(s=>s.status==="delivered").length, pending=shipments.filter(s=>s.status==="pending").length;
          return { type:"logistics", generatedAt:new Date().toISOString(), total:shipments.length, delivered, pending, onTimeRate:shipments.length>0?parseFloat((delivered/shipments.length*100).toFixed(1)):0, items:shipments.map(s=>({id:s.id,trackingNumber:s.trackingNumber,clientName:s.clientName,address:s.address,status:s.status,carrier:s.carrier,estimatedDelivery:s.estimatedDelivery})) };

        default:
          return { type: reportType, generatedAt: new Date().toISOString(), items: [] };
      }
    } catch (error) {
      console.error("Erreur fetchRealData:", error);
      return null;
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const realData = await fetchRealData();
      if (realData && (realData.items?.length > 0 || realData.revenue !== undefined)) {
        setReportData(realData);
        if (reportFormat === "json") { downloadJSON(realData, reportType); showMessage(t("reports.reportExported"), "success"); }
        else if (reportFormat === "csv") { downloadCSV(realData, reportType); showMessage(t("reports.reportExported"), "success"); }
      } else {
        showMessage(t("reports.noData"), "warning");
      }
    } catch (e) {
      console.error(e);
      showMessage(t("reports.demoData"), "warning");
    }
    setGenerating(false);
  };

  const downloadJSON = (data: any, type: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `rapport_${type}_${new Date().toISOString().slice(0,19)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any, type: string) => {
    let csv = "";
    const items = data.items || [];
    if (items.length > 0) {
      const headers = Object.keys(items[0]);
      csv = headers.join(",") + "\n";
      for (const row of items) {
        csv += headers.map((h: string) => { let v=row[h]; if(v===undefined||v===null)v=""; if(typeof v==="string")v=v.replace(/"/g,'""'); if(typeof v==="object")v=JSON.stringify(v); return `"${v}"`; }).join(",") + "\n";
      }
    } else if (data.revenue !== undefined) {
      csv = `${t("reports.indicator")},${t("reports.value")}\n${t("reports.revenue")},${data.revenue}\n${t("reports.expenses")},${data.expenses}\n${t("reports.profit")},${data.profit}\n${t("reports.margin")},${data.margin}%\n`;
    } else {
      csv = `${t("reports.indicator")},${t("reports.value")}\n${t("reports.total")},0\n`;
    }
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `rapport_${type}_${new Date().toISOString().slice(0,19)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const reportTypes = [
    { id: "sales",     label: t("reports.salesReport"),     Icon: IconDollarSign,  color: theme.accent,  description: t("reports.salesDesc") },
    { id: "purchases", label: t("reports.purchasesReport"), Icon: IconShoppingCart, color: "#f59e0b",     description: t("reports.purchasesDesc") },
    { id: "inventory", label: t("reports.inventoryReport"), Icon: IconBox,          color: "#3b82f6",     description: t("reports.inventoryDesc") },
    { id: "clients",   label: t("reports.clientsReport"),   Icon: IconUsers,        color: "#8b5cf6",     description: t("reports.clientsDesc") },
    { id: "financial", label: t("reports.financialReport"), Icon: IconTrendingUp,   color: theme.accent,  description: t("reports.financialDesc") },
    { id: "products",  label: t("reports.productsReport"),  Icon: IconTag,          color: "#ec4899",     description: t("reports.productsDesc") },
    { id: "employees", label: t("reports.employeesReport"), Icon: IconBriefcase,    color: "#14b8a6",     description: t("reports.employeesDesc") },
    { id: "logistics", label: t("reports.logisticsReport"), Icon: IconTruck,        color: "#3b82f6",     description: t("reports.logisticsDesc") },
  ];

  const currentReport = reportTypes.find(r => r.id === reportType);
  const CurrentReportIcon = currentReport?.Icon || IconBarChart;

  const MessageIcon = messageType === "success" ? IconCheckCircle : IconAlertTriangle;
  const messageColor = messageType === "success" ? theme.accent : messageType === "error" ? "#ef4444" : "#f59e0b";

  return (
    <div style={{ minHeight: "100vh", background: theme.background, display: "flex", overflowX: "hidden" }}>
      <style>{animations}</style>

      {/* Sidebar - comme sur les autres pages */}
      <Sidebar />

      <div style={{
        marginLeft: contentMarginLeft,
        flex: 1,
        paddingTop: responsive.contentPadding,
        paddingLeft: responsive.contentPadding,
        paddingRight: responsive.contentPadding,
        paddingBottom: isMobile ? "70px" : responsive.contentPadding,
        background: theme.background
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: responsive.gapLarge, animation: "fadeInDown 0.5s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: responsive.titleSize, display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconFileText size={isMobile ? 24 : 28} color={theme.primary} />
                  {t("common.reports")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("reports.subtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "12px", pointerEvents: "none" }}>
                    {reportFormat === "json" ? <IconJSON size={16} color={theme.textSecondary} /> : <IconCSV size={16} color={theme.textSecondary} />}
                  </span>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                    style={{ padding: "10px 16px 10px 36px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.text, cursor: "pointer", outline: "none", appearance: "none", fontSize: isMobile ? "13px" : "14px" }}
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notification Message ── */}
          {message && (
            <div style={{ background: `${messageColor}15`, border: `1px solid ${messageColor}`, color: messageColor, padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", animation: "fadeInUp 0.3s ease" }}>
              <MessageIcon size={18} color={messageColor} />
              {message}
            </div>
          )}

          {/* ── Tabs (scrollable on mobile) ── */}
          <div style={{
            display: "flex", gap: "8px", marginBottom: "24px", borderBottom: `1px solid ${theme.border}`,
            overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none"
          }} className="hide-scrollbar">
            <button
              onClick={() => setActiveTab("generate")}
              style={{
                padding: isMobile ? "10px 20px" : "12px 24px", background: activeTab === "generate" ? theme.primary : "transparent",
                border: "none", borderRadius: "12px 12px 0 0", color: activeTab === "generate" ? "white" : theme.textSecondary,
                cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px",
                whiteSpace: "nowrap", fontSize: isMobile ? "13px" : "14px", WebkitTapHighlightColor: "transparent"
              }}
            >
              <IconBarChart size={isMobile ? 14 : 16} color={activeTab === "generate" ? "white" : theme.textSecondary} />
              {t("reports.generate")}
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              style={{
                padding: isMobile ? "10px 20px" : "12px 24px", background: activeTab === "saved" ? theme.primary : "transparent",
                border: "none", borderRadius: "12px 12px 0 0", color: activeTab === "saved" ? "white" : theme.textSecondary,
                cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px",
                whiteSpace: "nowrap", fontSize: isMobile ? "13px" : "14px", WebkitTapHighlightColor: "transparent"
              }}
            >
              <IconFolder size={isMobile ? 14 : 16} color={activeTab === "saved" ? "white" : theme.textSecondary} />
              {t("reports.savedReports")}
            </button>
          </div>

          {/* ── Generate Tab ── */}
          {activeTab === "generate" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: responsive.gapMedium, marginBottom: responsive.gapMedium }}>

                {/* Configuration card */}
                <div
                  style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, transition: "transform 0.2s" }}
                  onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.transform = "translateY(-3px)" }}
                  onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.transform = "translateY(0)" }}
                >
                  <h2 style={{ color: theme.text, fontSize: isMobile ? "18px" : "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <IconSettings size={isMobile ? 18 : 20} color={theme.primary} />
                    {t("reports.configuration")}
                  </h2>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: isMobile ? "12px" : "13px" }}>{t("reports.reportType")}</label>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)", gap: "8px" }}>
                      {reportTypes.map((type) => {
                        const TypeIcon = type.Icon;
                        const isActive = reportType === type.id;
                        const isHovered = hoveredType === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setReportType(type.id)}
                            onMouseEnter={() => setHoveredType(type.id)}
                            onMouseLeave={() => setHoveredType(null)}
                            style={{
                              padding: isMobile ? "10px" : "12px", background: isActive ? type.color : (isHovered ? theme.surfaceHover : theme.surface),
                              border: `1px solid ${isActive ? "transparent" : theme.border}`, borderRadius: "10px", color: isActive ? "white" : theme.textSecondary,
                              cursor: "pointer", textAlign: "center", transition: "all 0.2s", WebkitTapHighlightColor: "transparent"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                              <TypeIcon size={isMobile ? 20 : 22} color={isActive ? "white" : type.color} />
                            </div>
                            <div style={{ fontSize: isMobile ? "10px" : "11px" }}>{type.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ color: theme.textSecondary, display: "block", marginBottom: "8px", fontSize: isMobile ? "12px" : "13px" }}>
                      {t("reports.dateRange")} ({t("reports.optional")})
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ start: e.target.value, end: dateRange.end })}
                        style={{
                          padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px",
                          color: theme.text, transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px",
                          WebkitAppearance: "none"
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                        onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ start: dateRange.start, end: e.target.value })}
                        style={{
                          padding: "12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px",
                          color: theme.text, fontSize: isMobile ? "13px" : "14px", WebkitAppearance: "none"
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={generateReport}
                    disabled={generating}
                    style={{
                      width: "100%", padding: isMobile ? "14px" : "14px", background: theme.gradient, color: "white",
                      border: "none", borderRadius: "12px", cursor: generating ? "not-allowed" : "pointer",
                      opacity: generating ? 0.7 : 1, fontWeight: "bold", transition: "opacity 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      fontSize: isMobile ? "14px" : "15px", WebkitTapHighlightColor: "transparent"
                    }}
                  >
                    {generating
                      ? (<><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}><IconLoader size={18} color="white" /></span>{t("reports.generating")}</>)
                      : (<><IconBarChart size={18} color="white" />{t("reports.generate")}</>)
                    }
                  </button>
                </div>

                {/* Information card */}
                {!isMobile && (
                  <div
                    style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, transition: "transform 0.3s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <h2 style={{ color: theme.text, fontSize: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconInfo size={20} color={theme.primary} />
                      {t("reports.information")}
                    </h2>

                    <div style={{ marginBottom: "16px", padding: "24px 16px", background: theme.surfaceHover, borderRadius: "12px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                        <CurrentReportIcon size={48} color={currentReport?.color || theme.primary} />
                      </div>
                      <div style={{ color: theme.text, fontWeight: "bold", marginBottom: "4px" }}>{currentReport?.label || t("reports.report")}</div>
                      <div style={{ color: theme.textSecondary, fontSize: "12px" }}>{currentReport?.description || ""}</div>
                    </div>

                    <div style={{ padding: "16px", background: `${theme.primary}10`, borderRadius: "12px", border: `1px solid ${theme.primary}30` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <IconLightbulb size={20} color={theme.primary} />
                        <span style={{ color: theme.text, fontSize: "14px" }}>{t("reports.tip")}</span>
                      </div>
                      <p style={{ color: theme.textSecondary, fontSize: "12px" }}>
                        {t("reports.tipMessage")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile info card - simplified */}
              {isMobile && (
                <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: "16px", border: `1px solid ${theme.border}`, marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <CurrentReportIcon size={32} color={currentReport?.color || theme.primary} />
                    <div>
                      <div style={{ color: theme.text, fontWeight: "bold", fontSize: "13px" }}>{currentReport?.label || t("reports.report")}</div>
                      <div style={{ color: theme.textSecondary, fontSize: "10px" }}>{currentReport?.description?.substring(0, 60) || ""}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Saved Reports Tab ── */}
          {activeTab === "saved" && (
            <div style={{ background: theme.surface, borderRadius: responsive.cardRadius, padding: responsive.cardPadding, border: `1px solid ${theme.border}`, animation: "fadeInUp 0.5s ease" }}>
              <h2 style={{ color: theme.text, fontSize: isMobile ? "18px" : "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <IconFolder size={isMobile ? 18 : 20} color={theme.primary} />
                {t("reports.savedReports")}
              </h2>
              {savedReports.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {savedReports.slice(0, isMobile ? 10 : 20).map((report, idx) => {
                    const ReportTypeIcon = REPORT_ICONS[report.type as keyof typeof REPORT_ICONS] || IconFileText;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredReport(idx)}
                        onMouseLeave={() => setHoveredReport(null)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "14px" : "16px",
                          background: hoveredReport === idx ? theme.surfaceHover : theme.surface, borderRadius: "12px",
                          transition: "all 0.2s", transform: hoveredReport === idx ? "translateX(5px)" : "translateX(0)",
                          border: `1px solid ${hoveredReport === idx ? theme.primary : "transparent"}`
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                          <ReportTypeIcon size={isMobile ? 18 : 20} color={theme.primary} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "13px" : "14px" }}>{report.name}</div>
                            <div style={{ color: theme.textSecondary, fontSize: isMobile ? "10px" : "11px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                              <IconClock size={isMobile ? 10 : 11} color={theme.textSecondary} />
                              {t("reports.createdOn")} {new Date(report.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US")}
                            </div>
                          </div>
                        </div>
                        <button
                          style={{
                            background: theme.gradient, color: "white", border: "none", borderRadius: "8px",
                            padding: isMobile ? "8px 14px" : "8px 16px", cursor: "pointer", transition: "opacity 0.2s",
                            display: "flex", alignItems: "center", gap: "6px", fontSize: isMobile ? "12px" : "13px",
                            WebkitTapHighlightColor: "transparent"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          <IconDownload size={isMobile ? 12 : 14} color="white" />
                          {!isMobile && t("reports.download")}
                        </button>
                      </div>
                    );
                  })}
                  {savedReports.length > 10 && isMobile && (
                    <div style={{ textAlign: "center", padding: "12px", color: theme.textSecondary, fontSize: "11px" }}>
                      +{savedReports.length - 10} autres rapports
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: isMobile ? "40px" : "60px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", opacity: 0.4 }}>
                    <IconFolder size={isMobile ? 48 : 64} color={theme.textSecondary} />
                  </div>
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "13px" : "14px" }}>{t("reports.noSavedReports")}</p>
                  <p style={{ color: "#666", fontSize: isMobile ? "11px" : "12px" }}>{t("reports.noSavedReportsMessage")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}