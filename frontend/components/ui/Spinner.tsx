"use client";

import React from "react";

type SpinnerProps = {
  /** Diamètre en px (défaut 44). */
  size?: number;
  /** Épaisseur de l'anneau en px (défaut 3). */
  thickness?: number;
  /** Centre le spinner dans un overlay plein écran (écrans de chargement de page). */
  fullScreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Spinner UNIQUE de l'application — sans texte, thémé via les variables CSS
 * (--theme-primary / --theme-background), donc cohérent dans tous les thèmes.
 *
 * Usage :
 *   - écran de chargement de page : <Spinner fullScreen />
 *   - inline (bouton, carte)      : <Spinner size={18} />
 */
export default function Spinner({
  size = 44,
  thickness = 3,
  fullScreen = false,
  className,
  style,
}: SpinnerProps) {
  const ring = (
    <span
      role="status"
      aria-label="loading"
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `${thickness}px solid rgba(102, 126, 234, 0.18)`,
        borderTopColor: "var(--theme-primary, #667eea)",
        borderRadius: "50%",
        animation: "inovexa-spin 0.8s linear infinite",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );

  const keyframes = (
    <style>{"@keyframes inovexa-spin { to { transform: rotate(360deg); } }"}</style>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--theme-background, #0a0a0a)",
        }}
      >
        {ring}
        {keyframes}
      </div>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ring}
      {keyframes}
    </span>
  );
}
