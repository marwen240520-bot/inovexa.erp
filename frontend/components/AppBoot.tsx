// components/AppBoot.tsx
"use client";
import { useEffect } from "react";
import { installApiCache, warmUpApi } from "@/lib/apiCache";
import { prefetchRouteData } from "@/lib/routeData";

// Exécuté dès le chargement du module, donc AVANT que React construise la page :
//  1. le cache des lectures API est en place pour les toutes premières requêtes ;
//  2. les données de la page ouverte (ex. les 8 listes du tableau de bord) partent tout de suite,
//     au lieu d'attendre la fin de l'hydratation.
if (typeof window !== "undefined") {
  installApiCache();
  prefetchRouteData(window.location.pathname, { includeModules: true });
}

/** Démarrage côté navigateur : cache des lectures API + réveil du serveur API. Ne rend rien. */
export default function AppBoot() {
  useEffect(() => {
    installApiCache();
    warmUpApi();
  }, []);
  return null;
}
