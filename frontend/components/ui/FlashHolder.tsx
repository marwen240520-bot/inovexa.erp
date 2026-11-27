import type { ReactNode } from "react";

/**
 * Message de confirmation ou d'erreur d'une page (« Enregistré », « Client supprimé », « Montant invalide »…).
 *
 * Ces messages étaient posés tout en haut de la page : quand l'action partait du bas d'une longue page
 * (« Enregistrer » des Paramètres, suppression d'une ligne dans une longue liste), le message restait hors de
 * l'écran et rien n'indiquait que l'action avait réussi ou échoué. Ils restent maintenant fixés en haut de la fenêtre,
 * au-dessus des fenêtres de dialogue.
 *
 * Le message lui-même (rôle status / alert, couleurs, icône) reste celui de la page : seule sa place change.
 * La mise en forme est dans app/globals.css (.ix-flash).
 */
export default function FlashHolder({ children }: { children: ReactNode }) {
  return (
    <div className="ix-flash">
      <div className="ix-flash-card">{children}</div>
    </div>
  );
}
