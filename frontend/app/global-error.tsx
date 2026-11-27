"use client";

import { useEffect, useState } from "react";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunkError";

const TEXTS = {
  fr: { title: "Erreur globale", chunk: "La page n’a pas pu se charger (nouvelle version publiée ou connexion coupée). Rechargez la page pour continuer.", reloading: "Rechargement de la page…", retry: "Réessayer" },
  en: { title: "Global error", chunk: "The page could not be loaded (new version published or connection dropped). Reload the page to continue.", reloading: "Reloading the page…", retry: "Try again" },
  es: { title: "Error global", chunk: "No se pudo cargar la página (nueva versión publicada o conexión cortada). Recargue la página para continuar.", reloading: "Recargando la página…", retry: "Reintentar" },
} as const;

function pickLang(): keyof typeof TEXTS {
  try {
    const l = (document.documentElement.lang || window.localStorage.getItem("language") || "fr").slice(0, 2);
    return l === "en" || l === "es" ? l : "fr";
  } catch {
    return "fr";
  }
}

export default function GlobalError({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunk = isChunkLoadError(error);
  const [reloading, setReloading] = useState(false);
  const [lang, setLang] = useState<keyof typeof TEXTS>("fr");

  useEffect(() => {
    setLang(pickLang());
    if (chunk && reloadOnceForChunkError()) setReloading(true);
  }, [chunk]);

  const L = TEXTS[lang];
  return (
    <html lang={lang}>
      <body>
        <div style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "20px"
        }}>
          <h1 style={{ color: "#111827" }}>{L.title}</h1>
          <p style={{ color: "#6b7280", textAlign: "center", maxWidth: "500px" }}>
            {reloading ? L.reloading : chunk ? L.chunk : error.message}
          </p>
          {!reloading && (
            <button onClick={() => window.location.reload()} style={{
              padding: "10px 20px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}>{L.retry}</button>
          )}
        </div>
      </body>
    </html>
  );
}
