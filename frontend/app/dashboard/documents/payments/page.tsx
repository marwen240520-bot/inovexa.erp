"use client";
import React, { useState } from "react";
import Link from "next/link";
import { api, Badge, Btn, Card, Empty, ErrorBox, fetchFile, fmtDate, inputStyle, Loading, money, moneyDT, num, Page, Row, Stat, TableWrap, td, th, todayISO, addDaysISO, useLoad, useRequireAuth, useNotice } from "@/components/erp/kit";

const METHODS: Record<string, string> = { cash: "Espèces", card: "Carte", transfer: "Virement", check: "Chèque", draft: "Traite", mobile: "Mobile", credit_note: "Avoir", other: "Autre" };

export default function PaymentsPage() {
  useRequireAuth();
  const [tab, setTab] = useState<"journal" | "clients" | "suppliers">("journal");
  const [from, setFrom] = useState(addDaysISO(-30));
  const [to, setTo] = useState(todayISO());
  const [partyType, setPartyType] = useState("");
  const [notice, notify] = useNotice();

  const payments = useLoad(() => api<any[]>("/documents/payments", { query: { from, to, partyType, limit: 500 } }), [from, to, partyType]);
  const aging = useLoad(() => api<any>("/documents/reports/aging", { query: { side: tab === "suppliers" ? "supplier" : "client" } }), [tab]);

  const total = (payments.data || []).filter((p) => !p.voidedAt && p.method !== "credit_note").reduce((s, p) => s + (p.partyType === "client" ? p.amount : -p.amount), 0);

  return (
    <Page title="Règlements et créances" subtitle="Journal des encaissements/décaissements et balance âgée"
      actions={tab !== "journal" ? <Btn onClick={() => fetchFile(`/reports/business/export/${tab === "clients" ? "aging-clients" : "aging-suppliers"}`).catch((e) => notify(e.message, "err"))}>Exporter en Excel</Btn> : undefined}>
      {notice}
      <div role="tablist" style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--theme-border)" }}>
        {([["journal", "Journal des règlements"], ["clients", "Créances clients"], ["suppliers", "Dettes fournisseurs"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} style={{ padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 14, fontWeight: tab === k ? 700 : 500, color: tab === k ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary)", borderBottom: tab === k ? "2px solid var(--theme-primary, #4f46e5)" : "2px solid transparent", marginBottom: -1 }}>{l}</button>
        ))}
      </div>

      {tab === "journal" ? (
        <>
          <Card>
            <Row>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Du<br /><input type="date" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Au<br /><input type="date" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} /></label>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Sens<br />
                <select style={inputStyle} value={partyType} onChange={(e) => setPartyType(e.target.value)}><option value="">Tous</option><option value="client">Encaissements</option><option value="supplier">Décaissements</option></select>
              </label>
              <Stat label="Solde de la période (encaissé − décaissé)" value={moneyDT(total)} tone={total >= 0 ? "good" : "bad"} />
            </Row>
          </Card>
          {payments.error && <ErrorBox message={payments.error} onRetry={payments.reload} />}
          <Card pad={false}>
            {payments.loading && !payments.data ? <Loading /> : !payments.data?.length ? <Empty>Aucun règlement sur la période.</Empty> : (
              <TableWrap>
                <thead><tr><th style={th}>Date</th><th style={th}>Règlement</th><th style={th}>Document</th><th style={th}>Tiers</th><th style={th}>Moyen</th><th style={{ ...th, ...num }}>Montant</th></tr></thead>
                <tbody>{payments.data.map((p) => (
                  <tr key={p.id} style={p.voidedAt ? { opacity: 0.55, textDecoration: "line-through" } : undefined}>
                    <td style={td}>{fmtDate(p.date)}</td><td style={td}>{p.number || p.id}</td>
                    <td style={td}><Link href={`/dashboard/documents/${p.documentId}`} style={{ color: "var(--theme-primary, #4f46e5)" }}>{p.documentNumber}</Link></td>
                    <td style={td}>{p.partyName} {p.partyType === "supplier" && <Badge>Fournisseur</Badge>}</td><td style={td}>{METHODS[p.method] || p.method}</td>
                    <td style={{ ...td, ...num }}>{money(p.amount)}</td>
                  </tr>
                ))}</tbody>
              </TableWrap>
            )}
          </Card>
        </>
      ) : (
        <>
          {aging.error && <ErrorBox message={aging.error} onRetry={aging.reload} />}
          {aging.data && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <Stat label="Non échu" value={money(aging.data.totals.current)} />
                <Stat label="1–30 jours" value={money(aging.data.totals.d1_30)} />
                <Stat label="31–60 jours" value={money(aging.data.totals.d31_60)} />
                <Stat label="61–90 jours" value={money(aging.data.totals.d61_90)} tone={aging.data.totals.d61_90 > 0 ? "bad" : undefined} />
                <Stat label="> 90 jours" value={money(aging.data.totals.d90plus)} tone={aging.data.totals.d90plus > 0 ? "bad" : undefined} />
                <Stat label="Net dû (avoirs déduits)" value={moneyDT(aging.data.totals.net)} />
              </div>
              <Card pad={false}>
                {!aging.data.parties.length ? <Empty>Aucun solde ouvert.</Empty> : (
                  <TableWrap>
                    <thead><tr><th style={th}>{tab === "clients" ? "Client" : "Fournisseur"}</th><th style={{ ...th, ...num }}>Non échu</th><th style={{ ...th, ...num }}>1–30</th><th style={{ ...th, ...num }}>31–60</th><th style={{ ...th, ...num }}>61–90</th><th style={{ ...th, ...num }}>&gt; 90</th><th style={{ ...th, ...num }}>Avoirs</th><th style={{ ...th, ...num }}>Net</th></tr></thead>
                    <tbody>{aging.data.parties.map((p: any) => (
                      <tr key={p.key}><td style={{ ...td, fontWeight: 600 }}>{p.partyName}</td>
                        {["current", "d1_30", "d31_60", "d61_90", "d90plus", "credits", "net"].map((k) => <td key={k} style={{ ...td, ...num, color: (k === "d61_90" || k === "d90plus") && p[k] > 0 ? "var(--theme-danger, #ef4444)" : undefined, fontWeight: k === "net" ? 700 : 400 }}>{p[k] ? money(p[k]) : "—"}</td>)}
                      </tr>
                    ))}</tbody>
                  </TableWrap>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </Page>
  );
}
