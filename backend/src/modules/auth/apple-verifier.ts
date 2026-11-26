import { createPublicKey, verify as verifySignature, KeyObject } from 'crypto';

/**
 * Vérification d'un jeton d'identité Apple (« Se connecter avec Apple », Sign in with Apple JS).
 *
 * Même principe que pour Google (google-verifier.ts) : le navigateur reçoit d'Apple un jeton signé (JWT RS256) et
 * l'envoie à l'API, qui ne lui fait PAS confiance tel quel :
 *  1. la signature est vérifiée avec les clés publiques d'Apple (https://appleid.apple.com/auth/keys) ;
 *  2. `aud` doit être NOTRE identifiant de service (APPLE_CLIENT_ID) — un jeton émis pour un autre site est refusé ;
 *  3. `iss` doit être Apple, et le jeton ne doit pas être expiré.
 * Aucun secret n'est nécessaire pour ce flux, et aucune clé n'est écrite dans le code.
 *
 * Particularités d'Apple :
 *  - le NOM de la personne ne figure pas dans le jeton : le navigateur ne le reçoit qu'à la toute première
 *    autorisation, et le transmet à part (il ne sert qu'à l'affichage) ;
 *  - l'adresse peut être une adresse de relais privée (…@privaterelay.appleid.com) : elle est valable pour se
 *    connecter ; pour lui écrire, le domaine d'envoi doit être déclaré chez Apple.
 */

const KEYS_URL = 'https://appleid.apple.com/auth/keys';
const ISSUER = 'https://appleid.apple.com';
const LEEWAY_SECONDS = 60;

export interface AppleIdentity {
  sub: string;
  /** Absente si la personne n'a pas partagé son adresse (rare) : la création de compte est alors refusée. */
  email: string | null;
  emailVerified: boolean;
  isPrivateEmail: boolean;
}

interface KeyCache { expiresAt: number; keys: Map<string, KeyObject> }
let cache: KeyCache | null = null;

/** Point d'injection pour les tests : remplace le téléchargement des clés d'Apple. */
export const appleVerifierDeps = {
  async fetchKeys(): Promise<{ keys: Map<string, KeyObject>; maxAgeSeconds: number }> {
    const res = await fetch(KEYS_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Clés Apple indisponibles (HTTP ${res.status})`);
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
    const { keys, maxAgeSeconds } = await appleVerifierDeps.fetchKeys();
    cache = { keys, expiresAt: Date.now() + Math.min(Math.max(maxAgeSeconds, 60), 86_400) * 1000 };
  }
  const key = cache.keys.get(kid);
  if (!key) throw new Error('Clé de signature Apple inconnue');
  return key;
}

/** Vide le cache des clés (tests). */
export function resetAppleKeyCache() {
  cache = null;
}

const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
const truthy = (v: unknown) => v === true || v === 'true';

/**
 * @param clientIds identifiants acceptés dans `aud` : l'identifiant de service du site web, et éventuellement
 *                  l'identifiant d'une application mobile.
 */
export async function verifyAppleIdToken(idToken: string, clientIds: string | readonly string[], now = new Date()): Promise<AppleIdentity> {
  const accepted = (Array.isArray(clientIds) ? clientIds : [clientIds]).map((id) => String(id || '').trim()).filter(Boolean);
  if (!accepted.length) throw new Error('APPLE_CLIENT_ID manquant');
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
  if (payload?.iss !== ISSUER) throw new Error('Émetteur inattendu');
  const audiences: unknown[] = Array.isArray(payload?.aud) ? payload.aud : [payload?.aud];
  if (!audiences.some((aud) => typeof aud === 'string' && accepted.includes(aud))) throw new Error('Jeton émis pour une autre application');
  if (typeof payload?.exp !== 'number' || payload.exp + LEEWAY_SECONDS < seconds) throw new Error('Jeton expiré');
  if (typeof payload?.iat === 'number' && payload.iat - LEEWAY_SECONDS > seconds) throw new Error('Jeton émis dans le futur');
  if (typeof payload?.sub !== 'string' || !payload.sub || payload.sub.length > 64) throw new Error('Identité incomplète');

  const email = typeof payload.email === 'string' && payload.email.includes('@') ? String(payload.email).trim().toLowerCase() : null;
  return {
    sub: payload.sub,
    email,
    emailVerified: !!email && truthy(payload.email_verified),
    isPrivateEmail: truthy(payload.is_private_email),
  };
}
