"use client";
// components/logistics/feedback.tsx
// Retours à l'utilisateur : message de confirmation ou d'erreur, panneau d'erreur avec nouvel essai, liste vide, attente.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LogisticsApiError, describeError } from "./api";
import { IconAlertCircle, IconCheck, IconLock, IconRefresh, IconX } from "./icons";
import { cardStyle, ghostButtonStyle } from "./styles";

type Tone = "success" | "error";

/**
 * Message affiché en haut de l'écran après une action. Il reste visible même quand la liste est défilée,
 * et les deux zones (succès, erreur) existent en permanence dans la page pour que les lecteurs d'écran l'annoncent.
 */
export function useFlash(): [ReactNode, (message: string, tone?: Tone) => void] {
  const { t } = useLanguage();
  const [current, setCurrent] = useState<{ message: string; tone: Tone } | null>(null);
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setCurrent(null);
  }, []);

  const flash = useCallback((message: string, tone: Tone = "success") => {
    if (timer.current) window.clearTimeout(timer.current);
    setCurrent({ message, tone });
    // Une erreur demande plus de temps de lecture qu'une confirmation.
    timer.current = window.setTimeout(() => setCurrent(null), tone === "error" ? 10000 : 4000);
  }, []);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const success = current?.tone === "success" ? current.message : "";
  const error = current?.tone === "error" ? current.message : "";
  const node = (
    <div style={{ position: "fixed", top: 16, insetInline: 0, zIndex: 3000, display: "flex", justifyContent: "center", padding: "0 12px", pointerEvents: "none" }}>
      <div role="status" aria-live="polite" className={success ? "lgx-fade" : "lgx-sr"} style={success ? toastStyle("success") : undefined}>
        {success && <><IconCheck size={15} /><span style={{ flex: 1, minWidth: 0 }}>{success}</span><CloseButton label={t("common.close")} onClick={clear} /></>}
      </div>
      <div role="alert" aria-live="assertive" className={error ? "lgx-fade" : "lgx-sr"} style={error ? toastStyle("error") : undefined}>
        {error && <><IconAlertCircle size={16} /><span style={{ flex: 1, minWidth: 0 }}>{error}</span><CloseButton label={t("common.close")} onClick={clear} /></>}
      </div>
    </div>
  );
  return [node, flash];
}

const toastStyle = (tone: Tone): CSSProperties => ({
  pointerEvents: "auto",
  display: "flex", alignItems: "center", gap: 8, maxWidth: "min(640px, 100%)", padding: "10px 14px", borderRadius: 10,
  // Fond opaque du thème + voile coloré : lisible au-dessus de n'importe quel contenu, en clair comme en sombre.
  background: `linear-gradient(${tone === "success" ? "rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.10), rgba(239, 68, 68, 0.10)"}), var(--theme-surface)`,
  border: `1px solid ${tone === "success" ? "var(--theme-success, #059669)" : "var(--theme-danger, #dc2626)"}`,
  color: tone === "success" ? "var(--theme-success, #059669)" : "var(--theme-danger, #dc2626)",
  fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(17, 24, 39, 0.18)",
});

function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="lgx-btn"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, border: "none", borderRadius: 6, background: "transparent", color: "inherit", cursor: "pointer" }}>
      <IconX size={14} />
    </button>
  );
}

/** Lecture en échec : le message du serveur (droit insuffisant, serveur injoignable…) et un bouton pour réessayer. */
export function ErrorPanel({ error, onRetry, busy = false, compact = false }: { error: LogisticsApiError; onRetry: () => void; busy?: boolean; compact?: boolean }) {
  const { t, language } = useLanguage();
  const denied = error.status === 403;
  const Icon = denied ? IconLock : IconAlertCircle;
  return (
    <div role="alert" style={{
      ...cardStyle, borderColor: "var(--theme-danger, #dc2626)", padding: compact ? "12px 14px" : "24px 20px",
      display: "flex", flexDirection: compact ? "row" : "column", alignItems: "center", gap: compact ? 12 : 10,
      textAlign: compact ? "start" : "center", flexWrap: "wrap", marginBottom: 16,
    }}>
      <Icon size={compact ? 20 : 34} color="var(--theme-danger, #dc2626)" />
      <div style={{ flex: compact ? "1 1 220px" : undefined, minWidth: 0 }}>
        <p style={{ color: "var(--theme-text)", fontSize: compact ? 14 : 16, fontWeight: 600 }}>
          {denied ? t("logistics.accessDeniedTitle") : t("logistics.loadErrorTitle")}
        </p>
        <p style={{ color: "var(--theme-text-secondary)", fontSize: 13, marginTop: 2, overflowWrap: "anywhere" }}>{describeError(error, t, language)}</p>
      </div>
      <button type="button" className="lgx-btn" onClick={onRetry} disabled={busy} style={{ ...ghostButtonStyle, minHeight: 38 }}>
        <IconRefresh size={14} />
        {t("logistics.retry")}
      </button>
    </div>
  );
}

export function EmptyState({ icon, message, action }: { icon: ReactNode; message: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 16px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, opacity: 0.3, color: "var(--theme-text)" }}>{icon}</div>
      <p style={{ color: "var(--theme-text-secondary)", fontSize: 14 }}>{message}</p>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

/** Lignes grisées pendant le premier chargement : la page garde sa forme, sans écran blanc. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  const { t } = useLanguage();
  return (
    <div aria-busy="true" style={{ ...cardStyle, padding: 16 }}>
      <span className="lgx-sr" role="status">{t("common.loading")}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderTop: i ? "1px solid var(--theme-surface-hover)" : "none" }}>
          <div className="lgx-skeleton" style={{ width: 16, height: 16 }} />
          <div className="lgx-skeleton" style={{ flex: 2, height: 12 }} />
          <div className="lgx-skeleton" style={{ flex: 1, height: 12 }} />
          <div className="lgx-skeleton" style={{ flex: 1, height: 12 }} />
        </div>
      ))}
    </div>
  );
}
