"use client";
// app/auth/verify-email/page.tsx — confirmation de l'adresse email, avec le lien reçu à l'inscription
// (/auth/verify-email?token=…&email=…, valable 48 heures).
import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell, { AuthMessage, failed, useAuthTexts, type AuthProblem } from "@/components/auth/AuthShell";
import { publicPost } from "@/lib/saas";
import { getToken } from "@/lib/session";

type State = { kind: "checking" } | { kind: "done"; already: boolean } | { kind: "failed"; problem: AuthProblem } | { kind: "invalid" };

function VerifyEmail() {
  const params = useSearchParams();
  const { tx, ui, explain } = useAuthTexts();
  const token = params.get("token") || "";
  const email = (params.get("email") || "").trim().toLowerCase();
  const [state, setState] = useState<State>({ kind: "checking" });
  const [signedIn, setSignedIn] = useState(false);
  // Le lien ne sert qu'une fois : la vérification n'est lancée qu'une seule fois, même si React monte la page deux fois.
  const started = useRef(false);

  useEffect(() => {
    setSignedIn(!!getToken());
    if (started.current) return;
    started.current = true;
    if (token.length < 20 || !email.includes("@")) { setState({ kind: "invalid" }); return; }
    void publicPost<{ success?: boolean; alreadyVerified?: boolean }>("/auth/verify-email", { email, token }).then((res) => {
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
