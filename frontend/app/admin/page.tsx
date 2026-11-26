"use client";
/**
 * Administration › Vue d'ensemble.
 * Indicateurs calculés par le serveur sur les comptes réels et les paiements encaissés (aucun chiffre saisi à la main),
 * et ce qu'il reste à régler avant d'ouvrir les inscriptions. Les clients choisissent et paient seuls par carte :
 * l'administrateur n'a rien à valider tant que les paiements hors ligne ne sont pas activés.
 */
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { api, Badge, Card, ErrorBox, Loading, Page, Stat, TableWrap, num, td, th, useLoad } from "@/components/erp/kit";
import { AdminSettings, LANG, linkStyle, mutedStyle, plural } from "@/components/admin/config/shared";
import { STATUS_META } from "@/components/admin/core/shared";
import { MODULE_LABELS, formatMoney, type Plan } from "@/lib/saas";

interface Overview {
  range: { from: string; to: string };
  currency: string;
  customers: { total: number; trial: number; active: number; expired: number; expiredTrials: number; suspended: number; cancelled: number; paying: number };
  newRegistrations: number;
  mrr: number;
  revenue: { ht: number; ttc: number };
  revenueByMonth: Array<{ month: string; ht: number; ttc: number; payments: number }>;
  registrationsByMonth: Array<{ month: string; count: number }>;
  conversion: { signups: number; signupsPaid: number; subscriptionRate: number | null; trialsEnded: number; trialsConverted: number; trialToPaidRate: number | null };
  cancellations: number;
  plans: Array<{ code: string; name: string; count: number }>;
  modules: Array<{ key: string; count: number }>;
  sectors: Array<{ code: string; name: string; count: number }>;
  pendingPayments: number;
  note: string;
}

const RANGES = [{ days: 30, label: "30 jours" }, { days: 90, label: "90 jours" }, { days: 365, label: "12 mois" }];
const monthLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(new Date(Date.UTC(y, (m || 1) - 1, 1)));
};
const rate = (value: number | null) => (value === null || value === undefined ? "—" : `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);

/** Barres horizontales : une ligne par mois, largeur proportionnelle à la plus grande valeur. */
function Bars({ rows, format }: { rows: Array<{ label: string; value: number; sub?: string }>; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p style={mutedStyle}>Aucune donnée sur la période.</p>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: "grid", gridTemplateColumns: "72px minmax(0, 1fr) auto", gap: 10, alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "var(--theme-text-secondary)" }}>{row.label}</span>
          <span style={{ height: 10, borderRadius: 999, background: "var(--theme-surface-hover)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${Math.round((row.value / max) * 100)}%`, minWidth: row.value > 0 ? 4 : 0, borderRadius: 999, background: "var(--theme-primary, #4f46e5)" }} />
          </span>
          <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{format(row.value)}{row.sub ? <span style={{ ...mutedStyle, fontWeight: 400 }}> · {row.sub}</span> : null}</span>
        </div>
      ))}
    </div>
  );
}

function Todo({ ok, optional, children, href, action }: { ok: boolean; optional?: boolean; children: React.ReactNode; href?: string; action?: string }) {
  return (
    <li style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", padding: "9px 0", borderTop: "1px solid var(--theme-border)", fontSize: 14 }}>
      <Badge tone={ok ? "green" : optional ? "gray" : "amber"}>{ok ? "Fait" : optional ? "Facultatif" : "À faire"}</Badge>
      <span style={{ flex: "1 1 260px", minWidth: 0 }}>{children}</span>
      {!ok && href ? <Link href={href} style={linkStyle}>{action || "Régler"} →</Link> : null}
    </li>
  );
}

