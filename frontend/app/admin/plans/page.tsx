"use client";
/**
 * Administration › Formules d'abonnement.
 * Les formules livrées avec la plateforme sont des BROUILLONS aux prix proposés : rien n'est affiché sur le site
 * tant que l'administrateur n'a pas relu les prix et publié. L'écran le rappelle et sépare « enregistrer » de « publier ».
 */
import React, { CSSProperties, FormEvent, useMemo, useState } from "react";
import { api, ApiError, Badge, Btn, Empty, ErrorBox, inputStyle, Loading, Modal, Notice, Page, Row, useLoad, useNotice } from "@/components/erp/kit";
import { MODULE_LABELS, SELECTABLE_MODULES, formatPrice, withVat, type Plan } from "@/lib/saas";
import { AdminSettings, Check, ConfirmModal, FormField, InlineError, LANG, codeStyle, errorText, helpStyle, plural } from "@/components/admin/config/shared";

// Mêmes règles que le serveur (subscription.service.ts › cleanPlan) : il reste seul juge, ceci évite un aller-retour.
const CODE_RE = /^[a-z0-9][a-z0-9_-]{1,38}$/;
const MAX_PRICE = 1_000_000;
const MAX_FEATURES = 20;
const FEATURE_LENGTH = 160;
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const percent = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

interface PlanForm {
  code: string; name: string; description: string; priceMonthly: string; priceAnnual: string; maxUsers: string;
  allModules: boolean; modules: string[]; features: string[]; highlight: boolean; isActive: boolean; sortOrder: string;
}
interface PlanPayload {
  code: string; name: string; description: string | null; priceMonthly: number | null; priceAnnual: number | null; maxUsers: number | null;
  modules: string[] | null; features: string[]; highlight: boolean; isActive: boolean; sortOrder: number;
}
type FormErrors = Partial<Record<keyof PlanForm, string>>;

const amountInput = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

const formOf = (plan: Plan | null, nextSortOrder: number): PlanForm => plan
  ? {
    code: plan.code, name: plan.name, description: plan.description || "", priceMonthly: amountInput(plan.priceMonthly), priceAnnual: amountInput(plan.priceAnnual),
    maxUsers: plan.maxUsers === null ? "" : String(plan.maxUsers), allModules: !plan.modules?.length, modules: plan.modules || [],
    features: plan.features?.length ? plan.features : [""], highlight: plan.highlight, isActive: plan.isActive, sortOrder: String(plan.sortOrder),
  }
  : { code: "", name: "", description: "", priceMonthly: "", priceAnnual: "", maxUsers: "", allModules: true, modules: [], features: [""], highlight: false, isActive: true, sortOrder: String(nextSortOrder) };

/** Montant saisi (virgule ou point) : null = champ vide (« sur devis »), undefined = saisie invalide. */
function parseAmount(raw: string): number | null | undefined {
  const s = raw.replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return undefined;
  const n = round3(Number(s));
  return n <= MAX_PRICE ? n : undefined;
}

/** Ce que le serveur enregistrerait pour cette formule, dans la même forme que le formulaire validé (pour comparer). */
const payloadOf = (plan: Plan): PlanPayload => ({
  code: plan.code, name: plan.name, description: plan.description || null, priceMonthly: plan.priceMonthly, priceAnnual: plan.priceAnnual, maxUsers: plan.maxUsers,
  modules: plan.modules?.length ? [...plan.modules].sort() : null, features: plan.features || [], highlight: plan.highlight, isActive: plan.isActive, sortOrder: plan.sortOrder,
});

