import type { ReactNode } from "react";
import ClientsShell from "./ClientsShell";

// Le CRM est fusionné avec les clients : un seul module, « Clients », avec ses sous-pages
// (liste, /overview, /followups, /prices). Le layout garde l'écran CRM en place d'un onglet à l'autre.
export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ClientsShell />
      {children}
    </>
  );
}
