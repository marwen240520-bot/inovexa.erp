// lib/publicConfig.ts
// Configuration publique de la plateforme (GET /public/config) : durée de l'essai, identifiants Google et Apple,
// contacts du support. Lue une fois par onglet et partagée par les écrans d'accès.
"use client";
import { useEffect, useState } from "react";
import { publicGet, type PublicConfig } from "@/lib/saas";

let pending: Promise<PublicConfig | null> | null = null;

export function loadPublicConfig(): Promise<PublicConfig | null> {
  if (!pending) {
    pending = publicGet<PublicConfig>("/public/config").catch(() => null);
    // Un échec n'est pas gardé : le prochain écran réessaie.
    void pending.then((config) => { if (!config) pending = null; });
  }
  return pending;
}

/** `undefined` : lecture en cours ; `null` : serveur injoignable ; sinon la configuration. */
export function usePublicConfig(): PublicConfig | null | undefined {
  const [config, setConfig] = useState<PublicConfig | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    void loadPublicConfig().then((value) => { if (alive) setConfig(value); });
    return () => { alive = false; };
  }, []);
  return config;
}
