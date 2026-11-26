// components/account/AccountBar.tsx
// Bandeau d'état du compte, posé au-dessus des pages de l'ERP : essai en cours, abonnement bientôt échu, adresse email à confirmer.
//
// Le bandeau ne décide de rien : il affiche ce que répond GET /billing/subscription. Le temps restant part de la valeur
// calculée par le serveur (remainingSeconds) et avance avec performance.now() — jamais avec l'horloge du poste, qui peut être fausse.
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { api, ApiError } from "@/components/erp/kit";
import { invalidateApiCache } from "@/lib/apiCache";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateTime, type SubscriptionView } from "@/lib/saas";
import { fill, formatRemaining, useSaasTexts, type SaasTexts } from "@/lib/saasTexts";
import { getStoredUser, getToken, isPlatformAdmin, type AccountState } from "@/lib/session";

/** L'état du compte est relu toutes les 5 minutes, et à chaque retour sur l'onglet. */
const REFRESH_MS = 5 * 60_000;
/** Un abonnement actif est signalé quand il lui reste 7 jours ou moins. */
const RENEW_NOTICE_SECONDS = 7 * 86_400;
/** Délai avant de réinterroger le serveur une fois le décompte à zéro (lui laisse le temps de constater l'échéance). */
const ELAPSED_RETRY_MS = 1_500;

/** Message d'une erreur d'API : celui du serveur, ou un texte traduit quand le serveur est injoignable. */
export function apiErrorText(error: unknown, tx: SaasTexts): string {
  if (error instanceof ApiError && error.status === 0) return tx.auth.serverError;
  return error instanceof Error && error.message ? error.message : tx.auth.serverError;
}

// ───────────── Décompte ─────────────

/**
 * Échéance de la période en cours, placée sur l'horloge monotone de l'onglet (performance.now()).
 * Elle est commune au bandeau et à la page Abonnement, pour qu'ils affichent le même temps restant.
 */
let anchor: { key: string; at: number } | null = null;

type CountdownSource = Pick<AccountState, "status" | "endsAt" | "remainingSeconds" | "serverTime">;

/**
 * Secondes restantes avant la fin de l'essai ou de l'abonnement (arrondies à la minute), ou null s'il n'y a pas d'échéance.
 * `onElapsed` est appelé quand le décompte arrive à zéro : c'est le moment de réinterroger le serveur, qui seul ferme l'accès.
 */
export function useServerCountdown(account: CountdownSource | null | undefined, onElapsed?: () => void): number | null {
  // Une période terminée (EXPIRED, SUSPENDED, CANCELLED) n'a plus de décompte : sans cela le zéro relancerait un appel en boucle.
  const running = !!account && (account.status === "TRIAL" || account.status === "ACTIVE");
  const endsAt = running ? account.endsAt : null;
  const remaining = running ? account.remainingSeconds : null;
  const serverTime = running ? account.serverTime : null;
  const [left, setLeft] = useState<number | null>(null);
  const elapsed = useRef(onElapsed);
  useEffect(() => { elapsed.current = onElapsed; });

  useEffect(() => {
    if (endsAt === null || remaining === null) { setLeft(null); return; }
    // Une réponse relue depuis le cache (30 s) donnerait une échéance trop tardive : pour une même date de fin,
    // on garde toujours la plus proche des estimations.
    const estimate = performance.now() + remaining * 1000;
    anchor = anchor && anchor.key === endsAt ? { key: endsAt, at: Math.min(anchor.at, estimate) } : { key: endsAt, at: estimate };
    const deadline = anchor.at;
    let retry: number | undefined;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      // L'affichage est à la minute : l'état ne change (et ne redessine) qu'une fois par minute.
      setLeft(seconds >= 60 ? Math.floor(seconds / 60) * 60 : seconds > 0 ? 59 : 0);
      if (seconds === 0) {
        window.clearInterval(timer);
        retry = window.setTimeout(() => elapsed.current?.(), ELAPSED_RETRY_MS);
      }
    };
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(retry);
    };
    // serverTime change à chaque nouvelle réponse du serveur : le décompte est alors recalé.
  }, [endsAt, remaining, serverTime]);

  return running && endsAt !== null ? left ?? remaining : null;
}

// ───────────── Renvoi du lien de confirmation ─────────────

const linkButton: CSSProperties = {
  background: "transparent", border: "none", padding: 0, font: "inherit", fontWeight: 700, cursor: "pointer",
  color: "var(--theme-primary-text, var(--theme-primary))", textDecoration: "underline", textUnderlineOffset: 3,
};

/**
 * « Renvoyer le lien » de confirmation de l'adresse email, avec le résultat annoncé aux lecteurs d'écran.
 * `onVerified` est appelé si le serveur répond que l'adresse est déjà confirmée.
 */
export function ResendVerification({ onVerified, buttonStyle }: { onVerified?: () => void; buttonStyle?: CSSProperties }) {
  const tx = useSaasTexts();
  const [busy, setBusy] = useState(false);
  // Le résultat est gardé sous forme de code, pour suivre un changement de langue.
  const [result, setResult] = useState<{ kind: "sent" | "noMail" } | { kind: "error"; text: string } | null>(null);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api<{ success: boolean; emailSent?: boolean; alreadyVerified?: boolean }>("/auth/resend-verification", { method: "POST" });
      if (res?.alreadyVerified) onVerified?.();
      else setResult({ kind: res?.emailSent ? "sent" : "noMail" });
    } catch (e) {
      setResult({ kind: "error", text: apiErrorText(e, tx) });
    } finally {
      setBusy(false);
    }
  };

  const message = !result ? "" : result.kind === "sent" ? tx.bar.resent : result.kind === "noMail" ? tx.bar.resentNoMail : result.kind === "error" ? result.text : "";
  return (
    <>
      <button type="button" onClick={send} disabled={busy} aria-busy={busy} style={{ ...linkButton, opacity: busy ? 0.6 : 1, cursor: busy ? "wait" : "pointer", ...buttonStyle }}>
        {tx.bar.resend}
      </button>
      <span role="status" aria-live="polite" style={{ fontWeight: 600, color: result && result.kind !== "sent" ? "var(--theme-warning, #b45309)" : "var(--theme-success, #059669)" }}>
        {message}
      </span>
    </>
  );
}

