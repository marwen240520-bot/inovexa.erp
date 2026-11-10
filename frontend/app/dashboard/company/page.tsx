"use client";
import React, { Suspense, useEffect, useState } from "react";
import ModuleNav, { SETTINGS_TABS } from "@/components/erp/ModuleNav";
import { api, Btn, Card, ErrorBox, Field, inputStyle, Loading, Notice, Page, Row, useLoad, useNotice, useRequireAuth } from "@/components/erp/kit";

const NUMBERING_LABEL: Record<string, string> = {
  quote: "Devis", delivery_note: "Bon de livraison", invoice: "Facture", credit_note: "Avoir", purchase_order: "Bon de commande", goods_receipt: "Bon de réception",
  supplier_invoice: "Facture fournisseur", supplier_credit_note: "Avoir fournisseur", payment: "Règlement", stock_transfer: "Transfert de stock", stock_count: "Inventaire", cash_session: "Clôture de caisse (Z)",
};
const TEXT_FIELDS: Array<[string, string, string?]> = [
  ["legalName", "Raison sociale"], ["tradeName", "Nom commercial"], ["legalForm", "Forme juridique", "SARL, SUARL, SA, personne physique…"],
  ["taxId", "Matricule fiscal", "ex. 1234567/A/M/000"], ["tradeRegister", "Registre de commerce"], ["cnssNumber", "N° CNSS employeur"],
  ["address", "Adresse"], ["city", "Ville"], ["postalCode", "Code postal"], ["phone", "Téléphone"], ["email", "Email"], ["website", "Site web"],
  ["bankName", "Banque"], ["bankAccount", "RIB"],
];

