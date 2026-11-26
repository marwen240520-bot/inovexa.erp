// lib/session.ts
// Session côté navigateur : jeton, profil, déconnexion. Un seul endroit pour tous les écrans.
//
// Le navigateur ne décide JAMAIS de l'accès : l'état du compte (essai, abonnement, suspension) vient du serveur
// à chaque requête. Ce qui est gardé ici ne sert qu'à afficher vite la bonne page.
import { clearApiCache } from "@/lib/apiCache";
import { refreshCompanyProfile, resetCompanyProfile } from "@/lib/company-profile";

export const TOKEN_KEY = "token";
export const USER_KEY = "user";
const MODULES_KEY = "sidebar_modules";
/** Événement émis à la déconnexion : la barre latérale vide ses caches en mémoire (modules du compte précédent). */
export const SESSION_CLEARED_EVENT = "inovexa:session-cleared";
/** Événement émis quand le client change lui-même son secteur ou ses modules : la barre latérale se met à jour aussitôt. */
export const MODULES_CHANGED_EVENT = "inovexa:modules-changed";

/** État d'un compte tel que le serveur le renvoie (auth/me, auth/login, billing/subscription). */
export interface AccountState {
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";
  blocked: boolean;
  reason: "TRIAL_EXPIRED" | "SUBSCRIPTION_EXPIRED" | "SUSPENDED" | "CANCELLED" | "EMAIL_NOT_VERIFIED" | null;
  message: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  endsAt: string | null;
  /** Secondes restantes, calculées par le serveur. */
  remainingSeconds: number | null;
  serverTime: string;
  planCode: string | null;
  billingCycle: "monthly" | "annual" | null;
  sector: string | null;
  userLimit: number | null;
  emailVerified: boolean;
  expiryEnforced: boolean;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
  companyName?: string | null;
  modules?: Record<string, boolean> | null;
  isTeamMember?: boolean;
  sector?: string | null;
  twoFactorEnabled?: boolean;
  permissions?: string[];
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch { return null; }
}

/** Enregistre la session renvoyée par /auth/login, /auth/register ou /auth/google. */
export function saveSession(data: { access_token: string; user: SessionUser }) {
  try {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.removeItem(MODULES_KEY);
  } catch { /* stockage indisponible */ }
  clearApiCache();
  // Le profil (pays, devise, TVA) est celui de la société qui se connecte : on lit le sien, jamais celui du compte précédent.
  resetCompanyProfile();
  if (!isPlatformAdmin(data.user?.role) && data.user?.role !== "transporteur") void refreshCompanyProfile();
  try { window.dispatchEvent(new Event(SESSION_CLEARED_EVENT)); } catch { /* ignoré */ }
}

/** Met à jour l'adresse email du profil gardé par le navigateur (après une correction d'adresse acceptée par le serveur). */
export function updateStoredEmail(email: string) {
  try {
    const user = getStoredUser();
    if (user) localStorage.setItem(USER_KEY, JSON.stringify({ ...user, email }));
  } catch { /* stockage indisponible */ }
}

/** Garde l'état de la double authentification dans le profil du navigateur (affichage seulement : c'est le serveur qui décide). */
export function updateStoredTwoFactor(enabled: boolean) {
  try {
    const user = getStoredUser();
    if (user) localStorage.setItem(USER_KEY, JSON.stringify({ ...user, twoFactorEnabled: enabled }));
  } catch { /* stockage indisponible */ }
}

/** Remplace seulement le jeton (après un changement de mot de passe, le serveur en remet un neuf). */
export function replaceToken(token?: string | null) {
  if (!token) return;
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignoré */ }
  clearApiCache();
}

/**
 * Déconnexion : ne retire QUE ce qui appartient à la session. Les préférences de l'appareil (langue, thème, devise,
 * format de date) sont conservées — l'ancien `localStorage.clear()` les effaçait à chaque déconnexion.
 */
export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODULES_KEY);
  } catch { /* ignoré */ }
  clearApiCache();
  resetCompanyProfile();
  try { window.dispatchEvent(new Event(SESSION_CLEARED_EVENT)); } catch { /* ignoré */ }
}

/**
 * Le client vient de changer son secteur ou ses modules : le profil gardé par le navigateur est mis à jour et la barre
 * latérale prévenue. (Simple affichage : c'est le serveur qui ouvre ou ferme réellement chaque module.)
 */
export function applyModulesChange(modules: Record<string, boolean>, sector?: string | null) {
  try {
    const user = getStoredUser();
    if (user) {
      const next = { ...user, modules, ...(sector !== undefined ? { sector } : {}) };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      localStorage.setItem(MODULES_KEY, JSON.stringify({ userId: user.id, modules }));
    }
  } catch { /* stockage indisponible */ }
  clearApiCache();
  try { window.dispatchEvent(new CustomEvent(MODULES_CHANGED_EVENT, { detail: { modules, sector } })); } catch { /* ignoré */ }
}

/** Page d'arrivée après connexion, selon le rôle et l'état du compte. */
export function homeFor(user: { role?: string } | null | undefined, account?: { blocked?: boolean; reason?: string | null } | null): string {
  if (!user) return "/auth/login";
  if (user.role === "admin" || user.role === "super_admin") return "/admin";
  if (user.role === "transporteur") return "/transporteur/shipments";
  // Adresse email pas encore vérifiée : il reste à saisir le code reçu par email.
  if (account?.blocked && account.reason === "EMAIL_NOT_VERIFIED") return "/auth/verify-email";
  if (account?.blocked) return "/subscription";
  return "/dashboard";
}

export const isPlatformAdmin = (role?: string | null) => role === "admin" || role === "super_admin";
