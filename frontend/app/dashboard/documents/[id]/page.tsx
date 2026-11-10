"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  api, Badge, Btn, Card, ErrorBox, fetchFile, Field, fmtDate, inputStyle, Loading, Modal, money, moneyDT, num, Page, qty, Row, StatusBadge, TableWrap, td, th,
  todayISO, useLoad, useNotice, useRequireAuth, Notice,
} from "@/components/erp/kit";

const METHODS: Record<string, string> = { cash: "Espèces", card: "Carte", transfer: "Virement", check: "Chèque", draft: "Traite", mobile: "Mobile", credit_note: "Avoir", other: "Autre" };
const TYPE_LABEL: Record<string, string> = {
  quote: "Devis", delivery_note: "Bon de livraison", invoice: "Facture", credit_note: "Avoir",
  purchase_order: "Bon de commande", goods_receipt: "Bon de réception", supplier_invoice: "Facture fournisseur", supplier_credit_note: "Avoir fournisseur",
};

type ModalKind = null | "pay" | "send" | "cancel" | "credit" | "remind" | "void";

export default function DocumentDetail() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [notice, notify] = useNotice();
  const doc = useLoad(() => api<any>(`/documents/${id}`), [id]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const d = doc.data;

  // Formulaires des fenêtres
  const [pay, setPay] = useState({ amount: "", method: "transfer", date: todayISO(), reference: "" });
  const [send, setSend] = useState({ to: "", subject: "", message: "" });
  const [reason, setReason] = useState("");
  const [voidTarget, setVoidTarget] = useState<any>(null);
  const [fullCredit, setFullCredit] = useState(true);
  const [creditQty, setCreditQty] = useState<Record<number, string>>({});
  const [creditReturn, setCreditReturn] = useState<Record<number, boolean>>({});
  const [level, setLevel] = useState("1");

  const run = async (key: string, fn: () => Promise<any>, ok: string, then?: (r: any) => void) => {
    setBusy(key);
    try {
      const r = await fn();
      notify(ok);
      setModal(null);
      if (then) then(r); else await doc.reload();
    } catch (e: any) {
      notify(e.message, "err");
    } finally {
      setBusy(null);
    }
  };

  if (doc.loading && !d) return <Page title="Document"><Loading /></Page>;
  if (!d) return <Page title="Document">{doc.error && <ErrorBox message={doc.error} onRetry={doc.reload} />}</Page>;

  const a = d.allowedActions || {};
  const settles = ["invoice", "credit_note", "supplier_invoice", "supplier_credit_note"].includes(d.type);
  const isCredit = d.type === "credit_note" || d.type === "supplier_credit_note";
  const title = `${d.typeLabel} ${d.number || "(brouillon)"}`;

  const openPay = () => { setPay({ amount: String(d.balanceDue), method: "transfer", date: todayISO(), reference: "" }); setModal("pay"); };
  const openSend = () => { setSend({ to: d.partyEmail || "", subject: `${d.typeLabel} ${d.number}`, message: "" }); setModal("send"); };
  const openCredit = () => {
    const q: Record<number, string> = {}; const r: Record<number, boolean> = {};
    d.lines.forEach((l: any) => { q[l.id] = ""; r[l.id] = true; });
    setCreditQty(q); setCreditReturn(r); setFullCredit(true); setModal("credit");
  };

  const submitCredit = () => {
    const body: any = { to: d.type === "invoice" ? "credit_note" : "supplier_credit_note" };
    if (!fullCredit) {
      const creditLines = d.lines.filter((l: any) => Number(creditQty[l.id]) > 0).map((l: any) => ({ lineId: l.id, quantity: Number(creditQty[l.id]), returnToStock: creditReturn[l.id] }));
      if (!creditLines.length) return notify("Indiquez au moins une quantité à créditer.", "err");
      body.creditLines = creditLines;
    }
    run("credit", () => api(`/documents/${d.id}/convert`, { method: "POST", body }), "Avoir créé en brouillon.", (r) => router.push(`/dashboard/documents/${r.id}`));
  };

  return (
    <Page
      title={title}
      subtitle={`${d.partyName}${d.partyTaxId ? ` · MF ${d.partyTaxId}` : ""}`}
      actions={
        <>
          <Btn onClick={() => router.push("/dashboard/documents")}>← Liste</Btn>
          {a.edit && <Link href={`/dashboard/documents/${d.id}/edit`}><Btn>Modifier</Btn></Link>}
          {a.validate && <Btn variant="primary" busy={busy === "validate"} onClick={() => run("validate", () => api(`/documents/${d.id}/validate`, { method: "POST" }), "Document validé : numéro attribué, pièce figée.")}>Valider</Btn>}
          {a.decide && <Btn variant="success" busy={busy === "accept"} onClick={() => run("accept", () => api(`/documents/${d.id}/accept`, { method: "POST" }), "Devis accepté.")}>Devis accepté</Btn>}
          {a.decide && <Btn variant="danger" busy={busy === "reject"} onClick={() => run("reject", () => api(`/documents/${d.id}/reject`, { method: "POST" }), "Devis refusé.")}>Refusé</Btn>}
          {(a.convertTo || []).filter((t: string) => t !== "credit_note" && t !== "supplier_credit_note").map((t: string) => (
            <Btn key={t} variant="primary" busy={busy === `conv-${t}`} onClick={() => run(`conv-${t}`, () => api(`/documents/${d.id}/convert`, { method: "POST", body: { to: t } }), `${TYPE_LABEL[t]} créé(e) en brouillon.`, (r) => router.push(`/dashboard/documents/${r.id}`))}>
              Convertir en {TYPE_LABEL[t].toLowerCase()}
            </Btn>
          ))}
          {(a.convertTo || []).some((t: string) => t.endsWith("credit_note")) && <Btn onClick={openCredit}>Créer un avoir</Btn>}
          {a.pay && <Btn variant="success" onClick={openPay}>{d.partyType === "client" ? "Encaisser" : "Payer"}</Btn>}
          {a.pay && d.type === "invoice" && d.overdue && <Btn onClick={() => setModal("remind")}>Relancer</Btn>}
          {a.send && <Btn onClick={openSend}>Envoyer</Btn>}
          {d.lockedAt && <Btn onClick={() => fetchFile(`/documents/${d.id}/pdf`, { open: true }).catch((e) => notify(e.message, "err"))}>PDF</Btn>}

          <Btn busy={busy === "dup"} onClick={() => run("dup", () => api(`/documents/${d.id}/duplicate`, { method: "POST" }), "Copie créée en brouillon.", (r) => router.push(`/dashboard/documents/${r.id}`))}>Dupliquer</Btn>
          {a.cancel && <Btn variant="danger" onClick={() => { setReason(""); setModal("cancel"); }}>Annuler</Btn>}
          {a.delete && <Btn variant="danger" busy={busy === "del"} onClick={() => { if (confirm("Supprimer ce brouillon ?")) run("del", () => api(`/documents/${d.id}`, { method: "DELETE" }), "Brouillon supprimé.", () => router.push("/dashboard/documents")); }}>Supprimer</Btn>}
        </>
      }
    >
      {notice}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <StatusBadge status={d.status} />
        {d.lockedAt && settles && <StatusBadge status={d.paymentStatus} />}
        {d.overdue && <Badge tone="red">En retard</Badge>}
        {d.lockedAt && <Badge tone="violet">Figé — non modifiable</Badge>}
        {d.lockedAt && d.status !== "cancelled" && (d.type === "invoice" || d.type === "credit_note") && (
          d.ttnReference
            ? <Badge tone="green">Certifiée El Fatoora — réf. TTN {d.ttnReference}{d.ttnValidatedAt ? ` (${fmtDate(d.ttnValidatedAt)})` : ""}</Badge>
            : <Badge tone="amber">Non certifiée El Fatoora</Badge>
        )}
      </div>

      {d.lockedAt && d.status !== "cancelled" && (d.type === "invoice" || d.type === "credit_note") && (
        <Card title="Facture électronique (El Fatoora / TTN)">
          <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--theme-text-secondary)" }}>
            {d.ttnReference
              ? "Cette pièce a été signée et validée sur la plateforme El Fatoora : la référence TTN figure sur le PDF."
              : "Cette pièce n’est pas encore certifiée : exportez le fichier XML, déposez-le et signez-le sur El Fatoora, puis saisissez ici la référence attribuée par TTN."}
          </p>
          <Row>
            <Btn onClick={() => fetchFile(`/documents/${d.id}/teif`).catch((e) => notify(e.message, "err"))}>Télécharger le fichier El Fatoora (XML)</Btn>
            <Btn variant={d.ttnReference ? undefined : "primary"} busy={busy === "ttn"} onClick={() => {
              const reference = prompt("Référence attribuée par TTN (El Fatoora) :", d.ttnReference || "");
              if (reference === null) return;
              run("ttn", () => api(`/documents/${d.id}/ttn`, { method: "PUT", body: { reference } }), reference.trim() ? "Référence TTN enregistrée." : "Référence TTN effacée.");
            }}>{d.ttnReference ? "Modifier la référence TTN" : "Saisir la référence TTN"}</Btn>
          </Row>
        </Card>
      )}

      {!d.lockedAt && <Notice tone="blue">Brouillon : le numéro légal sera attribué à la validation. Après validation, la pièce ne pourra plus être modifiée ; une erreur se corrige par un avoir.</Notice>}

      <Card title="Informations">
        <Row gap={28}>
          <Info k="Date" v={fmtDate(d.issueDate)} />
          {d.dueDate && <Info k="Échéance" v={fmtDate(d.dueDate)} />}
          {d.validUntil && <Info k="Valable jusqu’au" v={fmtDate(d.validUntil)} />}
          {d.externalRef && <Info k="Référence" v={d.externalRef} />}
          {d.partyAddress && <Info k="Adresse" v={d.partyAddress} />}
          {d.partyEmail && <Info k="Email" v={d.partyEmail} />}
          {d.paymentTerms && <Info k="Conditions" v={d.paymentTerms} />}
        </Row>
        {d.notes && <p style={{ margin: "12px 0 0", fontSize: 14, whiteSpace: "pre-wrap" }}>{d.notes}</p>}
      </Card>

      <Card title="Lignes" pad={false}>
        <TableWrap>
          <thead><tr><th style={th}>Désignation</th><th style={{ ...th, ...num }}>Qté</th><th style={{ ...th, ...num }}>PU HT</th><th style={{ ...th, ...num }}>Remise</th><th style={{ ...th, ...num }}>TVA</th><th style={{ ...th, ...num }}>Total HT</th><th style={{ ...th, ...num }}>Total TTC</th></tr></thead>
          <tbody>
            {d.lines.map((l: any) => (
              <tr key={l.id}>
                <td style={td}>{l.description}{l.sku && <div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{l.sku}</div>}</td>
                <td style={{ ...td, ...num }}>{qty(l.quantity)}{l.processedQty > 0 && <div style={{ fontSize: 11, color: "var(--theme-text-secondary)" }}>traité : {qty(l.processedQty)}</div>}</td>
                <td style={{ ...td, ...num }}>{money(l.unitPriceHT)}</td>
                <td style={{ ...td, ...num }}>{l.discountPct ? `${l.discountPct} %` : "—"}</td>
                <td style={{ ...td, ...num }}>{l.vatRate} %</td>
                <td style={{ ...td, ...num }}>{money(l.netHT)}</td>
                <td style={{ ...td, ...num }}>{money(l.totalTTC)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 360px", minWidth: 0 }}>
          {d.linkedDocuments?.length > 0 && (
            <Card title="Documents liés">
              {d.linkedDocuments.map((l: any) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
                  <Link href={`/dashboard/documents/${l.id}`} style={{ color: "var(--theme-primary, #4f46e5)", fontWeight: 600 }}>{l.label} {l.number || "(brouillon)"}</Link>
                  <span>{moneyDT(l.totalTTC)}</span>
                </div>
              ))}
            </Card>
          )}
          {d.installments?.length > 0 && (
            <Card title="Échéancier" pad={false}>
              <TableWrap>
                <thead><tr><th style={th}>Échéance</th><th style={th}>Libellé</th><th style={{ ...th, ...num }}>Montant</th><th style={{ ...th, ...num }}>Réglé</th><th style={th}>Statut</th></tr></thead>
                <tbody>{d.installments.map((i: any) => (
                  <tr key={i.id}><td style={td}>{fmtDate(i.dueDate)}</td><td style={td}>{i.label || "—"}</td><td style={{ ...td, ...num }}>{money(i.amount)}</td><td style={{ ...td, ...num }}>{money(i.paidAmount)}</td>
                    <td style={td}><StatusBadge status={Number(i.paidAmount) + 0.0005 >= Number(i.amount) ? "paid" : Number(i.paidAmount) > 0 ? "partial" : String(i.dueDate).slice(0, 10) < todayISO() ? "unpaid" : "none"} /></td></tr>
                ))}</tbody>
              </TableWrap>
            </Card>
          )}
        </div>

        <Card title="Totaux" style={{ flex: "0 1 380px", minWidth: 290 }}>
          <div style={{ fontVariantNumeric: "tabular-nums", fontSize: 14 }}>
            <Total k="Total HT" v={d.totalHT} />
            {Number(d.discountTotal) > 0 && <Total k="Remises" v={-d.discountTotal} muted />}
            {(d.vatBreakdown || []).map((g: any) => <Total key={g.rate} k={`TVA ${g.rate} % (base ${money(g.baseHT)})`} v={g.vatAmount} muted />)}
            <Total k="Total TTC" v={d.totalTTC} strong />
            {Number(d.stampDuty) > 0 && <Total k="Droit de timbre" v={d.stampDuty} />}
            {Number(d.withholdingAmount) > 0 && <Total k={`Retenue à la source ${d.withholdingRate} %`} v={-d.withholdingAmount} />}
            {settles && <Total k={isCredit ? "Avoir net" : "Net à payer"} v={d.netToPay} strong />}
            {settles && d.lockedAt && <Total k="Déjà réglé" v={d.paidAmount} muted />}
            {settles && d.lockedAt && <Total k="Reste dû" v={d.balanceDue} strong tone={Number(d.balanceDue) > 0 ? "bad" : "good"} />}
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--theme-text-secondary)", fontStyle: "italic" }}>{d.amountInWords}</p>
          </div>
        </Card>
      </div>

      {d.payments?.length > 0 && (
        <Card title="Règlements" pad={false}>
          <TableWrap>
            <thead><tr><th style={th}>N°</th><th style={th}>Date</th><th style={th}>Moyen</th><th style={th}>Référence</th><th style={{ ...th, ...num }}>Montant</th><th style={th} /></tr></thead>
            <tbody>
              {d.payments.map((p: any) => (
                <tr key={p.id} style={p.voidedAt ? { opacity: 0.55, textDecoration: "line-through" } : undefined}>
                  <td style={td}>{p.number || p.id}</td><td style={td}>{fmtDate(p.date)}</td><td style={td}>{METHODS[p.method] || p.method}</td><td style={td}>{p.reference || "—"}</td>
                  <td style={{ ...td, ...num }}>{money(p.amount)}</td>
                  <td style={td}>{p.voidedAt ? <Badge tone="red">Annulé</Badge> : p.method !== "credit_note" && <Btn variant="danger" onClick={() => { setVoidTarget(p); setReason(""); setModal("void"); }}>Annuler</Btn>}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {modal === "pay" && (
        <Modal title={d.partyType === "client" ? "Encaisser un règlement" : "Régler le fournisseur"} onClose={() => setModal(null)}
          footer={<><Btn onClick={() => setModal(null)}>Fermer</Btn><Btn variant="success" busy={busy === "pay"} onClick={() => run("pay", () => api(`/documents/${d.id}/payments`, { method: "POST", body: { amount: Number(pay.amount), method: pay.method, date: pay.date, reference: pay.reference || undefined } }), "Règlement enregistré.")}>Enregistrer</Btn></>}>
          <Row>
            <Field label={`Montant (reste dû ${money(d.balanceDue)})`} grow><input inputMode="decimal" style={inputStyle} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
            <Field label="Date"><input type="date" style={inputStyle} value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
          </Row>
          <Row>
            <Field label="Moyen de paiement" grow>
              <select style={inputStyle} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                {Object.entries(METHODS).filter(([k]) => k !== "credit_note").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Référence (n° chèque, virement…)" grow><input style={inputStyle} value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
          </Row>
          <Notice tone="blue">Un trop-perçu est refusé. Un règlement partiel laisse la facture « partielle ».</Notice>
        </Modal>
      )}

      {modal === "send" && (
        <Modal title="Envoyer par email" onClose={() => setModal(null)}
          footer={<><Btn onClick={() => setModal(null)}>Fermer</Btn><Btn variant="primary" busy={busy === "send"} onClick={() => run("send", () => api(`/documents/${d.id}/send`, { method: "POST", body: { to: send.to || undefined, subject: send.subject || undefined, message: send.message || undefined } }), "Email envoyé avec le PDF en pièce jointe.")}>Envoyer</Btn></>}>
          <Field label="Destinataire"><input type="email" style={inputStyle} value={send.to} onChange={(e) => setSend({ ...send, to: e.target.value })} /></Field>
          <Field label="Objet"><input style={inputStyle} value={send.subject} onChange={(e) => setSend({ ...send, subject: e.target.value })} /></Field>
          <Field label="Message"><textarea style={{ ...inputStyle, minHeight: 90 }} value={send.message} onChange={(e) => setSend({ ...send, message: e.target.value })} /></Field>
        </Modal>
      )}

      {modal === "cancel" && (
        <Modal title="Annuler le document" onClose={() => setModal(null)}
          footer={<><Btn onClick={() => setModal(null)}>Fermer</Btn><Btn variant="danger" busy={busy === "cancel"} onClick={() => run("cancel", () => api(`/documents/${d.id}/cancel`, { method: "POST", body: { reason: reason || undefined } }), "Document annulé.")}>Confirmer l’annulation</Btn></>}>
          <Field label="Motif"><input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        </Modal>
      )}

      {modal === "void" && voidTarget && (
        <Modal title={`Annuler le règlement ${voidTarget.number || voidTarget.id}`} onClose={() => setModal(null)}
          footer={<><Btn onClick={() => setModal(null)}>Fermer</Btn><Btn variant="danger" busy={busy === "void"} onClick={() => { if (!reason.trim()) return notify("Le motif est obligatoire.", "err"); run("void", () => api(`/documents/payments/${voidTarget.id}/void`, { method: "POST", body: { reason } }), "Règlement annulé, écriture contre-passée."); }}>Annuler le règlement</Btn></>}>
          <Field label="Motif (obligatoire)"><input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <Notice>L’écriture comptable est contre-passée. Un règlement déjà rapproché avec la banque ne peut pas être annulé.</Notice>
        </Modal>
      )}

      {modal === "remind" && (
        <Modal title="Relancer le client" onClose={() => setModal(null)}
          footer={<><Btn onClick={() => setModal(null)}>Fermer</Btn><Btn variant="primary" busy={busy === "remind"} onClick={() => run("remind", () => api(`/documents/${d.id}/remind`, { method: "POST", body: { level: Number(level), sendEmail: true } }), "Relance envoyée et tracée dans le CRM.")}>Envoyer la relance</Btn></>}>
          <Field label="Niveau de relance">
            <select style={inputStyle} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="1">1 — Rappel courtois</option><option value="2">2 — Relance ferme</option><option value="3">3 — Mise en demeure</option>
            </select>
          </Field>
        </Modal>
      )}

      {modal === "credit" && (
        <Modal title="Créer un avoir" width={680} onClose={() => setModal(null)}
          footer={<><Btn onClick={() => setModal(null)}>Fermer</Btn><Btn variant="primary" busy={busy === "credit"} onClick={submitCredit}>Créer l’avoir (brouillon)</Btn></>}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" checked={fullCredit} onChange={(e) => setFullCredit(e.target.checked)} /> Avoir total (toutes les lignes, quantités restantes)
          </label>
          {!fullCredit && (
            <TableWrap>
              <thead><tr><th style={th}>Ligne</th><th style={{ ...th, ...num }}>Facturé</th><th style={{ ...th, ...num }}>À créditer</th><th style={th}>Retour stock</th></tr></thead>
              <tbody>
                {d.lines.map((l: any) => (
                  <tr key={l.id}>
                    <td style={td}>{l.description}</td><td style={{ ...td, ...num }}>{qty(l.quantity)}</td>
                    <td style={{ ...td, width: 110 }}><input aria-label={`Quantité à créditer ${l.description}`} inputMode="decimal" style={{ ...inputStyle, ...num }} value={creditQty[l.id] ?? ""} onChange={(e) => setCreditQty({ ...creditQty, [l.id]: e.target.value })} /></td>
                    <td style={td}><input type="checkbox" aria-label="Retour en stock" checked={!!creditReturn[l.id]} onChange={(e) => setCreditReturn({ ...creditReturn, [l.id]: e.target.checked })} /></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
          <Notice tone="blue">L’avoir est créé en brouillon : vous pourrez le relire avant de le valider.</Notice>
        </Modal>
      )}
    </Page>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><div style={{ fontSize: 12, color: "var(--theme-text-secondary)", fontWeight: 600 }}>{k}</div><div style={{ fontSize: 14 }}>{v}</div></div>;
}

function Total({ k, v, strong, muted, tone }: { k: string; v: number; strong?: boolean; muted?: boolean; tone?: "good" | "bad" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: strong ? "7px 0" : "3px 0", borderTop: strong ? "1px solid var(--theme-border)" : undefined, fontWeight: strong ? 800 : 500, color: tone === "bad" ? "var(--theme-danger, #ef4444)" : tone === "good" ? "var(--theme-success, #10b981)" : muted ? "var(--theme-text-secondary)" : undefined }}>
      <span>{k}</span><span>{money(v)}</span>
    </div>
  );
}
