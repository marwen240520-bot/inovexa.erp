"use client";
/**
 * Briques communes des écrans de configuration de l'administrateur de la plateforme
 * (formules, paiements, réglages, journal). Ces écrans sont en français uniquement.
 */
import React, { CSSProperties, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Btn, Modal } from "@/components/erp/kit";
import type { SubscriptionPayment } from "@/lib/saas";

/** Langue des formats (montants, dates) : l'espace administrateur n'est pas traduit. */
export const LANG = "fr";

// ───────────── Types des réponses de l'API (docs/SAAS-API.md) ─────────────

/** Réglages renvoyés par GET /admin/settings. */
export interface AdminSettings {
  trialHours: number; trialReminderHours: number; renewalReminderDays: number; requireEmailVerification: boolean;
  currency: string; vatRate: number; paymentInstructions: string | null; paymentMethods: string[] | null;
  supportEmail: string | null; supportPhone: string | null; supportWhatsapp: string | null;
  /** Identité légale de l’éditeur, imprimée sur les reçus de paiement (vide = en-tête « Inovexa ERP » seul). */
  issuerName?: string | null; issuerTaxId?: string | null; issuerAddress?: string | null; issuerRegistry?: string | null;
  /** Lien https de la page de paiement par carte (prestataire de l'éditeur) ; null = non renseigné. */
  paymentLink?: string | null;
  /** Version du contenu de départ (secteurs, formules proposées) installée dans cette base. */
  catalogVersion?: number;
  appleConfigured?: boolean; mailConfigured?: boolean;
  /** true : en plus de la carte, les clients peuvent déclarer un paiement hors ligne que l'administrateur valide. */
  manualPayments?: boolean;
  /**
   * Paiement en ligne (Flouci : carte bancaire ou application), configuré par les variables d'environnement du serveur.
   * charge : Flouci débite en dinars, au taux « rate » (1 unité de la devise des formules = rate TND) ; null = devise non encaissable.
   */
  onlinePayment?: {
    enabled: boolean; provider: string; mode: "production" | "sandbox"; methods: string[];
    charge?: { currency: string; rate: number } | null;
    reason: "NOT_CONFIGURED" | "CURRENCY_UNSUPPORTED" | null;
  };
  /** Le code de vérification par email est réellement demandé (réglage actif ET envoi d'emails configuré). */
  emailVerificationActive?: boolean;
  /** Calculés par le serveur, en lecture seule (absents de la réponse de PUT /admin/settings). */
  googleConfigured: boolean; paymentMethodOptions: string[]; moduleKeys: string[];
}

/** GET /admin/online-payment : ce qu'il reste à régler avant d'encaisser de vrais clients (sans appeler Flouci). */
export interface OnlineReadiness {
  enabled: boolean; mode: "production" | "sandbox"; provider: string;
  /** Adresse que Flouci appelle après chaque paiement (transmise à Flouci à chaque paiement). */
  webhookUrl: string; siteUrls: string[];
  /** Un client peut payer. */
  ready: boolean;
  /** De vrais paiements, et rien d'important à corriger. */
  live: boolean;
  checks: Array<{ key: string; ok: boolean; level: "error" | "warn"; message: string }>;
}

/** GET /admin/security : contrôles de sécurité de la configuration du serveur (jamais de secret dans la réponse). */
export interface SecurityReport {
  ok: boolean; errors: number; warnings: number; production: boolean;
  checks: Array<{ key: string; ok: boolean; level: "error" | "warn"; message: string }>;
}

/**
 * POST /admin/online-payment/test : résultat du test de connexion à Flouci (null = non vérifié).
 * checkoutAccepted : ouverture d'un paiement de test de 1 TND acceptée (seulement quand ce test est demandé).
 */
export interface ConnectionTest {
  provider: string; mode: "production" | "sandbox"; configured: boolean;
  reachable: boolean | null; keyAccepted: boolean | null; checkoutAccepted: boolean | null; message: string;
}

export interface AccountRef { id: number; email: string | null; name: string | null; companyName: string | null }

export interface AdminPayment extends SubscriptionPayment { account: AccountRef }

export interface Paged<T> { total: number; limit: number; offset: number; items: T[] }

// ───────────── Libellés ─────────────

export const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virement bancaire", d17: "D17 (La Poste)", flouci: "Flouci", edinar: "Carte e-Dinar", postal: "Mandat minute",
  cheque: "Chèque", cash: "Espèces", card: "Carte bancaire", other: "Autre",
};
export const methodLabel = (method: string | null | undefined) => (method ? METHOD_LABELS[method] || method : "—");

export const cycleLabel = (cycle: string | null | undefined) => (cycle === "annual" ? "Annuel" : cycle === "monthly" ? "Mensuel" : cycle || "—");

/** Nom affiché d'un compte : la société d'abord, sinon la personne, sinon l'adresse. */
export const accountLabel = (a: AccountRef | null | undefined) => (a ? a.companyName || a.name || a.email || `Compte n° ${a.id}` : "—");

