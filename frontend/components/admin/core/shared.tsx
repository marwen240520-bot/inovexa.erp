"use client";
/**
 * Pièces communes de l'espace administrateur (tableau de bord, comptes clients) :
 * formes des réponses de l'API, libellés français des états, formats de date et de durée.
 * Ces écrans sont en français uniquement (voir docs/SAAS-API.md).
 */
import React, { ReactNode } from "react";
import { Badge } from "@/components/erp/kit";
import type { AccountState } from "@/lib/session";
import { CORE_MODULES, formatDateTime, type SubscriptionPayment } from "@/lib/saas";

export type AccountStatus = AccountState["status"];
type Tone = "gray" | "green" | "red" | "amber" | "blue" | "violet";

// ───────────── Réponses de l'API ─────────────

/** Une ligne de GET /admin/accounts. */
export interface AdminAccountRow {
  id: number;
  email: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  sector: string | null;
  signupSource: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  modules: Record<string, boolean>;
  account: AccountState;
  users: number;
  paymentStatus: "pending" | "paid" | "none";
  totalPaid: number;
}

export interface AccountsResponse { total: number; limit: number; offset: number; items: AdminAccountRow[] }

export interface AccountCompany {
  legalName: string | null; tradeName: string | null; legalForm: string | null; taxId: string | null;
  address: string | null; city: string | null; postalCode: string | null; country: string | null;
  phone: string | null; email: string | null; website: string | null;
}

export interface TeamMember { id: number; email: string; name: string; role: string; isActive: boolean; lastLoginAt: string | null; createdAt: string }

export interface ActivityEntry {
  id: number; actorEmail: string | null; action: string; entity: string | null; entityId: string | null;
  method: string | null; path: string | null; status: number | null; createdAt: string;
}

/** GET /admin/accounts/:id. */
export interface AdminAccountDetail {
  id: number;
  email: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  sector: string | null;
  signupSource: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  googleLinked: boolean;
  appleLinked?: boolean;
  modules: Record<string, boolean>;
  account: AccountState;
  company: AccountCompany | null;
  team: TeamMember[];
  payments: SubscriptionPayment[];
  activity: ActivityEntry[];
  usage: Record<string, number>;
}

/** Ce dont les fenêtres d'action ont besoin pour agir sur un compte (liste comme fiche). */
export interface ActionTarget { id: number; label: string; account: AccountState }

// ───────────── États ─────────────

/** Ordre d'affichage des états dans les filtres et les légendes. */
export const STATUS_ORDER: AccountStatus[] = ["TRIAL", "ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"];

export const STATUS_META: Record<AccountStatus, { label: string; tone: Tone }> = {
  TRIAL: { label: "Essai gratuit", tone: "violet" },
  ACTIVE: { label: "Actif", tone: "green" },
  EXPIRED: { label: "Expiré", tone: "amber" },
  SUSPENDED: { label: "Suspendu", tone: "red" },
  CANCELLED: { label: "Résilié", tone: "gray" },
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const meta = STATUS_META[status] || { label: status, tone: "gray" as Tone };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/**
 * La liste des comptes présente comme « Suspendu » un compte dont la connexion a été désactivée depuis l'ancien écran
 * (isActive = false). La fiche renvoie l'état brut : on applique ici la même lecture pour que les deux écrans concordent.
 */
export function effectiveStatus(status: AccountStatus, isActive: boolean): AccountStatus {
  return isActive === false && status !== "CANCELLED" ? "SUSPENDED" : status;
}

export const SOURCE_LABELS: Record<string, string> = {
  self: "Inscription en ligne",
  google: "Inscription avec Google",
  apple: "Inscription avec Apple",
  admin: "Créé par l’administrateur",
};
export const sourceLabel = (source: string | null | undefined) => (source ? SOURCE_LABELS[source] || source : "—");

export const CYCLE_LABELS: Record<string, string> = { monthly: "Mensuel", annual: "Annuel" };

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virement bancaire", d17: "D17 (La Poste)", flouci: "Flouci", edinar: "Carte e-Dinar", postal: "Mandat minute",
  cheque: "Chèque", cash: "Espèces", card: "Carte bancaire", other: "Autre",
};

/** État d'un paiement d'abonnement. */
export const PAYMENT_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "À valider (hors ligne)", tone: "amber" },
  validated: { label: "Encaissé", tone: "green" },
  rejected: { label: "Refusé", tone: "red" },
  cancelled: { label: "Annulé", tone: "gray" },
  initiated: { label: "Paiement en cours", tone: "amber" },
  expired: { label: "Expiré", tone: "gray" },
  refunded: { label: "Remboursé", tone: "violet" },
};

/** Synthèse des paiements d'un compte dans la liste (aucun / en attente / payé). */
export const ACCOUNT_PAYMENT_META: Record<AdminAccountRow["paymentStatus"], { label: string; tone: Tone }> = {
  none: { label: "Aucun paiement", tone: "gray" },
  pending: { label: "En attente", tone: "amber" },
  paid: { label: "Payé", tone: "green" },
};

