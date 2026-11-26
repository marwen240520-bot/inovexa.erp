/**
 * Nombre de relais (reverse-proxy, CDN) entre Internet et l'API, pour lire la vraie adresse IP du visiteur dans
 * X-Forwarded-For. Trop bas : tous les visiteurs partagent l'adresse du relais (la limite de tentatives les bloque ensemble) ;
 * trop haut : un visiteur peut falsifier son adresse. Un seul relais par défaut (Render, Railway…) ; TRUST_PROXY=2 derrière
 * un CDN en plus (Cloudflare devant Render), TRUST_PROXY=0 sans relais.
 */
export function trustProxyHops(env: Record<string, string | undefined> = process.env): number | false {
  const raw = String(env.TRUST_PROXY ?? '').trim().toLowerCase();
  if (raw === '') return 1;
  if (raw === 'false' || raw === 'no' || raw === 'off') return false;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 5 ? (n === 0 ? false : n) : 1;
}
