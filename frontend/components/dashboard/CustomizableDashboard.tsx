"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCategory } from "@/contexts/CategoryContext";

export function CustomizableDashboard() {
  const { getCategoryInfo } = useCategory();
  const categoryInfo = getCategoryInfo();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
      <div style={{ background: "#111", borderRadius: "20px", padding: "16px", border: "1px solid #222" }}>
        <h3 style={{ color: "white", marginBottom: "12px" }}>📊 Vue d'ensemble</h3>
        <p style={{ color: "#94a3b8" }}>Bienvenue sur votre espace {categoryInfo?.name || "Inovexa ERP"}</p>
      </div>
    </div>
  );
}
