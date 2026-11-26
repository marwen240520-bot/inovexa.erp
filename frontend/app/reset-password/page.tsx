"use client";
// app/reset-password/page.tsx — choix d'un nouveau mot de passe, avec le lien reçu par email
// (/reset-password?token=…&email=…, valable une heure). Le jeton n'est jamais gardé dans le navigateur.
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { AuthMessage, PasswordField, SubmitButton, failed, passwordChecks, useAuthTexts, type AuthProblem } from "@/components/auth/AuthShell";
import { publicPost } from "@/lib/saas";
import { clearSession } from "@/lib/session";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { tx, ui, explain } = useAuthTexts();
  const token = params.get("token") || "";
  const email = (params.get("email") || "").trim().toLowerCase();
  const linkOk = token.length >= 20 && email.includes("@");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState<AuthProblem | null>(null);
  const [fieldError, setFieldError] = useState<"weak" | "mismatch" | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!passwordChecks(password).ok) { setFieldError("weak"); return; }
    if (password !== confirm) { setFieldError("mismatch"); return; }
    setFieldError(null);
    setLoading(true);
    setProblem(null);
    const res = await publicPost("/auth/reset-password", { email, token, newPassword: password });
    if (res.ok) {
      // Le serveur a fermé toutes les sessions de ce compte : celle de ce navigateur, s'il y en avait une, ne vaut plus rien.
      clearSession();
      router.push(`/auth/login?reset=1&email=${encodeURIComponent(email)}`);
      return;
    }
    setProblem(failed(res));
    setLoading(false);
  };

  if (!linkOk) {
    return (
      <AuthShell title={tx.resetTitle}>
        <AuthMessage tone="error">{tx.resetInvalid}</AuthMessage>
        <Link href="/auth/forgot-password" className="lg-btn-ghost">{tx.forgotTitle}</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={tx.resetTitle} subtitle={tx.resetSubtitle}>
      <p className="lg-account">{ui.accountLabel} <bdi>{email}</bdi></p>
      {problem ? (
        <AuthMessage tone="error" action={<Link href={`/auth/forgot-password?email=${encodeURIComponent(email)}`} className="lg-link">{tx.forgotTitle}</Link>}>
          {explain(problem)}
        </AuthMessage>
      ) : null}
      <form onSubmit={submit} noValidate>
        <PasswordField id="rp-password" label={tx.newPassword} value={password} onChange={(v) => { setPassword(v); setFieldError(null); }} autoComplete="new-password" error={fieldError === "weak" ? ui.passwordWeak : undefined} rules disabled={loading} />
        <PasswordField id="rp-confirm" label={tx.confirmPassword} value={confirm} onChange={(v) => { setConfirm(v); setFieldError(null); }} autoComplete="new-password" error={fieldError === "mismatch" ? tx.mismatch : undefined} disabled={loading} />
        <SubmitButton label={tx.save} loadingLabel={ui.saving} loading={loading} />
      </form>
      <div className="lg-links">
        <p><Link href="/auth/login" className="lg-link">{tx.backToLogin}</Link></p>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
