// lib/authFlow.ts
// Enchaînements communs des écrans d'accès : reprise d'une session ouverte, fin de connexion, et identité Google ou
// Apple gardée le temps de compléter l'inscription (nom de la société, secteur).
"use client";
import { API_URL } from "@/lib/saas";
import { clearSession, getStoredUser, getToken, homeFor, saveSession, type AccountState, type SessionUser } from "@/lib/session";

export interface SignInResponse {
  access_token: string;
  user: SessionUser;
  account: AccountState | null;
  created?: boolean;
  emailSent?: boolean;
}

/** Enregistre la session renvoyée par l'API et donne la page d'arrivée (ERP, espace administrateur, abonnement…). */
export function finishSignIn(data: SignInResponse): string {
  saveSession({ access_token: data.access_token, user: data.user });
  return homeFor(data.user, data.account);
}

/**
 * Une session est-elle déjà ouverte dans ce navigateur ? Le serveur est interrogé (GET /auth/me) : un jeton expiré
 * est retiré, sinon la page de connexion et l'ERP se renverraient l'un à l'autre sans fin.
 * Renvoie la page où emmener la personne, ou null s'il faut afficher l'écran d'accès.
 */
export async function resumeSession(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (res.status === 401) {
      clearSession();
      return null;
    }
    if (!res.ok) return null;
    const me = (await res.json().catch(() => null)) as (SessionUser & { account?: AccountState | null }) | null;
    if (!me) return null;
    return homeFor({ role: me.role ?? getStoredUser()?.role }, me.account);
  } catch {
    // Serveur injoignable : on laisse l'écran d'accès affiché, sans rien effacer.
    return null;
  }
}

// ───────────── Identité Google / Apple en attente ─────────────

export type SocialProvider = "google" | "apple";

export interface PendingSocial {
  provider: SocialProvider;
  /** Jeton d'identité remis par le fournisseur (valable quelques minutes). */
  token: string;
  email: string | null;
  name: string | null;
  at: number;
}

const PENDING_KEY = "inovexa_pending_social";
/** Les jetons d'identité expirent vite : au-delà, la personne recliquera sur le bouton. */
const PENDING_TTL_MS = 8 * 60_000;

/** Garde l'identité le temps d'aller compléter l'inscription (même onglet seulement). */
export function stashPendingSocial(value: Omit<PendingSocial, "at">) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...value, at: Date.now() })); } catch { /* stockage indisponible */ }
}

export function readPendingSocial(): PendingSocial | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PendingSocial;
    if (!value?.token || (value.provider !== "google" && value.provider !== "apple") || Date.now() - Number(value.at) > PENDING_TTL_MS) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function clearPendingSocial() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignoré */ }
}

/** Corps de POST /auth/google ou /auth/apple pour un jeton d'identité. */
export function socialBody(provider: SocialProvider, token: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return provider === "google" ? { credential: token, ...extra } : { identityToken: token, ...extra };
}

// ───────────── Formule choisie avant l'inscription ─────────────

const PLAN_KEY = "inovexa_preferred_plan";

/** Formule choisie sur la page Tarifs (« ?plan=business ») : proposée d'office sur la page Abonnement. */
export function rememberPreferredPlan(code: string | null | undefined) {
  if (!code || !/^[a-z0-9][a-z0-9_-]{1,38}$/.test(code)) return;
  try { localStorage.setItem(PLAN_KEY, code); } catch { /* ignoré */ }
}

export function readPreferredPlan(): string | null {
  try { return localStorage.getItem(PLAN_KEY); } catch { return null; }
}
