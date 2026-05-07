"use client";
import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#f59e0b",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              marginBottom: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              animation: "fadeInUp 0.3s ease-out",
              maxWidth: "300px",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
