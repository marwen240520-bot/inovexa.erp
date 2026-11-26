"use client";
/** Administration › Messages des clients (page Abonnement › « Écrire à l'administrateur »). */
import React, { useState } from "react";
import { api, Badge, Btn, Card, Empty, ErrorBox, Loading, Page, useLoad, useNotice } from "@/components/erp/kit";
import { AccountLink, AccountRef, Check, errorText, linkStyle, mutedStyle } from "@/components/admin/config/shared";
import { dateTimeFr } from "@/components/admin/core/shared";
import { formatPhone } from "@/lib/saas";

interface SupportMessage {
  id: number; userId: number; subject: string; message: string; readAt: string | null; createdAt: string;
  account: AccountRef & { phone: string | null };
}

export default function AdminMessagesPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, error, loading, reload, setData } = useLoad(() => api<SupportMessage[]>("/admin/messages", { query: { unread: unreadOnly ? 1 : undefined } }), [unreadOnly]);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, notify] = useNotice();

  const markRead = async (message: SupportMessage) => {
    setBusy(message.id);
    try {
      await api(`/admin/messages/${message.id}/read`, { method: "POST" });
      setData((data || []).map((m) => (m.id === message.id ? { ...m, readAt: new Date().toISOString() } : m)).filter((m) => !unreadOnly || !m.readAt));
    } catch (err) {
      notify(errorText(err), "err");
    } finally {
      setBusy(null);
    }
  };

  const unread = (data || []).filter((m) => !m.readAt).length;
  return (
    <Page title="Messages des clients" subtitle={data ? `${data.length} message(s), dont ${unread} non lu(s).` : "Demandes envoyées depuis la page Abonnement."}
      actions={<Check checked={unreadOnly} onChange={setUnreadOnly} label="Non lus seulement" />}>
      {notice}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {!data ? (loading ? <Loading /> : null) : data.length === 0 ? <Card><Empty>{unreadOnly ? "Aucun message non lu." : "Aucun message pour le moment."}</Empty></Card> : data.map((m) => (
        <Card key={m.id}
          title={<span style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>{m.readAt ? null : <Badge tone="blue">Nouveau</Badge>}{m.subject}</span>}
          right={<span style={{ ...mutedStyle, whiteSpace: "nowrap" }}>{dateTimeFr(m.createdAt)}</span>}>
          <p style={{ margin: "0 0 12px", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 14.5, lineHeight: 1.6 }}>{m.message}</p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", fontSize: 13.5 }}>
            <span>De : <AccountLink account={m.account} /></span>
            {m.account.email ? <a href={`mailto:${m.account.email}?subject=${encodeURIComponent("Re: " + m.subject)}`} style={linkStyle}>Répondre à {m.account.email}</a> : null}
            {m.account.phone ? <a href={`tel:${m.account.phone}`} style={linkStyle} dir="ltr">{formatPhone(m.account.phone)}</a> : null}
            <span style={{ marginInlineStart: "auto" }}>
              {m.readAt ? <span style={mutedStyle}>Lu le {dateTimeFr(m.readAt)}</span> : <Btn onClick={() => markRead(m)} busy={busy === m.id}>Marquer comme lu</Btn>}
            </span>
          </div>
        </Card>
      ))}
    </Page>
  );
}
