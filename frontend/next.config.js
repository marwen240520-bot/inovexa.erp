// ============================================================
//  next.config.js — Inovexa ERP v2.0.0 (FIXED CSP)
// ============================================================

'use strict';

const crypto = require('crypto');

const IS_DEV  = process.env.NODE_ENV === 'development';
const IS_PROD = process.env.NODE_ENV === 'production';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-inovexa.ngrok.app';

const API_HOST = (() => {
  try { return new URL(API_URL).host; }
  catch { return 'localhost:3001'; }
})();

const API_PROTOCOL = (() => {
  try { return new URL(API_URL).protocol; }
  catch { return 'http:'; }
})();

const API_WS = API_PROTOCOL === 'https:'
  ? `wss://${API_HOST}`
  : `ws://${API_HOST}`;

const API_ORIGIN = `${API_PROTOCOL}//${API_HOST}`;

// ============================================================
// CSP BUILDER (FIXED)
// ============================================================
function buildCSP() {
  return {
    'default-src': ["'self'"],

    // ✅ FIX: unsafe-eval ONLY in DEV
    'script-src': IS_DEV
      ? [
          "'self'",
          "'unsafe-eval'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
        ]
      : [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://cdnjs.cloudflare.com',
        ],

    'style-src': ["'self'", "'unsafe-inline'"],

    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://flagcdn.com',
      API_ORIGIN,
    ],

    'font-src': ["'self'", 'data:'],

    'connect-src': [
      "'self'",
      'data:',
      'blob:',
      API_ORIGIN,
      API_WS,
    ],

    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],

    ...(IS_PROD ? { 'upgrade-insecure-requests': [] } : {}),
  };
}

// Convert CSP object → string
function formatCSP(directives) {
  return Object.entries(directives)
    .map(([key, values]) =>
      values.length ? `${key} ${values.join(' ')}` : key
    )
    .join('; ');
}

// ============================================================
// SECURITY HEADERS
// ============================================================
const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: formatCSP(buildCSP()) },

  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },

  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },

  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },

  ...(IS_PROD
    ? [{
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      }]
    : []),
];

// ============================================================
// NEXT CONFIG
// ============================================================
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
  generateEtags: true,
  staticPageGenerationTimeout: 120,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // ENV
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
    NEXT_PUBLIC_APP_NAME: 'Inovexa ERP',
    NEXT_PUBLIC_APP_VERSION: '2.0.0',
    NEXT_PUBLIC_APP_DESCRIPTION: 'ERP sécurisé nouvelle génération',
  },

  // IMAGES (FIXED CSP)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
    minimumCacheTTL: IS_PROD ? 3600 : 60,

    dangerouslyAllowSVG: true,

    contentSecurityPolicy:
      "default-src 'self'; img-src 'self' data: blob: https:; script-src 'none';",

    remotePatterns: [
      {
        protocol: API_PROTOCOL.replace(':', ''),
        hostname: API_HOST.split(':')[0],
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },

  // WEBPACK
  webpack(config, { isServer, dev }) {
    config.module.exprContextCritical = false;

    // FIX: no eval in production
    config.devtool = dev
      ? 'eval-cheap-module-source-map'
      : false;

    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        crypto: false,
      };
    }

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }

    return config;
  },

  // HEADERS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },

      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;