import { Injectable, Logger } from '@nestjs/common';

/**
 * Paiement en ligne par carte bancaire — prestataire : Konnect (konnect.network), passerelle tunisienne qui accepte
 * les cartes bancaires nationales et internationales et la carte e-Dinar.
 *
 * Principe (API Konnect v2) :
 *  1. POST /payments/init-payment  (en-tête x-api-key)  → { payUrl, paymentRef } : le client est envoyé sur payUrl ;
 *  2. une fois le paiement traité, Konnect appelle l'adresse « webhook » en GET avec ?payment_ref=… ;
 *  3. GET /payments/:paymentRef    → { payment: { status: "completed" | "pending", … } } : SEULE cette lecture, faite
 *     par notre serveur avec notre clé, décide que le paiement est encaissé. Rien de ce que dit le navigateur
 *     n'est cru.
 *
 * Configuration (variables d'environnement du serveur — la clé ne va jamais dans la base ni dans le navigateur) :
 *   KONNECT_API_KEY          clé d'API de votre organisation (tableau de bord Konnect)
 *   KONNECT_WALLET_ID        identifiant du portefeuille qui reçoit les paiements
 *   KONNECT_ENV              « production » (par défaut) ou « sandbox » (bac à sable : cartes de test, aucun débit réel)
 *   KONNECT_PAYMENT_METHODS  facultatif — par défaut « bank_card,e-DINAR » (valeurs permises : bank_card, e-DINAR, wallet)
 *   KONNECT_API_URL          facultatif — remplace l'adresse de l'API (tests automatisés)
 *
 * Montants : Konnect les attend dans la plus petite unité — millimes pour le dinar, centimes pour l'euro et le dollar.
 * Un paiement en EUR ou en USD est converti par Konnect : le marchand est toujours crédité en dinars.
 */

export const KONNECT_URLS = {
  production: 'https://api.konnect.network/api/v2',
  sandbox: 'https://api.sandbox.konnect.network/api/v2',
} as const;

/** Devises acceptées par Konnect, avec le nombre de décimales de leur plus petite unité. */
export const GATEWAY_CURRENCIES: Record<string, number> = { TND: 3, EUR: 2, USD: 2 };

/** Moyens de paiement Konnect proposés par défaut : carte bancaire et carte e-Dinar. */
const DEFAULT_METHODS = ['bank_card', 'e-DINAR'];
// Valeurs acceptées par Konnect pour acceptedPaymentMethods (documentation v2) : carte bancaire, carte e-Dinar, portefeuille Konnect.
const KNOWN_METHODS = ['bank_card', 'e-DINAR', 'wallet'];
const TIMEOUT_MS = 15_000;

/** Remplaçable dans les tests : l'appel réseau vers le prestataire. */
export const gatewayDeps = {
  fetch: (url: string, init: RequestInit): Promise<Response> => fetch(url, init),
};

export interface GatewayInfo {
  provider: 'konnect';
  configured: boolean;
  mode: 'production' | 'sandbox';
  /** Moyens proposés sur la page de paiement, avec nos codes (card, edinar, wallet). */
  methods: string[];
  currencies: string[];
}

export interface CheckoutInput {
  /** Notre identifiant du paiement (subscription_payments.id) : renvoyé par Konnect, il relie les deux côtés. */
  orderId: string;
  /** Montant TTC dans la devise (ex. 34.51). */
  amount: number;
  currency: string;
  description: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  /** Adresse appelée par Konnect (GET ?payment_ref=…) quand le paiement est traité. */
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
  /** true seulement quand Konnect déclare le paiement « completed ». */
  paid: boolean;
  status: string;
  /** Montant enregistré par Konnect, dans la plus petite unité de la devise. */
  amountMinor: number | null;
  /** Montant déjà réglé (reachedAmount) : inférieur au montant demandé = paiement partiel, jamais accepté. */
  reachedMinor: number | null;
  currency: string | null;
  orderId: string | null;
  method: string | null;
}

export interface ProbeResult {
  provider: 'konnect';
  mode: 'production' | 'sandbox';
  configured: boolean;
  /** null = non testé. */
  reachable: boolean | null;
  keyAccepted: boolean | null;
  walletAccepted: boolean | null;
  message: string;
}

export class GatewayError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
  }
}

