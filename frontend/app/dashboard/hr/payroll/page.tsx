"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import ModuleNav, { HR_TABS } from "@/components/erp/ModuleNav";
import {
  api, Badge, Btn, Card, Empty, ErrorBox, Field, fetchFile, fmtDate, inputStyle, Loading, Modal, money, moneyDT, Notice, num, Page, Row, Stat, TableWrap, td, th,
  todayISO, useLoad, useNotice, useRequireAuth,
} from "@/components/erp/kit";

type Tab = "payroll" | "leaves" | "settings";
const KINDS: Record<string, string> = { paid: "Congé payé", sick: "Maladie", unpaid: "Sans solde", maternity: "Maternité / paternité", other: "Autre" };
const LEAVE_STATUS: Record<string, [string, "amber" | "green" | "red" | "gray"]> = { pending: ["En attente", "amber"], approved: ["Approuvé", "green"], rejected: ["Refusé", "red"], cancelled: ["Annulé", "gray"] };
const SLIP_STATUS: Record<string, [string, "amber" | "blue" | "green"]> = { draft: ["Brouillon", "amber"], validated: ["Validé", "blue"], paid: ["Payé", "green"] };
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const SUBTITLE: Record<Tab, string> = { payroll: "Bulletins de paie mensuels", leaves: "Demandes et soldes de congés", settings: "Paramètres de paie (taux, barème, cotisations)" };

export default function PayrollPage() {
  return <Suspense fallback={<Loading />}><PayrollContent /></Suspense>;
}

/** Onglet lu dans l'adresse (?tab=payroll|leaves|settings) : la sous-navigation RH y mène directement. */
function PayrollContent() {
  useRequireAuth();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = raw === "leaves" || raw === "settings" ? raw : "payroll";
  const [notice, notify] = useNotice();
  return (
    <Page title="Ressources humaines" subtitle={SUBTITLE[tab]}>
      <ModuleNav tabs={HR_TABS} label="Ressources humaines" />
      {notice}
      {tab === "payroll" && <Payslips notify={notify} />}
      {tab === "leaves" && <Leaves notify={notify} />}
      {tab === "settings" && <Settings notify={notify} />}
    </Page>
  );
}

