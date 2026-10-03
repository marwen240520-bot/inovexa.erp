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
    <div style={{
      minHeight: "100vh",
      background: "var(--theme-background)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "20px",
      padding: "20px"
    }}>
      <div style={{ fontSize: "64px" }}>😵</div>
      <h1 style={{ color: "var(--theme-text)", fontSize: "24px" }}>Une erreur est survenue</h1>
      <p style={{ color: "var(--theme-text-secondary)", textAlign: "center", maxWidth: "500px" }}>
        {error.message || "Erreur inattendue"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "12px 24px",
          background: "#667eea",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
