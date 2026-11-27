import type { ReactNode } from "react";
import ReportsShell from "./ReportsShell";

// Le layout garde l'écran des rapports en place pendant qu'on passe de « Générer » à « Enregistrés »
// (/dashboard/reports/generate, /dashboard/reports/saved). /dashboard/reports/business a sa propre page.
export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ReportsShell />
      {children}
    </>
  );
}
