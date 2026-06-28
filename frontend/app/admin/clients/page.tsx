"use client";
import { useState, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import ExportButtons from "@/components/ui/ExportButtons";
import SelectAllCheckbox from "@/components/ui/SelectAllCheckbox";
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
  Filler
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import Spinner from "@/components/ui/Spinner";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
);

// --- Types --------------------------------------------------------------------

interface Client {
  id: number;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  subscriptionEnd?: string;
  isActive: boolean;
  modules?: Record<string, boolean>;
  createdAt?: string;
}

interface Stats {
  totalClients: number;
  activeClients: number;
  expiredClients: number;
  totalRevenue: number;
}

interface ModalState {
  open: boolean;
  editMode: boolean;
  editId: number | null;
  form: Partial<Client & { password?: string; subscriptionDuration?: number }>;
}

interface ModulesModalState {
  open: boolean;
  clientId: number | null;
  modules: Record<string, boolean>;
}

interface RegistrationMonth {
  month: string;
  year: number;
  monthIndex: number;
  count: number;
}

// --- Component ----------------------------------------------------------------

// --- UI helpers, action icons & module catalog -------------------------------

const actionBtn = (bg: string): CSSProperties => ({
  background: bg, color: "white", border: "none", borderRadius: "8px",
  width: "34px", height: "34px", minWidth: "34px", cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
});

const ACT = {
  edit: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>),
  modules: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  extend: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg>),
  power: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>),
  trash: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
};

const MODULE_ICON: Record<string, JSX.Element> = {
  dashboard: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  products: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>),
  categories: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>),
  stock: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>),
  sales: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>),
  purchases: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>),
  orders: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>),
  clients: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  suppliers: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  invoices: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>),
  hr: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  finance: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>),
  logistics: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>),
  production: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>),
  ai: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>),
  reports: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  analytics: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
  profile: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  settings: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
};

const MODULES: { id: string; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Produits" },
  { id: "categories", label: "Catégories" },
  { id: "stock", label: "Stock" },
  { id: "sales", label: "Ventes" },
  { id: "purchases", label: "Achats" },
  { id: "orders", label: "Commandes" },
  { id: "clients", label: "Clients" },
  { id: "suppliers", label: "Fournisseurs" },
  { id: "invoices", label: "Factures" },
  { id: "hr", label: "Ressources Humaines" },
  { id: "finance", label: "Finance" },
  { id: "logistics", label: "Logistique" },
  { id: "production", label: "Production" },
  { id: "ai", label: "Assistant IA" },
  { id: "reports", label: "Rapports" },
  { id: "analytics", label: "Analytics" },
  { id: "profile", label: "Mon Profil" },
  { id: "settings", label: "Paramètres" },
];

