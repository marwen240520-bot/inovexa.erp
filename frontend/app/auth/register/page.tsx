"use client";
// app/auth/register/page.tsx — création d'un compte en libre-service.
//
// La personne crée seule sa société : avec son email et un mot de passe, ou avec son compte Google ou Apple. Elle
// choisit son secteur d'activité : les modules utiles sont activés d'office. L'essai gratuit démarre tout de suite,
// pour la durée fixée par l'administrateur (72 h par défaut) ; ensuite l'accès est suspendu jusqu'au paiement.
// Rôle, modules et dates ne viennent jamais de ce formulaire : le serveur refuse tout champ qu'il n'attend pas.
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, {
  AuthField, AuthMessage, IconBriefcase, IconBuilding, IconChevronDown, IconFile, IconHash, IconHome, IconMail, IconPhone, IconPin, IconUser,
  PasswordField, SubmitButton, failed, isEmail, isValidPhone, isValidTaxId, passwordChecks, useAuthTexts, type AuthProblem, type AuthUi,
} from "@/components/auth/AuthShell";
import SocialSignIn, { PROVIDER_NAMES, type SocialCredential } from "@/components/auth/SocialSignIn";
import {
  clearPendingSocial, finishSignIn, markCodeSent, readPendingSocial, rememberPreferredPlan, resumeSession, socialBody, type PendingSocial, type SignInResponse,
} from "@/lib/authFlow";
import { MODULE_INFO, PLANS, SECTORS, pick, trialLabel, type CatalogModule } from "@/lib/catalog";
import { usePublicConfig } from "@/lib/publicConfig";
import { publicGet, publicPost, sectorName, type Sector } from "@/lib/saas";
import { fill } from "@/lib/saasTexts";
import { ModuleLabel } from "@/components/site/ModuleIcon";
import { countryOptions, currencyOptions, defaultCurrencyFor } from "@/lib/countries";

interface SectorOption { code: string; label: string; modules: string[] }

interface Form {
  name: string; companyName: string; email: string; phone: string; password: string; sector: string; acceptTerms: boolean;
  city: string; address: string; legalForm: string; taxId: string;
  /** Pays de la société (ISO). Tunisie par défaut ; la devise n'est demandée que pour les autres pays. */
  countryCode: string; currency: string;
}
type FieldKey = "name" | "companyName" | "email" | "phone" | "password" | "sector" | "acceptTerms" | "taxId" | "currency";
type FieldErrors = Partial<Record<FieldKey, keyof AuthUi>>;

