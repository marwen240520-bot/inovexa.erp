"use client";
import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification, notifications }}>
      {children}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 10000 }}>
        {notifications.map(notif => (
          <div key={notif.id} style={{
            background: notif.type === "success" ? "rgba(16,185,129,0.95)" : notif.type === "error" ? "rgba(239,68,68,0.95)" : "rgba(59,130,246,0.95)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            marginBottom: "8px",
            cursor: "pointer",
            backdropFilter: "blur(10px)"
          }} onClick={() => removeNotification(notif.id)}>
            {notif.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider");
  return context;
}
