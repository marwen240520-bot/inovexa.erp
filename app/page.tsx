"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(102,126,234,0.2)", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
        <style>@{keyframes spin { to { transform: rotate(360deg); } }}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%)", borderRadius: "50%", top: "-250px", right: "-100px", animation: "float 20s ease-in-out infinite" }}></div>
      <div style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(118,75,162,0.12) 0%, transparent 70%)", borderRadius: "50%", bottom: "-150px", left: "-100px", animation: "float 15s ease-in-out infinite reverse" }}></div>
      
      <div style={{ textAlign: "center", zIndex: 10, animation: "fadeInUp 0.8s ease-out" }}>
        <div style={{ marginBottom: "24px", animation: "pulse 2s ease-in-out infinite" }}>
          <img src="/logo.png" alt="Inovexa ERP" style={{ width: "80px", height: "80px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(102,126,234,0.3)" }} />
        </div>
        <h1 style={{ fontSize: "56px", marginBottom: "16px", fontWeight: "bold" }}>
          <span style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Inovexa</span> ERP
        </h1>
        <p style={{ fontSize: "20px", color: "#94a3b8", marginBottom: "48px" }}>La solution ERP nouvelle génération</p>
        
        {isLoggedIn ? (
          <button onClick={() => router.push("/dashboard")} style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "14px 36px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "50px", fontSize: "18px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 5px 20px rgba(102,126,234,0.2)" }}>
            <span>📊</span> Accéder au Dashboard
          </button>
        ) : (
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "14px 36px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "50px", fontSize: "18px", fontWeight: "600", textDecoration: "none", transition: "all 0.3s ease", boxShadow: "0 5px 20px rgba(102,126,234,0.2)" }}>
            <span>🔐</span> Se connecter
          </Link>
        )}
        
        <div style={{ marginTop: "60px", color: "#666", fontSize: "14px" }}>
          <p>© 2025 Inovexa ERP. Tous droits réservés.</p>
        </div>
      </div>
      
      <style>{
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(10px) translateX(-10px); }
          75% { transform: translateY(-10px) translateX(15px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      }</style>
    </div>
  );
}
