// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import AppBoot from "@/components/AppBoot";
import { LANG_COOKIE, deepMerge, pickLanguage, type Lang } from "@/lib/i18n";
import { THEMES, THEME_COOKIE, normalizeThemeId, themeCssVars } from "@/lib/themes";

// Traductions lues côté serveur uniquement (elles ne vont pas dans le JavaScript du navigateur) :
// la langue courante est envoyée avec la page, déjà fusionnée avec l'anglais pour les clés manquantes.
import fr from "@/public/locales/fr.json";
import en from "@/public/locales/en.json";
import es from "@/public/locales/es.json";

// @ts-ignore
import "./globals.css";
import "./theme-remap.css";

const RAW_MESSAGES: Record<Lang, any> = { fr, en, es };
const MERGED_MESSAGES: Partial<Record<Lang, any>> = {};
function messagesFor(lang: Lang) {
  if (!MERGED_MESSAGES[lang]) {
    MERGED_MESSAGES[lang] = lang === "en" ? RAW_MESSAGES.en : deepMerge(RAW_MESSAGES.en, RAW_MESSAGES[lang]);
  }
  return MERGED_MESSAGES[lang];
}

const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "https://inovexa-erp-4.onrender.com").origin;
  } catch {
    return "";
  }
})();

// viewportFit: "cover" est indispensable pour que env(safe-area-inset-*)
// fonctionne sur iPhone (encoche / Dynamic Island).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f4f6",
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
  const h = headers();
  h.get("x-nonce");

  // Préférences connues du serveur → HTML déjà dans la bonne langue, le bon thème et la bonne mise en page
  const jar = cookies();
  const language = pickLanguage(jar.get(LANG_COOKIE)?.value, h.get("accept-language"));
  const themeId = normalizeThemeId(jar.get(THEME_COOKIE)?.value);
  const theme = THEMES[themeId];
  const ua = h.get("user-agent") || "";
  const isMobileHint = h.get("sec-ch-ua-mobile") === "?1" || /Mobi|Android.+Mobile|iPhone|iPod/i.test(ua);

  const htmlStyle = {
    ...themeCssVars(theme),
    colorScheme: theme.mode === "light" ? "light" : "dark",
  } as React.CSSProperties;

  return (
    <html
      lang={language}
      data-theme={themeId}
      data-mode={theme.mode === "light" ? "light" : "dark"}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/logo.png" />
        {/* Ouvre la connexion (DNS + TLS) vers l'API pendant que la page se charge */}
        {API_ORIGIN && <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />}
        {API_ORIGIN && <link rel="dns-prefetch" href={API_ORIGIN} />}
      </head>
      <body>
        <AppBoot />
        <DeviceProvider isMobileHint={isMobileHint}>
          <LanguageProvider initialLanguage={language} initialMessages={messagesFor(language)}>
            <ThemeProvider initialThemeId={themeId}>
              {children}
            </ThemeProvider>
          </LanguageProvider>
        </DeviceProvider>
      </body>
    </html>
  );
}
