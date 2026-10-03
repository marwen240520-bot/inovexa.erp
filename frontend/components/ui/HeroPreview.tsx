"use client";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const TEXTS: Record<string, { title: string; caption: string; alt: string }> = {
  fr: { title: "Pilotez votre activité en un coup d'œil", caption: "Aperçu du tableau de bord · données de démonstration", alt: "Aperçu du tableau de bord Inovexa" },
  en: { title: "Run your business at a glance", caption: "Dashboard preview · demo data", alt: "Inovexa dashboard preview" },
  es: { title: "Dirija su negocio de un vistazo", caption: "Vista previa del panel · datos de demostración", alt: "Vista previa del panel de Inovexa" },
};

/**
 * Partie droite de l'accueil et du login : titre, capture du tableau de bord, légende.
 * Volontairement statique : aucune animation, ombre, lueur, filtre ni rotation sur l'image.
 */
export default function HeroPreview({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const t = TEXTS[language] || TEXTS.fr;
  return (
    <figure style={{ margin: 0, width: "100%", maxWidth: "940px", display: "flex", flexDirection: "column", alignItems: "stretch", gap: compact ? "12px" : "clamp(12px, 2.4vh, 20px)" }}>
      <h2 style={{ margin: 0, color: "var(--theme-text)", fontSize: compact ? "20px" : "clamp(20px, 3.2vh, 30px)", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2, textAlign: "center" }}>
        {t.title}
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/1.png"
        alt={t.alt}
        width={1920}
        height={1080}
        style={{ width: "100%", height: "auto", display: "block", background: "#ffffff", border: "1px solid rgba(139, 92, 246, 0.35)", borderRadius: "16px" }}
      />
      <figcaption style={{ color: "var(--theme-text-secondary)", fontSize: "12.5px", textAlign: "center" }}>{t.caption}</figcaption>
    </figure>
  );
}