function checkForm(form: PlanForm, otherCodes: string[]): { payload: PlanPayload | null; errors: FormErrors } {
  const errors: FormErrors = {};
  const code = form.code.trim().toLowerCase();
  if (!CODE_RE.test(code)) errors.code = "Lettres minuscules, chiffres et tirets, 2 à 39 caractères, sans espace.";
  else if (otherCodes.includes(code)) errors.code = "Ce code est déjà utilisé par une autre formule.";
  const name = form.name.trim();
  if (name.length < 2 || name.length > 80) errors.name = "Le nom doit contenir entre 2 et 80 caractères.";
  const priceMonthly = parseAmount(form.priceMonthly);
  if (priceMonthly === undefined) errors.priceMonthly = "Montant invalide (0 à 1 000 000, 3 décimales au plus).";
  const priceAnnual = parseAmount(form.priceAnnual);
  if (priceAnnual === undefined) errors.priceAnnual = "Montant invalide (0 à 1 000 000, 3 décimales au plus).";
  const users = form.maxUsers.trim();
  const maxUsers = users === "" ? null : /^\d+$/.test(users) ? Number(users) : NaN;
  if (maxUsers !== null && !(maxUsers >= 1 && maxUsers <= 10_000)) errors.maxUsers = "Nombre entier entre 1 et 10 000, ou vide pour « illimité ».";
  if (!form.allModules && form.modules.length === 0) errors.modules = "Cochez au moins un module, ou choisissez « Tous les modules ».";
  const order = form.sortOrder.trim();
  if (!/^-?\d{1,6}$/.test(order)) errors.sortOrder = "Nombre entier.";
  if (Object.keys(errors).length) return { payload: null, errors };
  return {
    errors,
    payload: {
      code, name, description: form.description.trim() || null, priceMonthly: priceMonthly as number | null, priceAnnual: priceAnnual as number | null,
      maxUsers: maxUsers as number | null, modules: form.allModules ? null : [...form.modules].sort(),
      features: form.features.map((f) => f.trim()).filter(Boolean), highlight: form.highlight, isActive: form.isActive, sortOrder: Number(order),
    },
  };
}

/** Champs réellement modifiés : seuls ceux-là partent dans le PATCH. */
function changesOf(payload: PlanPayload, plan: Plan): Partial<PlanPayload> {
  const before = payloadOf(plan) as unknown as Record<string, unknown>;
  const after = payload as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(after)) if (JSON.stringify(after[key]) !== JSON.stringify(before[key])) out[key] = after[key];
  return out as Partial<PlanPayload>;
}

/** Économie d'un paiement annuel par rapport à douze mensualités (null si l'un des deux prix manque). */
function annualSaving(monthly: number | null, annual: number | null) {
  if (monthly === null || annual === null) return null;
  const twelve = round3(monthly * 12);
  const saving = round3(twelve - annual);
  return { twelve, saving, rate: twelve > 0 ? (saving / twelve) * 100 : null };
}

interface Money { vat: number | null; currency: string }
const ht = (n: number, m: Money) => `${formatPrice(n, LANG, m.currency)} HT`;
const ttc = (n: number, m: Money) => (m.vat === null ? null : `${formatPrice(withVat(n, m.vat, m.currency), LANG, m.currency)} TTC`);

const cardStyle: CSSProperties = { background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 };
const sectionTitle: CSSProperties = { margin: 0, fontSize: 12, fontWeight: 700, color: "var(--theme-text-secondary)", textTransform: "uppercase", letterSpacing: 0.4 };

