"use client";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SelectAllCheckbox({ items, selectedIds, onSelect, onSelectAll, getItemId }) {
  const { t } = useLanguage();
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(items.map(getItemId));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={allSelected}
          ref={input => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={handleSelectAll}
          style={{ width: "18px", height: "18px", cursor: "pointer" }}
        />
        <span style={{ color: "#94a3b8", fontSize: "14px" }}>
          {allSelected ? t("common.deselectAll") : t("common.selectAll")}
        </span>
      </label>
      {selectedIds.length > 0 && (
        <span style={{ color: "#667eea", fontSize: "12px" }}>
          {t("common.selectedCount").replace("{count}", String(selectedIds.length))}
        </span>
      )}
    </div>
  );
}
