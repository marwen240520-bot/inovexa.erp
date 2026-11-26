"use client";
/**
 * Fenêtres d'action sur un compte client : activer, prolonger l'essai, suspendre, réactiver, résilier,
 * corriger l'abonnement. Utilisées par la liste des comptes (actions rapides) et par la fiche d'un compte.
 * Chaque fenêtre affiche le message du serveur quand l'action est refusée ; rien n'est décidé dans le navigateur.
 */
import React, { ReactNode, useId, useState } from "react";
import Link from "next/link";
import { api, Btn, Field, inputStyle, Modal, Notice, Row } from "@/components/erp/kit";
import type { Plan, Sector } from "@/lib/saas";
import {
  ActionTarget, CYCLE_LABELS, STATUS_META, dateTimeFr, endOfDayTunisISO, hoursAsDays, linkStyle, tunisDay,
} from "@/components/admin/core/shared";

interface BaseProps {
  target: ActionTarget;
  onClose: () => void;
  /** Appelé après un succès, avec le message à afficher : le parent ferme la fenêtre et recharge ses données. */
  onDone: (message: string) => void;
}

/** Exécution d'une action : bouton désactivé pendant l'appel, message du serveur en cas de refus. */
function useAction(onDone: (message: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (call: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError(null);
    try {
      await call();
      onDone(success);
    } catch (e: any) {
      setError(e?.message || "L’action a échoué.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

function FormError({ message }: { message: string | null }) {
  return (
    <div aria-live="assertive">
      {message && (
        <div role="alert" style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--theme-danger, #ef4444)", color: "var(--theme-danger, #ef4444)", fontSize: 14 }}>
          {message}
        </div>
      )}
    </div>
  );
}

const helpStyle: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--theme-text-secondary)" };
// La feuille de style globale donne width: 100 % et un grand padding à tous les <input> : on rétablit la taille d'une case.
const checkStyle: React.CSSProperties = { width: 18, height: 18, padding: 0, margin: 0, flexShrink: 0, accentColor: "var(--theme-primary)", cursor: "pointer" };
const choiceStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--theme-text)", cursor: "pointer" };

function Footer({ formId, busy, onClose, label, variant = "primary" }: { formId: string; busy: boolean; onClose: () => void; label: string; variant?: "primary" | "danger" | "success" }) {
  return (
    <>
      <Btn onClick={onClose} disabled={busy}>Annuler</Btn>
      <Btn type="submit" form={formId} variant={variant} busy={busy}>{label}</Btn>
    </>
  );
}

/** Formulaire d'une fenêtre : la touche Entrée valide, comme le bouton du pied de fenêtre. */
function ActionForm({ id, onSubmit, children }: { id: string; onSubmit: () => void; children: ReactNode }) {
  return (
    <form id={id} onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
      {children}
    </form>
  );
}

/** Interrupteur accessible (rôle switch) aux couleurs du thème. */
export function Switch({ checked, onChange, labelledBy, disabled }: { checked: boolean; onChange: (next: boolean) => void; labelledBy: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative", width: 46, height: 26, flexShrink: 0, padding: 0, borderRadius: 999, cursor: disabled ? "not-allowed" : "pointer",
        border: "1px solid var(--theme-border)", background: checked ? "var(--theme-primary, #4f46e5)" : "var(--theme-border)", opacity: disabled ? 0.6 : 1,
        transition: "background .15s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute", top: 2, insetInlineStart: checked ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.35)", transition: "inset-inline-start .15s ease",
        }}
      />
    </button>
  );
}

// ───────────── Activer ─────────────

type ActivateMode = "months" | "until" | "none";

