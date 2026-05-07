"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import ExportButtons from "@/components/ui/ExportButtons";
import AdvancedFilters from "@/components/ui/AdvancedFilters";
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

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
);

export default function AdminClientsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [modal, setModal] = useState({ open: false, form: {}, editMode: false, editId: null });
  const [modulesModal, setModulesModal] = useState({ open: false, clientId: null, modules: {} });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [animateCards, setAnimateCards] = useState(false);
  const [stats, setStats] = useState({ totalClients: 0, activeClients: 0, expiredClients: 0, totalRevenue: 0 });
  const [registrationsData, setRegistrationsData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token) router.push("/auth/login");
    if (user.role !== "admin") router.push("/dashboard");
    fetchClients();
    fetchStats();
    fetchRegistrationsHistory();
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/admin/clients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
      // Mettre à jour les données d'inscriptions après avoir chargé les clients
      updateRegistrationsFromClients(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3001/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch(e) { console.error(e); }
  };

  const updateRegistrationsFromClients = (clientsList) => {
    // Calculer les inscriptions par mois à partir des données des clients
    const now = new Date();
    const last6Months = [];
    
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
    
    // Compter les inscriptions par mois
    clientsList.forEach(client => {
      if (client.createdAt) {
        const createdDate = new Date(client.createdAt);
        const monthIndex = createdDate.getMonth();
        const year = createdDate.getFullYear();
        const now = new Date();
        
        // Vérifier si le client a été créé dans les 6 derniers mois
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
      const res = await fetch("http://localhost:3001/admin/registrations-history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrationsData(data);
      } else {
        // Utiliser les données des clients existants
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
      const res = await fetch("http://localhost:3001/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form)
      });
      if (res.ok) {
        setModal({ open: false, form: {}, editMode: false, editId: null });
        fetchClients();
        fetchStats();
        showMessage("✅ Client créé avec succès !", "success");
      } else {
        showMessage("❌ Erreur lors de la création", "error");
      }
    } catch(e) { 
      showMessage("❌ Erreur de connexion", "error");
    }
  };

  const updateClient = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/admin/clients/${modal.editId}`, {
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
        showMessage("✅ Client modifié avec succès !", "success");
      } else {
        showMessage("❌ Erreur lors de la modification", "error");
      }
    } catch(e) { console.error(e); }
  };

  const updateModules = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/admin/clients/${modulesModal.clientId}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ modules: modulesModal.modules })
      });
      if (res.ok) {
        setModulesModal({ open: false, clientId: null, modules: {} });
        fetchClients();
        showMessage("✅ Modules mis à jour !", "success");
      } else {
        showMessage("❌ Erreur lors de la mise à jour", "error");
      }
    } catch(e) { console.error(e); }
  };

  const extendSubscription = async (id, days) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:3001/admin/clients/${id}/extend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ days })
      });
      if (res.ok) {
        fetchClients();
        showMessage(`✅ Abonnement prolongé de ${days} jours`, "success");
      }
    } catch(e) { console.error(e); }
  };

  const toggleStatus = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3001/admin/clients/${id}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchClients();
    fetchStats();
    showMessage("✅ Statut modifié", "success");
  };

  const deleteClient = async (id) => {
    if (confirm("Supprimer ce client ?")) {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/admin/clients/${id}`, {
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
        await fetch(`http://localhost:3001/admin/clients/${id}`, {
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

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const openEditModal = (client) => {
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

  const openModulesModal = (client) => {
    const currentModules = client.modules || {};
    setModulesModal({
      open: true,
      clientId: client.id,
      modules: { ...currentModules }
    });
  };

  const toggleModule = (moduleName) => {
    setModulesModal({
      ...modulesModal,
      modules: {
        ...modulesModal.modules,
        [moduleName]: !modulesModal.modules[moduleName]
      }
    });
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Graphiques
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
        pointStyle: 'circle'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#94a3b8", font: { size: 12 } },
        position: 'top'
      },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#fff",
        bodyColor: "#94a3b8",
        borderColor: "#333",
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Inscriptions: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        grid: { color: "#1a1a1a" },
        ticks: { color: "#94a3b8", stepSize: 1 },
        title: {
          display: true,
          text: "Nombre d'inscriptions",
          color: "#94a3b8"
        }
      },
      x: {
        grid: { color: "#1a1a1a" },
        ticks: { color: "#94a3b8" },
        title: {
          display: true,
          text: "Mois",
          color: "#94a3b8"
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        borderJoin: 'round'
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
    cutout: '60%'
  };

  if (loading) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid #1a1a1a", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
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
                <button onClick={() => setModal({ open: true, editMode: false, form: { email: "", password: "", name: "", companyName: "", phone: "", subscriptionDuration: 30 } })} style={{ background: "#667eea", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
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

          {/* 4 Cartes statistiques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            {[
              { 
                icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#667eea" strokeWidth="1.5"/><path d="M23 21V19C22.9 16.9 21.3 15.2 19 15" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round"/><path d="M16 3.13C18.1 3.63 19.6 5.5 19.6 7.63C19.6 9.76 18.1 11.63 16 12.13" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round"/></svg>',
                label: "Total clients", 
                value: stats.totalClients, 
                color: "#667eea" 
              },
              { 
                icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12V8H4V12M20 12L22 14V20H2V14L4 12M20 12H4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r="2" stroke="#10b981" strokeWidth="1.5"/><path d="M16 4L14 8H10L8 4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 12V14" stroke="#10b981" strokeWidth="1.5"/></svg>',
                label: "Clients actifs", 
                value: stats.activeClients, 
                color: "#10b981" 
              },
              { 
                icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12L15 15" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.5"/><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12" stroke="#f59e0b" strokeWidth="1.5"/></svg>',
                label: "Abonnements expirés", 
                value: stats.expiredClients, 
                color: "#f59e0b" 
              },
              { 
                icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V4M12 20V22M4 12H2M6.3 6.3L4.9 4.9M17.7 6.3L19.1 4.9M22 12H20M18 12C18 15.3 15.3 18 12 18C8.7 18 6 15.3 6 12C6 8.7 8.7 6 12 6C15.3 6 18 8.7 18 12Z" stroke="#10b981" strokeWidth="1.5"/><path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8" stroke="#10b981" strokeWidth="1.5"/><path d="M12 22C17.5228 22 22 17.5228 22 12" stroke="#10b981" strokeWidth="1.5"/></svg>',
                label: "CA total", 
                value: stats.totalRevenue?.toLocaleString() || "0", 
                suffix: "€", 
                color: "#10b981" 
              }
            ].map((card, idx) => (
              <div key={idx} style={{ 
                background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)", 
                borderRadius: "16px", padding: "20px", textAlign: "center", border: "1px solid #222",
                animation: `fadeInUp 0.5s ease ${0.1 + idx * 0.1}s`,
                opacity: animateCards ? 1 : 0,
                transition: "transform 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ marginBottom: "8px" }} dangerouslySetInnerHTML={{ __html: card.icon }} />
                <div style={{ fontSize: "28px", color: card.color, fontWeight: "bold" }}>{card.value} {card.suffix || ""}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", marginBottom: "32px" }}>
            <div style={{ background: "#111", borderRadius: "20px", padding: "20px", border: "1px solid #222" }}>
              <h3 style={{ color: "white", marginBottom: "16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3" stroke="#667eea" strokeWidth="1.5"/>
                  <path d="M12 8V12L14 14" stroke="#667eea" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="9" stroke="#667eea" strokeWidth="1.5"/>
                </svg>
                Répartition des clients
              </h3>
              <div style={{ height: "220px" }}>
                <Doughnut data={statusChartData} options={doughnutOptions} />
              </div>
            </div>
            <div style={{ background: "#111", borderRadius: "20px", padding: "20px", border: "1px solid #222" }}>
              <h3 style={{ color: "white", marginBottom: "16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16V20H3V16" stroke="#667eea" strokeWidth="1.5"/>
                  <path d="M7 16L12 8L17 16" stroke="#667eea" strokeWidth="1.5"/>
                  <path d="M12 8V4" stroke="#667eea" strokeWidth="1.5"/>
                  <path d="M9 12L12 8L15 12" stroke="#667eea" strokeWidth="1.5"/>
                </svg>
                Évolution des inscriptions
              </h3>
              <div style={{ height: "220px" }}>
                {registrationsData.length > 0 ? (
                  <Line data={registrationsChartData} options={chartOptions} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", borderRadius: "12px" }}>
                    <p style={{ color: "#666" }}>Aucune donnée d'inscription disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div style={{ marginBottom: "20px", animation: `fadeInUp 0.5s ease 0.4s`, opacity: animateCards ? 1 : 0 }}>
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
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
              <SelectAllCheckbox items={filteredClients} selectedIds={selectedIds} onSelect={setSelectedIds} onSelectAll={(ids) => setSelectedIds(ids)} getItemId={(item) => item.id} />
              {selectedIds.length > 0 && (
                <button onClick={deleteSelected} style={{ background: "#c33", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7H20" stroke="white" strokeWidth="1.5"/>
                    <path d="M10 11V16" stroke="white" strokeWidth="1.5"/>
                    <path d="M14 11V16" stroke="white" strokeWidth="1.5"/>
                    <path d="M6 7L7 19C7 20.1 7.9 21 9 21H15C16.1 21 17 20.1 17 19L18 7" stroke="white" strokeWidth="1.5"/>
                    <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" stroke="white" strokeWidth="1.5"/>
                  </svg>
                  Supprimer ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Tableau des clients */}
          <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222", color: "#94a3b8" }}>
                  <th style={{ padding: "12px", width: "40px" }}>
                    <input type="checkbox" checked={selectedIds.length === filteredClients.length && filteredClients.length > 0} onChange={() => {
                      if (selectedIds.length === filteredClients.length) setSelectedIds([]);
                      else setSelectedIds(filteredClients.map(c => c.id));
                    }} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
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
                    <tr key={client.id} style={{ borderBottom: "1px solid #1a1a1a", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#1a1a1a"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <input type="checkbox" checked={selectedIds.includes(client.id)} onChange={() => {
                          if (selectedIds.includes(client.id)) setSelectedIds(selectedIds.filter(id => id !== client.id));
                          else setSelectedIds([...selectedIds, client.id]);
                        }} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
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
                          <button onClick={() => openEditModal(client)} style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }} title="Modifier">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="white" strokeWidth="1.5"/>
                            </svg>
                          </button>
                          <button onClick={() => openModulesModal(client)} style={{ background: "#8b5cf6", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }} title="Modules">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="2" y="2" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5"/>
                              <path d="M8 12H16M12 8V16" stroke="white" strokeWidth="1.5"/>
                            </svg>
                          </button>
                          <button onClick={() => { const days = prompt("Nombre de jours à ajouter:", "30"); if (days) extendSubscription(client.id, parseInt(days)); }} style={{ background: "#10b981", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }} title="Prolonger">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/>
                              <path d="M12 8V12L15 15" stroke="white" strokeWidth="1.5"/>
                            </svg>
                          </button>
                          <button onClick={() => toggleStatus(client.id)} style={{ background: "#f59e0b", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }} title={client.isActive ? "Désactiver" : "Activer"}>
                            {client.isActive ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/>
                                <path d="M8 12H16" stroke="white" strokeWidth="1.5"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/>
                                <path d="M8 12H16M12 8V16" stroke="white" strokeWidth="1.5"/>
                              </svg>
                            )}
                          </button>
                          <button onClick={() => deleteClient(client.id)} style={{ background: "#c33", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }} title="Supprimer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 7H20" stroke="white" strokeWidth="1.5"/>
                              <path d="M10 11V16" stroke="white" strokeWidth="1.5"/>
                              <path d="M14 11V16" stroke="white" strokeWidth="1.5"/>
                              <path d="M6 7L7 19C7 20.1 7.9 21 9 21H15C16.1 21 17 20.1 17 19L18 7" stroke="white" strokeWidth="1.5"/>
                              <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" stroke="white" strokeWidth="1.5"/>
                            </svg>
                          </button>
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

      {/* Modal Création/Modification Client */}
      {modal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "24px", width: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ color: "white", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
              {modal.editMode ? (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="#667eea" strokeWidth="1.5"/>
                  </svg>
                  Modifier le client
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="#667eea" strokeWidth="2"/>
                  </svg>
                  Nouveau client
                </>
              )}
            </h2>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>{t("common.name")} *</label>
              <input type="text" placeholder="Nom complet" value={modal.form.name || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>{t("common.email")} *</label>
              <input type="email" placeholder="Email" value={modal.form.email || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            {!modal.editMode && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Mot de passe *</label>
                <input type="password" placeholder="Mot de passe" value={modal.form.password || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Société</label>
              <input type="text" placeholder="Nom de la société" value={modal.form.companyName || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, companyName: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>{t("common.phone")}</label>
              <input type="tel" placeholder="Téléphone" value={modal.form.phone || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
            </div>

            {modal.editMode ? (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Date fin abonnement</label>
                <input type="date" value={modal.form.subscriptionEnd || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, subscriptionEnd: e.target.value } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
              </div>
            ) : (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#94a3b8", marginBottom: "8px", display: "block" }}>Durée d'abonnement (jours)</label>
                <input type="number" placeholder="Durée en jours" value={modal.form.subscriptionDuration || 30} onChange={e => setModal({ ...modal, form: { ...modal.form, subscriptionDuration: parseInt(e.target.value) } })} style={{ width: "100%", padding: "12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white" }} />
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={modal.editMode ? updateClient : createClient} style={{ flex: 1, padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>{modal.editMode ? "Modifier" : "Créer"}</button>
              <button onClick={() => setModal({ open: false, form: {}, editMode: false, editId: null })} style={{ flex: 1, padding: "12px", background: "#333", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modules */}
      {modulesModal.open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "24px", width: "600px", maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ color: "white", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="2" stroke="#667eea" strokeWidth="1.5"/>
                <path d="M8 12H16M12 8V16" stroke="#667eea" strokeWidth="1.5"/>
              </svg>
              Modules disponibles
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {Object.keys(modulesModal.modules).map((moduleName) => {
                const isActive = modulesModal.modules[moduleName];
                return (
                  <div key={moduleName} onClick={() => toggleModule(moduleName)} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    padding: "12px", background: "#1a1a1a", borderRadius: "8px", cursor: "pointer",
                    border: `1px solid ${isActive ? "#667eea" : "#333"}`,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#2a2a2a"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#1a1a1a"}
                  >
                    <span style={{ color: "white", textTransform: "capitalize" }}>{moduleName}</span>
                    <span style={{ color: isActive ? "#10b981" : "#94a3b8" }}>
                      {isActive ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                    </span>
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