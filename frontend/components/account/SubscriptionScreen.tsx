"use client";
// components/account/SubscriptionScreen.tsx
// Écran « Abonnement » : état du compte, choix de la formule, paiement en ligne par carte, secteur et modules,
// historique, reçus, résiliation. Tout se fait en ligne, par le client lui-même.
//
// Il sert deux pages :
//   • /subscription       — hors de l'ERP, quand l'accès est fermé (essai terminé, abonnement échu, suspension), et au
//                           retour de la page de paiement ;
//   • /dashboard/billing  — dans l'ERP, pendant l'essai ou l'abonnement (payer en cours d'essai, renouveler, modules).
//
// Paiement en ligne : le client clique « Payer », le serveur ouvre le paiement chez Flouci (carte bancaire ou application
// Flouci) et renvoie l'adresse de sa page sécurisée. Au retour, le serveur relit l'état du paiement CHEZ FLOUCI et ouvre
// l'accès tout seul : personne ne valide rien à la main, et le navigateur ne décide de rien (prix, TVA, conversion en
// dinars et état viennent du serveur ; le montant en dinars affiché ici n'est qu'un aperçu du même calcul).
// Si l'administrateur a activé les paiements hors ligne (virement, chèque…), ils sont proposés à part, en second choix.
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, Modal } from "@/components/erp/kit";
import { VerifyEmailLink, useServerCountdown } from "@/components/account/AccountBar";
import ModulesCard from "@/components/account/ModulesCard";
import { ReceiptPrintRoot, ReceiptSheet, type ReceiptLabels } from "@/components/admin/config/ReceiptSheet";
import LanguageMenu from "@/components/ui/LanguageMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { invalidateApiCache } from "@/lib/apiCache";
import { readPreferredPlan } from "@/lib/authFlow";
import { SECTORS, pick } from "@/lib/catalog";
import { useOnlineTexts } from "@/lib/onlineTexts";
import { annualSavingPct, offerFromApi, twoMonthsFree, type DisplayPlan } from "@/lib/publicOffer";
import {
  formatDateTime, formatMoney, formatPhone, formatPrice, formatTime, withVat,
  type CheckoutResult, type CheckoutSession, type PlansResponse, type Receipt, type SubscriptionPayment, type SubscriptionView,
} from "@/lib/saas";
import { fill, formatRemaining, useSaasTexts } from "@/lib/saasTexts";
import { clearSession, getStoredUser, getToken, homeFor, isPlatformAdmin } from "@/lib/session";

/** Moyens hors ligne pour lesquels une référence permet de retrouver le paiement. */
const NEEDS_REFERENCE = new Set(["bank_transfer", "d17", "flouci", "edinar", "postal", "cheque", "card"]);
/** Tant que l'accès est fermé ou qu'un paiement est en cours, l'état est relu régulièrement : l'ouverture apparaît seule. */
const POLL_MS = 45_000;
/** Au retour de la page de paiement, la confirmation du prestataire peut arriver quelques secondes après le client. */
const CONFIRM_EVERY_MS = 4_000;
const CONFIRM_TRIES = 12;

type Cycle = "monthly" | "annual";
type Busy = "pay" | "declare" | "cancelDeclaration" | "cancel" | "refresh" | `receipt-${number}` | null;
type Flash = { tone: "ok" | "err"; text: string } | null;
/** Où en est le paiement dont le client revient : en cours de vérification, confirmé, pas (encore) confirmé. */
type Returned = { state: "checking" } | { state: "paid"; result: CheckoutResult } | { state: "pending" } | { state: "failed" } | null;

const normalize = (s: string) => s.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();

/** Ligne d'une formule qui ne fait que redire le nombre d'utilisateurs : il est déjà affiché à partir de la limite réelle. */
const isUsersLine = (text: string) =>
  text.length <= 44 && /utilisateur|\busers?\b|usuario/i.test(text) && (/\d/.test(text) || /illimit|unlimited|ilimitad|sin límite/i.test(text));

// ───────────── Icônes ─────────────

const ico = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const METHOD_ICONS: Record<string, React.ReactNode> = {
  bank_transfer: <svg {...ico}><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></svg>,
  d17: <svg {...ico}><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M11 18.5h2" /></svg>,
  flouci: <svg {...ico}><path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h11v4" /><path d="M3 4v14a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4" /><path d="M17 12h4v4h-4a2 2 0 0 1 0-4z" /></svg>,
  edinar: <svg {...ico}><rect x="2.5" y="5" width="19" height="14" rx="2.2" /><path d="M2.5 10h19M6.5 15h4" /></svg>,
  card: <svg {...ico}><rect x="2.5" y="5" width="19" height="14" rx="2.2" /><path d="M2.5 10h19M6.5 15h4" /></svg>,
  postal: <svg {...ico}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>,
  cheque: <svg {...ico}><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 14h5M6 10.5h8M15.5 14.5l1.5-2 1.5 2" /></svg>,
  cash: <svg {...ico}><rect x="2.5" y="6.5" width="19" height="11" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v.01M18 14.5v.01" /></svg>,
  other: <svg {...ico}><circle cx="12" cy="12" r="9" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>,
};
const IconCheck = () => <svg {...ico} width={15} height={15} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const IconClock = () => <svg {...ico}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>;
const IconAlert = () => <svg {...ico} width={20} height={20}><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.5v.01" /></svg>;
const IconLock = () => <svg {...ico} width={20} height={20}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
const IconRefresh = () => <svg {...ico} width={15} height={15}><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>;
const IconExternal = () => <svg {...ico} width={15} height={15}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></svg>;
const IconCard = () => <svg {...ico} width={22} height={22}><rect x="2.5" y="5" width="19" height="14" rx="2.4" /><path d="M2.5 10h19M6.5 15h4" /></svg>;
const IconShield = () => <svg {...ico} width={16} height={16}><path d="M12 3l8 3v6c0 4.6-3.2 8-8 9-4.800-1-8-4.400-8-9V6z" /><path d="M9 12l2.200 2.200L15.500 10" /></svg>;

const STATUS_TONE: Record<string, string> = { TRIAL: "violet", ACTIVE: "green", EXPIRED: "amber", SUSPENDED: "red", CANCELLED: "gray" };
const PAY_TONE: Record<string, string> = { pending: "amber", validated: "green", rejected: "red", cancelled: "gray", refunded: "violet" };

// ───────────── Écran ─────────────

