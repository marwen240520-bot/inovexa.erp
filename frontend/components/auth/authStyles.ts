// components/auth/authStyles.ts
// Habillage commun des écrans d'accès (inscription, mot de passe oublié, nouveau mot de passe, confirmation de l'email).
//
// La page de connexion (app/auth/login/page.tsx) a été réglée à la main et garde sa propre feuille de style : les
// définitions « de base » ci-dessous en sont la copie fidèle (mêmes classes lg-*, mêmes valeurs), pour que toutes
// les pages aient exactement la même allure. Les blocs qui n'existaient pas (grille à deux colonnes, liste
// déroulante, case à cocher, séparateur « ou », message de réussite…) sont dans AUTH_EXTRA_STYLES, que la page de
// connexion importe aussi.

// ─── Couleurs (identiques à la page de connexion) ──────────────────────────────

export const LG_DARK: Record<string, string> = {
  "--lg-base": "#0A0614",
  "--lg-glow-1": "rgba(124,58,237,0.5)",
  "--lg-glow-2": "rgba(79,70,229,0.4)",
  "--lg-text": "#ffffff",
  "--lg-muted": "rgba(233,227,255,0.7)",
  "--lg-label": "rgba(233,227,255,0.85)",
  "--lg-faint": "rgba(233,227,255,0.55)",
  "--lg-card": "rgba(255,255,255,0.06)",
  "--lg-card-border": "rgba(255,255,255,0.14)",
  "--lg-card-shadow": "rgba(0,0,0,0.7)",
  "--lg-chip-bg": "rgba(255,255,255,0.08)",
  "--lg-chip-border": "rgba(255,255,255,0.18)",
  "--lg-input-bg": "rgba(0,0,0,0.25)",
  "--lg-input-border": "rgba(255,255,255,0.16)",
  "--lg-placeholder": "rgba(233,227,255,0.4)",
  "--lg-autofill": "#140d24",
  "--lg-accent": "#C4B5FD",
  "--lg-btn-bg": "#ffffff",
  "--lg-btn-text": "#2E1065",
  "--lg-btn-shadow": "rgba(167,139,250,0.45)",
  "--lg-error": "#fca5a5",
  "--lg-veil": "radial-gradient(ellipse 55% 65% at 50% 50%, rgba(5,4,10,0.45), rgba(5,4,10,0.88))",
  "--lg-card-solid": "rgba(16,10,30,0.74)",
  "--lg-bg-opacity": "0.7",
  "--lg-warn": "#FBBF24",
};

export const LG_LIGHT: Record<string, string> = {
  "--lg-base": "#F5F3FF",
  "--lg-glow-1": "rgba(167,139,250,0.45)",
  "--lg-glow-2": "rgba(129,140,248,0.3)",
  "--lg-text": "#1E1035",
  "--lg-muted": "#4B4466",
  "--lg-label": "#2E2550",
  "--lg-faint": "#6B6485",
  "--lg-card": "rgba(255,255,255,0.78)",
  "--lg-card-border": "rgba(109,40,217,0.16)",
  "--lg-card-shadow": "rgba(76,29,149,0.25)",
  "--lg-chip-bg": "rgba(255,255,255,0.85)",
  "--lg-chip-border": "rgba(109,40,217,0.2)",
  "--lg-input-bg": "#ffffff",
  "--lg-input-border": "rgba(109,40,217,0.22)",
  "--lg-placeholder": "#9a93b3",
  "--lg-autofill": "#ffffff",
  "--lg-accent": "#6D28D9",
  "--lg-btn-bg": "#2E1065",
  "--lg-btn-text": "#ffffff",
  "--lg-btn-shadow": "rgba(109,40,217,0.35)",
  "--lg-error": "#b91c1c",
  "--lg-veil": "radial-gradient(ellipse 55% 65% at 50% 50%, rgba(245,243,255,0.35), rgba(245,243,255,0.88))",
  "--lg-card-solid": "rgba(255,255,255,0.86)",
  "--lg-bg-opacity": "0.85",
  "--lg-warn": "#b45309",
};

