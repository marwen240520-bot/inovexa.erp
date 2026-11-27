"use client";
/**
 * Administration › Paiements d'abonnement.
 * Les clients paient seuls, en ligne (Flouci : carte bancaire ou application), sur la page sécurisée de Flouci : le serveur
 * vérifie l'encaissement auprès de Flouci, ouvre l'accès et crée le reçu numéroté, sans aucune action de l'administrateur. Cette page sert
 * à les consulter. Si les paiements hors ligne sont activés dans les réglages, ceux que les clients déclarent arrivent
 * ici « en attente » ; un paiement reçu hors ligne peut aussi être saisi directement.
 */
import React, { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, Badge, Btn, Card, Empty, ErrorBox, inputStyle, Loading, Modal, Page, Row, TableWrap, num, td, th, useLoad, useNotice } from "@/components/erp/kit";
import {
  AccountLink, AdminPayment, AdminSettings, Check, ConfirmModal, FormField, InlineError, LANG, METHOD_LABELS, Paged, Pager, accountLabel, cycleLabel, errorText, methodLabel, mutedStyle, useDebounced,
} from "@/components/admin/config/shared";
import { ReceiptPrintRoot, ReceiptSheet } from "@/components/admin/config/ReceiptSheet";
import { PAYMENT_STATUS_META, dateTimeFr, type AccountsResponse } from "@/components/admin/core/shared";
import { formatMoney, formatPrice, withVat, type Plan, type Receipt } from "@/lib/saas";

/** Paiement en ligne (prestataire automatique) : flouci aujourd'hui, konnect pour les paiements d'avant le passage à Flouci. */
const isOnline = (provider: string | null | undefined) => !!provider && provider !== "manual";
const providerLabel = (provider: string | null | undefined) => (provider === "flouci" ? "Flouci" : provider === "konnect" ? "Konnect" : provider || "—");
const LIMIT = 25;
const STATUSES: Array<[string, string]> = [["validated", "Encaissés"], ["pending", "Hors ligne à valider"], ["initiated", "En ligne en cours"], ["refunded", "Remboursés"], ["rejected", "Refusés"], ["cancelled", "Annulés"], ["expired", "En ligne expirés"], ["", "Tous"]];

const EMPTY: Record<string, string> = {
  pending: "Aucun paiement hors ligne en attente de validation.",
  validated: "Aucun paiement encaissé pour le moment.",
  initiated: "Aucune page de paiement en ligne ouverte en ce moment.",
  expired: "Aucune page de paiement en ligne expirée ou refusée.",
  refunded: "Aucun remboursement.",
};

// ───────────── Saisie d'un paiement reçu hors ligne ─────────────