export default function AdminPlansPage() {
  const [notice, notify] = useNotice();
  const plans = useLoad(() => api<Plan[]>("/admin/plans"), []);
  // Le taux de TVA et la devise viennent des réglages : sans eux, on n'affiche pas d'équivalent TTC plutôt qu'un chiffre inventé.
  const settings = useLoad(() => api<AdminSettings>("/admin/settings"), []);
  const money: Money = { vat: settings.data ? Number(settings.data.vatRate) : null, currency: settings.data?.currency || "USD" };

  const [editor, setEditor] = useState<{ plan: Plan | null } | null>(null);
  const [publishing, setPublishing] = useState<Plan | null>(null);
  const [removing, setRemoving] = useState<{ plan: Plan; refused: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Formules dont le serveur a refusé le changement de code (déjà utilisées par des comptes) : le champ reste figé.
  const [lockedCodes, setLockedCodes] = useState<number[]>([]);

  const list = plans.data || [];
  const live = list.filter((p) => p.isPublic && p.isActive).length;
  const drafts = list.filter((p) => !p.isPublic).length;
  const nextSortOrder = list.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1;

  const closeDialogs = () => { setPublishing(null); setRemoving(null); setActionError(null); };

  async function setPublic(plan: Plan, isPublic: boolean) {
    setBusy(true); setActionError(null);
    try {
      await api<Plan>(`/admin/plans/${plan.id}`, { method: "PATCH", body: { isPublic } });
      closeDialogs();
      notify(isPublic ? `Formule « ${plan.name} » publiée.` : `Formule « ${plan.name} » retirée du site.`);
      await plans.reload();
    } catch (e) { setActionError(errorText(e)); } finally { setBusy(false); }
  }

  async function remove(plan: Plan) {
    setBusy(true); setActionError(null);
    try {
      await api(`/admin/plans/${plan.id}`, { method: "DELETE" });
      closeDialogs();
      notify(`Formule « ${plan.name} » supprimée.`);
      await plans.reload();
    } catch (e) {
      // 409 : la formule est utilisée par des comptes ou des paiements. On garde le message du serveur et on propose de la désactiver.
      if (e instanceof ApiError && e.status === 409) setRemoving({ plan, refused: e.message });
      else setActionError(errorText(e));
    } finally { setBusy(false); }
  }

  async function deactivate(plan: Plan) {
    setBusy(true); setActionError(null);
    try {
      await api<Plan>(`/admin/plans/${plan.id}`, { method: "PATCH", body: { isActive: false } });
      closeDialogs();
      notify(`Formule « ${plan.name} » désactivée.`);
      await plans.reload();
    } catch (e) { setActionError(errorText(e)); } finally { setBusy(false); }
  }

  return (
    <Page
      title="Formules d’abonnement"
      subtitle="Prix hors taxes, utilisateurs, modules inclus et publication sur le site."
      actions={<Btn variant="primary" onClick={() => setEditor({ plan: null })} disabled={!plans.data}>Nouvelle formule</Btn>}
    >
      {notice}

      <Notice tone={live ? "blue" : "amber"}>
        <strong>Rien n’est public tant que vous n’avez pas publié.</strong> Les formules livrées avec la plateforme sont des brouillons et leurs prix
        sont des propositions à relire. Une formule n’apparaît sur la page Tarifs du site, et ne peut être choisie par un client, qu’une fois
        publiée et active.
        {plans.data && (
          <span style={{ display: "block", marginTop: 6 }}>
            {list.length === 0
              ? "Aucune formule n’existe pour l’instant."
              : `Actuellement : ${plural(live, "formule visible sur le site", "formules visibles sur le site")}, ${plural(drafts, "brouillon", "brouillons")}.`}
            {list.length > 0 && live === 0 && " Le site n’affiche donc aucun prix et les clients ne peuvent pas déclarer de paiement."}
          </span>
        )}
      </Notice>

      {settings.error && (
        <ErrorBox message={`Taux de TVA indisponible, les équivalents TTC ne sont pas affichés : ${settings.error}`} onRetry={settings.reload} />
      )}

      {plans.error ? <ErrorBox message={plans.error} onRetry={plans.reload} />
        : !plans.data ? <Loading />
          : list.length === 0 ? (
            <div style={cardStyle}><Empty>Aucune formule. Créez-en une avec « Nouvelle formule » : elle sera enregistrée en brouillon.</Empty></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 16, opacity: plans.loading ? 0.6 : 1 }} aria-busy={plans.loading}>
              {list.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  money={money}
                  onEdit={() => setEditor({ plan })}
                  onPublish={() => { setActionError(null); setPublishing(plan); }}
                  onDelete={() => { setActionError(null); setRemoving({ plan, refused: null }); }}
                />
              ))}
            </div>
          )}

      {editor && (
        <PlanEditor
          plan={editor.plan}
          money={money}
          nextSortOrder={nextSortOrder}
          otherCodes={list.filter((p) => p.id !== editor.plan?.id).map((p) => p.code)}
          codeLocked={!!editor.plan && lockedCodes.includes(editor.plan.id)}
          onCodeRefused={(id) => setLockedCodes((ids) => (ids.includes(id) ? ids : [...ids, id]))}
          onClose={() => setEditor(null)}
          onSaved={(message) => { setEditor(null); notify(message); void plans.reload(); }}
        />
      )}

      {publishing && !publishing.isPublic && (
        <ConfirmModal
          title={`Publier « ${publishing.name} » ?`}
          confirmLabel="Publier sur le site"
          busy={busy}
          error={actionError}
          onCancel={closeDialogs}
          onConfirm={() => setPublic(publishing, true)}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            La formule sera affichée sur la page Tarifs du site et proposée aux clients sur leur page Abonnement, avec ces prix :
          </p>
          <PriceLines plan={publishing} money={money} />
          {publishing.priceMonthly === null && publishing.priceAnnual === null
            ? <p style={helpStyle}>Sans prix, elle s’affichera « sur devis » et ne pourra pas être souscrite en ligne.</p>
            : <p style={helpStyle}>Vérifiez qu’ils correspondent à votre offre : ce sont des propositions tant que vous ne les avez pas relus.</p>}
          {!publishing.isActive && <Notice>Cette formule est désactivée : elle ne sera visible qu’une fois réactivée (Modifier › Formule active).</Notice>}
        </ConfirmModal>
      )}

      {publishing && publishing.isPublic && (
        <ConfirmModal
          title={`Retirer « ${publishing.name} » du site ?`}
          confirmLabel="Repasser en brouillon"
          busy={busy}
          error={actionError}
          onCancel={closeDialogs}
          onConfirm={() => setPublic(publishing, false)}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            La formule ne sera plus affichée sur le site ni proposée aux clients. Les comptes qui l’utilisent gardent leur abonnement et leur accès.
          </p>
        </ConfirmModal>
      )}

      {removing && (
        <Modal
          title={`Supprimer « ${removing.plan.name} » ?`}
          onClose={() => { if (!busy) closeDialogs(); }}
          footer={removing.refused
            ? <><Btn onClick={closeDialogs} disabled={busy}>Fermer</Btn>{removing.plan.isActive && <Btn variant="primary" busy={busy} onClick={() => deactivate(removing.plan)}>Désactiver la formule</Btn>}</>
            : <><Btn onClick={closeDialogs} disabled={busy}>Annuler</Btn><Btn variant="danger" busy={busy} onClick={() => remove(removing.plan)}>Supprimer définitivement</Btn></>}
        >
          {removing.refused ? (
            <>
              <InlineError>{removing.refused}</InlineError>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                {removing.plan.isActive
                  ? "Une formule désactivée n’est plus affichée ni proposée, et son historique de paiements est conservé."
                  : "Cette formule est déjà désactivée : elle n’est ni affichée ni proposée, et son historique de paiements est conservé."}
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              La formule <strong>{removing.plan.name}</strong> (<span style={codeStyle}>{removing.plan.code}</span>) sera supprimée définitivement.
              Le serveur refuse la suppression si des comptes ou des paiements l’utilisent.
            </p>
          )}
          {actionError && <InlineError>{actionError}</InlineError>}
        </Modal>
      )}
    </Page>
  );
}

