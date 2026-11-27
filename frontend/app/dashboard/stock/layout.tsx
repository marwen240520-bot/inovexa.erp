import type { ReactNode } from "react";
import StockShell from "./StockShell";

// Le layout garde l'écran de gestion du stock en place d'un onglet à l'autre
// (/dashboard/stock/levels, /warehouses, /movements, /lots, /counts, /alerts, /rotation, /valuation).
// /dashboard/stock (vue d'ensemble) a sa propre page.
export default function StockLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StockShell />
      {children}
    </>
  );
}