function RecordPaymentModal({ presetAccount, onClose, onDone }: { presetAccount: { id: number; label: string } | null; onClose: () => void; onDone: (message: string) => void }) {
  const lookups = useLoad(() => Promise.all([api<Plan[]>("/admin/plans"), api<AdminSettings>("/admin/settings")]), []);
  const [account, setAccount] = useState<{ id: number; label: string } | null>(presetAccount);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 300);
  const [matches, setMatches] = useState<Array<{ id: number; label: string; email: string }>>([]);
  const [planCode, setPlanCode] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [validate, setValidate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (account || debounced.trim().length < 2) { setMatches([]); return; }
    api<AccountsResponse>("/admin/accounts", { query: { q: debounced.trim(), limit: 8 } })
      .then((res) => { if (alive) setMatches(res.items.map((a) => ({ id: a.id, label: a.companyName || a.name || a.email, email: a.email }))); })
      .catch(() => { if (alive) setMatches([]); });
    return () => { alive = false; };
  }, [debounced, account]);

  const [plans, settings] = lookups.data ?? [[], null];
  const usable = (plans as Plan[]).filter((p) => p.isActive);
  const plan = usable.find((p) => p.code === planCode) || null;
  const amountHT = plan ? (cycle === "annual" ? plan.priceAnnual : plan.priceMonthly) : null;
  const vatRate = Number(settings?.vatRate ?? 19);
  const currency = settings?.currency || "USD";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!account) { setError("Choisissez le compte concerné."); return; }
    if (!plan) { setError("Choisissez la formule."); return; }
    if (amountHT === null) { setError("Cette formule n’a pas de prix pour ce rythme : renseignez-le dans « Formules et tarifs »."); return; }
    setBusy(true);
    setError(null);
    try {
      await api("/admin/payments", { method: "POST", body: { userId: account.id, planCode: plan.code, billingCycle: cycle, method, reference: reference.trim(), note: note.trim(), validate } });
      onDone(validate ? `Paiement enregistré et validé pour ${account.label} : l’accès est ouvert.` : `Paiement enregistré pour ${account.label}, en attente de validation.`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Modal title="Saisir un paiement reçu" onClose={() => { if (!busy) onClose(); }} width={620}
      footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={(e) => submit(e as unknown as FormEvent)}>{validate ? "Enregistrer et valider" : "Enregistrer"}</Btn></>}>
      {lookups.error ? <InlineError>{lookups.error}</InlineError> : null}
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {account ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 12px", borderRadius: 10, background: "var(--theme-surface-hover)", fontSize: 14 }}>
            <span>Compte : <strong>{account.label}</strong></span>
            {presetAccount ? null : <Btn onClick={() => setAccount(null)}>Changer</Btn>}
          </div>
        ) : (
          <FormField grow={false} label="Compte (société, nom ou email)">
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} style={inputStyle} autoFocus />
            {matches.length ? (
              <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
                {matches.map((m) => (
                  <button key={m.id} type="button" onClick={() => { setAccount({ id: m.id, label: m.label }); setQuery(""); }}
                    style={{ textAlign: "start", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--theme-border)", background: "var(--theme-surface)", color: "var(--theme-text)", cursor: "pointer", fontSize: 14 }}>
                    <strong>{m.label}</strong> <span style={mutedStyle}>{m.email}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </FormField>
        )}
        <Row>
          <FormField label="Formule">
            <select value={planCode} onChange={(e) => setPlanCode(e.target.value)} style={inputStyle}>
              <option value="">Choisir…</option>
              {usable.map((p) => <option key={p.code} value={p.code}>{p.name}{p.isPublic ? "" : " (brouillon)"}</option>)}
            </select>
          </FormField>
          <FormField label="Rythme">
            <select value={cycle} onChange={(e) => setCycle(e.target.value as "monthly" | "annual")} style={inputStyle}>
              <option value="monthly">Mensuel (1 mois)</option>
              <option value="annual">Annuel (12 mois)</option>
            </select>
          </FormField>
        </Row>
        <Row>
          <FormField label="Moyen de paiement">
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
              {Object.entries(METHOD_LABELS).filter(([code]) => code !== "card").map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </FormField>
          <FormField label="Référence"><input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} style={inputStyle} dir="ltr" /></FormField>
        </Row>
        <FormField grow={false} label="Remarque (facultatif)"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} style={inputStyle} /></FormField>
        <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--theme-border)", fontSize: 14 }}>
          {plan && amountHT !== null
            ? <>Montant : <strong>{formatPrice(amountHT, LANG, currency)} HT</strong> — {formatMoney(withVat(amountHT, vatRate, currency), LANG, currency)} TTC (TVA {vatRate.toLocaleString("fr-FR")} %)</>
            : <span style={mutedStyle}>Le montant est celui de la formule, au tarif en vigueur.</span>}
        </div>
        <Check checked={validate} onChange={setValidate} label="Valider tout de suite" hint="L’accès du compte est ouvert immédiatement et le reçu est créé. Décochez pour le laisser en attente." />
        {error ? <InlineError>{error}</InlineError> : null}
      </form>
    </Modal>
  );
}

// ───────────── Page ─────────────

function PaymentsScreen() {
  const params = useSearchParams();
  const userId = Number(params.get("userId")) || undefined;
  const [status, setStatus] = useState(userId ? "" : "validated");
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useLoad(() => api<Paged<AdminPayment>>("/admin/payments", { query: { status: status || undefined, userId, limit: LIMIT, offset } }), [status, offset, userId]);
  const [notice, notify] = useNotice();
  const [confirm, setConfirm] = useState<AdminPayment | null>(null);
  const [reject, setReject] = useState<AdminPayment | null>(null);
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState<AdminPayment | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [rechecking, setRechecking] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [recording, setRecording] = useState(false);

  const act = async (run: () => Promise<unknown>, done: string, close: () => void) => {
    setBusy(true);
    setActionError(null);
    try {
      await run();
      close();
      notify(done);
      reload();
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  /** « J'ai payé mais rien ne s'ouvre » : relit l'état du paiement chez Flouci et ouvre l'accès s'il est encaissé. */
  const recheck = async (payment: AdminPayment) => {
    if (rechecking !== null) return;
    setRechecking(payment.id);
    try {
      const res = await api<{ status: "paid" | "pending" | "expired" | "unknown" }>(`/admin/payments/${payment.id}/recheck`, { method: "POST" });
      if (res.status === "paid") notify(`Paiement confirmé par Flouci : l’accès de ${accountLabel(payment.account)} est ouvert.`);
      else if (res.status === "pending") notify("Flouci ne signale aucun paiement sur cette page pour l’instant : rien à ouvrir.");
      else if (res.status === "expired") notify("La page de paiement a expiré ou le paiement a été refusé : rien n’a été encaissé.");
      else notify("Flouci ne connaît pas ce paiement.", "err");
      reload();
    } catch (err) {
      notify(errorText(err), "err");
    } finally {
      setRechecking(null);
    }
  };

  const openReceipt = async (payment: AdminPayment) => {
    try { setReceipt(await api<Receipt>(`/admin/payments/${payment.id}/receipt`)); } catch (err) { notify(errorText(err), "err"); }
  };

  const presetAccount = userId && data?.items[0]?.account ? { id: userId, label: accountLabel(data.items[0].account) } : null;

  return (
    <Page title="Paiements" subtitle="Les paiements en ligne (Flouci) sont encaissés et activés automatiquement : cette page sert à les consulter, à relire chez Flouci un paiement que le client dit avoir fait, et à rembourser. Rien à valider, sauf un paiement hors ligne déclaré par un client si vous les avez autorisés."
      actions={<Btn onClick={() => setRecording(true)}>Saisir un paiement hors ligne</Btn>}>
      {notice}
      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {STATUSES.map(([value, label]) => (
          <button key={value || "all"} role="tab" aria-selected={status === value} onClick={() => { setStatus(value); setOffset(0); }}
            style={{ padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontWeight: 700, border: "1px solid var(--theme-border)", background: status === value ? "var(--theme-primary, #4f46e5)" : "var(--theme-surface)", color: status === value ? "#fff" : "var(--theme-text)" }}>
            {label}
          </button>
        ))}
      </div>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      <Card pad={false}>
        {!data ? (loading ? <Loading /> : null) : data.items.length === 0 ? <Empty>{EMPTY[status] || "Aucun paiement."}</Empty> : (
          <>
            <TableWrap min={900}>
              <thead>
                <tr>
                  <th style={th}>Date</th><th style={th}>Compte</th><th style={th}>Formule</th><th style={{ ...th, ...num }}>Montant TTC</th><th style={th}>Moyen et référence</th><th style={th}>État</th><th style={th} />
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => {
                  const meta = PAYMENT_STATUS_META[p.status] || { label: p.status, tone: "gray" as const };
                  return (
                    <tr key={p.id}>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>{dateTimeFr(p.validatedAt && p.provider !== "manual" ? p.validatedAt : p.createdAt)}<div style={mutedStyle}>{isOnline(p.provider) ? (p.status === "initiated" ? "page de paiement ouverte par le client" : p.status === "expired" ? "page de paiement expirée ou refusée" : "payé en ligne par le client") : p.declaredBy === "admin" ? "saisi par l’administrateur" : "déclaré par le client"}</div></td>
                      <td style={td}><AccountLink account={p.account} /><div style={mutedStyle}>{p.account.email}</div></td>
                      <td style={td}>{p.planName}<div style={mutedStyle}>{cycleLabel(p.billingCycle)}</div></td>
                      <td style={{ ...td, ...num }}><strong>{formatMoney(p.amountTTC, LANG, p.currency)}</strong><div style={mutedStyle}>{formatMoney(p.amountHT, LANG, p.currency)} HT</div>{p.chargedAmount != null && p.chargedCurrency && p.chargedCurrency !== p.currency ? <div style={mutedStyle}>débité {formatMoney(p.chargedAmount, LANG, p.chargedCurrency)}</div> : null}</td>
                      <td style={td}>{methodLabel(p.method)}{isOnline(p.provider) ? <div style={mutedStyle}>{providerLabel(p.provider)} · activation automatique</div> : null}{p.reference ? <div style={{ ...mutedStyle, overflowWrap: "anywhere" }}>{p.reference}</div> : null}{p.note ? <div style={{ ...mutedStyle, fontStyle: "italic" }}>{p.note}</div> : null}</td>
                      <td style={td}><Badge tone={meta.tone}>{meta.label}</Badge>{p.status === "rejected" && p.rejectReason ? <div style={mutedStyle}>{p.rejectReason}</div> : null}{p.status === "validated" && p.periodEnd ? <div style={mutedStyle}>jusqu’au {dateTimeFr(p.periodEnd)}</div> : null}{p.status === "refunded" ? <div style={mutedStyle}>{p.receiptNumber ? `reçu ${p.receiptNumber}` : "remboursé"}{p.rejectReason ? ` — ${p.rejectReason}` : ""}</div> : null}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        {p.status === "pending" ? (
                          <span style={{ display: "flex", gap: 6 }}>
                            <Btn variant="success" onClick={() => { setActionError(null); setConfirm(p); }}>Valider</Btn>
                            <Btn variant="danger" onClick={() => { setActionError(null); setReason(""); setReject(p); }}>Refuser</Btn>
                          </span>
                        ) : p.status === "validated" ? (
                          <span style={{ display: "flex", gap: 6 }}>
                            <Btn onClick={() => openReceipt(p)}>{p.receiptNumber || "Reçu"}</Btn>
                            <Btn variant="danger" onClick={() => { setActionError(null); setRefundReason(""); setRefund(p); }}>Rembourser</Btn>
                          </span>
                        ) : (p.status === "initiated" || p.status === "expired") && p.provider === "flouci" ? (
                          <Btn onClick={() => recheck(p)} busy={rechecking === p.id} disabled={rechecking !== null}>Relire chez Flouci</Btn>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
            <Pager total={data.total} limit={data.limit} offset={data.offset} onChange={setOffset} busy={loading} />
          </>
        )}
      </Card>

      {confirm ? (
        <ConfirmModal title="Valider ce paiement ?" confirmLabel="Valider le paiement" variant="success" busy={busy} error={actionError} onCancel={() => setConfirm(null)}
          onConfirm={() => act(() => api(`/admin/payments/${confirm.id}/validate`, { method: "POST" }), `Paiement validé : l’accès de ${accountLabel(confirm.account)} est ouvert.`, () => setConfirm(null))}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
            <strong>{accountLabel(confirm.account)}</strong> — {confirm.planName} ({cycleLabel(confirm.billingCycle).toLowerCase()}), <strong>{formatMoney(confirm.amountTTC, LANG, confirm.currency)} TTC</strong> par {methodLabel(confirm.method).toLowerCase()}{confirm.reference ? `, référence ${confirm.reference}` : ""}.
          </p>
          <p style={{ ...mutedStyle, margin: 0 }}>Vérifiez que l’argent est bien reçu. L’accès est ouvert pour la période payée et un reçu numéroté est créé ; si le compte est encore en essai, la période payée commence à la fin de l’essai.</p>
        </ConfirmModal>
      ) : null}

      {reject ? (
        <ConfirmModal title="Refuser ce paiement ?" confirmLabel="Refuser" variant="danger" busy={busy} error={actionError} onCancel={() => setReject(null)}
          onConfirm={() => act(() => api(`/admin/payments/${reject.id}/reject`, { method: "POST", body: { reason: reason.trim() } }), "Paiement refusé : le client voit le motif sur sa page Abonnement.", () => setReject(null))}>
          <p style={{ margin: 0, fontSize: 14 }}><strong>{accountLabel(reject.account)}</strong> — {formatMoney(reject.amountTTC, LANG, reject.currency)} TTC par {methodLabel(reject.method).toLowerCase()}.</p>
          <FormField grow={false} label="Motif affiché au client" hint="Par exemple : « Virement non reçu », « Montant incomplet ».">
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} style={inputStyle} autoFocus />
          </FormField>
        </ConfirmModal>
      ) : null}

      {refund ? (
        <ConfirmModal title="Rembourser ce paiement ?" confirmLabel="Rembourser" variant="danger" busy={busy} error={actionError} onCancel={() => setRefund(null)}
          onConfirm={() => act(() => api(`/admin/payments/${refund.id}/refund`, { method: "POST", body: { reason: refundReason.trim() } }), `Paiement remboursé : l’abonnement de ${accountLabel(refund.account)} est remis en accord.`, () => setRefund(null))}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
            <strong>{accountLabel(refund.account)}</strong> — {refund.planName} ({cycleLabel(refund.billingCycle).toLowerCase()}), <strong>{formatMoney(refund.amountTTC, LANG, refund.currency)} TTC</strong>{refund.receiptNumber ? `, reçu ${refund.receiptNumber}` : ""}.
          </p>
          <FormField grow={false} label="Motif (communiqué au client par email)" hint="Par exemple : « Paiement en double », « Demande du client ».">
            <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} maxLength={300} style={inputStyle} autoFocus />
          </FormField>
          <p style={{ ...mutedStyle, margin: 0, lineHeight: 1.5 }}>
            L’abonnement revient à l’état d’avant ce paiement : l’essai reprend s’il court encore, sinon l’accès se referme (les données sont conservées). Seul le paiement le plus récent d’un compte peut être remboursé ; le client est prévenu par email.
          </p>
          <p style={{ ...mutedStyle, margin: 0, lineHeight: 1.5 }}>
            {isOnline(refund.provider)
              ? <><strong>Le remboursement n’est pas envoyé automatiquement</strong> : rendez l’argent au client depuis votre tableau de bord {providerLabel(refund.provider)}{refund.chargedAmount != null && refund.chargedCurrency ? ` (${formatMoney(refund.chargedAmount, LANG, refund.chargedCurrency)} débités)` : ""}, puis confirmez ici pour remettre son abonnement en accord.</>
              : <>Rendez l’argent au client par le moyen utilisé pour le paiement, puis confirmez ici pour remettre son abonnement en accord.</>}
          </p>
        </ConfirmModal>
      ) : null}

      {receipt ? (
        <>
          <Modal title="Reçu de paiement" onClose={() => setReceipt(null)} width={620} footer={<><Btn onClick={() => setReceipt(null)}>Fermer</Btn><Btn variant="primary" onClick={() => window.print()}>Imprimer</Btn></>}>
            <ReceiptSheet receipt={receipt} />
          </Modal>
          <ReceiptPrintRoot receipt={receipt} />
        </>
      ) : null}

      {recording ? <RecordPaymentModal presetAccount={presetAccount} onClose={() => setRecording(false)} onDone={(message) => { setRecording(false); notify(message); setStatus(""); setOffset(0); reload(); }} /> : null}
    </Page>
  );
}

export default function AdminPaymentsPage() {
  return <Suspense fallback={<Loading />}><PaymentsScreen /></Suspense>;
}