function Payslips({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [busy, setBusy] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<any>(null);
  const [method, setMethod] = useState<"transfer" | "cash">("transfer");
  const [payDate, setPayDate] = useState(todayISO());
  const [edit, setEdit] = useState<any>(null);
  const slips = useLoad(() => api<any>("/hr/payroll", { query: { year, month } }), [year, month]);
  const settings = useLoad(() => api<any>("/hr/payroll/settings"), []);

  const run = async (key: string, fn: () => Promise<any>, ok: string) => {
    setBusy(key);
    try { const r = await fn(); notify(typeof r?.created === "number" ? `${r.created} bulletin(s) créé(s), ${r.updated} mis à jour${r.ignored?.length ? `, ${r.ignored.length} ignoré(s) (${r.ignored.join(" ; ")})` : ""}.` : ok); setPayFor(null); setEdit(null); await slips.reload(); }
    catch (e: any) { notify(e.message, "err"); } finally { setBusy(null); }
  };
  const t = slips.data?.totals;
  return (
    <>
      {settings.data && !settings.data.validated && <Notice>Les taux et le barème de paie sont des <strong>valeurs de départ indicatives</strong>. Faites-les valider par votre expert-comptable (onglet « Paramètres de paie ») avant d’établir de vrais bulletins.</Notice>}
      <Card>
        <Row>
          <Field label="Mois"><select style={inputStyle} value={month} onChange={(e) => setMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></Field>
          <Field label="Année"><input type="number" style={{ ...inputStyle, width: 100 }} value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
          <Btn variant="primary" busy={busy === "gen"} onClick={() => run("gen", () => api("/hr/payroll/generate", { method: "POST", body: { year, month } }), "Bulletins générés.")}>Générer / recalculer les brouillons</Btn>
        </Row>
      </Card>
      {t && slips.data.items.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Stat label="Masse salariale brute" value={moneyDT(t.grossSalary + t.bonuses)} /><Stat label="Net à payer" value={moneyDT(t.netSalary)} />
          <Stat label="Charges patronales" value={moneyDT(t.employerCnss)} /><Stat label="Coût employeur total" value={moneyDT(t.employerCost)} />
        </div>
      )}
      {slips.error && <ErrorBox message={slips.error} onRetry={slips.reload} />}
      <Card pad={false}>
        {slips.loading && !slips.data ? <Loading /> : !slips.data?.items.length ? <Empty>Aucun bulletin pour {MONTHS[month - 1]} {year}. Cliquez sur « Générer » (les employés actifs avec un salaire renseigné sont pris en compte).</Empty> : (
          <TableWrap>
            <thead><tr><th style={th}>Employé</th><th style={{ ...th, ...num }}>Brut</th><th style={{ ...th, ...num }}>Primes</th><th style={{ ...th, ...num }}>CNSS</th><th style={{ ...th, ...num }}>IRPP</th><th style={{ ...th, ...num }}>CSS</th><th style={{ ...th, ...num }}>Net</th><th style={th}>Statut</th><th style={th} /></tr></thead>
            <tbody>{slips.data.items.map((p: any) => {
              const [label, tone] = SLIP_STATUS[p.status] || [p.status, "amber"];
              return (
                <tr key={p.id}>
                  <td style={td}><strong>{p.employeeName}</strong><div style={{ fontSize: 12, color: "var(--theme-text-secondary)" }}>{p.position}</div></td>
                  <td style={{ ...td, ...num }}>{money(p.grossSalary)}</td><td style={{ ...td, ...num }}>{p.bonuses ? money(p.bonuses) : "—"}</td>
                  <td style={{ ...td, ...num }}>{money(p.employeeCnss)}</td><td style={{ ...td, ...num }}>{money(p.incomeTax)}</td><td style={{ ...td, ...num }}>{money(p.solidarityContribution)}</td>
                  <td style={{ ...td, ...num, fontWeight: 700 }}>{money(p.netSalary)}</td><td style={td}><Badge tone={tone}>{label}</Badge></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    {p.status === "draft" && <><Btn onClick={() => setEdit({ id: p.id, name: p.employeeName, bonuses: String(p.bonuses || ""), otherDeductions: String(p.otherDeductions || "") })}>Primes</Btn>{" "}
                      <Btn variant="primary" busy={busy === `v${p.id}`} onClick={() => run(`v${p.id}`, () => api(`/hr/payroll/${p.id}/validate`, { method: "POST" }), "Bulletin validé : écriture comptable passée.")}>Valider</Btn>{" "}
                      <Btn variant="danger" onClick={() => { if (confirm("Supprimer ce brouillon ?")) run(`d${p.id}`, () => api(`/hr/payroll/${p.id}`, { method: "DELETE" }), "Brouillon supprimé."); }}>×</Btn></>}
                    {p.status === "validated" && <Btn variant="success" onClick={() => { setPayFor(p); setPayDate(todayISO()); }}>Payer</Btn>}{" "}
                    <Btn onClick={() => fetchFile(`/hr/payroll/${p.id}/pdf`, { open: true }).catch((e) => notify(e.message, "err"))}>PDF</Btn>
                  </td>
                </tr>
              );
            })}</tbody>
          </TableWrap>
        )}
      </Card>

      {edit && (
        <Modal title={`Primes et retenues — ${edit.name}`} onClose={() => setEdit(null)}
          footer={<><Btn onClick={() => setEdit(null)}>Fermer</Btn><Btn variant="primary" busy={busy === "edit"} onClick={() => run("edit", () => api(`/hr/payroll/${edit.id}`, { method: "PUT", body: { bonuses: Number(edit.bonuses) || 0, otherDeductions: Number(edit.otherDeductions) || 0 } }), "Bulletin recalculé.")}>Recalculer</Btn></>}>
          <Field label="Primes (DT)"><input inputMode="decimal" style={inputStyle} value={edit.bonuses} onChange={(e) => setEdit({ ...edit, bonuses: e.target.value })} /></Field>
          <Field label="Autres retenues (acompte, avance…) (DT)"><input inputMode="decimal" style={inputStyle} value={edit.otherDeductions} onChange={(e) => setEdit({ ...edit, otherDeductions: e.target.value })} /></Field>
          <Notice tone="blue">Les primes sont annualisées dans le calcul mensuel de l’impôt ; la régularisation annuelle est à faire par le comptable.</Notice>
        </Modal>
      )}
      {payFor && (
        <Modal title={`Payer le salaire — ${payFor.employeeName}`} onClose={() => setPayFor(null)}
          footer={<><Btn onClick={() => setPayFor(null)}>Fermer</Btn><Btn variant="success" busy={busy === "pay"} onClick={() => run("pay", () => api(`/hr/payroll/${payFor.id}/pay`, { method: "POST", body: { method, date: payDate } }), "Salaire payé : écriture passée.")}>Payer {money(payFor.netSalary)} DT</Btn></>}>
          <Row><Field label="Mode"><select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value as any)}><option value="transfer">Virement</option><option value="cash">Espèces</option></select></Field>
            <Field label="Date"><input type="date" style={inputStyle} value={payDate} onChange={(e) => setPayDate(e.target.value)} /></Field></Row>
        </Modal>
      )}
    </>
  );
}

