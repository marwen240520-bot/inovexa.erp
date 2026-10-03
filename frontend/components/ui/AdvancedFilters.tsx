"use client";
import React, { useState } from "react";

export default function AdvancedFilters({ filters, onFilterChange, onReset }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: "10px 16px", background: "var(--theme-surface-hover)", border: "1px solid var(--theme-border)", borderRadius: "8px", color: "var(--theme-text)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
      >
        🔍 Filtres avancés {isOpen ? "▲" : "▼"}
      </button>
      
      {isOpen && (
        <div style={{ marginTop: "16px", padding: "20px", background: "var(--theme-surface)", borderRadius: "12px", border: "1px solid var(--theme-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ color: "var(--theme-text-secondary)", display: "block", marginBottom: "8px", fontSize: "12px" }}>Date début</label>
              <input
                type="date"
                value={filters.dateStart || ""}
                onChange={(e) => handleChange("dateStart", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "var(--theme-surface-hover)", border: "1px solid var(--theme-border)", borderRadius: "8px", color: "var(--theme-text)" }}
              />
            </div>
            <div>
              <label style={{ color: "var(--theme-text-secondary)", display: "block", marginBottom: "8px", fontSize: "12px" }}>Date fin</label>
              <input
                type="date"
                value={filters.dateEnd || ""}
                onChange={(e) => handleChange("dateEnd", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "var(--theme-surface-hover)", border: "1px solid var(--theme-border)", borderRadius: "8px", color: "var(--theme-text)" }}
              />
            </div>
            <div>
              <label style={{ color: "var(--theme-text-secondary)", display: "block", marginBottom: "8px", fontSize: "12px" }}>Statut</label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleChange("status", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "var(--theme-surface-hover)", border: "1px solid var(--theme-border)", borderRadius: "8px", color: "var(--theme-text)" }}
              >
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            <div>
              <label style={{ color: "var(--theme-text-secondary)", display: "block", marginBottom: "8px", fontSize: "12px" }}>Montant min (€)</label>
              <input
                type="number"
                placeholder="Min"
                value={filters.amountMin || ""}
                onChange={(e) => handleChange("amountMin", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "var(--theme-surface-hover)", border: "1px solid var(--theme-border)", borderRadius: "8px", color: "var(--theme-text)" }}
              />
            </div>
            <div>
              <label style={{ color: "var(--theme-text-secondary)", display: "block", marginBottom: "8px", fontSize: "12px" }}>Montant max (€)</label>
              <input
                type="number"
                placeholder="Max"
                value={filters.amountMax || ""}
                onChange={(e) => handleChange("amountMax", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "var(--theme-surface-hover)", border: "1px solid var(--theme-border)", borderRadius: "8px", color: "var(--theme-text)" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button
              onClick={onReset}
              style={{ padding: "8px 16px", background: "var(--theme-border)", color: "var(--theme-text)", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
