"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTheme, THEMES, THEME_ORDER } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface ThemeSwitcherProps {
  /**
   * "sidebar" : ligne de menu qui déplie la liste des thèmes (barre latérale, desktop et mobile)
   * "icon"    : bouton rond avec une fenêtre flottante (page d'accueil)
   */
  variant?: "sidebar" | "icon";
  size?: number;
}

const TITLE: Record<string, string> = { fr: "Thème", en: "Theme", es: "Tema" };

const themeName = (t: any, lang: string): string =>
  lang === "en" ? t.nameEn || t.name : lang === "es" ? t.nameEs || t.name : t.name;

const PaletteIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="13.5" cy="6.5" r="1.2" />
    <circle cx="17.5" cy="10.5" r="1.2" />
    <circle cx="8.5" cy="7.5" r="1.2" />
    <circle cx="6.5" cy="12.5" r="1.2" />
    <path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a5 5 0 0 0 5-5c0-4.9-4.5-8.4-10-8.4z" />
  </svg>
);

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** Pastille : moitié couleur de fond du thème, moitié couleur principale */
const Swatch = ({ theme, size = 26 }: { theme: any; size?: number }) => (
  <span
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      display: "inline-block",
      background: `linear-gradient(135deg, ${theme.background} 0 50%, ${theme.primary} 50% 100%)`,
      border: "1.5px solid rgba(120,120,120,0.45)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
    }}
  />
);

export default function ThemeSwitcher({ variant = "sidebar", size = 38 }: ThemeSwitcherProps) {
  const { themeId, setTheme } = useTheme();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = THEMES[themeId] || THEMES.light;
  const title = TITLE[language] || TITLE.fr;

  // Fermeture : clic en dehors (variante flottante) et touche Échap
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (variant === "icon" && rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, variant]);

  const choose = (id: string) => {
    setTheme(id);
    if (variant === "icon") setOpen(false);
  };

  const list = (columns: number) => (
    <div
      role="listbox"
      aria-label={title}
      style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}
    >
      {THEME_ORDER.filter((id) => THEMES[id]).map((id) => {
        const t = THEMES[id];
        const selected = id === themeId;
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => choose(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 10,
              cursor: "pointer",
              textAlign: "left",
              fontSize: 12.5,
              fontWeight: selected ? 700 : 500,
              minHeight: 44,
              color: variant === "icon" ? "var(--hp-text, var(--theme-text))" : "var(--theme-nav-text, var(--theme-text))",
              background: selected ? "rgba(99,102,241,0.14)" : "transparent",
              border: `1.5px solid ${selected ? "var(--theme-primary, #6366f1)" : "rgba(120,120,120,0.28)"}`,
            }}
          >
            <Swatch theme={t} size={22} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{themeName(t, language)}</span>
            {selected && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );

  // ───────── Variante barre latérale ─────────
  if (variant === "sidebar") {
    return (
      <div ref={rootRef} style={{ width: "100%" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px 9px 14px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13.2,
            color: "var(--theme-nav-text, var(--theme-text))",
            background: open ? "var(--theme-surface-hover)" : "transparent",
            border: "1px solid var(--theme-border)",
            transition: "background 0.2s",
          }}
        >
          <span style={{ display: "flex", flexShrink: 0 }}><PaletteIcon /></span>
          <span style={{ fontWeight: 500 }}>{title}</span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: 0.85 }}>
            <Swatch theme={current} size={16} />
            {themeName(current, language)}
          </span>
          <Chevron open={open} />
        </button>
        {open && <div style={{ marginTop: 8 }}>{list(2)}</div>}
      </div>
    );
  }

  // ───────── Variante bouton rond (page d'accueil) ─────────
  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-label={title}
        aria-expanded={open}
        title={`${title} : ${themeName(current, language)}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          background: "var(--hp-chip-bg, var(--theme-surface))",
          color: "var(--hp-text, var(--theme-text))",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 2px 10px rgba(17,24,39,0.08)",
        }}
      >
        <PaletteIcon size={Math.round(size * 0.48)} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 250,
            maxWidth: "calc(100vw - 24px)",
            padding: 10,
            borderRadius: 14,
            background: "var(--hp-menu-bg, var(--theme-surface))",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            boxShadow: "0 20px 40px var(--hp-shadow, rgba(17,24,39,0.2))",
            zIndex: 300,
          }}
        >
          {list(1)}
        </div>
      )}
    </div>
  );
}
