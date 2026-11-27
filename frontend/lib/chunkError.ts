/**
 * Erreurs de chargement d'un morceau de code du site (« Loading chunk 6091 failed »).
 *
 * Causes habituelles : une page restée ouverte pendant la publication d'une nouvelle version (les fichiers de l'ancienne
 * version n'existent plus), ou une coupure réseau pendant le chargement. Le fichier est alors bien en ligne, mais le
 * navigateur garde l'échec en mémoire : un simple « Réessayer » (reset de React) ne change rien, seul un rechargement
 * de la page rattrape l'erreur.
 */
const CHUNK_ERROR =
  /Loading chunk [\w-]+ failed|Loading CSS chunk|ChunkLoadError|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

export function isChunkLoadError(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null | undefined;
  if (!e) return false;
  return e.name === "ChunkLoadError" || CHUNK_ERROR.test(String(e.message ?? ""));
}

const RELOAD_KEY = "ix-chunk-reload-at";
const RELOAD_GAP_MS = 30_000;

/**
 * Recharge la page, une seule fois (au plus toutes les 30 secondes) : si le fichier reste introuvable après le
 * rechargement, la page d'erreur s'affiche au lieu de boucler. Renvoie true si le rechargement est lancé.
 */
export function reloadOnceForChunkError(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_GAP_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Stockage indisponible : impossible de se protéger d'une boucle, on laisse l'utilisateur recharger lui-même.
    return false;
  }
  window.location.reload();
  return true;
}
