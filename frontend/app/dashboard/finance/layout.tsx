import type { ReactNode } from "react";
import FinanceApp from "./FinanceApp";

// Le layout garde l'écran Finance en place pendant qu'on passe d'un onglet à l'autre
// (/dashboard/finance, /income, /expenses, /cashflow, /balance, /budget, /ratios, /invoices) : rien n'est rechargé.
export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FinanceApp />
      {children}
    </>
  );
}
