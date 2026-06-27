// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "Inovexa-ERP",
  description: "Gestion complète pour votre entreprise",
  icons: {
    icon: "/logo.png",
  },
};

// Indispensable pour un rendu mobile correct (sans ça, les pages s'affichent
// en largeur desktop dézoomée sur téléphone). Géré nativement par Next.js
// via l'export `viewport` plutôt qu'une balise <meta> manuelle.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {/* Lien d'évitement : accessible au clavier (Tab), masqué sinon */}
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
