"use client";
/**
 * Administration › Fiche d'un compte : identité, état et échéance, société, modules ouverts, équipe, paiements,
 * volumes et activité récente, avec les actions de l'administrateur.
 */
import Link from "next/link";
import React, { use } from "react";
import { api, Badge, Card, Empty, ErrorBox, Loading, Page, Stat, TableWrap, num, td, th, useLoad, useNotice } from "@/components/erp/kit";
import { LANG, cycleLabel, methodLabel, mutedStyle } from "@/components/admin/config/shared";
import { AccountMenu } from "@/components/admin/core/AccountMenu";
import {
  AccountStatusBadge, AdminAccountDetail, Info, InfoGrid, PAYMENT_STATUS_META, TEAM_ROLE_LABELS, dateFr, dateTimeFr, effectiveStatus, isModuleOn, linkStyle, periodInfo, sourceLabel,
} from "@/components/admin/core/shared";
import { MODULE_KEYS, MODULE_LABELS, formatMoney, formatPhone, type Plan, type Sector } from "@/lib/saas";

const USAGE_LABELS: Record<string, string> = {
  products: "Produits", clients: "Clients", suppliers: "Fournisseurs", sales: "Ventes", purchases: "Achats", invoices: "Factures", documents: "Documents",
  orders: "Commandes", employees: "Employés", shipments: "Expéditions", expenses: "Dépenses",
};

