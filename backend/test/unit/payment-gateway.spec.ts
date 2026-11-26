import { GatewayError, GATEWAY_CURRENCIES, KONNECT_URLS, PaymentGatewayService, gatewayDeps, toMinorUnits } from '../../src/modules/saas/payment-gateway.service';

/**
 * Passerelle de paiement par carte (Konnect). Aucun appel réseau réel : `gatewayDeps.fetch` est remplacé par un faux serveur.
 * Ce qu'on garantit ici : les montants envoyés sont exacts, la clé reste dans l'en-tête, et SEUL un paiement « completed »
 * dont une transaction a réussi est considéré comme encaissé.
 */

const ENV_KEYS = ['KONNECT_API_KEY', 'KONNECT_WALLET_ID', 'KONNECT_ENV', 'KONNECT_PAYMENT_METHODS', 'KONNECT_API_URL'] as const;
const saved: Record<string, string | undefined> = {};
const realFetch = gatewayDeps.fetch;

interface Call { url: string; init: RequestInit }
let calls: Call[] = [];

/** Réponse JSON d'un faux Konnect. */
const reply = (status: number, body: unknown) => async (url: string, init: RequestInit) => {
  calls.push({ url, init });
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
};

const configure = (env: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) => {
  process.env.KONNECT_API_KEY = 'cle-secrete-123';
  process.env.KONNECT_WALLET_ID = 'wallet-abc';
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
};

