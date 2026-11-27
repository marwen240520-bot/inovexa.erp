import { createHmac } from 'crypto';
import { CHARGE_CURRENCY, FLOUCI_URL, GatewayError, ONLINE_PROVIDER, PaymentGatewayService, gatewayDeps, toMinorUnits } from '../../src/modules/saas/payment-gateway.service';

/**
 * Passerelle de paiement en ligne (Flouci). Aucun appel réseau réel : `gatewayDeps.fetch` est remplacé par un faux serveur.
 * Ce qu'on garantit ici : les montants envoyés sont exacts (en millimes, convertis en dinars au taux du serveur), les clés
 * restent dans l'en-tête Authorization, SEUL un paiement « SUCCESS » est considéré comme encaissé, et une notification
 * n'est acceptée que si sa signature est valide.
 */

const ENV_KEYS = ['FLOUCI_PUBLIC_TOKEN', 'FLOUCI_PRIVATE_TOKEN', 'FLOUCI_PUBLIC_KEY', 'FLOUCI_PRIVATE_KEY', 'FLOUCI_ENV', 'FLOUCI_API_URL', 'FLOUCI_ACCEPT_CARD', 'FLOUCI_RATE_USD', 'FLOUCI_RATE_EUR'] as const;
const saved: Record<string, string | undefined> = {};
const realFetch = gatewayDeps.fetch;
const PUBLIC = 'pub-0000-1111';
const PRIVATE = 'priv-secret-2222';

interface Call { url: string; init: RequestInit }
let calls: Call[] = [];

/** Réponse JSON d'un faux Flouci. */
const reply = (status: number, body: unknown) => async (url: string, init: RequestInit) => {
  calls.push({ url, init });
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
};

const configure = (env: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) => {
  process.env.FLOUCI_PUBLIC_TOKEN = PUBLIC;
  process.env.FLOUCI_PRIVATE_TOKEN = PRIVATE;
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
    expect(toMinorUnits(106.981, 'TND')).toBe(106981);
    expect(toMinorUnits(10, 'tnd')).toBe(10000);
  });
  it('Flouci : fournisseur « flouci », débit en dinars, adresse officielle', () => {
    expect(ONLINE_PROVIDER).toBe('flouci');
    expect(CHARGE_CURRENCY).toBe('TND');
    expect(FLOUCI_URL).toBe('https://developers.flouci.com/api/v2');
  });
});

describe('PaymentGatewayService — configuration', () => {
  const gateway = new PaymentGatewayService();

  it('non configuré tant que le jeton public ET le jeton privé ne sont pas définis', () => {
    expect(gateway.isConfigured()).toBe(false);
    process.env.FLOUCI_PUBLIC_TOKEN = 'x';
    expect(gateway.isConfigured()).toBe(false);
    process.env.FLOUCI_PRIVATE_TOKEN = 'y';
    expect(gateway.isConfigured()).toBe(true);
    process.env.FLOUCI_PUBLIC_TOKEN = '   ';
    expect(gateway.isConfigured()).toBe(false);
  });

  it('noms alternatifs FLOUCI_PUBLIC_KEY / FLOUCI_PRIVATE_KEY acceptés', () => {
    process.env.FLOUCI_PUBLIC_KEY = 'a';
    process.env.FLOUCI_PRIVATE_KEY = 'b';
    expect(gateway.isConfigured()).toBe(true);
  });

  it('production par défaut, mode test sur demande', () => {
    expect(gateway.mode()).toBe('production');
    process.env.FLOUCI_ENV = 'Test';
    expect(gateway.mode()).toBe('sandbox');
    process.env.FLOUCI_ENV = 'sandbox';
    expect(gateway.mode()).toBe('sandbox');
    process.env.FLOUCI_ENV = 'n’importe quoi';
    expect(gateway.mode()).toBe('production');
  });

  it('moyens : carte et application Flouci par défaut ; application seule si FLOUCI_ACCEPT_CARD=false', () => {
    expect(gateway.info()).toMatchObject({ provider: 'flouci', methods: ['card', 'flouci'], chargeCurrency: 'TND' });
    process.env.FLOUCI_ACCEPT_CARD = 'false';
    expect(gateway.info().methods).toEqual(['flouci']);
  });

  it('devises : TND tel quel ; une autre devise seulement avec un taux valide (FLOUCI_RATE_<DEVISE>)', () => {
    expect(gateway.rate('TND')).toBe(1);
    expect(gateway.supports('USD')).toBe(false);
    process.env.FLOUCI_RATE_USD = '3.10';
    expect(gateway.rate('USD')).toBe(3.1);
    expect(gateway.rate('usd')).toBe(3.1);
    process.env.FLOUCI_RATE_EUR = '3,35'; // virgule décimale acceptée
    expect(gateway.rate('EUR')).toBe(3.35);
    for (const bad of ['0', '-2', 'abc', '', '99999']) {
      process.env.FLOUCI_RATE_USD = bad;
      expect(gateway.rate('USD')).toBeNull();
    }
    expect(gateway.supports('MAD')).toBe(false);
    expect(gateway.rate('../X')).toBeNull();
  });

  it('conversion du montant TTC en dinars, arrondie au millime', () => {
    process.env.FLOUCI_RATE_USD = '3.1';
    expect(gateway.quote(34.51, 'USD')).toEqual({ currency: 'TND', rate: 3.1, amount: 106.981, minor: 106981 });
    expect(gateway.quote(49.98, 'TND')).toEqual({ currency: 'TND', rate: 1, amount: 49.98, minor: 49980 });
    expect(() => gateway.quote(10, 'MAD')).toThrow(/FLOUCI_RATE_MAD/);
  });
});

