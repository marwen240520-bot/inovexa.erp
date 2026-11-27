"use client";
import { usePathname } from "next/navigation";
import StockManageApp from "./StockManageApp";
import { STOCK_TAB_PATHS } from "@/components/stock/StockNav";

const STOCK_PATHS: readonly string[] = Object.values(STOCK_TAB_PATHS);

/**
 * Affiche l'écran de gestion du stock (niveaux, dépôts, mouvements…) uniquement sur l'adresse de l'un de ses onglets :
 * /dashboard/stock (la vue d'ensemble) a sa propre page. Le layout est partagé par la vue d'ensemble et par les onglets.
 */
export default function StockShell() {
  const pathname = (usePathname() || "").replace(/\/+$/, "");
  if (!STOCK_PATHS.includes(pathname)) return null;
  return <StockManageApp />;
}
