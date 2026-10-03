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
    accent: "#059669",
    background: "#f3f4f6",
    surface: "#ffffff",
    surfaceHover: "#f9fafb",
    text: "#111827",
    textSecondary: "#6b7280",
    navText: "#111827",
    border: "#e5e7eb",
    borderHover: "#d1d5db",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
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
    icon: "🌙"
  },

  
  blue: {
    id: "blue",
    mode: "dark",
    name: "Bleu Océan",
    nameEn: "Ocean Blue",
    nameEs: "Azul Océano",
    primary: "#0284c7",
    primaryRgb: "2, 132, 199",
    secondary: "#0369a1",
    accent: "#0ea5e9",
    background: "#082f49",
    surface: "#0f172a",
    surfaceHover: "#1e293b",
    text: "#f8fafc",
    textSecondary: "#94a3b8",
    border: "#334155",
    borderHover: "#475569",
    gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    icon: "🌊"
  },
  sunset: {
    id: "sunset",
    mode: "dark",
    name: "Coucher de Soleil",
    nameEn: "Sunset",
    nameEs: "Atardecer",
    primary: "#ea580c",
    primaryRgb: "234, 88, 12",
    secondary: "#f97316",
    accent: "#fb923c",
    background: "#1c1917",
    surface: "#292524",
    surfaceHover: "#3f3e3d",
    text: "#fff7ed",
    textSecondary: "#fdba74",
    border: "#44403c",
    borderHover: "#57534e",
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    icon: "🌅"
  },
  purple: {
    id: "purple",
    mode: "dark",
    name: "Violet",
    nameEn: "Purple",
    nameEs: "Púrpura",
    primary: "#8b5cf6",
    primaryRgb: "139, 92, 246",
    secondary: "#a855f7",
    accent: "#c084fc",
    background: "#1e1b4b",
    surface: "#2e1065",
    surfaceHover: "#3b0764",
    text: "#faf5ff",
    textSecondary: "#d8b4fe",
    border: "#4c1d95",
    borderHover: "#6d28d9",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    icon: "🔮"
  },
  green: {
    id: "green",
    mode: "dark",
    name: "Forêt",
    nameEn: "Forest",
    nameEs: "Bosque",
    primary: "#059669",
    primaryRgb: "5, 150, 105",
    secondary: "#10b981",
    accent: "#34d399",
    background: "#022c22",
    surface: "#064e3b",
    surfaceHover: "#065f46",
    text: "#ecfdf5",
    textSecondary: "#6ee7b7",
    border: "#047857",
    borderHover: "#059669",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    icon: "🌲"
  },
  rose: {
    id: "rose",
    mode: "dark",
    name: "Rose",
    nameEn: "Rose",
    nameEs: "Rosa",
    primary: "#e11d48",
    primaryRgb: "225, 29, 72",
    secondary: "#f43f5e",
    accent: "#fb7185",
    background: "#1a060f",
    surface: "#2b0d1a",
    surfaceHover: "#3a1224",
    text: "#fff1f2",
    textSecondary: "#fda4af",
    border: "#5b1a31",
    borderHover: "#7f1d3a",
    gradient: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
    icon: "🌹"
  },
  lightPremium: {
    id: "lightPremium",
    mode: "light",
    name: "Premium Clair",
    nameEn: "Premium Light",
    nameEs: "Premium Claro",
    primary: "#a16207",
    primaryRgb: "161, 98, 7",
    secondary: "#b45309",
    accent: "#0f766e",
    background: "#faf7f2",
    surface: "#ffffff",
    surfaceHover: "#fbf8f3",
    text: "#1c1917",
    textSecondary: "#78716c",
    navText: "#1c1917",
    border: "#e7e0d5",
    borderHover: "#d6cdbd",
    gradient: "linear-gradient(135deg, #a16207 0%, #b45309 100%)",
    icon: "✨"
  }
};

/** Ordre d'affichage dans le sélecteur de thème */
export const THEME_ORDER = ["light", "lightPremium", "dark", "blue", "purple", "green", "sunset", "rose"];

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