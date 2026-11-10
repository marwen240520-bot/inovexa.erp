"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  api, Badge, Btn, Card, Empty, ErrorBox, Field, inputStyle, Loading, Modal, money, moneyDT, Notice, num, Page, Row, Stat, TableWrap, td, th,
  useLoad, useNotice, useRequireAuth, qty,
} from "@/components/erp/kit";

const METHOD: Record<string, string> = { cash: "Espèces", card: "Carte", transfer: "Virement", check: "Chèque", mobile: "Mobile", other: "Autre" };
const when = (d?: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

function ZReport({ session }: { session: any }) {
  const r = session.report || {};
  const variance = Number(session.variance ?? 0);
  return (
    <div id="z-report">
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <Stat label="Ventes" value={moneyDT(r.salesTotal)} sub={`${r.salesTickets ?? 0} ticket(s)`} />
        <Stat label="Achats payés en caisse" value={moneyDT(r.purchasesTotal)} />
        <Stat label="Espèces attendues" value={moneyDT(session.expectedCash ?? r.expectedCash)} sub={`Fond de caisse ${money(session.openingFloat)}`} />
        {session.status === "closed" && <Stat label="Écart" value={`${variance > 0 ? "+" : ""}${money(variance)} DT`} tone={variance === 0 ? "good" : "bad"} sub={`Compté ${money(session.countedCash)}`} />}
      </div>
      <h4 style={{ margin: "8px 0" }}>Ventes par moyen de paiement</h4>
      {!r.sales?.length ? <Empty>Aucune vente sur cette session.</Empty> : (
        <TableWrap><thead><tr><th style={th}>Moyen</th><th style={{ ...th, ...num }}>Tickets</th><th style={{ ...th, ...num }}>Total</th></tr></thead>
          <tbody>{r.sales.map((x: any) => <tr key={x.method}><td style={td}>{METHOD[x.method] || x.method}</td><td style={{ ...td, ...num }}>{x.tickets}</td><td style={{ ...td, ...num }}>{money(x.total)}</td></tr>)}</tbody></TableWrap>
      )}
      {!!r.purchases?.length && (
        <>
          <h4 style={{ margin: "14px 0 8px" }}>Achats par moyen de paiement</h4>
          <TableWrap><thead><tr><th style={th}>Moyen</th><th style={{ ...th, ...num }}>Tickets</th><th style={{ ...th, ...num }}>Total</th></tr></thead>
            <tbody>{r.purchases.map((x: any) => <tr key={x.method}><td style={td}>{METHOD[x.method] || x.method}</td><td style={{ ...td, ...num }}>{x.tickets}</td><td style={{ ...td, ...num }}>{money(x.total)}</td></tr>)}</tbody></TableWrap>
        </>
      )}
      {!!r.topProducts?.length && (
        <>
          <h4 style={{ margin: "14px 0 8px" }}>Produits les plus vendus</h4>
          <TableWrap><thead><tr><th style={th}>Produit</th><th style={{ ...th, ...num }}>Qté</th><th style={{ ...th, ...num }}>Total</th></tr></thead>
            <tbody>{r.topProducts.map((p: any, i: number) => <tr key={i}><td style={td}>{p.name}</td><td style={{ ...td, ...num }}>{qty(p.quantity)}</td><td style={{ ...td, ...num }}>{money(p.total)}</td></tr>)}</tbody></TableWrap>
        </>
      )}
      {r.journalEntry && (
        <p style={{ fontSize: 13, marginTop: 12 }}>
          Écriture comptable : <Link href="/dashboard/accounting" style={{ fontWeight: 700 }}>{r.journalEntry.number}</Link> (journal de caisse) — ventes HT et TVA par taux, encaissements par moyen de paiement, sortie de stock au coût.
        </p>
      )}
      {r.note && <p style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginTop: 12 }}>{r.note} Les prix de caisse sont des montants TTC encaissés.</p>}
    </div>
  );
}

