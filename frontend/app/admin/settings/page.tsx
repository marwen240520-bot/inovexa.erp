"use client";
/**
 * Administration › Réglages de la plateforme : durée de l'essai gratuit, rappels, TVA, moyens et coordonnées de
 * paiement, contacts de support, état des connexions (Google, Apple, email) et opérations de maintenance.
 */
import React, { FormEvent, useEffect, useState } from "react";
import { api, Badge, Btn, Card, ErrorBox, inputStyle, Loading, Notice, Page, Row, useLoad, useNotice } from "@/components/erp/kit";
import { AdminSettings, Check, FormField, InlineError, METHOD_LABELS, errorText, helpStyle } from "@/components/admin/config/shared";
import { hoursAsDays } from "@/components/admin/core/shared";

interface Form {
  trialHours: string; trialReminderHours: string; renewalReminderDays: string; requireEmailVerification: boolean; currency: string; vatRate: string;
  paymentInstructions: string; paymentMethods: string[]; paymentLink: string; supportEmail: string; supportPhone: string; supportWhatsapp: string;
}

const formOf = (s: AdminSettings): Form => ({
  trialHours: String(s.trialHours), trialReminderHours: String(s.trialReminderHours), renewalReminderDays: String(s.renewalReminderDays),
  requireEmailVerification: !!s.requireEmailVerification, currency: s.currency || "TND", vatRate: String(s.vatRate).replace(".", ","),
  paymentInstructions: s.paymentInstructions || "", paymentMethods: s.paymentMethods?.length ? s.paymentMethods : ["bank_transfer"], paymentLink: s.paymentLink || "",
  supportEmail: s.supportEmail || "", supportPhone: s.supportPhone || "", supportWhatsapp: s.supportWhatsapp || "",
});

