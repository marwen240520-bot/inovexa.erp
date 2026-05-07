"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      left: "280px",
      height: "60px",
      background: "rgba(17, 17, 17, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid #222",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      zIndex: 99
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "32px", height: "32px" }} />
          <span style={{ color: "#667eea", fontSize: "14px", fontWeight: "500" }}>Inovexa ERP</span>
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ color: "#94a3b8", fontSize: "13px" }}>
          🕐 {currentTime}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "bold",
            color: "white"
          }}>
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: "500" }}>{user?.name || "User"}</div>
            <div style={{ color: "#94a3b8", fontSize: "11px" }}>{user?.role === "admin" ? "Administrator" : user?.role === "transporteur" ? "Carrier" : "Client"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