export default function CompanyPage() {
  useRequireAuth();
  const [notice, notify] = useNotice();
  const company = useLoad(() => api<any>("/company"), []);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (company.data) setForm({ ...company.data, numbering: { ...(company.data.numbering || {}) } }); }, [company.data]);

  if (company.loading && !form) return <Page title="Paramètres"><Loading /></Page>;
  if (!form) return <Page title="Paramètres">{company.error && <ErrorBox message={company.error} onRetry={company.reload} />}</Page>;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const numeric = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value === "" ? null : e.target.value);

  const save = async () => {
    setSaving(true);
    try {
      // On n'envoie que ce qui a changé : une valeur inchangée (ou vide) n'a pas à repasser par la validation du serveur.
      const orig = company.data || {};
      const body: any = {};
      const diff = (k: string) => String(form[k] ?? "") !== String(orig[k] ?? "");
      TEXT_FIELDS.forEach(([k]) => { if (diff(k)) body[k] = form[k] ?? ""; });
      ["shareCapital", "defaultVatRate", "stampDutyAmount", "withholdingThreshold", "defaultPaymentTermsDays", "quoteValidityDays"].forEach((k) => { if (diff(k) && form[k] !== null && form[k] !== "") body[k] = Number(form[k]); });
      if (!!form.stampDutyEnabled !== !!orig.stampDutyEnabled) body.stampDutyEnabled = !!form.stampDutyEnabled;
      ["invoiceFooter", "defaultNotes"].forEach((k) => { if (diff(k)) body[k] = form[k] ?? ""; });
      if (diff("logoDataUrl")) body.logoDataUrl = form.logoDataUrl ?? "";
      if (JSON.stringify(form.numbering) !== JSON.stringify(orig.numbering || {})) body.numbering = form.numbering;
      if (!Object.keys(body).length) { notify("Aucune modification à enregistrer."); setSaving(false); return; }
      const saved = await api<any>("/company", { method: "PUT", body });
      company.setData(saved);
      notify("Fiche société enregistrée.");
    } catch (e: any) {
      notify(e.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const gaps: string[] = company.data?.legalGaps || [];
  return (
    <Page title="Paramètres" subtitle="Société et fiscalité : ces informations figurent sur vos factures et sont obligatoires pour les valider"
      actions={<Btn variant="primary" busy={saving} onClick={save}>Enregistrer</Btn>}>
      <Suspense fallback={null}><ModuleNav tabs={SETTINGS_TABS} label="Paramètres" /></Suspense>
      {notice}
      {gaps.length > 0 && <Notice>Mentions légales manquantes pour valider une facture : <strong>{gaps.join(", ")}</strong>.</Notice>}

      <Card title="Logo des documents">
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 96, height: 96, borderRadius: 12, border: "1px dashed var(--theme-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--theme-surface-hover)" }}>
            {form.logoDataUrl
              ? <img src={form.logoDataUrl} alt="Logo de la société" style={{ maxWidth: "100%", maxHeight: "100%" }} />
              : <img src="/logo.png" alt="Logo par défaut" style={{ maxWidth: "70%", maxHeight: "70%", opacity: 0.6 }} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 260px" }}>
            <span style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>
              {form.logoDataUrl ? "Votre logo est imprimé en haut de chaque facture, devis et bon." : "Sans logo chargé, les documents utilisent le logo par défaut de l’application."} PNG ou JPEG, 400 Ko maximum.
            </span>
            <Row>
              <label style={{ display: "inline-block" }}>
                <span style={{ ...inputStyle, display: "inline-block", width: "auto", cursor: "pointer" }}>Choisir une image…</span>
                <input type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={(e) => {
                  const f = e.target.files?.[0]; e.target.value = "";
                  if (!f) return;
                  if (f.size > 400_000) { notify("Image trop lourde (400 Ko maximum) : réduisez-la avant l’envoi.", "err"); return; }
                  const r = new FileReader();
                  r.onload = () => set("logoDataUrl", String(r.result || ""));
                  r.readAsDataURL(f);
                }} />
              </label>
              {form.logoDataUrl && <Btn variant="danger" onClick={() => set("logoDataUrl", "")}>Retirer le logo</Btn>}
            </Row>
          </div>
        </div>
      </Card>

      <Card title="Identité et coordonnées">
        <Row>
          {TEXT_FIELDS.map(([k, label, hint]) => (
            <Field key={k} label={label} hint={hint} grow><input style={inputStyle} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></Field>
          ))}
          <Field label="Capital (DT)"><input inputMode="decimal" style={inputStyle} value={form.shareCapital ?? ""} onChange={numeric("shareCapital")} /></Field>
        </Row>
      </Card>

      <Card title="Fiscalité">
        <Row>
          <Field label="TVA par défaut (%)"><select style={inputStyle} value={form.defaultVatRate} onChange={(e) => set("defaultVatRate", e.target.value)}>{[0, 7, 13, 19].map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Field label="Droit de timbre sur les factures">
            <select style={inputStyle} value={form.stampDutyEnabled ? "1" : "0"} onChange={(e) => set("stampDutyEnabled", e.target.value === "1")}><option value="1">Activé</option><option value="0">Désactivé</option></select>
          </Field>
          <Field label="Montant du timbre (DT)"><input inputMode="decimal" style={inputStyle} value={form.stampDutyAmount ?? ""} onChange={numeric("stampDutyAmount")} /></Field>
          <Field label="Seuil de retenue à la source (DT TTC)" hint="Retenue appliquée au-dessus de ce montant, selon le taux du client"><input inputMode="decimal" style={inputStyle} value={form.withholdingThreshold ?? ""} onChange={numeric("withholdingThreshold")} /></Field>
        </Row>
        <p style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginBottom: 0 }}>Valeurs indicatives : confirmez-les avec votre expert-comptable selon la loi de finances en vigueur.</p>
      </Card>

      <Card title="Conditions commerciales par défaut">
        <Row>
          <Field label="Délai de paiement (jours)"><input inputMode="numeric" style={inputStyle} value={form.defaultPaymentTermsDays ?? ""} onChange={numeric("defaultPaymentTermsDays")} /></Field>
          <Field label="Validité d’un devis (jours)"><input inputMode="numeric" style={inputStyle} value={form.quoteValidityDays ?? ""} onChange={numeric("quoteValidityDays")} /></Field>
        </Row>
        <div style={{ height: 12 }} />
        <Row>
          <Field label="Pied de page des documents" grow><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.invoiceFooter ?? ""} onChange={(e) => set("invoiceFooter", e.target.value)} /></Field>
          <Field label="Notes par défaut" grow><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.defaultNotes ?? ""} onChange={(e) => set("defaultNotes", e.target.value)} /></Field>
        </Row>
      </Card>

      <Card title="Numérotation légale">
        <p style={{ marginTop: 0, fontSize: 13, color: "var(--theme-text-secondary)" }}>Préfixe de chaque type de pièce. Le numéro est de la forme <code>PRÉFIXE-AAAA-00001</code>, continu et sans trou, remis à zéro chaque année. Modifier un préfixe n’affecte pas les pièces déjà émises.</p>
        <Row>
          {Object.keys(NUMBERING_LABEL).map((k) => (
            <Field key={k} label={NUMBERING_LABEL[k]}>
              <input style={{ ...inputStyle, width: 110 }} maxLength={8} value={form.numbering?.[k] ?? ""} onChange={(e) => set("numbering", { ...form.numbering, [k]: e.target.value.toUpperCase() })} />
            </Field>
          ))}
        </Row>
      </Card>
    </Page>
  );
}
