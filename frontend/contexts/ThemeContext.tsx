// contexts/ThemeContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// ==================== THÈMES DISPONIBLES ====================
export const THEMES: Record<string, any> = {
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
  }
};

interface ThemeContextType {
  theme: any;
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

  const applyTheme = (selectedTheme: any) => {
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
    console.warn('useTheme called outside of ThemeProvider, using default dark theme');
    return {
      theme: THEMES.dark,
      themeId: "dark",
      setTheme: () => {}
    };
  }
  return context;
}