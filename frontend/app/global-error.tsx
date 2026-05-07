"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "20px"
        }}>
          <h1 style={{ color: "white" }}>Erreur globale</h1>
          <p style={{ color: "#94a3b8" }}>{error.message}</p>
          <button onClick={reset} style={{
            padding: "10px 20px",
            background: "#667eea",
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
