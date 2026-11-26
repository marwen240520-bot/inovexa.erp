/**
 * Adresses du site autorisées à appeler l'API depuis un navigateur (CORS) — et vers lesquelles le serveur accepte de
 * ramener un client après un paiement en ligne.
 *   FRONTEND_URL   adresse principale du site (ex. https://www.inovexa-erp.com)
 *   FRONTEND_URLS  autres adresses, séparées par des virgules (ex. https://inovexa-erp.vercel.app)
 */
const clean = (s: string) => s.trim().replace(/\/+$/, '');

export function allowedOrigins(): string[] {
  const list = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URLS || '').split(','),
  ].map(clean).filter(Boolean);
  return Array.from(new Set(list));
}

/** Adresse https accessible depuis Internet (ni localhost, ni adresse locale) : celle qu'un prestataire ou un client peut atteindre. */
export function isPublicHttps(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(u.hostname);
  } catch {
    return false;
  }
}

/** Adresse principale du site (liens des emails, retour par défaut après un paiement). */
export function frontendUrl(): string {
  return allowedOrigins()[0];
}

/**
 * Adresse du site d'où vient la requête, si elle fait partie des adresses autorisées ; sinon l'adresse principale.
 * La session du client est gardée par le navigateur pour CETTE adresse : après le paiement, il doit y revenir.
 */
export function returnBaseFor(originHeader: unknown): string {
  const origin = clean(String(originHeader || ''));
  return origin && allowedOrigins().includes(origin) ? origin : frontendUrl();
}

/**
 * Adresse publique de l'API (appelée par le prestataire de paiement) : API_PUBLIC_URL, sinon celle que Render attribue
 * au service (RENDER_EXTERNAL_URL), sinon celle de la requête en cours.
 */
export function apiPublicUrl(req?: { protocol?: string; get?: (name: string) => string | undefined }): string {
  const fromEnv = clean(process.env.API_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '');
  if (fromEnv) return fromEnv;
  const host = req?.get?.('host');
  return host ? `${req?.protocol || 'https'}://${host}` : `http://localhost:${process.env.PORT || 3001}`;
}
