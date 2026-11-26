"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import ModuleNav, { SETTINGS_TABS } from "@/components/erp/ModuleNav";
import { api, Btn, Card, ErrorBox, Field, inputStyle, Loading, Notice, Page, Row, useLoad, useNotice, useRequireAuth } from "@/components/erp/kit";
import { applyCompanyProfile, currencyLabel } from "@/lib/company-profile";
import { countryOptions, currencyOptions, defaultCurrencyFor } from "@/lib/countries";

const NUMBERING_LABEL: Record<string, string> = {
  quote: "Devis", delivery_note: "Bon de livraison", invoice: "Facture", credit_note: "Avoir", purchase_order: "Bon de commande", goods_receipt: "Bon de réception",
  supplier_invoice: "Facture fournisseur", supplier_credit_note: "Avoir fournisseur", payment: "Règlement", stock_transfer: "Transfert de stock", stock_count: "Inventaire", cash_session: "Clôture de caisse (Z)",
};

type TextField = [key: string, label: string, hint?: string];

/** Champs d'identité : l'identifiant fiscal, le numéro CNSS et le RIB dépendent du pays (CNSS : Tunisie uniquement). */
const textFields = (tn: boolean): TextField[] => [
  ["legalName", "Raison sociale"],
  ["tradeName", "Nom commercial"],
  ["legalForm", "Forme juridique", tn ? "SARL, SUARL, SA, personne physique…" : "SARL, SAS, Ltd, GmbH, LLC, auto-entrepreneur…"],
  ["taxId", tn ? "Matricule fiscal" : "Identifiant fiscal", tn ? "ex. 1234567/A/M/000" : "n° de TVA, SIREN, ICE, NIF, EIN… selon votre pays"],
  ["tradeRegister", "Registre de commerce"],
  ...(tn ? [["cnssNumber", "N° CNSS employeur"] as TextField] : []),
  ["address", "Adresse"], ["city", "Ville"], ["postalCode", "Code postal"], ["phone", "Téléphone"], ["email", "Email"], ["website", "Site web"],
  ["bankName", "Banque"], ["bankAccount", tn ? "RIB" : "IBAN / compte bancaire"],
];

/** Taux proposés tant que la société n'a pas réglé les siens : ceux du serveur (Tunisie : 0, 7, 13, 19 ; ailleurs : 0). */
const defaultRatesFor = (country: string): number[] => (country === "TN" ? [0, 7, 13, 19] : [0]);

/** Ajoute le taux par défaut à la liste (il en fait toujours partie, comme sur le serveur), triée et sans doublon. */
const withDefault = (rates: number[], def: number): number[] => {
  const set = new Set(rates);
  if (Number.isFinite(def) && def >= 0 && def <= 100) set.add(Math.round(def * 100) / 100);
  return Array.from(set).sort((a, b) => a - b);
};

/** « 5,5 » ou « 5.5 » donne 5,5 ; null si ce n'est pas un taux valable (0 à 100, deux décimales au plus). */
const parseRate = (raw: string): number | null => {
  const text = raw.trim().replace(",", ".");
  const n = Number(text);
  return text !== "" && Number.isFinite(n) && n >= 0 && n <= 100 && Math.round(n * 100) / 100 === n ? n : null;
};

