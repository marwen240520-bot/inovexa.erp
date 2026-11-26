"use client";
// app/auth/login/page.tsx — connexion.
//
// Trois façons d'entrer : email + mot de passe, « Continuer avec Google », « Continuer avec Apple » (ces deux boutons
// n'apparaissent que si le serveur est configuré pour eux). La double authentification, quand elle est activée sur le
// compte, demande le code à 6 chiffres avant d'ouvrir la session.
// Le navigateur ne décide de rien : c'est la réponse du serveur (rôle, état du compte) qui donne la page d'arrivée.
import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, {
  AuthField, AuthMessage, IconKey, IconMail, PasswordField, SubmitButton, failed, isEmail, useAuthTexts, type AuthProblem,
} from "@/components/auth/AuthShell";
import SocialSignIn, { type SocialCredential } from "@/components/auth/SocialSignIn";
import { finishSignIn, resumeSession, socialBody, stashPendingSocial, type SignInResponse } from "@/lib/authFlow";
import { publicPost } from "@/lib/saas";

const REMEMBER_KEY = "remember_email";
const REMEMBER_OFF_KEY = "remember_email_off";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { tx, ui, explain } = useAuthTexts();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);
  const [needsOtp, setNeedsOtp] = useState(false);
  // Identité Google ou Apple en attente du code de double authentification.
  const [social, setSocial] = useState<SocialCredential | null>(null);
  const [problem, setProblem] = useState<AuthProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const otpRef = useRef<HTMLInputElement>(null);
  const justReset = params.get("reset") === "1";

  // Session déjà ouverte : on emmène la personne à sa page d'arrivée (le serveur confirme que le jeton est encore bon).
  useEffect(() => {
    let alive = true;
    void resumeSession().then((path) => {
      if (!alive) return;
      if (path) router.replace(path);
      else setChecking(false);
    });
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    const fromLink = params.get("email");
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (fromLink) setEmail(fromLink);
      else if (saved) setEmail(saved);
      else if (localStorage.getItem(REMEMBER_OFF_KEY)) setRemember(false);
    } catch { /* stockage indisponible */ }
  }, [params]);

  useEffect(() => { if (needsOtp) otpRef.current?.focus(); }, [needsOtp]);

  const rememberEmail = (value: string) => {
    try {
      if (remember) { localStorage.setItem(REMEMBER_KEY, value); localStorage.removeItem(REMEMBER_OFF_KEY); }
      else { localStorage.removeItem(REMEMBER_KEY); localStorage.setItem(REMEMBER_OFF_KEY, "1"); }
    } catch { /* stockage indisponible */ }
  };

  /** Réponse commune aux trois façons de se connecter. Renvoie true si la session est ouverte. */
  const handle = (res: { ok: boolean; status: number; data: any; message: string }, hadOtp: boolean): boolean => {
    if (res.ok && res.data?.access_token) {
      router.push(finishSignIn(res.data as SignInResponse));
      return true;
    }
    if (res.status === 401 && res.data?.requires2fa) {
      setNeedsOtp(true);
      // Premier passage : on demande simplement le code. Code déjà saisi : il est faux.
      setProblem(hadOtp ? failed(res) : null);
      return false;
    }
    setProblem(failed(res));
    return false;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const code = otp.replace(/\s/g, "");
    if (needsOtp && !/^\d{6,8}$/.test(code)) { setProblem({ kind: "ui", key: "otpFormat" }); return; }

    // Identité Google ou Apple déjà vérifiée : il ne manquait que le code.
    if (social) {
      setLoading(true);
      setProblem(null);
      const res = await publicPost(`/auth/${social.provider}`, socialBody(social.provider, social.token, { intent: "login", otp: code }));
      if (!handle(res, true) && res.status === 401 && !res.data?.requires2fa) {
        // Le jeton d'identité a expiré pendant la saisie du code : il faut repasser par le bouton.
        setSocial(null);
        setNeedsOtp(false);
        setOtp("");
      }
      setLoading(false);
      return;
    }

    const address = email.trim().toLowerCase();
    if (!isEmail(address)) { setProblem({ kind: "ui", key: "emailInvalid" }); return; }
    if (!password) { setProblem({ kind: "failure", status: 400, message: "Email ou mot de passe incorrect" }); return; }
    setLoading(true);
    setProblem(null);
    const res = await publicPost("/auth/login", { email: address, password, ...(needsOtp ? { otp: code } : {}) });
    if (handle(res, needsOtp)) rememberEmail(address);
    setLoading(false);
  };

  const onSocial = async (credential: SocialCredential) => {
    if (loading) return;
    setLoading(true);
    setProblem(null);
    const extra: Record<string, unknown> = { intent: "login" };
    if (credential.provider === "apple" && credential.name) extra.name = credential.name;
    const res = await publicPost(`/auth/${credential.provider}`, socialBody(credential.provider, credential.token, extra));
    if (res.status === 404 && res.data?.code === "ACCOUNT_NOT_FOUND") {
      // Aucun compte pour cette identité : on la garde le temps de compléter l'inscription (société, secteur).
      stashPendingSocial({ provider: credential.provider, token: credential.token, email: res.data.email ?? credential.email, name: res.data.name ?? credential.name });
      router.push("/auth/register");
      return;
    }
    if (res.status === 401 && res.data?.requires2fa) setSocial(credential);
    handle(res, false);
    setLoading(false);
  };

  const leaveOtp = () => {
    setNeedsOtp(false);
    setSocial(null);
    setOtp("");
    setProblem(null);
  };

  if (checking) {
    return (
      <AuthShell title={ui.loginTitle} subtitle={ui.loginWelcome}>
        <p className="lg-status" role="status"><span className="lg-spinner" aria-hidden="true" />{ui.checking}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={ui.loginTitle} subtitle={ui.loginWelcome}>
      {justReset && !problem ? <AuthMessage tone="success">{tx.resetDone}</AuthMessage> : null}
      {problem ? <AuthMessage tone="error">{explain(problem)}</AuthMessage> : null}

      <form onSubmit={submit} noValidate>
        {needsOtp ? (
          <>
            <AuthMessage tone="info">{tx.otpHint}</AuthMessage>
            <AuthField
              id="lg-otp"
              label={tx.otp}
              icon={<IconKey />}
              inputRef={otpRef}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d\s]/g, "").slice(0, 9))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={9}
              ltr
              required
            />
            <SubmitButton label={tx.signIn} loadingLabel={ui.loggingIn} loading={loading} />
            <p className="lg-after-btn">
              <button type="button" className="lg-linkbtn" onClick={leaveOtp} disabled={loading}>{ui.otherMethod}</button>
            </p>
          </>
        ) : (
          <>
            <AuthField
              id="lg-email"
              label={tx.email}
              icon={<IconMail />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ui.emailPlaceholder}
              autoComplete="email"
              autoCapitalize="none"
              inputMode="email"
              spellCheck={false}
              maxLength={190}
              autoFocus
              ltr
              required
            />
            <PasswordField id="lg-password" label={tx.password} value={password} onChange={setPassword} autoComplete="current-password" disabled={loading} />

            <div className="lg-row">
              <label className="lg-remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                {ui.remember}
              </label>
              <Link href="/auth/forgot-password" className="lg-link">{tx.forgot}</Link>
            </div>

            <SubmitButton label={tx.signIn} loadingLabel={ui.loggingIn} loading={loading} />
          </>
        )}
      </form>

      {needsOtp ? null : <SocialSignIn mode="login" onCredential={onSocial} disabled={loading} />}

      <div className="lg-links">
        <p>
          {tx.noAccount}{" "}
          <Link href="/auth/register" className="lg-link">{tx.createAccount}</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  // useSearchParams impose une limite Suspense : pendant l'attente, rien n'est affiché (la page arrive aussitôt).
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
