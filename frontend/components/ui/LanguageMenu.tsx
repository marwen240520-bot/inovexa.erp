"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type Lang } from "@/lib/i18n";

export type LangCode = Lang;

const LANGS: Array<{ code: LangCode; label: string }> = SUPPORTED_LANGUAGES.map((code) => ({ code, label: LANGUAGE_NAMES[code] }));

/** Drapeaux dessinés en SVG : toujours affichés (aucune image externe à charger). */
export function Flag({ code, width = 20 }: { code: LangCode; width?: number }) {
  const height = Math.round((width * 2) / 3);
  const common = { width, height, viewBox: "0 0 30 20", style: { borderRadius: "3px", display: "block", flexShrink: 0 }, "aria-hidden": true as const };
  if (code === "fr") {
    return (
      <svg {...common}>
        <rect width="10" height="20" fill="#0055A4" />
        <rect x="10" width="10" height="20" fill="#FFFFFF" />
        <rect x="20" width="10" height="20" fill="#EF4135" />
      </svg>
    );
  }
  if (code === "es") {
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#AA151B" />
        <rect y="5" width="30" height="10" fill="#F1BF00" />
      </svg>
    );
  }
  if (code === "ar") {
    // Arabe : drapeau tunisien (disque blanc, croissant et étoile rouges)
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#E70013" />
        <circle cx="15" cy="10" r="5" fill="#FFFFFF" />
        <circle cx="15" cy="10" r="3.75" fill="#E70013" />
        <circle cx="16" cy="10" r="3" fill="#FFFFFF" />
        <polygon fill="#E70013" points="14.3,10 15.89,9.48 15.89,7.81 16.87,9.16 18.46,8.65 17.48,10 18.46,11.35 16.87,10.84 15.89,12.19 15.89,10.52" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <clipPath id="uk-clip"><rect width="30" height="20" /></clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="30" height="20" fill="#012169" />
        <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="4" />
        <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.6" />
        <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.4" />
      </g>
    </svg>
  );
}

/** Menu de langues avec drapeaux (FR / EN / ES / AR), même présentation que sur la page d'accueil. */
export default function LanguageMenu() {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = (LANGS.find((l) => l.code === language) || LANGS[0]).code;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        style={{ height: "38px", display: "flex", alignItems: "center", gap: "8px", padding: "0 14px", borderRadius: "36px", cursor: "pointer", fontSize: "11px", color: "var(--theme-text)", background: "var(--theme-surface)", border: "1px solid rgba(168, 85, 247, 0.25)" }}
      >
        <Flag code={current} width={18} />
        <span style={{ fontWeight: 700, letterSpacing: "0.5px" }}>{current.toUpperCase()}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "none" }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div role="listbox" style={{ position: "absolute", top: "46px", insetInlineEnd: 0, minWidth: "140px", padding: "6px", display: "flex", flexDirection: "column", borderRadius: "14px", background: "var(--theme-surface)", border: "1px solid rgba(168, 85, 247, 0.3)", boxShadow: "0 20px 40px rgba(17, 24, 39, 0.18)", zIndex: 300 }}>
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              role="option"
              lang={code}
              aria-selected={code === current}
              onClick={() => { changeLanguage(code); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "9px", border: "none", cursor: "pointer", textAlign: "start", fontSize: "12.5px", fontWeight: code === current ? 700 : 400, color: code === current ? "#A855F7" : "var(--theme-text)", background: code === current ? "rgba(168, 85, 247, 0.16)" : "transparent" }}
            >
              <Flag code={code} width={18} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