function Leaves({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", kind: "paid", startDate: todayISO(), endDate: todayISO(), reason: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const employees = useLoad(() => api<any[]>("/employees"), []);
  const leaves = useLoad(() => api<any[]>("/hr/leave-requests", { query: { status } }), [status]);
  const balance = useLoad(() => (form.employeeId ? api<any>(`/hr/leave-balance/${form.employeeId}`) : Promise.resolve(null)), [form.employeeId]);

  const act = async (key: string, fn: () => Promise<any>, ok: string) => {
    setBusy(key);
    try { await fn(); notify(ok); setOpen(false); leaves.reload(); } catch (e: any) { notify(e.message, "err"); } finally { setBusy(null); }
  };
  return (
    <>
      <Card>
        <Row>
          <Field label="Statut"><select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Toutes</option>{Object.entries(LEAVE_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Btn variant="primary" onClick={() => setOpen(true)}>+ Demande de congé</Btn>
        </Row>
      </Card>
      {leaves.error && <ErrorBox message={leaves.error} onRetry={leaves.reload} />}
      <Card pad={false}>
        {leaves.loading && !leaves.data ? <Loading /> : !leaves.data?.length ? <Empty>Aucune demande.</Empty> : (
          <TableWrap>
            <thead><tr><th style={th}>Employé</th><th style={th}>Type</th><th style={th}>Période</th><th style={{ ...th, ...num }}>Jours ouvrés</th><th style={th}>Statut</th><th style={th} /></tr></thead>
            <tbody>{leaves.data.map((l) => {
              const [label, tone] = LEAVE_STATUS[l.status] || [l.status, "gray"];
              return (
                <tr key={l.id}><td style={{ ...td, fontWeight: 600 }}>{l.employeeName}</td><td style={td}>{KINDS[l.kind] || l.kind}</td><td style={td}>{fmtDate(l.startDate)} → {fmtDate(l.endDate)}</td><td style={{ ...td, ...num }}>{l.days}</td>
                  <td style={td}><Badge tone={tone}>{label}</Badge></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    {l.status === "pending" && <><Btn variant="success" busy={busy === `a${l.id}`} onClick={() => act(`a${l.id}`, () => api(`/hr/leave-requests/${l.id}/approve`, { method: "POST" }), "Congé approuvé.")}>Approuver</Btn>{" "}<Btn variant="danger" onClick={() => act(`r${l.id}`, () => api(`/hr/leave-requests/${l.id}/reject`, { method: "POST" }), "Congé refusé.")}>Refuser</Btn>{" "}</>}
                    {(l.status === "pending" || l.status === "approved") && <Btn onClick={() => act(`c${l.id}`, () => api(`/hr/leave-requests/${l.id}/cancel`, { method: "POST" }), "Demande annulée.")}>Annuler</Btn>}
                  </td></tr>
              );
            })}</tbody>
          </TableWrap>
        )}
      </Card>

      {open && (
        <Modal title="Demande de congé" onClose={() => setOpen(false)}
          footer={<><Btn onClick={() => setOpen(false)}>Fermer</Btn><Btn variant="primary" busy={busy === "new"} disabled={!form.employeeId} onClick={() => act("new", () => api("/hr/leave-requests", { method: "POST", body: { ...form, employeeId: Number(form.employeeId), reason: form.reason || undefined } }), "Demande enregistrée.")}>Envoyer</Btn></>}>
          <Field label="Employé"><select style={inputStyle} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">— Choisir —</option>{(employees.data || []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
          {balance.data && <Notice tone="blue">Solde de congés payés : <strong>{balance.data.balance} j</strong> (acquis {balance.data.accrued}, pris {balance.data.taken}, en attente {balance.data.pending}) — disponible <strong>{balance.data.available} j</strong>.</Notice>}
          <Row>
            <Field label="Type"><select style={inputStyle} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Du"><input type="date" style={inputStyle} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Au"><input type="date" style={inputStyle} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          </Row>
          <Field label="Motif"><input style={inputStyle} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}

function Settings({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const data = useLoad(() => api<any>("/hr/payroll/settings"), []);
  const [form, setForm] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (data.data) setForm({ ...data.data, brackets: data.data.brackets.map((b: any) => ({ ...b })) }); }, [data.data]);
  if (!form) return data.error ? <ErrorBox message={data.error} onRetry={data.reload} /> : <Loading />;
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const field = (k: string, label: string, hint?: string) => (
    <Field key={k} label={label} hint={hint}><input inputMode="decimal" style={inputStyle} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></Field>
  );
  const save = async () => {
    setBusy(true);
    try {
      const body: any = { validated: !!form.validated, brackets: form.brackets.map((b: any) => ({ upTo: b.upTo === null || b.upTo === "" ? null : Number(b.upTo), rate: Number(b.rate) })) };
      ["cnssEmployeeRate", "cnssEmployerRate", "workAccidentRate", "professionalExpensesRate", "professionalExpensesCap", "headOfFamilyDeduction", "childDeduction", "maxChildrenDeducted", "solidarityRate", "solidarityExemptionThreshold", "leaveDaysPerMonth"].forEach((k) => { body[k] = Number(form[k]); });
      await api("/hr/payroll/settings", { method: "PUT", body });
      notify("Paramètres de paie enregistrés.");
      data.reload();
    } catch (e: any) { notify(e.message, "err"); } finally { setBusy(false); }
  };
  return (
    <>
      <Notice>Valeurs de départ <strong>non officielles</strong> : taux CNSS, plafonds, déductions et barème changent avec les lois de finances et les conventions collectives. Faites-les valider par votre expert-comptable, puis cochez « Paramètres validés ».</Notice>
      <Card title="Cotisations et contributions">
        <Row>{field("cnssEmployeeRate", "CNSS salarié (%)")}{field("cnssEmployerRate", "CNSS employeur (%)")}{field("workAccidentRate", "Accident du travail (%)", "À la charge de l’employeur")}{field("solidarityRate", "Contribution sociale de solidarité (%)")}{field("solidarityExemptionThreshold", "CSS : exonération jusqu’à (DT/an)", "Revenu net imposable annuel")}</Row>
      </Card>
      <Card title="Déductions pour l’impôt sur le revenu">
        <Row>{field("professionalExpensesRate", "Frais professionnels (%)")}{field("professionalExpensesCap", "Plafond annuel des frais (DT)")}{field("headOfFamilyDeduction", "Chef de famille (DT/an)")}{field("childDeduction", "Par enfant (DT/an)")}{field("maxChildrenDeducted", "Enfants déduits (max)")}{field("leaveDaysPerMonth", "Jours de congé acquis / mois")}</Row>
      </Card>
      <Card title="Barème annuel de l’impôt sur le revenu" pad={false}>
        <TableWrap>
          <thead><tr><th style={th}>Jusqu’à (DT / an)</th><th style={th}>Taux marginal (%)</th></tr></thead>
          <tbody>{form.brackets.map((b: any, i: number) => (
            <tr key={i}>
              <td style={td}>{i === form.brackets.length - 1 ? <em>Au-delà (sans plafond)</em> : <input aria-label="Plafond de tranche" inputMode="decimal" style={{ ...inputStyle, maxWidth: 160 }} value={b.upTo ?? ""} onChange={(e) => set("brackets", form.brackets.map((x: any, j: number) => (j === i ? { ...x, upTo: e.target.value } : x)))} />}</td>
              <td style={td}><input aria-label="Taux de tranche" inputMode="decimal" style={{ ...inputStyle, maxWidth: 120 }} value={b.rate} onChange={(e) => set("brackets", form.brackets.map((x: any, j: number) => (j === i ? { ...x, rate: e.target.value } : x)))} /></td>
            </tr>
          ))}</tbody>
        </TableWrap>
      </Card>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, fontSize: 14 }}><input type="checkbox" checked={!!form.validated} onChange={(e) => set("validated", e.target.checked)} /> Paramètres validés par mon expert-comptable</label>
      <Btn variant="primary" busy={busy} onClick={save}>Enregistrer</Btn>
    </>
  );
}