export default function AdminOverviewPage() {
  const [days, setDays] = useState(30);
  const range = useMemo(() => {
    const to = new Date();
    return { from: new Date(to.getTime() - days * 86_400_000).toISOString(), to: to.toISOString() };
  }, [days]);

  const overview = useLoad(() => api<Overview>("/admin/overview", { query: range }), [range]);
  const setup = useLoad(() => Promise.all([api<Plan[]>("/admin/plans"), api<AdminSettings>("/admin/settings")]), []);

  const o = overview.data;
  const [plans, settings] = setup.data ?? [null, null];
  const money = (n: number) => formatMoney(n, LANG, o?.currency || settings?.currency || "USD");
  const published = plans ? plans.filter((p) => p.isPublic && p.isActive).length : 0;
  const online = settings?.onlinePayment;
  const supportOk = !!settings && !!(settings.supportEmail || settings.supportPhone || settings.supportWhatsapp);
  // Le client choisit et paie seul : seuls les formules publiées et le paiement en ligne sont indispensables.
  const required = settings && plans ? [published > 0, !!online?.enabled] : [];
  const missing = required.filter((okay) => !okay).length;

  return (
    <Page
      title="Vue d’ensemble"
      subtitle="Comptes, essais, abonnements et revenus de la plateforme."
      actions={(
        <div role="radiogroup" aria-label="Période" style={{ display: "inline-flex", padding: 3, borderRadius: 10, border: "1px solid var(--theme-border)", background: "var(--theme-surface)" }}>
          {RANGES.map((r) => (
            <button key={r.days} type="button" role="radio" aria-checked={days === r.days} onClick={() => setDays(r.days)}
              style={{ padding: "6px 12px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, background: days === r.days ? "var(--theme-primary, #4f46e5)" : "transparent", color: days === r.days ? "#fff" : "var(--theme-text-secondary)" }}>
              {r.label}
            </button>
          ))}
        </div>
      )}
    >
      {settings && plans ? (
        <Card title={missing ? `Avant d’ouvrir les inscriptions : ${plural(missing, "réglage à faire", "réglages à faire")}` : "La plateforme est prête à recevoir des clients"}>
          <ul style={{ listStyle: "none", margin: "-9px 0 0", padding: 0 }}>
            <Todo ok={published > 0} href="/admin/plans" action="Publier les formules">
              <strong>Formules publiées</strong> — {published > 0 ? `${plural(published, "formule visible", "formules visibles")} sur le site et proposées au paiement.` : "aucune formule n’est publiée : vos clients ne peuvent pas payer à la fin de l’essai. Relisez les prix proposés puis publiez."}
            </Todo>
            <Todo ok={!!online?.enabled} href="/admin/settings" action="Activer le paiement">
              <strong>Paiement en ligne par carte</strong> — {online?.enabled
                ? `actif (${online.provider === "konnect" ? "Konnect" : online.provider}${online.mode === "sandbox" ? ", mode test : aucun vrai paiement" : ""}) : vos clients paient seuls et leur compte est activé automatiquement, sans aucune validation de votre part.`
                : online?.reason === "CURRENCY_UNSUPPORTED"
                  ? "la devise choisie n’est pas acceptée par le prestataire de paiement (USD, EUR ou TND)."
                  : "non configuré : sans clé Konnect sur le serveur (KONNECT_API_KEY et KONNECT_WALLET_ID), vos clients ne peuvent pas payer à la fin de l’essai."}
            </Todo>
            <Todo ok={supportOk} optional href="/admin/settings" action="Renseigner">
              <strong>Contact de support</strong> — facultatif : email, téléphone ou WhatsApp affiché aux clients dont l’accès est fermé, en cas de problème de paiement. Le client choisit et paie seul, sans passer par vous.
            </Todo>
            <Todo ok={!!settings.mailConfigured} optional>
              <strong>Envoi d’emails</strong> — {settings.mailConfigured
                ? `configuré : le code de vérification à 6 chiffres${settings.requireEmailVerification ? " est demandé à chaque inscription" : " (désactivé dans les réglages)"}, les rappels de fin d’essai et les reçus partent par email.`
                : "non configuré (variables SMTP du serveur) : sans envoi d’emails, le code de vérification n’est pas demandé, et le mot de passe oublié, les rappels de fin d’essai et les reçus ne partent pas."}
            </Todo>
            <Todo ok={!!settings.googleConfigured} optional>
              <strong>Connexion avec Google</strong> — {settings.googleConfigured ? "le bouton est affiché." : "bouton masqué tant que GOOGLE_CLIENT_ID n’est pas défini sur le serveur."}
            </Todo>
            <Todo ok={!!settings.appleConfigured} optional>
              <strong>Connexion avec Apple</strong> — {settings.appleConfigured ? "le bouton est affiché." : "bouton masqué tant que APPLE_CLIENT_ID n’est pas défini sur le serveur."}
            </Todo>
          </ul>
        </Card>
      ) : setup.error ? <ErrorBox message={setup.error} onRetry={setup.reload} /> : null}

      {overview.error ? <ErrorBox message={overview.error} onRetry={overview.reload} /> : null}
      {!o ? (overview.loading ? <Loading /> : null) : (
        <>
          {o.pendingPayments > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <Link href="/admin/payments" style={{ ...linkStyle, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,.14)", border: "1px solid rgba(245,158,11,.5)", color: "#b45309" }}>{plural(o.pendingPayments, "paiement hors ligne à valider", "paiements hors ligne à valider")} →</Link>
            </div>
          ) : null}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <Stat label="Comptes" value={o.customers.total} sub={`${o.newRegistrations} sur la période`} />
            <Stat label="En essai gratuit" value={o.customers.trial} />
            <Stat label="Clients payants" value={o.customers.paying} tone="good" sub={`${o.customers.active} comptes actifs`} />
            <Stat label="Revenu récurrent mensuel" value={money(o.mrr)} sub="hors taxes" />
            <Stat label="Encaissé (période)" value={money(o.revenue.ht)} sub={`${money(o.revenue.ttc)} TTC`} />
            <Stat label="Essai → payant" value={rate(o.conversion.trialToPaidRate)} sub={`${o.conversion.trialsConverted} sur ${plural(o.conversion.trialsEnded, "essai terminé", "essais terminés")}`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Card title="Encaissements par mois (HT)">
              <Bars rows={o.revenueByMonth.map((r) => ({ label: monthLabel(r.month), value: r.ht, sub: plural(r.payments, "paiement", "paiements") }))} format={money} />
            </Card>
            <Card title="Inscriptions par mois">
              <Bars rows={o.registrationsByMonth.map((r) => ({ label: monthLabel(r.month), value: r.count }))} format={(n) => String(n)} />
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <Card title="Comptes par état" pad={false}>
              <TableWrap min={0}>
                <tbody>
                  {([["TRIAL", o.customers.trial], ["ACTIVE", o.customers.active], ["EXPIRED", o.customers.expired], ["SUSPENDED", o.customers.suspended], ["CANCELLED", o.customers.cancelled]] as const).map(([status, count]) => (
                    <tr key={status}>
                      <td style={td}><Link href={`/admin/accounts?status=${status}`} style={linkStyle}>{STATUS_META[status].label}</Link></td>
                      <td style={{ ...td, ...num }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
            <Card title="Formules souscrites" pad={false}>
              {o.plans.length === 0 ? <p style={{ ...mutedStyle, padding: 16, margin: 0 }}>Aucun abonnement pour le moment.</p> : (
                <TableWrap min={0}>
                  <tbody>{o.plans.map((p) => <tr key={p.code}><td style={td}>{p.name}</td><td style={{ ...td, ...num }}>{p.count}</td></tr>)}</tbody>
                </TableWrap>
              )}
            </Card>
            <Card title="Secteurs des comptes" pad={false}>
              {o.sectors.length === 0 ? <p style={{ ...mutedStyle, padding: 16, margin: 0 }}>Aucun compte pour le moment.</p> : (
                <TableWrap min={0}>
                  <tbody>{o.sectors.map((s) => <tr key={s.code}><td style={td}>{s.name}</td><td style={{ ...td, ...num }}>{s.count}</td></tr>)}</tbody>
                </TableWrap>
              )}
            </Card>
          </div>

          <Card title="Modules activés (nombre de comptes)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {o.modules.filter((m) => !["dashboard", "profile", "settings"].includes(m.key)).map((m) => (
                <span key={m.key} style={{ padding: "4px 10px", borderRadius: 999, background: "var(--theme-surface-hover)", fontSize: 13 }}>
                  {MODULE_LABELS[m.key] || m.key} <strong style={{ fontVariantNumeric: "tabular-nums" }}>{m.count}</strong>
                </span>
              ))}
            </div>
          </Card>
          <p style={mutedStyle}>{o.note}</p>
        </>
      )}
    </Page>
  );
}
