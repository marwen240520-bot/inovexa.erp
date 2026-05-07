"use client";
import { useState } from "react";

export default function Tooltip({ children, content, position = "top" }) {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: "8px" },
    bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" },
    left: { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: "8px" },
    right: { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: "8px" }
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          style={{
            position: "absolute",
            ...positions[position],
            background: "#111",
            color: "white",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 1000,
            border: "1px solid #333",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            pointerEvents: "none",
            animation: "fadeInUp 0.2s ease-out"
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
