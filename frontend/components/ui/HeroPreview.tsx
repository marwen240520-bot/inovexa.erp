"use client";
import React from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const ALT: Record<string, string> = {
  fr: "Aperçu du tableau de bord Inovexa",
  en: "Inovexa dashboard preview",
  es: "Vista previa del panel de Inovexa",
};

/**
 * Partie droite de l'accueil et du login : la capture du tableau de bord, seule.
 * Volontairement statique : aucune animation, ombre, lueur, filtre ni rotation sur l'image.
 *
 * Servie par next/image : le navigateur reçoit une version AVIF/WebP à la bonne largeur
 * (≈ 40–90 Ko au lieu du PNG 1920 px de 188 Ko), préchargée car c'est le plus grand élément visible.
 */
export default function HeroPreview() {
  const { language } = useLanguage();
  return (
    <Image
      src="/images/1.png"
      alt={ALT[language] || ALT.fr}
      width={1920}
      height={1080}
      priority
      sizes="(max-width: 1024px) 100vw, min(940px, 50vw)"
      style={{ width: "100%", maxWidth: "940px", height: "auto", display: "block", background: "#ffffff", border: "1px solid rgba(139, 92, 246, 0.35)", borderRadius: "16px" }}
    />
  );
}