const CHECK_ICON = (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const DASH_ICON = (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>);

export default function AdminClientsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [clients, setClients]                   = useState<Client[]>([]);
  const [loading, setLoading]                   = useState<boolean>(true);
  const [searchTerm, setSearchTerm]             = useState<string>("");
  const [selectedIds, setSelectedIds]           = useState<number[]>([]);
  const [modal, setModal]                       = useState<ModalState>({ open: false, form: {}, editMode: false, editId: null });
  const [modulesModal, setModulesModal]         = useState<ModulesModalState>({ open: false, clientId: null, modules: {} });
  const [message, setMessage]                   = useState<string>("");
  const [messageType, setMessageType]           = useState<"success" | "error">("success");
  const [animateCards, setAnimateCards]         = useState<boolean>(false);
  const [isMobile, setIsMobile]                 = useState<boolean>(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [stats, setStats]                       = useState<Stats>({ totalClients: 0, activeClients: 0, expiredClients: 0, totalRevenue: 0 });
  const [registrationsData, setRegistrationsData] = useState<RegistrationMonth[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token) router.push("/auth/login");
    if (user.role !== "admin") router.push("/dashboard");
    fetchClients();
    fetchStats();
    fetchRegistrationsHistory();
    setTimeout(() => setAnimateCards(true), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data: Client[] = await res.json();
      const list = Array.isArray(data) ? data : [];
      setClients(list);
      updateRegistrationsFromClients(list);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: Stats = await res.json();
        setStats(data);
      }
    } catch(e) { console.error(e); }
  };

  const updateRegistrationsFromClients = (clientsList: Client[]) => {
    const now = new Date();
    const last6Months: RegistrationMonth[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('fr-FR', { month: 'short' });
      last6Months.push({
        month: monthName,
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        count: 0
      });
    }

    clientsList.forEach(client => {
      if (client.createdAt) {
        const createdDate = new Date(client.createdAt);
        const year = createdDate.getFullYear();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        if (createdDate >= sixMonthsAgo && createdDate <= now) {
          const monthName = createdDate.toLocaleString('fr-FR', { month: 'short' });
          const existingMonth = last6Months.find(m => m.month === monthName && m.year === year);
          if (existingMonth) {
            existingMonth.count++;
          }
        }
      }
    });

    setRegistrationsData(last6Months);
  };

  const fetchRegistrationsHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/registrations-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: RegistrationMonth[] = await res.json();
        setRegistrationsData(data);
      } else {
        updateRegistrationsFromClients(clients);
      }
    } catch(e) {
      console.error(e);
      updateRegistrationsFromClients(clients);
    }
  };

  const createClient = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchClients();
        fetchStats();
        showMessage("Client créé avec succès !", "success");
      } else {
        showMessage("Erreur lors de la création", "error");
      }
    } catch(e) {
      showMessage("Erreur de connexion", "error");
    }
  };

  const updateClient = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${modal.editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modal.form.name,
          companyName: modal.form.companyName,
          phone: modal.form.phone,
          email: modal.form.email,
          subscriptionEnd: modal.form.subscriptionEnd
        })
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchClients();
        fetchStats();
        showMessage("Client modifié avec succès !", "success");
      } else {
        showMessage("Erreur lors de la modification", "error");
      }
    } catch(e) { console.error(e); }
  };

  const updateModules = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${modulesModal.clientId}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ modules: modulesModal.modules })
      });
      if (res.ok) {
        setModulesModal({ open: false, clientId: null, modules: {} });
        fetchClients();
        showMessage("Modules mis à jour !", "success");
      } else {
        showMessage("Erreur lors de la mise à jour", "error");
      }
    } catch(e) { console.error(e); }
  };

  const extendSubscription = async (id: number, days: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${id}/extend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ days })
      });
      if (res.ok) {
        fetchClients();
        showMessage(`Abonnement prolongé de ${days} jours`, "success");
      }
    } catch(e) { console.error(e); }
  };

  const toggleStatus = async (id: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchClients();
    fetchStats();
    showMessage("Statut modifié", "success");
  };

  const deleteClient = async (id: number) => {
    if (confirm("Supprimer ce client ?")) {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClients();
      fetchStats();
      showMessage("Client supprimé", "success");
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Supprimer ${selectedIds.length} client(s) ?`)) {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchClients();
      fetchStats();
      setSelectedIds([]);
      showMessage(`${selectedIds.length} client(s) supprimé(s)`, "success");
    }
  };

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (client: Client) => {
    setModal({
      open: true,
      editMode: true,
      editId: client.id,
      form: {
        name: client.name || "",
        email: client.email || "",
        companyName: client.companyName || "",
        phone: client.phone || "",
        subscriptionEnd: client.subscriptionEnd ? client.subscriptionEnd.split("T")[0] : ""
      }
    });
  };

  const openModulesModal = (client: Client) => {
    const current = client.modules || {};
    const merged: Record<string, boolean> = {};
    MODULES.forEach((m) => { merged[m.id] = !!current[m.id]; });
    setModulesModal({ open: true, clientId: client.id, modules: merged });
  };

  const toggleModule = (moduleName: string) => {
    setModulesModal({
      ...modulesModal,
      modules: {
        ...modulesModal.modules,
        [moduleName]: !modulesModal.modules[moduleName]
      }
    });
  };

  const isExpired = (date?: string): boolean => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // --- Chart data -----------------------------------------------------------

  const statusChartData = {
    labels: ["Actifs", "Inactifs", "Expirés"],
    datasets: [{
      data: [stats.activeClients, stats.totalClients - stats.activeClients - stats.expiredClients, stats.expiredClients],
      backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
      borderWidth: 0
    }]
  };

  const registrationsChartData = {
    labels: registrationsData.map(item => item.month),
    datasets: [
      {
        label: "Nouvelles inscriptions",
        data: registrationsData.map(item => item.count),
        borderColor: "#667eea",
        backgroundColor: "rgba(102, 126, 234, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#667eea",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointStyle: "circle" as const
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#94a3b8", font: { size: 12 } },
        position: "top" as const
      },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#fff",
        bodyColor: "#94a3b8",
        borderColor: "#333",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `Inscriptions: ${context.parsed.y}`
        }
      }
    },
    scales: {
      y: {
        grid: { color: "#1a1a1a" },
        ticks: { color: "#94a3b8", stepSize: 1 },
        title: { display: true, text: "Nombre d'inscriptions", color: "#94a3b8" }
      },
      x: {
        grid: { color: "#1a1a1a" },
        ticks: { color: "#94a3b8" },
        title: { display: true, text: "Mois", color: "#94a3b8" }
      }
    },
    interaction: { mode: "index" as const, intersect: false }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#94a3b8", font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#fff",
        bodyColor: "#94a3b8",
        borderColor: "#333",
        borderWidth: 1
      }
    },
    cutout: "60%"
  };

  // --- Render ---------------------------------------------------------------

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: isMobile ? 0 : "280px", flex: 1, padding: isMobile ? "16px" : "32px", paddingBottom: isMobile ? "90px" : "32px", width: "100%", minWidth: 0 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px", animation: "fadeInDown 0.5s ease", opacity: animateCards ? 1 : 0 }}>
            <style>{`
              @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ color: "white", fontSize: "28px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t("admin.title")}
                </h1>
                <p style={{ color: "#94a3b8", marginTop: "4px" }}>{t("admin.clients")}</p>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <ExportButtons data={filteredClients} filename="clients" />
                <button onClick={() => setModal({ open: true, editMode: false, editId: null, form: { email: "", password: "", name: "", companyName: "", phone: "", subscriptionDuration: 30 } })} style={{ background: "#667eea", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {t("common.add")}
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div style={{
              background: messageType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${messageType === "success" ? "#10b981" : "#ef4444"}`,
              color: messageType === "success" ? "#10b981" : "#f87171",
              padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center",
              animation: "fadeInUp 0.3s ease"
            }}>
              {message}
            </div>
          )}

          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            {[
              { icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', label: "Total clients", value: stats.totalClients, color: "#667eea", suffix: "" },
              { icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>', label: "Clients actifs", value: stats.activeClients, color: "#10b981", suffix: "" },
              { icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>', label: "Abonnements expirés", value: stats.expiredClients, color: "#f59e0b", suffix: "" },
              { icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="12" cy="14.5" r="2"/></svg>', label: "CA total", value: stats.totalRevenue?.toLocaleString() || "0", color: "#10b981", suffix: "DT" }
            ].map((card, idx) => (
              <div key={idx} style={{
                background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
                borderRadius: "16px", padding: "20px", textAlign: "center", border: "1px solid #222",
                animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`,
                opacity: animateCards ? 1 : 0,
                transition: "transform 0.3s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div style={{ marginBottom: "8px" }} dangerouslySetInnerHTML={{ __html: card.icon }} />
                <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value} {card.suffix}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "24px", marginBottom: "32px" }}>
            <div style={{ background: "#111", borderRadius: "20px", padding: "20px", border: "1px solid #222" }}>
              <h3 style={{ color: "white", marginBottom: "16px", fontSize: "16px" }}>Répartition des clients</h3>
              <div style={{ height: "220px" }}>
                <Doughnut data={statusChartData} options={doughnutOptions} />
              </div>
            </div>
            <div style={{ background: "#111", borderRadius: "20px", padding: "20px", border: "1px solid #222" }}>
              <h3 style={{ color: "white", marginBottom: "16px", fontSize: "16px" }}>Évolution des inscriptions</h3>
              <div style={{ height: "220px" }}>
                {registrationsData.length > 0 ? (
                  <Line data={registrationsChartData} options={chartOptions} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", borderRadius: "12px" }}>
                    <p style={{ color: "#666" }}>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search & actions */}
          <div style={{ marginBottom: "20px", opacity: animateCards ? 1 : 0 }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ flex: 2, position: "relative" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="1.5"/>
                  <path d="M21 21L16 16" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder={`${t("common.search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "12px 12px 12px 38px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox items={filteredClients} selectedIds={selectedIds} onSelect={setSelectedIds} onSelectAll={(ids: number[]) => setSelectedIds(ids)} getItemId={(item: Client) => item.id} />
              {selectedIds.length > 0 && (
                <button onClick={deleteSelected} style={{ background: "#c33", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer" }}>
                  Supprimer ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
                  <th style={{ padding: "12px", width: "40px" }}>
                    <input type="checkbox"
                      checked={selectedIds.length === filteredClients.length && filteredClients.length > 0}
                      onChange={() => {
                        if (selectedIds.length === filteredClients.length) setSelectedIds([]);
                        else setSelectedIds(filteredClients.map(c => c.id));
                      }}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>{t("common.name")}</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>{t("common.email")}</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Société</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>{t("common.phone")}</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Abonnement</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>{t("common.status")}</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const expired = isExpired(client.subscriptionEnd);
                  return (
                    <tr key={client.id}
                      style={{ borderBottom: "1px solid #1a1a1a", transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <input type="checkbox"
                          checked={selectedIds.includes(client.id)}
                          onChange={() => {
                            if (selectedIds.includes(client.id)) setSelectedIds(selectedIds.filter(id => id !== client.id));
                            else setSelectedIds([...selectedIds, client.id]);
                          }}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "12px", color: "white" }}>{client.name}</td>
                      <td style={{ padding: "12px", color: "#94a3b8" }}>{client.email}</td>
                      <td style={{ padding: "12px", color: "#94a3b8" }}>{client.companyName || "-"}</td>
                      <td style={{ padding: "12px", color: "#94a3b8" }}>{client.phone || "-"}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{ color: expired ? "#ef4444" : "#10b981", fontSize: "12px" }}>
                          {client.subscriptionEnd ? new Date(client.subscriptionEnd).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{ background: client.isActive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: client.isActive ? "#10b981" : "#f87171", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>
                          {client.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                          <button onClick={() => openEditModal(client)} style={actionBtn("#3b82f6")} title="Modifier">{ACT.edit}</button>
                          <button onClick={() => openModulesModal(client)} style={actionBtn("#8b5cf6")} title="Modules">{ACT.modules}</button>
                          <button onClick={() => { const days = prompt("Jours à ajouter:", "30"); if (days) extendSubscription(client.id, parseInt(days)); }} style={actionBtn("#10b981")} title="Prolonger">{ACT.extend}</button>
                          <button onClick={() => toggleStatus(client.id)} style={actionBtn("#f59e0b")} title={client.isActive ? "Désactiver" : "Activer"}>{ACT.power}</button>
                          <button onClick={() => deleteClient(client.id)} style={actionBtn("#c33")} title="Supprimer">{ACT.trash}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredClients.length === 0 && <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>Aucun client trouvé</p>}
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "24px", width: isMobile ? "92vw" : "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ color: "white", marginBottom: "24px" }}>
              {modal.editMode ? "Modifier le client" : "Nouveau client"}
            </h2>
            {(["name", "email", "companyName", "phone"] as const).map((field) => (
              <div key={field} style={{ marginBottom: "16px" }}>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>{field}</label>
                <input
                  type={field === "email" ? "email" : "text"}
                  value={(modal.form as any)[field] || ""}
                  onChange={e => setModal({ ...modal, form: { ...modal.form, [field]: e.target.value } })}
                  style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }}
                />
              </div>
            ))}
            {!modal.editMode && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Mot de passe *</label>
                <input type="password" value={modal.form.password || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
              </div>
            )}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>
                {modal.editMode ? "Date fin abonnement" : "Durée d'abonnement (jours)"}
              </label>
              {modal.editMode ? (
                <input type="date" value={modal.form.subscriptionEnd || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, subscriptionEnd: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
              ) : (
                <input type="number" value={modal.form.subscriptionDuration || 30} onChange={e => setModal({ ...modal, form: { ...modal.form, subscriptionDuration: parseInt(e.target.value) } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
              )}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={modal.editMode ? updateClient : createClient} style={{ flex: 1, padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>{modal.editMode ? "Modifier" : "Créer"}</button>
              <button onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })} style={{ flex: 1, padding: "12px", background: "#333", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modules */}
      {modulesModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "24px", width: isMobile ? "92vw" : "600px", maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ color: "white", marginBottom: "24px" }}>Modules disponibles</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {MODULES.map((m) => {
                const isActive = !!modulesModal.modules[m.id];
                return (
                  <div key={m.id} onClick={() => toggleModule(m.id)} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px", background: "#1a1a1a", borderRadius: "10px", cursor: "pointer",
                    border: `1px solid ${isActive ? "#667eea" : "#333"}`, transition: "all 0.2s"
                  }}>
                    <span style={{ color: isActive ? "#818cf8" : "#64748b", display: "flex", flexShrink: 0 }}>{MODULE_ICON[m.id]}</span>
                    <span style={{ color: isActive ? "#fff" : "#94a3b8", fontSize: "14px", flex: 1 }}>{m.label}</span>
                    <span style={{ color: isActive ? "#10b981" : "#475569", display: "flex", flexShrink: 0 }}>{isActive ? CHECK_ICON : DASH_ICON}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={updateModules} style={{ flex: 1, padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>Enregistrer</button>
              <button onClick={() => setModulesModal({ open: false, clientId: null, modules: {} })} style={{ flex: 1, padding: "12px", background: "#333", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
