"use client";
// components/auth/GoogleButton.tsx
// « Continuer avec Google » (Google Identity Services).
//
// Le bouton est dessiné par Google dans son propre cadre : la page ne voit ni le mot de passe ni le compte choisi,
// elle reçoit seulement un jeton d'identité signé, qu'elle remet à l'API. C'est l'API qui le vérifie (signature,
// destinataire, expiration) ; rien n'est décidé ici.
//
// Ce composant n'est monté que si GET /public/config a renvoyé un `googleClientId` : sans configuration côté
// serveur, aucun script n'est chargé depuis Google et aucun bouton n'apparaît.
import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, isLightTheme } from "@/contexts/ThemeContext";

const GSI_SRC = "https://accounts.google.com/gsi/client";
/** Largeurs acceptées par Google pour son bouton. */
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

type GoogleButtonText = "continue_with" | "signin_with" | "signup_with";

interface GoogleCredentialResponse { credential?: string }

interface GoogleIdApi {
  initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(
    parent: HTMLElement,
    options: { type: "standard"; theme: "outline" | "filled_black"; size: "large"; width: number; text: GoogleButtonText; shape: "pill"; locale: string },
  ): void;
}

const googleId = (): GoogleIdApi | undefined =>
  (window as unknown as { google?: { accounts?: { id?: GoogleIdApi } } }).google?.accounts?.id;

// Le script de Google est chargé une seule fois par onglet, à la première apparition du bouton.
let scriptPromise: Promise<GoogleIdApi> | null = null;

function loadGoogleScript(): Promise<GoogleIdApi> {
  if (scriptPromise) return scriptPromise;
  const attempt = new Promise<GoogleIdApi>((resolve, reject) => {
    const ready = googleId();
    if (ready) { resolve(ready); return; }
    // Créé par notre propre code : accepté par la politique de sécurité du site (frontend/proxy.ts).
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => {
      const api = googleId();
      if (api) resolve(api);
      else reject(new Error("Google Identity Services indisponible"));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Script Google non chargé"));
    };
    document.head.appendChild(script);
  });
  scriptPromise = attempt;
  // Un échec (réseau, bloqueur) n'est pas mémorisé : la prochaine page qui affiche le bouton réessaie.
  attempt.catch(() => { if (scriptPromise === attempt) scriptPromise = null; });
  return attempt;
}

// Google garde une seule configuration par page : elle est posée une fois par identifiant client, et le jeton reçu
// est remis au bouton actuellement affiché (connexion ou inscription).
let initializedClientId: string | null = null;
let activeHandler: ((credential: string) => void) | null = null;

function initializeOnce(api: GoogleIdApi, clientId: string) {
  if (initializedClientId === clientId) return;
  api.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response && typeof response.credential === "string" && response.credential) activeHandler?.(response.credential);
    },
  });
  initializedClientId = clientId;
}

interface GoogleButtonProps {
  /** Identifiant client OAuth public, fourni par GET /public/config. */
  clientId: string;
  /** Formule affichée par Google sur le bouton. */
  text?: GoogleButtonText;
  /** Reçoit le jeton d'identité Google, à envoyer à POST /auth/google. */
  onCredential: (credential: string) => void;
  /** Appelé si le bouton ne peut pas être affiché (script bloqué ou injoignable) : rien n'est alors rendu. */
  onError?: () => void;
  /** Bouton inactif pendant qu'une demande est en cours. */
  disabled?: boolean;
}

export default function GoogleButton({ clientId, text = "continue_with", onCredential, onError, disabled = false }: GoogleButtonProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const light = isLightTheme(theme);
  const holderRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<GoogleIdApi | null>(null);
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(0);

  // Google appelle le bouton hors du cycle de React : les derniers gestionnaires sont gardés dans des références.
  const credentialRef = useRef(onCredential);
  const errorRef = useRef(onError);
  useEffect(() => {
    credentialRef.current = onCredential;
    errorRef.current = onError;
  });

  useEffect(() => {
    let alive = true;
    loadGoogleScript()
      .then((loaded) => { if (alive) setApi(loaded); })
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        errorRef.current?.();
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const handler = (credential: string) => credentialRef.current(credential);
    activeHandler = handler;
    return () => { if (activeHandler === handler) activeHandler = null; };
  }, []);

  // Le bouton de Google a une largeur fixe en pixels : on suit celle de la carte.
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const measure = () => setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(holder.clientWidth))));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  // Redessiné quand la largeur, le thème ou la langue changent.
  useEffect(() => {
    const target = targetRef.current;
    if (!api || !target || !width) return;
    try {
      initializeOnce(api, clientId);
      target.replaceChildren();
      api.renderButton(target, { type: "standard", theme: light ? "outline" : "filled_black", size: "large", width, text, shape: "pill", locale: language });
    } catch {
      setFailed(true);
      errorRef.current?.();
    }
  }, [api, clientId, width, light, language, text]);

  if (failed) return null;

  return (
    // `inert` : pendant une demande en cours, le bouton ne répond ni à la souris ni au clavier.
    <div ref={holderRef} className="lg-google" aria-busy={!api} inert={disabled} data-disabled={disabled || undefined}>
      <div ref={targetRef} />
    </div>
  );
}