export default function PosSessionsPage() {
  useRequireAuth();
  const [notice, notify] = useNotice();
  const current = useLoad(() => api<any>("/pos/sessions/current"), []);
  const history = useLoad(() => api<any[]>("/pos/sessions"), []);
  const [openFloat, setOpenFloat] = useState("0");
  const [openNote, setOpenNote] = useState("");
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [ticketNo, setTicketNo] = useState("");
  const [ticket, setTicket] = useState<any | null>(null);

  const refresh = () => { current.reload(); history.reload(); };

  async function openSession() {
    setBusy(true);
    try { await api("/pos/sessions/open", { method: "POST", body: { openingFloat: Number(openFloat) || 0, note: openNote || undefined } }); notify("Caisse ouverte."); setOpenNote(""); refresh(); }
    catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  }
  async function closeSession() {
    const c = Number(counted.replace(",", "."));
    if (counted.trim() === "" || !Number.isFinite(c) || c < 0) { notify("Saisissez les espèces comptées.", "err"); return; }
    setBusy(true);
    try {
      const closed = await api<any>("/pos/sessions/close", { method: "POST", body: { countedCash: c, note: closeNote || undefined } });
      setClosing(false); setCounted(""); setCloseNote(""); setDetail(closed); refresh();
    } catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  }
  async function openDetail(id: number) {
    try { setDetail(await api<any>(`/pos/sessions/${id}`)); } catch (e: any) { notify(e.message, "err"); }
  }
  async function lookup() {
    if (!ticketNo.trim()) return;
    try { setTicket(await api<any>(`/pos/tickets/${encodeURIComponent(ticketNo.trim())}`)); }
    catch (e: any) { setTicket(null); notify(e.message, "err"); }
  }

  const live = current.data?.live;
  const expectedLive = live?.expectedCash ?? 0;
  const countedNum = Number(counted.replace(",", "."));

  return (
    <Page title="Sessions de caisse" subtitle="Ouverture avec fond de caisse, clôture avec rapport Z et écart d’espèces"
      actions={<Link href="/dashboard/pos"><Btn>← Retour à la caisse</Btn></Link>}>
      {notice}
      {current.error && <ErrorBox message={current.error} onRetry={current.reload} />}
      {current.loading && !current.data ? <Loading /> : current.data?.open ? (
        <Card title={<>Session en cours <Badge tone="green">ouverte</Badge></>} right={<Btn variant="primary" onClick={() => { setCounted(""); setClosing(true); }}>Clôturer la caisse</Btn>}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--theme-text-secondary)" }}>Ouverte le {when(current.data.session.openedAt)} — fond de caisse {moneyDT(current.data.session.openingFloat)}</p>
          <ZReport session={{ ...current.data.session, report: live }} />
        </Card>
      ) : (
        <Card title="Ouvrir la caisse">
          <Notice tone="blue">Aucune session ouverte. Les ventes faites en caisse sans session ne sont pas rattachées à un rapport Z.</Notice>
          <Row>
            <Field label="Fond de caisse (DT)"><input style={inputStyle} inputMode="decimal" value={openFloat} onChange={(e) => setOpenFloat(e.target.value)} /></Field>
            <Field label="Note (facultatif)" grow><input style={inputStyle} maxLength={300} value={openNote} onChange={(e) => setOpenNote(e.target.value)} /></Field>
            <Btn variant="primary" busy={busy} onClick={openSession}>Ouvrir la caisse</Btn>
          </Row>
        </Card>
      )}

      <Card title="Retrouver un ticket">
        <Row>
          <Field label="N° de ticket" grow><input style={inputStyle} value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} placeholder="ex. T-2026-00012" /></Field>
          <Btn onClick={lookup}>Rechercher</Btn>
        </Row>
      </Card>

      <Card title="Historique" pad={false}>
        {history.loading && !history.data ? <Loading /> : !history.data?.length ? <Empty>Aucune session pour le moment.</Empty> : (
          <TableWrap>
            <thead><tr><th style={th}>N°</th><th style={th}>Ouverture</th><th style={th}>Clôture</th><th style={{ ...th, ...num }}>Ventes</th><th style={{ ...th, ...num }}>Attendu</th><th style={{ ...th, ...num }}>Compté</th><th style={{ ...th, ...num }}>Écart</th><th style={th} /></tr></thead>
            <tbody>{history.data.map((s: any) => (
              <tr key={s.id}>
                <td style={td}>{s.number || <Badge tone="green">en cours</Badge>}</td><td style={td}>{when(s.openedAt)}</td><td style={td}>{when(s.closedAt)}</td>
                <td style={{ ...td, ...num }}>{s.salesTotal == null ? "—" : money(s.salesTotal)}</td>
                <td style={{ ...td, ...num }}>{s.expectedCash == null ? "—" : money(s.expectedCash)}</td>
                <td style={{ ...td, ...num }}>{s.countedCash == null ? "—" : money(s.countedCash)}</td>
                <td style={{ ...td, ...num, fontWeight: 700, color: s.variance ? "var(--theme-danger, #ef4444)" : undefined }}>{s.variance == null ? "—" : money(s.variance)}</td>
                <td style={td}><Btn onClick={() => openDetail(s.id)}>Rapport Z</Btn></td>
              </tr>
            ))}</tbody>
          </TableWrap>
        )}
      </Card>

      {closing && (
        <Modal title="Clôturer la caisse" onClose={() => setClosing(false)} footer={<><Btn onClick={() => setClosing(false)}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={closeSession}>Clôturer et figer le rapport Z</Btn></>}>
          <p style={{ margin: 0, fontSize: 14 }}>Espèces attendues en caisse : <b>{moneyDT(expectedLive)}</b></p>
          <Field label="Espèces comptées (DT)"><input autoFocus style={inputStyle} inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} /></Field>
          {counted.trim() !== "" && Number.isFinite(countedNum) && (
            <p style={{ margin: 0, fontSize: 14, color: Math.abs(countedNum - expectedLive) < 0.0005 ? "var(--theme-success, #10b981)" : "var(--theme-danger, #ef4444)" }}>
              Écart : {countedNum - expectedLive > 0 ? "+" : ""}{money(countedNum - expectedLive)} DT
            </p>
          )}
          <Field label="Note (facultatif)"><input style={inputStyle} maxLength={300} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} /></Field>
          <Notice>La clôture est définitive : le rapport Z ne pourra plus être modifié.</Notice>
        </Modal>
      )}

      {detail && (
        <Modal title={detail.number ? `Rapport Z ${detail.number}` : "Session en cours"} width={720} onClose={() => setDetail(null)} footer={<><Btn onClick={() => window.print()}>Imprimer</Btn><Btn variant="primary" onClick={() => setDetail(null)}>Fermer</Btn></>}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--theme-text-secondary)" }}>Ouverte le {when(detail.openedAt)}{detail.closedAt ? ` — clôturée le ${when(detail.closedAt)}` : ""}{detail.note ? ` — ${detail.note}` : ""}</p>
          <ZReport session={detail} />
        </Modal>
      )}

      {ticket && (
        <Modal title={`Ticket ${ticket.ticketNumber}`} onClose={() => setTicket(null)} footer={<Btn variant="primary" onClick={() => setTicket(null)}>Fermer</Btn>}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--theme-text-secondary)" }}>
            {ticket.mode === "sale" ? "Vente" : "Achat"} du {when(ticket.createdAt)}{ticket.counterpart ? ` — ${ticket.counterpart}` : ""}{ticket.paymentMethod ? ` — ${METHOD[ticket.paymentMethod] || ticket.paymentMethod}` : ""}
          </p>
          <TableWrap><thead><tr><th style={th}>Article</th><th style={{ ...th, ...num }}>Qté</th><th style={{ ...th, ...num }}>PU</th><th style={{ ...th, ...num }}>Total</th></tr></thead>
            <tbody>{(ticket.lines || []).map((l: any, i: number) => <tr key={i}><td style={td}>{l.productName}</td><td style={{ ...td, ...num }}>{qty(l.quantity)}</td><td style={{ ...td, ...num }}>{money(l.unitPrice)}</td><td style={{ ...td, ...num }}>{money(l.total)}</td></tr>)}</tbody></TableWrap>
          <p style={{ margin: 0, textAlign: "right", fontWeight: 800 }}>Total : {moneyDT(ticket.total)}</p>
        </Modal>
      )}
    </Page>
  );
}
