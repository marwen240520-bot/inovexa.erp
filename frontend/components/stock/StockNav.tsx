"use client";
/**
 * Barre d'onglets du module Stock : la vue d'ensemble (page historique) et les écrans de gestion
 * (/dashboard/stock/levels, /warehouses…, les mêmes adresses que les sous-pages du menu latéral). L'onglet actif se déduit de l'adresse.
 */
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { makeTr } from "./i18n";

export const STOCK_TABS = ["levels", "warehouses", "movements", "lots", "counts", "alerts", "rotation", "valuation"] as const;
export type StockTab = (typeof STOCK_TABS)[number];

/** Adresse de chaque onglet de gestion (la vue d'ensemble reste sur /dashboard/stock). */
export const STOCK_TAB_PATHS = {
  levels: "/dashboard/stock/levels",
  warehouses: "/dashboard/stock/warehouses",
  movements: "/dashboard/stock/movements",
  lots: "/dashboard/stock/lots",
  counts: "/dashboard/stock/counts",
  alerts: "/dashboard/stock/alerts",
  rotation: "/dashboard/stock/rotation",
  valuation: "/dashboard/stock/valuation",
} as const;

export const parseStockTab = (raw: string | null): StockTab => (STOCK_TABS.find((t) => t === raw) as StockTab | undefined) || "levels";

function Inner() {
  const { language } = useLanguage();
  const tr = makeTr(language);
  const pathname = usePathname() || "";
  const here = pathname.replace(/\/+$/, "");
  const current: string = STOCK_TABS.find((t) => STOCK_TAB_PATHS[t] === here) ?? "overview";
  const items: Array<[string, string, string]> = [
    ["overview", tr("Vue d'ensemble", "Overview", "Resumen"), "/dashboard/stock"],
    ["levels", tr("Niveaux par dépôt", "Levels by warehouse", "Niveles por almacén"), "/dashboard/stock/levels"],
    ["warehouses", tr("Dépôts", "Warehouses", "Almacenes"), "/dashboard/stock/warehouses"],
    ["movements", tr("Mouvements", "Movements", "Movimientos"), "/dashboard/stock/movements"],
    ["lots", tr("Lots et péremption", "Lots & expiry", "Lotes y caducidad"), "/dashboard/stock/lots"],
    ["counts", tr("Inventaires", "Stock counts", "Inventarios"), "/dashboard/stock/counts"],
    ["alerts", tr("Alertes", "Alerts", "Alertas"), "/dashboard/stock/alerts"],
    ["rotation", tr("Rotation", "Turnover", "Rotación"), "/dashboard/stock/rotation"],
    ["valuation", tr("Valorisation", "Valuation", "Valoración"), "/dashboard/stock/valuation"],
  ];
  return (
    <nav aria-label={tr("Navigation du stock", "Stock navigation", "Navegación del stock")} style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--theme-border)", marginBottom: 18, overflowX: "auto" }}>
      {items.map(([key, label, href]) => {
        const active = key === current;
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              padding: "10px 14px", fontSize: 14, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", textDecoration: "none",
              color: active ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary)",
              borderBottom: `2px solid ${active ? "var(--theme-primary, #4f46e5)" : "transparent"}`, marginBottom: -1,
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function StockNav() {
  return <Inner />;
}