/** Variables --lg-* du thème courant (même règle que la page de connexion). */
export function buildLgVars(themeId: string, theme: { mode?: string; background?: string } | null | undefined): Record<string, string> {
  if (themeId === "dark") return LG_DARK;
  if (themeId === "light") return LG_LIGHT;
  const light = !!theme && theme.mode === "light";
  return { ...(light ? LG_LIGHT : LG_DARK), "--lg-base": theme?.background || (light ? LG_LIGHT : LG_DARK)["--lg-base"] };
}

// ─── Base : copie des définitions de la page de connexion ──────────────────────

export const AUTH_BASE_STYLES = `
  .lg-root {
    min-height: 100vh; min-height: 100dvh; position: relative; overflow-x: hidden;
    display: flex; flex-direction: column; align-items: center;
    font-family: var(--font-poppins), -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--lg-text);
    background-color: var(--lg-base);
    background-image:
      radial-gradient(ellipse 50% 45% at 85% 95%, var(--lg-glow-2), transparent 60%);
  }
  .lg-center, .lg-footer { position: relative; z-index: 1; }

  .lg-fx { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .lg-fx span { position: absolute; inset: 0; }
  .lg-light .lg-fx { opacity: .5; }
  .lg-fx-horizon { background: linear-gradient(180deg, transparent 50%, rgba(124,58,237,0.25)); }
  .lg-fx-horizon span { top: 55%; inset-inline: -50%; bottom: -20%; background-image: linear-gradient(rgba(196,181,253,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(196,181,253,0.35) 1px, transparent 1px); background-size: 60px 60px; transform: perspective(500px) rotateX(62deg); transform-origin: top; -webkit-mask-image: linear-gradient(transparent, #000 40%); mask-image: linear-gradient(transparent, #000 40%); }
  .lg-light .lg-fx-horizon { opacity: 1; background: linear-gradient(180deg, transparent 50%, rgba(167,139,250,0.3)); }
  .lg-light .lg-fx-horizon span { background-image: linear-gradient(rgba(109,40,217,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,0.28) 1px, transparent 1px); }

  .lg-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .lg-root :focus-visible { outline: 2px solid #A78BFA; outline-offset: 3px; border-radius: 10px; }

  .lg-topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 60; display: flex; align-items: center; justify-content: space-between; padding: max(env(safe-area-inset-top, 0px), 16px) clamp(16px, 2.2vw, 32px) 0; pointer-events: none; }
  .lg-topbar > * { pointer-events: auto; }
  .lg-back { display: inline-flex; align-items: center; gap: 8px; color: var(--lg-muted); font-size: 14px; font-weight: 500; text-decoration: none; padding: 8px 4px; transition: color .2s; }
  .lg-back:hover { color: var(--lg-text); }
  .lg-controls { display: flex; align-items: center; gap: 10px; }

  .lg-center { flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: clamp(72px, 9vh, 96px) 16px clamp(16px, 3vh, 32px); }

  .lg-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; margin-bottom: clamp(18px, 3vh, 26px); }
  .lg-logo { width: clamp(50px, 7vh, 64px); height: clamp(50px, 7vh, 64px); flex-shrink: 0; border-radius: 50%; background: var(--lg-chip-bg); border: 1px solid var(--lg-chip-border); box-shadow: 0 0 28px rgba(168,85,247,0.4); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .lg-logo img { width: 82%; height: 82%; object-fit: contain; filter: drop-shadow(0 0 8px rgba(138,43,226,0.6)); }
  .lg-brand-name { font-family: var(--font-orbitron), var(--font-poppins), sans-serif; font-weight: 800; font-size: clamp(17px, 2.3vh, 20px); letter-spacing: 2px; color: var(--lg-text); white-space: nowrap; }
  .lg-brand-erp { color: var(--lg-accent); font-size: 0.7em; letter-spacing: 4px; }

  .lg-card { width: 100%; max-width: 440px; padding: clamp(24px, 4vh, 36px) clamp(22px, 2.6vw, 36px) clamp(20px, 3.2vh, 28px); border-radius: 24px; background: var(--lg-card-solid); border: 1px solid var(--lg-card-border); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 40px 100px -30px var(--lg-card-shadow); }
  .lg-title { margin: 0 0 6px; text-align: start; font-size: clamp(24px, 3.4vh, 30px); font-weight: 700; letter-spacing: -0.02em; color: var(--lg-text); }
  .lg-welcome { margin: 0 0 clamp(18px, 3vh, 26px); text-align: start; font-size: 14.5px; line-height: 1.5; color: var(--lg-muted); }

  .lg-error { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding: 12px 14px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--lg-error); font-size: 13.5px; animation: lgShake .5s ease; }
  .lg-error svg { flex-shrink: 0; }

  .lg-field { margin-bottom: clamp(12px, 2vh, 18px); }
  .lg-label { display: block; margin-bottom: 7px; font-size: 13px; font-weight: 500; color: var(--lg-label); }
  .lg-input-wrap { position: relative; }
  .lg-input-icon { position: absolute; inset-inline-start: 15px; top: 50%; transform: translateY(-50%); display: flex; color: var(--lg-muted); pointer-events: none; }
  .lg-input { width: 100%; height: clamp(46px, 6vh, 52px); padding: 0; padding-inline: 46px 16px; border-radius: 12px; border: 1px solid var(--lg-input-border); background: var(--lg-input-bg); color: var(--lg-text); font-family: inherit; font-size: 15.5px; outline: none; -webkit-appearance: none; transition: border-color .2s, box-shadow .2s; }
  .lg-input-pass { padding-inline-end: 50px; }
  .lg-input::placeholder { color: var(--lg-placeholder); }
  .lg-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.25); }
  .lg-input[aria-invalid="true"] { border-color: rgba(239,68,68,0.55); }
  .lg-input:-webkit-autofill, .lg-input:-webkit-autofill:hover, .lg-input:-webkit-autofill:focus { -webkit-text-fill-color: var(--lg-text); -webkit-box-shadow: 0 0 0 1000px var(--lg-autofill) inset; transition: background-color 5000s ease-in-out 0s; }
  .lg-eye { position: absolute; inset-inline-end: 4px; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: none; border: none; border-radius: 10px; color: var(--lg-muted); cursor: pointer; }
  .lg-eye:hover { color: var(--lg-text); }
  .lg-caps { display: flex; align-items: center; gap: 6px; margin: 8px 0 0; font-size: 12.5px; color: var(--lg-warn); }

  .lg-remember { display: flex; align-items: center; gap: 10px; min-height: 28px; margin: 2px 0 clamp(16px, 2.6vh, 22px); font-size: 13.5px; color: var(--lg-label); cursor: pointer; }
  .lg-remember input { width: 18px; height: 18px; accent-color: #8b5cf6; cursor: pointer; }

  .lg-btn { width: 100%; height: clamp(48px, 6.2vh, 54px); display: flex; align-items: center; justify-content: center; gap: 10px; border: none; border-radius: 999px; background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%); color: #ffffff; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 40px rgba(168,85,247,0.45); transition: transform .15s ease, box-shadow .25s ease, opacity .2s; touch-action: manipulation; }
  .lg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 48px var(--lg-btn-shadow); }
  .lg-btn:active:not(:disabled) { transform: scale(0.98); }
  .lg-btn:disabled { opacity: .7; cursor: not-allowed; }
  .lg-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; animation: lgSpin .8s linear infinite; }

  .lg-secure { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; font-size: 12.5px; color: var(--lg-muted); }

  .lg-footer { margin: 0; padding: 0 16px max(env(safe-area-inset-bottom, 0px), clamp(14px, 2.6vh, 24px)); font-size: 12px; color: var(--lg-faint); text-align: center; }

  @media (max-width: 520px) {
    .lg-back span { display: none; }
    .lg-back { width: 40px; height: 40px; justify-content: center; border-radius: 50%; background: var(--lg-chip-bg); border: 1px solid var(--lg-chip-border); padding: 0; }
    .lg-card { border-radius: 20px; padding: 24px 20px 20px; }
    .lg-input { font-size: 16px; }
  }

  @keyframes lgFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes lgShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(3px); } 30%, 50%, 70% { transform: translateX(-5px); } 40%, 60% { transform: translateX(5px); } }
  @keyframes lgSpin { to { transform: rotate(360deg); } }
  .lg-anim { animation: lgFadeUp .6s cubic-bezier(0.22,1,0.36,1) both; }
  @media (prefers-reduced-motion: reduce) {
    .lg-anim, .lg-error { animation: none !important; }
    .lg-btn, .lg-input { transition: none !important; }
  }
`;

