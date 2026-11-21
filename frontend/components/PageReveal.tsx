'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './PageReveal.module.css';

/**
 * PageReveal — affiche tout son contenu d'un seul coup.
 *
 * Le contenu reste invisible tant que les images du premier écran ne sont
 * pas chargées et décodées : balises <img> (next/image compris) et fonds CSS
 * (`background-image`, y compris sur ::before / ::after, <body> et <html>).
 * Ensuite textes, cartes, photo de fond et logo apparaissent ensemble.
 *
 * Utilisation (app/page.tsx) :
 *
 *   import PageReveal from '@/components/PageReveal';
 *
 *   export default function HomePage() {
 *     return (
 *       <PageReveal>
 *         ...tout le contenu actuel de la page...
 *       </PageReveal>
 *     );
 *   }
 *
 * Deux sécurités empêchent une page blanche :
 *  - `maxWait` : passé ce délai, la page s'affiche même si une image manque ;
 *  - si JavaScript ne démarre pas, le CSS affiche la page au bout de 6 s.
 *
 * Aucun style ni script inline : compatible avec une CSP stricte (nonce).
 */

type PageRevealProps = {
  children: ReactNode;
  /** Classes à ajouter sur le conteneur (ex. "min-h-screen"). */
  className?: string;
  /** Attente maximale en millisecondes (défaut 4000, plafonnée à 5000). */
  maxWait?: number;
  /**
   * Autres URLs d'images à attendre, en plus de celles détectées
   * (utile si le logo ou le fond est inséré plus tard par un composant client).
   */
  extra?: string[];
};

/** Doit rester inférieur au délai du filet de sécurité CSS (6 s). */
const HARD_LIMIT = 5000;

const CSS_URL = /url\((['"]?)(.*?)\1\)/g;

/** L'élément est-il réellement affiché et dans l'écran visible au chargement ? */
function isInFirstScreen(el: Element): boolean {
  if (el.getClientRects().length === 0) return false; // display: none
  const rect = el.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom >= 0 &&
    rect.left < window.innerWidth &&
    rect.right >= 0
  );
}

/** Résolue quand l'image est chargée ET décodée (ou en erreur : on ne bloque jamais). */
function whenImageReady(img: HTMLImageElement): Promise<void> {
  const loaded: Promise<void> = img.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done);
        img.addEventListener('error', done);
      });

  return loaded.then(() => {
    if (typeof img.decode !== 'function') return undefined;
    return img.decode().catch(() => undefined);
  });
}

/** URLs des `background-image` d'un élément et de ses pseudo-éléments. */
function backgroundUrls(el: Element): string[] {
  const urls: string[] = [];
  const targets: Array<string | null> = [null, '::before', '::after'];

  targets.forEach((pseudo) => {
    const value = window.getComputedStyle(el, pseudo).backgroundImage;
    if (!value || value === 'none') return;

    CSS_URL.lastIndex = 0;
    let match: RegExpExecArray | null = CSS_URL.exec(value);
    while (match !== null) {
      const url = match[2];
      if (url && url.indexOf('data:') !== 0) urls.push(url);
      match = CSS_URL.exec(value);
    }
  });

  return urls;
}

/** Liste tout ce qu'il faut attendre avant d'afficher le bloc. */
function collectWaits(root: HTMLElement, extra: string[]): Promise<void>[] {
  const waits: Promise<void>[] = [];
  const seen: Record<string, boolean> = {};

  const waitForUrl = (url: string) => {
    if (seen[url]) return;
    seen[url] = true;
    const probe = new window.Image();
    probe.src = url; // même URL que le CSS : le navigateur ne la télécharge qu'une fois
    waits.push(whenImageReady(probe));
  };

  // 1) Balises <img> du premier écran (logo, next/image, etc.)
  root.querySelectorAll('img').forEach((img) => {
    if (isInFirstScreen(img)) waits.push(whenImageReady(img));
  });

  // 2) Fonds CSS : <html>, <body>, les parents du bloc, le bloc et son contenu
  const candidates: Element[] = [document.documentElement, document.body];
  let parent = root.parentElement;
  while (parent && parent !== document.body) {
    candidates.push(parent);
    parent = parent.parentElement;
  }
  candidates.push(root);
  root.querySelectorAll('*').forEach((el) => {
    candidates.push(el);
  });

  candidates.forEach((el) => {
    const isPageRoot = el === document.documentElement || el === document.body;
    if (!isPageRoot && !isInFirstScreen(el)) return;
    backgroundUrls(el).forEach(waitForUrl);
  });

  // 3) URLs fournies à la main
  extra.forEach(waitForUrl);

  return waits;
}

export default function PageReveal({
  children,
  className,
  maxWait = 4000,
  extra,
}: PageRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Clé stable : évite de relancer l'effet si le parent recrée le tableau à chaque rendu.
  const extraKey = extra && extra.length > 0 ? extra.join('\n') : '';

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };

    const limit = Math.min(Math.max(maxWait, 0), HARD_LIMIT);
    const timer = window.setTimeout(reveal, limit);

    const waits = collectWaits(root, extraKey ? extraKey.split('\n') : []);
    Promise.all(waits).then(() => {
      window.clearTimeout(timer);
      reveal();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [maxWait, extraKey]);

  return (
    <div
      ref={rootRef}
      data-ready={ready ? 'true' : 'false'}
      className={className ? `${styles.gate} ${className}` : styles.gate}
    >
      {children}
    </div>
  );
}
