"use client";

export default function Badge({ children, type = "default", size = "md", animated = false }) {
  const types = {
    success: { background: "rgba(16,185,129,0.15)", color: "#10b981" },
    warning: { background: "rgba(245,158,11,0.15)", color: "#f59e0b" },
    danger: { background: "rgba(239,68,68,0.15)", color: "#ef4444" },
    info: { background: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    primary: { background: "rgba(102,126,234,0.15)", color: "#667eea" },
    default: { background: "#1a1a1a", color: "#94a3b8" }
  };

  const sizes = {
    sm: { padding: "2px 8px", fontSize: "10px" },
    md: { padding: "4px 12px", fontSize: "12px" },
    lg: { padding: "6px 16px", fontSize: "14px" }
  };

  const currentType = types[type] || types.default;
  const currentSize = sizes[size] || sizes.md;

  return (
    <span
      className={animated ? "badge-pulse" : ""}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: currentType.background,
        color: currentType.color,
        padding: currentSize.padding,
        borderRadius: "20px",
        fontSize: currentSize.fontSize,
        fontWeight: "500",
        border: `1px solid ${currentType.color}20`
      }}
    >
      {children}
    </span>
  );
}
