"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ModuleNav, { CLIENT_TABS } from "@/components/erp/ModuleNav";
import {
  api, Badge, Btn, Card, Empty, ErrorBox, Field, fmtDate, inputStyle, Loading, Modal, money, moneyDT, Notice, num, Page, Row, Stat, StatusBadge, TableWrap, td, th,
  useLoad, useNotice, useRequireAuth,
} from "@/components/erp/kit";

type Tab = "overview" | "followups" | "prices";
type PartyType = "client" | "supplier";

const KIND: Record<string, string> = { call: "Appel", email: "Email", meeting: "Rendez-vous", note: "Note", reminder: "Relance facture", visit: "Visite" };
const DOC_LABEL: Record<string, string> = { invoice: "Facture", credit_note: "Avoir", quote: "Devis", delivery_note: "Bon de livraison", purchase_order: "Bon de commande", goods_receipt: "Bon de réception", supplier_invoice: "Facture fournisseur", supplier_credit_note: "Avoir fournisseur" };
const toNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

const SUBTITLE: Record<Tab, string> = {
  overview: "Fiche 360° : encours, retards, conditions commerciales et historique des échanges",
  followups: "Échanges à suivre et relances à faire",
  prices: "Tarifs spécifiques par liste de prix",
};

export default function CrmPage() {
  return <Suspense fallback={<Loading />}><CrmContent /></Suspense>;
}

/** Onglet lu dans l'adresse (?tab=overview|followups|prices) : la sous-navigation Clients y mène directement. */
function CrmContent() {
  useRequireAuth();
  const raw = useSearchParams().get("tab");
  const tab: Tab = raw === "followups" || raw === "prices" ? raw : "overview";
  const [notice, notify] = useNotice();
  return (
    <Page title="Clients" subtitle={SUBTITLE[tab]}>
      <ModuleNav tabs={CLIENT_TABS} label="Clients" />
      {notice}
      {tab === "overview" && <Overview notify={notify} />}
      {tab === "followups" && <FollowUps />}
      {tab === "prices" && <PriceLists notify={notify} />}
    </Page>
  );
}

