/**
 * Message lisible d'une réponse d'erreur de l'API.
 * Le serveur répond { message: "texte" } ou, pour une saisie refusée, { message: ["Nom obligatoire.", "Email invalide."] } :
 * sans cet aplatissement, un tableau s'affichait collé (« Nom obligatoire.Email invalide. »).
 */
export function apiMessage(body: unknown, fallback: string): string {
  const m = (body as { message?: unknown } | null)?.message;
  const text = Array.isArray(m) ? m.filter((x) => typeof x === "string" && x).join(" · ") : typeof m === "string" ? m : "";
  return text || fallback;
}

/** Lit le corps d'une réponse en échec et renvoie son message (ou `fallback`). */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return apiMessage(body, fallback);
}

/** Adresse email plausible (même règle que le formulaire d'inscription : un @, un point dans le domaine, pas d'espace). */
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
