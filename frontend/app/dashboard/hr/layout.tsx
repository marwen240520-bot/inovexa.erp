import type { ReactNode } from "react";
import HrShell from "./HrShell";

// Le layout garde l'écran Paie et congés en place d'un onglet à l'autre
// (/dashboard/hr/payroll, /dashboard/hr/payroll/settings, /dashboard/hr/leaves). /dashboard/hr (employés) a sa propre page.
export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HrShell />
      {children}
    </>
  );
}
