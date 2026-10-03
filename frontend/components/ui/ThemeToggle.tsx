"use client";
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThemeToggleProps {
  /** Taille du bouton en pixels */
  size?: number;
  /** "home" : style de la page d'accueil (variables --hp-*) ; "default" : variables du thème de l'application */
  variant?: "default" | "home";
  style?: React.CSSProperties;
}

const LABELS: Record<string, { toDark: string; toLight: string }> = {
  fr: { toDark: "Passer au thème sombre", toLight: "Passer au thème clair" },
  en: { toDark: "Switch to dark theme", toLight: "Switch to light theme" },
  es: { toDark: "Cambiar al tema oscuro", toLight: "Cambiar al tema claro" },
};

/**
 * Bouton soleil / lune : bascule entre le thème clair et le thème sombre.
 * (Les autres thèmes — bleu, coucher de soleil — sont sélectionnables depuis la page Profil ;
 *  depuis l'un d'eux, ce bouton ramène au thème clair.)
 */
export default function ThemeToggle({ size = 40, variant = "default", style }: ThemeToggleProps) {
  const { themeId, setTheme } = useTheme();
  const { language } = useLanguage();
  const isLight = themeId === "light";
  const labels = LABELS[language] || LABELS.fr;
  const label = isLight ? labels.toDark : labels.toLight;

  const palette: React.CSSProperties =
    variant === "home"
      ? { background: "var(--hp-chip-bg)", color: "var(--hp-text)", border: "1px solid rgba(168, 85, 247, 0.25)" }
      : { background: "var(--theme-surface)", color: "var(--theme-text)", border: "1px solid var(--theme-border)" };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setTheme(isLight ? "dark" : "light");
      }}
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 2px 10px rgba(17,24,39,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        ...palette,
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {isLight ? (
        // Lune : on est en thème clair, un clic passe au sombre
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Soleil : on est en thème sombre, un clic passe au clair
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
