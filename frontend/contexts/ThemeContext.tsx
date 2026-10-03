// contexts/ThemeContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// ==================== THÈMES DISPONIBLES ====================
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
    icon: "☀️"
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
    icon: "🌙"
  },

  
};

/** Ordre d'affichage dans le sélecteur de thème */
export const THEME_ORDER = ["light", "dark"];

/** true si le thème est de type « clair » (fond clair, texte foncé) */
export const isLightTheme = (theme: any): boolean => !!theme && theme.mode === "light";

interface ThemeContextType {
  theme: any;
  themeId: string;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider avec fallback
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState("light");
  const [theme, setTheme] = useState(THEMES.light);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme && THEMES[savedTheme]) {
      setThemeId(savedTheme);
      setTheme(THEMES[savedTheme]);
      applyTheme(THEMES[savedTheme]);
    } else {
      // Thème clair par défaut
      applyTheme(THEMES.light);
    }
  }, []);

  const applyTheme = (input: any) => {
    // Sécurité : si le thème demandé n'existe pas, on retombe sur le clair
    const selectedTheme = input || THEMES.light || THEMES.dark;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', selectedTheme.primary);
    root.style.setProperty('--theme-primary-rgb', selectedTheme.primaryRgb);
    root.style.setProperty('--theme-secondary', selectedTheme.secondary);
    root.style.setProperty('--theme-accent', selectedTheme.accent);
    root.style.setProperty('--theme-background', selectedTheme.background);
    root.style.setProperty('--theme-surface', selectedTheme.surface);
    root.style.setProperty('--theme-surface-hover', selectedTheme.surfaceHover);
    root.style.setProperty('--theme-text', selectedTheme.text);
    root.style.setProperty('--theme-text-secondary', selectedTheme.textSecondary);
    // Texte des menus latéraux : noir en thème blanc, gris-clair sinon
    root.style.setProperty('--theme-nav-text', selectedTheme.navText || (selectedTheme.mode === 'light' ? selectedTheme.text : selectedTheme.textSecondary));
    // Contrôles natifs (listes déroulantes, barres de défilement) cohérents avec le thème
    root.style.colorScheme = selectedTheme.mode === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', selectedTheme.id);
    root.setAttribute('data-mode', selectedTheme.mode === 'light' ? 'light' : 'dark');
    root.style.setProperty('--theme-border', selectedTheme.border);
    root.style.setProperty('--theme-border-hover', selectedTheme.borderHover);
    root.style.setProperty('--theme-gradient', selectedTheme.gradient);
    // Couleurs d'état propres à chaque thème (texte lisible + version « pleine » pour texte blanc dessus)
    const tone = (key: string, fallback: string) => selectedTheme[key] || fallback;
    root.style.setProperty('--theme-primary-text', tone('primaryText', selectedTheme.primary));
    root.style.setProperty('--theme-success', tone('success', '#10b981'));
    root.style.setProperty('--theme-success-solid', tone('successSolid', '#10b981'));
    root.style.setProperty('--theme-warning', tone('warning', '#f59e0b'));
    root.style.setProperty('--theme-warning-solid', tone('warningSolid', '#f59e0b'));
    root.style.setProperty('--theme-danger', tone('danger', '#ef4444'));
    root.style.setProperty('--theme-danger-solid', tone('dangerSolid', '#ef4444'));
    root.style.setProperty('--theme-info', tone('info', '#3b82f6'));
    root.style.setProperty('--theme-info-solid', tone('infoSolid', '#3b82f6'));
    root.style.setProperty('--theme-accent2', tone('accent2', '#8b5cf6'));
    root.style.setProperty('--theme-accent2-solid', tone('accent2Solid', '#8b5cf6'));
  };

  const setThemeById = (id: string) => {
    if (THEMES[id]) {
      setThemeId(id);
      setTheme(THEMES[id]);
      localStorage.setItem("app_theme", id);
      applyTheme(THEMES[id]);
    }
  };

  // Éviter l'hydratation mismatch
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme: setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn('useTheme called outside of ThemeProvider, using default light theme');
    return {
      theme: THEMES.light,
      themeId: "light",
      setTheme: () => {}
    };
  }
  return context;
}