import type { ReactNode } from "react";
import ProfileApp from "./ProfileApp";

// Le layout garde le profil en place pendant qu'on passe d'un onglet à l'autre
// (/dashboard/profile, /dashboard/profile/security, /dashboard/profile/activity) : les saisies en cours ne sont pas perdues.
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProfileApp />
      {children}
    </>
  );
}
