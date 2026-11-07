"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Btn, Card, Empty, ErrorBox, fmtDate, inputStyle, Loading, money, num, Page, Row, StatusBadge, TableWrap, td, th, useLoad, useRequireAuth } from "@/components/erp/kit";

const SALES = [["invoice", "Factures"], ["quote", "Devis"], ["delivery_note", "Bons de livraison"], ["credit_note", "Avoirs"]] as const;
const PURCHASES = [["supplier_invoice", "Factures fournisseurs"], ["purchase_order", "Bons de commande"], ["goods_receipt", "Réceptions"], ["supplier_credit_note", "Avoirs fournisseurs"]] as const;
const SETTLES = new Set(["invoice", "credit_note", "supplier_invoice", "supplier_credit_note"]);
const SINGULAR: Record<string, string> = {
  invoice: "facture", quote: "devis", delivery_note: "bon de livraison", credit_note: "avoir",
  supplier_invoice: "facture fournisseur", purchase_order: "bon de commande", goods_receipt: "bon de réception", supplier_credit_note: "avoir fournisseur",
};

function DocumentsList() {
  useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("type") || "invoice";
  const [type, setType] = useState<string>(initial);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [limit, setLimit] = useState(50);
  const side = PURCHASES.some(([t]) => t === type) ? "purchases" : "sales";
  const tabs = side === "sales" ? SALES : PURCHASES;
  const settles = SETTLES.has(type);

  const list = useLoad(
    () => api<{ total: number; items: any[] }>("/documents", { query: { type, search: search.trim(), status, overdue: overdue || undefined, limit } }),
    [type, search, status, overdue, limit],
  );

  const switchSide = (s: "sales" | "purchases") => { setType(s === "sales" ? "invoice" : "supplier_invoice"); setLimit(50); setStatus(""); setOverdue(false); };

  return (
    <Page
      title="Documents commerciaux"
      subtitle="Devis, livraisons, factures et avoirs — achats et ventes, numérotation légale sans trou"
      actions={
        <>
          <Link href="/dashboard/documents/payments"><Btn>Règlements</Btn></Link>
          <Btn variant="primary" onClick={() => router.push(`/dashboard/documents/new?type=${type}`)}>+ Nouveau {SINGULAR[type]}</Btn>
        </>
      }
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Btn variant={side === "sales" ? "primary" : "ghost"} onClick={() => switchSide("sales")}>Ventes</Btn>
        <Btn variant={side === "purchases" ? "primary" : "ghost"} onClick={() => switchSide("purchases")}>Achats</Btn>
      </div>
      <div role="tablist" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16, borderBottom: "1px solid var(--theme-border)" }}>
        {tabs.map(([t, label]) => (
          <button key={t} role="tab" aria-selected={type === t} onClick={() => { setType(t); setLimit(50); setStatus(""); setOverdue(false); }}
            style={{ padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 14, fontWeight: type === t ? 700 : 500, color: type === t ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary)", borderBottom: type === t ? "2px solid var(--theme-primary, #4f46e5)" : "2px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      <Card pad>
        <Row>
          <input aria-label="Rechercher" style={{ ...inputStyle, flex: "1 1 240px" }} placeholder="Numéro, tiers, référence…" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(50); }} />
          <select aria-label="Statut" style={{ ...inputStyle, width: 190 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous les statuts</option><option value="draft">Brouillons</option><option value="validated">Validés</option>
            <option value="sent">Envoyés</option><option value="cancelled">Annulés</option>
          </select>
          {settles && (
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14, whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <input type="checkbox" style={{ width: "auto", margin: 0 }} checked={overdue} onChange={(e) => setOverdue(e.target.checked)} /> En retard uniquement
            </label>
          )}
        </Row>
      </Card>

      {list.error && <ErrorBox message={list.error} onRetry={list.reload} />}
      <Card pad={false}>
        {list.loading && !list.data ? <Loading /> : !list.data?.items.length ? <Empty>Aucun {SINGULAR[type]} pour ces critères.</Empty> : (
          <TableWrap>
            <thead>
              <tr>
                <th style={th}>Numéro</th><th style={th}>{side === "sales" ? "Client" : "Fournisseur"}</th><th style={th}>Date</th>
                {settles && <th style={th}>Échéance</th>}<th style={{ ...th, ...num }}>Total TTC</th>
                {settles && <th style={{ ...th, ...num }}>Reste dû</th>}<th style={th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((d) => (
                <tr key={d.id} onClick={() => router.push(`/dashboard/documents/${d.id}`)} style={{ cursor: "pointer" }}>
                  <td style={{ ...td, fontWeight: 600 }}><Link href={`/dashboard/documents/${d.id}`} style={{ color: "inherit" }}>{d.number || "Brouillon"}</Link></td>
                  <td style={td}>{d.partyName}</td>
                  <td style={td}>{fmtDate(d.issueDate)}</td>
                  {settles && <td style={{ ...td, color: d.overdue ? "var(--theme-danger, #ef4444)" : undefined, fontWeight: d.overdue ? 700 : 400 }}>{fmtDate(d.dueDate)}</td>}
                  <td style={{ ...td, ...num }}>{money(d.totalTTC)}</td>
                  {settles && <td style={{ ...td, ...num }}>{d.lockedAt ? money(d.balanceDue) : "—"}</td>}
                  <td style={td}>
                    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                      <StatusBadge status={d.status} />{d.lockedAt && settles && <StatusBadge status={d.paymentStatus} />}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {list.data && list.data.total > list.data.items.length && (
          <div style={{ padding: 12, textAlign: "center" }}><Btn onClick={() => setLimit(limit + 50)}>Afficher plus ({list.data.items.length}/{list.data.total})</Btn></div>
        )}
      </Card>
    </Page>
  );
}

export default function Page_() {
  return <Suspense fallback={<Loading />}><DocumentsList /></Suspense>;
}
