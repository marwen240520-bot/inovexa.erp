"use client";

export default function StatsCard({ icon, value, label, color, trend, trendValue, onClick }) {
  const getTrendColor = () => {
    if (trend === "up") return "#10b981";
    if (trend === "down") return "#ef4444";
    return "#94a3b8";
  };

  const getTrendIcon = () => {
    if (trend === "up") return "▲";
    if (trend === "down") return "▼";
    return "●";
  };

  return (
    <div 
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid #222",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "32px" }}>{icon}</span>
        {trend && (
          <span style={{ 
            color: getTrendColor(), 
            fontSize: "12px", 
            background: `${getTrendColor()}20`,
            padding: "2px 8px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            {getTrendIcon()} {trendValue}%
          </span>
        )}
      </div>
      <div style={{ fontSize: "28px", color: color || "white", fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{label}</div>
    </div>
  );
}
