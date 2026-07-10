// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// @ts-ignore
import "./globals.css";

// viewportFit: "cover" est indispensable pour que env(safe-area-inset-*)
// fonctionne sur iPhone (encoche / Dynamic Island).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Inovexa-ERP ",
  description: "Gestion complète pour votre entreprise",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ⚠️ CSP nonce — NE PAS SUPPRIMER.
  // Lire les headers force le rendu dynamique de toutes les routes :
  // Next.js injecte alors le nonce (posé par middleware.ts dans le
  // header Content-Security-Policy) sur chacun de ses <script>.
  // Sans cette ligne, les pages statiques prérendues seraient servies
  // sans nonce et TOUS leurs scripts seraient bloqués par la CSP.
  headers().get("x-nonce");

  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