export function ActivateModal({ target, plans, onClose, onDone }: BaseProps & { plans: Plan[] }) {
  const formId = useId();
  const a = target.account;
  const { busy, error, setError, run } = useAction(onDone);
  const [mode, setMode] = useState<ActivateMode>("months");
  const [months, setMonths] = useState("1");
  const [until, setUntil] = useState("");
  const [plan, setPlan] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "annual">(a.billingCycle || "monthly");
  const running = a.status === "ACTIVE" && a.expiryEnforced && !!a.subscriptionEnd;

  const changeCycle = (next: "monthly" | "annual") => {
    setCycle(next);
    // Durée proposée selon le cycle, sans écraser une valeur saisie à la main.
    if (months === "1" || months === "12") setMonths(next === "annual" ? "12" : "1");
  };

  const submit = () => {
    const body: Record<string, unknown> = {};
    if (mode === "months") {
      const n = Number(months);
      if (!Number.isInteger(n) || n < 1 || n > 60) return setError("Indiquez une durée de 1 à 60 mois.");
      body.months = n;
    } else if (mode === "until") {
      if (!until) return setError("Indiquez la date de fin de l’abonnement.");
      body.until = endOfDayTunisISO(until);
    } else {
      body.noExpiry = true;
    }
    if (plan) {
      body.planCode = plan;
      body.billingCycle = cycle;
    }
    run(() => api(`/admin/accounts/${target.id}/activate`, { method: "POST", body }), running ? "Abonnement prolongé." : "Compte activé.");
  };

  const modes: Array<[ActivateMode, string, string]> = [
    ["months", "Pour une durée", running ? "La durée s’ajoute à l’échéance actuelle de l’abonnement." : "La période commence aujourd’hui."],
    ["until", "Jusqu’à une date", "L’accès reste ouvert jusqu’à la fin de ce jour (heure de Tunis)."],
    ["none", "Sans date de fin", "Le compte reste actif tant qu’il n’est ni suspendu ni résilié."],
  ];

  return (
    <Modal title={running ? `Prolonger l’abonnement — ${target.label}` : `Activer le compte — ${target.label}`} onClose={onClose}
      footer={<Footer formId={formId} busy={busy} onClose={onClose} label={running ? "Prolonger" : "Activer le compte"} variant="success" />}>
      <ActionForm id={formId} onSubmit={submit}>
        <p style={helpStyle}>
          État actuel : <strong style={{ color: "var(--theme-text)" }}>{STATUS_META[a.status]?.label || a.status}</strong>
          {running && <> — abonnement jusqu’au {dateTimeFr(a.subscriptionEnd)}</>}.
          L’activation ouvre l’accès à l’ERP pour la société et son équipe.
        </p>

        <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <legend style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-text-secondary)", marginBottom: 8, padding: 0 }}>Durée de l’abonnement</legend>
          {modes.map(([key, label, help]) => (
            <label key={key} style={choiceStyle}>
              <input type="radio" name={`${formId}-mode`} checked={mode === key} onChange={() => setMode(key)} style={{ ...checkStyle, marginTop: 2 }} />
              <span><span style={{ fontWeight: 600 }}>{label}</span><br /><span style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>{help}</span></span>
            </label>
          ))}
        </fieldset>

        {mode === "months" && (
          <Field label="Nombre de mois (1 à 60)">
            <input type="number" min={1} max={60} step={1} inputMode="numeric" style={{ ...inputStyle, maxWidth: 160 }} value={months} onChange={(e) => setMonths(e.target.value)} />
          </Field>
        )}
        {mode === "until" && (
          <Field label="Date de fin">
            <input type="date" style={{ ...inputStyle, maxWidth: 220 }} value={until} min={tunisDay(a.serverTime)} onChange={(e) => setUntil(e.target.value)} />
          </Field>
        )}

        <Row>
          <Field label="Formule (facultatif)" grow>
            <select style={inputStyle} value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="">Ne pas modifier la formule</option>
              {plans.map((p) => <option key={p.code} value={p.code}>{p.name}{p.isActive ? "" : " (inactive)"}</option>)}
            </select>
          </Field>
          <Field label="Cycle de facturation" grow>
            <select style={inputStyle} value={cycle} disabled={!plan} onChange={(e) => changeCycle(e.target.value as "monthly" | "annual")}>
              <option value="monthly">{CYCLE_LABELS.monthly}</option>
              <option value="annual">{CYCLE_LABELS.annual}</option>
            </select>
          </Field>
        </Row>
        {plan && (
          <p style={helpStyle}>
            La limite d’utilisateurs de la formule est appliquée au compte.
            {plan !== a.planCode && " Le changement de formule recalcule aussi ses modules (ceux de son secteur, limités à ceux de la formule) : vous pourrez les ajuster ensuite."}
          </p>
        )}

        <Notice tone="blue">
          Cette action n’enregistre aucun paiement et n’apparaît donc pas dans les revenus. Pour un règlement reçu, utilisez plutôt{" "}
          <Link href={`/admin/payments?userId=${target.id}`} style={linkStyle}>Saisir un paiement</Link> : sa validation active le compte.
        </Notice>
        <FormError message={error} />
      </ActionForm>
    </Modal>
  );
}

