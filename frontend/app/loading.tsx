export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "50px",
          height: "50px",
          border: "3px solid rgba(102,126,234,0.2)",
          borderTopColor: "#667eea",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span className="sr-only">Chargement en cours…</span>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
