"use client";
// components/auth/SocialSignIn.tsx
// Boutons « Continuer avec Google » et « Continuer avec Apple » des écrans de connexion et d'inscription.
// Chaque bouton n'apparaît que si le serveur est configuré pour lui (GET /public/config) ; s'il n'y en a aucun, le
// bloc entier (boutons et séparateur « ou ») n'est pas rendu.
import React, { useState } from "react";
import GoogleButton from "@/components/auth/GoogleButton";
import AppleButton from "@/components/auth/AppleButton";
import { AuthDivider, AuthMessage, useAuthTexts } from "@/components/auth/AuthShell";
import { usePublicConfig } from "@/lib/publicConfig";
import type { SocialProvider } from "@/lib/authFlow";

export interface SocialCredential {
  provider: SocialProvider;
  token: string;
  /** Renseignés par Apple à la première autorisation seulement ; Google les met dans le jeton. */
  name: string | null;
  email: string | null;
}

export const PROVIDER_NAMES: Record<SocialProvider, string> = { google: "Google", apple: "Apple" };

export default function SocialSignIn({
  mode,
  onCredential,
  disabled = false,
  dividerPosition = "before",
}: {
  /** Formule affichée sur le bouton Google : connexion ou inscription. */
  mode: "login" | "register";
  onCredential: (credential: SocialCredential) => void;
  disabled?: boolean;
  /** Séparateur « ou » avant les boutons (sous un formulaire) ou après (au-dessus d'un formulaire). */
  dividerPosition?: "before" | "after";
}) {
  const config = usePublicConfig();
  const { tx, ui } = useAuthTexts();
  const [googleFailed, setGoogleFailed] = useState(false);
  const [appleFailed, setAppleFailed] = useState(false);

  const googleId = config?.googleClientId || null;
  const appleId = config?.appleClientId || null;
  if (!googleId && !appleId) return null;
  const showGoogle = !!googleId && !googleFailed;
  const showApple = !!appleId && !appleFailed;

  // Les deux boutons étaient prévus mais aucun n'a pu s'afficher (script bloqué) : on le dit, sans séparateur orphelin.
  if (!showGoogle && !showApple) {
    return <AuthMessage tone="info">{googleId ? ui.googleUnavailable : ui.appleUnavailable}</AuthMessage>;
  }

  const divider = <AuthDivider label={tx.or} />;
  return (
    <div className="lg-social">
      {dividerPosition === "before" ? divider : null}
      <div className="lg-social-buttons">
        {showGoogle ? (
          <GoogleButton
            clientId={googleId as string}
            text={mode === "register" ? "signup_with" : "continue_with"}
            disabled={disabled}
            onCredential={(token) => onCredential({ provider: "google", token, name: null, email: null })}
            onError={() => setGoogleFailed(true)}
          />
        ) : null}
        {showApple ? (
          <AppleButton
            clientId={appleId as string}
            label={tx.apple}
            disabled={disabled}
            onCredential={(token, profile) => onCredential({ provider: "apple", token, name: profile.name, email: profile.email })}
            onError={() => setAppleFailed(true)}
          />
        ) : null}
      </div>
      {dividerPosition === "after" ? divider : null}
    </div>
  );
}
