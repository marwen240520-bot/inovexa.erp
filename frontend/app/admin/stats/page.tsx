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

          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <rect x="7" y="10" width="3" height="7" rx="1" />
              <rect x="12" y="6" width="3" height="11" rx="1" />
              <rect x="17" y="13" width="3" height="4" rx="1" />
            </svg>
            <div>
              <h1 style={{ color: "white", fontSize: "28px", margin: 0 }}>Statistiques</h1>
              <p style={{ color: "#94a3b8", marginTop: "4px" }}>Vue d'ensemble de la plateforme</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {[
              {
                color: "#667eea", value: stats.totalUsers, label: "Total Utilisateurs",
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                color: "#10b981", value: stats.activeUsers, label: "Utilisateurs Actifs",
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="m16 11 2 2 4-4" />
                  </svg>
                ),
              },
              {
                color: "#f59e0b", value: `${stats.totalSales.toLocaleString()} DT`, label: "Chiffre d'affaires",
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="13" rx="2" />
                    <path d="M2 10h20" />
                    <circle cx="12" cy="14.5" r="2" />
                  </svg>
                ),
              },
              {
                color: "#8b5cf6", value: stats.totalProducts, label: "Produits",
                icon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
                    <path d="M3 8l9 5 9-5" />
                    <path d="M12 13v8" />
                  </svg>
                ),
              },
            ].map((c, i) => (
              <div key={i} style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222", textAlign: "center" }}>
                <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>{c.icon}</div>
                <div style={{ fontSize: "32px", color: c.color, fontWeight: "bold" }}>{c.value}</div>
                <div style={{ color: "#94a3b8", fontSize: "14px" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
