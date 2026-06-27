"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      role="alert"
      aria-live="assertive"
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
      <div style={{ fontSize: "64px" }} aria-hidden="true">😵</div>
      <h1 style={{ color: "white", fontSize: "24px" }}>Une erreur est survenue</h1>
      <p style={{ color: "#94a3b8", textAlign: "center", maxWidth: "500px" }}>
        {error?.message || "Erreur inattendue"}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "12px 24px",
          background: "#667eea",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Réessayer
      </button>
    </main>
  );
}