const rateText = (r: number) => `${r.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

export default function CompanyPage() {
  useRequireAuth();
  const [notice, notify] = useNotice();
  const company = useLoad(() => api<any>("/company"), []);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  // Taux de TVA en cours de modification. Tant qu'ils ne sont pas touchés, ils suivent le pays choisi (réglage du serveur).
  const [vat, setVat] = useState<number[]>([]);
  const [vatTouched, setVatTouched] = useState(false);
  const [newRate, setNewRate] = useState("");
  const countries = useMemo(() => countryOptions("fr"), []);
  const allCurrencies = useMemo(() => currencyOptions("fr"), []);

  useEffect(() => {
    if (!company.data) return;
    setForm({ ...company.data, numbering: { ...(company.data.numbering || {}) } });
    setVat(company.data.profile?.vatRates ?? [Number(company.data.defaultVatRate) || 0]);
    setVatTouched(false);
    setNewRate("");
  }, [company.data]);

  if (company.loading && !form) return <Page title="Paramètres"><Loading /></Page>;
  if (!form) return <Page title="Paramètres">{company.error && <ErrorBox message={company.error} onRetry={company.reload} />}</Page>;

  const orig = company.data || {};
  const country: string = form.countryCode || "TN";
  const tn = country === "TN";
  const fields = textFields(tn);
  const unit = currencyLabel(form.currency);
  const defaultVat = Number(form.defaultVatRate);
  const followsCountry = !vatTouched && orig.vatRates == null;
  const rates = withDefault(followsCountry ? defaultRatesFor(country) : vat, defaultVat);
  const currencies = allCurrencies.some((c) => c.code === form.currency) ? allCurrencies : [{ code: String(form.currency), name: String(form.currency) }, ...allCurrencies];

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const numeric = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value === "" ? null : e.target.value);

  /** Changer de pays : la Tunisie impose le dinar ; ailleurs, la devise suit le pays tant qu'elle n'a pas été choisie à la main. */
  const onCountry = (code: string) => setForm((f: any) => {
    const previousDefault = defaultCurrencyFor(f.countryCode) || "TND";
    let currency: string = f.currency || "TND";
    if (code === "TN") currency = "TND";
    else if (currency === previousDefault) currency = defaultCurrencyFor(code) || currency;
    return { ...f, countryCode: code, currency };
  });

  const editRates = (next: number[]) => { setVat(Array.from(new Set(next)).sort((a, b) => a - b)); setVatTouched(true); };
  const addRate = () => {
    const n = parseRate(newRate);
    if (n === null) { notify("Taux de TVA invalide : un nombre de 0 à 100, deux décimales au plus.", "err"); return; }
    if (rates.includes(n)) { notify(`Le taux ${rateText(n)} existe déjà.`, "err"); return; }
    if (rates.length >= 20) { notify("Vingt taux de TVA au maximum.", "err"); return; }
    editRates([...rates, n]);
    setNewRate("");
  };

  const save = async () => {
    setSaving(true);
    try {
      // On n'envoie que ce qui a changé : une valeur inchangée (ou vide) n'a pas à repasser par la validation du serveur.
      const body: any = {};
      const diff = (k: string) => String(form[k] ?? "") !== String(orig[k] ?? "");
      if (diff("countryCode")) body.countryCode = form.countryCode;
      if (diff("currency")) body.currency = form.currency;
      textFields(true).forEach(([k]) => { if (diff(k)) body[k] = form[k] ?? ""; });
      ["shareCapital", "defaultVatRate", "stampDutyAmount", "withholdingThreshold", "defaultPaymentTermsDays", "quoteValidityDays"].forEach((k) => { if (diff(k) && form[k] !== null && form[k] !== "") body[k] = Number(form[k]); });
      if (vatTouched) body.vatRates = rates;
      if (!!form.stampDutyEnabled !== !!orig.stampDutyEnabled) body.stampDutyEnabled = !!form.stampDutyEnabled;
      ["invoiceFooter", "defaultNotes"].forEach((k) => { if (diff(k)) body[k] = form[k] ?? ""; });
      if (diff("logoDataUrl")) body.logoDataUrl = form.logoDataUrl ?? "";
      if (JSON.stringify(form.numbering) !== JSON.stringify(orig.numbering || {})) body.numbering = form.numbering;
      if (!Object.keys(body).length) { notify("Aucune modification à enregistrer."); setSaving(false); return; }
      const saved = await api<any>("/company", { method: "PUT", body });
      // Pays, devise et taux de TVA servent à tous les écrans : le profil est renouvelé tout de suite.
      applyCompanyProfile(saved.profile);
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

      <Card title="Pays et devise">
        <Row>
          <Field label="Pays de la société" grow>
            <select style={inputStyle} value={country} onChange={(e) => onCountry(e.target.value)}>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Devise des comptes" grow>
            <select style={inputStyle} value={form.currency || "TND"} disabled={tn} onChange={(e) => set("currency", e.target.value)}>
              {currencies.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </Field>
        </Row>
        {/* Textes en flux normal : l'aide d'un Field est posée en absolu et ne convient qu'à une ligne courte. */}
        <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--theme-text-secondary)", margin: "12px 0 0" }}>
          Le pays détermine l’identifiant fiscal, les taux de TVA proposés et les fonctions locales.{" "}
          {tn
            ? "Une société tunisienne tient ses comptes en dinars tunisiens."
            : "La devise est fixée dès la première pièce numérotée : une comptabilité se tient dans une seule devise."}
        </p>
        {!tn && (
          <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--theme-text-secondary)", margin: "6px 0 0" }}>
            Le droit de timbre, la retenue à la source, la facture électronique TEIF (El Fatoora) et la paie CNSS sont propres à la Tunisie : ils ne s’appliquent pas à votre société.
          </p>
        )}
      </Card>

      <Card title="Identité et coordonnées">
        <Row>
          {fields.map(([k, label, hint]) => (
            <Field key={k} label={label} hint={hint} grow><input style={inputStyle} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></Field>
          ))}
          <Field label={`Capital (${unit})`}><input inputMode="decimal" style={inputStyle} value={form.shareCapital ?? ""} onChange={numeric("shareCapital")} /></Field>
        </Row>
      </Card>

      <Card title="Fiscalité">
        <Row>
          <Field label="TVA par défaut (%)">
            <select style={inputStyle} value={String(defaultVat)} onChange={(e) => set("defaultVatRate", e.target.value)}>
              {rates.map((r) => <option key={r} value={String(r)}>{r.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</option>)}
            </select>
          </Field>
          {tn && (
            <>
              <Field label="Droit de timbre sur les factures">
                <select style={inputStyle} value={form.stampDutyEnabled ? "1" : "0"} onChange={(e) => set("stampDutyEnabled", e.target.value === "1")}><option value="1">Activé</option><option value="0">Désactivé</option></select>
              </Field>
              <Field label="Montant du timbre (DT)"><input inputMode="decimal" style={inputStyle} value={form.stampDutyAmount ?? ""} onChange={numeric("stampDutyAmount")} /></Field>
              <Field label="Seuil de retenue à la source (DT TTC)" hint="Retenue appliquée au-dessus de ce montant, selon le taux du client"><input inputMode="decimal" style={inputStyle} value={form.withholdingThreshold ?? ""} onChange={numeric("withholdingThreshold")} /></Field>
            </>
          )}
        </Row>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Taux de TVA proposés sur vos documents</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {rates.map((r) => {
              const isDefault = r === Math.round(defaultVat * 100) / 100;
              return (
                <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--theme-border)", background: "var(--theme-surface-hover)", fontSize: 13 }}>
                  {rateText(r)}
                  {isDefault
                    ? <span style={{ fontSize: 11, color: "var(--theme-text-secondary)" }}>par défaut</span>
                    : <button type="button" aria-label={`Retirer le taux ${rateText(r)}`} title="Retirer ce taux" onClick={() => editRates(rates.filter((x) => x !== r))}
                        style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--theme-text-secondary)", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>}
                </span>
              );
            })}
            <input inputMode="decimal" aria-label="Nouveau taux de TVA" placeholder="Ajouter un taux" style={{ ...inputStyle, width: 140 }} value={newRate}
              onChange={(e) => setNewRate(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRate(); } }} />
            <Btn onClick={addRate} disabled={!newRate.trim()}>Ajouter</Btn>
          </div>
          <p style={{ fontSize: 12, color: "var(--theme-text-secondary)", marginBottom: 0 }}>
            {followsCountry && !tn ? "Aucun taux n’est encore réglé pour votre pays : ajoutez ceux que vous facturez (par exemple 5,5 ; 10 ; 20), puis choisissez le taux par défaut. " : ""}
            Le taux par défaut ne peut pas être retiré : changez-le d’abord. Valeurs indicatives : confirmez-les avec votre expert-comptable selon la loi de finances en vigueur.
          </p>
        </div>
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
