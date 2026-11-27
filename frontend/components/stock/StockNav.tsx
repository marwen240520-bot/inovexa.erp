"use client";
/**
 * Barre d'onglets du module Stock : la vue d'ensemble (page historique) et les écrans de gestion
 * (/dashboard/stock/manage?tab=…). L'onglet actif se déduit de l'adresse.
 */
import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { makeTr } from "./i18n";

export const STOCK_TABS = ["levels", "warehouses", "movements", "lots", "counts", "alerts", "rotation", "valuation"] as const;
export type StockTab = (typeof STOCK_TABS)[number];

export const parseStockTab = (raw: string | null): StockTab => (STOCK_TABS.find((t) => t === raw) as StockTab | undefined) || "levels";

function Inner() {
  const { language } = useLanguage();
  const tr = makeTr(language);
  const pathname = usePathname() || "";
  const raw = useSearchParams().get("tab");
  const onManage = pathname.startsWith("/dashboard/stock/manage");
  const current: string = onManage ? parseStockTab(raw) : "overview";
  const items: Array<[string, string, string]> = [
    ["overview", tr("Vue d'ensemble", "Overview", "Resumen"), "/dashboard/stock"],
    ["levels", tr("Niveaux par dépôt", "Levels by warehouse", "Niveles por almacén"), "/dashboard/stock/manage?tab=levels"],
    ["warehouses", tr("Dépôts", "Warehouses", "Almacenes"), "/dashboard/stock/manage?tab=warehouses"],
    ["movements", tr("Mouvements", "Movements", "Movimientos"), "/dashboard/stock/manage?tab=movements"],
    ["lots", tr("Lots et péremption", "Lots & expiry", "Lotes y caducidad"), "/dashboard/stock/manage?tab=lots"],
    ["counts", tr("Inventaires", "Stock counts", "Inventarios"), "/dashboard/stock/manage?tab=counts"],
    ["alerts", tr("Alertes", "Alerts", "Alertas"), "/dashboard/stock/manage?tab=alerts"],
    ["rotation", tr("Rotation", "Turnover", "Rotación"), "/dashboard/stock/manage?tab=rotation"],
    ["valuation", tr("Valorisation", "Valuation", "Valoración"), "/dashboard/stock/manage?tab=valuation"],
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
  // useSearchParams impose une limite Suspense pour le rendu statique de la page qui l'utilise.
  return <Suspense fallback={null}><Inner /></Suspense>;
}
