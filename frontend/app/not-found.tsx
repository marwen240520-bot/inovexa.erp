"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main
      role="main"
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "20px",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "64px" }} aria-hidden="true">🔍</div>
      <h1 style={{ color: "white", fontSize: "24px" }}>Page non trouvée</h1>
      <p style={{ color: "#94a3b8" }}>La page que vous cherchez n'existe pas.</p>
      <Link
        href="/"
        style={{
          padding: "12px 24px",
          background: "#667eea",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: 600,
        }}
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}
