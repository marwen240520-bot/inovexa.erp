"use client";
import { useState } from "react";

export function Chatbot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          border: "none",
          color: "white",
          fontSize: "24px",
          cursor: "pointer",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        🤖
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "350px",
            height: "450px",
            background: "#111",
            borderRadius: "16px",
            border: "1px solid #222",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "white", fontWeight: "bold" }}>🤖 Assistant IA</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
            <p>Assistant IA Inovexa</p>
            <p style={{ fontSize: "12px" }}>Fonctionnalité à venir...</p>
          </div>
        </div>
      )}
    </>
  );
}