// ───────────── Prolonger ou rouvrir l'essai ─────────────

const TRIAL_PRESETS: Array<[number, string]> = [[24, "24 h"], [72, "3 jours"], [168, "7 jours"], [336, "14 jours"]];

export function ExtendTrialModal({ target, onClose, onDone }: BaseProps) {
  const formId = useId();
  const a = target.account;
  const { busy, error, setError, run } = useAction(onDone);
  const [hours, setHours] = useState("72");
  const n = Number(hours);
  const valid = Number.isInteger(n) && n >= 1 && n <= 2160;
  const running = a.status === "TRIAL" && !!a.trialEndsAt;
  // Essai en cours : le serveur ajoute la durée à la fin actuelle. La nouvelle fin se déduit donc de sa propre date.
  const newEnd = running && valid ? new Date(new Date(a.trialEndsAt as string).getTime() + n * 3_600_000) : null;

  const submit = () => {
    if (!valid) return setError("Indiquez une durée de 1 à 2 160 heures (90 jours).");
    run(() => api(`/admin/accounts/${target.id}/extend-trial`, { method: "POST", body: { hours: n } }), running ? "Essai prolongé." : "Essai rouvert.");
  };

  return (
    <Modal title={`${running ? "Prolonger l’essai" : "Rouvrir l’essai"} — ${target.label}`} onClose={onClose}
      footer={<Footer formId={formId} busy={busy} onClose={onClose} label={running ? "Prolonger l’essai" : "Rouvrir l’essai"} />}>
      <ActionForm id={formId} onSubmit={submit}>
        <p style={helpStyle}>
          {running
            ? <>L’essai se termine le {dateTimeFr(a.trialEndsAt)}. La durée choisie s’ajoute à cette date.</>
            : <>Le compte repasse à l’état « {STATUS_META.TRIAL.label} » et un nouvel essai démarre maintenant, pour la durée choisie.</>}
        </p>
        <Field label="Durée en heures (1 à 2 160)">
          <input type="number" min={1} max={2160} step={1} inputMode="numeric" style={{ ...inputStyle, maxWidth: 160 }} value={hours} onChange={(e) => setHours(e.target.value)} aria-describedby={`${formId}-days`} />
        </Field>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TRIAL_PRESETS.map(([h, label]) => (
            <Btn key={h} aria-pressed={n === h} onClick={() => setHours(String(h))} style={n === h ? { borderColor: "var(--theme-primary)", color: "var(--theme-primary-text, var(--theme-primary))" } : undefined}>{label}</Btn>
          ))}
        </div>
        <p id={`${formId}-days`} style={{ ...helpStyle, color: "var(--theme-text)" }} aria-live="polite">
          {valid ? <>Soit <strong>{hoursAsDays(n)}</strong>{newEnd && <> — nouvelle fin de l’essai : <strong>{dateTimeFr(newEnd)}</strong></>}.</> : "Durée non valide."}
        </p>
        <FormError message={error} />
      </ActionForm>
    </Modal>
  );
}

// ───────────── Suspendre / résilier / réactiver ─────────────

