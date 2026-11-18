// ============================================================
//  lib/aiChatButton.ts — Préférence « bouton Chat IA »
//
//  Le bouton flottant du Chat IA est affiché sur toutes les pages
//  du tableau de bord. L'utilisateur peut le masquer ou le réafficher
//  dans Paramètres › Préférences. La préférence est enregistrée sur
//  l'appareil (localStorage) et appliquée immédiatement dans tous
//  les onglets ouverts.
// ============================================================

export const AI_CHAT_BUTTON_KEY = "aiChatButton";
export const AI_CHAT_BUTTON_EVENT = "aiChatButtonChanged";

/** Le bouton est-il affiché ? (affiché par défaut) */
export function readAiChatButton(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(AI_CHAT_BUTTON_KEY) !== "0";
  } catch {
    return true;
  }
}

/** Affiche ou masque le bouton et prévient les composants déjà montés. */
export function writeAiChatButton(visible: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_CHAT_BUTTON_KEY, visible ? "1" : "0");
  } catch {
    /* stockage indisponible : la préférence ne vaut que pour cette page */
  }
  window.dispatchEvent(new CustomEvent(AI_CHAT_BUTTON_EVENT, { detail: { visible } }));
}
