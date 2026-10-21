// lib/apiCache.ts
// Cache court + dédoublonnage des lectures (GET) vers l'API Inovexa, côté navigateur.
//
// Pourquoi : chaque page recharge /products, /clients, /sales… depuis le serveur à chaque clic,
// et une même liste est souvent demandée plusieurs fois en même temps (barre latérale + page).
// Ce module s'installe UNE fois (components/AppBoot.tsx) autour de window.fetch, sans rien changer
// dans les pages :
//   • GET identiques simultanés  → une seule requête réseau partagée ;
//   • GET déjà reçu il y a moins de 30 s → réponse instantanée depuis la mémoire ;
//   • POST / PUT / PATCH / DELETE → le cache est vidé (avant ET après la requête), dans tous les onglets ;
//   • fetch(..., { cache: "no-store" }) ou avec un AbortSignal → toujours envoyé au serveur.
// Seules les réponses JSON en succès (2xx) sont gardées, et la clé inclut le jeton : aucun partage
// entre deux comptes. Le cache vit en mémoire : un rechargement de page (F5) repart de zéro.

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const API_ORIGIN = (() => {
  try { return new URL(API_BASE).origin; } catch { return ""; }
})();

/** Durée pendant laquelle une liste est servie sans retourner au serveur */
export const API_CACHE_TTL_MS = 30_000;
const MAX_ENTRIES = 200;
const NULL_BODY_STATUS = new Set([101, 204, 205, 304]);

type Snapshot = { status: number; statusText: string; headers: [string, string][]; body: ArrayBuffer | null };
type Entry = Snapshot & { at: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<Snapshot>>();
let generation = 0;
let channel: BroadcastChannel | null = null;
let nativeFetch: typeof fetch | null = null;

function isApiUrl(url: string): boolean {
  if (!API_ORIGIN) return false;
  try { return new URL(url, window.location.href).origin === API_ORIGIN; } catch { return false; }
}

function readHeader(headers: HeadersInit | undefined, name: string): string {
  if (!headers) return "";
  try { return new Headers(headers).get(name) || ""; } catch { return ""; }
}

function toResponse(s: Snapshot): Response {
  const body = NULL_BODY_STATUS.has(s.status) ? null : s.body ? s.body.slice(0) : null;
  return new Response(body, { status: s.status, statusText: s.statusText, headers: s.headers });
}

async function snapshot(res: Response): Promise<Snapshot> {
  const headers: [string, string][] = [];
  res.headers.forEach((value, key) => headers.push([key, value]));
  const body = NULL_BODY_STATUS.has(res.status) ? null : await res.arrayBuffer();
  return { status: res.status, statusText: res.statusText, headers, body };
}

/** Vide le cache de cet onglet (et des autres si `broadcast`). */
export function invalidateApiCache(broadcast = true) {
  generation++;
  store.clear();
  inflight.clear();
  if (broadcast && channel) {
    try { channel.postMessage("invalidate"); } catch { /* ignoré */ }
  }
}

/** Alias explicite, ex. à la déconnexion. */
export const clearApiCache = () => invalidateApiCache(true);

function remember(key: string, s: Snapshot) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { ...s, at: Date.now() });
}

/** Installe l'intercepteur (idempotent, navigateur uniquement). */
export function installApiCache() {
  if (typeof window === "undefined" || !API_ORIGIN) return;
  const w = window as any;
  if (w.__inovexaApiCacheInstalled) return;
  w.__inovexaApiCacheInstalled = true;

  const original: typeof fetch = window.fetch.bind(window);
  nativeFetch = original;

  try {
    channel = new BroadcastChannel("inovexa-api-cache");
    channel.onmessage = (e) => { if (e.data === "invalidate") invalidateApiCache(false); };
  } catch { channel = null; }

  window.fetch = async function cachedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const isRequest = typeof Request !== "undefined" && input instanceof Request;
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    if (!isApiUrl(url)) return original(input as any, init);

    const method = (init?.method || (isRequest ? (input as Request).method : "GET")).toUpperCase();

    // Écritures : on vide le cache avant (les lectures suivantes repartent au serveur)
    // et après (au cas où une lecture lancée entre-temps aurait reçu l'ancienne version).
    if (method !== "GET") {
      invalidateApiCache();
      try { return await original(input as any, init); }
      finally { invalidateApiCache(); }
    }

    const bypass =
      isRequest ||
      !!init?.signal ||
      init?.cache === "no-store" ||
      init?.cache === "reload" ||
      init?.cache === "no-cache";
    if (bypass) return original(input as any, init);

    const key = url + "|" + readHeader(init?.headers, "authorization");
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < API_CACHE_TTL_MS) return toResponse(hit);

    let pending = inflight.get(key);
    if (!pending) {
      const startedAt = generation;
      pending = original(input as any, init)
        .then(snapshot)
        .then((s) => {
          const contentType = s.headers.find(([k]) => k === "content-type")?.[1] || "";
          if (startedAt === generation && s.status >= 200 && s.status < 300 && contentType.includes("json")) {
            remember(key, s);
          }
          return s;
        })
        .finally(() => { if (inflight.get(key) === pending) inflight.delete(key); });
      inflight.set(key, pending);
    }
    return toResponse(await pending);
  } as typeof fetch;
}

/**
 * Réveille le serveur API (hébergé sur Render, qui se met en veille) dès l'arrivée sur le site,
 * pendant que l'utilisateur lit la page ou tape son mot de passe. Une fois par onglet.
 */
export function warmUpApi() {
  if (typeof window === "undefined" || !API_BASE) return;
  try {
    if (sessionStorage.getItem("api_warm") === "1") return;
    sessionStorage.setItem("api_warm", "1");
  } catch { /* ignoré */ }
  const go = () => {
    (nativeFetch || window.fetch)(API_BASE + "/", { mode: "no-cors", cache: "no-store", credentials: "omit" }).catch(() => {});
  };
  const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: any) => number) | undefined;
  if (ric) ric(go, { timeout: 1500 }); else setTimeout(go, 300);
}
