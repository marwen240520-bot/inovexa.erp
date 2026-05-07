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
        style={{ padding: "10px 16px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
      >
        🔍 Filtres avancés {isOpen ? "▲" : "▼"}
      </button>
      
      {isOpen && (
        <div style={{ marginTop: "16px", padding: "20px", background: "#111", borderRadius: "12px", border: "1px solid #222" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontSize: "12px" }}>Date début</label>
              <input
                type="date"
                value={filters.dateStart || ""}
                onChange={(e) => handleChange("dateStart", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "white" }}
              />
            </div>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontSize: "12px" }}>Date fin</label>
              <input
                type="date"
                value={filters.dateEnd || ""}
                onChange={(e) => handleChange("dateEnd", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "white" }}
              />
            </div>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontSize: "12px" }}>Statut</label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleChange("status", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "white" }}
              >
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontSize: "12px" }}>Montant min (€)</label>
              <input
                type="number"
                placeholder="Min"
                value={filters.amountMin || ""}
                onChange={(e) => handleChange("amountMin", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "white" }}
              />
            </div>
            <div>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "8px", fontSize: "12px" }}>Montant max (€)</label>
              <input
                type="number"
                placeholder="Max"
                value={filters.amountMax || ""}
                onChange={(e) => handleChange("amountMax", e.target.value)}
                style={{ width: "100%", padding: "10px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", color: "white" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button
              onClick={onReset}
              style={{ padding: "8px 16px", background: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