export default function AdminAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading, reload } = useLoad(() => api<AdminAccountDetail>(`/admin/accounts/${id}`), [id]);
  const lookups = useLoad(() => Promise.all([api<Plan[]>("/admin/plans"), api<Sector[]>("/admin/sectors")]), []);
  const [notice, notify] = useNotice();
  const [plans, sectors] = lookups.data ?? [[], []];

  if (error) return <Page title="Compte"><ErrorBox message={error} onRetry={reload} /><Link href="/admin/accounts" style={linkStyle}>← Tous les comptes</Link></Page>;
  if (!data) return <Page title="Compte">{loading ? <Loading /> : null}</Page>;

  const a = data.account;
  const label = data.companyName || data.name || data.email;
  const period = periodInfo(a);
  const plan = plans.find((p) => p.code === a.planCode);
  const sector = sectors.find((s) => s.code === data.sector);
  const company = data.company;
  const totalPaid = data.payments.filter((p) => p.status === "validated").reduce((sum, p) => sum + Number(p.amountTTC || 0), 0);

  return (
    <Page
      title={label}
      subtitle={`Compte n° ${data.id} · inscrit le ${dateFr(data.createdAt)} · ${sourceLabel(data.signupSource)}`}
      actions={<Link href="/admin/accounts" style={{ ...linkStyle, padding: "8px 4px" }}>← Tous les comptes</Link>}
    >
      {notice}
      <Card title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>État du compte <AccountStatusBadge status={effectiveStatus(a.status, data.isActive)} /></span>}>
        <InfoGrid>
          <Info label={period.label || "Échéance"}>{period.date ? dateTimeFr(period.date) : "—"}{period.remaining ? <span style={mutedStyle}> · reste {period.remaining}</span> : null}{period.hint ? <span style={mutedStyle}> · {period.hint}</span> : null}</Info>
          <Info label="Formule">{plan?.name || a.planCode || "Aucune"}{a.billingCycle ? ` — ${cycleLabel(a.billingCycle).toLowerCase()}` : ""}</Info>
          <Info label="Secteur">{sector?.name || data.sector || "—"}</Info>
          <Info label="Utilisateurs">{1 + data.team.filter((m) => m.isActive).length}{a.userLimit ? ` sur ${a.userLimit}` : " (illimité)"}</Info>
          <Info label="Essai">{a.trialStartedAt ? `du ${dateFr(a.trialStartedAt)} au ${dateTimeFr(a.trialEndsAt)}` : "—"}</Info>
          <Info label="Abonnement">{a.subscriptionStart ? `du ${dateFr(a.subscriptionStart)} au ${a.subscriptionEnd ? dateTimeFr(a.subscriptionEnd) : "—"}` : "—"}</Info>
        </InfoGrid>
        {a.blocked && a.message ? <p style={{ margin: "14px 0 0", padding: "9px 12px", borderRadius: 10, background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.5)", fontSize: 13.5 }}>{a.message}</p> : null}
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <AccountMenu target={{ id: data.id, label, account: a }} plans={plans} sectors={sectors} onDone={(message) => { notify(message); reload(); }} />
          <Link href={`/admin/payments?userId=${data.id}`} style={linkStyle}>Paiements de ce compte →</Link>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Card title="Propriétaire du compte">
          <InfoGrid>
            <Info label="Nom">{data.name}</Info>
            <Info label="Email"><a href={`mailto:${data.email}`} style={linkStyle}>{data.email}</a>{a.emailVerified ? "" : " (non confirmé)"}</Info>
            <Info label="Téléphone">{data.phone ? <a href={`tel:${data.phone}`} style={linkStyle} dir="ltr">{formatPhone(data.phone)}</a> : "—"}</Info>
            <Info label="Dernière connexion">{data.lastLoginAt ? dateTimeFr(data.lastLoginAt) : "Jamais"}</Info>
            <Info label="Sécurité">{[data.twoFactorEnabled ? "double authentification" : null, data.googleLinked ? "compte Google relié" : null, data.appleLinked ? "identifiant Apple relié" : null].filter(Boolean).join(", ") || "mot de passe seul"}</Info>
          </InfoGrid>
        </Card>
        <Card title="Société">
          {company ? (
            <InfoGrid>
              <Info label="Raison sociale">{company.legalName || data.companyName || "—"}</Info>
              <Info label="Forme juridique">{company.legalForm || "—"}</Info>
              <Info label="Matricule fiscal">{company.taxId || "—"}</Info>
              <Info label="Adresse">{[company.address, company.postalCode, company.city].filter(Boolean).join(" ") || "—"}</Info>
              <Info label="Téléphone">{company.phone || "—"}</Info>
              <Info label="Email">{company.email || "—"}</Info>
            </InfoGrid>
          ) : <p style={{ ...mutedStyle, margin: 0 }}>La fiche société n’est pas encore renseignée.</p>}
        </Card>
      </div>

      <Card title="Modules ouverts">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MODULE_KEYS.map((key) => <Badge key={key} tone={isModuleOn(data.modules, key) ? "green" : "gray"}>{MODULE_LABELS[key] || key}</Badge>)}
        </div>
        <p style={{ ...mutedStyle, margin: "10px 0 0" }}>En vert : ouverts. Ils résultent du secteur et de la formule ; « Formule et modules » permet de les ajuster pour ce compte.</p>
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <Stat label="Total payé (TTC)" value={formatMoney(totalPaid, LANG)} tone={totalPaid > 0 ? "good" : undefined} />
        {Object.entries(data.usage || {}).map(([key, count]) => <Stat key={key} label={USAGE_LABELS[key] || key} value={count} />)}
      </div>

      <Card title={`Paiements (${data.payments.length})`} pad={false}>
        {data.payments.length === 0 ? <Empty>Aucun paiement.</Empty> : (
          <TableWrap min={720}>
            <thead><tr><th style={th}>Date</th><th style={th}>Formule</th><th style={{ ...th, ...num }}>Montant TTC</th><th style={th}>Moyen</th><th style={th}>État</th><th style={th}>Période</th></tr></thead>
            <tbody>
              {data.payments.map((p) => {
                const meta = PAYMENT_STATUS_META[p.status] || { label: p.status, tone: "gray" as const };
                return (
                  <tr key={p.id}>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{dateTimeFr(p.createdAt)}</td>
                    <td style={td}>{p.planName} — {cycleLabel(p.billingCycle).toLowerCase()}</td>
                    <td style={{ ...td, ...num }}>{formatMoney(p.amountTTC, LANG, p.currency)}</td>
                    <td style={td}>{methodLabel(p.method)}{p.reference ? <div style={mutedStyle}>{p.reference}</div> : null}</td>
                    <td style={td}><Badge tone={meta.tone}>{meta.label}</Badge>{p.receiptNumber ? <div style={mutedStyle}>{p.receiptNumber}</div> : null}{p.rejectReason ? <div style={mutedStyle}>{p.rejectReason}</div> : null}</td>
                    <td style={td}>{p.periodStart && p.periodEnd ? `${dateFr(p.periodStart)} → ${dateFr(p.periodEnd)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card title={`Équipe (${data.team.length})`} pad={false}>
        {data.team.length === 0 ? <Empty>Le propriétaire travaille seul sur ce compte.</Empty> : (
          <TableWrap min={620}>
            <thead><tr><th style={th}>Nom</th><th style={th}>Email</th><th style={th}>Rôle</th><th style={th}>État</th><th style={th}>Dernière connexion</th></tr></thead>
            <tbody>
              {data.team.map((m) => (
                <tr key={m.id}>
                  <td style={td}>{m.name}</td><td style={{ ...td, overflowWrap: "anywhere" }}>{m.email}</td><td style={td}>{TEAM_ROLE_LABELS[m.role] || m.role}</td>
                  <td style={td}><Badge tone={m.isActive ? "green" : "gray"}>{m.isActive ? "Actif" : "Désactivé"}</Badge></td><td style={td}>{m.lastLoginAt ? dateTimeFr(m.lastLoginAt) : "Jamais"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card title="Activité récente" pad={false}>
        {data.activity.length === 0 ? <Empty>Aucune activité enregistrée.</Empty> : (
          <TableWrap min={620}>
            <thead><tr><th style={th}>Date</th><th style={th}>Événement</th><th style={th}>Par</th></tr></thead>
            <tbody>
              {data.activity.slice(0, 40).map((entry) => (
                <tr key={entry.id}>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{dateTimeFr(entry.createdAt)}</td>
                  <td style={td}>{entry.action.replace(/_/g, " ")}{entry.entity ? <span style={mutedStyle}> · {entry.entity}{entry.entityId ? ` n° ${entry.entityId}` : ""}</span> : null}</td>
                  <td style={{ ...td, overflowWrap: "anywhere" }}>{entry.actorEmail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </Page>
  );
}
