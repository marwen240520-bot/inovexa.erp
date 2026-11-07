"use client";
import React, { useState } from "react";
import {
  api, Badge, Btn, Card, Empty, ErrorBox, Field, fetchFile, fmtDate, inputStyle, Loading, Modal, money, moneyDT, Notice, num, Page, Row, Stat, TableWrap, Tabs, td, th,
  todayISO, useLoad, useNotice, useRequireAuth,
} from "@/components/erp/kit";

type Tab = "journal" | "balance" | "result" | "vat" | "bank";
const yearStart = () => `${new Date().getFullYear()}-01-01`;

export default function AccountingPage() {
  useRequireAuth();
  const [tab, setTab] = useState<Tab>("journal");
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(todayISO());
  const [notice, notify] = useNotice();
  const [entryOpen, setEntryOpen] = useState(false);

  const exportKind: Partial<Record<Tab, string>> = { journal: "journal", balance: "trial-balance", result: "income-statement", vat: "vat" };

  return (
    <Page
      title="Comptabilité"
      subtitle="Écritures générées automatiquement par les ventes, achats, règlements et la paie — plan comptable indicatif à valider avec votre comptable"
      actions={
        <>
          {exportKind[tab] && <Btn onClick={() => fetchFile(`/accounting/export/${exportKind[tab]}`, { query: { from, to } }).catch((e) => notify(e.message, "err"))}>Exporter en Excel</Btn>}
          <Btn variant="primary" onClick={() => setEntryOpen(true)}>+ Écriture manuelle</Btn>
        </>
      }
    >
      {notice}
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[["journal", "Journal"], ["balance", "Balance"], ["result", "Résultat"], ["vat", "TVA"], ["bank", "Rapprochement bancaire"]]} />
      {tab !== "bank" && (
        <Card>
          <Row>
            <Field label="Du"><input type="date" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Au"><input type="date" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </Row>
        </Card>
      )}
      {tab === "journal" && <Journal from={from} to={to} notify={notify} />}
      {tab === "balance" && <Balance from={from} to={to} />}
      {tab === "result" && <Result from={from} to={to} />}
      {tab === "vat" && <Vat from={from} to={to} />}
      {tab === "bank" && <Bank notify={notify} />}
      {entryOpen && <ManualEntry onClose={() => setEntryOpen(false)} notify={notify} />}
    </Page>
  );
}

function Journal({ from, to, notify }: { from: string; to: string; notify: (m: string, t?: "ok" | "err") => void }) {
  const [journal, setJournal] = useState("");
  const data = useLoad(() => api<any>("/accounting/journal", { query: { from, to, journal, limit: 100 } }), [from, to, journal]);
  const reverse = async (id: number) => {
    if (!confirm("Contre-passer cette écriture manuelle ?")) return;
    try { await api(`/accounting/entries/${id}/reverse`, { method: "POST", body: {} }); notify("Écriture contre-passée."); data.reload(); } catch (e: any) { notify(e.message, "err"); }
  };
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <select aria-label="Journal" style={{ ...inputStyle, width: 220 }} value={journal} onChange={(e) => setJournal(e.target.value)}>
          <option value="">Tous les journaux</option><option value="VT">VT — Ventes</option><option value="AC">AC — Achats</option><option value="BQ">BQ — Banque</option><option value="CA">CA — Caisse</option><option value="OD">OD — Opérations diverses</option>
        </select>
      </div>
      {data.error && <ErrorBox message={data.error} onRetry={data.reload} />}
      {data.loading && !data.data ? <Loading /> : !data.data?.entries.length ? <Card><Empty>Aucune écriture sur la période.</Empty></Card> : data.data.entries.map((e: any) => (
        <Card key={e.id} pad={false}
          title={<span>{fmtDate(e.date)} · <Badge tone="blue">{e.journal}</Badge> {e.number} — {e.label}</span>}
          right={(e.refType === "manual" || !e.refType) && !e.reversedBy ? <Btn variant="danger" onClick={() => reverse(e.id)}>Contre-passer</Btn> : undefined}>
          <TableWrap>
            <thead><tr><th style={th}>Compte</th><th style={th}>Libellé</th><th style={{ ...th, ...num }}>Débit</th><th style={{ ...th, ...num }}>Crédit</th></tr></thead>
            <tbody>
              {e.lines.map((l: any, i: number) => <tr key={i}><td style={td}><strong>{l.accountCode}</strong> {l.accountName}</td><td style={td}>{l.label || ""}</td><td style={{ ...td, ...num }}>{l.debit ? money(l.debit) : ""}</td><td style={{ ...td, ...num }}>{l.credit ? money(l.credit) : ""}</td></tr>)}
              <tr><td style={{ ...td, fontWeight: 700 }} colSpan={2}>Total</td><td style={{ ...td, ...num, fontWeight: 700 }}>{money(e.totalDebit)}</td><td style={{ ...td, ...num, fontWeight: 700 }}>{money(e.totalCredit)}</td></tr>
            </tbody>
          </TableWrap>
        </Card>
      ))}
      {data.data && data.data.total > data.data.entries.length && <Notice tone="blue">{data.data.entries.length} écritures affichées sur {data.data.total} : affinez la période ou exportez en Excel.</Notice>}
    </>
  );
}