export function SuspendModal({ target, onClose, onDone }: BaseProps) {
  const formId = useId();
  const { busy, error, run } = useAction(onDone);
  const [reason, setReason] = useState("");
  const submit = () => run(() => api(`/admin/accounts/${target.id}/suspend`, { method: "POST", body: { reason: reason.trim() || undefined } }), "Compte suspendu.");
  return (
    <Modal title={`Suspendre le compte — ${target.label}`} onClose={onClose}
      footer={<Footer formId={formId} busy={busy} onClose={onClose} label="Suspendre le compte" variant="danger" />}>
      <ActionForm id={formId} onSubmit={submit}>
        <p style={helpStyle}>
          L’accès à l’ERP est fermé pour la société et toute son équipe, jusqu’à ce que vous réactiviez le compte. Ses données sont conservées.
          Le client est prévenu par email lorsque l’envoi d’emails est configuré ; le motif y figure s’il est renseigné.
        </p>
        <Field label="Motif (facultatif, 200 caractères au plus)">
          <textarea style={{ ...inputStyle, minHeight: 76, resize: "vertical" }} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <FormError message={error} />
      </ActionForm>
    </Modal>
  );
}

export function CancelModal({ target, onClose, onDone }: BaseProps) {
  const formId = useId();
  const { busy, error, run } = useAction(onDone);
  const [reason, setReason] = useState("");
  const submit = () => run(() => api(`/admin/accounts/${target.id}/cancel`, { method: "POST", body: { reason: reason.trim() || undefined } }), "Abonnement résilié.");
  return (
    <Modal title={`Résilier l’abonnement — ${target.label}`} onClose={onClose}
      footer={<Footer formId={formId} busy={busy} onClose={onClose} label="Résilier l’abonnement" variant="danger" />}>
      <ActionForm id={formId} onSubmit={submit}>
        <p style={helpStyle}>
          Le compte passe à l’état « {STATUS_META.CANCELLED.label} » : l’accès à l’ERP est fermé pour la société et son équipe. Les données sont conservées
          et vous pourrez réactiver le compte plus tard. Le motif est consigné dans le journal d’activité.
        </p>
        <Field label="Motif (facultatif, 200 caractères au plus)">
          <textarea style={{ ...inputStyle, minHeight: 76, resize: "vertical" }} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <FormError message={error} />
      </ActionForm>
    </Modal>
  );
}

export function ReactivateModal({ target, onClose, onDone }: BaseProps) {
  const formId = useId();
  const { busy, error, run } = useAction(onDone);
  const submit = () => run(() => api(`/admin/accounts/${target.id}/reactivate`, { method: "POST" }), "Compte réactivé.");
  return (
    <Modal title={`Réactiver le compte — ${target.label}`} onClose={onClose}
      footer={<Footer formId={formId} busy={busy} onClose={onClose} label="Réactiver le compte" variant="success" />}>
      <ActionForm id={formId} onSubmit={submit}>
        <p style={helpStyle}>
          La suspension ou la résiliation est levée et le compte retrouve l’état que ses dates justifient : actif si son abonnement court encore,
          en essai si l’essai n’est pas terminé, sinon expiré. Pour ouvrir une nouvelle période, utilisez « Activer ».
        </p>
        <FormError message={error} />
      </ActionForm>
    </Modal>
  );
}

// ───────────── Corriger l'abonnement ─────────────