export const TEAM_ROLE_LABELS: Record<string, string> = {
  manager: "Gestionnaire", sales: "Commercial", accountant: "Comptable", storekeeper: "Magasinier", viewer: "Lecture seule",
  employee: "Employé", transporteur: "Transporteur", client: "Propriétaire",
};

// ───────────── Formats ─────────────

/** Date et heure à Tunis, en français. */
export const dateTimeFr = (value: string | Date | null | undefined) => formatDateTime(value, "fr");
/** Date seule à Tunis, en français. */
export const dateFr = (value: string | Date | null | undefined) => formatDateTime(value, "fr", false);

/** « 2 j 5 h », « 5 h 12 min », « 12 min » — à partir des secondes restantes calculées par le serveur. */
export function remainingFr(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "";
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return "moins d’une minute";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return h > 0 ? `${d} j ${h} h` : `${d} j`;
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
  return `${m} min`;
}

/** « 72 h = 3 jours », « 36 h = 1 jour 12 h ». */
export function hoursAsDays(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "";
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  if (d === 0) return `${h} h`;
  const days = `${d} jour${d > 1 ? "s" : ""}`;
  return h ? `${days} ${h} h` : days;
}

const TUNIS_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", year: "numeric", month: "2-digit", day: "2-digit" });

/** Jour (AAAA-MM-JJ) à Tunis d'une date ISO : valeur d'un champ de type date. */
export function tunisDay(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : TUNIS_DAY.format(d);
}

/**
 * Fin de journée à Tunis pour un jour AAAA-MM-JJ. La Tunisie est à UTC+1 toute l'année (pas d'heure d'été) :
 * une échéance « au 30 juin » couvre ainsi tout le 30 juin, au lieu de s'arrêter à 1 h du matin.
 */
export const endOfDayTunisISO = (day: string) => new Date(`${day}T23:59:59+01:00`).toISOString();

/** Échéance à afficher pour un compte : libellé, date et temps restant (vide s'il n'y a pas de décompte). */
export function periodInfo(a: AccountState): { label: string; date: string | null; remaining: string; hint?: string } {
  switch (a.status) {
    case "TRIAL":
      return { label: "Fin de l’essai", date: a.trialEndsAt, remaining: remainingFr(a.remainingSeconds) };
    case "ACTIVE":
      if (!a.subscriptionEnd) return { label: "Sans échéance", date: null, remaining: "" };
      if (!a.expiryEnforced) return { label: "Fin d’abonnement", date: a.subscriptionEnd, remaining: "", hint: "à titre indicatif" };
      return { label: "Fin de l’abonnement", date: a.subscriptionEnd, remaining: remainingFr(a.remainingSeconds) };
    case "EXPIRED":
      return a.reason === "SUBSCRIPTION_EXPIRED"
        ? { label: "Abonnement échu le", date: a.subscriptionEnd ?? a.endsAt, remaining: "" }
        : { label: "Essai terminé le", date: a.trialEndsAt ?? a.endsAt, remaining: "" };
    default:
      // Suspendu ou résilié : pas de décompte, on rappelle seulement l'échéance connue.
      if (a.subscriptionEnd) return { label: "Abonnement jusqu’au", date: a.subscriptionEnd, remaining: "" };
      if (a.trialEndsAt) return { label: "Essai jusqu’au", date: a.trialEndsAt, remaining: "" };
      return { label: "", date: null, remaining: "" };
  }
}

// ───────────── Modules ─────────────

/**
 * Un module est-il ouvert pour ce compte ? Même règle que le serveur (backend/src/modules/auth/access.guard.ts) :
 * configuration vide = tout est ouvert ; objectifs ouverts sauf refus explicite ; caisse = ventes ou achats si non précisée.
 */
export function isModuleOn(modules: Record<string, boolean> | null | undefined, key: string): boolean {
  if (CORE_MODULES.includes(key)) return true;
  if (!modules || Object.keys(modules).length === 0) return true;
  if (key === "objectives") return modules.objectives !== false;
  if (key === "pos" && modules.pos === undefined) return modules.sales === true || modules.purchases === true;
  return modules[key] === true;
}

// ───────────── Petits composants ─────────────

/** Paire « libellé : valeur » des fiches. */
export function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <dt style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{label}</dt>
      <dd style={{ margin: "2px 0 0", fontSize: 14, color: "var(--theme-text)", overflowWrap: "anywhere" }}>{children}</dd>
    </div>
  );
}

/** Grille de paires « libellé : valeur » qui se replie d'elle-même sur téléphone. */
export function InfoGrid({ children, min = 200 }: { children: ReactNode; min?: number }) {
  return <dl style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: "14px 20px", margin: 0 }}>{children}</dl>;
}

/** Lien discret aux couleurs du thème. */
export const linkStyle: React.CSSProperties = { color: "var(--theme-primary-text, var(--theme-primary))", textDecoration: "none", fontWeight: 600 };
