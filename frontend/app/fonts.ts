import localFont from "next/font/local";
import { Inter, JetBrains_Mono } from "next/font/google";

/* ──────────────────────────────────────────────────────────────────────────────
 * fonts.ts — point unique de configuration des polices Inovexa ERP
 *
 * --font-ui    : police de l'interface (textes, tableaux, formulaires)
 * --font-num   : police monospace (n° de facture, références, SKU, codes)
 * --font-brand : police du logo / nom de marque (Orbitron, inchangée)
 *
 * Pour changer de combo, remplace seulement l'import et la constante `ui`
 * (ex. Plus_Jakarta_Sans, Manrope, IBM_Plex_Sans) en gardant variable: "--font-ui".
 * next/font auto-héberge les fichiers : aucun appel à Google Fonts côté client,
 * donc compatible avec la CSP/nonce existante.
 * ────────────────────────────────────────────────────────────────────────────── */

export const ui = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ui",
});

export const num = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-num",
});

export const brand = localFont({
  src: [
    { path: "./fonts/orbitron-bold.woff2",      weight: "700", style: "normal" },
    { path: "./fonts/orbitron-extrabold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/orbitron-black.woff2",     weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-orbitron",
});

export const fontVariables = `${ui.variable} ${num.variable} ${brand.variable}`;
