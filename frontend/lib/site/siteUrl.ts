// lib/site/siteUrl.ts
// Adresse publique du site : liens canoniques, plan du site (sitemap.xml), robots.txt et données structurées.
// Pour un autre domaine, définissez NEXT_PUBLIC_SITE_URL (ex. https://inovexa-erp.com) dans les variables du
// serveur ; sans valeur, c'est https://inovexa-erp.com. Pas de "use client" : lisible par les composants serveur.

const FALLBACK = "https://inovexa-erp.com";

function normalise(raw: string | undefined): string {
  const value = (raw || "").trim();
  if (!value) return FALLBACK;
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).origin;
  } catch {
    return FALLBACK;
  }
}

/** Origine du site, sans barre oblique finale (ex. « https://inovexa-erp.com »). */
export const SITE_URL = normalise(process.env.NEXT_PUBLIC_SITE_URL);

/** Adresse complète d'une page du site à partir de son chemin (« /pricing »). */
export function absoluteUrl(path: string = "/"): string {
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
}
