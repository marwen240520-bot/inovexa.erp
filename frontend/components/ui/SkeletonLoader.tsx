"use client";

export default function SkeletonLoader({ type = "card", count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return (
          <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid #222" }}>
            <div className="skeleton" style={{ width: "60px", height: "60px", borderRadius: "12px", marginBottom: "16px" }}></div>
            <div className="skeleton" style={{ width: "80%", height: "24px", borderRadius: "8px", marginBottom: "12px" }}></div>
            <div className="skeleton" style={{ width: "60%", height: "16px", borderRadius: "8px", marginBottom: "8px" }}></div>
            <div className="skeleton" style={{ width: "40%", height: "16px", borderRadius: "8px" }}></div>
          </div>
        );
      case "table-row":
        return (
          <div style={{ display: "flex", gap: "16px", padding: "16px", borderBottom: "1px solid #222" }}>
            <div className="skeleton" style={{ width: "20%", height: "20px", borderRadius: "4px" }}></div>
            <div className="skeleton" style={{ width: "25%", height: "20px", borderRadius: "4px" }}></div>
            <div className="skeleton" style={{ width: "20%", height: "20px", borderRadius: "4px" }}></div>
            <div className="skeleton" style={{ width: "15%", height: "20px", borderRadius: "4px" }}></div>
            <div className="skeleton" style={{ width: "20%", height: "20px", borderRadius: "4px" }}></div>
          </div>
        );
      case "list-item":
        return (
          <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderBottom: "1px solid #222" }}>
            <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "20px" }}></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: "60%", height: "16px", borderRadius: "4px", marginBottom: "8px" }}></div>
              <div className="skeleton" style={{ width: "40%", height: "12px", borderRadius: "4px" }}></div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Array(count).fill().map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animation: "fadeInUp 0.3s ease-out forwards" }}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}
