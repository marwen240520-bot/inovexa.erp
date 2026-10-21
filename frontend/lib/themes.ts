// lib/themes.ts
// Palettes de thème partagées entre le serveur (app/layout.tsx) et le client (contexts/ThemeContext.tsx).
// Ce fichier n'a PAS de "use client" : le layout serveur peut donc lire les couleurs et les poser
// directement sur <html> au premier rendu (plus de page masquée ni de flash de thème).

export const THEMES: Record<string, any> = {
  light: {
    id: "light",
    mode: "light",
    name: "Clair",
    nameEn: "Light",
    nameEs: "Claro",
    primary: "#4f46e5",
    primaryRgb: "79, 70, 229",
    secondary: "#7c3aed",
    accent: "#047253",
    background: "#f3f4f6",
    surface: "#ffffff",
    surfaceHover: "#f9fafb",
    text: "#111827",
    textSecondary: "#4b5563",
    navText: "#111827",
    border: "#e5e7eb",
    borderHover: "#d1d5db",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    primaryText: "#4f46e5",
    success: "#0a7151",
    successSolid: "#0c835d",
    warning: "#905a0a",
    warningSolid: "#a2660a",
    danger: "#c91010",
    dangerSolid: "#e11010",
    info: "#095be6",
    infoSolid: "#176af6",
    accent2: "#7338f6",
    accent2Solid: "#8350f6",
    icon: "☀️",
  },
  dark: {
    id: "dark",
    mode: "dark",
    name: "Sombre",
    nameEn: "Dark",
    nameEs: "Oscuro",
    primary: "#667eea",
    primaryRgb: "102, 126, 234",
    secondary: "#764ba2",
    accent: "#10b981",
    background: "#0a0a0a",
    surface: "#111111",
    surfaceHover: "#1a1a1a",
    text: "#ffffff",
    textSecondary: "#94a3b8",
    border: "#222222",
    borderHover: "#333333",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    primaryText: "#667eea",
    success: "#10b981",
    successSolid: "#10b981",
    warning: "#f59e0b",
    warningSolid: "#f59e0b",
    danger: "#ef4444",
    dangerSolid: "#ef4444",
    info: "#3b82f6",
    infoSolid: "#3b82f6",
    accent2: "#8b5cf6",
    accent2Solid: "#8b5cf6",
    icon: "🌙",
  },
};

/** Ordre d'affichage dans le sélecteur de thème */
export const THEME_ORDER = ["light", "dark"];

/** Nom du cookie qui mémorise le thème (lu par le serveur pour rendre la bonne palette dès le HTML) */
export const THEME_COOKIE = "app_theme";

/** true si le thème est de type « clair » (fond clair, texte foncé) */
export const isLightTheme = (theme: any): boolean => !!theme && theme.mode === "light";

/** Retourne un identifiant de thème valide (clair par défaut) */
export function normalizeThemeId(id: string | null | undefined): string {
  return id && THEMES[id] ? id : "light";
}

/**
 * Variables CSS d'un thème. Utilisées :
 *  - côté serveur, en style inline sur <html> (bonne palette dès le premier octet) ;
 *  - côté client, par ThemeContext quand l'utilisateur change de thème.
 */
export function themeCssVars(input: any): Record<string, string> {
  const t = input || THEMES.light;
  const tone = (key: string, fallback: string) => t[key] || fallback;
  return {
    "--theme-primary": t.primary,
    "--theme-primary-rgb": t.primaryRgb,
    "--theme-secondary": t.secondary,
    "--theme-accent": t.accent,
    "--theme-background": t.background,
    "--theme-surface": t.surface,
    "--theme-surface-hover": t.surfaceHover,
    "--theme-text": t.text,
    "--theme-text-secondary": t.textSecondary,
    // Texte des menus latéraux : noir en thème blanc, gris-clair sinon
    "--theme-nav-text": t.navText || (t.mode === "light" ? t.text : t.textSecondary),
    "--theme-border": t.border,
    "--theme-border-hover": t.borderHover,
    "--theme-gradient": t.gradient,
    // Couleurs d'état propres à chaque thème (texte lisible + version « pleine » pour texte blanc dessus)
    "--theme-primary-text": tone("primaryText", t.primary),
    "--theme-success": tone("success", "#10b981"),
    "--theme-success-solid": tone("successSolid", "#10b981"),
    "--theme-warning": tone("warning", "#f59e0b"),
    "--theme-warning-solid": tone("warningSolid", "#f59e0b"),
    "--theme-danger": tone("danger", "#ef4444"),
    "--theme-danger-solid": tone("dangerSolid", "#ef4444"),
    "--theme-info": tone("info", "#3b82f6"),
    "--theme-info-solid": tone("infoSolid", "#3b82f6"),
    "--theme-accent2": tone("accent2", "#8b5cf6"),
    "--theme-accent2-solid": tone("accent2Solid", "#8b5cf6"),
  };
}
