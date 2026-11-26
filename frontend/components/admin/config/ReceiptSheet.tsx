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

/** Le reçu tel que le serveur le renvoie : aucune valeur n'est recalculée ici. */
export function ReceiptSheet({ receipt }: { receipt: Receipt }) {
  const amount = (n: number) => formatMoney(n, LANG, receipt.currency);
  return (
    <article className="cfg-receipt" style={{ color: "var(--theme-text)", display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-orbitron), var(--font-poppins), sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>Inovexa ERP</div>
          <div style={{ ...label, fontSize: 13, marginTop: 2 }}>Reçu de paiement d’abonnement</div>
        </div>
        <div style={{ textAlign: "end" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{receipt.receiptNumber}</div>
          <div style={{ ...label, fontSize: 13, marginTop: 2 }}>Émis le {formatDateTime(receipt.issuedAt, LANG)}</div>
        </div>
      </header>

      <section aria-label="Client">
        <div style={{ ...label, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Client</div>
        <div style={{ fontWeight: 700, fontSize: 15, overflowWrap: "anywhere" }}>{receipt.customer.name || "—"}</div>
        {receipt.customer.taxId && <div style={{ fontSize: 13.5 }}>Matricule fiscal : {receipt.customer.taxId}</div>}
        {receipt.customer.address && <div style={{ fontSize: 13.5 }}>{receipt.customer.address}</div>}
        {receipt.customer.email && <div style={{ fontSize: 13.5, overflowWrap: "anywhere" }}>{receipt.customer.email}</div>}
      </section>

      <section aria-label="Détail du paiement">
        <Line name="Formule">{receipt.planName} — {cycleLabel(receipt.billingCycle).toLowerCase()}</Line>
        <Line name="Période couverte">du {formatDateTime(receipt.periodStart, LANG, false)} au {formatDateTime(receipt.periodEnd, LANG, false)}</Line>
        <Line name="Moyen de paiement">{methodLabel(receipt.method)}</Line>
        <Line name="Référence">{receipt.reference || "—"}</Line>
        <Line name="Montant hors taxes">{amount(receipt.amountHT)}</Line>
        <Line name={`TVA (${Number(receipt.vatRate).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %)`}>{amount(receipt.vatAmount)}</Line>
        <Line name="Montant payé TTC" strong>{amount(receipt.amountTTC)}</Line>
      </section>

      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--theme-text-secondary)" }}>{receipt.notice}</p>
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

export function ReceiptPrintRoot({ receipt }: { receipt: Receipt }) {
  return createPortal(
    <div className="cfg-print-root" aria-hidden="true">
      <style>{PRINT_CSS}</style>
      <ReceiptSheet receipt={receipt} />
    </div>,
    document.body,
  );
}