function Balance({ from, to }: { from: string; to: string }) {
  const data = useLoad(() => api<any>("/accounting/trial-balance", { query: { from, to } }), [from, to]);
  const t = data.data?.totals;
  return (
    <>
      {data.error && <ErrorBox message={data.error} onRetry={data.reload} />}
      {t && <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label="Total débit" value={money(t.debit)} /><Stat label="Total crédit" value={money(t.credit)} />
        <Stat label="Équilibre" value={Math.abs(t.debit - t.credit) < 0.001 ? "Équilibrée ✔" : "ÉCART"} tone={Math.abs(t.debit - t.credit) < 0.001 ? "good" : "bad"} />
      </div>}
      <Card pad={false}>
        {data.loading && !data.data ? <Loading /> : !data.data?.accounts.length ? <Empty>Aucun mouvement.</Empty> : (
          <TableWrap>
            <thead><tr><th style={th}>Compte</th><th style={th}>Intitulé</th><th style={{ ...th, ...num }}>Ouverture</th><th style={{ ...th, ...num }}>Débit</th><th style={{ ...th, ...num }}>Crédit</th><th style={{ ...th, ...num }}>Solde débiteur</th><th style={{ ...th, ...num }}>Solde créditeur</th></tr></thead>
            <tbody>
              {data.data.accounts.map((a: any) => <tr key={a.code}><td style={{ ...td, fontWeight: 600 }}>{a.code}</td><td style={td}>{a.name}</td><td style={{ ...td, ...num }}>{a.opening ? money(a.opening) : ""}</td><td style={{ ...td, ...num }}>{money(a.debit)}</td><td style={{ ...td, ...num }}>{money(a.credit)}</td><td style={{ ...td, ...num }}>{a.closingDebit ? money(a.closingDebit) : ""}</td><td style={{ ...td, ...num }}>{a.closingCredit ? money(a.closingCredit) : ""}</td></tr>)}
              <tr><td style={{ ...td, fontWeight: 800 }} colSpan={3}>TOTAUX</td><td style={{ ...td, ...num, fontWeight: 800 }}>{money(t.debit)}</td><td style={{ ...td, ...num, fontWeight: 800 }}>{money(t.credit)}</td><td style={{ ...td, ...num, fontWeight: 800 }}>{money(t.closingDebit)}</td><td style={{ ...td, ...num, fontWeight: 800 }}>{money(t.closingCredit)}</td></tr>
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}

function Result({ from, to }: { from: string; to: string }) {
  const data = useLoad(() => api<any>("/accounting/income-statement", { query: { from, to } }), [from, to]);
  const d = data.data;
  const block = (title: string, rows: any[], total: number) => (
    <Card title={title} pad={false} style={{ flex: "1 1 340px" }}>
      <TableWrap>
        <tbody>
          {rows.map((r) => <tr key={r.code}><td style={td}><strong>{r.code}</strong> {r.name}</td><td style={{ ...td, ...num }}>{money(r.amount)}</td></tr>)}
          <tr><td style={{ ...td, fontWeight: 800 }}>Total</td><td style={{ ...td, ...num, fontWeight: 800 }}>{money(total)}</td></tr>
        </tbody>
      </TableWrap>
    </Card>
  );
  return (
    <>
      {data.error && <ErrorBox message={data.error} onRetry={data.reload} />}
      {data.loading && !d ? <Loading /> : d && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Stat label="Produits" value={moneyDT(d.totalIncome)} /><Stat label="Charges" value={moneyDT(d.totalExpenses)} />
            <Stat label={d.result >= 0 ? "Bénéfice" : "Perte"} value={moneyDT(d.result)} tone={d.result >= 0 ? "good" : "bad"} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>{block("Produits", d.income, d.totalIncome)}{block("Charges", d.expenses, d.totalExpenses)}</div>
        </>
      )}
    </>
  );
}

function Vat({ from, to }: { from: string; to: string }) {
  const data = useLoad(() => api<any>("/accounting/vat", { query: { from, to } }), [from, to]);
  const d = data.data;
  const side = (title: string, s: any) => (
    <Card title={title} pad={false} style={{ flex: "1 1 340px" }}>
      <TableWrap>
        <thead><tr><th style={th}>Taux</th><th style={{ ...th, ...num }}>Base HT</th><th style={{ ...th, ...num }}>TVA</th></tr></thead>
        <tbody>
          {s.byRate.map((r: any) => <tr key={r.rate}><td style={td}>{r.rate} %</td><td style={{ ...td, ...num }}>{money(r.baseHT)}</td><td style={{ ...td, ...num }}>{money(r.vat)}</td></tr>)}
          <tr><td style={{ ...td, fontWeight: 800 }}>Total</td><td style={{ ...td, ...num, fontWeight: 800 }}>{money(s.baseHT)}</td><td style={{ ...td, ...num, fontWeight: 800 }}>{money(s.vat)}</td></tr>
        </tbody>
      </TableWrap>
    </Card>
  );
  return (
    <>
      <Notice tone="blue">Base de déclaration calculée sur la <strong>date des factures</strong> (régime des débits), avoirs déduits. À vérifier avec votre comptable avant dépôt.</Notice>
      {data.error && <ErrorBox message={data.error} onRetry={data.reload} />}
      {data.loading && !d ? <Loading /> : d && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Stat label="TVA à payer" value={moneyDT(d.vatPayable)} tone={d.vatPayable > 0 ? "bad" : undefined} /><Stat label="Crédit de TVA" value={moneyDT(d.vatCredit)} tone={d.vatCredit > 0 ? "good" : undefined} />
            <Stat label="Timbre facturé" value={moneyDT(d.stampDutyCollected)} /><Stat label="Retenues subies" value={moneyDT(d.withholdingSuffered)} /><Stat label="Retenues opérées" value={moneyDT(d.withholdingOperated)} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>{side("TVA collectée (ventes)", d.collected)}{side("TVA déductible (achats)", d.deductible)}</div>
        </>
      )}
    </>
  );
}

function ManualEntry({ onClose, notify }: { onClose: () => void; notify: (m: string, t?: "ok" | "err") => void }) {
  const [date, setDate] = useState(todayISO());
  const [label, setLabel] = useState("");
  const [lines, setLines] = useState([{ accountCode: "", debit: "", credit: "", label: "" }, { accountCode: "", debit: "", credit: "", label: "" }]);
  const [busy, setBusy] = useState(false);
  const chart = useLoad(() => api<any>("/accounting/chart"), []);
  const sum = (k: "debit" | "credit") => lines.reduce((s, l) => s + (Number(l[k]) || 0), 0);
  const balanced = Math.abs(sum("debit") - sum("credit")) < 0.0005 && sum("debit") > 0;
  const setLine = (i: number, p: Partial<(typeof lines)[number]>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const save = async () => {
    setBusy(true);
    try {
      await api("/accounting/entries", { method: "POST", body: { date, label, lines: lines.filter((l) => l.accountCode).map((l) => ({ accountCode: l.accountCode, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, label: l.label || undefined })) } });
      notify("Écriture enregistrée.");
      onClose();
      window.location.reload();
    } catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  };
  return (
    <Modal title="Écriture manuelle (opérations diverses)" width={760} onClose={onClose}
      footer={<><Btn onClick={onClose}>Fermer</Btn><Btn variant="primary" busy={busy} disabled={!balanced || !label.trim()} onClick={save}>Enregistrer</Btn></>}>
      <Row><Field label="Date"><input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} /></Field><Field label="Libellé" grow><input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} /></Field></Row>
      <TableWrap>
        <thead><tr><th style={th}>Compte</th><th style={th}>Libellé</th><th style={{ ...th, ...num }}>Débit</th><th style={{ ...th, ...num }}>Crédit</th></tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={td}><input aria-label="Compte" list="chart-accounts" style={{ ...inputStyle, width: 130 }} value={l.accountCode} onChange={(e) => setLine(i, { accountCode: e.target.value })} /></td>
              <td style={td}><input aria-label="Libellé de ligne" style={inputStyle} value={l.label} onChange={(e) => setLine(i, { label: e.target.value })} /></td>
              <td style={{ ...td, width: 120 }}><input aria-label="Débit" inputMode="decimal" style={{ ...inputStyle, ...num }} value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: e.target.value ? "" : l.credit })} /></td>
              <td style={{ ...td, width: 120 }}><input aria-label="Crédit" inputMode="decimal" style={{ ...inputStyle, ...num }} value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: e.target.value ? "" : l.debit })} /></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <datalist id="chart-accounts">{(chart.data?.accounts || []).map((a: any) => <option key={a.code} value={a.code}>{a.name}</option>)}</datalist>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Btn onClick={() => setLines([...lines, { accountCode: "", debit: "", credit: "", label: "" }])}>+ Ligne</Btn>
        <span style={{ fontWeight: 700, color: balanced ? "var(--theme-success, #10b981)" : "var(--theme-danger, #ef4444)" }}>Débit {money(sum("debit"))} · Crédit {money(sum("credit"))} {balanced ? "✔ équilibrée" : "— doit être équilibrée"}</span>
      </div>
    </Modal>
  );
}

