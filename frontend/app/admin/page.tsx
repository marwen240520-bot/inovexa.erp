"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la gestion des clients
    router.push("/admin/clients");
  }, [router]);

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
      <div style={{
        width: "40px",
        height: "40px",
        border: "3px solid rgba(102,126,234,0.2)",
        borderTopColor: "#667eea",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }}></div>
      <p style={{ color: "#94a3b8" }}>Redirection vers la gestion des clients...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
