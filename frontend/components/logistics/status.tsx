"use client";
// components/logistics/status.tsx
// Statuts d'un envoi : libellé, couleur et pictogramme, les mêmes sur les trois pages.
import type { CSSProperties, ReactNode } from "react";
import { IconCheckCircle, IconClock, IconPackage, IconTruck, IconXCircle, type IconProps } from "./icons";
import { SHIPMENT_STATUSES, isShipmentStatus, type ShipmentStatus } from "./types";

type Translate = (key: string) => string;

interface StatusMeta {
  labelKey: string;
  /** Couleur de texte lisible sur le fond du thème (clair et sombre). */
  color: string;
  /** Fond léger de la pastille. */
  tint: string;
  Icon: (props: IconProps) => ReactNode;
}

export const STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  pending: { labelKey: "common.pending", color: "var(--theme-warning, #b45309)", tint: "rgba(245, 158, 11, 0.14)", Icon: IconClock },
  in_transit: { labelKey: "common.inTransit", color: "var(--theme-info, #2563eb)", tint: "rgba(59, 130, 246, 0.14)", Icon: IconTruck },
  delivered: { labelKey: "common.delivered", color: "var(--theme-success, #059669)", tint: "rgba(16, 185, 129, 0.14)", Icon: IconCheckCircle },
  cancelled: { labelKey: "common.cancelled", color: "var(--theme-danger, #dc2626)", tint: "rgba(239, 68, 68, 0.12)", Icon: IconXCircle },
};

// Statut inconnu (donnée ancienne) : affiché tel quel, en gris, plutôt que maquillé en statut connu.
const UNKNOWN_META: Omit<StatusMeta, "labelKey"> = { color: "var(--theme-text-secondary)", tint: "var(--theme-surface-hover)", Icon: IconPackage };

export const statusMeta = (status: string): Omit<StatusMeta, "labelKey"> => (isShipmentStatus(status) ? STATUS_META[status] : UNKNOWN_META);

export const statusLabel = (t: Translate, status: string): string => (isShipmentStatus(status) ? t(STATUS_META[status].labelKey) : status);

/**
 * Couleurs des graphiques (un canvas ne lit pas les variables CSS). Les deux jeux ont été vérifiés pour rester
 * distincts côte à côte, y compris pour une vision daltonienne, sur le fond clair et sur le fond sombre.
 */
export const STATUS_CHART_COLORS: Record<"light" | "dark", Record<ShipmentStatus, string>> = {
  light: { pending: "#a2660a", in_transit: "#176af6", delivered: "#0c835d", cancelled: "#e11010" },
  dark: { pending: "#d97706", in_transit: "#3b82f6", delivered: "#10b981", cancelled: "#ef4444" },
};

const pillStyle = (status: string): CSSProperties => {
  const meta = statusMeta(status);
  return {
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 16,
    background: meta.tint, color: meta.color, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  };
};

export function StatusBadge({ status, t }: { status: string; t: Translate }) {
  const { Icon } = statusMeta(status);
  return (
    <span style={pillStyle(status)}>
      <Icon size={13} />
      {statusLabel(t, status)}
    </span>
  );
}

/**
 * Changement rapide du statut depuis la liste. La liste déroulante porte la couleur du statut courant ;
 * elle est désactivée pendant l'envoi de la modification.
 */
export function StatusSelect({ status, label, busy, onChange, t }: { status: string; label: string; busy: boolean; onChange: (next: ShipmentStatus) => void; t: Translate }) {
  const meta = statusMeta(status);
  const optionStyle: CSSProperties = { color: "var(--theme-text)", background: "var(--theme-surface)" };
  return (
    <select
      aria-label={label}
      title={label}
      value={status}
      disabled={busy}
      onChange={(e) => { if (isShipmentStatus(e.target.value) && e.target.value !== status) onChange(e.target.value); }}
      style={{
        width: "auto", maxWidth: "100%", padding: "4px 8px", borderRadius: 16, border: `1px solid ${meta.color}`,
        background: meta.tint, color: meta.color, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
        cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1,
      }}
    >
      {!isShipmentStatus(status) && <option value={status} disabled style={optionStyle}>{status}</option>}
      {SHIPMENT_STATUSES.map((s) => <option key={s} value={s} style={optionStyle}>{t(STATUS_META[s].labelKey)}</option>)}
    </select>
  );
}
