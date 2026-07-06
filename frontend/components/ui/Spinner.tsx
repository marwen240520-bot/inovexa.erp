"use client";

import React from "react";

type SpinnerProps = {
  /** Diamètre en px (défaut 44, 84 en fullScreen). */
  size?: number;
  /** Conservé pour compatibilité (non utilisé par le loader logo). */
  thickness?: number;
  /** Centre le loader dans un overlay plein écran (écrans de chargement de page). */
  fullScreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Loader UNIQUE de l'application — le logo Inovexa en rotation 3D,
 * cohérent avec l'animation du logo de la page d'accueil.
 *
 * Usage :
 *   - écran de chargement de page : <Spinner fullScreen />
 *   - inline (bouton, carte)      : <Spinner size={18} />
 */
export default function Spinner({
  size,
  fullScreen = false,
  className,
  style,
}: SpinnerProps) {
  const finalSize = size ?? (fullScreen ? 84 : 44);

  const logo = (
    <span
      role="status"
      aria-label="loading"
      className={className}
      style={{
        display: "inline-block",
        width: finalSize,
        height: finalSize,
        perspective: `${finalSize * 8}px`,
        ...style,
      }}
    >
      <img
        src="/images/logo.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          animation: "inovexa-logo-spin 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
          filter: "drop-shadow(0 0 12px rgba(138, 43, 226, 0.55))",
          willChange: "transform",
          userSelect: "none",
        }}
      />
    </span>
  );

  const keyframes = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes inovexa-logo-spin {
        0%   { transform: rotateY(0deg); }
        100% { transform: rotateY(360deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        [role="status"] img { animation: inovexa-logo-pulse 1.6s ease-in-out infinite !important; }
      }
      @keyframes inovexa-logo-pulse {
        0%, 100% { opacity: 0.45; }
        50%      { opacity: 1; }
      }
    `,
      }}
    />
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
        {logo}
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
      {logo}
      {keyframes}
    </span>
  );
}
