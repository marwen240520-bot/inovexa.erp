"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunkError";

type Lang = "fr" | "en" | "es";

const TEXTS: Record<Lang, {
  title: string; chunkTitle: string; chunk: string; reloading: string; retry: string; reload: string; unexpected: string;
}> = {
  fr: {
    title: "Une erreur est survenue",
    chunkTitle: "La page n’a pas pu se charger",
    chunk: "Une nouvelle version du site vient peut-être d’être publiée, ou la connexion s’est coupée pendant le chargement. Rechargez la page pour continuer.",
    reloading: "Rechargement de la page…",
    retry: "Réessayer",
    reload: "Recharger la page",
    unexpected: "Erreur inattendue",
  },
  en: {
    title: "Something went wrong",
    chunkTitle: "The page could not be loaded",
    chunk: "A new version of the site may have just been published, or the connection dropped while loading. Reload the page to continue.",
    reloading: "Reloading the page…",
    retry: "Try again",
    reload: "Reload the page",
    unexpected: "Unexpected error",
  },
  es: {
    title: "Se ha producido un error",
    chunkTitle: "No se pudo cargar la página",
    chunk: "Quizá se acaba de publicar una nueva versión del sitio, o se cortó la conexión durante la carga. Recargue la página para continuar.",
    reloading: "Recargando la página…",
    retry: "Reintentar",
    reload: "Recargar la página",
    unexpected: "Error inesperado",
  },
};

/**
 * Page d'erreur commune (accueil, tableau de bord, espaces administrateur et transporteur).
 * Un échec de chargement de fichier (« Loading chunk … failed ») recharge la page tout seul, une fois ;
 * « Réessayer » recharge alors la page au lieu de relancer l'affichage, qui échouerait de la même façon.
 * Dans le tableau de bord, la page d'erreur s'affiche dans la zone de contenu : le menu reste utilisable.
 */
export default function ErrorPanel({
  error,
  reset,
  fullScreen = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  fullScreen?: boolean;
}) {
  const { language } = useLanguage();
  const L = TEXTS[(language as Lang) in TEXTS ? (language as Lang) : "fr"];
  const chunk = isChunkLoadError(error);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    console.error(error);
    if (chunk && reloadOnceForChunkError()) setReloading(true);
  }, [error, chunk]);

  return (
    <div
      role="alert"
      style={{
        minHeight: fullScreen ? "100vh" : "60vh",
        background: fullScreen ? "var(--theme-background)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "20px",
        padding: "20px",
      }}
    >
      <div style={{ fontSize: "64px" }} aria-hidden="true">😵</div>
      <h1 style={{ color: "var(--theme-text)", fontSize: "24px", textAlign: "center" }}>
        {chunk ? L.chunkTitle : L.title}
      </h1>
      <p style={{ color: "var(--theme-text-secondary)", textAlign: "center", maxWidth: "500px" }}>
        {reloading ? L.reloading : chunk ? L.chunk : error.message || L.unexpected}
      </p>
      {!reloading && (
        <button
          type="button"
          onClick={() => (chunk ? window.location.reload() : reset())}
          style={{
            padding: "12px 24px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {chunk ? L.reload : L.retry}
        </button>
      )}
    </div>
  );
}
