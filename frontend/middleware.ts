```ts
// ============================================================
//  middleware.ts — Inovexa ERP
//  CSP stricte basée sur nonce (générée à chaque requête).
//  À placer dans frontend/ (même niveau que app/).
//
//  ⚠️ La CSP statique de next.config.js doit être supprimée
//     pour éviter deux headers CSP contradictoires.
//
//  Backend actuel:
//  https://inovexa-erp-4.onrender.com
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const IS_DEV = process.env.NODE_ENV === 'development';

// Backend API principal
// Vercel doit définir NEXT_PUBLIC_API_URL.
// Le fallback pointe vers le nouveau backend Render.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://inovexa-erp-4.onrender.com';

function apiOrigins(): { origin: string; ws: string } {
  try {
    const u = new URL(API_URL);

    const ws =
      u.protocol === 'https:'
        ? `wss://${u.host}`
        : `ws://${u.host}`;

    return {
      origin: `${u.protocol}//${u.host}`,
      ws,
    };
  } catch {
    return {
      origin: 'http://localhost:3001',
      ws: 'ws://localhost:3001',
    };
  }
}

export function middleware(request: NextRequest) {
  // ─────────────────────────────────────────────
  // Nonce unique par requête
  // ─────────────────────────────────────────────
  const nonce = Buffer.from(
    crypto.randomUUID()
  ).toString('base64');

  const {
    origin: API_ORIGIN,
    ws: API_WS,
  } = apiOrigins();

  // ─────────────────────────────────────────────
  // CSP_ALLOW_EVAL
  // ─────────────────────────────────────────────
  // Échappatoire conservée : CSP_ALLOW_EVAL=1
  // si une librairie exige eval().
  const ALLOW_EVAL =
    process.env.CSP_ALLOW_EVAL === '1';

  // ─────────────────────────────────────────────
  // Script policy
  // ─────────────────────────────────────────────
  // En dev :
  // Next.js HMR / Fast Refresh nécessite inline + eval.
  //
  // En production :
  // nonce + strict-dynamic.
  // unsafe-eval uniquement si CSP_ALLOW_EVAL=1.
  const scriptSrc = IS_DEV
    ? [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
      ]
    : [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        ...(ALLOW_EVAL
          ? ["'unsafe-eval'"]
          : []),
      ];

  // ─────────────────────────────────────────────
  // CSP directives
  // ─────────────────────────────────────────────
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    'script-src': scriptSrc,

    // Les styles inline sont conservés car
    // l'application utilise style={{ ... }} et
    // <style dangerouslySetInnerHTML>.
    'style-src': [
      "'self'",
      "'unsafe-inline'",
    ],

    // Images depuis le frontend, data/blob,
    // FlagCDN et backend Render.
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://flagcdn.com',
      API_ORIGIN,
    ],

    // Fonts
    'font-src': [
      "'self'",
      'data:',
    ],

    // IMPORTANT :
    // Autorise le frontend Vercel à communiquer
    // avec le nouveau backend Render.
    'connect-src': [
      "'self'",
      'data:',
      'blob:',
      API_ORIGIN,
      API_WS,
      ...(IS_DEV ? ['ws:'] : []),
    ],

    'media-src': ["'self'"],

    'object-src': ["'none'"],

    'frame-src': ["'self'"],

    'frame-ancestors': ["'self'"],

    'worker-src': [
      "'self'",
      'blob:',
    ],

    'base-uri': ["'self'"],

    'form-action': ["'self'"],

    ...(IS_DEV
      ? {}
      : {
          'upgrade-insecure-requests': [],
        }),
  };

  // ─────────────────────────────────────────────
  // Construction de la CSP
  // ─────────────────────────────────────────────
  const csp = Object.entries(directives)
    .map(([key, values]) =>
      values.length
        ? `${key} ${values.join(' ')}`
        : key
    )
    .join('; ');

  // ─────────────────────────────────────────────
  // Header sur la REQUÊTE
  // ─────────────────────────────────────────────
  // Next.js App Router peut détecter le nonce
  // et l'appliquer aux scripts générés.
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

  // ─────────────────────────────────────────────
  // Header sur la RÉPONSE
  // ─────────────────────────────────────────────
  // C'est celui que le navigateur applique.
  response.headers.set(
    'Content-Security-Policy',
    csp
  );

  return response;
}

export const config = {
  matcher: [
    {
      // Exclut les assets statiques et les prefetchs.
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
```
