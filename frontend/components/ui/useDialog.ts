"use client";
import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FIELDS = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

/**
 * Comportement standard d'une fenêtre modale écrite à la main :
 *  - role="dialog", aria-modal et un nom accessible (le titre de la fenêtre) ;
 *  - Échap la ferme ; Tab / Maj+Tab restent dans la fenêtre ;
 *  - le focus entre dans la fenêtre à l'ouverture (premier champ) et revient au bouton d'origine à la fermeture.
 *
 *   const dlg = useDialog(modal.open, closeModal, "Ajouter un client");
 *   {modal.open && <div className="overlay"><div ref={dlg.ref} {...dlg.props}>…</div></div>}
 *
 * Les champs sans étiquette reliée sont nommés par A11yAutoLabels (monté dans la mise en page du tableau de bord).
 */
export function useDialog(open: boolean, onClose: () => void, label: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  // Mis à jour après chaque affichage (jamais pendant le rendu) : Échap appelle toujours la dernière version de onClose.
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Un champ qui a déjà le focus (autoFocus) le garde ; sinon le premier champ de saisie, sinon le premier élément actif, sinon la fenêtre.
    if (!node.contains(document.activeElement)) {
      (node.querySelector<HTMLElement>(FIELDS) || node.querySelector<HTMLElement>(FOCUSABLE) || node).focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); node.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !node.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !node.contains(active))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return {
    ref,
    props: { role: "dialog" as const, "aria-modal": true as const, "aria-label": label, tabIndex: -1 },
  };
}
