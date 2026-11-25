import { createPublicKey, verify as verifySignature, KeyObject } from 'crypto';

/**
 * Vérification d'un jeton d'identité Google (« Sign in with Google », Google Identity Services).
 *
 * Le navigateur reçoit de Google un jeton signé (JWT RS256) et l'envoie à l'API. On ne lui fait PAS confiance tel quel :
 *  1. la signature est vérifiée avec les clés publiques de Google (https://www.googleapis.com/oauth2/v3/certs) ;
 *  2. `aud` doit être NOTRE identifiant client (GOOGLE_CLIENT_ID) — un jeton émis pour un autre site est refusé ;
 *  3. `iss` doit être Google, et le jeton ne doit pas être expiré.
 * Aucun secret client n'est nécessaire pour ce flux, et aucune clé n'est écrite dans le code.
 */

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const LEEWAY_SECONDS = 60;

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
}

interface KeyCache { expiresAt: number; keys: Map<string, KeyObject> }
let cache: KeyCache | null = null;

/** Point d'injection pour les tests : remplace le téléchargement des clés de Google. */
export const googleVerifierDeps = {
  async fetchKeys(): Promise<{ keys: Map<string, KeyObject>; maxAgeSeconds: number }> {
    const res = await fetch(CERTS_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Clés Google indisponibles (HTTP ${res.status})`);
    const body = (await res.json()) as { keys?: Array<Record<string, any>> };
    const keys = new Map<string, KeyObject>();
    for (const jwk of body.keys || []) {
      if (jwk.kty !== 'RSA' || !jwk.kid) continue;
      keys.set(String(jwk.kid), createPublicKey({ key: jwk as any, format: 'jwk' }));
    }
    const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') || '');
    return { keys, maxAgeSeconds: maxAge ? Number(maxAge[1]) : 3600 };
  },
};

async function keyFor(kid: string): Promise<KeyObject> {
  if (!cache || cache.expiresAt < Date.now() || !cache.keys.has(kid)) {
    const { keys, maxAgeSeconds } = await googleVerifierDeps.fetchKeys();
    cache = { keys, expiresAt: Date.now() + Math.min(Math.max(maxAgeSeconds, 60), 86_400) * 1000 };
  }
  const key = cache.keys.get(kid);
  if (!key) throw new Error('Clé de signature Google inconnue');
  return key;
}

/** Vide le cache des clés (tests). */
export function resetGoogleKeyCache() {
  cache = null;
}

const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

export async function verifyGoogleIdToken(idToken: string, clientId: string, now = new Date()): Promise<GoogleIdentity> {
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID manquant');
  if (typeof idToken !== 'string' || idToken.length > 4096) throw new Error('Jeton absent ou trop long');
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Jeton mal formé');
  let header: any, payload: any;
  try {
    header = decode(parts[0]);
    payload = decode(parts[1]);
  } catch {
    throw new Error('Jeton illisible');
  }
  // L'algorithme est imposé : jamais celui annoncé par le jeton s'il diffère (pas de « none », pas de HS256).
  if (header?.alg !== 'RS256' || typeof header?.kid !== 'string') throw new Error('Algorithme de signature refusé');
  const key = await keyFor(header.kid);
  const ok = verifySignature('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], 'base64url'));
  if (!ok) throw new Error('Signature invalide');

  const seconds = Math.floor(now.getTime() / 1000);
  if (!ISSUERS.includes(payload?.iss)) throw new Error('Émetteur inattendu');
  if (payload?.aud !== clientId) throw new Error('Jeton émis pour une autre application');
  if (typeof payload?.exp !== 'number' || payload.exp + LEEWAY_SECONDS < seconds) throw new Error('Jeton expiré');
  if (typeof payload?.iat === 'number' && payload.iat - LEEWAY_SECONDS > seconds) throw new Error('Jeton émis dans le futur');
  if (typeof payload?.sub !== 'string' || !payload.sub || typeof payload?.email !== 'string' || !payload.email) throw new Error('Identité incomplète');

  return {
    sub: payload.sub,
    email: String(payload.email).trim().toLowerCase(),
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: String(payload.name || payload.given_name || payload.email.split('@')[0]).slice(0, 120),
    picture: typeof payload.picture === 'string' ? payload.picture : null,
  };
}
