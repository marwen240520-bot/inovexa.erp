"use client";

export function SelectionBar({ selectedCount, onSelectAll, onClearAll, onDeleteSelected, onExportSelected }) {
  if (selectedCount === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "var(--theme-surface-hover)",
      border: "1px solid #667eea",
      borderRadius: "12px",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      zIndex: 1000,
      boxShadow: "0 4px 12px rgba(17,24,39,0.18)",
      backdropFilter: "blur(10px)"
    }}>
      <span style={{ color: "var(--theme-text)" }}>✅ {selectedCount} sélectionné(s)</span>
      <button onClick={onDeleteSelected} style={{ background: "#c33", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>
        🗑️ Supprimer
      </button>
      <button onClick={onExportSelected} style={{ background: "#10b981", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>
        📥 Exporter
      </button>
      <button onClick={onClearAll} style={{ background: "var(--theme-border)", color: "var(--theme-text)", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>
        ✖ Annuler
      </button>
    </div>
  );
}