export function SubscriptionModal({ target, plans, sectors, onClose, onDone }: BaseProps & { plans: Plan[]; sectors: Sector[] }) {
  const formId = useId();
  const a = target.account;
  const { busy, error, setError, run } = useAction(onDone);
  const initial = {
    plan: a.planCode || "",
    cycle: a.billingCycle || "",
    end: tunisDay(a.subscriptionEnd),
    limit: a.userLimit === null || a.userLimit === undefined ? "" : String(a.userLimit),
    sector: a.sector || "",
    enforced: a.expiryEnforced,
  };
  const [plan, setPlan] = useState(initial.plan);
  const [cycle, setCycle] = useState(initial.cycle);
  const [end, setEnd] = useState(initial.end);
  const [limit, setLimit] = useState(initial.limit);
  const [sector, setSector] = useState(initial.sector);
  const [applyModules, setApplyModules] = useState(false);
  const [enforced, setEnforced] = useState(initial.enforced);

  const planChanged = plan !== initial.plan;
  const endChanged = end !== initial.end;
  const limitChanged = limit.trim() !== initial.limit;
  const sectorChanged = sector !== initial.sector;

  const changePlan = (code: string) => {
    setPlan(code);
    const chosen = plans.find((p) => p.code === code);
    // Le serveur applique la limite de la nouvelle formule : on l'affiche tout de suite, elle reste modifiable.
    if (chosen && code !== initial.plan) setLimit(chosen.maxUsers === null ? "" : String(chosen.maxUsers));
    if (code === initial.plan) setLimit(initial.limit);
    if (code && !cycle) setCycle("monthly");
  };

  // Seuls les champs modifiés sont envoyés : chaque champ transmis a un effet côté serveur (rappels, limites, modules).
  const buildBody = (): Record<string, unknown> | string => {
    const body: Record<string, unknown> = {};
    if (sectorChanged || applyModules) {
      body.sector = sector || null;
      if (applyModules) body.applySectorModules = true;
    }
    if (planChanged) {
      body.planCode = plan || null;
      if (plan) body.billingCycle = cycle || "monthly";
    } else if (plan && cycle && cycle !== initial.cycle) {
      body.billingCycle = cycle;
    }
    if (limitChanged || (planChanged && plan)) {
      const raw = limit.trim();
      if (raw === "") body.userLimit = null;
      else {
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 1 || n > 10000) return "La limite d’utilisateurs doit être un nombre entier de 1 à 10 000 (vide = sans limite).";
        body.userLimit = n;
      }
    }
    if (endChanged) body.subscriptionEnd = end ? endOfDayTunisISO(end) : null;
    // Avec une date de fin, le serveur rend l'échéance contraignante d'office : on envoie le choix affiché pour qu'il soit respecté.
    if (enforced !== initial.enforced || (endChanged && end)) body.expiryEnforced = enforced;
    return body;
  };

  const preview = buildBody();
  const nothingToSave = typeof preview !== "string" && Object.keys(preview).length === 0;
  const endInPast = !!end && endChanged && new Date(endOfDayTunisISO(end)).getTime() <= new Date(a.serverTime).getTime();
  const labelId = `${formId}-enforced`;

  const submit = () => {
    const body = buildBody();
    if (typeof body === "string") return setError(body);
    if (Object.keys(body).length === 0) return setError("Aucune modification à enregistrer.");
    run(() => api(`/admin/accounts/${target.id}/subscription`, { method: "PATCH", body }), "Abonnement mis à jour.");
  };

  return (
    <Modal title={`Modifier l’abonnement — ${target.label}`} onClose={onClose} width={620}
      footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn type="submit" form={formId} variant="primary" busy={busy} disabled={nothingToSave}>Enregistrer</Btn></>}>
      <ActionForm id={formId} onSubmit={submit}>
        <p style={helpStyle}>
          Correction manuelle de la formule, de l’échéance, de la limite d’utilisateurs et du secteur. L’état du compte n’est pas modifié ici :
          utilisez Activer, Suspendre ou Résilier pour le changer.
        </p>

        <Row>
          <Field label="Formule" grow>
            <select style={inputStyle} value={plan} onChange={(e) => changePlan(e.target.value)}>
              <option value="">Aucune formule</option>
              {/* Formule du compte absente de la liste (supprimée depuis) : on la garde sélectionnable pour ne pas la changer par mégarde. */}
              {initial.plan && !plans.some((p) => p.code === initial.plan) && <option value={initial.plan}>{initial.plan}</option>}
              {plans.map((p) => <option key={p.code} value={p.code}>{p.name}{p.isActive ? "" : " (inactive)"}</option>)}
            </select>
          </Field>
          <Field label="Cycle de facturation" grow>
            <select style={inputStyle} value={plan ? cycle : ""} disabled={!plan} onChange={(e) => setCycle(e.target.value)}>
              {(!plan || !cycle) && <option value="">—</option>}
              <option value="monthly">{CYCLE_LABELS.monthly}</option>
              <option value="annual">{CYCLE_LABELS.annual}</option>
            </select>
          </Field>
        </Row>
        {planChanged && plan && (
          <p style={helpStyle}>
            Changer de formule recalcule les modules du compte (ceux de son secteur, limités à ceux de la formule) et propose la limite d’utilisateurs
            de la formule ci-dessous.
          </p>
        )}

        <Row>
          <Field label="Date de fin de l’abonnement" grow>
            <input type="date" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Field label="Limite d’utilisateurs (vide = sans limite)" grow>
            <input type="number" min={1} max={10000} step={1} inputMode="numeric" style={inputStyle} value={limit} onChange={(e) => setLimit(e.target.value)} />
          </Field>
        </Row>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Btn onClick={() => setEnd("")} disabled={!end}>Retirer la date de fin</Btn>
          <span style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>
            {end ? "L’accès court jusqu’à la fin de ce jour (heure de Tunis)." : "Sans date de fin, l’abonnement n’expire pas."}
          </span>
        </div>
        {endInPast && <Notice>Cette date est passée : si l’échéance est appliquée, le compte sera considéré comme expiré.</Notice>}

        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, borderRadius: 10, border: "1px solid var(--theme-border)", background: "var(--theme-surface-hover)" }}>
          <Switch checked={enforced} onChange={setEnforced} labelledBy={labelId} />
          <div style={{ minWidth: 0 }}>
            <div id={labelId} style={{ fontSize: 14, fontWeight: 700, color: "var(--theme-text)" }}>
              Échéance appliquée : {enforced ? "oui" : "non"}
            </div>
            <p style={{ ...helpStyle, marginTop: 4 }}>
              Activé : la date de fin est contraignante. Passé cette date, le compte devient « {STATUS_META.EXPIRED.label} » et l’accès à l’ERP est fermé
              jusqu’au renouvellement.
            </p>
            <p style={{ ...helpStyle, marginTop: 4 }}>
              Désactivé : la date de fin est conservée pour information seulement et ne ferme jamais l’accès. C’est le réglage des comptes qui existaient
              avant la mise en place des abonnements, afin que personne n’ait été coupé lors du déploiement. Activez-le pour rendre leur date contraignante.
            </p>
          </div>
        </div>

        <Field label="Secteur d’activité">
          <select style={inputStyle} value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">Aucun secteur</option>
            {initial.sector && !sectors.some((s) => s.code === initial.sector) && <option value={initial.sector}>{initial.sector}</option>}
            {sectors.map((s) => <option key={s.code} value={s.code}>{s.name}{s.isActive ? "" : " (inactif)"}</option>)}
          </select>
        </Field>
        <label style={choiceStyle}>
          <input type="checkbox" checked={applyModules} onChange={(e) => setApplyModules(e.target.checked)} style={{ ...checkStyle, marginTop: 2 }} />
          <span>
            <span style={{ fontWeight: 600 }}>Appliquer les modules du secteur</span><br />
            <span style={{ fontSize: 13, color: "var(--theme-text-secondary)" }}>
              Remplace les modules actuels du compte par ceux {sector ? "du secteur choisi" : "par défaut (tous les modules, faute de secteur)"}.
            </span>
          </span>
        </label>

        <FormError message={error} />
      </ActionForm>
    </Modal>
  );
}

// ───────────── Confirmation simple ─────────────

export function ConfirmModal({ title, children, confirmLabel, busy, error, onConfirm, onClose, danger }: {
  title: string; children: ReactNode; confirmLabel: string; busy: boolean; error?: string | null; onConfirm: () => void; onClose: () => void; danger?: boolean;
}) {
  return (
    <Modal title={title} onClose={onClose}
      footer={<><Btn onClick={onClose} disabled={busy}>Annuler</Btn><Btn variant={danger ? "danger" : "primary"} busy={busy} onClick={onConfirm}>{confirmLabel}</Btn></>}>
      <div style={{ ...helpStyle, fontSize: 14 }}>{children}</div>
      <FormError message={error ?? null} />
    </Modal>
  );
}
