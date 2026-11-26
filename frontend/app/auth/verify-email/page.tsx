"use client";
// app/auth/verify-email/page.tsx — vérification de l'adresse email.
//
// • Code à 6 chiffres (cas normal) : à l'inscription, le serveur envoie un code par email. La personne, déjà connectée,
//   le saisit ici ; le serveur le vérifie (5 essais par code, valable 15 minutes) et ouvre l'ERP. Elle peut demander un
//   nouveau code une fois par minute.
// • Ancien lien de confirmation (/auth/verify-email?token=…&email=…) : il reste accepté jusqu'à son expiration.
//
// Le navigateur ne décide de rien : c'est le serveur qui dit si l'adresse est vérifiée et quelle page ouvrir ensuite.
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell, { AuthField, AuthMessage, IconKey, SubmitButton, failed, useAuthTexts, type AuthProblem } from "@/components/auth/AuthShell";
import { codeResendDelay, markCodeSent } from "@/lib/authFlow";
import { useOnlineTexts } from "@/lib/onlineTexts";
import { API_URL, fetchWithRetry, publicPost } from "@/lib/saas";
import { fill } from "@/lib/saasTexts";
import { clearSession, getStoredUser, getToken, homeFor, type AccountState } from "@/lib/session";

// ───────────── Ancien lien ─────────────

type LinkState = { kind: "checking" } | { kind: "done"; already: boolean } | { kind: "failed"; problem: AuthProblem } | { kind: "invalid" };

function VerifyByLink({ token, email }: { token: string; email: string }) {
  const { tx, ui, explain } = useAuthTexts();
  const [state, setState] = useState<LinkState>({ kind: "checking" });
  const [signedIn, setSignedIn] = useState(false);
  // Le lien ne sert qu'une fois : la vérification n'est lancée qu'une seule fois, même si React monte la page deux fois.
  const started = useRef(false);

  useEffect(() => {
    setSignedIn(!!getToken());
    if (started.current) return;
    started.current = true;
    if (token.length < 20 || !email.includes("@")) { setState({ kind: "invalid" }); return; }
    void publicPost<{ success?: boolean; alreadyVerified?: boolean }>("/auth/verify-email", { email, token }, { safe: true }).then((res) => {
      if (res.ok) setState({ kind: "done", already: !!res.data?.alreadyVerified });
      else setState({ kind: "failed", problem: failed(res) });
    });
  }, [email, token]);

  const next = signedIn
    ? <Link href="/dashboard" className="lg-btn">{tx.goToErp}</Link>
    : <Link href={`/auth/login${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="lg-btn">{tx.signIn}</Link>;

  return (
    <AuthShell title={tx.verifyTitle}>
      {state.kind === "checking" ? (
        <p className="lg-status" role="status"><span className="lg-spinner" aria-hidden="true" />{tx.verifying}</p>
      ) : state.kind === "done" ? (
        <>
          <AuthMessage tone="success">{state.already ? ui.alreadyVerified : tx.verifyDone}</AuthMessage>
          {next}
        </>
      ) : (
        <>
          <AuthMessage tone="error">{state.kind === "invalid" ? tx.verifyFailed : explain(state.problem, { fallback: tx.verifyFailed })}</AuthMessage>
          <AuthMessage tone="info">{ui.verifyHelp}</AuthMessage>
          {next}
        </>
      )}
    </AuthShell>
  );
}

// ───────────── Code à 6 chiffres ─────────────

interface CodeReply {
  success?: boolean; alreadyVerified?: boolean; emailSent?: boolean; account?: AccountState | null;
  code?: "CODE_INVALID" | "CODE_EXPIRED" | "CODE_LOCKED" | "CODE_TOO_SOON"; remainingAttempts?: number; retryInSeconds?: number; resendInSeconds?: number; message?: string;
}

/**
 * Appel connecté qui renvoie le statut ET le corps (les refus portent un code : essais restants, délai…).
 * Une lecture est rejouée après une coupure réseau ; un envoi ne l'est pas (un essai de code compterait deux fois).
 */
async function authed(path: string, method: "GET" | "POST", body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetchWithRetry(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() || ""}` },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  }, method === "GET");
  if (!res) return { ok: false, status: 0, data: null };
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
}

type Feedback = { tone: "error" | "success" | "info"; text: string } | null;

