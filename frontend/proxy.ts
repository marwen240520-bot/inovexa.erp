import { NextRequest, NextResponse } from 'next/server';

const IS_DEV = process.env.NODE_ENV === 'development';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://inovexa-erp-4.onrender.com';

function apiOrigins(): { origin: string; ws: string } {
  try {
    const u = new URL(API_URL);

    let ws: string;

    if (u.protocol === 'https:') {
      ws = 'wss://' + u.host;
    } else {
      ws = 'ws://' + u.host;
    }

    return {
      origin: u.protocol + '//' + u.host,
      ws,
    };
  } catch {
    return {
      origin: 'http://localhost:3001',
      ws: 'ws://localhost:3001',
    };
  }
}

// Next.js 16 : l'ancien middleware.ts s'appelle désormais proxy.ts (exécuté par Node.js).
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(
    crypto.randomUUID()
  ).toString('base64');

  const {
    origin: API_ORIGIN,
    ws: API_WS,
  } = apiOrigins();

  const ALLOW_EVAL =
    process.env.CSP_ALLOW_EVAL === '1';

  let scriptSrc: string[];

  if (IS_DEV) {
    scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
    ];
  } else {
    scriptSrc = [
      "'self'",
      "'nonce-" + nonce + "'",
      "'strict-dynamic'",
    ];

    if (ALLOW_EVAL) {
      scriptSrc.push("'unsafe-eval'");
    }
  }

  // « Continuer avec Google » (Google Identity Services) : script, cadre du bouton et feuille de style servis par Google.
  // Sans GOOGLE_CLIENT_ID côté API, le bouton n'est pas affiché et rien n'est chargé depuis Google.
  const GOOGLE_GSI = 'https://accounts.google.com/gsi/';
  scriptSrc.push(GOOGLE_GSI + 'client');

  // « Continuer avec Apple » (Sign in with Apple JS) : script servi par Apple, fenêtre d'autorisation sur appleid.apple.com.
  // Sans APPLE_CLIENT_ID côté API, le bouton n'est pas affiché et rien n'est chargé depuis Apple.
  const APPLE_SCRIPTS = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/';
  const APPLE_ID = 'https://appleid.apple.com';
  scriptSrc.push(APPLE_SCRIPTS);

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    'script-src': scriptSrc,

    'style-src': [
      "'self'",
      "'unsafe-inline'",
      GOOGLE_GSI + 'style',
    ],

    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://flagcdn.com',
      // Photos des produits de démonstration (liens Unsplash, voir backend/src/modules/admin/demo-product-images.ts)
      'https://images.unsplash.com',
      API_ORIGIN,
    ],

    'font-src': [
      "'self'",
      'data:',
    ],

    'connect-src': [
      "'self'",
      'data:',
      'blob:',
      API_ORIGIN,
      API_WS,
      GOOGLE_GSI,
      APPLE_ID,
    ],

    'media-src': ["'self'"],

    'object-src': ["'none'"],

    'frame-src': ["'self'", GOOGLE_GSI, APPLE_ID],

    'frame-ancestors': ["'self'"],

    'worker-src': [
      "'self'",
      'blob:',
    ],

    'base-uri': ["'self'"],

    'form-action': ["'self'"],

    // Relevé des violations (fichier + ligne responsables) : voir app/api/csp-report/route.ts
    'report-uri': ['/api/csp-report'],
  };

  if (IS_DEV) {
    directives['connect-src'].push('ws:');
  } else {
    directives['upgrade-insecure-requests'] = [];
  }

  const csp = Object.entries(directives)
    .map(([key, values]) => {
      if (values.length > 0) {
        return key + ' ' + values.join(' ');
      }

      return key;
    })
    .join('; ');

  const requestHeaders = new Headers(
    request.headers
  );

  requestHeaders.set(
    'x-nonce',
    nonce
  );

  requestHeaders.set(
    'Content-Security-Policy',
    csp
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(
    'Content-Security-Policy',
    csp
  );

  return response;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)',

      missing: [
        {
          type: 'header',
          key: 'next-router-prefetch',
        },
        {
          type: 'header',
          key: 'purpose',
          value: 'prefetch',
        },
      ],
    },
  ],
};