beforeEach(() => {
  for (const k of ENV_KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  calls = [];
});
afterEach(() => {
  for (const k of ENV_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  gatewayDeps.fetch = realFetch;
});

describe('toMinorUnits — montants dans la plus petite unité', () => {
  it('dollar et euro au centime, dinar au millime, sans erreur d’arrondi flottant', () => {
    expect(toMinorUnits(34.51, 'USD')).toBe(3451);
    expect(toMinorUnits(17.255, 'EUR')).toBe(1726);
    expect(toMinorUnits(49.98, 'TND')).toBe(49980);
    expect(toMinorUnits(0.1 + 0.2, 'USD')).toBe(30);
    expect(toMinorUnits(29, 'USD')).toBe(2900);
    expect(toMinorUnits(34.510, 'USD')).toBe(3451);
  });
  it('refuse une devise que le prestataire ne gère pas', () => {
    expect(() => toMinorUnits(10, 'MAD')).toThrow(GatewayError);
    expect(Object.keys(GATEWAY_CURRENCIES).sort()).toEqual(['EUR', 'TND', 'USD']);
  });
});

describe('PaymentGatewayService — configuration', () => {
  const gateway = new PaymentGatewayService();

  it('non configuré tant que la clé ET le portefeuille ne sont pas définis', () => {
    expect(gateway.isConfigured()).toBe(false);
    process.env.KONNECT_API_KEY = 'x';
    expect(gateway.isConfigured()).toBe(false);
    process.env.KONNECT_WALLET_ID = 'w';
    expect(gateway.isConfigured()).toBe(true);
    process.env.KONNECT_API_KEY = '   ';
    expect(gateway.isConfigured()).toBe(false);
  });

  it('production par défaut, bac à sable sur demande', () => {
    expect(gateway.mode()).toBe('production');
    process.env.KONNECT_ENV = 'SandBox';
    expect(gateway.mode()).toBe('sandbox');
    process.env.KONNECT_ENV = 'n’importe quoi';
    expect(gateway.mode()).toBe('production');
    expect(KONNECT_URLS.production).toMatch(/^https:\/\/api\.konnect\.network/);
    expect(KONNECT_URLS.sandbox).toMatch(/^https:\/\/api\.sandbox\.konnect\.network/);
  });

  it('moyens de paiement : carte et e-Dinar par défaut, liste filtrée sur les valeurs connues', () => {
    expect(gateway.info().methods).toEqual(['card', 'edinar']);
    process.env.KONNECT_PAYMENT_METHODS = 'bank_card, inconnu';
    expect(gateway.info().methods).toEqual(['card']);
    process.env.KONNECT_PAYMENT_METHODS = 'inconnu';
    expect(gateway.info().methods).toEqual(['card', 'edinar']);
    expect(gateway.supports('USD')).toBe(true);
    expect(gateway.supports('MAD')).toBe(false);
  });
});

describe('PaymentGatewayService.createCheckout', () => {
  const gateway = new PaymentGatewayService();
  const input = {
    orderId: '42', amount: 34.51, currency: 'USD', description: 'Inovexa ERP — formule Business', firstName: 'Sami', lastName: 'Trabelsi', email: 'sami@exemple.tn', phone: '+21622535181',
    webhookUrl: 'https://api.exemple.tn/public/payments/konnect/return', successUrl: 'https://www.exemple.tn/subscription?checkout=42', failUrl: 'https://www.exemple.tn/subscription?checkout=42', lifespanMinutes: 30,
  };

  it('refuse d’appeler le prestataire sans configuration', async () => {
    gatewayDeps.fetch = reply(200, {});
    await expect(gateway.createCheckout(input)).rejects.toThrow(/pas configuré/);
    expect(calls).toHaveLength(0);
  });

  it('envoie le montant en centimes, la clé dans l’en-tête et rend la page de paiement', async () => {
    configure({ KONNECT_ENV: 'sandbox' });
    gatewayDeps.fetch = reply(200, { payUrl: 'https://gateway.sandbox.konnect.network/pay?payment_ref=abc123', paymentRef: 'abc123' });
    const session = await gateway.createCheckout(input);
    expect(session).toEqual({ providerRef: 'abc123', payUrl: 'https://gateway.sandbox.konnect.network/pay?payment_ref=abc123' });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.sandbox.konnect.network/api/v2/payments/init-payment');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('cle-secrete-123');
    expect(calls[0].init.method).toBe('POST');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body).toMatchObject({
      receiverWalletId: 'wallet-abc', token: 'USD', amount: 3451, type: 'immediate', orderId: '42', lifespan: 30,
      webhook: input.webhookUrl, silentWebhook: false, checkoutForm: false, addPaymentFeesToAmount: false,
      acceptedPaymentMethods: ['bank_card', 'e-DINAR'], email: 'sami@exemple.tn', firstName: 'Sami',
    });
    // La clé ne part jamais dans le corps de la requête.
    expect(JSON.stringify(body)).not.toContain('cle-secrete-123');
  });

  it('adresse personnalisée (tests) et description tronquée à 280 caractères', async () => {
    configure({ KONNECT_API_URL: 'http://127.0.0.1:9999/api/v2/' });
    gatewayDeps.fetch = reply(200, { payUrl: 'http://127.0.0.1:9999/pay', paymentRef: 'ref-123456' });
    await gateway.createCheckout({ ...input, description: 'x'.repeat(500) });
    expect(calls[0].url).toBe('http://127.0.0.1:9999/api/v2/payments/init-payment');
    expect(JSON.parse(String(calls[0].init.body)).description).toHaveLength(280);
  });

  it('erreur du prestataire : message exploitable pour le journal, jamais la clé', async () => {
    configure();
    gatewayDeps.fetch = reply(401, { errors: [{ message: 'Invalid API key' }] });
    const err = await gateway.createCheckout(input).catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect(err.status).toBe(401);
    expect(err.message).toMatch(/401.*Invalid API key/);
    expect(err.message).not.toContain('cle-secrete-123');
  });

  it('réponse sans adresse de paiement ou avec une adresse non http : refusée', async () => {
    configure();
    gatewayDeps.fetch = reply(200, { paymentRef: 'abc123' });
    await expect(gateway.createCheckout(input)).rejects.toThrow(/inattendue/);
    gatewayDeps.fetch = reply(200, { payUrl: 'javascript:alert(1)', paymentRef: 'abc123' });
    await expect(gateway.createCheckout(input)).rejects.toThrow(/inattendue/);
  });

  it('réseau coupé : erreur claire plutôt qu’un plantage', async () => {
    configure();
    gatewayDeps.fetch = async () => { throw new Error('ECONNRESET'); };
    await expect(gateway.createCheckout(input)).rejects.toThrow(/injoignable.*ECONNRESET/);
  });

  it('devise non gérée : rien n’est envoyé', async () => {
    configure();
    gatewayDeps.fetch = reply(200, {});
    await expect(gateway.createCheckout({ ...input, currency: 'MAD' })).rejects.toThrow(GatewayError);
    expect(calls).toHaveLength(0);
  });
});

describe('PaymentGatewayService.fetchPayment — seule source de vérité', () => {
  const gateway = new PaymentGatewayService();
  const payment = (over: Record<string, unknown> = {}) => ({
    payment: { status: 'completed', amount: 3451, token: 'usd', orderId: 42, transactions: [{ status: 'success', method: 'bank_card' }], ...over },
  });

  it('« completed » avec une transaction réussie : encaissé, avec montant, devise, commande et moyen', async () => {
    configure();
    gatewayDeps.fetch = reply(200, payment());
    const p = await gateway.fetchPayment('abc123');
    expect(p).toEqual({ paid: true, status: 'completed', amountMinor: 3451, currency: 'USD', orderId: '42', method: 'card' });
    expect(calls[0].url).toBe('https://api.konnect.network/api/v2/payments/abc123');
    expect(calls[0].init.method).toBe('GET');
    expect((calls[0].init.headers as Record<string, string>)['x-api-key']).toBe('cle-secrete-123');
  });

  it('carte e-Dinar reconnue', async () => {
    configure();
    gatewayDeps.fetch = reply(200, payment({ transactions: [{ status: 'failed', method: 'bank_card' }, { status: 'success', method: 'e-DINAR' }] }));
    expect((await gateway.fetchPayment('abc123')).method).toBe('edinar');
  });

  it('« completed » sans aucune transaction détaillée : accepté (Konnect ne détaille pas toujours)', async () => {
    configure();
    gatewayDeps.fetch = reply(200, payment({ transactions: [] }));
    expect((await gateway.fetchPayment('abc123')).paid).toBe(true);
  });

  it('« completed » mais toutes les transactions ont échoué : PAS encaissé', async () => {
    configure();
    gatewayDeps.fetch = reply(200, payment({ transactions: [{ status: 'failed', method: 'bank_card' }] }));
    expect((await gateway.fetchPayment('abc123')).paid).toBe(false);
  });

  it('en attente, expiré ou inconnu : jamais encaissé', async () => {
    configure();
    for (const status of ['pending', 'expired', 'failed', '', 'COMPLETEDX']) {
      gatewayDeps.fetch = reply(200, payment({ status }));
      expect((await gateway.fetchPayment('abc123')).paid).toBe(false);
    }
  });

  it('état renvoyé en majuscules : reconnu', async () => {
    configure();
    gatewayDeps.fetch = reply(200, payment({ status: 'Completed' }));
    expect((await gateway.fetchPayment('abc123')).paid).toBe(true);
  });

  it('champs absents : null plutôt qu’une valeur inventée', async () => {
    configure();
    gatewayDeps.fetch = reply(200, { payment: { status: 'pending' } });
    expect(await gateway.fetchPayment('abc123')).toEqual({ paid: false, status: 'pending', amountMinor: null, currency: null, orderId: null, method: null });
  });

  it('référence invalide : aucun appel (pas d’injection dans l’adresse)', async () => {
    configure();
    gatewayDeps.fetch = reply(200, payment());
    for (const ref of ['', 'ab', '../../admin', 'abc 123', 'abc/123', 'a'.repeat(81)]) await expect(gateway.fetchPayment(ref)).rejects.toThrow(/invalide/);
    expect(calls).toHaveLength(0);
  });

  it('paiement introuvable chez le prestataire : erreur 404 propagée', async () => {
    configure();
    gatewayDeps.fetch = reply(404, { message: 'Payment not found' });
    const err = await gateway.fetchPayment('abc123').catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect(err.status).toBe(404);
  });
});