/** 34.51 USD → 3451 ; 49.980 TND → 49980. */
export function toMinorUnits(amount: number, currency: string): number {
  const digits = GATEWAY_CURRENCIES[currency];
  if (digits === undefined) throw new GatewayError(`Devise non prise en charge par le paiement en ligne : ${currency}.`);
  return Math.round(Number(amount) * 10 ** digits);
}

const OUR_METHOD_CODE: Record<string, string> = { bank_card: 'card', 'e-DINAR': 'edinar', wallet: 'wallet' };

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger('PaymentGateway');

  private apiKey(): string {
    return (process.env.KONNECT_API_KEY || '').trim();
  }

  private walletId(): string {
    return (process.env.KONNECT_WALLET_ID || '').trim();
  }

  mode(): 'production' | 'sandbox' {
    return (process.env.KONNECT_ENV || '').trim().toLowerCase() === 'sandbox' ? 'sandbox' : 'production';
  }

  private baseUrl(): string {
    const custom = (process.env.KONNECT_API_URL || '').trim().replace(/\/+$/, '');
    return custom || KONNECT_URLS[this.mode()];
  }

  private methods(): string[] {
    const asked = (process.env.KONNECT_PAYMENT_METHODS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const list = asked.filter((m) => KNOWN_METHODS.includes(m));
    return list.length ? list : DEFAULT_METHODS;
  }

  isConfigured(): boolean {
    return !!this.apiKey() && !!this.walletId();
  }

  info(): GatewayInfo {
    return {
      provider: 'konnect',
      configured: this.isConfigured(),
      mode: this.mode(),
      methods: this.methods().map((m) => OUR_METHOD_CODE[m] || m),
      currencies: Object.keys(GATEWAY_CURRENCIES),
    };
  }

  supports(currency: string): boolean {
    return GATEWAY_CURRENCIES[String(currency)] !== undefined;
  }

  private async call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await gatewayDeps.fetch(`${this.baseUrl()}${path}`, {
        method,
        headers: { 'x-api-key': this.apiKey(), Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
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
    if (!res.ok) {
      // Le détail (clé refusée, portefeuille inconnu…) va dans le journal du serveur, jamais chez le client.
      const detail = data?.errors?.[0]?.message || data?.message || raw.slice(0, 200);
      throw new GatewayError(`Konnect a répondu ${res.status}${detail ? ` : ${detail}` : ''}`, res.status);
    }
    return data;
  }

  /** Ouvre un paiement chez Konnect et renvoie l'adresse de la page où le client saisit sa carte. */
  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    if (!this.isConfigured()) throw new GatewayError('Le paiement en ligne n’est pas configuré.');
    const data = await this.call('POST', '/payments/init-payment', {
      receiverWalletId: this.walletId(),
      token: input.currency,
      amount: toMinorUnits(input.amount, input.currency),
      type: 'immediate',
      description: input.description.slice(0, 280),
      acceptedPaymentMethods: this.methods(),
      lifespan: input.lifespanMinutes,
      checkoutForm: false,
      addPaymentFeesToAmount: false,
      firstName: input.firstName || undefined,
      lastName: input.lastName || undefined,
      phoneNumber: input.phone || undefined,
      email: input.email || undefined,
      orderId: input.orderId,
      webhook: input.webhookUrl,
      silentWebhook: false,
      successUrl: input.successUrl,
      failUrl: input.failUrl,
      theme: 'light',
    });
    const providerRef = String(data?.paymentRef || '');
    const payUrl = String(data?.payUrl || '');
    if (!providerRef || !/^https?:\/\//i.test(payUrl)) throw new GatewayError('Réponse inattendue du prestataire de paiement (payUrl ou paymentRef absent).');
    return { providerRef, payUrl };
  }

  /**
   * Test de connexion pour l'administrateur, avant d'encaisser un vrai client :
   *  1. la clé d'API est-elle acceptée ? (lecture d'un paiement inexistant : « clé refusée » = 401/403, « clé acceptée » = 404) ;
   *  2. si demandé, le portefeuille est-il reconnu ? (ouverture d'un paiement de 1 TND, jamais encaissé, qui expire seul).
   * Ne renvoie jamais la clé ni l'identifiant du portefeuille.
   */
  async probe(opts: { wallet?: boolean; webhookUrl?: string } = {}): Promise<ProbeResult> {
    const base = { provider: 'konnect' as const, mode: this.mode(), configured: this.isConfigured() };
    if (!this.isConfigured()) {
      return { ...base, reachable: null, keyAccepted: null, walletAccepted: null, message: 'KONNECT_API_KEY et KONNECT_WALLET_ID ne sont pas définis sur le serveur de l’API.' };
    }
    const where = this.mode() === 'sandbox' ? 'bac à sable (sandbox)' : 'production';
    try {
      await this.call('GET', '/payments/inovexa-connection-test');
    } catch (e: any) {
      const status = e instanceof GatewayError ? e.status : null;
      if (status === null) return { ...base, reachable: false, keyAccepted: null, walletAccepted: null, message: `Konnect est injoignable depuis le serveur : ${String(e?.message || e).slice(0, 200)}` };
      if (status === 401 || status === 403) {
        return { ...base, reachable: true, keyAccepted: false, walletAccepted: null, message: `Konnect refuse la clé d’API. Vérifiez qu’elle vient bien de l’environnement « ${where} » du tableau de bord Konnect (les clés du bac à sable ne marchent pas en production, et inversement).` };
      }
      if (status >= 500) return { ...base, reachable: true, keyAccepted: null, walletAccepted: null, message: `Konnect répond par une erreur (${status}) : réessayez dans quelques minutes.` };
      // 404 / 400 : la clé a été acceptée, c'est le paiement de test qui n'existe pas — le résultat attendu.
    }
    if (!opts.wallet) return { ...base, reachable: true, keyAccepted: true, walletAccepted: null, message: `Clé d’API acceptée par Konnect (${where}).` };
    try {
      const hook = opts.webhookUrl || 'https://example.invalid/public/payments/konnect/return';
      await this.createCheckout({
        orderId: `connection-test-${Date.now()}`, amount: 1, currency: 'TND', description: 'Test de connexion Inovexa ERP — ne pas payer',
        webhookUrl: hook, successUrl: hook, failUrl: hook, lifespanMinutes: 5,
      });
      return { ...base, reachable: true, keyAccepted: true, walletAccepted: true, message: `Clé d’API et portefeuille acceptés par Konnect (${where}). Un paiement de test de 1 TND a été ouvert puis laissé expirer : ne le payez pas.` };
    } catch (e: any) {
      return { ...base, reachable: true, keyAccepted: true, walletAccepted: false, message: `Clé acceptée, mais Konnect refuse d’ouvrir un paiement — vérifiez KONNECT_WALLET_ID (identifiant du portefeuille du tableau de bord). Détail : ${String(e?.message || e).slice(0, 200)}` };
    }
  }

  /** État d'un paiement chez Konnect. C'est la seule source de vérité pour ouvrir un abonnement. */
  async fetchPayment(providerRef: string): Promise<GatewayPayment> {
    if (!this.isConfigured()) throw new GatewayError('Le paiement en ligne n’est pas configuré.');
    if (!/^[A-Za-z0-9_-]{6,80}$/.test(providerRef)) throw new GatewayError('Référence de paiement invalide.');
    const data = await this.call('GET', `/payments/${encodeURIComponent(providerRef)}`);
    const p = data?.payment ?? data ?? {};
    const status = String(p.status || '').toLowerCase();
    const transactions: any[] = Array.isArray(p.transactions) ? p.transactions : [];
    const succeeded = transactions.find((t) => String(t?.status || '').toLowerCase() === 'success');
    // « completed » = encaissé. Quand Konnect détaille les transactions, l'une d'elles doit avoir réussi.
    const num = (v: unknown) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
    const amountMinor = num(p.amount);
    const reachedMinor = num(p.reachedAmount);
    // Nous n'ouvrons que des paiements « immediate » : un montant réglé inférieur au montant demandé n'est jamais un encaissement.
    const partial = amountMinor !== null && reachedMinor !== null && reachedMinor < amountMinor;
    const paid = status === 'completed' && !partial && (transactions.length === 0 || !!succeeded);
    if (status === 'completed' && !paid) this.logger.warn(`Paiement ${providerRef} « completed » mais ${partial ? 'réglé en partie seulement' : 'sans transaction réussie'} : non pris en compte.`);
    return {
      paid,
      status: status || 'unknown',
      amountMinor,
      reachedMinor,
      currency: p.token ? String(p.token).toUpperCase() : null,
      orderId: p.orderId !== undefined && p.orderId !== null ? String(p.orderId) : null,
      method: succeeded?.method ? OUR_METHOD_CODE[String(succeeded.method)] || String(succeeded.method) : null,
    };
  }
}
