// ============================================================
//  next.config.js — Inovexa ERP v2.0.0
//  Production-grade Next.js configuration
//  Last updated: 2025
// ============================================================

'use strict';

const crypto = require('crypto');

// ─────────────────────────────────────────────
//  Environment helpers
// ─────────────────────────────────────────────
const IS_DEV       = process.env.NODE_ENV === 'development';
const IS_PROD      = process.env.NODE_ENV === 'production';
const API_URL      = process.env.NEXT_PUBLIC_API_URL || 'https://api-inovexa.ngrok.app';
const API_HOST     = (() => { try { return new URL(API_URL).host; }     catch { return 'localhost:3001'; } })();
const API_PROTOCOL = (() => { try { return new URL(API_URL).protocol; } catch { return 'http:'; } })();
const API_WS       = API_PROTOCOL === 'https:' ? `wss://${API_HOST}` : `ws://${API_HOST}`;
const API_ORIGIN   = `${API_PROTOCOL}//${API_HOST}`;

// ─────────────────────────────────────────────
//  Content Security Policy builder
// ─────────────────────────────────────────────
function buildCSP() {
  const directives = {
    'default-src': ["'self'"],

    // 'unsafe-eval' is allowed in BOTH environments on purpose:
    //   - dev  : required by Next.js HMR / Fast Refresh
    //   - prod : some lazy-loaded vendor chunks (charting / animation libs)
    //            evaluate code at runtime; without this they throw the
    //            "CSP blocks the use of 'eval'" error you are seeing.
    // To harden later: open DevTools on the live site, expand the eval
    // error's call stack to find the offending library, replace it, then
    // remove "'unsafe-eval'" from the production list below.
    'script-src': [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],

    'style-src':   ["'self'", "'unsafe-inline'"],
    'img-src':     ["'self'", 'data:', 'blob:', 'https://flagcdn.com', API_ORIGIN],
    'font-src':    ["'self'", 'data:'],
    'connect-src': ["'self'", 'data:', 'blob:', API_ORIGIN, API_WS],
    'media-src':   ["'self'"],
    'object-src':  ["'none'"],
    'frame-src':   ["'self'"],
    'worker-src':  ["'self'", 'blob:'],
    'base-uri':    ["'self'"],
    'form-action': ["'self'"],

    // Force HTTPS for all sub-resources in production
    ...(IS_PROD ? { 'upgrade-insecure-requests': [] } : {}),
  };

  return Object.entries(directives)
    .map(([key, vals]) => (vals.length ? `${key} ${vals.join(' ')}` : key))
    .join('; ');
}

// ─────────────────────────────────────────────
//  Security headers (applied to every route)
// ─────────────────────────────────────────────
const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: buildCSP() },
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection',        value: '1; mode=block' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  {
    key:   'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // HSTS — production only (2 years, include subdomains)
  ...(IS_PROD
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

// ─────────────────────────────────────────────
//  Next.js config
// ─────────────────────────────────────────────
/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Core ──────────────────────────────────────────────────
  reactStrictMode:             true,
  compress:                    true,
  output:                      'standalone',
  generateEtags:               true,
  staticPageGenerationTimeout: 120,
  pageExtensions:              ['tsx', 'ts', 'jsx', 'js'],
  transpilePackages:           [],

  // ── Public env variables ──────────────────────────────────
  env: {
    NEXT_PUBLIC_API_URL:         API_URL,
    NEXT_PUBLIC_APP_NAME:        'Inovexa ERP',
    NEXT_PUBLIC_APP_VERSION:     '2.0.0',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Solution ERP nouvelle génération',
  },

  // ── Image optimisation ────────────────────────────────────
  images: {
    formats:          ['image/avif', 'image/webp'],
    deviceSizes:      [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes:       [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL:  IS_PROD ? 3600 : 60,
    dangerouslyAllowSVG:   true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Dynamic: backend API (reads from NEXT_PUBLIC_API_URL)
      {
        protocol: /** @type {any} */ (API_PROTOCOL.replace(':', '')),
        hostname: API_HOST.split(':')[0],
        ...(API_HOST.includes(':') ? { port: API_HOST.split(':')[1] } : {}),
        pathname: '/uploads/**',
      },
      // Local dev frontend
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
      // Country flags CDN
      { protocol: 'https', hostname: 'flagcdn.com', pathname: '/**' },
    ],
  },

  // ── Webpack ───────────────────────────────────────────────
  webpack(config, { isServer, dev }) {
    // Suppress dynamic-require critical warnings (e.g. chart.js internals)
    config.module = { ...config.module, exprContextCritical: false };

    // Source maps:
    //   production  → disabled (no eval, smallest output)
    //   development → cheap-module-source-map (no eval, fast rebuilds)
    config.devtool = dev ? 'cheap-module-source-map' : false;

    // Node.js built-in polyfills for the browser bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:     false,
        net:    false,
        tls:    false,
        path:   false,
        os:     false,
        crypto: false,
      };
    }

    // Production client-side bundle splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic', // stable hashes across builds
        chunkIds:  'deterministic',
        splitChunks: {
          chunks:             'all',
          maxInitialRequests: 25,
          minSize:            20_000,
          cacheGroups: {
            // Disable webpack defaults
            default:  false,
            vendors:  false,

            // React core — highest priority, cached longest
            framework: {
              chunks:   'all',
              name:     'framework',
              test:     /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              priority: 40,
              enforce:  true,
            },

            // Chart.js — large, isolated chunk (lazy-loaded per page)
            chartjs: {
              test:               /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
              name:               'vendor-chartjs',
              priority:           35,
              reuseExistingChunk: true,
            },

            // Other large vendors (> 160 kB) — content-hashed names
            lib: {
              test(module) {
                return (
                  module.size() > 160_000 &&
                  /node_modules[/\\]/.test(module.identifier())
                );
              },
              name(module) {
                const hash = crypto
                  .createHash('sha1')
                  .update(module.identifier())
                  .digest('hex')
                  .substring(0, 8);
                return `vendor-${hash}`;
              },
              priority:           30,
              minChunks:          1,
              reuseExistingChunk: true,
            },

            // Shared application code (used by ≥ 2 pages)
            commons: {
              name:      'commons',
              minChunks: 2,
              priority:  20,
            },
          },
        },
      };
    }

    return config;
  },

  // ── HTTP headers ──────────────────────────────────────────
  async headers() {
    return [
      // Security headers on every route
      {
        source:  '/:path*',
        headers: SECURITY_HEADERS,
      },

      // Static assets — immutable, 1 year
      {
        source:  '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // Public images / fonts — 30 days with SWR
      {
        source:  '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },

      // PWA manifest — 1 day
      {
        source:  '/manifest.json',
        headers: [
          { key: 'Content-Type',  value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },

      // Service worker — never cache
      {
        source:  '/sw.js',
        headers: [
          { key: 'Content-Type',  value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
        ],
      },

      // API routes — no caching
      {
        source:  '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },

  // ── Redirects (add permanent redirects here) ─────────────
  async redirects() {
    return [
      // Example: enforce HTTPS (if not handled by reverse proxy / CDN)
      // {
      //   source:      '/:path*',
      //   has:         [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
      //   destination: 'https://yourdomain.com/:path*',
      //   permanent:   true,
      // },
    ];
  },
};

module.exports = nextConfig;