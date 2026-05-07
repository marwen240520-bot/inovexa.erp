"use client";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: { width: "400px" },
    md: { width: "500px" },
    lg: { width: "700px" },
    xl: { width: "900px" }
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.2s ease"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: "#111",
          borderRadius: "24px",
          width: sizes[size].width,
          maxWidth: "90%",
          maxHeight: "90vh",
          overflow: "hidden",
          border: "1px solid #222",
          animation: "fadeIn 0.3s ease"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid #222", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: "#1a1a1a"
        }}>
          <h2 style={{ color: "white", fontSize: "20px", margin: 0 }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "24px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "calc(90vh - 80px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
