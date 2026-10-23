// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import localFont from "next/font/local";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import AppBoot from "@/components/AppBoot";
import { LANG_COOKIE, deepMerge, pickLanguage, type Lang } from "@/lib/i18n";
import { THEMES, THEME_COOKIE, normalizeThemeId, themeCssVars } from "@/lib/themes";

// --- Polices auto-hebergees (aucune requete reseau au build) ---
const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-Regular.woff2",   weight: "400", style: "normal" },
    { path: "./fonts/Poppins-Medium.woff2",    weight: "500", style: "normal" },
    { path: "./fonts/Poppins-SemiBold.woff2",  weight: "600", style: "normal" },
    { path: "./fonts/Poppins-Bold.woff2",      weight: "700", style: "normal" },
    { path: "./fonts/Poppins-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-poppins",
});

const orbitron = localFont({
  src: [
    { path: "./fonts/Orbitron-Bold.woff2",      weight: "700", style: "normal" },
    { path: "./fonts/Orbitron-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/Orbitron-Black.woff2",     weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-orbitron",
});

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f4f6",
};

export const metadata: Metadata = {
  title: "Inovexa-ERP ",
  description: "Gestion complete pour votre entreprise",
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = headers();
  h.get("x-nonce");

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
      className={`${poppins.variable} ${orbitron.variable}`}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/logo.png" />
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
