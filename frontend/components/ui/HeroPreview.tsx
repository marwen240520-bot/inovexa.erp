"use client";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ALT: Record<string, string> = {
  fr: "Aperçu du tableau de bord Inovexa",
  en: "Inovexa dashboard preview",
  es: "Vista previa del panel de Inovexa",
};

/**
 * Partie droite de l'accueil et du login : la capture du tableau de bord, seule.
 * Volontairement statique : aucune animation, ombre, lueur, filtre ni rotation sur l'image.
 */
export default function HeroPreview() {
  const { language } = useLanguage();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/1.png"
      alt={ALT[language] || ALT.fr}
      width={1920}
      height={1080}
      style={{ width: "100%", maxWidth: "940px", height: "auto", display: "block", background: "#ffffff", border: "1px solid rgba(139, 92, 246, 0.35)", borderRadius: "16px" }}
    />
  );
}
