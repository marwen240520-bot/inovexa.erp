"use client";
// app/auth/forgot-password/page.tsx — demande d'un lien de réinitialisation du mot de passe.
// Le serveur répond de la même façon que le compte existe ou non : on n'apprend jamais ici si une adresse est inscrite.
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell, { AuthField, AuthMessage, IconMail, SubmitButton, failed, isEmail, useAuthTexts, type AuthProblem } from "@/components/auth/AuthShell";
import { publicPost } from "@/lib/saas";

function ForgotForm() {
  const params = useSearchParams();
  const { tx, ui, explain } = useAuthTexts();
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState<AuthProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fromLink = params.get("email");
    if (fromLink) setEmail(fromLink);
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const address = email.trim().toLowerCase();
    if (!isEmail(address)) { setProblem({ kind: "ui", key: "emailInvalid" }); return; }
    setLoading(true);
    setProblem(null);
    const res = await publicPost("/auth/forgot-password", { email: address }, { safe: true });
    if (res.ok) setDone(true);
    else setProblem(failed(res));
    setLoading(false);
  };

  return (
    <AuthShell title={tx.forgotTitle} subtitle={done ? undefined : tx.forgotSubtitle}>
      {done ? (
        <>
          <AuthMessage tone="success">{tx.forgotDone}</AuthMessage>
          <Link href="/auth/login" className="lg-btn-ghost">{tx.backToLogin}</Link>
        </>
      ) : (
        <>
          {problem ? <AuthMessage tone="error">{explain(problem)}</AuthMessage> : null}
          <form onSubmit={submit} noValidate>
            <AuthField
              id="fp-email"
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
            <SubmitButton label={tx.sendLink} loadingLabel={ui.sending} loading={loading} />
          </form>
          <div className="lg-links">
            <p><Link href="/auth/login" className="lg-link">{tx.backToLogin}</Link></p>
          </div>
        </>
      )}
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotForm />
    </Suspense>
  );
}