const EMPTY: Form = { name: "", companyName: "", email: "", phone: "", password: "", sector: "", acceptTerms: false, city: "", address: "", legalForm: "", taxId: "", countryCode: "TN", currency: "" };
const LEGAL_FORMS = ["SARL", "SUARL", "SA", "SAS", "Personne physique", "Association", "Autre"];
/** Ordre des champs : le premier en erreur reçoit le curseur. */
const FIELD_ORDER: FieldKey[] = ["name", "companyName", "email", "phone", "password", "sector", "currency", "taxId", "acceptTerms"];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { language, tx, ui, explain } = useAuthTexts();
  const config = usePublicConfig();

  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState<AuthProblem | null>(null);
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState<PendingSocial | null>(null);
  const [apiSectors, setApiSectors] = useState<Sector[] | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Session déjà ouverte : inutile de créer un second compte.
  useEffect(() => {
    let alive = true;
    void resumeSession().then((path) => {
      if (!alive) return;
      if (path) router.replace(path);
      else setChecking(false);
    });
    return () => { alive = false; };
  }, [router]);

  // Identité Google ou Apple reçue sur la page de connexion, pour laquelle aucun compte n'existait encore.
  useEffect(() => {
    const stashed = readPendingSocial();
    if (stashed) {
      setPending(stashed);
      setForm((prev) => ({ ...prev, name: prev.name || stashed.name || "", email: prev.email || stashed.email || "" }));
    }
  }, []);

  // Formule choisie sur la page Tarifs : retenue pour la proposer à la fin de l'essai.
  const planCode = params.get("plan");
  const plan = useMemo(() => PLANS.find((p) => p.code === planCode) ?? null, [planCode]);
  useEffect(() => { if (plan) rememberPreferredPlan(plan.code); }, [plan]);

  // Secteurs proposés par le serveur (l'administrateur peut en ajouter) ; à défaut, ceux du catalogue du site.
  useEffect(() => {
    let alive = true;
    publicGet<Sector[]>("/public/sectors")
      .then((list) => { if (alive && Array.isArray(list) && list.length) setApiSectors(list); })
      .catch(() => { /* le catalogue du site reste proposé */ });
    return () => { alive = false; };
  }, []);

  const sectors: SectorOption[] = useMemo(
    () => apiSectors
      ? apiSectors.map((s) => {
        // Nom espagnol : le serveur ne garde que le français et l'anglais.
        const known = SECTORS.find((c) => c.code === s.code);
        return { code: s.code, label: language === "es" && known ? known.name.es : sectorName(s, language), modules: s.modules || [] };
      })
      : SECTORS.map((s) => ({ code: s.code, label: pick(s.name, language), modules: s.modules })),
    [apiSectors, language],
  );
  // Secteur choisi sur la page Produits (« ?sector=textile ») : proposé d'office s'il existe.
  const sectorParam = params.get("sector");
  useEffect(() => {
    if (!sectorParam || !sectors.some((s) => s.code === sectorParam)) return;
    setForm((prev) => (prev.sector ? prev : { ...prev, sector: sectorParam }));
  }, [sectorParam, sectors]);
  const chosen = sectors.find((s) => s.code === form.sector) || null;
  const chosenModules = chosen
    ? chosen.modules.filter((m) => m !== "dashboard" && m in MODULE_INFO).map((m) => ({ key: m, label: pick(MODULE_INFO[m as CatalogModule].label, language) }))
    : [];

  const trial = trialLabel(config?.trialHours ?? 72, language);
  const providerName = pending ? PROVIDER_NAMES[pending.provider] : "";

  // Pays et devise : une société tunisienne tient ses comptes en dinars (rien à choisir) ; ailleurs, la devise du pays est proposée.
  const abroad = form.countryCode !== "TN";
  const countries = useMemo(() => countryOptions(language), [language]);
  const currencies = useMemo(() => currencyOptions(language), [language]);
  const onCountry = (code: string) => {
    setForm((prev) => ({ ...prev, countryCode: code, currency: code === "TN" ? "" : defaultCurrencyFor(code) || "" }));
    setErrors((prev) => ({ ...prev, currency: undefined, phone: undefined, taxId: undefined }));
  };
  /** Hors Tunisie, le numéro s'écrit avec son indicatif : 8 chiffres ne se lisent plus comme un numéro tunisien. */
  const phoneOk = (value: string) => isValidPhone(value) && (!abroad || /^(\+|00)/.test(value.trim()));
  const phoneError: keyof AuthUi = abroad ? "phoneInvalidAbroad" : "phoneInvalid";

  const validate = (): FieldErrors => {
    const found: FieldErrors = {};
    if (form.companyName.trim().length < 2) found.companyName = "companyRequired";
    if (!form.sector) found.sector = "sectorRequired";
    if (!form.acceptTerms) found.acceptTerms = "termsRequired";
    if (pending) {
      // Avec Google ou Apple, le téléphone est facultatif ; s'il est saisi, il doit être valable.
      if (form.phone.trim() && !phoneOk(form.phone)) found.phone = phoneError;
      if (abroad && !form.currency) found.currency = "currencyRequired";
      return found;
    }
    if (form.name.trim().length < 2) found.name = "nameRequired";
    if (!isEmail(form.email.trim())) found.email = "emailInvalid";
    if (!phoneOk(form.phone)) found.phone = phoneError;
    if (!passwordChecks(form.password).ok) found.password = "passwordWeak";
    if (abroad && !form.currency) found.currency = "currencyRequired";
    if (!isValidTaxId(form.taxId, form.countryCode)) found.taxId = abroad ? "taxIdInvalidAbroad" : "taxIdInvalid";
    return found;
  };

  const showProblem = (value: AuthProblem) => {
    setProblem(value);
    // Le message est au-dessus du formulaire : on y ramène la vue.
    window.requestAnimationFrame(() => messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const found = validate();
    setErrors(found);
    setExisting(false);
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) {
      setProblem({ kind: "ui", key: "fixFields" });
      const target = first === "acceptTerms" ? "rg-terms" : first === "sector" ? "rg-sector" : `rg-${first}`;
      document.getElementById(target)?.focus();
      return;
    }
    setLoading(true);
    setProblem(null);

    if (pending) {
      const extra: Record<string, unknown> = { intent: "register", companyName: form.companyName.trim(), sector: form.sector, acceptTerms: true, language, countryCode: form.countryCode };
      if (abroad) extra.currency = form.currency;
      if (form.phone.trim()) extra.phone = form.phone.trim();
      if (pending.provider === "apple" && form.name.trim().length >= 2) extra.name = form.name.trim();
      const res = await publicPost(`/auth/${pending.provider}`, socialBody(pending.provider, pending.token, extra));
      if (res.ok && res.data?.access_token) {
        clearPendingSocial();
        router.push(finishSignIn(res.data as SignInResponse));
        return;
      }
      if (res.status === 401) {
        // Le jeton d'identité a expiré : la personne repasse par le bouton, ses saisies sont gardées.
        clearPendingSocial();
        setPending(null);
        showProblem({ kind: "ui", key: "socialExpired" });
      } else showProblem(failed(res));
      setLoading(false);
      return;
    }

    const body: Record<string, unknown> = {
      name: form.name.trim(), companyName: form.companyName.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(),
      password: form.password, sector: form.sector, acceptTerms: true, language, countryCode: form.countryCode,
    };
    if (abroad) body.currency = form.currency;
    for (const key of ["city", "address", "legalForm", "taxId"] as const) if (form[key].trim()) body[key] = form[key].trim();
    const res = await publicPost("/auth/register", body);
    if (res.ok && res.data?.access_token) {
      // Un code de vérification vient de partir par email : s'il est exigé, finishSignIn mène à l'écran de saisie.
      if ((res.data as SignInResponse).verification?.sent) markCodeSent();
      router.push(finishSignIn(res.data as SignInResponse));
      return;
    }
    if (res.status === 409) setExisting(true);
    showProblem(failed(res));
    setLoading(false);
  };

  /** Bouton Google ou Apple : connexion si le compte existe, sinon l'identité est gardée pour finir l'inscription. */
  const onSocial = async (credential: SocialCredential) => {
    if (loading) return;
    setLoading(true);
    setProblem(null);
    setExisting(false);
    const extra: Record<string, unknown> = { intent: "login" };
    if (credential.provider === "apple" && credential.name) extra.name = credential.name;
    const res = await publicPost(`/auth/${credential.provider}`, socialBody(credential.provider, credential.token, extra));
    if (res.ok && res.data?.access_token) {
      router.push(finishSignIn(res.data as SignInResponse));
      return;
    }
    if (res.status === 404 && res.data?.code === "ACCOUNT_NOT_FOUND") {
      const next: PendingSocial = { provider: credential.provider, token: credential.token, email: res.data.email ?? credential.email, name: res.data.name ?? credential.name, at: Date.now() };
      setPending(next);
      setErrors({});
      setForm((prev) => ({ ...prev, name: next.name || prev.name, email: next.email || prev.email }));
      window.requestAnimationFrame(() => document.getElementById("rg-companyName")?.focus());
    } else if (res.status === 401 && res.data?.requires2fa) {
      // Compte existant protégé par la double authentification : le code se saisit sur la page de connexion.
      showProblem({ kind: "ui", key: "googleTwoFactor" });
    } else showProblem(failed(res));
    setLoading(false);
  };

  const dropPending = () => {
    clearPendingSocial();
    setPending(null);
    setProblem(null);
  };

  const errorText = (key: FieldKey) => (errors[key] ? ui[errors[key] as keyof AuthUi] : undefined);
  const title = tx.registerTitle;
  const subtitle = fill(ui.trialFor, { duration: trial });

  if (checking) {
    return (
      <AuthShell title={title} subtitle={subtitle} wide>
        <p className="lg-status" role="status"><span className="lg-spinner" aria-hidden="true" />{ui.checking}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={title} subtitle={subtitle} wide>
      {plan ? <AuthMessage tone="info">{fill(ui.planChosen, { plan: plan.name })}</AuthMessage> : null}

      {problem ? (
        <AuthMessage
          tone="error"
          boxRef={messageRef}
          action={existing ? <Link href={`/auth/login?email=${encodeURIComponent(form.email.trim().toLowerCase())}`} className="lg-link">{tx.signIn}</Link> : undefined}
        >
          {problem.kind === "ui" && problem.key === "socialExpired" ? fill(ui.socialExpired, { provider: providerName || "Google / Apple" }) : explain(problem)}
        </AuthMessage>
      ) : null}

      {pending ? (
        <AuthMessage tone="success" action={<button type="button" className="lg-linkbtn" onClick={dropPending} disabled={loading}>{ui.otherMethod}</button>}>
          {pending.email ? fill(ui.socialReady, { provider: providerName, email: pending.email }) : fill(ui.socialReadyNoEmail, { provider: providerName })}
        </AuthMessage>
      ) : (
        <SocialSignIn mode="register" onCredential={onSocial} disabled={loading} dividerPosition="after" />
      )}

      <form onSubmit={submit} noValidate>
        <div className="lg-cols">
          {pending && pending.provider === "google" ? null : (
            <AuthField id="rg-name" label={tx.name} icon={<IconUser />} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" maxLength={120} error={errorText("name")} required={!pending} />
          )}
          <AuthField id="rg-companyName" label={tx.company} icon={<IconBuilding />} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} autoComplete="organization" maxLength={160} error={errorText("companyName")} required />
          {pending ? null : (
            <AuthField id="rg-email" label={tx.email} icon={<IconMail />} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" autoCapitalize="none" inputMode="email" spellCheck={false} maxLength={190} error={errorText("email")} required />
          )}
          <AuthField id="rg-phone" label={pending ? `${tx.phone} ${ui.optionalMark}` : tx.phone} icon={<IconPhone />} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" inputMode="tel" maxLength={30} hint={abroad ? tx.phoneHintAbroad : tx.phoneHint} error={errorText("phone")} required={!pending} />
        </div>

        <div className="lg-cols">
          <div className="lg-field" style={abroad ? undefined : { gridColumn: "1 / -1" }}>
            <label htmlFor="rg-country" className="lg-label">{tx.country}</label>
            <div className="lg-input-wrap">
              <span className="lg-input-icon"><IconPin /></span>
              <select id="rg-country" className="lg-input lg-select" value={form.countryCode} onChange={(e) => onCountry(e.target.value)} autoComplete="country" disabled={loading}>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <span className="lg-select-arrow"><IconChevronDown /></span>
            </div>
          </div>
          {abroad ? (
            <div className="lg-field">
              <label htmlFor="rg-currency" className="lg-label">{tx.currency}</label>
              <div className="lg-input-wrap">
                <span className="lg-input-icon"><IconHash /></span>
                <select
                  id="rg-currency"
                  className="lg-input lg-select"
                  value={form.currency}
                  data-empty={form.currency === ""}
                  onChange={(e) => set("currency", e.target.value)}
                  aria-invalid={errors.currency ? true : undefined}
                  aria-describedby="rg-currency-hint"
                  disabled={loading}
                  required
                >
                  <option value="" disabled>{tx.chooseCurrency}</option>
                  {currencies.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <span className="lg-select-arrow"><IconChevronDown /></span>
              </div>
              {errors.currency ? <p className="lg-field-error">{errorText("currency")}</p> : null}
              <p id="rg-currency-hint" className="lg-hint">{tx.currencyHint}</p>
            </div>
          ) : null}
        </div>

        {pending ? null : (
          <PasswordField id="rg-password" label={tx.password} value={form.password} onChange={(value) => set("password", value)} autoComplete="new-password" error={errorText("password")} rules disabled={loading} />
        )}

        <div className="lg-field">
          <label htmlFor="rg-sector" className="lg-label">{tx.sector}</label>
          <div className="lg-input-wrap">
            <span className="lg-input-icon"><IconBriefcase /></span>
            <select
              id="rg-sector"
              className="lg-input lg-select"
              value={form.sector}
              data-empty={form.sector === ""}
              onChange={(e) => set("sector", e.target.value)}
              aria-invalid={errors.sector ? true : undefined}
              aria-describedby="rg-sector-hint"
              required
            >
              <option value="" disabled>{tx.chooseSector}</option>
              {sectors.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
            <span className="lg-select-arrow"><IconChevronDown /></span>
          </div>
          {errors.sector ? <p className="lg-field-error">{errorText("sector")}</p> : null}
          <p id="rg-sector-hint" className="lg-hint">
            {chosenModules.length ? (
              <span style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 2 }}>
                {chosenModules.map((x) => <ModuleLabel key={x.key} moduleKey={x.key} label={x.label} size={14} gap={5} />)}
              </span>
            ) : tx.sectorHint}
          </p>
        </div>

        {pending ? null : (
          <details className="lg-more">
            <summary>
              <span>{tx.optional}</span>
              <IconChevronDown />
            </summary>
            <div className="lg-more-body">
              <div className="lg-cols">
                <AuthField id="rg-city" label={tx.city} icon={<IconPin />} value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" maxLength={80} />
                <div className="lg-field">
                  <label htmlFor="rg-legalForm" className="lg-label">{tx.legalForm}</label>
                  <div className="lg-input-wrap">
                    <span className="lg-input-icon"><IconFile /></span>
                    <select id="rg-legalForm" className="lg-input lg-select" value={form.legalForm} data-empty={form.legalForm === ""} onChange={(e) => set("legalForm", e.target.value)}>
                      <option value="">—</option>
                      {LEGAL_FORMS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <span className="lg-select-arrow"><IconChevronDown /></span>
                  </div>
                </div>
              </div>
              <AuthField id="rg-address" label={tx.address} icon={<IconHome />} value={form.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" maxLength={300} />
              <AuthField id="rg-taxId" label={abroad ? tx.taxIdAbroad : tx.taxId} icon={<IconHash />} value={form.taxId} onChange={(e) => set("taxId", e.target.value)} maxLength={40} placeholder={abroad ? "" : "1234567X/A/M/000"} error={errorText("taxId")} />
            </div>
          </details>
        )}

        <div className="lg-check">
          <input id="rg-terms" type="checkbox" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} aria-invalid={errors.acceptTerms ? true : undefined} />
          <div>
            <label htmlFor="rg-terms">
              {tx.terms} <Link href="/terms" target="_blank">{tx.termsLink}</Link> {tx.and} <Link href="/privacy" target="_blank">{tx.privacyLink}</Link>.
            </label>
            {errors.acceptTerms ? <p className="lg-field-error">{errorText("acceptTerms")}</p> : null}
          </div>
        </div>

        <SubmitButton
          label={pending ? fill(ui.continueWith, { provider: providerName }) : tx.start}
          loadingLabel={tx.starting}
          loading={loading}
        />
      </form>

      <div className="lg-links">
        <p>
          {tx.haveAccount}{" "}
          <Link href="/auth/login" className="lg-link">{tx.signIn}</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
