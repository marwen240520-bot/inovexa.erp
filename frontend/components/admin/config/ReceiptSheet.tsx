"use client";
/** Reçu d'un paiement d'abonnement validé : affichage à l'écran et copie réservée à l'impression. */
import React, { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatDateTime, formatMoney, type Receipt } from "@/lib/saas";
import { LANG, cycleLabel, methodLabel } from "./shared";

const row: CSSProperties = { display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2px 16px", padding: "7px 0", borderTop: "1px solid var(--theme-border)", fontSize: 14 };
const label: CSSProperties = { color: "var(--theme-text-secondary)" };
const value: CSSProperties = { fontWeight: 600, textAlign: "end", overflowWrap: "anywhere", minWidth: 0 };

function Line({ name, children, strong }: { name: string; children: ReactNode; strong?: boolean }) {
  return (
    <div style={{ ...row, ...(strong ? { fontSize: 16, borderTop: "2px solid var(--theme-text)" } : null) }}>
      <span style={strong ? { fontWeight: 700 } : label}>{name}</span>
      <span style={{ ...value, fontVariantNumeric: "tabular-nums", ...(strong ? { fontWeight: 800 } : null) }}>{children}</span>
    </div>
  );
}

/** Libellés du reçu. Par défaut en français (écrans de l'administrateur) ; l'écran du client fournit les siens, traduits. */
export interface ReceiptLabels {
  lang: string;
  subtitle: string;
  /** « Émis le {date} » */
  issued: (date: string) => string;
  customer: string;
  taxId: string;
  /** « Registre du commerce » (identité de l’éditeur) ; à défaut, le libellé français. */
  registry?: string;
  plan: string;
  cycle: (cycle: string) => string;
  covered: string;
  /** « du {from} au {to} » */
  fromTo: (from: string, to: string) => string;
  method: string;
  methodName: (method: string) => string;
  reference: string;
  amountHT: string;
  vat: (rate: string) => string;
  paid: string;
  /** Mention de bas de reçu ; à défaut, celle du serveur (en français). */
  notice?: string;
}

const FR_LABELS: ReceiptLabels = {
  lang: LANG,
  subtitle: "Reçu de paiement d’abonnement",
  issued: (date) => `Émis le ${date}`,
  customer: "Client",
  taxId: "Matricule fiscal",
  registry: "Registre du commerce",
  plan: "Formule",
  cycle: (cycle) => cycleLabel(cycle).toLowerCase(),
  covered: "Période couverte",
  fromTo: (from, to) => `du ${from} au ${to}`,
  method: "Moyen de paiement",
  methodName: (method) => methodLabel(method),
  reference: "Référence",
  amountHT: "Montant hors taxes",
  vat: (rate) => `TVA (${rate} %)`,
  paid: "Montant payé TTC",
};

/** Le reçu tel que le serveur le renvoie : aucune valeur n'est recalculée ici. */
export function ReceiptSheet({ receipt, labels = FR_LABELS }: { receipt: Receipt; labels?: ReceiptLabels }) {
  const L = labels;
  const amount = (n: number) => formatMoney(n, L.lang, receipt.currency);
  const rate = Number(receipt.vatRate).toLocaleString(L.lang === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 2 });
  return (
    <article className="cfg-receipt" style={{ color: "var(--theme-text)", display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div dir="ltr" style={{ fontFamily: "var(--font-orbitron), var(--font-poppins), sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>Inovexa ERP</div>
          <div style={{ ...label, fontSize: 13, marginTop: 2 }}>{L.subtitle}</div>
          {receipt.issuer ? (
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{receipt.issuer.name}</div>
              {receipt.issuer.address ? <div style={{ overflowWrap: "anywhere" }}>{receipt.issuer.address}</div> : null}
              {receipt.issuer.taxId ? <div>{L.taxId} : <bdi>{receipt.issuer.taxId}</bdi></div> : null}
              {receipt.issuer.registry ? <div>{L.registry ?? "Registre du commerce"} : <bdi>{receipt.issuer.registry}</bdi></div> : null}
              {receipt.issuer.email || receipt.issuer.phone ? <div style={{ overflowWrap: "anywhere" }}><bdi>{[receipt.issuer.email, receipt.issuer.phone].filter(Boolean).join(" · ")}</bdi></div> : null}
            </div>
          ) : null}
        </div>
        <div style={{ textAlign: "end" }}>
          <div dir="ltr" style={{ fontWeight: 800, fontSize: 16 }}>{receipt.receiptNumber}</div>
          <div style={{ ...label, fontSize: 13, marginTop: 2 }}>{L.issued(formatDateTime(receipt.issuedAt, L.lang))}</div>
        </div>
      </header>

      <section aria-label={L.customer}>
        <div style={{ ...label, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>{L.customer}</div>
        <div style={{ fontWeight: 700, fontSize: 15, overflowWrap: "anywhere" }}>{receipt.customer.name || "—"}</div>
        {receipt.customer.taxId && <div style={{ fontSize: 13.5 }}>{L.taxId} : <bdi>{receipt.customer.taxId}</bdi></div>}
        {receipt.customer.address && <div style={{ fontSize: 13.5 }}>{receipt.customer.address}</div>}
        {receipt.customer.email && <div style={{ fontSize: 13.5, overflowWrap: "anywhere" }}><bdi>{receipt.customer.email}</bdi></div>}
      </section>

      <section aria-label={L.subtitle}>
        <Line name={L.plan}>{receipt.planName} — {L.cycle(receipt.billingCycle)}</Line>
        <Line name={L.covered}>{L.fromTo(formatDateTime(receipt.periodStart, L.lang, false), formatDateTime(receipt.periodEnd, L.lang, false))}</Line>
        <Line name={L.method}>{L.methodName(receipt.method)}</Line>
        <Line name={L.reference}><bdi>{receipt.reference || "—"}</bdi></Line>
        <Line name={L.amountHT}>{amount(receipt.amountHT)}</Line>
        <Line name={L.vat(rate)}>{amount(receipt.vatAmount)}</Line>
        <Line name={L.paid} strong>{amount(receipt.amountTTC)}</Line>
      </section>

      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--theme-text-secondary)" }}>{L.notice || receipt.notice}</p>
    </article>
  );
}

/**
 * À l'impression, seuls les enfants directs de <body> peuvent être retirés de la mise en page sans laisser de pages
 * blanches. La copie imprimable est donc accrochée sous <body>, et tout le reste est masqué : le navigateur n'imprime
 * que le reçu, sur une page, en noir sur blanc quel que soit le thème. La règle n'existe que tant qu'un reçu est ouvert.
 */
const PRINT_CSS = `
.cfg-print-root { display: none; }
@media print {
  @page { margin: 16mm; }
  html, body { background: #fff !important; }
  body > *:not(.cfg-print-root) { display: none !important; }
  .cfg-print-root {
    display: block !important;
    --theme-text: #000; --theme-text-secondary: #444; --theme-border: #bbb;
    color: #000; background: #fff; font-family: var(--font-poppins), Arial, sans-serif;
  }
}`;

export function ReceiptPrintRoot({ receipt, labels }: { receipt: Receipt; labels?: ReceiptLabels }) {
  return createPortal(
    <div className="cfg-print-root" aria-hidden="true">
      <style>{PRINT_CSS}</style>
      <ReceiptSheet receipt={receipt} labels={labels} />
    </div>,
    document.body,
  );
}