function VerifyByCode() {
  const { tx, ui } = useAuthTexts();
  const o = useOnlineTexts();
  const v = o.verify;
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [wait, setWait] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  const leaveTo = (path: string) => {
    // Rechargement complet voulu : la page d'arrivée repart de l'état du compte renvoyé par le serveur.
    window.location.assign(path);
  };

  // État du compte au chargement : adresse déjà vérifiée → page d'arrivée ; pas de session → connexion.
  useEffect(() => {
    let alive = true;
    if (!getToken()) { setSignedIn(false); setReady(true); return; }
    setEmail(getStoredUser()?.email || "");
    setWait(codeResendDelay());
    void authed("/auth/me", "GET").then((res) => {
      if (!alive) return;
      if (res.status === 401) { clearSession(); setSignedIn(false); setReady(true); return; }
      if (res.ok && res.data) {
        if (res.data.email) setEmail(String(res.data.email));
        const account = res.data.account as AccountState | null;
        const verified = res.data.emailVerified === true || (account ? account.emailVerified : false);
        if (verified) { leaveTo(homeFor({ role: res.data.role }, account)); return; }
      }
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { if (ready && signedIn && !done) inputRef.current?.focus(); }, [ready, signedIn, done]);

  // Décompte avant de pouvoir redemander un code.
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const explainRefusal = useCallback((res: { status: number; data: CodeReply | null }): string => {
    const data = res.data;
    if (res.status === 0 || res.status >= 500) return tx.serverError;
    if (data?.code === "CODE_INVALID") return fill(v.invalid, { n: data.remainingAttempts ?? 0 });
    if (data?.code === "CODE_EXPIRED") return v.expired;
    if (data?.code === "CODE_LOCKED") return v.locked;
    if (data?.code === "CODE_TOO_SOON") return fill(v.tooSoon, { s: data.retryInSeconds ?? 60 });
    if (res.status === 429) return ui.tooMany;
    if (res.status === 400) return v.sixDigits;
    return ui.genericError;
  }, [tx, ui, v]);

  const verify = useCallback(async (value: string) => {
    if (submitting.current) return;
    if (!/^\d{6}$/.test(value)) { setFeedback({ tone: "error", text: v.sixDigits }); return; }
    submitting.current = true;
    setBusy("verify");
    setFeedback(null);
    const res = await authed("/auth/verify-email-code", "POST", { code: value });
    submitting.current = false;
    if (res.status === 401) { clearSession(); setSignedIn(false); setBusy(null); return; }
    if (res.ok && res.data?.success) {
      setDone(true);
      setFeedback({ tone: "success", text: v.done });
      const account = (res.data as CodeReply).account ?? null;
      window.setTimeout(() => leaveTo(homeFor(getStoredUser(), account)), 900);
      return;
    }
    setBusy(null);
    setCode("");
    setFeedback({ tone: "error", text: explainRefusal(res) });
    inputRef.current?.focus();
  }, [explainRefusal, v]);

  const onCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (feedback?.tone === "error") setFeedback(null);
    // Les six chiffres sont là (saisie ou collage) : inutile de faire cliquer.
    if (digits.length === 6) void verify(digits);
  };

  const resend = async () => {
    if (busy || wait > 0) return;
    setBusy("resend");
    setFeedback(null);
    const res = await authed("/auth/resend-verification", "POST");
    setBusy(null);
    if (res.status === 401) { clearSession(); setSignedIn(false); return; }
    const data = res.data as CodeReply | null;
    if (res.ok && data?.alreadyVerified) { leaveTo(homeFor(getStoredUser(), null)); return; }
    if (res.ok) {
      if (data?.emailSent) {
        markCodeSent();
        setWait(data.resendInSeconds ?? 60);
        setFeedback({ tone: "info", text: v.resent });
      } else {
        setFeedback({ tone: "error", text: v.mailDown });
      }
      setCode("");
      inputRef.current?.focus();
      return;
    }
    if (data?.code === "CODE_TOO_SOON") setWait(data.retryInSeconds ?? 60);
    setFeedback({ tone: "error", text: explainRefusal(res) });
  };

  const restart = () => {
    clearSession();
    leaveTo("/auth/register");
  };

  if (!ready) {
    return (
      <AuthShell title={v.title}>
        <p className="lg-status" role="status"><span className="lg-spinner" aria-hidden="true" />{ui.checking}</p>
      </AuthShell>
    );
  }
  if (!signedIn) {
    return (
      <AuthShell title={v.title}>
        <AuthMessage tone="info">{v.needLogin}</AuthMessage>
        <Link href="/auth/login" className="lg-btn">{tx.signIn}</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={v.title} subtitle={email ? <>{fill(v.subtitle, { email: "⁨" + email + "⁩" })}</> : v.subtitleNoMail}>
      {feedback ? <AuthMessage tone={feedback.tone}>{feedback.text}</AuthMessage> : null}
      <form onSubmit={(e) => { e.preventDefault(); void verify(code); }} noValidate>
        <AuthField
          id="lg-email-code"
          label={v.code}
          icon={<IconKey />}
          inputRef={inputRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="••••••"
          disabled={busy === "verify" || done}
          hint={fill(v.hint, { min: 15 })}
          ltr
          required
        />
        <SubmitButton label={v.submit} loadingLabel={v.checking} loading={busy === "verify" || done} disabled={code.length !== 6} />
      </form>

      <p className="lg-after-btn">
        <button type="button" className="lg-linkbtn" onClick={() => void resend()} disabled={busy !== null || wait > 0 || done} aria-busy={busy === "resend"}>
          {wait > 0 ? fill(v.resendIn, { s: wait }) : v.resend}
        </button>
      </p>

      <div className="lg-links">
        <p>
          {v.wrongEmail}{" "}
          <button type="button" className="lg-linkbtn" onClick={restart} disabled={busy !== null || done}>{v.restart}</button>
        </p>
      </div>
    </AuthShell>
  );
}

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = (params.get("email") || "").trim().toLowerCase();
  // Un jeton dans l'adresse = ancien lien de confirmation ; sinon, saisie du code reçu par email.
  return token ? <VerifyByLink token={token} email={email} /> : <VerifyByCode />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
