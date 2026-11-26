"use client";
/**
 * Administration › Réglages de la plateforme : durée de l'essai gratuit, rappels, devise et TVA, paiement en ligne par
 * carte (état), paiements hors ligne (facultatifs), contacts de support, état des connexions (Konnect, Google, Apple,
 * email) et opérations de maintenance.
 *
 * Tout le parcours du client est automatique : il s'inscrit, choisit sa formule et paie par carte sans que
 * l'administrateur intervienne. Cette page ne sert qu'à régler la plateforme.
 */
import React, { FormEvent, useEffect, useState } from "react";
import { api, Badge, Btn, Card, ErrorBox, inputStyle, Loading, Notice, Page, Row, useLoad, useNotice } from "@/components/erp/kit";
import { AdminSettings, Check, FormField, InlineError, METHOD_LABELS, errorText, helpStyle } from "@/components/admin/config/shared";
import { hoursAsDays } from "@/components/admin/core/shared";

interface Form {
  trialHours: string; trialReminderHours: string; renewalReminderDays: string; requireEmailVerification: boolean; currency: string; vatRate: string;
  manualPayments: boolean; paymentInstructions: string; paymentMethods: string[]; paymentLink: string; supportEmail: string; supportPhone: string; supportWhatsapp: string;
}

const formOf = (s: AdminSettings): Form => ({
  trialHours: String(s.trialHours), trialReminderHours: String(s.trialReminderHours), renewalReminderDays: String(s.renewalReminderDays),
  requireEmailVerification: !!s.requireEmailVerification, currency: s.currency || "USD", vatRate: String(s.vatRate).replace(".", ","),
  manualPayments: !!s.manualPayments, paymentInstructions: s.paymentInstructions || "", paymentMethods: s.paymentMethods?.length ? s.paymentMethods : ["bank_transfer"], paymentLink: s.paymentLink || "",
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
    if (form.manualPayments && form.paymentMethods.length === 0) { setFormError("Paiements hors ligne : gardez au moins un moyen de paiement, ou désactivez-les."); return; }
    if (form.manualPayments && form.paymentMethods.includes("card") && !form.paymentLink.trim()) { setFormError("Hors ligne, « Carte bancaire » demande un lien de paiement (adresse https)."); return; }
    setSaving(true);
    setFormError(null);
    try {
      const saved = await api<AdminSettings>("/admin/settings", {
        method: "PUT",
        body: {
          trialHours, trialReminderHours: Number(form.trialReminderHours), renewalReminderDays: Number(form.renewalReminderDays),
          requireEmailVerification: form.requireEmailVerification, currency: form.currency.trim().toUpperCase(), vatRate,
          manualPayments: form.manualPayments, paymentInstructions: form.paymentInstructions, paymentMethods: form.paymentMethods, paymentLink: form.paymentLink.trim(),
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
        const res = await api<{ checked: number; expired: number; reminders: number; checkouts?: { checked: number; paid: number } }>("/admin/maintenance/sweep", { method: "POST" });
        notify(`${res.checked} comptes vérifiés : ${res.expired} échéance(s) constatée(s), ${res.reminders} rappel(s) envoyé(s)${res.checkouts?.checked ? `, ${res.checkouts.checked} paiement(s) en ligne relu(s) dont ${res.checkouts.paid} encaissé(s)` : ""}.`);
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
  const online = data?.onlinePayment;
  const currencyKnown = ["USD", "TND", "EUR"].includes((form?.currency || "").toUpperCase());

  return (
    <Page title="Réglages de la plateforme" subtitle="Essai gratuit, paiement par carte, contacts et connexions.">
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
                label="Demander le code de vérification reçu par email avant d’ouvrir l’ERP"
                hint={data.mailConfigured
                  ? "À l’inscription par email, un code à 6 chiffres est envoyé : l’ERP s’ouvre une fois le code saisi (5 essais, valable 15 minutes). Les comptes Google et Apple sont déjà vérifiés."
                  : "Sans effet pour l’instant : l’envoi d’emails n’est pas configuré sur le serveur (variables SMTP). Dès qu’il le sera, le code sera demandé — aucun compte n’est bloqué d’ici là."}
              />
            </div>
          </Card>

          <Card title="Prix et TVA">
            <Row>
              <FormField label="Taux de TVA appliqué aux abonnements (%)" hint="Les prix des formules sont saisis hors taxes ; le montant TTC est calculé avec ce taux.">
                <input inputMode="decimal" value={form.vatRate} onChange={(e) => set("vatRate", e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Devise des formules" hint={currencyKnown ? "Le paiement en ligne accepte USD, TND et EUR. En USD ou en EUR, Konnect convertit et vous verse en dinars." : "Cette devise n’est pas acceptée par le paiement en ligne (USD, TND ou EUR)."}>
                <select value={currencyKnown ? form.currency : "other"} onChange={(e) => { if (e.target.value !== "other") set("currency", e.target.value); }} style={inputStyle}>
                  <option value="USD">USD — dollar ($)</option>
                  <option value="TND">TND — dinar tunisien</option>
                  <option value="EUR">EUR — euro (€)</option>
                  {currencyKnown ? null : <option value="other">{form.currency}</option>}
                </select>
              </FormField>
            </Row>
            <p style={{ ...helpStyle, marginTop: 22 }}>Changer de devise ne convertit pas les prix : après un changement, relisez les montants dans « Formules et tarifs ».</p>
          </Card>

          <Card title="Paiement en ligne par carte (automatique)">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginBottom: 10 }}>
              <Badge tone={online?.enabled ? (online.mode === "sandbox" ? "amber" : "green") : "red"}>
                {online?.enabled ? (online.mode === "sandbox" ? "Actif — mode test" : "Actif") : "À activer"}
              </Badge>
              <strong>Konnect</strong>
              <span style={{ color: "var(--theme-text-secondary)", fontSize: 13 }}>carte bancaire (Visa, Mastercard, cartes tunisiennes) et carte e-Dinar</span>
            </div>
            {online?.enabled ? (
              <p style={helpStyle}>
                Le client choisit sa formule, paie sur la page sécurisée de Konnect, et son accès s’ouvre tout seul dès que Konnect confirme l’encaissement : vous n’avez rien à valider. Les paiements apparaissent dans « Paiements » avec leur reçu.
                {online.mode === "sandbox" ? " Mode test : aucun débit réel n’est fait — passez KONNECT_ENV à « production » (avec les clés de production) avant d’ouvrir aux clients." : ""}
              </p>
            ) : (
              <>
                <Notice>
                  {online?.reason === "CURRENCY_UNSUPPORTED"
                    ? `La devise ${data.currency} n’est pas acceptée par Konnect : choisissez USD, TND ou EUR ci-dessus.`
                    : "Tant que le paiement en ligne n’est pas activé, vos clients ne peuvent pas payer : à la fin de l’essai, leur accès reste fermé."}
                </Notice>
                <ol style={{ ...helpStyle, margin: 0, paddingInlineStart: 20, lineHeight: 1.7 }}>
                  <li>Ouvrez un compte marchand sur <a href="https://konnect.network" target="_blank" rel="noopener noreferrer" style={{ color: "var(--theme-primary, #4f46e5)", fontWeight: 700 }}>konnect.network</a> et récupérez, dans son tableau de bord, votre <strong>clé d’API</strong> et l’<strong>identifiant de votre portefeuille</strong>.</li>
                  <li>Sur le serveur de l’API (Render › Environment), ajoutez <code>KONNECT_API_KEY</code> et <code>KONNECT_WALLET_ID</code>. Pour essayer sans débit réel : <code>KONNECT_ENV=sandbox</code> avec les clés du bac à sable.</li>
                  <li>Redémarrez le service : cette carte passe à « Actif », et le bouton « Payer par carte » s’ouvre pour vos clients.</li>
                </ol>
              </>
            )}
          </Card>

          <Card title="Paiements hors ligne (facultatif)">
            <Check
              checked={form.manualPayments}
              onChange={(v) => set("manualPayments", v)}
              label="Accepter aussi les paiements hors ligne (virement, chèque, espèces…)"
              hint="Désactivé par défaut : tout se paie par carte et rien n’attend votre validation. Activé, le client peut déclarer un paiement hors ligne ; vous le validez alors dans « Paiements » pour ouvrir son accès."
            />
            {form.manualPayments ? (
            <div style={{ marginTop: 30 }}>
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
                <FormField label="Lien de paiement externe (https://…)" hint="Facultatif : adresse d’une page de paiement à part. Elle n’est proposée que si « Carte bancaire » est coché ci-dessus ; ce paiement-là reste à valider ici.">
                  <input type="url" value={form.paymentLink} onChange={(e) => set("paymentLink", e.target.value)} placeholder="https://" style={inputStyle} dir="ltr" />
                </FormField>
              </Row>
            </div>
            <div style={{ marginTop: 18 }}>
              <FormField label="Coordonnées et instructions de paiement" hint="Affichées telles quelles au client : titulaire et RIB, numéro D17 ou Flouci, adresse pour les chèques et les espèces, libellé à indiquer.">
                <textarea value={form.paymentInstructions} onChange={(e) => set("paymentInstructions", e.target.value)} rows={6} maxLength={4000} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
              </FormField>
            </div>
            </div>
            ) : null}
          </Card>

          <Card title="Contacts de support">
            <Row>
              <FormField label="Email"><input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} style={inputStyle} dir="ltr" /></FormField>
              <FormField label="Téléphone"><input type="tel" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} style={inputStyle} dir="ltr" /></FormField>
              <FormField label="WhatsApp"><input type="tel" value={form.supportWhatsapp} onChange={(e) => set("supportWhatsapp", e.target.value)} style={inputStyle} dir="ltr" /></FormField>
            </Row>
            <p style={{ ...helpStyle, marginTop: 14 }}>Affichés sur la page Abonnement des clients (« Besoin d’aide ? »). Les nouvelles inscriptions vous sont aussi signalées à cet email.</p>
          </Card>

          {formError ? <div style={{ marginBottom: 16 }}><InlineError>{formError}</InlineError></div> : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
            <Btn type="button" onClick={() => { setForm(formOf(data)); setFormError(null); }} disabled={saving}>Annuler les changements</Btn>
            <Btn type="submit" variant="primary" busy={saving}>Enregistrer</Btn>
          </div>

          <Card title="Connexions du serveur">
            <div style={{ marginTop: -9 }}>
              <State ok={!!online?.enabled} name="Paiement par carte (Konnect)" on={online?.mode === "sandbox" ? "Mode test (bac à sable) : aucun débit réel." : "Les clients paient en ligne et leur accès s’ouvre automatiquement."} off="Définissez KONNECT_API_KEY et KONNECT_WALLET_ID sur le serveur de l’API (voir « Paiement en ligne par carte » plus haut)." />
              <State ok={!!data.googleConfigured} name="Continuer avec Google" on="Le bouton est affiché sur les pages de connexion et d’inscription." off="Définissez GOOGLE_CLIENT_ID sur le serveur de l’API (identifiant client OAuth « Application Web » de Google Cloud)." />
              <State ok={!!data.appleConfigured} name="Continuer avec Apple" on="Le bouton est affiché sur les pages de connexion et d’inscription." off="Définissez APPLE_CLIENT_ID sur le serveur de l’API (identifiant de service « Sign in with Apple », compte Apple Developer requis)." />
              <State ok={!!data.mailConfigured} name="Envoi d’emails" on="Code de vérification, mot de passe oublié, rappels et reçus de paiement partent par email." off="Définissez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM sur le serveur de l’API : sans cela, le code de vérification n’est pas envoyé." />
            </div>
          </Card>

          <Card title="Maintenance">
            <Notice tone="blue">Ces opérations tournent déjà toutes seules : les boutons servent à les lancer tout de suite.</Notice>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Btn type="button" onClick={() => run("sweep")} busy={maintenance === "sweep"}>Vérifier les échéances maintenant</Btn>
              <Btn type="button" onClick={() => run("catalog")} busy={maintenance === "catalog"}>Mettre à niveau le contenu de départ</Btn>
            </div>
            <p style={{ ...helpStyle, marginTop: 12 }}>Contenu de départ installé : version {data.catalogVersion ?? 1}. La mise à niveau ajoute les nouveaux secteurs et modules et complète les formules restées d’origine ; ce que vous avez modifié n’est jamais écrasé.</p>
          </Card>
        </form>
      )}
    </Page>
  );
}
