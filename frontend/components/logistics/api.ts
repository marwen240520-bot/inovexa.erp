// components/logistics/api.ts
// Appels de l'API Logistique. Le kit commun (components/erp/kit.tsx) ne garde que le message d'une erreur ;
// ici on conserve aussi le `code` renvoyé par le serveur (MODULE_DISABLED) pour afficher le bon texte.
import { API_URL } from "@/lib/saas";
import { getToken } from "@/lib/session";

export class LogisticsApiError extends Error {
  /** Code HTTP ; 0 = serveur injoignable. */
  status: number;
  /** Code métier du serveur (« MODULE_DISABLED »…), s'il y en a un. */
  code: string | null;
  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "LogisticsApiError";
    this.status = status;
    this.code = code;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Appel JSON authentifié. Toute réponse hors 2xx lève une LogisticsApiError : une suppression ou une
 * modification refusée n'est donc jamais annoncée comme réussie.
 * L'adresse des lectures est exactement `${NEXT_PUBLIC_API_URL}/chemin` : lib/apiCache.ts peut ainsi
 * réutiliser la réponse préchargée par lib/routeData.ts.
 */
export async function logisticsApi<T = unknown>(path: string, opts: { method?: Method; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method || "GET",
      headers: {
        ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new LogisticsApiError("", 0);
  }
  if (res.status === 401) {
    // Session fermée ou expirée : même comportement que le reste de l'ERP.
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    throw new LogisticsApiError("", 401);
  }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const m = data?.message;
    const message = Array.isArray(m) ? m.join(" · ") : typeof m === "string" ? m : "";
    throw new LogisticsApiError(message, res.status, typeof data?.code === "string" ? data.code : null);
  }
  return data as T;
}

type Translate = (key: string) => string;

/**
 * Texte à afficher pour une erreur de l'API.
 * Le serveur rédige ses messages en français : ils sont affichés tels quels dans cette langue. Dans les autres
 * langues, les cas connus (droit insuffisant, doublon…) ont leur traduction ; à défaut le message du serveur
 * reste affiché, plutôt qu'un « erreur » sans explication.
 * `known` associe un code HTTP à une clé de traduction propre à l'écran (ex. 409 → numéro de suivi en double).
 */
export function describeError(err: unknown, t: Translate, language: string, known: Partial<Record<number, string>> = {}): string {
  if (!(err instanceof LogisticsApiError)) return t("logistics.unexpectedError");
  if (err.status === 0) return t("logistics.networkError");
  if (err.status === 401) return t("logistics.sessionExpired");
  // Le message du serveur cite la clé technique du module (« logistics ») : on affiche son nom traduit.
  if (err.code === "MODULE_DISABLED") return t("logistics.moduleDisabled");
  if (language === "fr" && err.message) return err.message;
  const key = known[err.status] ?? (err.status === 403 ? "logistics.accessDenied" : err.status === 404 ? "logistics.notFound" : null);
  if (key) return t(key);
  return err.message || t("logistics.unexpectedError");
}

/** Remplace {nom} par sa valeur dans un texte traduit. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name) => (name in values ? String(values[name]) : whole));
}
