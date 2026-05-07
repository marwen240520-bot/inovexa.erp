"use client";
import { useState, useEffect } from "react";

export default function Toast({ message, type, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const colors = {
    success: { bg: "rgba(16,185,129,0.1)", border: "#10b981", text: "#10b981", icon: "✅" },
    error: { bg: "rgba(239,68,68,0.1)", border: "#ef4444", text: "#f87171", icon: "❌" },
    warning: { bg: "rgba(245,158,11,0.1)", border: "#f59e0b", text: "#fbbf24", icon: "⚠️" },
    info: { bg: "rgba(59,130,246,0.1)", border: "#3b82f6", text: "#60a5fa", icon: "ℹ️" }
  };

  const color = colors[type] || colors.info;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      background: color.bg,
      borderLeft: `4px solid ${color.border}`,
      padding: "12px 20px",
      borderRadius: "8px",
      color: color.text,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      gap: "12px",
      animation: "slideIn 0.3s ease"
    }}>
      <span>{color.icon}</span>
      <span>{message}</span>
      <button onClick={() => { setVisible(false); onClose(); }} style={{ background: "none", border: "none", color: color.text, cursor: "pointer", marginLeft: "8px" }}>✕</button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
