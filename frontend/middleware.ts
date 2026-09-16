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

export function middleware(request: NextRequest) {
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

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    'script-src': scriptSrc,

    'style-src': [
      "'self'",
      "'unsafe-inline'",
    ],

    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://flagcdn.com',
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