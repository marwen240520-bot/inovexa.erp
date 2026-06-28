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
import SelectAllCheckbox from "@/components/ui/SelectAllCheckbox";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

// --- Interfaces ----------------------------------------------------------------

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  phone: string;
  hireDate: string;
  status: string;
}

interface Department {
  id: number;
  name: string;
}

interface DepartmentData {
  name: string;
  count: number;
}

interface ModalState {
  open: boolean;
  form: Partial<Employee>;
  editMode: boolean;
  editId: number | null;
}

interface StatsState {
  total: number;
  active: number;
  onLeave: number;
  totalPayroll: number;
  avgSalary: number;
  departments: number;
}

// --- SVG Icon Components -------------------------------------------------------

const IconUsers = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconUserCheck = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
);

const IconUmbrella = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/>
  </svg>
);

const IconCurrencyDollar = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);

const IconTrendingUp = ({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconPieChart = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>
);

const IconBarChart2 = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconBuilding = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18"/>
    <path d="M9 21V9"/>
  </svg>
);

const IconFilter = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconSearch = ({ size = 15, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const IconList = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconGrid = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const IconEdit = ({ size = 13, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = ({ size = 13, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconPlus = ({ size = 15, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSave = ({ size = 14, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconLoader = ({ size = 40, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconCheckCircle = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const IconXCircle = ({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

const IconChevronDown = ({ size = 11, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconDotFilled = ({ size = 7, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" style={style}>
    <circle cx="4" cy="4" r="4" fill={color}/>
  </svg>
);

const IconUserTie = ({ size = 28, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="7" r="4"/>
    <path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
    <path d="M12 11v4"/>
    <path d="m10 13 2 2 2-2"/>
  </svg>
);

// --- Status helpers ------------------------------------------------------------

function getStatusDotColor(status: string, theme: Record<string, string>) {
  if (status === "active") return theme.accent;
  if (status === "leave") return "#f59e0b";
  if (status === "inactive") return "#ef4444";
  return theme.textSecondary;
}

interface StatusSelectProps {
  empId: number;
  status: string;
  onUpdate: (id: number, status: string) => void;
  updatingStatus: number | null;
  isMobile: boolean;
  t: (key: string) => string;
  theme: Record<string, string>;
  rounded?: boolean;
}

function StatusSelect({ empId, status, onUpdate, updatingStatus, isMobile, t, theme, rounded = false }: StatusSelectProps) {
  const color = getStatusDotColor(status, theme);
  const dotIcon = status === "leave"
    ? <IconUmbrella size={12} color={color} style={{ flexShrink: 0 }} />
    : <IconDotFilled size={7} color={color} style={{ flexShrink: 0 }} />;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: `${color}18`, border: `1px solid ${color}55`,
      borderRadius: rounded ? "20px" : "8px",
      padding: "0 4px 0 8px",
      opacity: updatingStatus === empId ? 0.6 : 1,
      transition: "opacity 0.2s"
    }}>
      {dotIcon}
      <select
        value={status}
        onChange={(e) => onUpdate(empId, e.target.value)}
        disabled={updatingStatus === empId}
        style={{
          background: "transparent", color, border: "none",
          padding: isMobile ? "4px 2px" : "5px 2px",
          cursor: updatingStatus === empId ? "wait" : "pointer",
          fontWeight: "500", fontSize: isMobile ? "10px" : "12px",
          appearance: "none", outline: "none"
        }}
      >
        <option value="active">{t("hr.active")}</option>
        <option value="leave">{t("hr.onLeave")}</option>
        <option value="inactive">{t("hr.inactive")}</option>
      </select>
      <IconChevronDown size={10} color={color} style={{ flexShrink: 0, pointerEvents: "none" }} />
    </div>
  );
}

// --- Main Component ------------------------------------------------------------

export default function HRPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatCurrency } = useAppSettings();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { theme } = useTheme();

  // FIX: Margin left for desktop sidebar (280px)
  const contentMarginLeft = isMobile ? "0" : "0px";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState<ModalState>({ open: false, form: {}, editMode: false, editId: null });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<StatsState>({ total: 0, active: 0, onLeave: 0, totalPayroll: 0, avgSalary: 0, departments: 0 });
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);

  const cardRadius = isMobile ? "16px" : "18px";
  const gridGap = isMobile ? "10px" : "16px";
  const sectionMargin = isMobile ? "20px" : "32px";
  const tableFontSize = isMobile ? "11px" : "13px";
  const modalWidth = isMobile ? "95%" : "550px";
  const modalPadding = isMobile ? "20px" : "32px";
  const gridMinWidth = isMobile ? "280px" : "300px";
  const chartHeight = isMobile ? "200px" : "250px";

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
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cardPop {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    fetchEmployees();
    fetchDepartments();
    setTimeout(() => setAnimateCards(true), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } });
      let data: Employee[] = await res.json();
      data = Array.isArray(data) ? data : [];
      setEmployees(data);
      const activeCount = data.filter(e => e.status === "active").length;
      const onLeaveCount = data.filter(e => e.status === "leave").length;
      const totalPayroll = data.reduce((s, e) => s + (Number(e.salary) || 0), 0);
      const avgSalary = data.length > 0 ? totalPayroll / data.length : 0;
      setStats(prev => ({ ...prev, total: data.length, active: activeCount, onLeave: onLeaveCount, totalPayroll, avgSalary }));
      const deptMap: Record<string, number> = {};
      data.forEach(e => { if (e.department) deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
      setDepartmentData(Object.entries(deptMap).map(([name, count]) => ({ name, count })));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, { headers: { Authorization: `Bearer ${token}` } });
      const data: Department[] = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
      setStats(prev => ({ ...prev, departments: Array.isArray(data) ? data.length : 0 }));
    } catch(e) { console.error(e); }
  };

  const createEmployee = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchEmployees();
        showMessage(t("hr.employeeCreated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const updateEmployee = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${modal.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchEmployees();
        showMessage(t("hr.employeeUpdated"), "success");
      } else { showMessage(t("common.error"), "error"); }
    } catch(e) { showMessage(t("common.error"), "error"); }
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    setUpdatingStatus(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchEmployees();
        const statusText = status === "active" ? t("hr.active") : status === "leave" ? t("hr.onLeave") : t("hr.inactive");
        showMessage(`${t("hr.statusUpdated")}: ${statusText}`, "success");
      } else {
        const employee = employees.find(e => e.id === id);
        if (employee) {
          const putRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...employee, status })
          });
          if (putRes.ok) {
            await fetchEmployees();
            const statusText = status === "active" ? t("hr.active") : status === "leave" ? t("hr.onLeave") : t("hr.inactive");
            showMessage(`${t("hr.statusUpdated")}: ${statusText}`, "success");
          } else { showMessage(t("common.error"), "error"); }
        } else { showMessage(t("common.error"), "error"); }
      }
    } catch(e) { showMessage(t("common.error"), "error"); }
    finally { setUpdatingStatus(null); }
  };

  const deleteEmployee = async (id: number) => {
    if (confirm(t("hr.confirmDelete"))) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchEmployees();
      showMessage(t("hr.employeeDeleted"), "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(t("hr.confirmBulkDelete").replace("{count}", String(selectedIds.length)))) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      fetchEmployees();
      setSelectedIds([]);
      showMessage(t("hr.employeesDeleted").replace("{count}", String(selectedIds.length)), "success");
    }
  };

  const importEmployees = async (data: Partial<Employee>[]) => {
    setImporting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/employees/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employees: data })
      });
      const result = await res.json();
      if (res.ok) {
        showMessage(`${result.success} employé(s) importé(s) avec succés${result.errors > 0 ? `, ${result.errors} erreur(s)` : ""}`, "success");
        fetchEmployees();
      } else { showMessage(result.message || "Erreur lors de l'import", "error"); }
    } catch (error) {
      showMessage("Erreur de connexion lors de l'import", "error");
    } finally { setImporting(false); }
  };

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (emp: Employee) => {
    setModal({
      open: true, editMode: true, editId: emp.id,
      form: {
        name: emp.name || "", email: emp.email || "", position: emp.position || "",
        department: emp.department || "", salary: emp.salary || 0, phone: emp.phone || "",
        hireDate: emp.hireDate ? emp.hireDate.split("T")[0] : "", status: emp.status || "active"
      }
    });
  };

  const filteredEmployees = employees.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDepartment = filterDepartment === "all" || e.department === filterDepartment;
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchDepartment && matchStatus;
  });

  // -- Stats cards ------------------------------------------------------------

  const statsCards = [
    {
      icon: <IconUsers size={isMobile ? 20 : 24} color={theme.primary} />,
      label: t("hr.totalEmployees"), value: stats.total,
      color: theme.primary, bg: `${theme.primary}15`, border: `${theme.primary}30`,
    },
    {
      icon: <IconUserCheck size={isMobile ? 20 : 24} color={theme.accent} />,
      label: t("hr.activeEmployees"), value: stats.active,
      color: theme.accent, bg: `${theme.accent}15`, border: `${theme.accent}30`,
    },
    {
      icon: <IconUmbrella size={isMobile ? 20 : 24} color="#f59e0b" />,
      label: t("hr.onLeave"), value: stats.onLeave,
      color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30",
    },
    {
      icon: <IconCurrencyDollar size={isMobile ? 20 : 24} color={theme.accent} />,
      label: t("hr.totalPayroll"), value: formatCurrency(stats.totalPayroll),
      color: theme.accent, bg: `${theme.accent}15`, border: `${theme.accent}30`,
    },
    {
      icon: <IconTrendingUp size={isMobile ? 20 : 24} color="#f59e0b" />,
      label: t("hr.averageSalary"), value: formatCurrency(Math.round(stats.avgSalary)),
      color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30",
    }
  ];

  const deptChartData = {
    labels: departmentData.map(d => d.name?.length > (isMobile ? 12 : 15) ? d.name.substring(0, isMobile ? 10 : 12) + "..." : d.name),
    datasets: [{
      data: departmentData.map(d => d.count),
      backgroundColor: [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec489a", "#06b6d4"],
      borderWidth: 0
    }]
  };

  const deptChartOptions = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: theme.textSecondary, font: { size: isMobile ? 9 : 11 } }, position: "bottom" as const },
      tooltip: {
        backgroundColor: theme.surface, titleColor: theme.text, bodyColor: theme.textSecondary,
        borderColor: theme.primary, borderWidth: 1,
        callbacks: {
          label: function(context: { raw: unknown; label: string }) {
            const value = (context.raw as number) || 0;
            const total = departmentData.reduce((sum, d) => sum + d.count, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${value} ${t("hr.employees")} (${percentage}%)`;
          }
        }
      }
    }
  };

  // FIX: Loading state with sidebar
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        minHeight: "100vh", 
        width: "100%", 
        background: theme.background,
        padding: 0,
        margin: 0
      }}>
        <Sidebar />
        <div style={{ 
          flex: 1,
          marginLeft: isMobile ? "0" : "280px",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          minHeight: "100vh",
          background: theme.background
        }}>
          <style>{animations}</style>
          <div style={{ textAlign: "center" }}>
            <IconLoader size={isMobile ? 40 : 48} color={theme.primary} style={{ margin: "0 auto 16px", display: "block" }} />
            <p style={{ fontSize: isMobile ? "12px" : "14px", color: theme.textSecondary }}>{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: theme.background, 
      display: "flex",
      padding: 0,
      margin: 0
    }}>
      <Sidebar />
      <div style={{
        marginLeft: contentMarginLeft,
        flex: 1,
        padding: isMobile ? "14px 12px" : "24px",
        paddingBottom: isMobile ? "80px" : "24px",
        overflowX: "hidden",
        background: theme.background,
        minHeight: "100vh"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          <style>{animations}</style>

          {/* -- Header -- */}
          <div style={{ marginBottom: sectionMargin, animation: "fadeInDown 0.5s ease" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "14px" : "16px",
            }}>
              <div>
                <h1 style={{ color: theme.text, fontSize: isMobile ? "20px" : "28px", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                  <IconUserTie size={isMobile ? 22 : 28} color={theme.primary} />
                  {t("common.hr")}
                </h1>
                <p style={{ color: theme.textSecondary, marginTop: "4px", fontSize: isMobile ? "12px" : "14px" }}>{t("hr.subtitle")}</p>
              </div>

              <div style={{
                display: "flex", gap: "8px", alignItems: "center",
                width: isMobile ? "100%" : "auto",
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}>
                {/* View toggle */}
                <div style={{ display: "flex", gap: "4px", flex: isMobile ? "0 0 auto" : "unset" }}>
                  {[
                    { mode: "list", Icon: IconList, label: "Liste" },
                    { mode: "grid", Icon: IconGrid, label: "Grille" }
                  ].map(({ mode, Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: isMobile ? "8px 10px" : "8px 12px",
                        background: viewMode === mode ? theme.primary : theme.surface,
                        border: `1px solid ${viewMode === mode ? theme.primary : theme.border}`,
                        borderRadius: "10px",
                        color: viewMode === mode ? "white" : theme.textSecondary,
                        cursor: "pointer", transition: "all 0.2s",
                        fontSize: isMobile ? "11px" : "13px",
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        minHeight: "38px",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <Icon size={13} color={viewMode === mode ? "white" : theme.textSecondary} />
                      {!isMobile && label}
                    </button>
                  ))}
                </div>

                {/* Import & Export */}
                <div style={{ display: "flex", gap: "8px", flex: isMobile ? "0 0 auto" : "unset" }}>
                  <ImportButton onImport={importEmployees} label={isMobile ? "" : t("common.import")} />
                  <ExportButtons data={filteredEmployees} filename="employes" iconOnly={isMobile} />
                </div>

                {/* Add employee é full-width on mobile */}
                <button
                  onClick={() => setModal({ open: true, editMode: false, editId: null, form: { name: "", email: "", position: "", department: "", salary: 0, phone: "", hireDate: "", status: "active" } })}
                  style={{
                    background: theme.gradient, color: "white",
                    padding: isMobile ? "11px 16px" : "11px 22px",
                    border: "none", borderRadius: "12px", cursor: "pointer",
                    fontSize: isMobile ? "13px" : "14px", fontWeight: "600",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
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
                  {t("hr.addEmployee")}
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
              padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", textAlign: "center",
              animation: "fadeInUp 0.3s ease", fontSize: isMobile ? "12px" : "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
              {messageType === "success" ? <IconCheckCircle size={16} color={theme.accent} /> : <IconXCircle size={16} color="#f87171" />}
              {message}
            </div>
          )}

          {/* -- Stats Cards é improved -- */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
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
                {/* Decorative blob */}
                <div style={{
                  position: "absolute", top: isMobile ? "-12px" : "-18px", right: isMobile ? "-12px" : "-18px",
                  width: isMobile ? "48px" : "72px", height: isMobile ? "48px" : "72px",
                  borderRadius: "50%", background: card.bg, pointerEvents: "none",
                }} />
                {/* Icon pill */}
                <div style={{
                  width: isMobile ? "34px" : "42px", height: isMobile ? "34px" : "42px",
                  borderRadius: isMobile ? "10px" : "12px", background: card.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div style={{ textAlign: isMobile ? "center" : "left" }}>
                  <div style={{
                    fontSize: isMobile ? "15px" : "22px", color: card.color,
                    fontWeight: "700", lineHeight: 1.1, letterSpacing: "-0.02em",
                  }}>
                    {card.value}
                  </div>
                  <div style={{
                    fontSize: isMobile ? "9px" : "11px", color: theme.textSecondary,
                    marginTop: "3px", fontWeight: "500", lineHeight: 1.2,
                  }}>
                    {card.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* -- Department Charts -- */}
          {departmentData.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : (departmentData.length > 4 ? "repeat(2, 1fr)" : "1fr 1fr"),
              gap: "20px", marginBottom: sectionMargin,
              animation: "fadeInUp 0.5s ease 0.35s", opacity: animateCards ? 1 : 0
            }}>
              <div style={{ background: theme.surface, borderRadius: cardRadius, padding: "20px", border: `1px solid ${theme.border}` }}>
                <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconPieChart size={16} color={theme.primary} />
                  {t("hr.departmentDistribution")}
                </h3>
                <div style={{ height: chartHeight }}>
                  <Doughnut data={deptChartData} options={deptChartOptions} />
                </div>
              </div>
              <div style={{ background: theme.surface, borderRadius: cardRadius, padding: "20px", border: `1px solid ${theme.border}` }}>
                <h3 style={{ color: theme.text, marginBottom: "16px", fontSize: isMobile ? "14px" : "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconBarChart2 size={16} color={theme.primary} />
                  {t("hr.departmentStats")}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {departmentData.map((dept, idx) => (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: theme.textSecondary, fontSize: isMobile ? "11px" : "13px" }}>{dept.name}</span>
                        <span style={{ color: theme.accent, fontWeight: "bold", fontSize: isMobile ? "11px" : "13px" }}>{dept.count} {t("hr.employees")}</span>
                      </div>
                      <div style={{ background: theme.surfaceHover, borderRadius: "8px", height: "4px" }}>
                        <div style={{
                          width: `${(dept.count / stats.total) * 100}%`,
                          background: [theme.primary, theme.accent, "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"][idx % 6],
                          height: "4px", borderRadius: "8px", transition: "width 0.5s"
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -- Filters -- */}
          <div style={{ marginBottom: "20px", animation: "fadeInUp 0.5s ease 0.4s", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ flex: 2, position: "relative", width: isMobile ? "100%" : "auto" }}>
                <IconSearch size={15} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text" placeholder={`${t("common.search")}...`} value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px 10px 36px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px", boxSizing: "border-box" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "160px" }}>
                <IconBuilding size={13} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 30px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px", appearance: "none" }}>
                  <option value="all">{t("hr.allDepartments")}</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  {departmentData.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ position: "relative", minWidth: isMobile ? "100%" : "150px" }}>
                <IconFilter size={13} color={theme.textSecondary} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 30px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px", appearance: "none" }}>
                  <option value="all">{t("hr.allStatus")}</option>
                  <option value="active">{t("hr.active")}</option>
                  <option value="leave">{t("hr.onLeave")}</option>
                  <option value="inactive">{t("hr.inactive")}</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <SelectAllCheckbox
                items={filteredEmployees}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onSelectAll={(ids: number[]) => setSelectedIds(ids)}
                getItemId={(item: Employee) => item.id}
              />
              {selectedIds.length > 0 && (
                <button
                  onClick={deleteSelected}
                  style={{
                    background: "#ef4444", color: "white", border: "none", borderRadius: "8px",
                    padding: "8px 16px", cursor: "pointer", fontSize: isMobile ? "12px" : "13px",
                    fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px",
                    WebkitTapHighlightColor: "transparent", transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <IconTrash size={13} color="white" />
                  {t("common.delete")} ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* -- List View -- */}
          {viewMode === "list" && (
            <div style={{
              background: theme.surface, borderRadius: cardRadius, padding: isMobile ? "12px" : "16px",
              border: `1px solid ${theme.border}`, overflowX: "auto",
              animation: "fadeInUp 0.5s ease 0.5s", opacity: animateCards ? 1 : 0
            }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "700px" : "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontSize: tableFontSize }}>
                      <th style={{ padding: "8px", width: "36px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                          onChange={() => {
                            if (selectedIds.length === filteredEmployees.length) setSelectedIds([]);
                            else setSelectedIds(filteredEmployees.map(e => e.id));
                          }}
                          style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: theme.primary }}
                        />
                      </th>
                      <th style={{ padding: "8px", textAlign: "left" }}>{t("common.name")}</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>{t("common.email")}</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>{t("hr.position")}</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>{t("hr.department")}</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>{t("hr.salary")}</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>{t("common.status")}</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp, idx) => (
                      <tr
                        key={emp.id}
                        style={{ borderBottom: `1px solid ${theme.surfaceHover}`, transition: "background 0.2s", animation: `slideIn 0.3s ease ${idx * 0.03}s` }}
                        onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(emp.id)}
                            onChange={() => {
                              if (selectedIds.includes(emp.id)) setSelectedIds(selectedIds.filter(id => id !== emp.id));
                              else setSelectedIds([...selectedIds, emp.id]);
                            }}
                            style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: theme.primary }}
                          />
                        </td>
                        <td style={{ padding: "8px", color: theme.text, fontWeight: "500", fontSize: tableFontSize }}>{emp.name}</td>
                        <td style={{ padding: "8px", color: theme.textSecondary, fontSize: tableFontSize }}>{emp.email}</td>
                        <td style={{ padding: "8px", color: theme.textSecondary, fontSize: tableFontSize }}>{emp.position}</td>
                        <td style={{ padding: "8px", color: theme.textSecondary, fontSize: tableFontSize }}>{emp.department || "-"}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: theme.accent, fontWeight: "bold", fontSize: tableFontSize }}>
                          {formatCurrency(emp.salary)}
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <StatusSelect empId={emp.id} status={emp.status} onUpdate={updateStatus} updatingStatus={updatingStatus} isMobile={isMobile} t={t} theme={theme} />
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            {/* Edit button */}
                            <button
                              onClick={() => openEditModal(emp)}
                              title={t("common.edit")}
                              style={{
                                background: "#f59e0b20", color: "#f59e0b",
                                border: "1px solid #f59e0b40", borderRadius: "8px",
                                width: isMobile ? "32px" : "30px", height: isMobile ? "32px" : "30px",
                                cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s", WebkitTapHighlightColor: "transparent", flexShrink: 0,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.color = "white"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#f59e0b20"; e.currentTarget.style.color = "#f59e0b"; }}
                            >
                              <IconEdit size={isMobile ? 13 : 12} color="currentColor" />
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => deleteEmployee(emp.id)}
                              title={t("common.delete")}
                              style={{
                                background: "#ef444420", color: "#ef4444",
                                border: "1px solid #ef444440", borderRadius: "8px",
                                width: isMobile ? "32px" : "30px", height: isMobile ? "32px" : "30px",
                                cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s", WebkitTapHighlightColor: "transparent", flexShrink: 0,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "white"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#ef444420"; e.currentTarget.style.color = "#ef4444"; }}
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
              {filteredEmployees.length === 0 && (
                <div style={{ textAlign: "center", padding: isMobile ? "32px 16px" : "48px" }}>
                  <IconUserTie size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                    {searchTerm ? t("common.noResults") : t("hr.noEmployees")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* -- Grid View -- */}
          {viewMode === "grid" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))`,
              gap: "16px",
              animation: "fadeInUp 0.5s ease 0.5s",
              opacity: animateCards ? 1 : 0
            }}>
              {filteredEmployees.map((emp, idx) => (
                <div
                  key={emp.id}
                  style={{
                    background: theme.surface, borderRadius: cardRadius, padding: "16px",
                    border: `1px solid ${getStatusDotColor(emp.status, theme)}40`,
                    transition: "transform 0.3s, box-shadow 0.3s",
                    animation: `fadeInUp 0.3s ease ${idx * 0.05}s`
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{
                      width: isMobile ? "40px" : "50px", height: isMobile ? "40px" : "50px",
                      borderRadius: "50%", background: theme.gradient,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isMobile ? "16px" : "20px", color: "white", fontWeight: "bold", flexShrink: 0
                    }}>
                      {emp.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div style={{ color: theme.text, fontWeight: "bold", fontSize: isMobile ? "13px" : "15px" }}>{emp.name}</div>
                      <div style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{emp.position}</div>
                    </div>
                  </div>

                  {[
                    { label: t("common.email"), value: emp.email },
                    { label: t("hr.department"), value: emp.department || "-" },
                    { label: t("hr.salary"), value: formatCurrency(emp.salary), bold: true, color: theme.accent }
                  ].map((row, i) => (
                    <div key={i} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{row.label}</span>
                      <span style={{ color: row.color || theme.textSecondary, fontSize: isMobile ? (row.bold ? "11px" : "9px") : (row.bold ? "13px" : "11px"), fontWeight: row.bold ? "bold" : "normal" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}

                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: theme.textSecondary, fontSize: isMobile ? "9px" : "11px" }}>{t("common.status")}</span>
                    <StatusSelect empId={emp.id} status={emp.status} onUpdate={updateStatus} updatingStatus={updatingStatus} isMobile={isMobile} t={t} theme={theme} rounded={true} />
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => openEditModal(emp)}
                      style={{
                        flex: 1, padding: "8px", background: "#f59e0b20", color: "#f59e0b",
                        border: "1px solid #f59e0b40", borderRadius: "8px", cursor: "pointer",
                        fontSize: isMobile ? "10px" : "12px", fontWeight: "600",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
                        transition: "all 0.2s", minHeight: "34px", WebkitTapHighlightColor: "transparent",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#f59e0b20"; e.currentTarget.style.color = "#f59e0b"; }}
                    >
                      <IconEdit size={12} color="currentColor" />
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      style={{
                        flex: 1, padding: "8px", background: "#ef444420", color: "#ef4444",
                        border: "1px solid #ef444440", borderRadius: "8px", cursor: "pointer",
                        fontSize: isMobile ? "10px" : "12px", fontWeight: "600",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
                        transition: "all 0.2s", minHeight: "34px", WebkitTapHighlightColor: "transparent",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "white"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#ef444420"; e.currentTarget.style.color = "#ef4444"; }}
                    >
                      <IconTrash size={12} color="currentColor" />
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              ))}
              {filteredEmployees.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", gridColumn: "1 / -1" }}>
                  <IconUserTie size={isMobile ? 36 : 48} color={theme.textSecondary} style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
                  <p style={{ color: theme.textSecondary, fontSize: isMobile ? "12px" : "14px" }}>
                    {searchTerm ? t("common.noResults") : t("hr.noEmployees")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* -- Modal Add / Edit Employee -- */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease", padding: "16px"
        }}>
          <div style={{ background: theme.surface, padding: modalPadding, borderRadius: "20px", width: modalWidth, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${theme.border}` }}>
            <h2 style={{ color: theme.text, marginBottom: "20px", fontSize: isMobile ? "17px" : "22px", display: "flex", alignItems: "center", gap: "10px" }}>
              {modal.editMode
                ? <><IconEdit size={isMobile ? 16 : 18} color={theme.primary} /> {t("hr.editEmployee")}</>
                : <><IconPlus size={isMobile ? 16 : 18} color={theme.primary} /> {t("hr.addEmployee")}</>}
            </h2>

            {([
              { label: t("common.name") + " *", key: "name" as keyof Employee, type: "text", placeholder: t("hr.employeeName"), autoFocus: true },
              { label: t("common.email") + " *", key: "email" as keyof Employee, type: "email", placeholder: "Email" },
              { label: t("hr.position") + " *", key: "position" as keyof Employee, type: "text", placeholder: t("hr.position") },
              { label: t("hr.department"), key: "department" as keyof Employee, type: "text", placeholder: t("hr.department") },
              { label: t("hr.salary") + " *", key: "salary" as keyof Employee, type: "number", placeholder: "0", step: "0.01" },
              { label: t("common.phone"), key: "phone" as keyof Employee, type: "tel", placeholder: t("common.phone") },
              { label: t("hr.hireDate"), key: "hireDate" as keyof Employee, type: "date", placeholder: "" }
            ] as { label: string; key: keyof Employee; type: string; placeholder: string; step?: string; autoFocus?: boolean }[]).map((field) => (
              <div key={field.key} style={{ marginBottom: "14px" }}>
                <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>{field.label}</label>
                <input
                  type={field.type}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={(modal.form[field.key] as string | number) ?? (field.type === "number" ? 0 : "")}
                  onChange={e => setModal({ ...modal, form: { ...modal.form, [field.key]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value } })}
                  autoFocus={field.autoFocus}
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: theme.surfaceHover, border: `1px solid ${theme.border}`,
                    borderRadius: "10px", color: theme.text,
                    transition: "border-color 0.2s", fontSize: isMobile ? "13px" : "14px",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: theme.textSecondary, display: "block", marginBottom: "6px", fontSize: isMobile ? "12px" : "13px" }}>{t("common.status")}</label>
              <select
                value={modal.form.status ?? "active"}
                onChange={e => setModal({ ...modal, form: { ...modal.form, status: e.target.value } })}
                style={{ width: "100%", padding: "10px 12px", background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: "10px", color: theme.text, cursor: "pointer", fontSize: isMobile ? "13px" : "14px" }}
              >
                <option value="active">{t("hr.active")}</option>
                <option value="leave">{t("hr.onLeave")}</option>
                <option value="inactive">{t("hr.inactive")}</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={modal.editMode ? updateEmployee : createEmployee}
                style={{
                  flex: 1, padding: "12px", background: theme.gradient, color: "white",
                  border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600",
                  fontSize: isMobile ? "13px" : "14px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  minHeight: "44px", WebkitTapHighlightColor: "transparent", transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                <IconSave size={14} color="white" />
                {modal.editMode ? t("common.save") : t("common.add")}
              </button>
              <button
                onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })}
                style={{
                  flex: 1, padding: "12px", background: theme.surfaceHover, color: theme.text,
                  border: `1px solid ${theme.border}`, borderRadius: "12px", cursor: "pointer",
                  fontSize: isMobile ? "13px" : "14px", fontWeight: "500",
                  minHeight: "44px", WebkitTapHighlightColor: "transparent", transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
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