export const errorText = (e: unknown, fallback = "Une erreur est survenue.") => (e instanceof Error && e.message ? e.message : fallback);

export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

// ───────────── Styles ─────────────

export const linkStyle: CSSProperties = { color: "var(--theme-primary, #4f46e5)", fontWeight: 600, textDecoration: "none" };
export const mutedStyle: CSSProperties = { color: "var(--theme-text-secondary)", fontSize: 13 };
export const helpStyle: CSSProperties = { margin: 0, color: "var(--theme-text-secondary)", fontSize: 13, lineHeight: 1.5 };
export const codeStyle: CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 12.5 };
/** La feuille globale donne « width: 100 % » à tous les <input> : une case à cocher doit reprendre sa taille. */
export const boxStyle: CSSProperties = { width: 18, height: 18, minWidth: 18, padding: 0, margin: 0, flex: "0 0 auto", accentColor: "var(--theme-primary, #4f46e5)", cursor: "inherit" };

// ───────────── Composants ─────────────

/** Champ de formulaire : libellé, aide et erreur dans le flux (ils se replient proprement sur un téléphone). */
export function FormField({ label, hint, error, grow = true, basis = 220, children }: {
  label: string; hint?: ReactNode; error?: string | null; grow?: boolean; basis?: number; children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: grow ? `1 1 ${basis}px` : "0 1 auto", minWidth: 0 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)" }}>{label}</span>
        {children}
      </label>
      {hint && <span style={{ fontSize: 12, lineHeight: 1.4, color: "var(--theme-text-secondary)" }}>{hint}</span>}
      {error && <span role="alert" style={{ fontSize: 12, lineHeight: 1.4, fontWeight: 600, color: "var(--theme-danger, #ef4444)" }}>{error}</span>}
    </div>
  );
}

/** Case à cocher (ou bouton radio) avec son libellé cliquable et une aide facultative. */
export function Check({ checked, onChange, label, hint, disabled, type = "checkbox", name }: {
  checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean; type?: "checkbox" | "radio"; name?: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, minWidth: 0 }}>
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ ...boxStyle, marginTop: 1 }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {hint && <span style={{ display: "block", marginTop: 2, fontSize: 12.5, lineHeight: 1.45, color: "var(--theme-text-secondary)" }}>{hint}</span>}
      </span>
    </label>
  );
}

/** Erreur affichée dans une fenêtre ou une section (annoncée aux lecteurs d'écran). */
export function InlineError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--theme-danger, #ef4444)", color: "var(--theme-danger, #ef4444)", fontSize: 13.5, lineHeight: 1.45 }}>
      {children}
    </div>
  );
}

/** Demande de confirmation avant une action qui engage (validation d'un paiement, suppression, publication…). */
export function ConfirmModal({ title, children, confirmLabel, variant = "primary", busy, error, onConfirm, onCancel, width = 520 }: {
  title: string; children: ReactNode; confirmLabel: string; variant?: "primary" | "danger" | "success"; busy?: boolean; error?: string | null;
  onConfirm: () => void; onCancel: () => void; width?: number;
}) {
  return (
    <Modal
      title={title}
      width={width}
      onClose={() => { if (!busy) onCancel(); }}
      footer={<><Btn onClick={onCancel} disabled={busy}>Annuler</Btn><Btn variant={variant} busy={busy} onClick={onConfirm}>{confirmLabel}</Btn></>}
    >
      {children}
      {error && <InlineError>{error}</InlineError>}
    </Modal>
  );
}

/** Pagination côté serveur : « 1–25 sur 97 », Précédent / Suivant. */
export function Pager({ total, limit, offset, onChange, busy }: { total: number; limit: number; offset: number; onChange: (offset: number) => void; busy?: boolean }) {
  if (total <= 0) return null;
  const from = Math.min(offset + 1, total);
  const to = Math.min(offset + limit, total);
  const single = offset === 0 && total <= limit;
  return (
    <nav aria-label="Pagination" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 16px", borderTop: "1px solid var(--theme-border)", fontSize: 13, color: "var(--theme-text-secondary)" }}>
      <span aria-live="polite">{from}–{to} sur {total}</span>
      {!single && (
        <span style={{ display: "flex", gap: 8 }}>
          <Btn disabled={busy || offset <= 0} onClick={() => onChange(Math.max(0, offset - limit))}>Précédent</Btn>
          <Btn disabled={busy || offset + limit >= total} onClick={() => onChange(offset + limit)}>Suivant</Btn>
        </span>
      )}
    </nav>
  );
}

/** Lien vers la fiche d'un compte : société en gras, adresse en dessous. */
export function AccountLink({ account }: { account: AccountRef }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", minWidth: 0 }}>
      <Link href={`/admin/accounts/${account.id}`} style={linkStyle}>{accountLabel(account)}</Link>
      {account.email && account.email !== accountLabel(account) && <span style={{ ...mutedStyle, overflowWrap: "anywhere" }}>{account.email}</span>}
    </span>
  );
}

/** Valeur stabilisée après un court délai sans frappe : évite une requête par caractère dans une recherche. */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
