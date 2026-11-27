import type { ReactNode } from "react";
import AccountingApp from "./AccountingApp";

// Le layout garde la comptabilité en place pendant qu'on passe d'un onglet à l'autre
// (/dashboard/accounting/journal, /balance, /result, /vat, /bank) : la période choisie et les données restent.
export default function AccountingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AccountingApp />
      {children}
    </>
  );
}