/** Prix d'une formule : HT saisi, équivalent TTC calculé avec la TVA des réglages, économie du paiement annuel. */
function PriceLines({ plan, money }: { plan: Plan; money: Money }) {
  const saving = annualSaving(plan.priceMonthly, plan.priceAnnual);
  const line = (label: string, amount: number | null) => (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2px 12px", fontSize: 14 }}>
      <span style={{ color: "var(--theme-text-secondary)" }}>{label}</span>
      {amount === null
        ? <span style={{ fontWeight: 600 }}>Sur devis</span>
        : (
          <span style={{ textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
            <strong>{ht(amount, money)}</strong>
            {ttc(amount, money) && <span style={{ color: "var(--theme-text-secondary)" }}> · {ttc(amount, money)}</span>}
          </span>
        )}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {line("Par mois", plan.priceMonthly)}
      {line("Par an", plan.priceAnnual)}
      {saving && saving.saving > 0 && (
        <span style={{ fontSize: 12.5, color: "var(--theme-success, #10b981)", fontWeight: 600 }}>
          Paiement annuel : {ht(saving.saving, money)} d’économie{saving.rate !== null ? ` (${percent(saving.rate)})` : ""} par rapport à 12 mensualités
        </span>
      )}
      {saving && saving.saving < 0 && (
        <span style={{ fontSize: 12.5, color: "var(--theme-danger, #ef4444)", fontWeight: 600 }}>
          Le prix annuel dépasse 12 mensualités de {ht(-saving.saving, money)}
        </span>
      )}
    </div>
  );
}

function PlanCard({ plan, money, onEdit, onPublish, onDelete }: { plan: Plan; money: Money; onEdit: () => void; onPublish: () => void; onDelete: () => void }) {
  return (
    <article style={{ ...cardStyle, ...(plan.highlight ? { borderColor: "var(--theme-primary, #4f46e5)" } : null), opacity: plan.isActive ? 1 : 0.8 }} aria-label={`Formule ${plan.name}`}>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {plan.isPublic ? <Badge tone="green">Publié</Badge> : <Badge tone="amber">Brouillon</Badge>}
          {!plan.isActive && <Badge tone="red">Désactivée</Badge>}
          {plan.highlight && <Badge tone="violet">Recommandée</Badge>}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, overflowWrap: "anywhere" }}>{plan.name}</h2>
          <div style={{ ...codeStyle, color: "var(--theme-text-secondary)", marginTop: 2 }}>{plan.code} · ordre {plan.sortOrder}</div>
        </div>
        {plan.description && <p style={{ ...helpStyle, overflowWrap: "anywhere" }}>{plan.description}</p>}
        {plan.isPublic && !plan.isActive && <p style={{ ...helpStyle, color: "var(--theme-danger, #ef4444)" }}>Publiée mais désactivée : elle n’est pas visible sur le site.</p>}
      </header>

      <PriceLines plan={plan} money={money} />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 style={sectionTitle}>Utilisateurs</h3>
        <span style={{ fontSize: 14 }}>{plan.maxUsers === null ? "Illimités" : `Jusqu’à ${plan.maxUsers}, propriétaire compris`}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 style={sectionTitle}>Modules</h3>
        {!plan.modules?.length
          ? <span style={{ fontSize: 14 }}>Tous les modules du secteur du compte</span>
          : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {plan.modules.map((key) => <Badge key={key}>{MODULE_LABELS[key] || key}</Badge>)}
            </div>
          )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <h3 style={sectionTitle}>Arguments affichés</h3>
        {plan.features?.length
          ? <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 14, lineHeight: 1.5 }}>{plan.features.map((f, i) => <li key={i} style={{ overflowWrap: "anywhere" }}>{f}</li>)}</ul>
          : <span style={{ fontSize: 14, color: "var(--theme-text-secondary)" }}>Aucun</span>}
      </div>

      <footer style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 12, borderTop: "1px solid var(--theme-border)" }}>
        <Btn onClick={onEdit}>Modifier</Btn>
        {plan.isPublic ? <Btn onClick={onPublish}>Retirer du site</Btn> : <Btn variant="success" onClick={onPublish}>Publier</Btn>}
        <Btn variant="danger" onClick={onDelete} style={{ marginInlineStart: "auto" }}>Supprimer</Btn>
      </footer>
    </article>
  );
}