// ─── Compléments : blocs absents de la page de connexion d'origine ─────────────

export const AUTH_EXTRA_STYLES = `
  /* Couleurs des nouveaux blocs, posées par classe de thème : la page de connexion, qui garde sa propre liste de
     variables, en profite sans rien changer. */
  .lg-dark { --lg-ok: #86efac; --lg-ok-bg: rgba(34,197,94,0.12); --lg-ok-border: rgba(34,197,94,0.32); --lg-info-bg: rgba(139,92,246,0.14); --lg-info-border: rgba(167,139,250,0.34); --lg-line: rgba(255,255,255,0.14); }
  .lg-light { --lg-ok: #166534; --lg-ok-bg: rgba(22,163,74,0.09); --lg-ok-border: rgba(22,163,74,0.3); --lg-info-bg: rgba(109,40,217,0.06); --lg-info-border: rgba(109,40,217,0.2); --lg-line: rgba(109,40,217,0.16); }

  /* Formulaires longs : la barre du haut défile avec la page au lieu de flotter sur les champs */
  .lg-shell .lg-topbar { position: absolute; }

  .lg-card-wide { max-width: 660px; }

  /* Deux colonnes, une seule sur téléphone */
  .lg-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 14px; }
  @media (max-width: 620px) { .lg-cols { grid-template-columns: minmax(0, 1fr); } }

  .lg-input-plain { padding-inline: 16px; }
  .lg-input:disabled { opacity: .65; cursor: not-allowed; }
  .lg-hint { margin: 7px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--lg-faint); overflow-wrap: anywhere; }
  .lg-field-error { margin: 7px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--lg-error); }

  /* Liste déroulante : même champ que les autres, avec sa propre flèche */
  .lg-select { padding-inline-end: 44px; cursor: pointer; text-overflow: ellipsis; appearance: none; }
  .lg-select[data-empty="true"] { color: var(--lg-placeholder); }
  .lg-select option { background-color: var(--lg-autofill); color: var(--lg-text); }
  .lg-select-arrow { position: absolute; inset-inline-end: 14px; top: 50%; transform: translateY(-50%); display: flex; color: var(--lg-muted); pointer-events: none; }

  /* Règles du mot de passe, cochées au fil de la saisie */
  .lg-rules { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 9px 0 0; padding: 0; list-style: none; font-size: 12.5px; line-height: 1.4; color: var(--lg-faint); }
  .lg-rules li { display: inline-flex; align-items: center; gap: 6px; }
  .lg-rules li[data-ok="true"] { color: var(--lg-ok); }
  .lg-rules svg { flex-shrink: 0; }

  /* Case à cocher suivie d'une phrase avec des liens */
  .lg-check { display: flex; align-items: flex-start; gap: 10px; margin: 4px 0 clamp(16px, 2.6vh, 22px); font-size: 13.5px; line-height: 1.55; color: var(--lg-label); }
  .lg-check input { width: 18px; height: 18px; margin: 2px 0 0; flex-shrink: 0; accent-color: #8b5cf6; cursor: pointer; }
  .lg-check label { cursor: pointer; }
  .lg-check a { color: var(--lg-accent); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
  .lg-check .lg-field-error { margin-top: 4px; }

  .lg-link { color: var(--lg-accent); font-weight: 600; text-decoration: none; }
  .lg-link:hover { text-decoration: underline; }
  .lg-linkbtn { padding: 0; border: none; background: none; font: inherit; font-weight: 600; color: var(--lg-accent); cursor: pointer; }
  .lg-linkbtn:hover:not(:disabled) { text-decoration: underline; }
  .lg-linkbtn:disabled { opacity: .6; cursor: not-allowed; }

  /* Liens secondaires sous le formulaire */
  .lg-links { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 18px; font-size: 13.5px; line-height: 1.5; color: var(--lg-muted); text-align: center; }
  .lg-links p { margin: 0; }

  .lg-divider { display: flex; align-items: center; gap: 14px; margin: 18px 0 14px; font-size: 12.5px; color: var(--lg-faint); }
  .lg-divider::before, .lg-divider::after { content: ""; flex: 1; height: 1px; background: var(--lg-line); }

  .lg-success, .lg-info { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px; padding: 12px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; }
  .lg-success { background: var(--lg-ok-bg); border: 1px solid var(--lg-ok-border); color: var(--lg-ok); }
  .lg-info { background: var(--lg-info-bg); border: 1px solid var(--lg-info-border); color: var(--lg-label); }
  .lg-success svg, .lg-info svg { flex-shrink: 0; margin-top: 2px; }
  .lg-info svg { color: var(--lg-accent); }
  .lg-shell .lg-error { align-items: flex-start; line-height: 1.5; scroll-margin-top: 84px; }
  .lg-shell .lg-error svg { margin-top: 2px; }
  .lg-box-body { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .lg-box-action { display: block; margin-top: 6px; }

  /* Bloc repliable « informations facultatives » */
  .lg-more { margin-bottom: clamp(12px, 2vh, 18px); border: 1px solid var(--lg-input-border); border-radius: 14px; }
  .lg-more > summary { list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; padding: 10px 16px; border-radius: 14px; font-size: 13.5px; font-weight: 500; color: var(--lg-label); cursor: pointer; }
  .lg-more > summary::-webkit-details-marker { display: none; }
  .lg-more > summary svg { flex-shrink: 0; color: var(--lg-muted); transition: transform .2s; }
  .lg-more[open] > summary svg { transform: rotate(180deg); }
  .lg-more-body { padding: 6px 16px 0; }

  /* Bouton secondaire (réessayer, continuer autrement) */
  .lg-btn-ghost { width: 100%; min-height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--lg-input-border); background: var(--lg-chip-bg); color: var(--lg-text); font-family: inherit; font-size: 14.5px; font-weight: 600; text-decoration: none; cursor: pointer; transition: border-color .2s; }
  .lg-btn-ghost:hover:not(:disabled) { border-color: #8b5cf6; }
  .lg-btn-ghost:disabled { opacity: .6; cursor: not-allowed; }
  a.lg-btn { text-decoration: none; }
  .lg-after-btn { margin-top: 14px; text-align: center; font-size: 13.5px; }

  /* Bouton Google : dessiné par Google dans un cadre ; color-scheme clair pour que ce cadre reste transparent */
  .lg-google { display: flex; justify-content: center; min-height: 44px; color-scheme: light; }
  .lg-google[data-disabled="true"] { opacity: .55; pointer-events: none; }

  /* Boutons Google et Apple, l'un sous l'autre, à la même largeur (400 px au plus : limite du bouton de Google) */
  .lg-social-buttons { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .lg-social-buttons > * { width: 100%; max-width: 400px; }
  /* Bouton Apple : noir sur thème clair, blanc sur thème sombre (recommandations d'Apple), même forme que celui de Google */
  .lg-apple { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid #000; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", var(--font-poppins), sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity .2s; }
  .lg-dark .lg-apple { border-color: #fff; background: #fff; color: #000; }
  .lg-apple:hover:not(:disabled) { opacity: .86; }
  .lg-apple:disabled { opacity: .55; cursor: not-allowed; }

  /* Lien « mot de passe oublié » aligné à la fin de la ligne « se souvenir de moi » */
  .lg-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; margin: 2px 0 clamp(16px, 2.6vh, 22px); font-size: 13.5px; }
  .lg-row .lg-remember { margin: 0; }

  /* Attente (vérification en cours, chargement) */
  .lg-status { display: flex; align-items: center; gap: 12px; margin: 0 0 20px; font-size: 14.5px; line-height: 1.5; color: var(--lg-muted); }
  .lg-status .lg-spinner { flex-shrink: 0; width: 20px; height: 20px; color: var(--lg-accent); }

  /* Rappel du compte concerné (nouveau mot de passe) */
  .lg-account { margin: 0 0 18px; padding: 10px 14px; border-radius: 12px; background: var(--lg-info-bg); border: 1px solid var(--lg-info-border); font-size: 13.5px; line-height: 1.5; color: var(--lg-label); overflow-wrap: anywhere; }
  .lg-account bdi { font-weight: 600; color: var(--lg-text); }

  .lg-otp { letter-spacing: 0.3em; font-variant-numeric: tabular-nums; }

  .lg-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }

  @media (prefers-reduced-motion: reduce) {
    .lg-more > summary svg, .lg-btn-ghost { transition: none !important; }
  }
`;

/** Feuille complète des pages construites avec AuthShell. */
export const AUTH_STYLES = AUTH_BASE_STYLES + AUTH_EXTRA_STYLES;
