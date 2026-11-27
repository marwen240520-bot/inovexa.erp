"use client";
// lib/useRouteTab.ts
// Onglet d'une page à onglets, déduit de l'adresse : chaque onglet a SA PROPRE adresse
// (/dashboard/finance/income, /dashboard/ai/chat…) qu'on peut mettre en favori, partager ou rouvrir après un rechargement.
//
// Comment l'écran reste affiché en passant d'un onglet à l'autre :
//   • le dossier de la page contient un `layout.tsx` qui monte l'écran (FinanceApp, AiApp…) ;
//   • chaque `page.tsx` voisin (un par onglet) ne rend rien.
// Next.js garde un layout en place quand on passe d'une page voisine à l'autre : l'adresse change, l'onglet change,
// mais l'écran n'est pas reconstruit et ses données ne sont pas relues.
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface TabNavigateOptions {
  /** Remplace l'entrée d'historique au lieu d'en ajouter une (redirection d'une ancienne adresse). */
  replace?: boolean;
}

/**
 * @param paths    adresse de chaque onglet : { identifiant d'onglet: "/chemin/de/l-onglet" }
 * @param fallback onglet affiché quand l'adresse n'est celle d'aucun onglet (adresse d'entrée d'un module, ex. /dashboard/reports)
 * @returns        [onglet affiché, fonction qui ouvre un onglet]
 */
export function useRouteTab<P extends Readonly<Record<string, string>>>(
  paths: P,
  fallback: keyof P & string,
): [keyof P & string, (tab: string, opts?: TabNavigateOptions) => void] {
  type T = keyof P & string;
  const router = useRouter();
  const pathname = (usePathname() || "").replace(/\/+$/, "");

  const keys = Object.keys(paths) as T[];
  const fromUrl = keys.find((k) => paths[k] === pathname) ?? fallback;

  // Onglet demandé par un clic et pas encore confirmé par l'adresse : l'écran réagit tout de suite.
  const [pending, setPending] = useState<T | null>(null);
  useEffect(() => { setPending(null); }, [pathname]);
  useEffect(() => {
    if (!pending) return;
    // La navigation n'a pas abouti (réseau coupé…) : on revient à l'onglet de l'adresse réelle.
    const id = window.setTimeout(() => setPending(null), 4000);
    return () => window.clearTimeout(id);
  }, [pending]);

  const shown = pending ?? fromUrl;
  const shownRef = useRef<T>(shown);
  shownRef.current = shown;

  // Les onglets voisins sont préchargés : le changement est immédiat au clic.
  useEffect(() => {
    for (const k of keys) {
      try { router.prefetch(paths[k]); } catch { /* ignoré */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const go = useCallback(
    (tab: string, opts?: TabNavigateOptions) => {
      if (!Object.prototype.hasOwnProperty.call(paths, tab)) return;
      const target = tab as T;
      if (target === shownRef.current) return;
      setPending(target);
      if (opts?.replace) router.replace(paths[target]);
      else router.push(paths[target]);
    },
    [paths, router],
  );

  return [shown, go];
}
