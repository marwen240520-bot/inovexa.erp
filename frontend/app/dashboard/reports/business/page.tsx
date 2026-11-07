"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  addDaysISO, api, Btn, Card, Empty, ErrorBox, Field, fetchFile, inputStyle, Loading, money, moneyDT, Notice, num, pct, Page, Row, Stat, TableWrap, Tabs, td, th, todayISO,
  useLoad, useNotice, useRequireAuth, qty,
} from "@/components/erp/kit";

type Tab = "sales" | "margins" | "stock";

export default function BusinessReportsPage() {
  useRequireAuth();
  const [tab, setTab] = useState<Tab>("sales");
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(todayISO());
  const [by, setBy] = useState<"product" | "client">("product");
  const [notice, notify] = useNotice();

  const sales = useLoad(() => (tab === "sales" ? api<any>("/reports/business/sales", { query: { from, to } }) : Promise.resolve(null)), [tab, from, to]);
  const margins = useLoad(() => (tab === "margins" ? api<any>("/reports/business/margins", { query: { from, to, by } }) : Promise.resolve(null)), [tab, from, to, by]);
  const stock = useLoad(() => (tab === "stock" ? api<any>("/stock/reports/valuation") : Promise.resolve(null)), [tab]);

  const exportKind = tab === "sales" ? "sales" : tab === "margins" ? "margins" : "stock-valuation";
  const maxMonth = Math.max(1, ...((sales.data?.byMonth || []).map((m: any) => Math.abs(m.revenue))));

  return (
    <Page title="Rapports de gestion" subtitle="Chiffre d’affaires net (factures − avoirs), marges et valorisation du stock"
      actions={<><Link href="/dashboard/documents/payments"><Btn>Créances / dettes</Btn></Link><Btn onClick={() => fetchFile(`/reports/business/export/${exportKind}`, { query: { from, to } }).catch((e) => notify(e.message, "err"))}>Exporter en Excel</Btn></>}>
      {notice}
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[["sales", "Ventes"], ["margins", "Marges"], ["stock", "Valorisation du stock"]]} />
      {tab !== "stock" && (
        <Card>
          <Row>
            <Field label="Du"><input type="date" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Au"><input type="date" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            <Btn onClick={() => { setFrom(`${new Date().getFullYear()}-01-01`); setTo(todayISO()); }}>Cette année</Btn>
            <Btn onClick={() => { setFrom(addDaysISO(-30)); setTo(todayISO()); }}>30 derniers jours</Btn>
            {tab === "margins" && <Field label="Regrouper par"><select style={inputStyle} value={by} onChange={(e) => setBy(e.target.value as any)}><option value="product">Produit</option><option value="client">Client</option></select></Field>}
          </Row>
        </Card>
      )}

      {tab === "sales" && (
        <>
          {sales.error && <ErrorBox message={sales.error} onRetry={sales.reload} />}
          {sales.loading && !sales.data ? <Loading /> : sales.data && (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <Stat label="CA net HT" value={moneyDT(sales.data.totals.netHT)} sub={`${sales.data.totals.invoices} facture(s), ${sales.data.totals.creditNotes} avoir(s)`} />
                <Stat label="CA net TTC" value={moneyDT(sales.data.totals.netTTC)} />
                <Stat label="Avoirs (HT)" value={moneyDT(sales.data.totals.creditedHT)} />
                <Stat label="Facture moyenne HT" value={moneyDT(sales.data.totals.averageInvoiceHT)} />
              </div>
              <Card title="Chiffre d’affaires par mois" pad>
                {!sales.data.byMonth.length ? <Empty>Aucune vente validée sur la période.</Empty> : (
                  <div role="img" aria-label="Chiffre d’affaires par mois" style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180, overflowX: "auto" }}>
                    {sales.data.byMonth.map((m: any) => (
                      <div key={m.month} style={{ flex: "1 0 54px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 4 }}>
                        <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{money(m.revenue)}</span>
                        <div style={{ width: "100%", maxWidth: 48, height: `${Math.max(4, (Math.abs(m.revenue) / maxMonth) * 120)}px`, background: m.revenue < 0 ? "var(--theme-danger, #ef4444)" : "var(--theme-primary, #4f46e5)", borderRadius: "6px 6px 0 0" }} />
                        <span style={{ fontSize: 11, color: "var(--theme-text-secondary)" }}>{m.month.slice(5)}/{m.month.slice(2, 4)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Card title="Meilleurs produits" pad={false} style={{ flex: "1 1 400px" }}>
                  <TableWrap min={380}><thead><tr><th style={th}>Produit</th><th style={{ ...th, ...num }}>Qté</th><th style={{ ...th, ...num }}>CA HT</th><th style={{ ...th, ...num }}>Part</th></tr></thead>
                    <tbody>{sales.data.topProducts.map((p: any, i: number) => <tr key={i}><td style={td}>{p.name}</td><td style={{ ...td, ...num }}>{qty(p.quantity)}</td><td style={{ ...td, ...num }}>{money(p.revenue)}</td><td style={{ ...td, ...num }}>{pct(p.share)}</td></tr>)}</tbody></TableWrap>
                </Card>
                <Card title="Meilleurs clients" pad={false} style={{ flex: "1 1 400px" }}>
                  <TableWrap min={380}><thead><tr><th style={th}>Client</th><th style={{ ...th, ...num }}>Factures</th><th style={{ ...th, ...num }}>CA HT</th><th style={{ ...th, ...num }}>Part</th></tr></thead>
                    <tbody>{sales.data.topClients.map((c: any, i: number) => <tr key={i}><td style={td}>{c.name}</td><td style={{ ...td, ...num }}>{c.invoices}</td><td style={{ ...td, ...num }}>{money(c.revenue)}</td><td style={{ ...td, ...num }}>{pct(c.share)}</td></tr>)}</tbody></TableWrap>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {tab === "margins" && (
        <>
          {margins.error && <ErrorBox message={margins.error} onRetry={margins.reload} />}
          {margins.loading && !margins.data ? <Loading /> : margins.data && (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <Stat label="Chiffre d’affaires HT" value={moneyDT(margins.data.totals.revenue)} /><Stat label="Coût des marchandises" value={moneyDT(margins.data.totals.cost)} />
                <Stat label="Marge brute" value={moneyDT(margins.data.totals.margin)} tone={margins.data.totals.margin >= 0 ? "good" : "bad"} /><Stat label="Taux de marge" value={pct(margins.data.totals.marginRate)} />
              </div>
              {margins.data.note && <Notice>{margins.data.note}</Notice>}
              <Card pad={false}>
                {!margins.data.items.length ? <Empty>Aucune vente sur la période.</Empty> : (
                  <TableWrap>
                    <thead><tr><th style={th}>{by === "product" ? "Produit" : "Client"}</th><th style={{ ...th, ...num }}>Qté</th><th style={{ ...th, ...num }}>CA HT</th><th style={{ ...th, ...num }}>Coût</th><th style={{ ...th, ...num }}>Marge</th><th style={{ ...th, ...num }}>Taux</th></tr></thead>
                    <tbody>{margins.data.items.map((i: any, k: number) => (
                      <tr key={k}><td style={td}>{i.name}{i.linesWithoutCost > 0 && <span title="Coût d’achat inconnu : marge surestimée" style={{ color: "var(--theme-warning, #f59e0b)" }}> ⚠</span>}</td>
                        <td style={{ ...td, ...num }}>{qty(i.quantity)}</td><td style={{ ...td, ...num }}>{money(i.revenue)}</td><td style={{ ...td, ...num }}>{money(i.cost)}</td>
                        <td style={{ ...td, ...num, fontWeight: 700, color: i.margin < 0 ? "var(--theme-danger, #ef4444)" : undefined }}>{money(i.margin)}</td><td style={{ ...td, ...num }}>{pct(i.marginRate)}</td></tr>
                    ))}</tbody>
                  </TableWrap>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {tab === "stock" && (
        <>
          {stock.error && <ErrorBox message={stock.error} onRetry={stock.reload} />}
          {stock.loading && !stock.data ? <Loading /> : stock.data && (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}><Stat label="Valeur totale du stock" value={moneyDT(stock.data.totalValue)} sub={stock.data.method} /></div>
              {stock.data.note && <Notice>{stock.data.note}</Notice>}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Card title="Par dépôt" pad={false} style={{ flex: "1 1 360px" }}>
                  <TableWrap min={340}><thead><tr><th style={th}>Dépôt</th><th style={{ ...th, ...num }}>Quantité</th><th style={{ ...th, ...num }}>Valeur</th></tr></thead>
                    <tbody>{stock.data.warehouses.map((w: any) => <tr key={w.warehouseId}><td style={td}>{w.warehouse}</td><td style={{ ...td, ...num }}>{qty(w.quantity)}</td><td style={{ ...td, ...num }}>{money(w.value)}</td></tr>)}</tbody></TableWrap>
                </Card>
                <Card title="Par catégorie" pad={false} style={{ flex: "1 1 360px" }}>
                  <TableWrap min={340}><thead><tr><th style={th}>Catégorie</th><th style={{ ...th, ...num }}>Valeur</th></tr></thead>
                    <tbody>{stock.data.categories.map((c: any) => <tr key={c.category}><td style={td}>{c.category}</td><td style={{ ...td, ...num }}>{money(c.value)}</td></tr>)}</tbody></TableWrap>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </Page>
  );
}
