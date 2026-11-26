"use client";
/**
 * Administration › Comptes : toutes les sociétés inscrites, leur état (essai, actif, expiré, suspendu, résilié),
 * leur échéance et leurs paiements, avec les actions de l'administrateur.
 */
import Link from "next/link";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, Badge, Card, Empty, ErrorBox, inputStyle, Loading, Page, Row, TableWrap, num, td, th, useLoad, useNotice } from "@/components/erp/kit";
import { FormField, LANG, Pager, mutedStyle, useDebounced } from "@/components/admin/config/shared";
import { AccountMenu } from "@/components/admin/core/AccountMenu";
import {
  ACCOUNT_PAYMENT_META, AccountStatusBadge, AccountsResponse, SOURCE_LABELS, STATUS_META, STATUS_ORDER, dateFr, dateTimeFr, effectiveStatus, linkStyle, periodInfo,
} from "@/components/admin/core/shared";
import { formatMoney, formatPhone, type Plan, type Sector } from "@/lib/saas";

const LIMIT = 25;

function AccountsScreen() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [status, setStatus] = useState(params.get("status") || "");
  const [sector, setSector] = useState("");
  const [plan, setPlan] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("");
  const [offset, setOffset] = useState(0);
  const search = useDebounced(q, 300);
  const [notice, notify] = useNotice();

  const lookups = useLoad(() => Promise.all([api<Plan[]>("/admin/plans"), api<Sector[]>("/admin/sectors")]), []);
  const { data, error, loading, reload } = useLoad(
    () => api<AccountsResponse>("/admin/accounts", { query: { q: search.trim() || undefined, status: status || undefined, sector: sector || undefined, plan: plan || undefined, source: source || undefined, sort: sort || undefined, limit: LIMIT, offset } }),
    [search, status, sector, plan, source, sort, offset],
  );
  const [plans, sectors] = lookups.data ?? [[], []];
  const sectorName = (code: string | null) => (code ? sectors.find((s) => s.code === code)?.name || code : "—");
  const planName = (code: string | null) => (code ? plans.find((p) => p.code === code)?.name || code : "—");
  const filter = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setOffset(0); };

  return (
    <Page title="Comptes" subtitle={data ? `${data.total} compte(s) pour ces critères.` : "Sociétés inscrites sur la plateforme."}>
      {notice}
      <Card>
        <Row>
          <FormField label="Recherche (société, nom, email, téléphone)" basis={260}><input type="search" value={q} onChange={(e) => filter(setQ)(e.target.value)} style={inputStyle} /></FormField>
          <FormField label="État" basis={150}>
            <select value={status} onChange={(e) => filter(setStatus)(e.target.value)} style={inputStyle}>
              <option value="">Tous</option>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </FormField>
          <FormField label="Secteur" basis={170}>
            <select value={sector} onChange={(e) => filter(setSector)(e.target.value)} style={inputStyle}>
              <option value="">Tous</option>
              {sectors.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              <option value="none">Sans secteur</option>
            </select>
          </FormField>
          <FormField label="Formule" basis={150}>
            <select value={plan} onChange={(e) => filter(setPlan)(e.target.value)} style={inputStyle}>
              <option value="">Toutes</option>
              {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              <option value="none">Sans formule</option>
            </select>
          </FormField>
          <FormField label="Origine" basis={170}>
            <select value={source} onChange={(e) => filter(setSource)(e.target.value)} style={inputStyle}>
              <option value="">Toutes</option>
              {Object.entries(SOURCE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </FormField>
          <FormField label="Tri" basis={170}>
            <select value={sort} onChange={(e) => filter(setSort)(e.target.value)} style={inputStyle}>
              <option value="">Inscription la plus récente</option>
              <option value="name">Nom de la société</option>
              <option value="end">Échéance d’abonnement</option>
              <option value="login">Dernière connexion</option>
            </select>
          </FormField>
        </Row>
      </Card>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      <Card pad={false}>
        {!data ? (loading ? <Loading /> : null) : data.items.length === 0 ? <Empty>Aucun compte ne correspond à ces critères.</Empty> : (
          <>
            <TableWrap min={1180}>
              <thead>
                <tr><th style={th}>Société</th><th style={th}>État</th><th style={th}>Échéance</th><th style={th}>Formule et secteur</th><th style={{ ...th, ...num }}>Utilisateurs</th><th style={th}>Paiements</th><th style={th}>Actions</th></tr>
              </thead>
              <tbody>
                {data.items.map((row) => {
                  const shown = effectiveStatus(row.account.status, row.isActive);
                  const period = periodInfo(row.account);
                  const pay = ACCOUNT_PAYMENT_META[row.paymentStatus];
                  return (
                    <tr key={row.id}>
                      <td style={{ ...td, minWidth: 250 }}>
                        <Link href={`/admin/accounts/${row.id}`} style={linkStyle}>{row.companyName || row.name || row.email}</Link>
                        <div style={{ ...mutedStyle, overflowWrap: "anywhere" }}>{row.name} · {row.email}</div>
                        {row.phone ? <div style={mutedStyle} dir="ltr">{formatPhone(row.phone)}</div> : null}
                        <div style={mutedStyle}>Inscrit le {dateFr(row.createdAt)}{row.lastLoginAt ? ` · vu le ${dateFr(row.lastLoginAt)}` : ""}</div>
                      </td>
                      <td style={td}><AccountStatusBadge status={shown} /></td>
                      <td style={td}>
                        {period.date ? <>{period.label}<div style={{ fontWeight: 600 }}>{dateTimeFr(period.date)}</div></> : period.label || "—"}
                        {period.remaining ? <div style={mutedStyle}>reste {period.remaining}</div> : null}
                        {period.hint ? <div style={mutedStyle}>{period.hint}</div> : null}
                      </td>
                      <td style={td}>{planName(row.account.planCode)}<div style={mutedStyle}>{sectorName(row.sector)}</div></td>
                      <td style={{ ...td, ...num }}>{row.users}{row.account.userLimit ? <span style={mutedStyle}> / {row.account.userLimit}</span> : null}</td>
                      <td style={td}><Badge tone={pay.tone}>{pay.label}</Badge>{row.totalPaid > 0 ? <div style={mutedStyle}>{formatMoney(row.totalPaid, LANG)} TTC</div> : null}</td>
                      <td style={{ ...td, minWidth: 250 }}>
                        <AccountMenu compact target={{ id: row.id, label: row.companyName || row.name || row.email, account: row.account }} plans={plans} sectors={sectors} onDone={(message) => { notify(message); reload(); }} />
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
    </Page>
  );
}

export default function AdminAccountsPage() {
  return <Suspense fallback={<Loading />}><AccountsScreen /></Suspense>;
}
