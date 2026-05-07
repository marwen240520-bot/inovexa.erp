"use client";

export default function LoadingSpinner() {
  return (
    <div style={{ 
      background: "#0a0a0a", 
      minHeight: "100vh", 
      color: "white", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ 
          width: "48px", 
          height: "48px", 
          border: "3px solid #1a1a1a", 
          borderTopColor: "#667eea", 
          borderRadius: "50%", 
          animation: "spin 1s linear infinite",
          marginBottom: "16px"
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