// ───────────── Bandeau ─────────────

const svg = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, style: { flexShrink: 0 } };
const IconClock = () => <svg {...svg}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>;
const IconMail = () => <svg {...svg}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;

const rowStyle: CSSProperties = {
  display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 4, minHeight: 36,
  padding: "6px clamp(14px, 3vw, 28px)", fontSize: 13, lineHeight: 1.45, color: "var(--theme-text)",
  borderBottom: "1px solid rgba(var(--theme-primary-rgb, 79, 70, 229), 0.18)",
};
const actionStyle: CSSProperties = {
  marginInlineStart: "auto", display: "inline-flex", alignItems: "center", padding: "4px 14px", borderRadius: 999, whiteSpace: "nowrap",
  background: "var(--theme-primary, #4f46e5)", color: "#fff", fontSize: 12.5, fontWeight: 700, textDecoration: "none",
};

function BarRow({ icon, tone = "primary", children }: { icon: ReactNode; tone?: "primary" | "neutral"; children: ReactNode }) {
  const background = tone === "primary" ? "rgba(var(--theme-primary-rgb, 79, 70, 229), 0.09)" : "var(--theme-surface)";
  return (
    <div style={{ ...rowStyle, background }}>
      <span style={{ display: "inline-flex", color: "var(--theme-primary-text, var(--theme-primary))" }}>{icon}</span>
      {children}
    </div>
  );
}

export default function AccountBar() {
  const tx = useSaasTexts();
  const { language } = useLanguage();
  const pathname = usePathname();
  const [view, setView] = useState<SubscriptionView | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!getToken()) return;
    // Un administrateur de la plateforme ou un transporteur n'a pas d'abonnement : aucun appel.
    const user = getStoredUser();
    if (user && (isPlatformAdmin(user.role) || user.role === "transporteur")) return;
    try {
      const data = await api<SubscriptionView>("/billing/subscription");
      if (!alive.current || !data?.account) return;
      // Compte bloqué : rechargement complet vers la page Abonnement, pour ne rien garder de l'ERP en mémoire.
      if (data.account.blocked) { window.location.replace("/subscription"); return; }
      setView(data);
    } catch {
      // Le bandeau est un complément : en cas d'échec il garde son dernier état connu (ou rien), la page affiche ses propres erreurs.
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void load();
    const whenVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", whenVisible);
    const timer = window.setInterval(whenVisible, REFRESH_MS);
    return () => {
      alive.current = false;
      document.removeEventListener("visibilitychange", whenVisible);
      window.clearInterval(timer);
    };
  }, [load]);

  // Décompte à zéro : les lectures gardées en mémoire datent d'avant l'échéance, on repart du serveur (qui répondra « bloqué »).
  const onElapsed = useCallback(() => {
    invalidateApiCache(false);
    void load();
  }, [load]);

  const account = view?.account ?? null;
  const left = useServerCountdown(account, onElapsed);
  if (!view || !account) return null;

  // Sur la page Abonnement elle-même, le bouton qui y mène n'a pas de sens.
  const onBillingPage = !!pathname && pathname.startsWith("/dashboard/billing");
  const endDate = formatDateTime(account.endsAt, language);
  const rows: ReactNode[] = [];

  if (account.status === "TRIAL" && left !== null) {
    rows.push(
      <BarRow key="trial" icon={<IconClock />}>
        <strong style={{ fontWeight: 700 }}>{fill(tx.bar.trialLeft, { time: formatRemaining(left, tx) })}</strong>
        <span style={{ color: "var(--theme-text-secondary)" }}>{fill(tx.bar.trialEnds, { date: endDate })}</span>
        {!onBillingPage && <Link href="/dashboard/billing" style={actionStyle}>{tx.bar.subscribe}</Link>}
      </BarRow>,
    );
  } else if (account.status === "ACTIVE" && left !== null && left <= RENEW_NOTICE_SECONDS) {
    rows.push(
      <BarRow key="renew" icon={<IconClock />} tone="neutral">
        <span>{fill(tx.bar.renewSoon, { date: endDate })}</span>
        {!onBillingPage && <Link href="/dashboard/billing" style={actionStyle}>{tx.bar.renew}</Link>}
      </BarRow>,
    );
  }

  // Le lien de confirmation part à l'adresse de la personne connectée : il n'est proposé qu'au propriétaire du compte,
  // et seulement si le serveur envoie des emails (sinon le rappel resterait affiché sans que personne puisse y répondre).
  if (!account.emailVerified && view.canManage && view.emailEnabled !== false) {
    rows.push(
      <BarRow key="email" icon={<IconMail />} tone="neutral">
        <span>{tx.bar.verifyEmail}</span>
        <ResendVerification onVerified={load} />
      </BarRow>,
    );
  }

  if (rows.length === 0) return null;
  return (
    <div role="region" aria-label={tx.billing.state} style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {rows}
    </div>
  );
}
