/**
 * next.config.js — Correctif CSP "blocks the use of 'eval'"
 * -----------------------------------------------------------
 * L'erreur ne vient PAS des pages du dashboard (aucune n'utilise eval / new Function /
 * setTimeout(string)). Elle vient de Webpack en mode développement, qui génère ses
 * source-maps avec eval(). Une CSP `script-src` sans 'unsafe-eval' bloque ça.
 *
 * Solution : autoriser 'unsafe-eval' UNIQUEMENT en développement.
 * En production, la CSP reste stricte (Webpack n'utilise plus eval).
 *
 * NOTE : si tu as DÉJÀ une CSP ailleurs (un autre next.config.js, un middleware.ts,
 * ou une balise <meta http-equiv="Content-Security-Policy">), c'est CELLE-LÀ qu'il
 * faut corriger — fusionne la valeur ci-dessous, ne crée pas une seconde CSP en double.
 */

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' seulement en dev (Webpack HMR / source-maps)
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // styles inline React + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .join("; ")
  .concat(";");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
