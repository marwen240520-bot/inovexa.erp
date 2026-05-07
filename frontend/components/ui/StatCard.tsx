"use client";

export default function StatCard({ icon, title, value, color, subtitle, trend, onClick }) {
  const trendColor = trend && trend.value >= 0 ? "#10b981" : "#ef4444";
  const trendIcon = trend && trend.value >= 0 ? "▲" : "▼";
  
  return (
    <div 
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
        borderRadius: "20px",
        padding: "20px",
        border: "1px solid #27272a",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "#6366f1";
        e.currentTarget.style.boxShadow = "0 20px 25px -12px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#27272a";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Glow effect */}
      <div style={{
        position: "absolute",
        top: "-50%",
        right: "-50%",
        width: "200%",
        height: "200%",
        background: `radial-gradient(circle, ${color || "#6366f1"}10 0%, transparent 70%)`,
        pointerEvents: "none"
      }} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "32px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}>{icon}</div>
        {trend && (
          <div style={{ 
            background: `${trendColor}20`, 
            color: trendColor, 
            padding: "6px 12px", 
            borderRadius: "20px", 
            fontSize: "11px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backdropFilter: "blur(4px)"
          }}>
            <span style={{ fontSize: "10px" }}>{trendIcon}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div style={{ fontSize: "28px", color: color || "white", fontWeight: "600", marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#a1a1aa", fontWeight: "500" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "10px", color: "#71717a", marginTop: "4px" }}>{subtitle}</div>}
    </div>
  );
}
