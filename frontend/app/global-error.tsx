"use client";

export default function GlobalError({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "20px"
        }}>
          <h1 style={{ color: "#111827" }}>Erreur globale</h1>
          <p style={{ color: "#6b7280" }}>{error.message}</p>
          <button onClick={() => window.location.reload()} style={{
            padding: "10px 20px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}>Réessayer</button>
        </div>
      </body>
    </html>
  );
}