describe('PaymentGatewayService.createCheckout', () => {
  const gateway = new PaymentGatewayService();
  const input = {
    orderId: '42', amountMinor: 106981,
    webhookUrl: 'https://api.exemple.tn/public/payments/flouci/webhook', successUrl: 'https://www.exemple.tn/subscription?checkout=42', failUrl: 'https://www.exemple.tn/subscription?checkout=42', lifespanMinutes: 30,
  };
  const ok = { result: { success: true, payment_id: 'AgCKuBm0S5uLPghBo571MQ', link: 'https://checkout.flouci.com/inovexa/AgCKuBm0S5uLPghBo571MQ', developer_tracking_id: '42' }, name: 'developers', code: 0, version: 'v2' };

  it('refuse d’appeler le prestataire sans configuration', async () => {
    gatewayDeps.fetch = reply(200, ok);
    await expect(gateway.createCheckout(input)).rejects.toThrow(/pas configuré/);
    expect(calls).toHaveLength(0);
  });

  it('envoie le montant en millimes, les clés dans l’en-tête et rend la page de paiement', async () => {
    configure();
    gatewayDeps.fetch = reply(200, ok);
    const session = await gateway.createCheckout(input);
    expect(session).toEqual({ providerRef: 'AgCKuBm0S5uLPghBo571MQ', payUrl: 'https://checkout.flouci.com/inovexa/AgCKuBm0S5uLPghBo571MQ' });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://developers.flouci.com/api/v2/generate_payment');
    expect(calls[0].init.method).toBe('POST');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${PUBLIC}:${PRIVATE}`);
    const body = JSON.parse(String(calls[0].init.body));
    expect(body).toEqual({
      amount: '106981', accept_card: true, session_timeout_secs: 1800,
      success_link: input.successUrl, fail_link: input.failUrl, webhook: input.webhookUrl, developer_tracking_id: '42',
    });
    // Les clés ne partent jamais dans le corps de la requête.
    expect(JSON.stringify(body)).not.toContain(PRIVATE);
    expect(JSON.stringify(body)).not.toContain(PUBLIC);
  });

  it('cartes refusées sur demande (FLOUCI_ACCEPT_CARD=false) ; adresse personnalisée pour les tests', async () => {
    configure({ FLOUCI_ACCEPT_CARD: 'false', FLOUCI_API_URL: 'http://127.0.0.1:9999/api/v2/' });
    gatewayDeps.fetch = reply(200, { result: { success: true, payment_id: 'ref-123456', link: 'http://127.0.0.1:9999/pay/ref-123456' } });
    await gateway.createCheckout(input);
    expect(calls[0].url).toBe('http://127.0.0.1:9999/api/v2/generate_payment');
    expect(JSON.parse(String(calls[0].init.body)).accept_card).toBe(false);
  });

  it('montant invalide : rien n’est envoyé', async () => {
    configure();
    gatewayDeps.fetch = reply(200, ok);
    for (const amountMinor of [0, -5, 12.5, Number.NaN]) await expect(gateway.createCheckout({ ...input, amountMinor })).rejects.toThrow(/invalide/);
    expect(calls).toHaveLength(0);
  });

  it('erreur du prestataire (HTTP ou dans le corps) : message exploitable pour le journal, jamais les clés', async () => {
    configure();
    gatewayDeps.fetch = reply(401, { detail: 'Invalid token' });
    let err = await gateway.createCheckout(input).catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect(err.status).toBe(401);
    expect(err.message).toMatch(/401.*Invalid token/);
    expect(err.message).not.toContain(PRIVATE);
    gatewayDeps.fetch = reply(200, { result: { status: 400, message: 'Bad Request' } });
    err = await gateway.createCheckout(input).catch((e) => e);
    expect(err.status).toBe(400);
    expect(err.message).toMatch(/400.*Bad Request/);
  });

  it('réponse sans adresse de paiement, sans succès ou avec une adresse non http : refusée', async () => {
    configure();
    gatewayDeps.fetch = reply(200, { result: { success: true, payment_id: 'abc123' } });
    await expect(gateway.createCheckout(input)).rejects.toThrow(/inattendue/);
    gatewayDeps.fetch = reply(200, { result: { success: false, payment_id: 'abc123', link: 'https://checkout.flouci.com/x' } });
    await expect(gateway.createCheckout(input)).rejects.toThrow(/inattendue/);
    gatewayDeps.fetch = reply(200, { result: { success: true, payment_id: 'abc123', link: 'javascript:alert(1)' } });
    await expect(gateway.createCheckout(input)).rejects.toThrow(/inattendue/);
    gatewayDeps.fetch = reply(200, { result: { success: true, payment_id: '../../x', link: 'https://checkout.flouci.com/x' } });
    await expect(gateway.createCheckout(input)).rejects.toThrow(/inattendue/);
  });

  it('réseau coupé : erreur claire plutôt qu’un plantage', async () => {
    configure();
    gatewayDeps.fetch = async () => { throw new Error('ECONNRESET'); };
    await expect(gateway.createCheckout(input)).rejects.toThrow(/injoignable.*ECONNRESET/);
  });
});

describe('PaymentGatewayService.fetchPayment — seule source de vérité', () => {
  const gateway = new PaymentGatewayService();
  const verified = (over: Record<string, unknown> = {}) => ({
    success: true,
    result: { type: 'card', amount: 106981, status: 'SUCCESS', details: { order_number: 'x' }, developer_tracking_id: '42', settlement_status: 'PROCESSING', ...over },
    status_code: 200, name: 'developers', code: 0, version: '2.0.0',
  });

  it('« SUCCESS » : encaissé, avec montant en millimes, dinars, commande et moyen', async () => {
    configure();
    gatewayDeps.fetch = reply(200, verified());
    const p = await gateway.fetchPayment('AgCKuBm0S5uLPghBo571MQ');
    expect(p).toEqual({ paid: true, status: 'success', closed: false, amountMinor: 106981, currency: 'TND', orderId: '42', method: 'card' });
    expect(calls[0].url).toBe('https://developers.flouci.com/api/v2/verify_payment/AgCKuBm0S5uLPghBo571MQ');
    expect(calls[0].init.method).toBe('GET');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(`Bearer ${PUBLIC}:${PRIVATE}`);
  });

  it('payé avec l’application Flouci : moyen « flouci »', async () => {
    configure();
    gatewayDeps.fetch = reply(200, verified({ type: 'wallet' }));
    expect((await gateway.fetchPayment('abc123')).method).toBe('flouci');
  });

  it('en attente : pas encaissé, page toujours ouverte', async () => {
    configure();
    gatewayDeps.fetch = reply(200, verified({ status: 'PENDING' }));
    expect(await gateway.fetchPayment('abc123')).toMatchObject({ paid: false, closed: false, status: 'pending', method: null });
  });

  it('expiré, refusé, panne : pas encaissé, et plus rien n’est attendu sur cette page', async () => {
    configure();
    for (const status of ['EXPIRED', 'FAILURE', 'SYSTEM_FAILURE']) {
      gatewayDeps.fetch = reply(200, verified({ status }));
      expect(await gateway.fetchPayment('abc123')).toMatchObject({ paid: false, closed: true });
    }
  });

  it('pré-autorisation, état vide ou inconnu : jamais encaissé', async () => {
    configure();
    for (const status of ['PREAUTH_SUCCESS', '', 'SUCCESSX', 'completed']) {
      gatewayDeps.fetch = reply(200, verified({ status }));
      expect((await gateway.fetchPayment('abc123')).paid).toBe(false);
    }
  });

  it('« success » absent de la réponse : refusé, même si le statut dit SUCCESS', async () => {
    configure();
    gatewayDeps.fetch = reply(200, { result: { status: 'SUCCESS', amount: 106981 } });
    await expect(gateway.fetchPayment('abc123')).rejects.toThrow(/inattendue/);
  });

  it('champs absents : null plutôt qu’une valeur inventée', async () => {
    configure();
    gatewayDeps.fetch = reply(200, { success: true, result: { status: 'PENDING' } });
    expect(await gateway.fetchPayment('abc123')).toEqual({ paid: false, status: 'pending', closed: false, amountMinor: null, currency: 'TND', orderId: null, method: null });
  });

  it('référence invalide : aucun appel (pas d’injection dans l’adresse)', async () => {
    configure();
    gatewayDeps.fetch = reply(200, verified());
    for (const ref of ['', 'ab', '../../admin', 'abc 123', 'abc/123', 'a'.repeat(81)]) await expect(gateway.fetchPayment(ref)).rejects.toThrow(/invalide/);
    expect(calls).toHaveLength(0);
  });

  it('paiement introuvable (404 dans le corps, réponse HTTP 200) : erreur 404 propagée', async () => {
    configure();
    gatewayDeps.fetch = reply(200, { result: { status: 404, message: 'Payment not found' } });
    const err = await gateway.fetchPayment('abc123').catch((e) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect(err.status).toBe(404);
  });

  it('demandes simultanées pour le même paiement : un seul appel à Flouci', async () => {
    configure();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => { release = r; });
    gatewayDeps.fetch = async (url, init) => {
      calls.push({ url, init });
      await gate;
      return new Response(JSON.stringify(verified()), { status: 200 });
    };
    const all = Promise.all([gateway.fetchPayment('abc123'), gateway.fetchPayment('abc123'), gateway.fetchPayment('abc123')]);
    release();
    const results = await all;
    expect(results.every((r) => r.paid)).toBe(true);
    expect(calls).toHaveLength(1);
    // La lecture terminée, une nouvelle demande refait un appel (aucune réponse gardée en cache).
    await gateway.fetchPayment('abc123');
    expect(calls).toHaveLength(2);
  });
});

describe('PaymentGatewayService.verifyWebhookSignature — notifications signées', () => {
  const gateway = new PaymentGatewayService();
  const now = 1_791_014_400_000;
  const sign = (t: number, id: string, success: string, key = PRIVATE) => `t=${t},v1=${createHmac('sha256', key).update(`${t}.payment_id=${id}&success=${success}`).digest('hex')}`;

  it('signature correcte et récente : acceptée', () => {
    configure();
    const t = now / 1000;
    expect(gateway.verifyWebhookSignature(sign(t, 'AgCK123456', 'True'), 'AgCK123456', 'True', now)).toBe(true);
    expect(gateway.verifyWebhookSignature(sign(t - 120, 'AgCK123456', 'False'), 'AgCK123456', 'False', now)).toBe(true);
  });

  it('refusée : autre paiement, autre résultat, autre clé, trop ancienne, mal formée ou absente', () => {
    configure();
    const t = now / 1000;
    expect(gateway.verifyWebhookSignature(sign(t, 'AgCK123456', 'True'), 'AutrePaiement1', 'True', now)).toBe(false);
    expect(gateway.verifyWebhookSignature(sign(t, 'AgCK123456', 'False'), 'AgCK123456', 'True', now)).toBe(false);
    expect(gateway.verifyWebhookSignature(sign(t, 'AgCK123456', 'True', 'autre-cle'), 'AgCK123456', 'True', now)).toBe(false);
    expect(gateway.verifyWebhookSignature(sign(t - 301, 'AgCK123456', 'True'), 'AgCK123456', 'True', now)).toBe(false);
    expect(gateway.verifyWebhookSignature(sign(t + 400, 'AgCK123456', 'True'), 'AgCK123456', 'True', now)).toBe(false);
    for (const bad of [undefined, '', 'v1=abc', `t=${t}`, `t=${t},v1=zz`, `t=abc,v1=${'0'.repeat(64)}`]) {
      expect(gateway.verifyWebhookSignature(bad, 'AgCK123456', 'True', now)).toBe(false);
    }
  });

  it('sans jeton privé sur le serveur : toujours refusée', () => {
    const t = now / 1000;
    expect(gateway.verifyWebhookSignature(sign(t, 'AgCK123456', 'True'), 'AgCK123456', 'True', now)).toBe(false);
  });
});

describe('PaymentGatewayService.probe — test de connexion avant la mise en production', () => {
  const gateway = new PaymentGatewayService();
  /** Faux Flouci qui répond selon la route : lecture d'un paiement inexistant, ouverture d'un paiement. */
  const flouci = (opts: { key?: 'ok' | 'refused' | 'down' | 'error'; checkout?: 'ok' | 'refused' } = {}) => async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (opts.key === 'down') throw new Error('ECONNREFUSED');
    if (opts.key === 'refused') return json(401, { detail: 'Invalid token' });
    if (opts.key === 'error') return json(503, { message: 'maintenance' });
    if (init.method === 'GET') return json(200, { result: { status: 404, message: 'Payment not found' } });
    if (opts.checkout === 'refused') return json(200, { result: { status: 400, message: 'Merchant not activated' } });
    return json(200, { result: { success: true, payment_id: 'probe123456', link: 'https://checkout.flouci.com/x/probe123456' } });
  };

  it('sans configuration : rien n’est appelé, le message dit quoi définir', async () => {
    gatewayDeps.fetch = flouci();
    const r = await gateway.probe({ checkout: true });
    expect(r).toMatchObject({ provider: 'flouci', configured: false, reachable: null, keyAccepted: null, checkoutAccepted: null });
    expect(r.message).toMatch(/FLOUCI_PUBLIC_TOKEN/);
    expect(calls).toHaveLength(0);
  });

  it('clés acceptées (404 sur le paiement de test) : un seul appel, aucun paiement ouvert', async () => {
    configure();
    gatewayDeps.fetch = flouci();
    const r = await gateway.probe();
    expect(r).toMatchObject({ configured: true, reachable: true, keyAccepted: true, checkoutAccepted: null, mode: 'production' });
    expect(calls).toHaveLength(1);
    expect(calls[0].init.method).toBe('GET');
  });

  it('clés refusées (401) : le message cite l’application et ne contient jamais les clés', async () => {
    configure({ FLOUCI_ENV: 'test' });
    gatewayDeps.fetch = flouci({ key: 'refused' });
    const r = await gateway.probe({ checkout: true });
    expect(r).toMatchObject({ reachable: true, keyAccepted: false, checkoutAccepted: null, mode: 'sandbox' });
    expect(r.message).toMatch(/TEST APP/);
    expect(JSON.stringify(r)).not.toContain(PRIVATE);
    expect(JSON.stringify(r)).not.toContain(PUBLIC);
    expect(calls).toHaveLength(1); // les clés sont refusées : on n'essaie pas d'ouvrir un paiement
  });

  it('Flouci injoignable ou en panne : résultat « inconnu », pas de faux verdict', async () => {
    configure();
    gatewayDeps.fetch = flouci({ key: 'down' });
    expect(await gateway.probe()).toMatchObject({ reachable: false, keyAccepted: null });
    gatewayDeps.fetch = flouci({ key: 'error' });
    expect(await gateway.probe()).toMatchObject({ reachable: true, keyAccepted: null });
  });

  it('test complet : paiement de test de 1 TND (jamais encaissé), valable 5 minutes, adresse de notification transmise', async () => {
    configure();
    gatewayDeps.fetch = flouci();
    const r = await gateway.probe({ checkout: true, webhookUrl: 'https://api.exemple.tn/public/payments/flouci/webhook' });
    expect(r).toMatchObject({ keyAccepted: true, checkoutAccepted: true });
    expect(calls).toHaveLength(2);
    const body = JSON.parse(String(calls[1].init.body));
    expect(body).toMatchObject({ amount: '1000', session_timeout_secs: 300, webhook: 'https://api.exemple.tn/public/payments/flouci/webhook' });
    expect(String(body.developer_tracking_id)).toMatch(/^connection-test-/);
  });

  it('ouverture refusée : clés acceptées mais paiement refusé, avec le détail de Flouci', async () => {
    configure();
    gatewayDeps.fetch = flouci({ checkout: 'refused' });
    const r = await gateway.probe({ checkout: true });
    expect(r).toMatchObject({ keyAccepted: true, checkoutAccepted: false });
    expect(r.message).toMatch(/Merchant not activated/);
    expect(JSON.stringify(r)).not.toContain(PRIVATE);
  });
});
