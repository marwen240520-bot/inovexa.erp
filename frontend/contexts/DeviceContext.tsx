// contexts/DeviceContext.tsx
"use client";
import React, { createContext, useContext } from "react";

/**
 * Indice « mobile ou non » calculé par le serveur à partir de l'en-tête User-Agent.
 * Il sert de valeur initiale aux hooks de taille d'écran : le HTML envoyé par le serveur
 * a déjà la bonne mise en page (mobile ou ordinateur), sans saut au chargement.
 * La vraie largeur de fenêtre prend le relais dès le montage.
 */
const DeviceContext = createContext<{ isMobileHint: boolean }>({ isMobileHint: false });

export function DeviceProvider({ isMobileHint, children }: { isMobileHint: boolean; children: React.ReactNode }) {
  return <DeviceContext.Provider value={{ isMobileHint }}>{children}</DeviceContext.Provider>;
}

export function useDeviceHint(): boolean {
  return useContext(DeviceContext).isMobileHint;
}

/** Largeur supposée avant le montage, cohérente entre serveur et client (évite les erreurs d'hydratation). */
export function hintedWidth(isMobileHint: boolean): number {
  return isMobileHint ? 390 : 1366;
}
