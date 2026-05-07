"use client";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", cancelText = "Annuler" }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1100
    }} onClick={onClose}>
      <div style={{
        background: "#111",
        borderRadius: "20px",
        width: "400px",
        maxWidth: "90%",
        border: "1px solid #222",
        animation: "fadeIn 0.2s ease"
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "24px" }}>
          <h3 style={{ color: "white", fontSize: "18px", marginBottom: "12px" }}>{title}</h3>
          <p style={{ color: "#94a3b8", marginBottom: "24px" }}>{message}</p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={onConfirm} style={{ flex: 1, padding: "10px", background: "#c33", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>{confirmText}</button>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>{cancelText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
