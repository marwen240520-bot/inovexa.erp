// contexts/ThemeContext.tsx
"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  THEMES,
  THEME_ORDER,
  THEME_COOKIE,
  isLightTheme,
  normalizeThemeId,
  themeCssVars,
} from "@/lib/themes";

// Ré-exports : les pages existantes continuent d'importer depuis "@/contexts/ThemeContext"
export { THEMES, THEME_ORDER, isLightTheme };

interface ThemeContextType {
  theme: any;
  themeId: string;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Pose les variables CSS + attributs du thème sur <html> */
function applyTheme(input: any) {
  const selected = input || THEMES.light;
  const root = document.documentElement;
  const vars = themeCssVars(selected);
  for (const key in vars) root.style.setProperty(key, vars[key]);
  // Contrôles natifs (listes déroulantes, barres de défilement) cohérents avec le thème
  root.style.colorScheme = selected.mode === "light" ? "light" : "dark";
  root.setAttribute("data-theme", selected.id);
  root.setAttribute("data-mode", selected.mode === "light" ? "light" : "dark");
}

function persistTheme(id: string) {
  try { localStorage.setItem("app_theme", id); } catch { /* stockage indisponible */ }
  try { document.cookie = `${THEME_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`; } catch { /* ignoré */ }
}

/**
 * Le thème initial est fourni par le serveur (cookie « app_theme »), donc le HTML arrive déjà
 * avec la bonne palette : plus besoin de masquer la page jusqu'au montage.
 * (L'ancienne version rendait d'abord un <div> caché puis le Provider : React démontait et
 *  remontait TOUTE l'application au chargement, ce qui doublait les appels API.)
 */
export function ThemeProvider({
  children,
  initialThemeId,
}: {
  children: React.ReactNode;
  initialThemeId?: string;
}) {
  const [themeId, setThemeId] = useState<string>(() => normalizeThemeId(initialThemeId));

  // Migration : utilisateurs dont le choix n'existe que dans localStorage (avant le cookie)
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("app_theme"); } catch { /* ignoré */ }
    if (saved && THEMES[saved] && saved !== themeId) {
      setThemeId(saved);
      applyTheme(THEMES[saved]);
      persistTheme(saved);
    } else {
      persistTheme(themeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((id: string) => {
    if (!THEMES[id]) return;
    setThemeId(id);
    applyTheme(THEMES[id]);
    persistTheme(id);
  }, []);

  const value = useMemo(
    () => ({ theme: THEMES[themeId] || THEMES.light, themeId, setTheme }),
    [themeId, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: THEMES.light,
      themeId: "light",
      setTheme: () => {},
    };
  }
  return context;
}
