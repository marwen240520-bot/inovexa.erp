"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "20px"
    }}>
      <div style={{ fontSize: "64px" }}>🔍</div>
      <h1 style={{ color: "white", fontSize: "24px" }}>Page non trouvée</h1>
      <p style={{ color: "#94a3b8" }}>La page que vous cherchez n'existe pas.</p>
      <Link href="/" style={{
        padding: "12px 24px",
        background: "#667eea",
        color: "white",
        textDecoration: "none",
        borderRadius: "8px"
      }}>
        Retour à l'accueil
      </Link>
    </div>
  );
}
