import type { ReactNode } from "react";
import TransporteurProfileApp from "./TransporteurProfileApp";

// Le layout garde le profil transporteur en place pendant qu'on passe de « Informations » à « Statistiques »
// (/transporteur/profile, /transporteur/profile/stats) : les données ne sont pas relues.
export default function TransporteurProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TransporteurProfileApp />
      {children}
    </>
  );
}
