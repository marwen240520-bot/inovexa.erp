"use client";
/** Administration › Journal : inscriptions, connexions, paiements, changements d'état et actions des administrateurs. */
import Link from "next/link";
import React, { useState } from "react";
import { api, Card, Empty, ErrorBox, inputStyle, Loading, Page, Row, TableWrap, td, th, useLoad } from "@/components/erp/kit";
import { FormField, Paged, Pager, codeStyle, linkStyle, mutedStyle } from "@/components/admin/config/shared";
import { dateTimeFr, endOfDayTunisISO } from "@/components/admin/core/shared";

interface AuditEntry {
  id: number; userId: number | null; actorId: number | null; actorEmail: string | null; action: string; entity: string | null; entityId: string | null;
  status: number | null; ip: string | null; details: Record<string, unknown> | null; createdAt: string;
}

const LIMIT = 50;
const ACTIONS: Record<string, string> = {
  account_registered: "Inscription", account_expired: "Accès arrivé à échéance", account_activated: "Compte activé", account_suspended: "Compte suspendu",
  account_reactivated: "Compte réactivé", account_cancelled: "Abonnement résilié", trial_extended: "Essai prolongé", subscription_updated: "Abonnement modifié",
  payment_declared: "Paiement déclaré", payment_validated: "Paiement validé", payment_rejected: "Paiement refusé", payment_cancelled: "Déclaration annulée",
  login: "Connexion", login_failed: "Connexion refusée", login_google: "Connexion avec Google", login_google_failed: "Connexion Google refusée",
  login_apple: "Connexion avec Apple", login_apple_failed: "Connexion Apple refusée", email_verified: "Adresse email confirmée",
  password_reset_requested: "Mot de passe oublié", password_reset: "Mot de passe réinitialisé",
};
const actionLabel = (action: string) => ACTIONS[action] || action.replace(/_/g, " ");
const detailsText = (details: Record<string, unknown> | null) => {
  if (!details) return "";
  return Object.entries(details).filter(([, v]) => v !== null && v !== "" && !(typeof v === "object" && v && !Object.keys(v).length))
    .map(([k, v]) => `${k} : ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ");
};

export default function AdminAuditPage() {
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useLoad(
    () => api<Paged<AuditEntry>>("/admin/audit", { query: { action: action || undefined, from: from ? new Date(`${from}T00:00:00+01:00`).toISOString() : undefined, to: to ? endOfDayTunisISO(to) : undefined, limit: LIMIT, offset } }),
    [action, from, to, offset],
  );
  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setOffset(0); };

  return (
    <Page title="Journal" subtitle="Qui a fait quoi, et quand : inscriptions, connexions, paiements et changements d’état des comptes.">
      <Card>
        <Row>
          <FormField label="Événement">
            <select value={action} onChange={(e) => reset(setAction)(e.target.value)} style={inputStyle}>
              <option value="">Tous</option>
              {Object.entries(ACTIONS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </FormField>
          <FormField label="Du"><input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} style={inputStyle} /></FormField>
          <FormField label="Au"><input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} style={inputStyle} /></FormField>
        </Row>
      </Card>
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      <Card pad={false}>
        {!data ? (loading ? <Loading /> : null) : data.items.length === 0 ? <Empty>Aucun événement pour ces critères.</Empty> : (
          <>
            <TableWrap min={820}>
              <thead><tr><th style={th}>Date</th><th style={th}>Événement</th><th style={th}>Par</th><th style={th}>Compte</th><th style={th}>Détails</th></tr></thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{dateTimeFr(entry.createdAt)}</td>
                    <td style={td}><strong>{actionLabel(entry.action)}</strong></td>
                    <td style={{ ...td, overflowWrap: "anywhere" }}>{entry.actorEmail || "—"}{entry.ip ? <div style={{ ...mutedStyle, ...codeStyle }}>{entry.ip}</div> : null}</td>
                    <td style={td}>{entry.userId ? <Link href={`/admin/accounts/${entry.userId}`} style={linkStyle}>Compte n° {entry.userId}</Link> : "—"}</td>
                    <td style={{ ...td, ...mutedStyle, overflowWrap: "anywhere", maxWidth: 380 }}>{detailsText(entry.details)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pager total={data.total} limit={data.limit} offset={data.offset} onChange={setOffset} busy={loading} />
          </>
        )}
      </Card>
    </Page>
  );
}
