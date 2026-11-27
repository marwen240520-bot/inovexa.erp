"use client";
import React, { useMemo, useState } from "react";
import { inputStyle } from "@/components/erp/kit";
import { parseNumber } from "@/lib/formValidation";
import type { Tr } from "./i18n";

export interface Warehouse { id: number; name: string; code: string; address: string | null; isDefault: boolean; isActive: boolean }
export interface StockProduct { id: number; name: string; sku?: string | null; unit?: string | null; quantity?: number | string; isStockable?: boolean; trackLots?: boolean }

export const isBlank = (v: unknown) => String(v ?? "").trim() === "";
/** Nombre saisi (« 12,5 », « 1 200,50 ») ; NaN si vide ou invalide. */
export const toNum = (v: unknown): number => parseNumber(v);
/** Nombre facultatif : vide -> undefined ; invalide -> NaN. */
export const optNum = (v: unknown): number | undefined => (isBlank(v) ? undefined : parseNumber(v));
/** Le serveur accepte au plus trois décimales. */
export const round3 = (n: number) => Math.round(n * 1000) / 1000;
export const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Jours restants avant une date (négatif = dépassée). */
export const daysUntil = (iso?: string | null) => (iso ? Math.round((new Date(String(iso).slice(0, 10)).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 86400000) : null);

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ background: "rgba(239,68,68,.1)", border: "1px solid #ef4444", color: "var(--theme-danger, #ef4444)", padding: "10px 12px", borderRadius: 10, fontSize: 13 }}>
      {message}
    </div>
  );
}

/** Étiquette + champ reliés (htmlFor/id) : les lecteurs d'écran annoncent le nom du champ. */
export function LabeledField({ id, label, required, hint, children }: { id: string; label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{label}{required ? " *" : ""}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--theme-text-secondary)" }}>{hint}</span>}
    </div>
  );
}

/** Choix d'un produit : champ de filtre (au-delà de 12 produits) + liste déroulante. */
export function ProductPicker({ id, label, products, value, onChange, tr, required, invalid, emptyLabel }: {
  id: string; label: string; products: StockProduct[]; value: string; onChange: (v: string) => void; tr: Tr; required?: boolean; invalid?: boolean; emptyLabel?: string;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = norm(q.trim());
    const matches = n ? products.filter((p) => norm(p.name).includes(n) || norm(p.sku).includes(n)) : products;
    const picked = products.find((p) => String(p.id) === value);
    const cut = matches.slice(0, 200);
    return picked && !cut.some((p) => p.id === picked.id) ? [picked, ...cut] : cut;
  }, [products, q, value]);
  return (
    <LabeledField id={id} label={label} required={required}>
      {products.length > 12 && (
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} style={inputStyle}
          placeholder={tr("Filtrer par nom ou SKU…", "Filter by name or SKU…", "Filtrar por nombre o SKU…")}
          aria-label={tr("Filtrer les produits", "Filter products", "Filtrar productos")}
        />
      )}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} aria-required={required || undefined} aria-invalid={invalid || undefined}>
        <option value="">— {emptyLabel || tr("Choisir un produit", "Choose a product", "Elegir un producto")} —</option>
        {list.map((p) => (
          <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>
        ))}
      </select>
    </LabeledField>
  );
}

/** Badge de statut de stock : rupture / bas / correct. */
export function stockTone(status?: string | null): "red" | "amber" | "green" {
  return status === "out" ? "red" : status === "low" ? "amber" : "green";
}