// ───────────────────────── Fiche 360° ─────────────────────────
function Overview({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const [type, setType] = useState<PartyType>("client");
  const [partyId, setPartyId] = useState<number | "">("");
  const parties = useLoad(() => api<any[]>(type === "client" ? "/clients" : "/suppliers"), [type]);
  const lists = useLoad(() => api<any[]>("/crm/price-lists"), []);
  const ov = useLoad(() => (partyId ? api<any>(`/crm/${type === "client" ? "clients" : "suppliers"}/${partyId}/overview`) : Promise.resolve(null)), [type, partyId]);
  const [edit, setEdit] = useState<any | null>(null);
  const [inter, setInter] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPartyId(""); }, [type]);

  const k = ov.data?.kpis;
  const p = ov.data?.party;

  async function saveConditions() {
    setBusy(true);
    try {
      await api(`/crm/${type === "client" ? "clients" : "suppliers"}/${partyId}/conditions`, {
        method: "PUT",
        body: {
          paymentTermsDays: toNum(edit.paymentTermsDays), withholdingRate: toNum(edit.withholdingRate) ?? 0, taxId: edit.taxId ?? "", notes: edit.notes ?? "",
          ...(type === "client" ? { creditLimit: toNum(edit.creditLimit), discountPct: toNum(edit.discountPct) ?? 0, priceListId: edit.priceListId ? Number(edit.priceListId) : null } : {}),
        },
      });
      setEdit(null); notify("Conditions enregistrées."); ov.reload();
    } catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  }
  async function saveInteraction() {
    setBusy(true);
    try {
      await api("/crm/interactions", { method: "POST", body: { partyType: type, partyId, kind: inter.kind, subject: inter.subject, content: inter.content || undefined, followUpDate: inter.followUpDate || undefined } });
      setInter(null); notify("Échange enregistré."); ov.reload();
    } catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  }
  async function removeInteraction(id: number) {
    if (!confirm("Supprimer cet échange ?")) return;
    try { await api(`/crm/interactions/${id}`, { method: "DELETE" }); ov.reload(); } catch (e: any) { notify(e.message, "err"); }
  }

  return (
    <>
      <Card>
        <Row>
          <Field label="Type"><select style={inputStyle} value={type} onChange={(e) => setType(e.target.value as PartyType)}><option value="client">Client</option><option value="supplier">Fournisseur</option></select></Field>
          <Field label={type === "client" ? "Client" : "Fournisseur"} grow>
            <select style={inputStyle} value={partyId} onChange={(e) => setPartyId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">— Choisir —</option>
              {(parties.data || []).map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Field>
        </Row>
      </Card>
      {parties.error && <ErrorBox message={parties.error} onRetry={parties.reload} />}
      {!partyId ? <Empty>Choisissez un {type === "client" ? "client" : "fournisseur"} pour voir sa fiche.</Empty> : ov.error ? <ErrorBox message={ov.error} onRetry={ov.reload} /> : ov.loading && !ov.data ? <Loading /> : ov.data && (
        <>
          {k.overCreditLimit && <Notice>Plafond d’encours dépassé : {moneyDT(k.outstanding)} dus pour un plafond de {moneyDT(k.creditLimit)}. Les nouvelles factures à crédit sont bloquées.</Notice>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Stat label="CA net 12 mois (TTC)" value={moneyDT(k.netRevenue12m)} sub={`${k.invoiceCount} facture(s)`} />
            <Stat label="Encours" value={moneyDT(k.outstanding)} sub={k.creditLimit != null ? `${k.creditUsedPct ?? 0} % du plafond` : "Pas de plafond"} tone={k.overCreditLimit ? "bad" : undefined} />
            <Stat label="En retard" value={moneyDT(k.overdue)} tone={k.overdue > 0 ? "bad" : "good"} />
            <Stat label="Délai moyen de règlement" value={k.averagePaymentDays == null ? "—" : `${k.averagePaymentDays} j`} sub={k.lastInvoice ? `Dernière facture ${fmtDate(k.lastInvoice)}` : undefined} />
            {k.creditsAvailable > 0 && <Stat label="Avoirs disponibles" value={moneyDT(k.creditsAvailable)} />}
          </div>

          <Card title={`Conditions — ${p.name}`} right={<Btn onClick={() => setEdit({ paymentTermsDays: p.paymentTermsDays ?? "", withholdingRate: p.withholdingRate ?? 0, taxId: p.taxId ?? "", notes: p.notes ?? "", creditLimit: p.creditLimit ?? "", discountPct: p.discountPct ?? 0, priceListId: p.priceListId ?? "" })}>Modifier</Btn>}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14 }}>
              <div><small>Délai de paiement</small><br /><b>{p.paymentTermsDays != null ? `${p.paymentTermsDays} jours` : "Par défaut de la société"}</b></div>
              {type === "client" && <div><small>Plafond d’encours</small><br /><b>{p.creditLimit != null ? moneyDT(p.creditLimit) : "—"}</b></div>}
              {type === "client" && <div><small>Remise habituelle</small><br /><b>{Number(p.discountPct || 0)} %</b></div>}
              {type === "client" && <div><small>Liste de prix</small><br /><b>{(lists.data || []).find((l: any) => l.id === p.priceListId)?.name || "Prix catalogue"}</b></div>}
              <div><small>Retenue à la source</small><br /><b>{Number(p.withholdingRate || 0)} %</b></div>
              <div><small>Matricule fiscal</small><br /><b>{p.taxId || "—"}</b></div>
            </div>
            {p.notes && <p style={{ margin: "12px 0 0", fontSize: 14, whiteSpace: "pre-wrap" }}>{p.notes}</p>}
          </Card>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Card title="Derniers documents" pad={false} style={{ flex: "2 1 460px" }}>
              {!ov.data.recentDocuments.length ? <Empty>Aucun document.</Empty> : (
                <TableWrap min={420}>
                  <thead><tr><th style={th}>Document</th><th style={th}>Date</th><th style={{ ...th, ...num }}>Total TTC</th><th style={{ ...th, ...num }}>Reste dû</th><th style={th}>Statut</th></tr></thead>
                  <tbody>{ov.data.recentDocuments.map((d: any) => (
                    <tr key={d.id}><td style={td}><Link href={`/dashboard/documents/${d.id}`} style={{ fontWeight: 600 }}>{d.number}</Link><br /><small>{DOC_LABEL[d.type] || d.type}</small></td><td style={td}>{fmtDate(d.issueDate)}</td>
                      <td style={{ ...td, ...num }}>{money(d.totalTTC)}</td><td style={{ ...td, ...num }}>{d.balanceDue ? money(d.balanceDue) : "—"}</td><td style={td}><StatusBadge status={d.paymentStatus || d.status} /></td></tr>
                  ))}</tbody>
                </TableWrap>
              )}
            </Card>
            <Card title="Meilleurs produits (HT)" pad={false} style={{ flex: "1 1 280px" }}>
              {!ov.data.topProducts.length ? <Empty>Aucune vente.</Empty> : (
                <TableWrap min={260}><tbody>{ov.data.topProducts.map((x: any, i: number) => <tr key={i}><td style={td}>{x.description}</td><td style={{ ...td, ...num }}>{money(x.revenue)}</td></tr>)}</tbody></TableWrap>
              )}
            </Card>
          </div>

          <Card title="Historique des échanges" right={<Btn variant="primary" onClick={() => setInter({ kind: "call", subject: "", content: "", followUpDate: "" })}>+ Noter un échange</Btn>} pad={false}>
            {!ov.data.interactions.length ? <Empty>Aucun échange enregistré.</Empty> : ov.data.interactions.map((i: any) => (
              <div key={i.id} style={{ padding: "10px 16px", borderTop: "1px solid var(--theme-border)", display: "flex", gap: 12, justifyContent: "space-between" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}><Badge tone={i.kind === "reminder" ? "amber" : "gray"}>{KIND[i.kind] || i.kind}</Badge> <b>{i.subject}</b></div>
                  {i.content && <div style={{ fontSize: 13, color: "var(--theme-text-secondary)", marginTop: 4, whiteSpace: "pre-wrap" }}>{i.content}</div>}
                  <div style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginTop: 4 }}>{fmtDate(i.createdAt)}{i.followUpDate ? ` — à suivre le ${fmtDate(i.followUpDate)}` : ""}</div>
                </div>
                {i.kind !== "reminder" && <Btn variant="danger" onClick={() => removeInteraction(i.id)} aria-label="Supprimer">×</Btn>}
              </div>
            ))}
          </Card>
        </>
      )}

      {edit && (
        <Modal title="Conditions commerciales" onClose={() => setEdit(null)} footer={<><Btn onClick={() => setEdit(null)}>Annuler</Btn><Btn variant="primary" busy={busy} onClick={saveConditions}>Enregistrer</Btn></>}>
          <Row>
            <Field label="Délai de paiement (jours)"><input style={inputStyle} inputMode="numeric" value={edit.paymentTermsDays} onChange={(e) => setEdit({ ...edit, paymentTermsDays: e.target.value })} placeholder="par défaut" /></Field>
            <Field label="Retenue à la source (%)"><input style={inputStyle} inputMode="decimal" value={edit.withholdingRate} onChange={(e) => setEdit({ ...edit, withholdingRate: e.target.value })} /></Field>
          </Row>
          {type === "client" && (
            <Row>
              <Field label="Plafond d’encours (DT)" hint="Vide = illimité"><input style={inputStyle} inputMode="decimal" value={edit.creditLimit} onChange={(e) => setEdit({ ...edit, creditLimit: e.target.value })} /></Field>
              <Field label="Remise habituelle (%)"><input style={inputStyle} inputMode="decimal" value={edit.discountPct} onChange={(e) => setEdit({ ...edit, discountPct: e.target.value })} /></Field>
            </Row>
          )}
          {type === "client" && (
            <Field label="Liste de prix"><select style={inputStyle} value={edit.priceListId} onChange={(e) => setEdit({ ...edit, priceListId: e.target.value })}><option value="">Prix catalogue</option>{(lists.data || []).filter((l: any) => l.active).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          )}
          <Field label="Matricule fiscal" hint="Format 1234567/A/M/000 — contrôlé à l’enregistrement"><input style={inputStyle} value={edit.taxId} onChange={(e) => setEdit({ ...edit, taxId: e.target.value })} /></Field>
          <div style={{ height: 8 }} />
          <Field label="Notes internes"><textarea style={{ ...inputStyle, minHeight: 70 }} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
        </Modal>
      )}
      {inter && (
        <Modal title="Noter un échange" onClose={() => setInter(null)} footer={<><Btn onClick={() => setInter(null)}>Annuler</Btn><Btn variant="primary" busy={busy} disabled={!inter.subject.trim()} onClick={saveInteraction}>Enregistrer</Btn></>}>
          <Field label="Type"><select style={inputStyle} value={inter.kind} onChange={(e) => setInter({ ...inter, kind: e.target.value })}>{["call", "email", "meeting", "visit", "note"].map((x) => <option key={x} value={x}>{KIND[x]}</option>)}</select></Field>
          <Field label="Objet"><input autoFocus maxLength={200} style={inputStyle} value={inter.subject} onChange={(e) => setInter({ ...inter, subject: e.target.value })} /></Field>
          <Field label="Détails"><textarea style={{ ...inputStyle, minHeight: 90 }} value={inter.content} onChange={(e) => setInter({ ...inter, content: e.target.value })} /></Field>
          <Field label="À suivre le (facultatif)"><input type="date" style={inputStyle} value={inter.followUpDate} onChange={(e) => setInter({ ...inter, followUpDate: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}

// ───────────────────────── À relancer ─────────────────────────
function FollowUps() {
  const [days, setDays] = useState(7);
  const f = useLoad(() => api<any[]>("/crm/follow-ups", { query: { days } }), [days]);
  return (
    <>
      <Card><Row><Field label="Horizon"><select style={inputStyle} value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={0}>Aujourd’hui et en retard</option><option value={7}>7 jours</option><option value={30}>30 jours</option></select></Field></Row></Card>
      {f.error && <ErrorBox message={f.error} onRetry={f.reload} />}
      <Card pad={false}>
        {f.loading && !f.data ? <Loading /> : !f.data?.length ? <Empty>Rien à suivre sur cet horizon.</Empty> : (
          <TableWrap>
            <thead><tr><th style={th}>Date de suivi</th><th style={th}>Tiers</th><th style={th}>Objet</th><th style={th} /></tr></thead>
            <tbody>{f.data.map((x: any) => (
              <tr key={x.id}>
                <td style={{ ...td, color: x.overdue ? "var(--theme-danger, #ef4444)" : undefined, fontWeight: x.overdue ? 700 : 400 }}>{fmtDate(x.followUpDate)}{x.overdue ? " · en retard" : ""}</td>
                <td style={td}>{x.partyName} <small>({x.partyType === "client" ? "client" : "fournisseur"})</small></td>
                <td style={td}><Badge tone="gray">{KIND[x.kind] || x.kind}</Badge> {x.subject}</td>
                <td style={td}>{x.documentId ? <Link href={`/dashboard/documents/${x.documentId}`}>Voir la facture</Link> : null}</td>
              </tr>
            ))}</tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}

// ───────────────────────── Listes de prix ─────────────────────────
function PriceLists({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const lists = useLoad(() => api<any[]>("/crm/price-lists"), []);
  const products = useLoad(() => api<any[]>("/products"), []);
  const [name, setName] = useState("");
  const [sel, setSel] = useState<any | null>(null);
  const [rows, setRows] = useState<Array<{ productId: number; price: string }>>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const byId = useMemo(() => new Map((products.data || []).map((p: any) => [p.id, p])), [products.data]);

  async function create() {
    if (!name.trim()) return;
    try { await api("/crm/price-lists", { method: "POST", body: { name } }); setName(""); lists.reload(); } catch (e: any) { notify(e.message, "err"); }
  }
  async function open(l: any) {
    try {
      const items = await api<any[]>(`/crm/price-lists/${l.id}/items`);
      setRows(items.map((i) => ({ productId: i.productId, price: String(i.price) }))); setDirty(false); setSel(l);
    } catch (e: any) { notify(e.message, "err"); }
  }
  async function save() {
    setBusy(true);
    try {
      const items = rows.filter((r) => r.productId).map((r) => ({ productId: r.productId, price: Number(String(r.price).replace(",", ".")) }));
      if (items.some((i) => !Number.isFinite(i.price) || i.price < 0)) throw new Error("Un des prix est invalide.");
      await api(`/crm/price-lists/${sel.id}/items`, { method: "PUT", body: { items } });
      setDirty(false); notify("Liste enregistrée."); lists.reload();
    } catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  }
  async function toggle(l: any) {
    try { await api(`/crm/price-lists/${l.id}`, { method: "PUT", body: { name: l.name, active: !l.active } }); lists.reload(); } catch (e: any) { notify(e.message, "err"); }
  }
  async function remove(l: any) {
    if (!confirm(`Supprimer la liste « ${l.name} » ? Les clients concernés repasseront au prix catalogue.`)) return;
    try { await api(`/crm/price-lists/${l.id}`, { method: "DELETE" }); if (sel?.id === l.id) setSel(null); lists.reload(); } catch (e: any) { notify(e.message, "err"); }
  }
  const used = new Set(rows.map((r) => r.productId));

  return (
    <>
      <Card title="Nouvelle liste"><Row><Field label="Nom" grow><input style={inputStyle} value={name} maxLength={120} placeholder="ex. Grossistes, Revendeurs…" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} /></Field><Btn variant="primary" onClick={create} disabled={!name.trim()}>Créer</Btn></Row></Card>
      {lists.error && <ErrorBox message={lists.error} onRetry={lists.reload} />}
      <Card pad={false}>
        {lists.loading && !lists.data ? <Loading /> : !lists.data?.length ? <Empty>Aucune liste de prix. Créez-en une pour proposer des tarifs spécifiques à certains clients.</Empty> : (
          <TableWrap min={520}>
            <thead><tr><th style={th}>Liste</th><th style={{ ...th, ...num }}>Produits</th><th style={{ ...th, ...num }}>Clients</th><th style={th}>État</th><th style={th} /></tr></thead>
            <tbody>{lists.data.map((l: any) => (
              <tr key={l.id}><td style={td}><b>{l.name}</b></td><td style={{ ...td, ...num }}>{l.itemCount}</td><td style={{ ...td, ...num }}>{l.clientCount}</td><td style={td}><Badge tone={l.active ? "green" : "gray"}>{l.active ? "active" : "inactive"}</Badge></td>
                <td style={{ ...td, whiteSpace: "nowrap" }}><Btn onClick={() => open(l)}>Prix</Btn> <Btn onClick={() => toggle(l)}>{l.active ? "Désactiver" : "Activer"}</Btn> <Btn variant="danger" onClick={() => remove(l)}>Supprimer</Btn></td></tr>
            ))}</tbody>
          </TableWrap>
        )}
      </Card>

      {sel && (
        <Modal title={`Prix — ${sel.name}`} width={760} onClose={() => { if (!dirty || confirm("Abandonner les modifications ?")) setSel(null); }}
          footer={<><Btn onClick={() => { if (!dirty || confirm("Abandonner les modifications ?")) setSel(null); }}>Fermer</Btn><Btn variant="primary" busy={busy} disabled={!dirty} onClick={save}>Enregistrer</Btn></>}>
          <Notice tone="blue">Un produit absent de la liste est vendu au prix catalogue. Le prix de la liste remplace le prix catalogue sur les documents du client concerné.</Notice>
          <TableWrap min={500}>
            <thead><tr><th style={th}>Produit</th><th style={{ ...th, ...num }}>Prix catalogue</th><th style={{ ...th, ...num }}>Prix de la liste (HT)</th><th style={th} /></tr></thead>
            <tbody>{rows.map((r, idx) => {
              const prod: any = byId.get(r.productId);
              return (
                <tr key={idx}><td style={td}>{prod ? prod.name : `#${r.productId}`}</td><td style={{ ...td, ...num }}>{prod ? money(prod.price) : "—"}</td>
                  <td style={{ ...td, width: 160 }}><input aria-label="Prix" inputMode="decimal" style={{ ...inputStyle, ...num }} value={r.price} onChange={(e) => { setRows(rows.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x))); setDirty(true); }} /></td>
                  <td style={td}><Btn variant="danger" aria-label="Retirer" onClick={() => { setRows(rows.filter((_, i) => i !== idx)); setDirty(true); }}>×</Btn></td></tr>
              );
            })}</tbody>
          </TableWrap>
          <Field label="Ajouter un produit">
            <select style={inputStyle} value="" onChange={(e) => { const id = Number(e.target.value); if (!id) return; const prod: any = byId.get(id); setRows([...rows, { productId: id, price: String(prod?.price ?? 0) }]); setDirty(true); }}>
              <option value="">— Choisir un produit —</option>
              {(products.data || []).filter((p: any) => !used.has(p.id)).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </Modal>
      )}
    </>
  );
}
