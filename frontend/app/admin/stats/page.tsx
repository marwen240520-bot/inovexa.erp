"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Spinner from "@/components/ui/Spinner";

export default function AdminStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSales: 0,
    totalProducts: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token) {
      router.push("/auth/login");
      return;
    }
    
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL}`;
    
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats({
        totalUsers: data.totalClients || 0,
        activeUsers: data.activeClients || 0,
        totalSales: data.totalSales || 0,
        totalProducts: data.totalProducts || 0
      });
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ color: "white", fontSize: "28px", margin: 0 }}>?? Statistiques</h1>
            <p style={{ color: "#94a3b8", marginTop: "4px" }}>Vue d'ensemble de la plateforme</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>??</div>
              <div style={{ fontSize: "32px", color: "#667eea", fontWeight: "bold" }}>{stats.totalUsers}</div>
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>Total Utilisateurs</div>
            </div>
            <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>??</div>
              <div style={{ fontSize: "32px", color: "#10b981", fontWeight: "bold" }}>{stats.activeUsers}</div>
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>Utilisateurs Actifs</div>
            </div>
            <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>??</div>
              <div style={{ fontSize: "32px", color: "#f59e0b", fontWeight: "bold" }}>{stats.totalSales.toLocaleString()} �</div>
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>Chiffre d'affaires</div>
            </div>
            <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>??</div>
              <div style={{ fontSize: "32px", color: "#8b5cf6", fontWeight: "bold" }}>{stats.totalProducts}</div>
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>Produits</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
