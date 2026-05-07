import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inovexa ERP - Solution de gestion d'entreprise",
  description: "ERP complet pour la gestion des produits, ventes, achats, clients et plus encore",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inovexa ERP",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Inovexa ERP" />
        <meta name="application-name" content="Inovexa ERP" />
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="ERP, gestion, entreprise, produits, ventes, achats, clients" />
        <meta name="author" content="Inovexa" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Inovexa ERP - Solution de gestion d'entreprise" />
        <meta property="og:description" content="ERP complet pour la gestion des produits, ventes, achats, clients et plus encore" />
        <meta property="og:image" content="/logo.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Inovexa ERP" />
        <meta name="twitter:description" content="Solution ERP nouvelle génération" />
        <meta name="twitter:image" content="/logo.png" />
        
        {/* Links */}
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload des assets critiques */}
        <link rel="preload" href="/logo.png" as="image" />
      </head>
      <body 
        className={inter.className} 
        style={{ 
          overflowX: "hidden", 
          width: "100%", 
          margin: 0, 
          padding: 0,
          minHeight: "100vh",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale"
        }}
      >
        {/* ⭐ ThemeProvider DOIT ÊTRE LE PLUS EXTERNE */}
        <ThemeProvider>
          <LanguageProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}