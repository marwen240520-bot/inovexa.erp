"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const modules = [
    { id: "dashboard", name: "Dashboard", icon: "📊", path: "/dashboard", roles: ["admin", "client", "transporteur"] },
    { id: "products", name: "Produits", icon: "📦", path: "/products", roles: ["admin", "client"] },
    { id: "stock", name: "Stock", icon: "📊", path: "/stock", roles: ["admin", "client"] },
    { id: "sales", name: "Ventes", icon: "💰", path: "/sales", roles: ["admin", "client"] },
    { id: "purchases", name: "Achats", icon: "📥", path: "/purchases", roles: ["admin", "client"] },
    { id: "orders", name: "Commandes", icon: "📝", path: "/orders", roles: ["admin", "client"] },
    { id: "clients", name: "Clients", icon: "👥", path: "/clients", roles: ["admin"] },
    { id: "hr", name: "RH", icon: "👨‍💼", path: "/hr", roles: ["admin"] },
    { id: "finance", name: "Finance", icon: "💰", path: "/finance", roles: ["admin", "client"] },
    { id: "logistics", name: "Logistique", icon: "🚚", path: "/logistics", roles: ["admin", "transporteur"] },
    { id: "production", name: "Production", icon: "🏭", path: "/production", roles: ["admin"] },
    { id: "analytics", name: "Analytics", icon: "📈", path: "/analytics", roles: ["admin", "client"] },
    { id: "ia", name: "Assistant IA", icon: "🤖", path: "/ia", roles: ["admin", "client"] },
    { id: "reports", name: "Rapports", icon: "📄", path: "/reports", roles: ["admin", "client"] },
    { id: "profile", name: "Profil", icon: "👤", path: "/profile", roles: ["admin", "client", "transporteur"] },
    { id: "settings", name: "Paramètres", icon: "⚙️", path: "/settings", roles: ["admin", "client"] },
    { id: "admin", name: "Admin", icon: "👑", path: "/admin", roles: ["admin"] },
  ];

  const userRole = user?.role || "client";
  const visibleModules = modules.filter(m => m.roles.includes(userRole));

  return (
    <div style={{ width: collapsed ? "80px" : "280px", background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)", borderRight: "1px solid #222", position: "fixed", left: 0, top: 0, bottom: 0, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 100, overflowX: "hidden", overflowY: "auto" }}>
      
      <div style={{ padding: collapsed ? "20px 0" : "24px 20px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "12px" }}>
        <img src="/logo.png" alt="Logo" style={{ width: "40px", height: "40px", borderRadius: "10px" }} />
        {!collapsed && <span style={{ color: "white", fontSize: "18px", fontWeight: "bold", background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Inovexa</span>}
      </div>

      <button onClick={() => setCollapsed(!collapsed)} style={{ position: "absolute", right: collapsed ? "50%" : "12px", transform: collapsed ? "translateX(50%)" : "none", top: "80px", width: "28px", height: "28px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", transition: "all 0.3s ease" }}>
        {collapsed ? "→" : "←"}
      </button>

      <nav style={{ padding: collapsed ? "16px 0" : "16px 12px" }}>
        {visibleModules.map((module) => (
          <Link key={module.id} href={module.path} style={{ display: "flex", alignItems: "center", gap: "12px", padding: collapsed ? "12px 0" : "12px 16px", marginBottom: "4px", background: pathname === module.path ? "rgba(102,126,234,0.15)" : "transparent", borderRadius: "12px", color: pathname === module.path ? "#667eea" : "#94a3b8", textDecoration: "none", transition: "all 0.2s ease", justifyContent: collapsed ? "center" : "flex-start", borderLeft: pathname === module.path ? "3px solid #667eea" : "3px solid transparent" }}>
            <span style={{ fontSize: "20px" }}>{module.icon}</span>
            {!collapsed && <span style={{ fontSize: "14px" }}>{module.name}</span>}
          </Link>
        ))}
      </nav>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: collapsed ? "16px 0" : "16px", borderTop: "1px solid #222", textAlign: "center" }}>
        <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/auth/login"); }} style={{ width: collapsed ? "auto" : "100%", padding: collapsed ? "10px" : "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", cursor: "pointer", transition: "all 0.2s ease" }}>
          {collapsed ? "🚪" : "🚪 Déconnexion"}
        </button>
      </div>
    </div>
  );
}
