// ============================================================
//  middleware.ts — Inovexa ERP
//  CSP stricte basée sur nonce (générée à chaque requête).
//  À placer dans frontend/ (même niveau que app/).
//  ⚠️ La CSP statique de next.config.js doit être supprimée
//     pour éviter deux headers CSP contradictoires.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const IS_DEV = process.env.NODE_ENV === 'development';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-inovexa.ngrok.app';

function apiOrigins(): { origin: string; ws: string } {
  try {
    const u = new URL(API_URL);
    const ws = u.protocol === 'https:' ? `wss://${u.host}` : `ws://${u.host}`;
    return { origin: `${u.protocol}//${u.host}`, ws };
  } catch {
    return { origin: 'http://localhost:3001', ws: 'ws://localhost:3001' };
  }
}

export function middleware(request: NextRequest) {
  // Nonce unique par requête
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const { origin: API_ORIGIN, ws: API_WS } = apiOrigins();

  // Échappatoire conservée : CSP_ALLOW_EVAL=1 si une lib exige eval()
  const ALLOW_EVAL = process.env.CSP_ALLOW_EVAL === '1';

  // En dev : politique relâchée (HMR / Fast Refresh de Next exigent
  // inline + eval). En prod : nonce + strict-dynamic, zéro unsafe-inline.
  const scriptSrc = IS_DEV
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    : [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        ...(ALLOW_EVAL ? ["'unsafe-eval'"] : []),
      ];

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,

    // 'unsafe-inline' reste nécessaire ici : le code utilise massivement
    // style={{ ... }} et <style dangerouslySetInnerHTML>. Pénalité
    // Observatory limitée à -5 (contre -20 pour script-src).
    'style-src': ["'self'", "'unsafe-inline'"],

    'img-src': ["'self'", 'data:', 'blob:', 'https://flagcdn.com', API_ORIGIN],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'data:',
      'blob:',
      API_ORIGIN,
      API_WS,
      ...(IS_DEV ? ['ws:'] : []), // websocket HMR en dev
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    ...(IS_DEV ? {} : { 'upgrade-insecure-requests': [] }),
  };

  const csp = Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(' ')}` : k))
    .join('; ');

  // 1) Header sur la REQUÊTE : Next.js (App Router) le détecte et
  //    ajoute automatiquement le nonce à tous les <script> qu'il génère.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 2) Header sur la RÉPONSE : celui que le navigateur applique réellement.
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      // Exclut les assets statiques et les prefetchs (inutile d'y
      // appliquer une CSP, et cela préserve le cache).
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
