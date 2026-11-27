import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Paiement en ligne — prestataire : Flouci (flouci.com), passerelle tunisienne agréée par la Banque centrale de Tunisie.
 * Le client paie par carte bancaire (Visa, Mastercard, cartes tunisiennes) ou avec l'application Flouci.
 *
 * Principe (API Flouci v2, documentation : https://docs.flouci.com) :
 *  1. POST /generate_payment  (en-tête Authorization: Bearer <public>:<privé>)  → { result: { payment_id, link } } :
 *     le client est envoyé sur « link » ;
 *  2. une fois le paiement traité, Flouci ramène le navigateur sur success_link / fail_link, et appelle en parallèle
 *     l'adresse « webhook » en GET ?payment_id=…&success=True|False, signée (en-tête X-Flouci-Signature) ;
 *  3. GET /verify_payment/:payment_id → { success: true, result: { status: "SUCCESS" | "PENDING" | "EXPIRED" | "FAILURE" … } } :
 *     SEULE cette lecture, faite par notre serveur avec nos clés, décide que le paiement est encaissé. Rien de ce que
 *     disent le navigateur ou la notification n'est cru sur parole.
 *
 * Configuration (variables d'environnement du serveur — les clés ne vont jamais dans la base, le code ou le navigateur) :
 *   FLOUCI_PUBLIC_TOKEN   jeton public de l'application (tableau de bord Flouci › Accepter en ligne › API)
 *   FLOUCI_PRIVATE_TOKEN  jeton privé de la même application (secret : il signe aussi les notifications)
 *   FLOUCI_ENV            « production » (par défaut) ou « test » : information seulement (Flouci utilise la même adresse ;
 *                         ce sont les clés de l'application « TEST APP » qui font un paiement de test, sans débit réel)
 *   FLOUCI_RATE_USD, FLOUCI_RATE_EUR…  taux de conversion vers le dinar (ex. FLOUCI_RATE_USD=3.10 : 1 USD = 3,10 TND).
 *                         Flouci encaisse UNIQUEMENT en dinars : si les formules sont dans une autre devise, le montant TTC
 *                         est converti à ce taux et le client voit le montant en dinars avant de payer.
 *   FLOUCI_ACCEPT_CARD    facultatif — « false » pour n'accepter que l'application Flouci (cartes acceptées par défaut)
 *   FLOUCI_API_URL        facultatif — remplace l'adresse de l'API (tests automatisés)
 *
 * Montants : Flouci les attend en millimes (1 TND = 1000 millimes).
 */

/** Adresse de l'API Flouci (la même en test et en production : seules les clés changent). */
export const FLOUCI_URL = 'https://developers.flouci.com/api/v2';
/** Valeur de subscription_payments.provider pour un paiement en ligne. */
export const ONLINE_PROVIDER = 'flouci';
/** Seule devise encaissée par Flouci. */
export const CHARGE_CURRENCY = 'TND';

/** Décimales de la plus petite unité des devises connues (millime pour le dinar, centime sinon). */
export const CURRENCY_DIGITS: Record<string, number> = { TND: 3, USD: 2, EUR: 2, GBP: 2, CAD: 2, CHF: 2, SAR: 2, AED: 2, MAD: 2, DZD: 2, LYD: 3 };
const TIMEOUT_MS = 15_000;
/** Ancienneté maximale acceptée pour une notification signée (contre le rejeu). */
const SIGNATURE_TOLERANCE_S = 300;

/** Remplaçable dans les tests : l'appel réseau vers le prestataire. */
export const gatewayDeps = {
  fetch: (url: string, init: RequestInit): Promise<Response> => fetch(url, init),
};

export interface GatewayInfo {
  provider: 'flouci';
  configured: boolean;
  mode: 'production' | 'sandbox';
  /** Moyens proposés sur la page de paiement, avec nos codes (card, flouci). */
  methods: string[];
  /** Devise réellement débitée (toujours TND). */
  chargeCurrency: string;
}

/** Conversion du montant des formules vers le dinar débité par Flouci. */
export interface ChargeQuote {
  currency: string;
  /** 1 unité de la devise des formules = rate TND (1 si les formules sont déjà en dinars). */
  rate: number;
  /** Montant débité, en dinars (arrondi au millime). */
  amount: number;
  /** Même montant en millimes, tel qu'envoyé à Flouci. */
  minor: number;
}

export interface CheckoutInput {
  /** Notre identifiant du paiement (subscription_payments.id) : renvoyé par Flouci (developer_tracking_id). */
  orderId: string;
  /** Montant à débiter, en millimes. */
  amountMinor: number;
  /** Adresse appelée par Flouci (GET ?payment_id=…&success=…) quand le paiement est traité. */
  webhookUrl: string;
  successUrl: string;
  failUrl: string;
  lifespanMinutes: number;
}

export interface CheckoutSession {
  providerRef: string;
  payUrl: string;
}

export interface GatewayPayment {
  /** true seulement quand Flouci déclare le paiement « SUCCESS ». */
  paid: boolean;
  /** Statut Flouci en minuscules : success, pending, expired, failure, system_failure… */
  status: string;
  /** true quand plus aucun paiement n'est attendu sur cette page (expirée ou refusée). */
  closed: boolean;
  /** Montant enregistré par Flouci, en millimes. */
  amountMinor: number | null;
  currency: string | null;
  orderId: string | null;
  method: string | null;
}

export interface ProbeResult {
  provider: 'flouci';
  mode: 'production' | 'sandbox';
  configured: boolean;
  /** null = non testé. */
  reachable: boolean | null;
  keyAccepted: boolean | null;
  /** Ouverture d'un vrai paiement de test (1 TND, jamais encaissé) acceptée ? null = non testé. */
  checkoutAccepted: boolean | null;
  message: string;
}

export class GatewayError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
  }
}

/** 34.51 USD → 3451 ; 49.980 TND → 49980. */
export function toMinorUnits(amount: number, currency: string): number {
  const digits = CURRENCY_DIGITS[String(currency || '').toUpperCase()] ?? 2;
  return Math.round(Number(amount) * 10 ** digits);
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Type de paiement annoncé par Flouci → notre code de moyen de paiement. */
const OUR_METHOD_CODE: Record<string, string> = { card: 'card', wallet: 'flouci', flouci: 'flouci', mpayment: 'other' };

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger('PaymentGateway');
  /** Lectures en cours chez Flouci, par paiement : des demandes simultanées partagent le même appel (Flouci limite les relectures). */
  private readonly inflight = new Map<string, Promise<GatewayPayment>>();

  private publicToken(): string {
    return (process.env.FLOUCI_PUBLIC_TOKEN || process.env.FLOUCI_PUBLIC_KEY || '').trim();
  }

  private privateToken(): string {
    return (process.env.FLOUCI_PRIVATE_TOKEN || process.env.FLOUCI_PRIVATE_KEY || '').trim();
  }

  mode(): 'production' | 'sandbox' {
    const env = (process.env.FLOUCI_ENV || '').trim().toLowerCase();
    return env === 'test' || env === 'sandbox' ? 'sandbox' : 'production';
  }

  private baseUrl(): string {
    const custom = (process.env.FLOUCI_API_URL || '').trim().replace(/\/+$/, '');
    return custom || FLOUCI_URL;
  }

  private acceptCard(): boolean {
    return (process.env.FLOUCI_ACCEPT_CARD || '').trim().toLowerCase() !== 'false';
  }

  isConfigured(): boolean {
    return !!this.publicToken() && !!this.privateToken();
  }

  info(): GatewayInfo {
    return {
      provider: 'flouci',
      configured: this.isConfigured(),
      mode: this.mode(),
      methods: this.acceptCard() ? ['card', 'flouci'] : ['flouci'],
      chargeCurrency: CHARGE_CURRENCY,
    };
  }

  /**
   * Taux vers le dinar pour la devise des formules : 1 pour TND, FLOUCI_RATE_<DEVISE> sinon (ex. FLOUCI_RATE_USD=3.10).
   * null = devise non encaissable (aucun taux défini, ou taux invalide).
   */
  rate(currency: string): number | null {
    const code = String(currency || '').trim().toUpperCase();
    if (code === CHARGE_CURRENCY) return 1;
    if (!/^[A-Z]{3}$/.test(code)) return null;
    const raw = (process.env[`FLOUCI_RATE_${code}`] || '').trim().replace(',', '.');
    const value = Number(raw);
    return raw && Number.isFinite(value) && value > 0 && value < 10_000 ? value : null;
  }

  supports(currency: string): boolean {
    return this.rate(currency) !== null;
  }

  /** Montant débité en dinars pour un montant TTC dans la devise des formules. */
  quote(amountTTC: number, currency: string): ChargeQuote {
    const rate = this.rate(currency);
    if (rate === null) throw new GatewayError(`Devise non encaissable par Flouci : ${currency} (définissez FLOUCI_RATE_${String(currency).toUpperCase()}).`);
    const amount = round3(Number(amountTTC) * rate);
    return { currency: CHARGE_CURRENCY, rate, amount, minor: toMinorUnits(amount, CHARGE_CURRENCY) };
  }

  private authorization(): string {
    return `Bearer ${this.publicToken()}:${this.privateToken()}`;
  }

  private async call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<{ status: number; data: any }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await gatewayDeps.fetch(`${this.baseUrl()}${path}`, {
        method,
        headers: { Authorization: this.authorization(), Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (e: any) {
      throw new GatewayError(e?.name === 'AbortError' ? 'Le prestataire de paiement ne répond pas (délai dépassé).' : `Prestataire de paiement injoignable : ${e?.message || e}`);
    } finally {
      clearTimeout(timer);
    }
    const raw = await res.text().catch(() => '');
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
    // Flouci signale aussi ses erreurs dans le corps : { result: { status: 404, message: "Payment not found" } }.
    const bodyStatus = Number(data?.result?.status);
    const status = !res.ok ? res.status : data?.success !== true && Number.isInteger(bodyStatus) && bodyStatus >= 400 ? bodyStatus : res.status;
    if (status >= 400) {
      // Le détail (clé refusée, paiement inconnu…) va dans le journal du serveur, jamais chez le client.
      const detail = data?.result?.message || data?.message || data?.detail || raw.slice(0, 200);
      throw new GatewayError(`Flouci a répondu ${status}${detail ? ` : ${String(detail).slice(0, 200)}` : ''}`, status);
    }
    return { status, data };
  }

  /** Ouvre un paiement chez Flouci et renvoie l'adresse de la page où le client paie. */
  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    if (!this.isConfigured()) throw new GatewayError('Le paiement en ligne n’est pas configuré.');
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) throw new GatewayError('Montant à débiter invalide.');
    const { data } = await this.call('POST', '/generate_payment', {
      amount: String(input.amountMinor),
      accept_card: this.acceptCard(),
      session_timeout_secs: Math.max(60, Math.round(input.lifespanMinutes * 60)),
      success_link: input.successUrl,
      fail_link: input.failUrl,
      webhook: input.webhookUrl,
      developer_tracking_id: input.orderId,
    });
    const result = data?.result ?? {};
    const providerRef = String(result.payment_id || '');
    const payUrl = String(result.link || '');
    if (result.success !== true || !/^[A-Za-z0-9_-]{6,80}$/.test(providerRef) || !/^https?:\/\//i.test(payUrl)) {
      throw new GatewayError('Réponse inattendue du prestataire de paiement (payment_id ou link absent).');
    }
    return { providerRef, payUrl };
  }

  /**
   * Test de connexion pour l'administrateur, avant d'encaisser un vrai client :
   *  1. les clés sont-elles acceptées ? (lecture d'un paiement inexistant : « clés refusées » = 401/403, « clés acceptées » = 404) ;
   *  2. si demandé, Flouci ouvre-t-il un paiement ? (paiement de 1 TND, jamais encaissé, qui expire seul au bout de 5 minutes).
   * Ne renvoie jamais les clés.
   */
  async probe(opts: { checkout?: boolean; webhookUrl?: string } = {}): Promise<ProbeResult> {
    const base = { provider: 'flouci' as const, mode: this.mode(), configured: this.isConfigured() };
    if (!this.isConfigured()) {
      return { ...base, reachable: null, keyAccepted: null, checkoutAccepted: null, message: 'FLOUCI_PUBLIC_TOKEN et FLOUCI_PRIVATE_TOKEN ne sont pas définis sur le serveur de l’API.' };
    }
    // Application Flouci attendue d'après FLOUCI_ENV (Flouci distingue le test de la production par les jetons seulement).
    const app = this.mode() === 'sandbox' ? 'l’application de test « TEST APP »' : 'votre application de production';
    try {
      await this.call('GET', '/verify_payment/inovexa-connection-test');
    } catch (e: any) {
      const status = e instanceof GatewayError ? e.status : null;
      if (status === null) return { ...base, reachable: false, keyAccepted: null, checkoutAccepted: null, message: `Flouci est injoignable depuis le serveur : ${String(e?.message || e).slice(0, 200)}` };
      if (status === 401 || status === 403) {
        return { ...base, reachable: true, keyAccepted: false, checkoutAccepted: null, message: `Flouci refuse les jetons. Vérifiez que FLOUCI_PUBLIC_TOKEN et FLOUCI_PRIVATE_TOKEN viennent tous deux de ${app} (tableau de bord Flouci › Accepter en ligne › API).` };
      }
      if (status >= 500) return { ...base, reachable: true, keyAccepted: null, checkoutAccepted: null, message: `Flouci répond par une erreur (${status}) : réessayez dans quelques minutes.` };
      // 404 / 400 : les clés sont acceptées, c'est le paiement de test qui n'existe pas — le résultat attendu.
    }
    if (!opts.checkout) return { ...base, reachable: true, keyAccepted: true, checkoutAccepted: null, message: `Jetons acceptés par Flouci (${app}).` };
    try {
      const hook = opts.webhookUrl || 'https://example.invalid/public/payments/flouci/webhook';
      await this.createCheckout({
        orderId: `connection-test-${Date.now()}`, amountMinor: 1000,
        webhookUrl: hook, successUrl: hook, failUrl: hook, lifespanMinutes: 5,
      });
      return { ...base, reachable: true, keyAccepted: true, checkoutAccepted: true, message: `Jetons acceptés et paiement ouvert par Flouci (${app}). Un paiement de test de 1 TND a été ouvert puis laissé expirer : ne le payez pas.` };
    } catch (e: any) {
      return { ...base, reachable: true, keyAccepted: true, checkoutAccepted: false, message: `Jetons acceptés, mais Flouci refuse d’ouvrir un paiement — vérifiez que votre compte marchand est activé pour le paiement en ligne. Détail : ${String(e?.message || e).slice(0, 200)}` };
    }
  }

  /**
   * État d'un paiement chez Flouci. C'est la seule source de vérité pour ouvrir un abonnement.
   * Des demandes simultanées pour le même paiement (retour du client, notification, autre onglet) partagent un seul appel.
   */
  async fetchPayment(providerRef: string): Promise<GatewayPayment> {
    if (!this.isConfigured()) throw new GatewayError('Le paiement en ligne n’est pas configuré.');
    if (!/^[A-Za-z0-9_-]{6,80}$/.test(providerRef)) throw new GatewayError('Référence de paiement invalide.');
    const running = this.inflight.get(providerRef);
    if (running) return running;
    const job = this.readPayment(providerRef).finally(() => this.inflight.delete(providerRef));
    this.inflight.set(providerRef, job);
    return job;
  }

  private async readPayment(providerRef: string): Promise<GatewayPayment> {
    const { data } = await this.call('GET', `/verify_payment/${encodeURIComponent(providerRef)}`);
    // La documentation exige « success: true » avant de lire le reste de la réponse.
    if (data?.success !== true) throw new GatewayError('Réponse inattendue du prestataire de paiement (success absent).');
    const p = data?.result ?? {};
    const status = String(p.status || '').toLowerCase();
    const num = (v: unknown) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
    const paid = status === 'success';
    const type = String(p.type || '').toLowerCase();
    return {
      paid,
      status: status || 'unknown',
      closed: ['expired', 'failure', 'system_failure'].includes(status),
      amountMinor: num(p.amount),
      currency: CHARGE_CURRENCY,
      orderId: p.developer_tracking_id !== undefined && p.developer_tracking_id !== null && p.developer_tracking_id !== '' ? String(p.developer_tracking_id) : null,
      method: paid ? OUR_METHOD_CODE[type] || null : null,
    };
  }

  /**
   * Vérifie la signature d'une notification Flouci (en-tête X-Flouci-Signature: t=<horodatage>,v1=<HMAC-SHA256 hexadécimal>).
   * Message signé : « <t>.payment_id=<payment_id>&success=<success> », clé : le jeton privé. Refusée si trop ancienne.
   */
  verifyWebhookSignature(header: string | undefined, paymentId: string, success: string, nowMs = Date.now()): boolean {
    const secret = this.privateToken();
    if (!secret || !header) return false;
    const parts = new Map<string, string>();
    for (const piece of String(header).split(',')) {
      const at = piece.indexOf('=');
      if (at > 0) parts.set(piece.slice(0, at).trim(), piece.slice(at + 1).trim());
    }
    const t = parts.get('t') || '';
    const given = (parts.get('v1') || '').toLowerCase();
    if (!/^\d{9,11}$/.test(t) || !/^[0-9a-f]{64}$/.test(given)) return false;
    if (Math.abs(Math.floor(nowMs / 1000) - Number(t)) > SIGNATURE_TOLERANCE_S) return false;
    const expected = createHmac('sha256', secret).update(`${t}.payment_id=${paymentId}&success=${success}`).digest('hex');
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(given, 'hex'));
  }
}
