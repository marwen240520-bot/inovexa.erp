import { useState, useCallback } from "react";

export function useNotification() {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const NotificationContainer = () => (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 10000, display: "flex", flexDirection: "column", gap: "12px" }}>
      {notifications.map(notif => {
        const colors = {
          success: { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", icon: "✅" },
          error: { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", icon: "❌" },
          warning: { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", icon: "⚠️" },
          info: { bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", icon: "ℹ️" }
        };
        const color = colors[notif.type] || colors.success;
        return (
          <div
            key={notif.id}
            style={{
              background: color.bg,
              borderRadius: "12px",
              padding: "12px 16px",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              animation: "fadeInRight 0.3s ease-out",
              minWidth: "250px"
            }}
          >
            <span style={{ fontSize: "20px" }}>{color.icon}</span>
            <span style={{ flex: 1, fontSize: "13px" }}>{notif.message}</span>
            <button
              onClick={() => removeNotification(notif.id)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer",
                padding: "2px 6px",
                fontSize: "12px"
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );

  return { showNotification, NotificationContainer };
}