function PlanEditor({ plan, money, nextSortOrder, otherCodes, codeLocked, onCodeRefused, onClose, onSaved }: {
  plan: Plan | null; money: Money; nextSortOrder: number; otherCodes: string[]; codeLocked: boolean;
  onCodeRefused: (planId: number) => void; onClose: () => void; onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<PlanForm>(() => formOf(plan, nextSortOrder));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const { errors } = useMemo(() => checkForm(form, otherCodes), [form, otherCodes]);
  // Les erreurs de saisie ne s'affichent qu'après une première tentative : un formulaire vide n'est pas « en erreur ».
  const shown: FormErrors = submitted ? errors : {};

  // Modules proposés + ceux que la formule contient déjà et qui ne sont plus proposés (on doit pouvoir les voir et les retirer).
  const moduleOptions = useMemo(() => {
    const extra = (plan?.modules || []).filter((key) => !(SELECTABLE_MODULES as string[]).includes(key));
    return [...SELECTABLE_MODULES, ...extra] as string[];
  }, [plan]);

  const monthly = parseAmount(form.priceMonthly);
  const annual = parseAmount(form.priceAnnual);
  const saving = monthly !== undefined && annual !== undefined ? annualSaving(monthly, annual) : null;
  const priceHint = (amount: number | null | undefined) => {
    if (amount === undefined) return undefined;
    if (amount === null) return "Vide = « sur devis » : la formule ne peut pas être souscrite sur ce cycle.";
    return ttc(amount, money) ? `soit ${ttc(amount, money)} (TVA ${percent(money.vat as number)})` : "Équivalent TTC non calculé : taux de TVA indisponible.";
  };

  const toggleModule = (key: string, on: boolean) => set("modules", on ? Array.from(new Set([...form.modules, key])) : form.modules.filter((m) => m !== key));
  const setFeature = (index: number, value: string) => set("features", form.features.map((f, i) => (i === index ? value : f)));
  const moveFeature = (index: number, delta: number) => {
    const next = [...form.features];
    const [line] = next.splice(index, 1);
    next.splice(index + delta, 0, line);
    set("features", next);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const { payload } = checkForm(form, otherCodes);
    if (!payload) { setError("Corrigez les champs signalés avant d’enregistrer."); return; }
    setBusy(true); setError(null);
    try {
      if (!plan) {
        const created = await api<Plan>("/admin/plans", { method: "POST", body: payload });
        onSaved(`Formule « ${created.name} » créée en brouillon.`);
        return;
      }
      const changes = changesOf(payload, plan);
      if (Object.keys(changes).length === 0) { onClose(); return; }
      const saved = await api<Plan>(`/admin/plans/${plan.id}`, { method: "PATCH", body: changes });
      onSaved(`Formule « ${saved.name} » enregistrée.`);
    } catch (err) {
      // Le serveur refuse de changer le code d'une formule déjà utilisée par des comptes : on le remet et on fige le champ.
      if (plan && err instanceof ApiError && err.status === 409 && payload.code !== plan.code) {
        onCodeRefused(plan.id);
        set("code", plan.code);
      }
      setError(errorText(err));
    } finally { setBusy(false); }
  }

  const iconBtn: CSSProperties = { padding: "6px 10px", minWidth: 36 };

  return (
    <Modal
      title={plan ? `Modifier « ${plan.name} »` : "Nouvelle formule"}
      width={760}
      onClose={() => { if (!busy) onClose(); }}
      footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn type="submit" form="plan-form" variant="primary" busy={busy}>{plan ? "Enregistrer" : "Créer en brouillon"}</Btn></>}
    >
      <form id="plan-form" onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {plan?.isPublic
          ? <Notice>Cette formule est publiée : vos modifications sont visibles sur le site dès l’enregistrement.</Notice>
          : <Notice tone="blue">{plan ? "Formule en brouillon : elle n’est pas visible sur le site." : "La formule est créée en brouillon. Publiez-la depuis la liste une fois les prix relus."}</Notice>}

        <Row>
          <FormField
            label="Code"
            error={shown.code}
            hint={codeLocked
              ? "Des comptes utilisent cette formule : son code ne peut plus changer."
              : plan ? "Le code relie la formule aux comptes et aux paiements : ne le changez que si elle n’a jamais servi." : "Lettres minuscules, chiffres et tirets. Exemple : starter."}
          >
            <input
              style={{ ...inputStyle, ...codeStyle, fontSize: 14 }} value={form.code} readOnly={codeLocked} aria-readonly={codeLocked} maxLength={39} autoComplete="off" spellCheck={false}
              onChange={(e) => set("code", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            />
          </FormField>
          <FormField label="Nom" error={shown.name}>
            <input style={inputStyle} value={form.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
          </FormField>
        </Row>

        <FormField label="Description" hint={`${form.description.length} / 400 caractères`}>
          <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical", fontFamily: "inherit" }} value={form.description} maxLength={400} onChange={(e) => set("description", e.target.value)} />
        </FormField>

        <Row>
          <FormField label={`Prix mensuel HT (${money.currency})`} error={shown.priceMonthly} hint={priceHint(monthly)}>
            <input style={inputStyle} inputMode="decimal" value={form.priceMonthly} placeholder="Sur devis" onChange={(e) => set("priceMonthly", e.target.value)} />
          </FormField>
          <FormField label={`Prix annuel HT (${money.currency})`} error={shown.priceAnnual} hint={priceHint(annual)}>
            <input style={inputStyle} inputMode="decimal" value={form.priceAnnual} placeholder="Sur devis" onChange={(e) => set("priceAnnual", e.target.value)} />
          </FormField>
        </Row>
        {saving && (
          <p role="status" style={{ ...helpStyle, fontWeight: 600, color: saving.saving > 0 ? "var(--theme-success, #10b981)" : saving.saving < 0 ? "var(--theme-danger, #ef4444)" : "var(--theme-text-secondary)" }}>
            {saving.saving > 0 && `Paiement annuel : ${ht(saving.saving, money)} d’économie${saving.rate !== null ? ` (${percent(saving.rate)})` : ""} par rapport à 12 mensualités (${ht(saving.twelve, money)}).`}
            {saving.saving === 0 && "Le prix annuel est égal à 12 mensualités : aucune économie pour le client."}
            {saving.saving < 0 && `Le prix annuel dépasse 12 mensualités (${ht(saving.twelve, money)}) de ${ht(-saving.saving, money)}.`}
          </p>
        )}

        <Row>
          <FormField label="Nombre maximal d’utilisateurs" error={shown.maxUsers} hint="Propriétaire du compte compris. Vide = illimité.">
            <input style={inputStyle} inputMode="numeric" value={form.maxUsers} placeholder="Illimité" onChange={(e) => set("maxUsers", e.target.value)} />
          </FormField>
          <FormField label="Ordre d’affichage" error={shown.sortOrder} hint="Les formules sont présentées du plus petit au plus grand.">
            <input style={inputStyle} inputMode="numeric" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
          </FormField>
        </Row>

        <fieldset style={{ border: "1px solid var(--theme-border)", borderRadius: 12, padding: 14, margin: 0, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <legend style={{ ...sectionTitle, padding: "0 6px" }}>Modules inclus</legend>
          <Check type="radio" name="plan-modules" checked={form.allModules} onChange={() => set("allModules", true)} label="Tous les modules" hint="À la souscription, le compte reçoit tous les modules prévus pour son secteur d’activité." />
          <Check type="radio" name="plan-modules" checked={!form.allModules} onChange={() => set("allModules", false)} label="Une sélection de modules" hint="Le compte reçoit les modules de son secteur, limités à ceux cochés ci-dessous." />
          {!form.allModules && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Btn onClick={() => set("modules", moduleOptions)} style={{ padding: "5px 10px", fontSize: 13 }}>Tout cocher</Btn>
                <Btn onClick={() => set("modules", [])} style={{ padding: "5px 10px", fontSize: 13 }}>Tout décocher</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 190px), 1fr))", gap: "10px 16px" }}>
                {moduleOptions.map((key) => (
                  <Check key={key} checked={form.modules.includes(key)} onChange={(on) => toggleModule(key, on)} label={<span style={{ fontWeight: 500 }}>{MODULE_LABELS[key] || key}</span>} />
                ))}
              </div>
              <p style={helpStyle}>Le tableau de bord, le profil et les paramètres restent toujours accessibles.</p>
              {shown.modules && <InlineError>{shown.modules}</InlineError>}
            </>
          )}
        </fieldset>

        <fieldset style={{ border: "1px solid var(--theme-border)", borderRadius: 12, padding: 14, margin: 0, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <legend style={{ ...sectionTitle, padding: "0 6px" }}>Arguments affichés sur la page Tarifs</legend>
          {form.features.map((feature, index) => (
            <div key={index} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                style={inputStyle} value={feature} maxLength={FEATURE_LENGTH} aria-label={`Argument n° ${index + 1}`} placeholder="Une ligne courte, par exemple : Support par email"
                onChange={(e) => setFeature(index, e.target.value)}
              />
              <Btn aria-label={`Monter l’argument n° ${index + 1}`} title="Monter" disabled={index === 0} onClick={() => moveFeature(index, -1)} style={iconBtn}>↑</Btn>
              <Btn aria-label={`Descendre l’argument n° ${index + 1}`} title="Descendre" disabled={index === form.features.length - 1} onClick={() => moveFeature(index, 1)} style={iconBtn}>↓</Btn>
              <Btn variant="danger" aria-label={`Retirer l’argument n° ${index + 1}`} title="Retirer" onClick={() => set("features", form.features.filter((_, i) => i !== index))} style={iconBtn}>×</Btn>
            </div>
          ))}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <Btn onClick={() => set("features", [...form.features, ""])} disabled={form.features.length >= MAX_FEATURES}>Ajouter une ligne</Btn>
            <span style={{ fontSize: 12.5, color: "var(--theme-text-secondary)" }}>{MAX_FEATURES} lignes au plus, {FEATURE_LENGTH} caractères chacune. Les lignes vides sont ignorées.</span>
          </div>
        </fieldset>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Check checked={form.highlight} onChange={(on) => set("highlight", on)} label="Formule recommandée" hint="Mise en avant sur la page Tarifs." />
          <Check checked={form.isActive} onChange={(on) => set("isActive", on)} label="Formule active" hint="Une formule désactivée n’est plus affichée ni proposée, même publiée, et aucun paiement ne peut être saisi pour elle." />
        </div>

        {error && <InlineError>{error}</InlineError>}
      </form>
    </Modal>
  );
}
