// contexts/ThemeContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// ==================== THÈMES DISPONIBLES ====================
export const THEMES = {
  dark: {
    id: "dark",
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
  light: {
    id: "light",
    name: "Clair Moderne",
    nameEn: "Modern Light",
    nameEs: "Claro Moderno",
    // Nouvelles couleurs plus élégantes
    primary: "#6366f1",
    primaryRgb: "99, 102, 241",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
    // Fond avec un léger dégradé
    background: "#ffffff",
    surface: "#f8fafc",
    surfaceHover: "#f1f5f9",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    borderHover: "#cbd5e1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    icon: "☀️"
  },
  // NOUVEAU THÈME : Clair Premium
  lightPremium: {
    id: "lightPremium",
    name: "Premium Clair",
    nameEn: "Premium Light",
    nameEs: "Premium Claro",
    primary: "#0ea5e9",
    primaryRgb: "14, 165, 233",
    secondary: "#3b82f6",
    accent: "#10b981",
    background: "#f0f9ff",
    surface: "#ffffff",
    surfaceHover: "#f8fafc",
    text: "#0f172a",
    textSecondary: "#475569",
    border: "#e0f2fe",
    borderHover: "#bae6fd",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
    icon: "✨"
  },
  blue: {
    id: "blue",
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
  purple: {
    id: "purple",
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
    icon: "🟣"
  },
  green: {
    id: "green",
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
    textSecondary: "#a7f3d0",
    border: "#065f46",
    borderHover: "#047857",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    icon: "🌲"
  },
  sunset: {
    id: "sunset",
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
  // NOUVEAU THÈME : Rose
  rose: {
    id: "rose",
    name: "Rose",
    nameEn: "Rose",
    nameEs: "Rosa",
    primary: "#ec4899",
    primaryRgb: "236, 72, 153",
    secondary: "#f43f5e",
    accent: "#fb7185",
    background: "#2c0e1a",
    surface: "#3b0f24",
    surfaceHover: "#4a1030",
    text: "#fdf2f8",
    textSecondary: "#fbcfe8",
    border: "#4d1530",
    borderHover: "#6b2145",
    gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    icon: "🌸"
  }
};

interface ThemeContextType {
  theme: typeof THEMES.dark;
  themeId: string;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider avec fallback
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState("dark");
  const [theme, setTheme] = useState(THEMES.dark);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme && THEMES[savedTheme]) {
      setThemeId(savedTheme);
      setTheme(THEMES[savedTheme]);
      applyTheme(THEMES[savedTheme]);
    } else {
      applyTheme(THEMES.dark);
    }
  }, []);

  const applyTheme = (selectedTheme: typeof THEMES.dark) => {
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

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme: setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn('useTheme called outside of ThemeProvider, using default dark theme');
    return {
      theme: THEMES.dark,
      themeId: "dark",
      setTheme: () => {}
    };
  }
  return context;
}