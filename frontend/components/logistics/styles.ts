// components/logistics/styles.ts
// Styles communs des pages Logistique. Les couleurs viennent des variables du thème (clair et sombre),
// les espacements sont écrits en propriétés logiques (début / fin).
import type { CSSProperties } from "react";

/**
 * Règles qu'un style en ligne ne sait pas exprimer : survol, animations d'entrée, texte réservé aux lecteurs d'écran,
 * taille de police des champs sur téléphone (16 px : iOS ne zoome pas à la saisie).
 * Les fenêtres modales sont rendues hors de la page (portail) : elles portent aussi la classe « lgx ».
 */
export const LOGISTICS_CSS = `
.lgx-page { padding: 24px; padding-bottom: 32px; }
@media (max-width: 767px) {
  .lgx-page { padding: 12px; padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)); }
}
.lgx-control { font-size: 14px; }
.lgx-control::placeholder { color: var(--theme-text-secondary); opacity: 0.8; }
.lgx-control:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width: 767px) { .lgx-control { font-size: 16px; } }
.lgx-btn { transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease; }
.lgx-btn:hover:not(:disabled) { opacity: 0.88; }
.lgx-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.lgx-lift { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
a.lgx-lift:hover, button.lgx-lift:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(17, 24, 39, 0.10); }
.lgx-link { color: var(--theme-primary-text, var(--theme-primary)); text-decoration: none; }
.lgx-link:hover { text-decoration: underline; }
.lgx-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.lgx-fade-down { animation: lgx-fade-down 0.5s ease both; }
.lgx-fade-up { animation: lgx-fade-up 0.5s ease both; }
.lgx-fade { animation: lgx-fade 0.25s ease both; }
.lgx-spin { animation: lgx-spin 0.9s linear infinite; }
.lgx-skeleton { background: var(--theme-border); border-radius: 8px; animation: lgx-pulse 1.4s ease-in-out infinite; }
@keyframes lgx-fade-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lgx-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lgx-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes lgx-spin { to { transform: rotate(360deg); } }
@keyframes lgx-pulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.45; } }
@media (prefers-reduced-motion: reduce) {
  .lgx-fade-down, .lgx-fade-up, .lgx-fade, .lgx-skeleton { animation: none; }
  a.lgx-lift:hover, button.lgx-lift:hover:not(:disabled) { transform: none; }
}
`;

export const cardStyle: CSSProperties = {
  background: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  borderRadius: 16,
};

/** Champ de saisie : le style global de l'application impose déjà une largeur de 100 % aux champs. */
export const controlStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  background: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  borderRadius: 8,
  color: "var(--theme-text)",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

/** Case à cocher : taille fixe (sans cela le style global l'étire sur toute la largeur). */
export const checkboxStyle: CSSProperties = {
  width: 16,
  height: 16,
  padding: 0,
  margin: 0,
  flexShrink: 0,
  cursor: "pointer",
  accentColor: "var(--theme-primary)",
};

export const primaryButtonStyle: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  minHeight: 42, padding: "0 18px", border: "none", borderRadius: 10,
  background: "var(--theme-gradient)", color: "#ffffff", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
  cursor: "pointer", whiteSpace: "nowrap",
};

export const ghostButtonStyle: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  minHeight: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--theme-border)",
  background: "var(--theme-surface-hover)", color: "var(--theme-text)", fontSize: 14, fontWeight: 500, fontFamily: "inherit",
  cursor: "pointer", whiteSpace: "nowrap",
};

/** Petits boutons d'action d'une ligne (modifier, supprimer). */
export const rowActionStyle = (tone: "edit" | "delete"): CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
  minWidth: 32, minHeight: 32, padding: "0 8px", border: "none", borderRadius: 8,
  background: tone === "edit" ? "var(--theme-warning-solid, #d97706)" : "var(--theme-danger-solid, #dc2626)",
  color: "#ffffff", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
});

export const thStyle: CSSProperties = {
  padding: "10px", textAlign: "start", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  color: "var(--theme-text-secondary)", borderBottom: "1px solid var(--theme-border)",
};

export const tdStyle: CSSProperties = {
  padding: "10px", fontSize: 13, color: "var(--theme-text-secondary)", borderBottom: "1px solid var(--theme-surface-hover)", verticalAlign: "middle",
};