function Bank({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const accounts = useLoad(() => api<any[]>("/finance/accounts"), []);
  const [bankId, setBankId] = useState<number | "">("");
  const [status, setStatus] = useState("unmatched");
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<{ line: any; items: any[] } | null>(null);
  const bid = bankId === "" ? (accounts.data?.[0]?.id ?? "") : bankId;
  const lines = useLoad(() => (bid === "" ? Promise.resolve(null) : api<any>("/accounting/bank/lines", { query: { bankAccountId: bid, status } })), [bid, status]);

  const act = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try { const r = await fn(); notify(typeof r?.matched === "number" ? `${r.matched} ligne(s) rapprochée(s).` : ok); lines.reload(); setSuggest(null); } catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  };
  const openSuggestions = async (line: any) => {
    try { setSuggest({ line, items: await api<any[]>(`/accounting/bank/lines/${line.id}/suggestions`) }); } catch (e: any) { notify(e.message, "err"); }
  };

  if (accounts.loading && !accounts.data) return <Loading />;
  if (!accounts.data?.length) return <Card><Empty>Aucun compte bancaire. Ajoutez-en un dans le module Finance pour importer un relevé.</Empty></Card>;
  const summary: any[] = lines.data?.summary || [];
  return (
    <>
      <Card>
        <Row>
          <Field label="Compte bancaire"><select style={inputStyle} value={bid} onChange={(e) => setBankId(Number(e.target.value))}>{accounts.data.map((a: any) => <option key={a.id} value={a.id}>{a.name || a.bankName} {a.accountNumber ? `· ${a.accountNumber}` : ""}</option>)}</select></Field>
          <Field label="Lignes"><select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}><option value="unmatched">À rapprocher</option><option value="matched">Rapprochées</option><option value="ignored">Ignorées</option><option value="">Toutes</option></select></Field>
          <Btn onClick={() => setImportOpen(true)}>Importer un relevé</Btn>
          <Btn variant="primary" busy={busy} onClick={() => act(() => api("/accounting/bank/auto-match", { method: "POST", body: { bankAccountId: bid } }), "Rapprochement automatique terminé.")}>Rapprochement automatique</Btn>
        </Row>
        {summary.length > 0 && <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>{summary.map((s) => <Badge key={s.status} tone={s.status === "matched" ? "green" : s.status === "ignored" ? "gray" : "amber"}>{s.status === "matched" ? "Rapprochées" : s.status === "ignored" ? "Ignorées" : "À rapprocher"} : {s.count} ({money(s.total)})</Badge>)}</div>}
      </Card>
      {lines.error && <ErrorBox message={lines.error} onRetry={lines.reload} />}
      <Card pad={false}>
        {lines.loading && !lines.data ? <Loading /> : !lines.data?.lines.length ? <Empty>Aucune ligne. Importez un relevé (CSV « date;libellé;montant;référence »).</Empty> : (
          <TableWrap>
            <thead><tr><th style={th}>Date</th><th style={th}>Libellé</th><th style={th}>Référence</th><th style={{ ...th, ...num }}>Montant</th><th style={th} /></tr></thead>
            <tbody>{lines.data.lines.map((l: any) => (
              <tr key={l.id}><td style={td}>{fmtDate(l.date)}</td><td style={td}>{l.label}</td><td style={td}>{l.reference || "—"}</td>
                <td style={{ ...td, ...num, color: Number(l.amount) < 0 ? "var(--theme-danger, #ef4444)" : undefined }}>{money(l.amount)}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {l.status === "unmatched" && <><Btn onClick={() => openSuggestions(l)}>Rapprocher</Btn> <Btn onClick={() => act(() => api(`/accounting/bank/lines/${l.id}/ignore`, { method: "POST" }), "Ligne ignorée.")}>Ignorer</Btn></>}
                  {l.status === "matched" && <Btn onClick={() => act(() => api(`/accounting/bank/lines/${l.id}/unmatch`, { method: "POST" }), "Rapprochement annulé.")}>Défaire</Btn>}
                  {l.status === "ignored" && <Badge>Ignorée</Badge>}
                </td></tr>
            ))}</tbody>
          </TableWrap>
        )}
      </Card>

      {importOpen && (
        <Modal title="Importer un relevé bancaire" width={640} onClose={() => setImportOpen(false)}
          footer={<><Btn onClick={() => setImportOpen(false)}>Fermer</Btn><Btn variant="primary" busy={busy} disabled={!csv.trim()} onClick={() => act(async () => { const r = await api<any>("/accounting/bank/import", { method: "POST", body: { bankAccountId: bid, csv } }); notify(`${r.imported ?? 0} ligne(s) importée(s), ${r.duplicates ?? 0} doublon(s) ignoré(s).`); setImportOpen(false); setCsv(""); return r; }, "Relevé importé.")}>Importer</Btn></>}>
          <Field label="Contenu CSV : date;libellé;montant;référence (montant négatif = débit)">
            <textarea style={{ ...inputStyle, minHeight: 180, fontFamily: "monospace" }} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"2026-03-02;VIR CLIENT B;500.000;REF123\n2026-03-03;FRAIS BANCAIRES;-4.500;"} />
          </Field>
          <input type="file" accept=".csv,text/csv,text/plain" aria-label="Fichier CSV" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} />
          <Notice tone="blue">Les lignes déjà importées (même date, libellé, montant et référence) sont ignorées : vous pouvez réimporter un relevé qui se chevauche.</Notice>
        </Modal>
      )}

      {suggest && (
        <Modal title={`Rapprocher : ${suggest.line.label} (${money(suggest.line.amount)})`} width={640} onClose={() => setSuggest(null)}>
          {!suggest.items.length ? <Empty>Aucun règlement correspondant (même montant, dates proches).</Empty> : suggest.items.map((p: any) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--theme-border)" }}>
              <span style={{ fontSize: 14 }}>{fmtDate(p.date)} · {p.number || p.id} · {p.partyName || ""} — <strong>{money(p.amount)}</strong></span>
              <Btn variant="success" busy={busy} onClick={() => act(() => api(`/accounting/bank/lines/${suggest.line.id}/match`, { method: "POST", body: { paymentId: p.id } }), "Rapprochée.")}>Choisir</Btn>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