function State({ ok, name, on, off }: { ok: boolean; name: string; on: string; off: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", padding: "9px 0", borderTop: "1px solid var(--theme-border)", fontSize: 14 }}>
      <Badge tone={ok ? "green" : "gray"}>{ok ? "Activé" : "Non configuré"}</Badge>
      <strong>{name}</strong>
      <span style={{ flex: "1 1 280px", color: "var(--theme-text-secondary)", fontSize: 13 }}>{ok ? on : off}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data, error, loading, reload, setData } = useLoad(() => api<AdminSettings>("/admin/settings"), []);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<"sweep" | "catalog" | null>(null);
  const [notice, notify] = useNotice();

  useEffect(() => { if (data && !form) setForm(formOf(data)); }, [data, form]);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || saving) return;
    const trialHours = Number(form.trialHours);
    const vatRate = Number(form.vatRate.replace(",", "."));
    if (!Number.isInteger(trialHours) || trialHours < 1) { setFormError("Durée de l’essai : un nombre entier d’heures (72 = 3 jours)."); return; }
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) { setFormError("Taux de TVA invalide."); return; }
    if (form.paymentMethods.length === 0) { setFormError("Gardez au moins un moyen de paiement."); return; }
    if (form.paymentMethods.includes("card") && !form.paymentLink.trim()) { setFormError("« Carte bancaire » demande un lien de paiement (adresse https de votre page de paiement)."); return; }
    setSaving(true);
    setFormError(null);
    try {
      const saved = await api<AdminSettings>("/admin/settings", {
        method: "PUT",
        body: {
          trialHours, trialReminderHours: Number(form.trialReminderHours), renewalReminderDays: Number(form.renewalReminderDays),
          requireEmailVerification: form.requireEmailVerification, currency: form.currency.trim().toUpperCase(), vatRate,
          paymentInstructions: form.paymentInstructions, paymentMethods: form.paymentMethods, paymentLink: form.paymentLink.trim(),
          supportEmail: form.supportEmail.trim(), supportPhone: form.supportPhone.trim(), supportWhatsapp: form.supportWhatsapp.trim(),
        },
      });
      // La réponse de l'enregistrement ne porte pas les champs calculés (connexions) : on garde ceux déjà lus.
      const merged = { ...(data as AdminSettings), ...saved };
      setData(merged);
      setForm(formOf(merged));
      notify("Réglages enregistrés.");
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const run = async (kind: "sweep" | "catalog") => {
    if (maintenance) return;
    setMaintenance(kind);
    try {
      if (kind === "sweep") {
        const res = await api<{ checked: number; expired: number; reminders: number }>("/admin/maintenance/sweep", { method: "POST" });
        notify(`${res.checked} comptes vérifiés : ${res.expired} échéance(s) constatée(s), ${res.reminders} rappel(s) envoyé(s).`);
      } else {
        const res = await api<{ upgraded: boolean; from?: number; to?: number }>("/admin/maintenance/upgrade-catalog", { method: "POST" });
        notify(res.upgraded ? `Contenu de départ mis à niveau (version ${res.from} → ${res.to}).` : "Le contenu de départ est déjà à jour.");
        reload();
      }
    } catch (err) {
      notify(errorText(err), "err");
    } finally {
      setMaintenance(null);
    }
  };

  const trialHours = Number(form?.trialHours);
  const options = data?.paymentMethodOptions?.length ? data.paymentMethodOptions : Object.keys(METHOD_LABELS);

  return (
    <Page title="Réglages de la plateforme" subtitle="Essai gratuit, paiements, contacts et connexions.">
      {notice}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {!form || !data ? (loading ? <Loading /> : null) : (
        <form onSubmit={save} noValidate>
          <Card title="Essai gratuit">
            <Row>
              <FormField label="Durée de l’essai (heures)" hint={Number.isInteger(trialHours) && trialHours > 0 ? `Soit ${hoursAsDays(trialHours)}. À la fin, l’accès est suspendu jusqu’au paiement. Le site annonce « 3 jours » : gardez 72 pour rester cohérent.` : "72 heures = 3 jours."}>
                <input type="number" min={1} max={2160} value={form.trialHours} onChange={(e) => set("trialHours", e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Rappel avant la fin de l’essai (heures)" hint="Un email de rappel part ce délai avant la fin (si l’envoi d’emails est configuré).">
                <input type="number" min={1} max={720} value={form.trialReminderHours} onChange={(e) => set("trialReminderHours", e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Rappel avant l’échéance d’un abonnement (jours)">
                <input type="number" min={1} max={60} value={form.renewalReminderDays} onChange={(e) => set("renewalReminderDays", e.target.value)} style={inputStyle} />
              </FormField>
            </Row>
            <div style={{ marginTop: 18 }}>
              <Check
                checked={form.requireEmailVerification}
                onChange={(v) => set("requireEmailVerification", v)}
                disabled={!data.mailConfigured && !form.requireEmailVerification}
                label="Exiger la confirmation de l’adresse email avant d’ouvrir l’ERP"
                hint={data.mailConfigured ? "Les comptes créés par email doivent cliquer sur le lien reçu. Les comptes Google et Apple sont déjà vérifiés." : "Indisponible : l’envoi d’emails n’est pas configuré sur le serveur (personne ne recevrait le lien)."}
              />
            </div>
          </Card>

          <Card title="Prix et TVA">
            <Row>
              <FormField label="Taux de TVA appliqué aux abonnements (%)" hint="Les prix des formules sont saisis hors taxes ; le montant TTC est calculé avec ce taux.">
                <input inputMode="decimal" value={form.vatRate} onChange={(e) => set("vatRate", e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Devise (code à 3 lettres)">
                <input value={form.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} style={inputStyle} />
              </FormField>
            </Row>
          </Card>

          <Card title="Moyens de paiement proposés aux clients">
            <p style={{ ...helpStyle, marginBottom: 12 }}>Le client règle par l’un de ces moyens, pendant ou après l’essai, puis déclare son paiement. Vous le validez dans « Paiements » : son accès est ouvert et son reçu est créé.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
              {options.map((code) => (
                <Check
                  key={code}
                  checked={form.paymentMethods.includes(code)}
                  onChange={(v) => set("paymentMethods", v ? [...form.paymentMethods, code] : form.paymentMethods.filter((m) => m !== code))}
                  label={METHOD_LABELS[code] || code}
                />
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <Row>
                <FormField label="Lien de paiement par carte (https://…)" hint="Adresse de votre page de paiement chez votre prestataire (lien de paiement). Elle est proposée au client quand il choisit « Carte bancaire » ; le paiement reste à valider ici.">
                  <input type="url" value={form.paymentLink} onChange={(e) => set("paymentLink", e.target.value)} placeholder="https://" style={inputStyle} dir="ltr" />
                </FormField>
              </Row>
            </div>
            <div style={{ marginTop: 18 }}>
              <FormField label="Coordonnées et instructions de paiement" hint="Affichées telles quelles au client : titulaire et RIB, numéro D17 ou Flouci, adresse pour les chèques et les espèces, libellé à indiquer.">
                <textarea value={form.paymentInstructions} onChange={(e) => set("paymentInstructions", e.target.value)} rows={6} maxLength={4000} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
              </FormField>
            </div>
          </Card>

          <Card title="Contacts de support">
            <Row>
              <FormField label="Email"><input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} style={inputStyle} dir="ltr" /></FormField>
              <FormField label="Téléphone"><input type="tel" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} style={inputStyle} dir="ltr" /></FormField>
              <FormField label="WhatsApp"><input type="tel" value={form.supportWhatsapp} onChange={(e) => set("supportWhatsapp", e.target.value)} style={inputStyle} dir="ltr" /></FormField>
            </Row>
            <p style={{ ...helpStyle, marginTop: 14 }}>Affichés sur la page Abonnement des clients. Les paiements déclarés et les messages vous sont aussi envoyés à cet email.</p>
          </Card>

          {formError ? <div style={{ marginBottom: 16 }}><InlineError>{formError}</InlineError></div> : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
            <Btn type="button" onClick={() => { setForm(formOf(data)); setFormError(null); }} disabled={saving}>Annuler les changements</Btn>
            <Btn type="submit" variant="primary" busy={saving}>Enregistrer</Btn>
          </div>

          <Card title="Connexions du serveur">
            <div style={{ marginTop: -9 }}>
              <State ok={!!data.googleConfigured} name="Continuer avec Google" on="Le bouton est affiché sur les pages de connexion et d’inscription." off="Définissez GOOGLE_CLIENT_ID sur le serveur de l’API (identifiant client OAuth « Application Web » de Google Cloud)." />
              <State ok={!!data.appleConfigured} name="Continuer avec Apple" on="Le bouton est affiché sur les pages de connexion et d’inscription." off="Définissez APPLE_CLIENT_ID sur le serveur de l’API (identifiant de service « Sign in with Apple », compte Apple Developer requis)." />
              <State ok={!!data.mailConfigured} name="Envoi d’emails" on="Confirmations, mot de passe oublié, rappels et avis de paiement partent par email." off="Définissez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM sur le serveur de l’API." />
            </div>
          </Card>

          <Card title="Maintenance">
            <Notice tone="blue">Ces opérations tournent déjà toutes seules : les boutons servent à les lancer tout de suite.</Notice>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Btn type="button" onClick={() => run("sweep")} busy={maintenance === "sweep"}>Vérifier les échéances maintenant</Btn>
              <Btn type="button" onClick={() => run("catalog")} busy={maintenance === "catalog"}>Mettre à niveau le contenu de départ</Btn>
            </div>
            <p style={{ ...helpStyle, marginTop: 12 }}>Contenu de départ installé : version {data.catalogVersion ?? 1}. La mise à niveau ajoute les nouveaux secteurs et complète les modules et les formules restés d’origine ; ce que vous avez modifié n’est jamais écrasé.</p>
          </Card>
        </form>
      )}
    </Page>
  );
}