export default function SubscriptionScreen({ standalone = false }: { standalone?: boolean }) {
  const tx = useSaasTexts();
  const o = useOnlineTexts();
  const b = tx.billing;
  const { language } = useLanguage();

  const [view, setView] = useState<SubscriptionView | null>(null);
  const [plansRes, setPlansRes] = useState<PlansResponse | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [returned, setReturned] = useState<Returned>(null);

  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [referenceError, setReferenceError] = useState(false);

  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const alive = useRef(true);
  const wasBlocked = useRef<boolean | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const payRef = useRef<HTMLElement>(null);

  const notify = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    setFlash({ tone, text });
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), tone === "err" ? 9000 : 5000);
  }, []);

  /** Message d'une erreur d'API dans la langue de l'écran (les messages du serveur sont en français). */
  const errorText = useCallback((error: unknown): string => {
    const raw = error instanceof Error ? error.message : "";
    const key = normalize(raw);
    // Message connu du serveur (« paiement indisponible », « prestataire injoignable »…) : affiché dans la langue de l'écran.
    const known = b.serverMessages[key] || o.messages[key];
    if (known) return known;
    if (error instanceof ApiError && (error.status === 0 || error.status >= 500)) return tx.auth.serverError;
    return raw || tx.auth.serverError;
  }, [b, o, tx]);

  const load = useCallback(async (quiet = false) => {
    if (!getToken()) { window.location.replace("/auth/login"); return; }
    // Un administrateur de la plateforme ou un transporteur n'a pas d'abonnement.
    const user = getStoredUser();
    if (user && (isPlatformAdmin(user.role) || user.role === "transporteur")) { window.location.replace(homeFor(user)); return; }
    if (!quiet) setLoading(true);
    // Les lectures gardées 30 s en mémoire dateraient d'avant un paiement confirmé : on repart du serveur.
    invalidateApiCache(false);
    try {
      const [subscription, plans, history] = await Promise.all([
        api<SubscriptionView>("/billing/subscription"),
        api<PlansResponse>("/billing/plans"),
        api<SubscriptionPayment[]>("/billing/payments"),
      ]);
      if (!alive.current) return;
      setView(subscription);
      setPlansRes(plans);
      setPayments(Array.isArray(history) ? history : []);
      setLoadError(null);
    } catch (e) {
      if (alive.current && !quiet) setLoadError(errorText(e));
    } finally {
      if (alive.current && !quiet) setLoading(false);
    }
  }, [errorText]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      window.clearTimeout(flashTimer.current);
    };
    // Chargement initial uniquement : un changement de langue ne relance pas les appels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────── Retour de la page de paiement (« ?checkout=<numéro> ») ─────────────
  // Le serveur relit l'état du paiement chez le prestataire. S'il est encaissé, l'accès est déjà ouvert quand la
  // réponse arrive ; sinon on réessaie quelques fois (la confirmation peut suivre le client de quelques secondes).
  useEffect(() => {
    // « checkout » ne garde que ses chiffres : un prestataire qui ajoute ses propres paramètres à l'adresse de retour
    // (« ?checkout=12?payment_id=… ») ne doit pas empêcher la vérification.
    const raw = new URLSearchParams(window.location.search).get("checkout") || "";
    const id = Number(/^\d+/.exec(raw)?.[0] ?? Number.NaN);
    if (!Number.isInteger(id) || id <= 0 || !getToken()) return;
    let stopped = false;
    let timer: number | undefined;
    setReturned({ state: "checking" });
    // L'adresse est nettoyée : recharger la page ne relance pas la vérification.
    try { window.history.replaceState(null, "", window.location.pathname); } catch { /* ignoré */ }
    const attempt = async (tries: number) => {
      let result: CheckoutResult | null = null;
      try {
        result = await api<CheckoutResult>(`/billing/checkout/${id}/verify`, { method: "POST" });
      } catch {
        result = null;
      }
      if (stopped) return;
      if (result?.status === "paid") {
        setReturned({ state: "paid", result });
        void load(true);
        return;
      }
      if (result && (result.status === "expired" || result.status === "unknown")) { setReturned({ state: "failed" }); void load(true); return; }
      if (tries + 1 >= CONFIRM_TRIES) { setReturned({ state: "pending" }); void load(true); return; }
      timer = window.setTimeout(() => void attempt(tries + 1), CONFIRM_EVERY_MS);
    };
    void attempt(0);
    return () => { stopped = true; window.clearTimeout(timer); };
    // Une seule fois, à l'arrivée sur la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const account = view?.account ?? null;
  const pending = view?.pendingPayment ?? null;
  const checkout: CheckoutSession | null = view?.checkout ?? null;
  const blocked = !!account?.blocked;
  const canManage = !!view?.canManage;

  // Relecture automatique tant que l'accès est fermé ou qu'un paiement est en cours : l'ouverture s'affiche d'elle-même.
  const waiting = blocked || !!pending || !!checkout;
  useEffect(() => {
    if (!waiting) return;
    const tick = () => { if (document.visibilityState === "visible") void load(true); };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [waiting, load]);

  // L'accès vient d'être rouvert (paiement confirmé, réactivation) : on le dit.
  useEffect(() => {
    if (!account) return;
    if (wasBlocked.current === true && !account.blocked) notify(b.activeNow);
    wasBlocked.current = account.blocked;
  }, [account, b.activeNow, notify]);

  // Dans l'ERP, un compte qui vient d'être fermé n'a plus rien à y faire : on l'emmène sur la page hors ERP.
  // Une adresse email pas encore vérifiée mène à l'écran de saisie du code.
  useEffect(() => {
    if (account?.blocked && account.reason === "EMAIL_NOT_VERIFIED") window.location.replace("/auth/verify-email");
    else if (!standalone && blocked) window.location.replace("/subscription");
  }, [standalone, blocked, account]);

  const left = useServerCountdown(account, useCallback(() => { void load(true); }, [load]));

  // ───────────── Formules ─────────────

  const offer = useMemo(() => (plansRes && plansRes.plans?.length ? offerFromApi(plansRes, language) : null), [plansRes, language]);
  const plans: DisplayPlan[] = useMemo(() => offer?.plans ?? [], [offer]);
  const currency = view?.payment.currency || offer?.currency || "USD";
  const vatRate = Number(view?.payment.vatRate ?? offer?.vatRate ?? 0);
  const priceOf = useCallback((plan: DisplayPlan, c: Cycle) => (c === "annual" ? plan.priceAnnual : plan.priceMonthly), []);

  // Formule proposée d'office : celle choisie sur la page Tarifs, sinon l'actuelle, sinon la formule mise en avant.
  useEffect(() => {
    if (planCode || !plans.length || !account) return;
    const wanted = [readPreferredPlan(), account.planCode, plans.find((p) => p.highlight)?.code, plans[0]?.code];
    const found = wanted.find((code) => code && plans.some((p) => p.code === code));
    if (found) setPlanCode(found);
    if (account.billingCycle === "annual") setCycle("annual");
  }, [plans, account, planCode]);

  const manual = view?.payment.manual === true;
  const methods = useMemo(() => (manual && view?.payment.methods?.length ? view.payment.methods : []), [manual, view]);
  useEffect(() => {
    if (methods.length && !methods.includes(method)) setMethod(methods[0]);
  }, [methods, method]);

  const plan = plans.find((p) => p.code === planCode) ?? null;
  const amountHT = plan ? priceOf(plan, cycle) : null;
  const amountTTC = amountHT === null ? null : withVat(amountHT, vatRate, currency);
  const vatAmount = amountHT === null || amountTTC === null ? null : Math.round((amountTTC - amountHT) * 1000) / 1000;
  const annualPerk = twoMonthsFree(plans);
  const money = (n: number | null | undefined) => formatMoney(n, language, currency);
  const price = (n: number | null | undefined) => formatPrice(n, language, currency);
  const methodName = (code: string) => b.methods[code] || code;
  const cycleName = (c: string | null | undefined) => (c === "annual" ? b.annual : b.monthly);

  // ───────────── Actions ─────────────

  const refresh = async () => {
    setBusy("refresh");
    await load(true);
    if (alive.current) { setBusy(null); notify(b.refreshed); }
  };

  const logout = () => {
    clearSession();
    // Rechargement complet voulu : rien de la session fermée ne doit rester en mémoire dans l'onglet.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/auth/login");
  };

  const choosePlan = (target: DisplayPlan) => {
    if (priceOf(target, cycle) === null) return;
    setPlanCode(target.code);
    payRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** « Payer » : le serveur ouvre le paiement chez Flouci, le navigateur part sur sa page sécurisée. */
  const payByCard = async () => {
    if (busy) return;
    if (!plan || amountHT === null) { notify(b.choosePlanFirst, "err"); return; }
    setBusy("pay");
    try {
      const session = await api<CheckoutSession>("/billing/checkout", { method: "POST", body: { planCode: plan.code, billingCycle: cycle } });
      // Page externe (prestataire de paiement) : navigation complète voulue. Le bouton reste en attente jusqu'au départ.
      window.location.assign(session.payUrl);
    } catch (err) {
      notify(errorText(err), "err");
      if (alive.current) setBusy(null);
    }
  };

  const declare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!plan || amountHT === null) { notify(b.choosePlanFirst, "err"); return; }
    const ref = reference.trim();
    if (NEEDS_REFERENCE.has(method) && ref.length < 3) {
      setReferenceError(true);
      document.getElementById("sub-reference")?.focus();
      return;
    }
    setBusy("declare");
    try {
      await api("/billing/payments", { method: "POST", body: { planCode: plan.code, billingCycle: cycle, method, reference: ref, note: note.trim() } });
      setReference("");
      setNote("");
      await load(true);
      notify(b.declared);
    } catch (err) {
      notify(errorText(err), "err");
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const cancelDeclaration = async () => {
    if (!pending || busy) return;
    setBusy("cancelDeclaration");
    try {
      await api(`/billing/payments/${pending.id}`, { method: "DELETE" });
      await load(true);
      notify(b.declarationCancelled);
    } catch (err) {
      notify(errorText(err), "err");
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const openReceipt = async (paymentId: number) => {
    if (busy) return;
    setBusy(`receipt-${paymentId}`);
    try {
      setReceipt(await api<Receipt>(`/billing/payments/${paymentId}/receipt`));
    } catch (err) {
      notify(errorText(err), "err");
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const cancelSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !cancelPassword) return;
    setBusy("cancel");
    try {
      await api("/billing/cancel", { method: "POST", body: { password: cancelPassword, reason: cancelReason.trim() } });
      setCancelPassword("");
      setCancelReason("");
      notify(b.cancelDone);
      await load(true);
    } catch (err) {
      notify(errorText(err), "err");
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  // ───────────── Rendu ─────────────

  const receiptLabels: ReceiptLabels = useMemo(() => ({
    lang: language,
    subtitle: b.receiptSubtitle,
    issued: (date) => fill(b.receiptIssued, { date }),
    customer: b.receiptCustomer,
    taxId: b.receiptTaxId,
    registry: b.receiptRegistry,
    plan: b.plan,
    cycle: (c) => (c === "annual" ? b.annual : b.monthly).toLowerCase(),
    covered: b.receiptCovered,
    fromTo: (from, to) => fill(b.receiptFromTo, { from, to }),
    method: b.method,
    methodName: (code) => b.methods[code] || code,
    reference: b.reference,
    amountHT: b.totalHT,
    vat: (rate) => fill(b.vat, { rate }),
    paid: b.receiptPaid,
    charged: b.receiptCharged,
    notice: b.receiptNotice,
  }), [b, language]);

  const top = standalone ? (
    <header className="sub-top">
      <Link href="/" className="sub-brand" aria-label="Inovexa ERP">
        <img src="/images/logo.png" alt="" width={40} height={40} />
        <span lang="en" dir="ltr">INOVEXA <em>ERP</em></span>
      </Link>
      <div className="sub-top-right">
        <ThemeToggle size={38} />
        <LanguageMenu />
        <button type="button" className="sub-btn sub-btn-ghost" onClick={logout}>{b.logout}</button>
      </div>
    </header>
  ) : null;

  const shell = (children: React.ReactNode) => (
    <div className={"sub-root" + (standalone ? " sub-standalone" : "")}>
      {top}
      <div className="sub-wrap">{children}</div>
      <style dangerouslySetInnerHTML={{ __html: SUB_CSS }} />
    </div>
  );

  if (loading && !view) {
    return shell(<p className="sub-loading" role="status"><span className="sub-spinner" aria-hidden="true" />{returned?.state === "checking" ? o.pay.verifying : `${b.title}…`}</p>);
  }
  if (!view || !account) {
    return shell(
      <div className="sub-alert sub-alert-red" role="alert">
        <IconAlert />
        <div>
          <strong>{b.loadError}</strong>
          {loadError ? <p>{loadError}</p> : null}
          <div className="sub-alert-actions">
            <button type="button" className="sub-btn sub-btn-primary" onClick={() => void load()}>{b.retry}</button>
            <button type="button" className="sub-btn sub-btn-ghost" onClick={logout}>{b.logout}</button>
          </div>
        </div>
      </div>,
    );
  }

  const sector = SECTORS.find((s) => s.code === account.sector);
  const endDate = account.endsAt ? formatDateTime(account.endsAt, language) : null;
  const lastPayment = payments[0] ?? null;
  const rejected = !pending && lastPayment?.status === "rejected" ? lastPayment : null;
  const showVerify = !account.emailVerified && canManage && view.emailEnabled !== false;
  const support = view.support;
  const whatsappDigits = (support.whatsapp || "").replace(/\D/g, "");
  const hasSupport = !!(support.email || support.phone || whatsappDigits);
  const canCancel = canManage && (account.status === "ACTIVE" || account.status === "TRIAL");
  const cardLink = method === "card" ? view.payment.link || null : null;
  const online = view.payment.online ?? { enabled: view.payment.onlinePayment === true, provider: "flouci", test: false, methods: ["card", "flouci"], charge: null };
  // Flouci débite en dinars : quand les formules sont dans une autre devise, le montant TTC est converti au taux du serveur.
  const charge = online.charge ?? null;
  const converts = !!charge && charge.currency !== currency;
  const chargeAmount = amountTTC === null ? null : converts && charge ? Math.round(amountTTC * charge.rate * 1000) / 1000 : amountTTC;
  const chargeMoney = (n: number | null | undefined) => formatMoney(n, language, converts && charge ? charge.currency : currency);
  const rateText = charge ? charge.rate.toLocaleString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-GB", { maximumFractionDigits: 4 }) : "";
  const cardsText = online.methods.includes("card") ? o.pay.cards : o.pay.appOnly;
  const suspended = account.status === "SUSPENDED";
  const paid = returned?.state === "paid" ? returned.result.payment : null;
  // La page de paiement ouverte n'est proposée que si elle correspond encore à ce que le client a sous les yeux.
  const resumable = checkout && returned?.state !== "paid" && returned?.state !== "checking" ? checkout : null;

  return shell(
    <>
      {flash ? (
        <div className={"sub-flash sub-flash-" + flash.tone} role={flash.tone === "err" ? "alert" : "status"} onClick={() => setFlash(null)}>{flash.text}</div>
      ) : null}

      <div className="sub-head">
        <div>
          <h1>{blocked ? b.blockedTitle : b.title}</h1>
          <p>{b.subtitle}</p>
          <p className="sub-company">
            <strong>{view.company.name || "—"}</strong>
            <span aria-hidden="true"> · </span>
            <bdi>{view.company.email}</bdi>
          </p>
        </div>
        <div className="sub-head-actions">
          <button type="button" className="sub-btn sub-btn-ghost" onClick={refresh} disabled={busy === "refresh"} aria-busy={busy === "refresh"}>
            <IconRefresh />{b.refresh}
          </button>
          {standalone && !blocked ? <a href="/dashboard" className="sub-btn sub-btn-primary">{b.openErp}</a> : null}
        </div>
      </div>

      {/* ───── Retour de la page de paiement ───── */}
      {returned?.state === "checking" ? (
        <div className="sub-alert sub-alert-blue" role="status" aria-live="polite">
          <span className="sub-spinner" aria-hidden="true" />
          <div><strong>{o.pay.verifying}</strong></div>
        </div>
      ) : returned?.state === "paid" ? (
        <div className="sub-alert sub-alert-green sub-alert-big" role="status" aria-live="polite">
          <IconCheck />
          <div>
            <strong>{o.pay.paidTitle}</strong>
            {paid ? <p>{fill(o.pay.paidText, { plan: paid.planName, date: formatDateTime(paid.periodEnd, language, false) })}</p> : null}
            <div className="sub-alert-actions">
              {paid?.receiptNumber ? (
                <button type="button" className="sub-btn sub-btn-ghost" onClick={() => void openReceipt(paid.id)} disabled={busy === `receipt-${paid.id}`}>
                  {fill(o.pay.paidReceipt, { receipt: paid.receiptNumber })}
                </button>
              ) : null}
              {standalone ? <a href="/dashboard" className="sub-btn sub-btn-primary">{b.openErp}</a> : null}
            </div>
          </div>
        </div>
      ) : returned?.state === "pending" || returned?.state === "failed" ? (
        <div className={"sub-alert " + (returned.state === "failed" ? "sub-alert-red" : "sub-alert-amber")} role="alert">
          <IconAlert />
          <div>
            <strong>{returned.state === "failed" ? o.pay.failedTitle : o.pay.pendingTitle}</strong>
            <p>{returned.state === "failed" ? o.pay.failedText : o.pay.pendingText}</p>
            <div className="sub-alert-actions">
              {resumable ? <a href={resumable.payUrl} className="sub-btn sub-btn-primary">{o.pay.resume}</a> : (
                <button type="button" className="sub-btn sub-btn-primary" onClick={() => payRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>{o.pay.retry}</button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {blocked ? (
        <div className={"sub-alert " + (account.reason === "SUSPENDED" ? "sub-alert-red" : "sub-alert-amber")} role="alert">
          <IconLock />
          <div>
            {/* Le motif dit déjà que les données sont conservées ; la phrase générale ne sert que s'il manque. */}
            <strong>{account.reason ? tx.reason[account.reason] : b.dataSafe}</strong>
          </div>
        </div>
      ) : standalone && returned?.state !== "paid" ? (
        <div className="sub-alert sub-alert-green" role="status">
          <IconCheck />
          <div><strong>{b.activeNow}</strong></div>
        </div>
      ) : null}

      {/* ───── État du compte ───── */}
      <section className="sub-facts" aria-label={b.state}>
        <div className="sub-fact">
          <span className="sub-fact-label">{b.state}</span>
          <span className={"sub-pill sub-tone-" + (STATUS_TONE[account.status] || "gray")}>{tx.status[account.status]}</span>
          {sector ? <span className="sub-fact-sub">{b.sectorLabel} : {pick(sector.name, language)}</span> : null}
        </div>
        <div className="sub-fact">
          <span className="sub-fact-label">{b.plan}</span>
          <span className="sub-fact-value">{view.plan?.name || b.noPlan}</span>
          {view.plan && account.billingCycle ? <span className="sub-fact-sub">{cycleName(account.billingCycle)}</span> : null}
        </div>
        <div className="sub-fact">
          <span className="sub-fact-label">{account.status === "TRIAL" || account.reason === "TRIAL_EXPIRED" ? b.trialUntil : b.paidUntil}</span>
          <span className="sub-fact-value">{endDate || (account.status === "ACTIVE" ? b.noExpiry : "—")}</span>
          {left !== null ? <span className="sub-fact-sub sub-fact-time"><IconClock />{b.remaining} : {formatRemaining(left, tx)}</span> : null}
        </div>
        <div className="sub-fact">
          <span className="sub-fact-label">{b.users}</span>
          <span className="sub-fact-value">
            {view.users.limit === null ? `${view.users.used} · ${b.unlimited}` : fill(b.usersOf, { used: view.users.used, limit: view.users.limit })}
          </span>
        </div>
      </section>

      {showVerify ? (
        <div className="sub-note">
          <span>{tx.bar.verifyEmail}</span>
          <VerifyEmailLink />
        </div>
      ) : null}

      {pending ? (
        <section className="sub-alert sub-alert-amber" aria-live="polite">
          <IconClock />
          <div>
            <strong>{b.pendingTitle}</strong>
            <p>{fill(b.pendingText, { date: formatDateTime(pending.createdAt, language), amount: `${formatMoney(pending.amountTTC, language, pending.currency)} ${b.inclTax}` })}</p>
            <p className="sub-muted">
              {pending.planName} — {cycleName(pending.billingCycle)} · {methodName(pending.method)}
              {pending.reference ? <> · <bdi>{pending.reference}</bdi></> : null}
            </p>
            <p className="sub-muted">{b.lastUpdate}</p>
            {canManage ? (
              <div className="sub-alert-actions">
                <button type="button" className="sub-btn sub-btn-ghost" onClick={cancelDeclaration} disabled={busy === "cancelDeclaration"}>{b.cancelDeclaration}</button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {rejected ? (
        <section className="sub-alert sub-alert-red">
          <IconAlert />
          <div>
            <strong>{b.rejected}</strong>
            <p>{formatDateTime(rejected.createdAt, language)} — {formatMoney(rejected.amountTTC, language, rejected.currency)} {b.inclTax} · {methodName(rejected.method)}</p>
            {rejected.rejectReason ? <p>{fill(b.rejectedReason, { reason: rejected.rejectReason })}</p> : null}
          </div>
        </section>
      ) : null}

      {/* ───── 1. Formule ───── */}
      <section className="sub-card">
        <div className="sub-card-head">
          <h2>{account.status === "ACTIVE" ? b.renewTitle : b.stepPlan}</h2>
          {plans.length ? (
            <div className="sub-cycle" role="radiogroup" aria-label={b.cycle}>
              {(["monthly", "annual"] as Cycle[]).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={cycle === c} className={cycle === c ? "is-on" : ""} onClick={() => setCycle(c)}>
                  {cycleName(c)}
                  {c === "annual" && annualPerk ? <span className="sub-chip">{b.twoMonthsFree}</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {plans.length === 0 ? (
          <p className="sub-empty">{b.noPlans}</p>
        ) : (
          <div className="sub-plans">
            {plans.map((p) => {
              const amount = priceOf(p, cycle);
              const selected = p.code === planCode && amount !== null;
              const saving = cycle === "annual" ? annualSavingPct(p) : null;
              const current = account.planCode === p.code && account.status === "ACTIVE";
              const usersLine = p.maxUsers === null ? b.unlimitedUsers : fill(b.upTo, { n: p.maxUsers });
              return (
                <article key={p.code} className={"sub-plan" + (selected ? " is-selected" : "") + (p.highlight ? " is-highlight" : "")}>
                  <div className="sub-plan-tags">
                    {p.highlight ? <span className="sub-chip sub-chip-solid">{b.recommended}</span> : null}
                    {current ? <span className="sub-chip">{b.current}</span> : null}
                  </div>
                  <h3>{p.name}</h3>
                  {p.tagline ? <p className="sub-plan-tagline">{p.tagline}</p> : null}
                  <p className="sub-plan-price">
                    {amount === null ? <span className="sub-plan-quote">{b.onQuote}</span> : (
                      <>
                        <span className="sub-plan-amount">{price(amount)}</span>
                        <span className="sub-plan-unit">{b.exclTax} {cycle === "annual" ? b.perYear : b.perMonth}</span>
                      </>
                    )}
                  </p>
                  <p className="sub-plan-sub">
                    {amount === null ? o.pay.quoteOnly : cycle === "annual"
                      ? <>{fill(b.perMonthEquivalent, { price: price(Math.round((amount / 12) * 100) / 100) })}{saving ? <span className="sub-save">{fill(b.savePct, { pct: saving })}</span> : null}</>
                      : <>{money(withVat(amount, vatRate, currency))} {b.inclTax}</>}
                  </p>
                  <ul className="sub-plan-list">
                    <li><IconCheck />{usersLine}</li>
                    {p.features.filter((feature) => normalize(feature) !== normalize(usersLine) && !isUsersLine(feature)).slice(0, 7).map((feature) => <li key={feature}><IconCheck />{feature}</li>)}
                  </ul>
                  {canManage && amount !== null ? (
                    <button type="button" className={"sub-btn " + (selected ? "sub-btn-selected" : p.highlight ? "sub-btn-primary" : "sub-btn-outline")} onClick={() => choosePlan(p)} aria-pressed={selected}>
                      {selected ? <><IconCheck />{b.selected}</> : b.select}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ───── 2. Paiement en ligne (Flouci) ───── */}
      {plans.length ? (
        <section className="sub-card" ref={payRef} id="paiement">
          <div className="sub-card-head">
            <h2>{o.pay.step}</h2>
            {online.enabled && online.test ? <span className="sub-pill sub-tone-amber">{o.pay.testMode}</span> : null}
          </div>
          {!canManage ? (
            <p className="sub-empty">{b.ownerOnly}</p>
          ) : (
            <div className="sub-pay">
              <div className="sub-pay-main">
                <div className="sub-cardpay">
                  <span className="sub-cardpay-ico"><IconCard /></span>
                  <div>
                    <h3>{o.pay.cardTitle}</h3>
                    <p className="sub-muted">{o.pay.cardIntro}</p>
                    <p className="sub-cardpay-brands">{cardsText}</p>
                  </div>
                </div>

                {suspended ? <p className="sub-tip sub-tip-red">{o.pay.suspended}</p> : !online.enabled ? (
                  <div className="sub-alert sub-alert-amber" style={{ marginBottom: 0 }}>
                    <IconClock />
                    <div><strong>{o.pay.unavailableTitle}</strong><p>{o.pay.unavailableText}</p></div>
                  </div>
                ) : null}

                {resumable && online.enabled && !suspended ? (
                  <div className="sub-alert sub-alert-blue" style={{ marginBottom: 0 }}>
                    <IconClock />
                    <div>
                      <strong>{o.pay.resumeTitle}</strong>
                      <p>{fill(o.pay.resumeText, { amount: resumable.chargedAmount != null && resumable.chargedCurrency ? formatMoney(resumable.chargedAmount, language, resumable.chargedCurrency) : formatMoney(resumable.amountTTC, language, resumable.currency), time: formatTime(resumable.expiresAt, language) })}</p>
                      <div className="sub-alert-actions"><a href={resumable.payUrl} className="sub-btn sub-btn-outline">{o.pay.resume}</a></div>
                    </div>
                  </div>
                ) : null}

                {account.status === "TRIAL" ? <p className="sub-tip">{b.trialKeeps}</p> : null}
                <ul className="sub-assurances">
                  <li><IconShield />{o.pay.secure}</li>
                  <li><IconShield />{o.pay.noAutoRenew}</li>
                  <li><IconShield />{fill(o.pay.currencyNote, { currency: charge?.currency || currency })}</li>
                </ul>
              </div>

              <aside className="sub-summary" aria-label={b.summary}>
                <h3>{b.summary}</h3>
                {plan && amountHT !== null ? (
                  <>
                    <dl>
                      <div><dt>{b.summaryPlan}</dt><dd>{plan.name} — {cycleName(cycle)}</dd></div>
                      <div><dt>{b.summaryPeriod}</dt><dd>{cycle === "annual" ? b.twelveMonths : b.oneMonth}</dd></div>
                      <div><dt>{b.totalHT}</dt><dd>{money(amountHT)}</dd></div>
                      <div><dt>{fill(b.vat, { rate: vatRate.toLocaleString(language === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 2 }) })}</dt><dd>{money(vatAmount)}</dd></div>
                    </dl>
                    <p className="sub-total"><span>{b.totalTTC}</span><strong>{money(amountTTC)}</strong></p>
                    {converts && charge && chargeAmount !== null ? (
                      <p className="sub-muted sub-small sub-charge">{fill(o.pay.chargeLine, { amount: chargeMoney(chargeAmount), currency, rate: rateText })}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="sub-muted">{b.choosePlanFirst}</p>
                )}
                <button type="button" className="sub-btn sub-btn-primary sub-btn-wide" onClick={() => void payByCard()}
                  disabled={!plan || amountHT === null || !online.enabled || suspended || busy === "pay"} aria-busy={busy === "pay"}>
                  {busy === "pay" ? o.pay.redirecting : plan && chargeAmount !== null ? fill(account.status === "ACTIVE" && account.planCode === plan.code ? o.pay.renewNow : o.pay.payNow, { amount: chargeMoney(chargeAmount) }) : fill(o.pay.payNow, { amount: "" }).replace(/\s{2,}/g, " ").trim()}
                </button>
                <p className="sub-muted sub-small">{cardsText}</p>
              </aside>
            </div>
          )}

          {/* ───── Autres moyens (seulement si l'administrateur les a activés) ───── */}
          {canManage && manual && methods.length ? (
            <details className="sub-other">
              <summary>{o.pay.otherMeans}</summary>
              <p className="sub-muted" style={{ margin: "10px 0 14px" }}>{o.pay.otherMeansHint}</p>
              {pending ? <p className="sub-empty">{b.pendingLock}</p> : (
                <form className="sub-manual" onSubmit={declare} noValidate>
                  <fieldset className="sub-methods">
                    <legend>{b.method}</legend>
                    <div className="sub-method-grid">
                      {methods.map((code) => (
                        <label key={code} className={"sub-method" + (method === code ? " is-on" : "")}>
                          <input type="radio" name="sub-method" value={code} checked={method === code} onChange={() => { setMethod(code); setReferenceError(false); }} />
                          <span className="sub-method-ico">{METHOD_ICONS[code] || METHOD_ICONS.other}</span>
                          <span>{methodName(code)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <p className="sub-method-hint">{b.methodHint[method] || b.methodHint.other}</p>
                  {cardLink ? (
                    <div className="sub-online">
                      <a href={cardLink} target="_blank" rel="noopener noreferrer" className="sub-btn sub-btn-outline"><IconExternal />{b.payOnline}</a>
                      <p className="sub-muted">{b.payOnlineHint}</p>
                    </div>
                  ) : null}
                  <div className="sub-instructions">
                    <h3>{b.instructions}</h3>
                    {view.payment.instructions ? <p className="sub-pre" dir="auto">{view.payment.instructions}</p> : <p className="sub-muted">{b.noInstructions}</p>}
                  </div>
                  <div className="sub-fields">
                    <div className="sub-field">
                      <label htmlFor="sub-reference">{NEEDS_REFERENCE.has(method) ? b.reference : b.referenceOptional}</label>
                      <input id="sub-reference" value={reference} onChange={(e) => { setReference(e.target.value); setReferenceError(false); }} maxLength={120} dir="ltr" autoComplete="off"
                        aria-invalid={referenceError || undefined} aria-describedby="sub-reference-hint" />
                      <p id="sub-reference-hint" className={referenceError ? "sub-field-error" : "sub-field-hint"}>{referenceError ? b.referenceRequired : b.referenceHint}</p>
                    </div>
                    <div className="sub-field">
                      <label htmlFor="sub-note">{b.note}</label>
                      <input id="sub-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} autoComplete="off" />
                    </div>
                  </div>
                  <div className="sub-alert-actions" style={{ marginTop: 0 }}>
                    <button type="submit" className="sub-btn sub-btn-outline" disabled={!plan || amountHT === null || busy === "declare"} aria-busy={busy === "declare"}>
                      {b.declare}{plan && amountTTC !== null ? ` — ${money(amountTTC)}` : ""}
                    </button>
                  </div>
                  <p className="sub-muted sub-small">{b.startsAfter}</p>
                </form>
              )}
            </details>
          ) : null}
        </section>
      ) : null}

      {/* ───── Secteur et modules : choisis par le client (dans l'ERP seulement) ───── */}
      {!standalone && !blocked ? <ModulesCard canManage={canManage} notify={notify} errorText={errorText} /> : null}

      {/* ───── Historique ───── */}
      <section className="sub-card">
        <div className="sub-card-head"><h2>{b.history}</h2></div>
        {payments.length === 0 ? <p className="sub-empty">{b.noPayments}</p> : (
          <div className="sub-table-wrap">
            <table className="sub-table">
              <thead>
                <tr>
                  <th>{b.date}</th>
                  <th>{b.plan}</th>
                  <th className="sub-num">{b.amount} ({b.inclTax})</th>
                  <th>{b.method}</th>
                  <th>{b.statusCol}</th>
                  <th>{b.receipt}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.validatedAt || p.createdAt, language)}</td>
                    <td>{p.planName} — {cycleName(p.billingCycle)}</td>
                    <td className="sub-num">{formatMoney(p.amountTTC, language, p.currency)}</td>
                    <td>{methodName(p.method)}{p.reference ? <span className="sub-ref"><bdi>{p.reference}</bdi></span> : null}</td>
                    <td>
                      <span className={"sub-pill sub-tone-" + (PAY_TONE[p.status] || "gray")}>{p.status === "validated" && p.provider !== "manual" ? o.pay.paid : b.payStatus[p.status as keyof typeof b.payStatus] || p.status}</span>
                      {p.status === "rejected" && p.rejectReason ? <span className="sub-ref">{p.rejectReason}</span> : null}
                    </td>
                    <td>
                      {p.status === "validated" ? (
                        <button type="button" className="sub-link" onClick={() => void openReceipt(p.id)} disabled={busy === `receipt-${p.id}`}>
                          {p.receiptNumber || b.viewReceipt}
                        </button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ───── Aide ───── */}
      {hasSupport ? (
        <section className="sub-help" aria-label={o.pay.helpTitle}>
          <strong>{o.pay.helpTitle}</strong>
          {support.email ? <a href={`mailto:${support.email}`}><bdi>{support.email}</bdi></a> : null}
          {support.phone ? <a href={`tel:${support.phone.replace(/\s/g, "")}`}><bdi dir="ltr">{formatPhone(support.phone)}</bdi></a> : null}
          {whatsappDigits ? <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer">{b.whatsapp} <bdi dir="ltr">{formatPhone(support.whatsapp)}</bdi></a> : null}
        </section>
      ) : null}

      {/* ───── Résiliation ───── */}
      {canCancel ? (
        <details className="sub-danger">
          <summary>{b.cancelOpen}</summary>
          <form onSubmit={cancelSubscription} noValidate>
            <p className="sub-muted">{b.cancelText}</p>
            <div className="sub-fields">
              <div className="sub-field">
                <label htmlFor="sub-cancel-password">{b.cancelPassword}</label>
                <input id="sub-cancel-password" type="password" value={cancelPassword} onChange={(e) => setCancelPassword(e.target.value)} autoComplete="current-password" required />
              </div>
              <div className="sub-field">
                <label htmlFor="sub-cancel-reason">{b.cancelReason}</label>
                <input id="sub-cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} maxLength={300} />
              </div>
            </div>
            <button type="submit" className="sub-btn sub-btn-danger" disabled={!cancelPassword || busy === "cancel"} aria-busy={busy === "cancel"}>{b.cancelConfirm}</button>
          </form>
        </details>
      ) : null}

      {receipt ? (
        <>
          <Modal
            title={b.receiptTitle}
            onClose={() => setReceipt(null)}
            width={620}
            footer={(
              <>
                <button type="button" className="sub-btn sub-btn-ghost" onClick={() => setReceipt(null)}>{b.close}</button>
                <button type="button" className="sub-btn sub-btn-primary" onClick={() => window.print()}>{b.print}</button>
              </>
            )}
          >
            <ReceiptSheet receipt={receipt} labels={receiptLabels} />
          </Modal>
          <ReceiptPrintRoot receipt={receipt} labels={receiptLabels} />
        </>
      ) : null}
    </>,
  );
}

// ───────────── Styles ─────────────

const SUB_CSS = `
.sub-root { color: var(--theme-text); font-family: var(--font-poppins), system-ui, sans-serif; }
.sub-standalone { min-height: 100vh; background: var(--theme-background); }
.sub-wrap { max-width: 1120px; margin: 0 auto; padding: clamp(14px, 3vw, 28px); padding-bottom: 96px; }
.sub-standalone .sub-wrap { padding-top: clamp(18px, 3vw, 32px); }

.sub-top { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 62px; padding: 8px clamp(14px, 4vw, 40px); background: var(--theme-surface); border-bottom: 1px solid var(--theme-border); }
.sub-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--theme-text); font-family: var(--font-orbitron), var(--font-poppins), sans-serif; font-weight: 800; letter-spacing: 1.5px; font-size: 16px; }
.sub-brand img { border-radius: 50%; }
.sub-brand em { font-style: normal; color: var(--theme-primary, #6d4aff); font-size: .72em; letter-spacing: 3px; }
.sub-top-right { display: flex; align-items: center; gap: 8px; }

.sub-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
.sub-head h1 { margin: 0; font-size: clamp(21px, 3vw, 28px); font-weight: 800; letter-spacing: -.01em; }
.sub-head p { margin: 4px 0 0; color: var(--theme-text-secondary); font-size: 14px; }
.sub-head .sub-company { color: var(--theme-text); font-size: 13.5px; margin-top: 8px; }
.sub-head-actions { display: flex; flex-wrap: wrap; gap: 8px; }

.sub-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 8px 16px; border-radius: 10px; border: 1px solid transparent; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; white-space: nowrap; transition: filter .15s, background .15s, border-color .15s; }
.sub-btn:disabled { opacity: .55; cursor: not-allowed; }
.sub-btn-primary { background: var(--theme-primary, #4f46e5); color: #fff; }
.sub-btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
.sub-btn-outline { background: transparent; color: var(--theme-primary, #4f46e5); border-color: rgba(var(--theme-primary-rgb, 79, 70, 229), .55); }
.sub-btn-outline:hover:not(:disabled) { background: rgba(var(--theme-primary-rgb, 79, 70, 229), .08); }
.sub-btn-selected { background: rgba(16, 185, 129, .14); color: #047857; border-color: rgba(16, 185, 129, .55); }
.sub-btn-ghost { background: transparent; color: var(--theme-text); border-color: var(--theme-border); }
.sub-btn-ghost:hover:not(:disabled) { background: var(--theme-surface-hover); }
.sub-btn-danger { background: transparent; color: #dc2626; border-color: rgba(220, 38, 38, .6); }
.sub-btn-danger:hover:not(:disabled) { background: rgba(220, 38, 38, .08); }
.sub-btn-wide { width: 100%; min-height: 46px; font-size: 15px; }
.sub-link { background: none; border: none; padding: 0; font: inherit; font-weight: 700; color: var(--theme-primary, #4f46e5); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.sub-link:disabled { opacity: .5; cursor: wait; }

.sub-flash { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 3000; max-width: min(92vw, 640px); padding: 11px 18px; border-radius: 12px; color: #fff; font-size: 14px; font-weight: 600; box-shadow: 0 10px 30px rgba(0, 0, 0, .25); cursor: pointer; }
.sub-flash-ok { background: #059669; }
.sub-flash-err { background: #dc2626; }

.sub-alert { display: flex; gap: 14px; align-items: flex-start; padding: 16px 18px; margin-bottom: 16px; border-radius: 14px; border: 1px solid; font-size: 14px; line-height: 1.55; }
.sub-alert > svg { flex-shrink: 0; margin-top: 2px; }
.sub-alert strong { display: block; font-size: 15px; }
.sub-alert p { margin: 4px 0 0; }
.sub-alert-amber { background: rgba(245, 158, 11, .11); border-color: rgba(245, 158, 11, .5); }
.sub-alert-amber > svg { color: #b45309; }
.sub-alert-red { background: rgba(239, 68, 68, .09); border-color: rgba(239, 68, 68, .45); }
.sub-alert-red > svg { color: #dc2626; }
.sub-alert-green { background: rgba(16, 185, 129, .1); border-color: rgba(16, 185, 129, .45); align-items: center; }
.sub-alert-green > svg { color: #059669; margin-top: 0; }
.sub-alert-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.sub-muted { color: var(--theme-text-secondary); font-size: 13.5px; line-height: 1.55; margin: 0; }
.sub-small { font-size: 12.5px; }

.sub-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 16px; }
.sub-fact { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 14px 16px; background: var(--theme-surface); border: 1px solid var(--theme-border); border-radius: 14px; min-width: 0; }
.sub-fact-label { font-size: 12px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: var(--theme-text-secondary); }
.sub-fact-value { font-size: 17px; font-weight: 800; overflow-wrap: anywhere; }
.sub-fact-sub { font-size: 12.5px; color: var(--theme-text-secondary); }
.sub-fact-time { display: inline-flex; align-items: center; gap: 6px; color: var(--theme-primary, #4f46e5); font-weight: 700; }
.sub-fact-time svg { width: 14px; height: 14px; }

.sub-pill { display: inline-flex; align-items: center; padding: 3px 11px; border-radius: 999px; font-size: 12.5px; font-weight: 800; white-space: nowrap; }
.sub-tone-violet { background: rgba(124, 58, 237, .15); color: #6d28d9; }
.sub-tone-green { background: rgba(16, 185, 129, .16); color: #047857; }
.sub-tone-amber { background: rgba(245, 158, 11, .2); color: #b45309; }
.sub-tone-red { background: rgba(239, 68, 68, .15); color: #dc2626; }
.sub-tone-gray { background: rgba(107, 114, 128, .18); color: var(--theme-text-secondary); }

.sub-note { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; padding: 10px 16px; margin-bottom: 16px; border-radius: 12px; background: var(--theme-surface); border: 1px dashed var(--theme-border); font-size: 13.5px; }

.sub-card { background: var(--theme-surface); border: 1px solid var(--theme-border); border-radius: 16px; margin-bottom: 16px; padding: clamp(16px, 2.4vw, 24px); scroll-margin-top: 84px; }
.sub-card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.sub-card-head h2 { margin: 0; font-size: 17px; font-weight: 800; }
.sub-empty { margin: 0; padding: 18px; text-align: center; color: var(--theme-text-secondary); font-size: 14px; background: var(--theme-surface-hover); border-radius: 12px; }

.sub-cycle { display: inline-flex; padding: 4px; border-radius: 12px; background: var(--theme-surface-hover); border: 1px solid var(--theme-border); }
.sub-cycle button { display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 6px 14px; border: none; border-radius: 9px; background: transparent; color: var(--theme-text-secondary); font: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer; }
.sub-cycle button.is-on { background: var(--theme-surface); color: var(--theme-text); box-shadow: 0 1px 4px rgba(0, 0, 0, .12); }
.sub-chip { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px; background: rgba(16, 185, 129, .16); color: #047857; font-size: 11.5px; font-weight: 800; white-space: nowrap; }
.sub-chip-solid { background: var(--theme-primary, #4f46e5); color: #fff; }

.sub-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(236px, 1fr)); gap: 14px; align-items: stretch; }
.sub-plan { position: relative; display: flex; flex-direction: column; padding: 20px 18px 18px; border-radius: 14px; border: 1.5px solid var(--theme-border); background: var(--theme-surface); min-width: 0; }
.sub-plan.is-highlight { border-color: rgba(var(--theme-primary-rgb, 79, 70, 229), .55); box-shadow: 0 10px 28px rgba(var(--theme-primary-rgb, 79, 70, 229), .12); }
.sub-plan.is-selected { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, .16); }
.sub-plan-tags { display: flex; flex-wrap: wrap; gap: 6px; min-height: 22px; margin-bottom: 8px; }
.sub-plan h3 { margin: 0; font-size: 19px; font-weight: 800; }
.sub-plan-tagline { margin: 4px 0 0; font-size: 13px; line-height: 1.5; color: var(--theme-text-secondary); min-height: 39px; }
.sub-plan-price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; margin: 14px 0 0; }
.sub-plan-amount { font-size: 30px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.sub-plan-unit { font-size: 13px; font-weight: 600; color: var(--theme-text-secondary); }
.sub-plan-quote { font-size: 22px; font-weight: 800; }
.sub-plan-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 2px 0 0; min-height: 22px; font-size: 12.5px; color: var(--theme-text-secondary); }
.sub-save { padding: 1px 8px; border-radius: 999px; background: rgba(16, 185, 129, .16); color: #047857; font-weight: 800; }
.sub-plan-list { list-style: none; margin: 14px 0 18px; padding: 0; display: flex; flex-direction: column; gap: 8px; flex: 1; font-size: 13.5px; line-height: 1.45; }
.sub-plan-list li { display: flex; gap: 8px; align-items: flex-start; }
.sub-plan-list svg { flex-shrink: 0; margin-top: 3px; color: #059669; }

.sub-pay { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); gap: clamp(16px, 2.4vw, 28px); align-items: start; }
.sub-pay-main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.sub-tip { margin: 0; padding: 10px 14px; border-radius: 10px; background: rgba(var(--theme-primary-rgb, 79, 70, 229), .08); border: 1px solid rgba(var(--theme-primary-rgb, 79, 70, 229), .25); font-size: 13.5px; line-height: 1.5; }
.sub-methods { border: none; margin: 0; padding: 0; min-width: 0; }
.sub-methods legend { padding: 0; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
.sub-method-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 8px; }
.sub-method { position: relative; display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 12px; border-radius: 11px; border: 1.5px solid var(--theme-border); background: var(--theme-surface); font-size: 13.5px; font-weight: 600; cursor: pointer; }
.sub-method:hover { border-color: var(--theme-border-hover, var(--theme-border)); }
.sub-method input { position: absolute; opacity: 0; pointer-events: none; }
.sub-method.is-on { border-color: var(--theme-primary, #4f46e5); background: rgba(var(--theme-primary-rgb, 79, 70, 229), .08); }
.sub-method:has(input:focus-visible) { outline: 2px solid var(--theme-primary, #4f46e5); outline-offset: 2px; }
.sub-method-ico { display: inline-flex; color: var(--theme-primary, #4f46e5); }
.sub-method-hint { margin: 0; font-size: 13.5px; line-height: 1.5; }
.sub-online { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.sub-instructions { padding: 14px 16px; border-radius: 12px; background: var(--theme-surface-hover); border: 1px solid var(--theme-border); }
.sub-instructions h3 { margin: 0 0 6px; font-size: 13px; font-weight: 800; }
.sub-pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; line-height: 1.6; }
.sub-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.sub-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; margin-bottom: 4px; }
.sub-field label { font-size: 13px; font-weight: 700; }
.sub-field input, .sub-field textarea { width: 100%; min-height: 42px; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--theme-border-hover, var(--theme-border)); background: var(--theme-surface); color: var(--theme-text); font: inherit; font-size: 14px; outline: none; }
.sub-field textarea { resize: vertical; line-height: 1.5; }
.sub-field input:focus, .sub-field textarea:focus { border-color: var(--theme-primary, #4f46e5); box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb, 79, 70, 229), .16); }
.sub-field input[aria-invalid="true"] { border-color: #dc2626; }
.sub-field-hint { margin: 0; font-size: 12px; color: var(--theme-text-secondary); }
.sub-field-error { margin: 0; font-size: 12px; font-weight: 600; color: #dc2626; }

.sub-summary { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 14px; border: 1px solid var(--theme-border); background: var(--theme-surface-hover); }
.sub-summary h3 { margin: 0; font-size: 14px; font-weight: 800; }
.sub-summary dl { margin: 0; display: flex; flex-direction: column; }
.sub-summary dl > div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--theme-border); font-size: 13.5px; }
.sub-summary dt { color: var(--theme-text-secondary); }
.sub-summary dd { margin: 0; font-weight: 700; text-align: end; font-variant-numeric: tabular-nums; }
.sub-total { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; margin: 0; font-size: 14px; font-weight: 700; }
.sub-total strong { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.sub-charge { margin: -6px 0 0; line-height: 1.45; font-variant-numeric: tabular-nums; }

.sub-table-wrap { overflow-x: auto; }
.sub-table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 13.5px; }
.sub-table th { text-align: start; padding: 9px 12px; font-size: 12px; font-weight: 700; color: var(--theme-text-secondary); background: var(--theme-surface-hover); white-space: nowrap; }
.sub-table td { padding: 10px 12px; border-top: 1px solid var(--theme-border); vertical-align: top; }
.sub-num { text-align: end !important; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sub-ref { display: block; margin-top: 2px; font-size: 12px; color: var(--theme-text-secondary); overflow-wrap: anywhere; }

.sub-help { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; margin-bottom: 16px; padding: 12px 18px; border-radius: 14px; border: 1px dashed var(--theme-border); background: var(--theme-surface); font-size: 13.5px; }
.sub-help a { color: var(--theme-primary, #4f46e5); font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
.sub-help a:hover { text-decoration: underline; }

.sub-alert-blue { background: rgba(var(--theme-primary-rgb, 79, 70, 229), .07); border-color: rgba(var(--theme-primary-rgb, 79, 70, 229), .35); align-items: center; }
.sub-alert-blue > svg { color: var(--theme-primary, #4f46e5); }
.sub-alert-big { padding: 20px 22px; align-items: flex-start; }
.sub-alert-big strong { font-size: 17px; }
.sub-alert-big > svg { width: 24px; height: 24px; margin-top: 1px; }

.sub-cardpay { display: flex; gap: 14px; align-items: flex-start; padding: 16px 18px; border-radius: 14px; border: 1.5px solid rgba(var(--theme-primary-rgb, 79, 70, 229), .4); background: rgba(var(--theme-primary-rgb, 79, 70, 229), .05); }
.sub-cardpay h3 { margin: 0 0 4px; font-size: 15.5px; font-weight: 800; }
.sub-cardpay-ico { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; background: var(--theme-primary, #4f46e5); color: #fff; }
.sub-cardpay-brands { margin: 8px 0 0; font-size: 13px; font-weight: 700; }
.sub-tip-red { background: rgba(239, 68, 68, .08); border-color: rgba(239, 68, 68, .4); }
.sub-assurances { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; font-size: 13px; line-height: 1.5; color: var(--theme-text-secondary); }
.sub-assurances li { display: flex; gap: 8px; align-items: flex-start; }
.sub-assurances svg { flex-shrink: 0; margin-top: 2px; color: #059669; }

.sub-other { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--theme-border); }
.sub-other summary { cursor: pointer; font-size: 13.5px; font-weight: 700; color: var(--theme-text-secondary); }
.sub-manual { display: flex; flex-direction: column; gap: 14px; }

.sub-sector { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px 16px; margin-bottom: 14px; }
.sub-sector .sub-field { flex: 1 1 260px; max-width: 420px; }
.sub-field select { width: 100%; min-height: 42px; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--theme-border-hover, var(--theme-border)); background: var(--theme-surface); color: var(--theme-text); font: inherit; font-size: 14px; outline: none; }
.sub-field select:focus { border-color: var(--theme-primary, #4f46e5); box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb, 79, 70, 229), .16); }
.sub-sector-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
.sub-mod-group { border: none; margin: 0 0 14px; padding: 0; min-width: 0; }
.sub-mod-group legend { padding: 0; margin-bottom: 8px; font-size: 12px; font-weight: 800; letter-spacing: .03em; text-transform: uppercase; color: var(--theme-text-secondary); }
.sub-mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; }
.sub-mod { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 11px; border: 1.5px solid var(--theme-border); background: var(--theme-surface); cursor: pointer; min-width: 0; }
.sub-mod input { width: 17px; height: 17px; margin-top: 2px; flex-shrink: 0; accent-color: var(--theme-primary, #4f46e5); cursor: pointer; }
.sub-mod.is-on { border-color: rgba(var(--theme-primary-rgb, 79, 70, 229), .55); background: rgba(var(--theme-primary-rgb, 79, 70, 229), .06); }
.sub-mod.is-locked { cursor: not-allowed; opacity: .7; }
.sub-mod.is-locked input { cursor: not-allowed; }
.sub-mod:has(input:focus-visible) { outline: 2px solid var(--theme-primary, #4f46e5); outline-offset: 2px; }
.sub-mod-ico { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 9px; color: var(--theme-primary, #4f46e5); background: rgba(var(--theme-primary-rgb, 79, 70, 229), .09); }
.sub-mod.is-locked .sub-mod-ico { color: var(--theme-text-secondary); background: var(--theme-background); }
.sub-mod-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.sub-mod-name { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; }
.sub-mod-desc { font-size: 12.5px; line-height: 1.45; color: var(--theme-text-secondary); }
.sub-chip-lock { gap: 4px; background: rgba(107, 114, 128, .18); color: var(--theme-text-secondary); }
.sub-mod-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 4px; }

.sub-danger { margin-bottom: 16px; padding: 12px 18px; border-radius: 14px; border: 1px solid var(--theme-border); background: var(--theme-surface); }
.sub-danger summary { cursor: pointer; font-size: 13.5px; font-weight: 600; color: var(--theme-text-secondary); }
.sub-danger form { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; margin-top: 12px; }
.sub-danger .sub-fields { width: 100%; }

.sub-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: var(--theme-text-secondary); font-size: 14px; }
.sub-spinner { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid var(--theme-border); border-top-color: var(--theme-primary, #4f46e5); animation: sub-spin .8s linear infinite; }
@keyframes sub-spin { to { transform: rotate(360deg); } }

@media (max-width: 860px) {
  .sub-pay { grid-template-columns: minmax(0, 1fr); }
  .sub-summary { position: static; }
}
@media (max-width: 520px) {
  .sub-top { flex-wrap: wrap; }
  .sub-head-actions { width: 100%; }
  .sub-head-actions .sub-btn { flex: 1; }
  .sub-cycle { width: 100%; }
  .sub-cycle button { flex: 1; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .sub-spinner { animation: none; }
}
`;
