"use client";
import { useEffect } from "react";

/**
 * Filet d'accessibilité des écrans du tableau de bord (écrits avant l'usage des étiquettes reliées) :
 *  - un <label> sans « htmlFor » est relié au champ qui le suit (les lecteurs d'écran annoncent alors le nom du champ) ;
 *  - un champ resté sans nom reprend son texte indicatif (placeholder), son titre ou le texte qui le précède ;
 *  - une colonne d'en-tête vide (boutons d'action) reçoit un nom ;
 *  - un graphique (role="img") reçoit le titre de sa carte.
 * Rien n'est modifié visuellement ; les écrans qui déclarent déjà leurs noms ne sont pas touchés.
 */

const CONTROLS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea';
const ACTIONS: Record<string, string> = { fr: "Actions", en: "Actions", es: "Acciones" };
let counter = 0;

const hasName = (el: HTMLElement) =>
  !!(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title") || (el as HTMLInputElement).labels?.length);

function controlAfter(label: HTMLElement): HTMLElement | null {
  let sib = label.nextElementSibling;
  while (sib && sib.tagName !== "LABEL") {
    const found = sib.matches(CONTROLS) ? (sib as HTMLElement) : sib.querySelector<HTMLElement>(CONTROLS);
    if (found) return found;
    sib = sib.nextElementSibling;
  }
  return null;
}

export function improveAccessibility(root: ParentNode) {
  root.querySelectorAll<HTMLLabelElement>("label").forEach((label) => {
    if (label.htmlFor || label.querySelector(CONTROLS)) return;
    const control = controlAfter(label);
    if (!control || (control as HTMLInputElement).labels?.length) return;
    if (!control.id) control.id = `auto-field-${++counter}`;
    label.htmlFor = control.id;
  });

  root.querySelectorAll<HTMLElement>(CONTROLS).forEach((el) => {
    if (hasName(el)) return;
    const previous = el.previousElementSibling?.textContent?.trim() || "";
    const text = el.getAttribute("placeholder") || (previous && previous.length <= 60 ? previous : "") || el.getAttribute("name") || "";
    if (text) el.setAttribute("aria-label", text);
  });

  const lang = (document.documentElement.lang || "fr").slice(0, 2);
  root.querySelectorAll<HTMLElement>("th").forEach((th) => {
    if (th.textContent?.trim() || th.getAttribute("aria-label") || th.getAttribute("title") || th.querySelector("[aria-label], img[alt]")) return;
    th.setAttribute("aria-label", ACTIONS[lang] || ACTIONS.fr);
  });

  root.querySelectorAll<HTMLElement>('[role="img"]:not([aria-label]):not([aria-labelledby])').forEach((el) => {
    const card = el.closest("section, article, div[class], div");
    let scope: Element | null = el.parentElement;
    let title = "";
    for (let depth = 0; scope && depth < 5 && !title; depth++, scope = scope.parentElement) {
      title = scope.querySelector("h1, h2, h3, h4")?.textContent?.trim() || "";
    }
    if (title || card) el.setAttribute("aria-label", title || "Graphique");
  });
}

export default function A11yAutoLabels() {
  useEffect(() => {
    improveAccessibility(document.body);
    let pending = false;
    const observer = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(() => {
        pending = false;
        improveAccessibility(document.body);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
