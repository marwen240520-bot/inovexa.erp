"use client";
// components/logistics/Dialog.tsx
// Fenêtre modale du module (même aspect que l'ancienne page : carte arrondie, titre avec pictogramme),
// avec ce qui lui manquait : fermeture par Échap, focus gardé dans la fenêtre puis rendu au bouton d'origine.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconAlertCircle } from "./icons";
import { ghostButtonStyle, primaryButtonStyle } from "./styles";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ title, icon, onClose, busy = false, dismissOnBackdrop = false, width = 480, children }: {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  /** Une demande est en cours : la fenêtre ne se ferme pas tant que le serveur n'a pas répondu. */
  busy?: boolean;
  /** Un clic à côté ferme la fenêtre (confirmation) ; désactivé pour les formulaires, pour ne pas perdre une saisie. */
  dismissOnBackdrop?: boolean;
  width?: number;
  children: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Toujours la dernière version de onClose / busy, sans réinstaller les écouteurs à chaque rendu.
  const latest = useRef({ onClose, busy });
  useEffect(() => { latest.current = { onClose, busy }; });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") || node?.querySelector<HTMLElement>(FOCUSABLE);
    (first || node)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!latest.current.busy) latest.current.onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); return; }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstItem || !node.contains(active))) { e.preventDefault(); lastItem.focus(); }
      else if (!e.shiftKey && (active === lastItem || !node.contains(active))) { e.preventDefault(); firstItem.focus(); }
    };
    document.addEventListener("keydown", onKey);

    // La page derrière ne défile pas pendant que la fenêtre est ouverte.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="lgx lgx-fade"
      onMouseDown={(e) => { if (dismissOnBackdrop && !busy && e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 2500, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          width: "100%", maxWidth: width, maxHeight: "88vh", overflowY: "auto",
          background: "var(--theme-surface)", color: "var(--theme-text)", border: "1px solid var(--theme-border)", borderRadius: 20,
          padding: "clamp(18px, 4vw, 28px)", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)", outline: "none",
        }}
      >
        <h2 id={titleId} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: "clamp(18px, 2.4vw, 20px)", fontWeight: 700, color: "var(--theme-text)" }}>
          {icon}
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Message d'erreur d'un formulaire (validation ou réponse du serveur), annoncé dès qu'il apparaît. */
export function FormAlert({ message }: { message: string | null }) {
  return (
    <div role="alert" aria-live="assertive">
      {message && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 12, borderRadius: 10, fontSize: 13,
          background: "rgba(239, 68, 68, 0.10)", border: "1px solid var(--theme-danger, #dc2626)", color: "var(--theme-danger, #dc2626)",
        }}>
          <IconAlertCircle size={16} style={{ marginTop: 1 }} />
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{message}</span>
        </div>
      )}
    </div>
  );
}

/** Confirmation d'une action irréversible. Le bouton « Annuler » reçoit le focus : Entrée ne supprime rien par mégarde. */
export function ConfirmDialog({ title, message, detail, confirmLabel, cancelLabel, busy, onConfirm, onCancel }: {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog title={title} icon={<IconAlertCircle size={20} color="var(--theme-danger, #dc2626)" />} onClose={onCancel} busy={busy} dismissOnBackdrop width={420}>
      <p style={{ color: "var(--theme-text)", fontSize: 14 }}>{message}</p>
      {detail && <p style={{ color: "var(--theme-text-secondary)", fontSize: 13, marginTop: 6 }}>{detail}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button type="button" data-autofocus className="lgx-btn" onClick={onCancel} disabled={busy} style={{ ...ghostButtonStyle, flex: "1 1 120px" }}>
          {cancelLabel}
        </button>
        <button type="button" className="lgx-btn" onClick={onConfirm} disabled={busy} aria-busy={busy}
          style={{ ...primaryButtonStyle, flex: "1 1 120px", background: "var(--theme-danger-solid, #dc2626)" }}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
