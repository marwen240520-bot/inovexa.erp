"use client";
// components/auth/AppleButton.tsx
// « Continuer avec Apple » (Sign in with Apple JS).
//
// Au clic, Apple ouvre sa propre fenêtre : la page ne voit ni l'identifiant ni le mot de passe, elle reçoit seulement
// un jeton d'identité signé, qu'elle remet à l'API. C'est l'API qui le vérifie (signature, destinataire, expiration).
// Le nom de la personne n'est communiqué par Apple qu'à la toute première autorisation : il est transmis à part.
//
// Ce composant n'est monté que si GET /public/config a renvoyé un `appleClientId` : sans configuration côté serveur,
// aucun script n'est chargé depuis Apple et aucun bouton n'apparaît.
import React, { useEffect, useRef, useState } from "react";

const APPLE_SRC = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

interface AppleSignInResult {
  authorization?: { id_token?: string; code?: string; state?: string };
  user?: { email?: string; name?: { firstName?: string; lastName?: string } };
}

interface AppleAuthApi {
  init(options: { clientId: string; scope: string; redirectURI: string; state?: string; usePopup: boolean }): void;
  signIn(): Promise<AppleSignInResult>;
}

const appleAuth = (): AppleAuthApi | undefined => (window as unknown as { AppleID?: { auth?: AppleAuthApi } }).AppleID?.auth;

// Le script d'Apple est chargé une seule fois par onglet, à la première apparition du bouton.
let scriptPromise: Promise<AppleAuthApi> | null = null;

function loadAppleScript(): Promise<AppleAuthApi> {
  if (scriptPromise) return scriptPromise;
  const attempt = new Promise<AppleAuthApi>((resolve, reject) => {
    const ready = appleAuth();
    if (ready) { resolve(ready); return; }
    // Créé par notre propre code : accepté par la politique de sécurité du site (frontend/proxy.ts).
    const script = document.createElement("script");
    script.src = APPLE_SRC;
    script.async = true;
    script.onload = () => {
      const api = appleAuth();
      if (api) resolve(api);
      else reject(new Error("Sign in with Apple indisponible"));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Script Apple non chargé"));
    };
    document.head.appendChild(script);
  });
  scriptPromise = attempt;
  // Un échec (réseau, bloqueur) n'est pas mémorisé : la prochaine page qui affiche le bouton réessaie.
  attempt.catch(() => { if (scriptPromise === attempt) scriptPromise = null; });
  return attempt;
}

/**
 * Adresse de retour déclarée chez Apple. Avec la fenêtre d'Apple (usePopup), le navigateur n'y est jamais envoyé,
 * mais Apple exige qu'elle fasse partie des « Return URLs » de l'identifiant de service : https://<domaine>/auth/login.
 */
export const appleRedirectUri = () => `${window.location.origin}/auth/login`;

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M16.37 12.78c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.03 2.29-1.27 3.14-2.53.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.74-4.13zM13.79 5.14c.71-.87 1.2-2.07 1.06-3.27-1.03.04-2.27.69-3.01 1.55-.66.76-1.24 1.99-1.08 3.16 1.15.09 2.32-.58 3.03-1.44z" />
  </svg>
);

interface AppleButtonProps {
  /** Identifiant de service Apple (public), fourni par GET /public/config. */
  clientId: string;
  label: string;
  /** Reçoit le jeton d'identité Apple, à envoyer à POST /auth/apple, et le nom (première autorisation seulement). */
  onCredential: (identityToken: string, profile: { name: string | null; email: string | null }) => void;
  /** Appelé si le bouton ne peut pas fonctionner (script bloqué ou injoignable) : rien n'est alors rendu. */
  onError?: () => void;
  disabled?: boolean;
}

export default function AppleButton({ clientId, label, onCredential, onError, disabled = false }: AppleButtonProps) {
  const [api, setApi] = useState<AppleAuthApi | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef(onError);
  useEffect(() => { errorRef.current = onError; });

  useEffect(() => {
    let alive = true;
    loadAppleScript()
      .then((loaded) => {
        if (!alive) return;
        try {
          loaded.init({ clientId, scope: "name email", redirectURI: appleRedirectUri(), usePopup: true });
          setApi(loaded);
        } catch {
          setFailed(true);
          errorRef.current?.();
        }
      })
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        errorRef.current?.();
      });
    return () => { alive = false; };
  }, [clientId]);

  const signIn = async () => {
    if (!api || busy) return;
    setBusy(true);
    try {
      const result = await api.signIn();
      const token = result?.authorization?.id_token;
      if (token) {
        const first = result.user?.name?.firstName?.trim() || "";
        const last = result.user?.name?.lastName?.trim() || "";
        onCredential(token, { name: `${first} ${last}`.trim() || null, email: result.user?.email?.trim() || null });
      }
    } catch {
      // Fenêtre fermée par la personne, ou refus : rien à signaler, le formulaire reste tel quel.
    } finally {
      setBusy(false);
    }
  };

  if (failed) return null;

  return (
    <button type="button" className="lg-apple" onClick={signIn} disabled={disabled || busy || !api} aria-busy={busy || !api}>
      <AppleLogo />
      <span>{label}</span>
    </button>
  );
}
