// Tests de bout en bout du parcours 100 % en ligne :
//  1. paiement PAR CARTE (faux Konnect) : l'abonnement s'ouvre tout seul, sans administrateur — montant calculé côté
//     serveur, reprise de la même page, montant ou commande truqués, confirmations simultanées, essai expiré puis payé
//     sans retour sur le site, panne du prestataire, limite par heure, compte suspendu ;
//  2. secteur et modules choisis par le client lui-même (dans la limite de sa formule) ;
//  3. agenda (rendez-vous) et projets : règles métier, isolation entre sociétés, droits liés aux modules.
// Lancé par run.sh sur une base neuve créée par les migrations (DATABASE_URL, BASE). Le serveur de l'ERP est démarré avec
// SMTP_* et KONNECT_* pointant vers les faux serveurs démarrés ci-dessous (voir fakes.js) : aucun vrai paiement, aucun
// vrai email, aucun accès à Internet.
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { startFakeKonnect, startFakeSmtp } = require('./fakes');

const BASE = process.env.BASE || 'http://127.0.0.1:4101';
const FRONT = 'http://localhost:3000';
let passes = 0, failures = 0;
function check(name, cond, extra) {
  if (cond) { passes++; console.log('  ok  ', name); }
  else { failures++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 600) : ''); }
}
async function call(method, path, opts = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}), ...(opts.headers || {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}
/** Appel qui ne suit pas les redirections (retour du prestataire de paiement). */
async function rawGet(path) {
  const res = await fetch(BASE + path, { method: 'GET', redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PASSWORD = 'Essai#2026ok';
const signup = (over = {}) => ({ name: 'Sami Trabelsi', companyName: 'Société', email: 'x@test.tn', phone: '22 535 181', password: PASSWORD, sector: 'commerce', acceptTerms: true, ...over });
const slot = (h, m = 0) => new Date(Date.UTC(2031, 5, 10, h, m)).toISOString();
const monthsBetween = (a, b) => (new Date(b).getTime() - new Date(a).getTime()) / (86400000 * 30.4375);

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const one = async (sql, params) => (await db.query(sql, params)).rows[0];
  const smtp = await startFakeSmtp(Number(process.env.FAKE_SMTP_PORT));
  const konnect = await startFakeKonnect(Number(process.env.FAKE_KONNECT_PORT));
  const KPORT = Number(process.env.FAKE_KONNECT_PORT);

  /** Inscrit une société puis confirme son adresse avec le code reçu par email, comme le ferait le client. */
  const signUp = async (over) => {
    const seen = smtp.mails.length;
    const r = await call('POST', '/auth/register', { body: signup(over) });
    if (r.status !== 201) return { r };
    const user = { token: r.body.access_token, id: r.body.user.id, r, account: r.body.account };
    if (r.body.verification?.required) {
      const code = await smtp.codeFor(over.email, seen);
      user.verify = await call('POST', '/auth/verify-email-code', { token: user.token, body: { code } });
    }
    return user;
  };
  const auditCount = async (action, userId) => (await one('SELECT COUNT(*)::int AS n FROM audit_logs WHERE action = $1 AND "userId" = $2', [action, userId])).n;
  const waitMail = async (to, needle, timeoutMs = 6000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const m = smtp.mails.find((x) => x.to.includes(to) && x.text.includes(needle));
      if (m) return m;
      await sleep(80);
    }
    return null;
  };
  /** Ouvre une page de paiement par carte et renvoie { co, ref }. */
  const checkout = async (user, planCode, billingCycle) => {
    const r = await call('POST', '/billing/checkout', { token: user.token, headers: { Origin: FRONT }, body: { planCode, billingCycle } });
    return { r, co: r.body, ref: r.status === 201 ? konnect.refFromPayUrl(r.body.payUrl) : null };
  };
  const verify = (user, id) => call('POST', `/billing/checkout/${id}/verify`, { token: user.token });

  await db.query(`INSERT INTO users (email,password,name,role,modules) VALUES ($1,$2,'Admin','admin','{}')`, ['admin@test.tn', await bcrypt.hash('Admin#2026-secret', 10)]);
  let r = await call('POST', '/auth/login', { body: { email: 'admin@test.tn', password: 'Admin#2026-secret' } });
  const admin = r.body.access_token;
  let row, w;

  // ═════════════════════════ 1. Paiement par carte : parcours complet ═════════════════════════
  console.log('— Paiement par carte (faux Konnect) : parcours complet, sans administrateur');
  const P1 = await signUp({ email: 'p1@test.tn', companyName: 'Boutique P1', sector: 'commerce' });
  const P2 = await signUp({ email: 'p2@test.tn', companyName: 'Boutique P2', sector: 'commerce' });
  check('deux sociétés créées, adresses confirmées par le code', P1.r.status === 201 && P1.verify?.status === 200 && P2.r.status === 201 && P2.verify?.status === 200, [P1.r, P2.r]);
  const trialEnd1 = P1.account.trialEndsAt;

  r = await call('GET', '/billing/subscription', { token: P1.token });
  check('avant tout paiement : aucune page ouverte, carte disponible, aucun paiement hors ligne', r.status === 200 && r.body.checkout === null && r.body.pendingPayment === null && r.body.payment.online.enabled === true && r.body.payment.manual === false, r.body.payment);
  r = await call('POST', '/billing/checkout', { body: { planCode: 'business', billingCycle: 'monthly' } });
  check('sans connexion : 401', r.status === 401, r);
  r = await call('POST', '/billing/checkout', { token: P1.token, body: {} });
  check('formule non précisée : 400', r.status === 400, r);
  r = await call('POST', '/billing/checkout', { token: P1.token, body: { planCode: 'inexistante', billingCycle: 'monthly' } });
  check('formule inconnue : 400', r.status === 400, r);
  r = await call('POST', '/admin/plans', { token: admin, body: { code: 'devis', name: 'Sur devis', priceMonthly: null, priceAnnual: null, isPublic: true, isActive: true } });
  const planQuote = r.body;
  r = await call('POST', '/admin/plans', { token: admin, body: { code: 'offert', name: 'Offert', priceMonthly: 0, priceAnnual: 0, isPublic: true, isActive: true } });
  const planFree = r.body;
  check('deux formules particulières créées par l’administrateur (sur devis, gratuite)', !!planQuote?.id && !!planFree?.id, [planQuote, planFree]);
  r = await call('POST', '/billing/checkout', { token: P1.token, body: { planCode: 'devis', billingCycle: 'monthly' } });
  check('formule sur devis : pas de paiement en ligne (400)', r.status === 400 && /devis/i.test(String(r.body.message)), r);
  r = await call('POST', '/billing/checkout', { token: P1.token, body: { planCode: 'offert', billingCycle: 'monthly' } });
  check('formule gratuite : rien à payer (400)', r.status === 400 && /gratuite/i.test(String(r.body.message)), r);
  await call('DELETE', `/admin/plans/${planQuote.id}`, { token: admin });
  await call('DELETE', `/admin/plans/${planFree.id}`, { token: admin });
  check('aucun de ces refus n’a été transmis au prestataire de paiement', konnect.initCount() === 0, konnect.initCount());

  r = await call('POST', '/billing/checkout', { token: P1.token, headers: { Origin: FRONT }, body: { planCode: 'business', billingCycle: 'monthly', amountTTC: 1, amountHT: 1, amount: 1, currency: 'TND', userId: P2.id } });
  check('carte : page de paiement ouverte — 29 $ HT + 19 % = 34,51 $ TTC calculés par le serveur, pas ceux du navigateur', r.status === 201 && r.body.amountTTC === 34.51 && r.body.currency === 'USD' && r.body.resumed === false && Number.isInteger(r.body.id) && r.body.payUrl.startsWith(`http://127.0.0.1:${KPORT}/pay/`) && Math.abs(new Date(r.body.expiresAt).getTime() - (Date.now() + 30 * 60_000)) < 60_000, r);
  const co1 = r.body;
  const ref1 = konnect.refFromPayUrl(co1.payUrl);
  const init1 = konnect.lastInit();
  check('Konnect reçoit la clé secrète du serveur, le portefeuille, 3451 centimes USD et notre numéro de commande', konnect.initCount() === 1 && init1.headers['x-api-key'] === 'e2e-konnect-key' && init1.body.receiverWalletId === 'e2e-wallet' && init1.body.amount === 3451 && init1.body.token === 'USD' && init1.body.orderId === String(co1.id) && init1.body.type === 'immediate', init1.body);
  check('adresses : notification serveur sur l’API, retour du client sur la page Abonnement du site', init1.body.webhook === `${BASE}/public/payments/konnect/return` && init1.body.successUrl === `${FRONT}/subscription?checkout=${co1.id}` && init1.body.failUrl === init1.body.successUrl, init1.body);
  check('le client est identifié chez Konnect, cartes bancaires acceptées, page valable 30 min', init1.body.email === 'p1@test.tn' && init1.body.firstName === 'Sami' && init1.body.lastName === 'Trabelsi' && init1.body.acceptedPaymentMethods.includes('bank_card') && init1.body.lifespan === 30, init1.body);
  row = await one('SELECT * FROM subscription_payments WHERE id = $1', [co1.id]);
  check('enregistrement « initiated » : Konnect, référence, montants figés, retour vers le site d’origine', row.status === 'initiated' && row.provider === 'konnect' && row.method === 'card' && row.providerRef === ref1 && Number(row.amountHT) === 29 && Number(row.amountTTC) === 34.51 && Number(row.vatRate) === 19 && row.currency === 'USD' && row.returnBase === FRONT && row.declaredBy === 'client' && row.validatedBy === null && row.receiptNumber === null && row.userId === P1.id, row);
  r = await call('GET', '/billing/subscription', { token: P1.token });
  check('la page Abonnement retrouve la page de paiement ouverte', r.body.checkout?.id === co1.id && r.body.checkout.payUrl === co1.payUrl && r.body.pendingPayment === null && r.body.account.status === 'TRIAL', r.body.checkout);
  r = await call('GET', '/billing/payments', { token: P1.token });
  check('l’historique du client ne montre pas les pages de paiement non abouties', r.status === 200 && r.body.length === 0, r.body);
  r = await call('POST', '/billing/checkout', { token: P1.token, headers: { Origin: FRONT }, body: { planCode: 'business', billingCycle: 'monthly' } });
  check('même choix redemandé : la même page est reprise, aucun doublon chez Konnect', r.status === 201 && r.body.resumed === true && r.body.id === co1.id && r.body.payUrl === co1.payUrl && konnect.initCount() === 1, r.body);

  r = await verify(P1, co1.id);
  check('retour sans paiement : « en attente », rien n’est activé', r.status === 200 && r.body.status === 'pending' && r.body.account.status === 'TRIAL' && r.body.payment.status === 'initiated', r.body);
  r = await verify(P2, co1.id);
  check('la page de paiement d’une autre société est introuvable (« unknown »)', r.status === 200 && r.body.status === 'unknown' && r.body.payment === null, r.body);
  w = await rawGet(`/public/payments/konnect/return?payment_ref=${ref1}`);
  check('notification de Konnect avant paiement : le client est ramené sur sa page Abonnement', w.status === 302 && w.location === `${FRONT}/subscription?checkout=${co1.id}`, w);
  w = await rawGet('/public/payments/konnect/return?payment_ref=inconnu123');
  check('référence inconnue : simple retour sur le site, aucune erreur', w.status === 302 && w.location === `${FRONT}/subscription`, w);
  w = await rawGet('/public/payments/konnect/return');
  check('référence absente : simple retour sur le site', w.status === 302 && w.location === `${FRONT}/subscription`, w);
  r = await call('POST', `/public/payments/konnect/return?payment_ref=${ref1}`);
  check('notification en POST : accusé de réception', r.status === 200 && r.body.received === true, r);
  row = await one('SELECT "accountStatus", "subscriptionEnd" FROM users WHERE id = $1', [P1.id]);
  check('toujours en essai après toutes ces notifications sans paiement', row.accountStatus === 'TRIAL' && row.subscriptionEnd === null, row);

  // Konnect annonce autre chose que ce que nous avons demandé : l'abonnement ne s'ouvre pas.
  konnect.pay(ref1, { amount: 100 });
  r = await verify(P1, co1.id);
  check('Konnect annonce un autre MONTANT (1,00 $ au lieu de 34,51 $) : abonnement NON ouvert', r.body.status === 'pending' && r.body.account.status === 'TRIAL', r.body);
  konnect.pay(ref1, { orderId: '999999' });
  r = await verify(P1, co1.id);
  check('Konnect annonce une autre COMMANDE : abonnement NON ouvert', r.body.status === 'pending' && r.body.account.status === 'TRIAL', r.body);
  konnect.pay(ref1, { transactions: [{ status: 'failure', method: 'bank_card' }] });
  r = await verify(P1, co1.id);
  check('« completed » sans aucune transaction réussie : pas encaissé', r.body.status === 'pending' && r.body.account.status === 'TRIAL', r.body);
  konnect.setStatus(ref1, 'pending');
  r = await verify(P1, co1.id);
  row = await one('SELECT status FROM subscription_payments WHERE id = $1', [co1.id]);
  check('paiement encore en cours chez Konnect : en attente, toujours « initiated » en base', r.body.status === 'pending' && row.status === 'initiated', [r.body, row]);
  check('les deux écarts (montant, commande) sont tracés dans le journal pour l’administrateur', (await auditCount('payment_mismatch', P1.id)) === 2, await auditCount('payment_mismatch', P1.id));

  // Le client paie.
  konnect.pay(ref1);
  r = await verify(P1, co1.id);
  check('paiement confirmé par Konnect : abonnement ouvert tout de suite, sans administrateur', r.status === 200 && r.body.status === 'paid' && r.body.payment.status === 'validated' && /^REC-\d{4}-\d{5}$/.test(r.body.payment.receiptNumber) && r.body.account.status === 'ACTIVE' && r.body.account.blocked === false, r.body);
  const receipt1 = r.body.payment.receiptNumber;
  row = await one('SELECT * FROM subscription_payments WHERE id = $1', [co1.id]);
  check('validé automatiquement : aucun administrateur, carte, référence Konnect, page de paiement effacée', row.status === 'validated' && row.validatedBy === null && row.method === 'card' && row.reference === ref1 && row.checkoutUrl === null && row.receiptNumber === receipt1 && !!row.validatedAt, row);
  check('période payée : commence à la fin de l’essai (aucun jour gratuit perdu), dure un mois', Math.abs(new Date(row.periodStart).getTime() - new Date(trialEnd1).getTime()) < 2000 && monthsBetween(row.periodStart, row.periodEnd) > 0.9 && monthsBetween(row.periodStart, row.periodEnd) < 1.1, row);
  r = await call('GET', '/billing/subscription', { token: P1.token });
  check('abonnement : formule Business, 10 utilisateurs, plus de page ouverte', r.body.account.status === 'ACTIVE' && r.body.account.planCode === 'business' && r.body.plan.code === 'business' && r.body.users.limit === 10 && r.body.checkout === null, r.body.account);
  r = await call('GET', '/clients', { token: P1.token });
  check('l’ERP reste ouvert', r.status === 200, r);

  r = await verify(P1, co1.id);
  check('retour répété : même résultat, aucun second encaissement', r.body.status === 'paid' && r.body.payment.receiptNumber === receipt1, r.body);
  w = await rawGet(`/public/payments/konnect/return?payment_ref=${ref1}`);
  check('notification de Konnect reçue après coup : sans effet', w.status === 302, w);
  row = await one(`SELECT COUNT(*) FILTER (WHERE status = 'validated')::int AS validated, COUNT(*)::int AS total FROM subscription_payments WHERE "userId" = $1`, [P1.id]);
  check('un seul paiement, validé, un seul reçu', row.validated === 1 && row.total === 1, row);
  check('journal : « paiement reçu » une seule fois', (await auditCount('payment_received', P1.id)) === 1, await auditCount('payment_received', P1.id));
  r = await call('GET', '/billing/payments', { token: P1.token });
  check('historique du client : le paiement validé, avec son reçu', r.body.length === 1 && r.body[0].status === 'validated' && r.body[0].receiptNumber === receipt1 && r.body[0].method === 'card', r.body);
  r = await call('GET', `/billing/payments/${co1.id}/receipt`, { token: P1.token });
  check('reçu : 34,51 $ TTC, avec la mention qu’il ne remplace pas la facture légale', r.status === 200 && r.body.amountTTC === 34.51 && r.body.currency === 'USD' && /facture légale/.test(r.body.notice), r);
  const mail1 = await waitMail('p1@test.tn', receipt1);
  check('un email de reçu part vers le client', !!mail1 && /carte/.test(mail1.text), mail1?.text.slice(0, 300));
  r = await call('GET', '/admin/overview', { token: admin });
  check('administrateur : 1 client payant, 29 $ HT de revenu (34,51 $ TTC), rien à valider à la main', r.body.customers.paying === 1 && r.body.revenue.ht === 29 && r.body.revenue.ttc === 34.51 && r.body.mrr === 29 && r.body.pendingPayments === 0, { customers: r.body.customers, revenue: r.body.revenue, mrr: r.body.mrr });
  r = await call('GET', '/admin/payments?status=validated', { token: admin });
  const adminRow = r.body.items?.find((i) => i.id === co1.id);
  check('l’administrateur voit le paiement en ligne, validé sans lui', r.status === 200 && adminRow && adminRow.provider === 'konnect' && adminRow.validatedBy === null && adminRow.account.email === 'p1@test.tn', adminRow);

  // ─── Plusieurs confirmations simultanées ───
  console.log('— Confirmations simultanées : un seul encaissement');
  const c2 = await checkout(P2, 'starter', 'monthly');
  check('P2 : page de paiement Starter ouverte (15 $ HT = 17,85 $ TTC)', c2.r.status === 201 && c2.co.amountTTC === 17.85, c2.r);
  konnect.pay(c2.ref);
  const burst = await Promise.all([
    ...Array.from({ length: 6 }, () => verify(P2, c2.co.id)),
    rawGet(`/public/payments/konnect/return?payment_ref=${c2.ref}`),
    rawGet(`/public/payments/konnect/return?payment_ref=${c2.ref}`),
    call('POST', `/public/payments/konnect/return?payment_ref=${c2.ref}`),
  ]);
  check('6 retours du client et 3 notifications de Konnect en même temps : tous aboutissent', burst.slice(0, 6).every((x) => x.status === 200 && x.body.status === 'paid') && burst[6].status === 302 && burst[7].status === 302 && burst[8].status === 200, burst.map((x) => x.status));
  row = await one(`SELECT COUNT(*) FILTER (WHERE status = 'validated')::int AS validated, COUNT("receiptNumber")::int AS receipts, MAX("periodEnd") AS "periodEnd" FROM subscription_payments WHERE "userId" = $1`, [P2.id]);
  const subEnd2 = (await one('SELECT "subscriptionEnd" FROM users WHERE id = $1', [P2.id])).subscriptionEnd;
  check('un seul paiement validé, un seul reçu, une seule période (la fin de l’abonnement = la fin de cette période)', row.validated === 1 && row.receipts === 1 && new Date(row.periodEnd).getTime() === new Date(subEnd2).getTime(), row);
  check('journal : « paiement reçu » une seule fois', (await auditCount('payment_received', P2.id)) === 1, await auditCount('payment_received', P2.id));

  // ─── Essai terminé pendant que le client payait : le balayage reconnaît le paiement ───
  console.log('— Essai expiré, paiement fait sans retour sur le site : reconnu par le balayage');
  const P3 = await signUp({ email: 'p3@test.tn', companyName: 'Boutique P3', sector: 'commerce' });
  const c3 = await checkout(P3, 'starter', 'annual');
  check('P3 : page Starter annuelle ouverte (150 $ HT = 178,50 $ TTC)', c3.r.status === 201 && c3.co.amountTTC === 178.5, c3.r);
  konnect.pay(c3.ref);
  await db.query(`UPDATE users SET "trialStartedAt" = now() - interval '72 hours 1 minute', "trialEndsAt" = now() - interval '1 minute' WHERE id = $1`, [P3.id]);
  r = await call('POST', '/admin/maintenance/sweep', { token: admin });
  check('balayage : le paiement est reconnu AVANT de juger l’essai fini — le compte n’est pas expiré', r.status === 200 && r.body.checkouts.paid === 1 && r.body.expired === 0, r.body);
  row = await one('SELECT "accountStatus", "planCode", "subscriptionEnd", "statusReason" FROM users WHERE id = $1', [P3.id]);
  check('P3 : actif, formule Starter, abonnement d’un an à partir de maintenant', row.accountStatus === 'ACTIVE' && row.planCode === 'starter' && row.statusReason === null && monthsBetween(new Date(), row.subscriptionEnd) > 11.9 && monthsBetween(new Date(), row.subscriptionEnd) < 12.1, row);
  row = await one(`SELECT "periodStart" FROM subscription_payments WHERE id = $1`, [c3.co.id]);
  check('l’essai étant déjà fini, la période payée commence au moment de l’encaissement', Math.abs(new Date(row.periodStart).getTime() - Date.now()) < 60_000, row);
  r = await call('GET', '/clients', { token: P3.token });
  check('P3 retrouve l’ERP sans avoir rien fait', r.status === 200, r);
  r = await call('POST', '/admin/maintenance/sweep', { token: admin });
  check('second balayage : rien à refaire', r.body.checkouts.paid === 0 && r.body.expired === 0, r.body);

  // ─── Paiement reconnu à l'ouverture de la page Abonnement (autre onglet) ───
  console.log('— Paiement fait dans un autre onglet : reconnu en rouvrant la page Abonnement');
  const P8 = await signUp({ email: 'p8@test.tn', companyName: 'Boutique P8', sector: 'commerce' });
  const c8 = await checkout(P8, 'business', 'annual');
  konnect.pay(c8.ref);
  r = await call('GET', '/billing/subscription', { token: P8.token });
  check('en ouvrant simplement la page Abonnement : abonnement Business annuel ouvert', r.status === 200 && r.body.account.status === 'ACTIVE' && r.body.plan.code === 'business' && r.body.checkout === null && r.body.account.billingCycle !== 'monthly', r.body.account);

  // ─── Pannes du prestataire ───
  console.log('— Pannes du prestataire de paiement');
  const P4 = await signUp({ email: 'p4@test.tn', companyName: 'Boutique P4', sector: 'commerce' });
  konnect.state.failInit = true;
  r = await call('POST', '/billing/checkout', { token: P4.token, headers: { Origin: 'https://pirate.example' }, body: { planCode: 'starter', billingCycle: 'monthly' } });
  check('Konnect en panne à l’ouverture : 502 clair, sans aucun détail technique', r.status === 502 && r.body.code === 'PAYMENT_PROVIDER_ERROR' && !/konnect|e2e-konnect-key|e2e-wallet|Internal error/i.test(JSON.stringify(r.body)), r);
  konnect.state.failInit = false;
  row = await one('SELECT status, note, "checkoutUrl" FROM subscription_payments WHERE "userId" = $1 ORDER BY id DESC LIMIT 1', [P4.id]);
  check('l’ouverture manquée est refermée et notée pour l’administrateur ; aucune page ouverte', row.status === 'expired' && /refusée/.test(String(row.note)) && row.checkoutUrl === null, row);
  r = await call('GET', '/billing/subscription', { token: P4.token });
  check('le client n’a aucune page de paiement ouverte et peut réessayer', r.body.checkout === null && r.body.account.status === 'TRIAL', r.body.checkout);
  const c4 = await checkout(P4, 'starter', 'monthly');
  check('Konnect revenu : nouvelle page ouverte', c4.r.status === 201 && c4.co.resumed === false, c4.r);
  row = await one('SELECT "returnBase" FROM subscription_payments WHERE id = $1', [c4.co.id]);
  check('un site inconnu ne devient jamais l’adresse de retour du client', row.returnBase === FRONT, row);
  r = await call('POST', '/billing/checkout', { token: P4.token, headers: { Origin: 'https://pirate.example' }, body: { planCode: 'starter', billingCycle: 'monthly' } });
  row = await one('SELECT "returnBase" FROM subscription_payments WHERE id = $1', [r.body.id]);
  check('même avec l’en-tête Origin d’un site inconnu, retour vers le site officiel', r.status === 201 && row.returnBase === FRONT, row);
  konnect.pay(c4.ref);
  konnect.state.failGet = true;
  r = await verify(P4, c4.co.id);
  check('Konnect injoignable au retour du client : « en attente » (pas d’erreur), rien d’activé', r.status === 200 && r.body.status === 'pending' && r.body.account.status === 'TRIAL', r.body);
  konnect.state.failGet = false;
  r = await verify(P4, c4.co.id);
  check('Konnect revenu : le paiement est reconnu', r.body.status === 'paid' && r.body.account.status === 'ACTIVE', r.body);

  // ─── Limite par heure ───
  console.log('— Limite de tentatives par heure');
  const P5 = await signUp({ email: 'p5@test.tn', companyName: 'Boutique P5', sector: 'commerce' });
  await db.query(`INSERT INTO subscription_payments ("userId","planCode","planName","billingCycle","periodMonths","amountHT","vatRate","amountTTC",currency,method,provider,status,"declaredBy")
                  SELECT $1,'starter','Starter','monthly',1,15,19,17.85,'USD','card','konnect','expired','client' FROM generate_series(1,12)`, [P5.id]);
  const before5 = konnect.initCount();
  r = await call('POST', '/billing/checkout', { token: P5.token, headers: { Origin: FRONT }, body: { planCode: 'starter', billingCycle: 'monthly' } });
  check('12 tentatives dans l’heure : la 13e est refusée (429) sans appeler Konnect', r.status === 429 && konnect.initCount() === before5, r);
  await db.query(`UPDATE subscription_payments SET "createdAt" = now() - interval '2 hours' WHERE "userId" = $1`, [P5.id]);
  r = await call('POST', '/billing/checkout', { token: P5.token, headers: { Origin: FRONT }, body: { planCode: 'starter', billingCycle: 'monthly' } });
  check('une heure plus tard : de nouveau possible', r.status === 201, r);

  // ─── Page refermée mais payée, puis changement de formule ───
  console.log('— Page de paiement refermée mais payée quand même ; passage à une formule supérieure');
  const P6 = await signUp({ email: 'p6@test.tn', companyName: 'Boutique P6', sector: 'commerce' });
  const c6a = await checkout(P6, 'starter', 'monthly');
  const c6b = await checkout(P6, 'business', 'annual');
  check('autre choix : nouvelle page (Business annuel, 345,10 $ TTC) ; l’ancienne est refermée', c6a.r.status === 201 && c6b.r.status === 201 && c6b.co.resumed === false && c6b.co.amountTTC === 345.1 && c6b.co.id !== c6a.co.id, [c6a.r.body, c6b.r.body]);
  row = await one('SELECT status, "checkoutUrl" FROM subscription_payments WHERE id = $1', [c6a.co.id]);
  check('l’ancienne page est « expired », sans adresse de paiement', row.status === 'expired' && row.checkoutUrl === null, row);
  r = await call('GET', '/billing/subscription', { token: P6.token });
  check('une seule page est proposée au client : la dernière', r.body.checkout?.id === c6b.co.id, r.body.checkout);
  konnect.pay(c6a.ref);
  r = await verify(P6, c6a.co.id);
  check('le client a payé l’ancienne page quand même : l’encaissement est reconnu, rien n’est perdu', r.body.status === 'paid' && r.body.account.status === 'ACTIVE' && r.body.account.planCode === 'starter', r.body);
  const first6 = await one('SELECT "periodStart", "periodEnd" FROM subscription_payments WHERE id = $1', [c6a.co.id]);
  r = await verify(P6, c6b.co.id);
  check('la page Business n’est pas payée : en attente, le compte reste sur Starter', r.body.status === 'pending' && r.body.account.planCode === 'starter', r.body);
  konnect.pay(c6b.ref);
  r = await verify(P6, c6b.co.id);
  const second6 = await one('SELECT "periodStart", "periodEnd" FROM subscription_payments WHERE id = $1', [c6b.co.id]);
  check('puis payée : passage à Business, la nouvelle période s’ajoute à la suite de la première (aucun jour payé perdu)', r.body.status === 'paid' && r.body.account.planCode === 'business' && new Date(second6.periodStart).getTime() === new Date(first6.periodEnd).getTime() && monthsBetween(second6.periodStart, second6.periodEnd) > 11.9, [r.body.account, first6, second6]);

  // ─── Le prestataire annonce une autre devise ───
  console.log('— Le prestataire annonce le montant dans une autre devise (conversion en dinars)');
  const P7 = await signUp({ email: 'p7@test.tn', companyName: 'Boutique P7', sector: 'commerce' });
  const c7 = await checkout(P7, 'starter', 'monthly');
  konnect.pay(c7.ref, { token: 'TND', amount: 54000, orderId: '123456' });
  r = await verify(P7, c7.co.id);
  check('autre devise ET autre commande : refusé', r.body.status === 'pending' && r.body.account.status === 'TRIAL', r.body);
  konnect.pay(c7.ref, { token: 'TND', amount: 54000 });
  r = await verify(P7, c7.co.id);
  check('autre devise, bonne commande : le montant n’est pas comparable, la commande l’est — accepté', r.body.status === 'paid' && r.body.account.status === 'ACTIVE', r.body);
  check('l’écart de commande a été tracé une fois', (await auditCount('payment_mismatch', P7.id)) === 1, await auditCount('payment_mismatch', P7.id));

  // ─── Compte suspendu ───
  console.log('— Compte suspendu par l’administrateur');
  const P9 = await signUp({ email: 'p9@test.tn', companyName: 'Boutique P9', sector: 'commerce' });
  const c9 = await checkout(P9, 'starter', 'monthly');
  r = await call('POST', `/admin/accounts/${P9.id}/suspend`, { token: admin, body: { reason: 'Test' } });
  check('compte suspendu', r.status === 200 && r.body.status === 'SUSPENDED', r);
  r = await call('POST', '/billing/checkout', { token: P9.token, headers: { Origin: FRONT }, body: { planCode: 'starter', billingCycle: 'monthly' } });
  check('un compte suspendu ne peut pas ouvrir de nouveau paiement (403)', r.status === 403, r);
  konnect.pay(c9.ref);
  r = await verify(P9, c9.co.id);
  check('l’argent déjà encaissé est enregistré, mais la suspension de l’administrateur n’est pas levée', r.body.status === 'paid' && r.body.account.status === 'SUSPENDED' && r.body.account.blocked === true, r.body);
  r = await call('GET', '/clients', { token: P9.token });
  check('ERP toujours fermé (402 SUSPENDED)', r.status === 402 && r.body.reason === 'SUSPENDED', r);
  r = await call('POST', `/admin/accounts/${P9.id}/reactivate`, { token: admin });
  check('l’administrateur réactive : l’abonnement payé est là', r.status === 200 && r.body.status === 'ACTIVE' && r.body.blocked === false, r);
  r = await call('GET', '/clients', { token: P9.token });
  check('accès rétabli', r.status === 200, r);

  {
  // ─── Reçus sans trou, identité de l'éditeur, relecture, remboursement, mise en production ───
  console.log('— Reçus numérotés sans trou, identité de l’éditeur, relecture et remboursement (admin)');
  const year = new Date().getUTCFullYear();
  const suffix = (n) => String(n).padStart(5, '0');
  // Des pages de paiement abandonnées consomment des identifiants de paiement, mais JAMAIS un numéro de reçu.
  const Q1 = await signUp({ email: 'q1@test.tn', companyName: 'Boutique Q1', sector: 'commerce', language: 'es' });
  const lastBefore = (await one(`SELECT COALESCE(MAX("lastValue"), 0)::int AS n FROM number_sequences WHERE "userId" = 0 AND key = 'platform_receipt' AND year = $1`, [year])).n;
  const abandoned = await checkout(Q1, 'starter', 'monthly');
  const abandoned2 = await checkout(Q1, 'business', 'monthly'); // referme la première page, qui reste « expired »
  check('deux pages de paiement ouvertes, la première est refermée', abandoned.r.status === 201 && abandoned2.r.status === 201 && (await one('SELECT status FROM subscription_payments WHERE id = $1', [abandoned.co.id])).status === 'expired', [abandoned.co, abandoned2.co]);
  konnect.pay(abandoned2.ref);
  r = await verify(Q1, abandoned2.co.id);
  const q1Receipt = r.body.payment?.receiptNumber;
  check('paiement validé : le reçu suit le DERNIER numéro émis (compteur), pas l’identifiant du paiement', r.body.status === 'paid' && q1Receipt === `REC-${year}-${suffix(lastBefore + 1)}` && abandoned2.co.id > lastBefore + 1, { q1Receipt, lastBefore, id: abandoned2.co.id });
  row = await one(`SELECT COUNT(*)::int AS n, COUNT(DISTINCT "receiptNumber")::int AS distinct_n, MAX(substring("receiptNumber" from 10)::int) AS max_n FROM subscription_payments WHERE "receiptNumber" LIKE $1`, [`REC-${year}-%`]);
  check('tous les reçus de l’année forment une suite continue 1…N, sans trou ni doublon', row.n > 5 && row.n === row.distinct_n && row.max_n === row.n, row);
  const mailQ1 = await waitMail('q1@test.tn', q1Receipt);
  check('le reçu part par email dans la langue du client (espagnol)', !!mailQ1 && /Hemos recibido su pago con tarjeta/.test(mailQ1.text) && /Plan Business/.test(mailQ1.text), mailQ1?.text.slice(0, 400));

  r = await call('GET', `/billing/payments/${abandoned2.co.id}/receipt`, { token: Q1.token });
  check('reçu du client : sans identité d’éditeur tant que l’administrateur n’en a pas renseigné', r.status === 200 && r.body.issuer === null && r.body.receiptNumber === q1Receipt, r.body.issuer);
  r = await call('PUT', '/admin/settings', { token: admin, body: { issuerTaxId: 'pas un matricule' } });
  check('matricule fiscal de l’éditeur invalide : refusé (400)', r.status === 400, r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { issuerName: 'MSAI Systems SARL', issuerTaxId: '1234567x/a/m/000', issuerAddress: '12 rue de la Liberté, 1002 Tunis', issuerRegistry: 'B0123456789', supportEmail: 'billing@test.tn', supportPhone: '+216 71 000 000' } });
  check('identité de l’éditeur enregistrée, matricule normalisé', r.status === 200 && r.body.issuerName === 'MSAI Systems SARL' && r.body.issuerTaxId === '1234567X/A/M/000', r.body);
  r = await call('GET', `/billing/payments/${abandoned2.co.id}/receipt`, { token: Q1.token });
  check('le reçu porte maintenant l’identité légale de l’éditeur', r.body.issuer?.name === 'MSAI Systems SARL' && r.body.issuer.taxId === '1234567X/A/M/000' && r.body.issuer.address.includes('Tunis') && r.body.issuer.registry === 'B0123456789' && r.body.issuer.email === 'billing@test.tn', r.body.issuer);
  r = await call('GET', `/admin/payments/${abandoned2.co.id}/receipt`, { token: admin });
  check('… et celui de l’administrateur aussi', r.status === 200 && r.body.issuer?.name === 'MSAI Systems SARL', r.body.issuer);

  // — Relecture à la demande de l'administrateur (« j'ai payé mais rien ne s'ouvre »).
  const Q2 = await signUp({ email: 'q2@test.tn', companyName: 'Boutique Q2', sector: 'commerce' });
  const c2 = await checkout(Q2, 'starter', 'monthly');
  konnect.pay(c2.ref); // payé chez Konnect, mais le client n'est jamais revenu sur le site
  r = await call('POST', `/admin/payments/${c2.co.id}/recheck`, { token: Q2.token });
  check('relecture : réservée à l’administrateur (403)', r.status === 403, r);
  r = await call('POST', '/admin/payments/999999/recheck', { token: admin });
  check('paiement inconnu : 404', r.status === 404, r);
  r = await call('POST', `/admin/payments/${c2.co.id}/recheck`, { token: admin });
  check('relecture chez Konnect : encaissé, abonnement ouvert', r.status === 200 && r.body.status === 'paid' && r.body.payment.status === 'validated', r.body);
  r = await call('POST', `/admin/payments/${c2.co.id}/recheck`, { token: admin });
  check('relecture répétée : aucun second encaissement', r.status === 200 && r.body.status === 'paid' && (await one(`SELECT COUNT(*)::int AS n FROM subscription_payments WHERE "userId" = $1 AND status = 'validated'`, [Q2.id])).n === 1, r.body);
  check('la relecture est tracée dans le journal', (await auditCount('payment_rechecked', Q2.id)) === 2, await auditCount('payment_rechecked', Q2.id));
  const c2b = await checkout(Q2, 'business', 'monthly');
  r = await call('POST', `/admin/payments/${c2b.co.id}/recheck`, { token: admin });
  check('page non payée : « en attente », rien n’est activé', r.status === 200 && r.body.status === 'pending' && r.body.payment.status === 'initiated', r.body);

  // — Remboursement : paiement le plus récent d'abord, l'abonnement revient en arrière période après période.
  const Q3 = await signUp({ email: 'q3@test.tn', companyName: 'Boutique Q3', sector: 'commerce' });
  const first = await checkout(Q3, 'starter', 'monthly');
  konnect.pay(first.ref);
  await verify(Q3, first.co.id);
  const second = await checkout(Q3, 'business', 'monthly');
  konnect.pay(second.ref);
  await verify(Q3, second.co.id);
  const endBoth = new Date((await one('SELECT "subscriptionEnd" FROM users WHERE id = $1', [Q3.id])).subscriptionEnd);
  const payFirst = await one('SELECT id, "receiptNumber", "periodStart", "periodEnd" FROM subscription_payments WHERE id = $1', [first.co.id]);
  check('deux paiements validés à la suite : l’abonnement couvre les deux périodes (plan Business)', Math.abs(monthsBetween(new Date(payFirst.periodStart), endBoth) - 2) < 0.1 && (await one('SELECT "planCode" FROM users WHERE id = $1', [Q3.id])).planCode === 'business', { payFirst, endBoth });

  r = await call('POST', `/admin/payments/${first.co.id}/refund`, { token: Q3.token, body: {} });
  check('remboursement : réservé à l’administrateur (403)', r.status === 403, r);
  r = await call('POST', `/admin/payments/${first.co.id}/refund`, { token: admin, body: { reason: 'Erreur' } });
  check('le plus ancien ne se rembourse pas avant le plus récent (409)', r.status === 409 && /plus récent/.test(String(r.body.message)), r);
  r = await call('POST', `/admin/payments/${c2b.co.id}/refund`, { token: admin, body: {} });
  check('une page non payée ne se rembourse pas (409)', r.status === 409, r);
  r = await call('POST', '/admin/payments/999999/refund', { token: admin, body: {} });
  check('paiement inconnu : 404', r.status === 404, r);
  r = await call('POST', `/admin/payments/${second.co.id}/refund`, { token: admin, body: { reason: 'Doublon', amount: 1 } });
  check('remboursement du plus récent : paiement « refunded », abonnement revenu à la période précédente (formule Starter)', r.status === 200 && r.body.payment.status === 'refunded' && r.body.payment.rejectReason === 'Doublon' && r.body.account.status === 'ACTIVE' && r.body.account.planCode === 'starter', r.body);
  row = await one('SELECT "subscriptionEnd", "planCode", "accountStatus" FROM users WHERE id = $1', [Q3.id]);
  check('… et l’échéance est celle d’avant ce paiement', Math.abs(new Date(row.subscriptionEnd).getTime() - new Date(payFirst.periodEnd).getTime()) < 2000 && row.planCode === 'starter', row);
  row = await one('SELECT status, "receiptNumber" FROM subscription_payments WHERE id = $1', [second.co.id]);
  check('le numéro de reçu reste attaché au paiement remboursé (la suite des numéros ne change pas)', row.status === 'refunded' && /^REC-\d{4}-\d{5}$/.test(row.receiptNumber), row);
  r = await call('GET', `/billing/payments/${second.co.id}/receipt`, { token: Q3.token });
  check('un paiement remboursé n’a plus de reçu à télécharger (404)', r.status === 404, r);
  r = await call('GET', '/billing/payments', { token: Q3.token });
  check('l’historique du client montre le remboursement', r.body.find((p) => p.id === second.co.id)?.status === 'refunded' && r.body.filter((p) => p.status === 'validated').length === 1, r.body.map((p) => [p.id, p.status]));
  const mailRefund = await waitMail('q3@test.tn', 'a été remboursé');
  check('le client reçoit un email de remboursement', !!mailRefund && mailRefund.text.includes('Doublon'), mailRefund?.text.slice(0, 300));
  r = await call('POST', `/admin/payments/${second.co.id}/refund`, { token: admin, body: {} });
  check('déjà remboursé : refusé (409), pas de second retrait', r.status === 409, r);
  r = await call('POST', `/admin/payments/${first.co.id}/refund`, { token: admin, body: { reason: 'Annulation' } });
  check('puis le premier : remboursé pendant l’essai, l’essai reprend là où il en était (aucun jour perdu)', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.account.blocked === false && r.body.account.subscriptionEnd === null, r.body.account);
  r = await call('GET', '/clients', { token: Q3.token });
  check('ERP ouvert (essai en cours)', r.status === 200, r);
  check('les deux remboursements sont tracés', (await auditCount('payment_refunded', Q3.id)) === 2, await auditCount('payment_refunded', Q3.id));
  r = await call('GET', '/admin/overview', { token: admin });
  row = await one(`SELECT COALESCE(SUM("amountTTC"), 0)::float AS refunded FROM subscription_payments WHERE status = 'refunded'`);
  check('les paiements remboursés ne comptent pas dans les revenus', r.status === 200 && row.refunded > 0, row);

  // Remboursement quand l'essai est déjà fini : plus aucune période payée, l'accès se referme (les données restent).
  const Q4 = await signUp({ email: 'q4@test.tn', companyName: 'Boutique Q4', sector: 'commerce' });
  await db.query(`UPDATE users SET "trialEndsAt" = now() - interval '2 days', "accountStatus" = 'EXPIRED', "statusReason" = 'TRIAL_EXPIRED' WHERE id = $1`, [Q4.id]);
  const c4 = await checkout(Q4, 'starter', 'monthly');
  konnect.pay(c4.ref);
  r = await verify(Q4, c4.co.id);
  check('essai terminé puis paiement : abonnement ouvert', r.body.status === 'paid' && r.body.account.status === 'ACTIVE', r.body);
  r = await call('POST', `/admin/payments/${c4.co.id}/refund`, { token: admin, body: { reason: 'Demande du client' } });
  check('remboursé : plus aucune période payée, le compte est fermé « abonnement échu »', r.status === 200 && r.body.account.status === 'EXPIRED' && r.body.account.blocked === true && r.body.account.reason === 'SUBSCRIPTION_EXPIRED', r.body.account);
  r = await call('GET', '/clients', { token: Q4.token });
  check('ERP fermé (402), données conservées', r.status === 402 && r.body.reason === 'SUBSCRIPTION_EXPIRED', r);
  row = await one(`SELECT COUNT(*)::int AS n FROM users WHERE id = $1 AND "isActive" = true`, [Q4.id]);
  check('le compte reste actif (rien n’est supprimé)', row.n === 1, row);

  // — Liste de contrôle « mise en production » et test de connexion à Konnect.
  r = await call('GET', '/admin/online-payment', { token: Q1.token });
  check('liste de contrôle : réservée à l’administrateur (403)', r.status === 403, r);
  r = await call('GET', '/admin/online-payment', { token: admin });
  const byKey = Object.fromEntries((r.body.checks || []).map((c) => [c.key, c]));
  check('liste de contrôle : clés, devise, formules, emails et identité de l’éditeur en règle', r.status === 200 && r.body.enabled === true && ['credentials', 'currency', 'plans', 'mail', 'issuer'].every((k) => byKey[k]?.ok === true), r.body.checks);
  check('… mode test signalé (avertissement), pas encore « en production »', byKey.mode.ok === false && byKey.mode.level === 'warn' && r.body.mode === 'sandbox' && r.body.live === false, byKey.mode);
  check('… adresses http locales : erreur bloquante en production, avec l’adresse que Konnect appellera', byKey.apiUrl.ok === false && byKey.apiUrl.level === 'error' && /API_PUBLIC_URL/.test(byKey.apiUrl.message) && r.body.ready === false && r.body.webhookUrl === `${BASE}/public/payments/konnect/return`, { apiUrl: byKey.apiUrl, ready: r.body.ready });
  check('… ni la clé ni le portefeuille ne sortent du serveur', !JSON.stringify(r.body).includes('e2e-konnect-key') && !JSON.stringify(r.body).includes('e2e-wallet'), Object.keys(r.body));

  r = await call('POST', '/admin/online-payment/test', { token: Q1.token, body: {} });
  check('test de connexion : réservé à l’administrateur (403)', r.status === 403, r);
  const initsBefore = konnect.initCount();
  r = await call('POST', '/admin/online-payment/test', { token: admin, body: {} });
  check('test de connexion : clé acceptée par Konnect, aucun paiement ouvert', r.status === 200 && r.body.keyAccepted === true && r.body.walletAccepted === null && r.body.reachable === true && r.body.mode === 'sandbox' && konnect.initCount() === initsBefore, r.body);
  r = await call('POST', '/admin/online-payment/test', { token: admin, body: { wallet: true } });
  check('test avec le portefeuille : reconnu, un paiement de test de 1 TND est ouvert (jamais encaissé)', r.status === 200 && r.body.walletAccepted === true && konnect.initCount() === initsBefore + 1 && konnect.lastInit().body.amount === 1000 && konnect.lastInit().body.token === 'TND' && String(konnect.lastInit().body.orderId).startsWith('connection-test-') && konnect.lastInit().body.webhook === `${BASE}/public/payments/konnect/return`, r.body);
  check('le résultat ne contient ni la clé ni le portefeuille ; le test est tracé', !JSON.stringify(r.body).includes('e2e-konnect-key') && !JSON.stringify(r.body).includes('e2e-wallet') && (await one(`SELECT COUNT(*)::int AS n FROM audit_logs WHERE action = 'konnect_test'`)).n === 2, r.body);
  await db.query(`DELETE FROM users WHERE id = ANY($1)`, [[Q1.id, Q2.id, Q3.id, Q4.id]]);
  await call('PUT', '/admin/settings', { token: admin, body: { issuerName: '', issuerTaxId: '', issuerAddress: '', issuerRegistry: '', supportEmail: '', supportPhone: '' } });
  }

  // ═════════════════════════ 2. Secteur et modules choisis par le client ═════════════════════════
  console.log('— Le client choisit lui-même son secteur et ses modules');
  const M1 = await signUp({ email: 'm1@test.tn', companyName: 'Restaurant M1', sector: 'restaurant' });
  const mod = (view, key) => view.modules.find((m) => m.key === key);
  r = await call('GET', '/billing/modules', { token: M1.token });
  check('pendant l’essai : aucune formule ne limite les modules, 15 secteurs au choix, modules conseillés pour le secteur', r.status === 200 && r.body.sector === 'restaurant' && r.body.trial === true && r.body.plan === null && r.body.modules.every((m) => m.included === true) && r.body.sectors.length === 15 && !r.body.modules.some((m) => ['dashboard', 'profile', 'settings'].includes(m.key)), r.body);
  check('restaurant : caisse, stock et agenda ouverts et conseillés ; projets et logistique fermés ; plus de module Production', mod(r.body, 'pos').enabled && mod(r.body, 'pos').recommended && mod(r.body, 'appointments').enabled && !mod(r.body, 'projects').enabled && !mod(r.body, 'logistics').enabled && !r.body.modules.some((m) => m.key === 'production') && !mod(r.body, 'projects').recommended, r.body.modules.map((m) => [m.key, m.enabled, m.recommended]));
  r = await call('POST', '/projects', { token: M1.token, body: { name: 'Saisi depuis la comptabilité' } });
  check('Projets n’est pas dans le secteur, mais la Comptabilité ouverte permet encore d’y écrire (compatibilité avec l’ancien écran)', r.status === 201 && r.body.userId === M1.id, r);
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: ['sales', 'stock'] } });
  check('le client ferme tout sauf Ventes et Stock', r.status === 200 && mod(r.body, 'sales').enabled && mod(r.body, 'stock').enabled && !mod(r.body, 'finance').enabled && !mod(r.body, 'projects').enabled && !mod(r.body, 'pos').enabled, r.body.modules?.map((m) => [m.key, m.enabled]));
  r = await call('POST', '/projects', { token: M1.token, body: { name: 'Rénovation de la salle' } });
  check('ni Projets ni Comptabilité : écriture refusée (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED' && r.body.module === 'projects', r);
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: 'projects' } });
  check('liste de modules mal formée : 400', r.status === 400, r);
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: ['sales', 'astrologie'] } });
  check('module inconnu : 400 avec son nom', r.status === 400 && /astrologie/.test(String(r.body.message)), r);
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: ['sales', 'stock', 'projects', 'logistics'] } });
  check('le client ouvre lui-même Projets et Logistique et ferme la caisse (pendant l’essai, tout est permis)', r.status === 200 && mod(r.body, 'projects').enabled && mod(r.body, 'logistics').enabled && !mod(r.body, 'pos').enabled && mod(r.body, 'sales').enabled, r.body.modules?.map((m) => [m.key, m.enabled]));
  r = await call('GET', '/auth/me', { token: M1.token });
  check('l’ERP reflète ce choix tout de suite ; tableau de bord, profil et réglages restent toujours ouverts', r.body.modules.projects === true && r.body.modules.pos === false && r.body.modules.dashboard === true && r.body.modules.profile === true && r.body.modules.settings === true, r.body.modules);
  r = await call('POST', '/projects', { token: M1.token, body: { name: 'Rénovation de la salle' } });
  check('Projets ouvert : le projet se crée', r.status === 201 && r.body.userId === M1.id, r);
  r = await call('POST', '/team/members', { token: M1.token, body: { email: 'm1v@test.tn', name: 'Lecteur M1', role: 'viewer', password: 'Viewer#2026' } });
  r = await call('POST', '/auth/login', { body: { email: 'm1v@test.tn', password: 'Viewer#2026' } });
  const m1Viewer = r.body.access_token;
  r = await call('PUT', '/billing/modules', { token: m1Viewer, body: { modules: ['sales', 'stock', 'projects', 'logistics', 'hr'] } });
  check('un membre d’équipe ne change pas les modules de la société (403)', r.status === 403, r);
  r = await call('PUT', '/billing/sector', { token: m1Viewer, body: { sector: 'services' } });
  check('ni son secteur (403)', r.status === 403, r);
  r = await call('GET', '/billing/modules', { token: m1Viewer });
  check('mais il peut les consulter', r.status === 200 && r.body.sector === 'restaurant', r);

  r = await call('PUT', '/billing/sector', { token: M1.token, body: { sector: 'astrologie' } });
  check('secteur inconnu : 400', r.status === 400, r);
  r = await call('PUT', '/billing/sector', { token: M1.token, body: { sector: 'construction' } });
  check('changement de secteur sans toucher aux modules : le secteur change, les modules choisis restent', r.status === 200 && r.body.sector === 'construction' && mod(r.body, 'projects').enabled && mod(r.body, 'logistics').enabled && !mod(r.body, 'pos').enabled, r.body.modules?.map((m) => [m.key, m.enabled]));
  r = await call('PUT', '/billing/sector', { token: M1.token, body: { sector: 'construction', applyModules: true } });
  check('avec « reprendre les modules conseillés » : les modules deviennent ceux du secteur', r.status === 200 && r.body.modules.every((m) => m.enabled === m.recommended) && r.body.modules.some((m) => m.enabled), r.body.modules?.map((m) => [m.key, m.enabled, m.recommended]));
  row = await one('SELECT sector FROM users WHERE id = $1', [M1.id]);
  check('secteur enregistré', row.sector === 'construction', row);

  // M1 passe à la formule Starter en payant par carte : les modules hors formule se referment.
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: ['sales', 'stock', 'projects', 'logistics', 'hr', 'appointments'] } });
  const c1m = await checkout(M1, 'starter', 'monthly');
  konnect.pay(c1m.ref);
  r = await verify(M1, c1m.co.id);
  check('M1 paie la formule Starter par carte', r.body.status === 'paid' && r.body.account.planCode === 'starter', r.body);
  r = await call('GET', '/billing/modules', { token: M1.token });
  check('formule Starter : le détail « inclus / non inclus » apparaît, l’essai n’est plus indiqué', r.body.trial === false && r.body.plan.code === 'starter' && mod(r.body, 'hr').included === false && mod(r.body, 'projects').included === false && mod(r.body, 'sales').included === true && mod(r.body, 'appointments').included === true, r.body.modules?.map((m) => [m.key, m.included]));
  check('les modules choisis hors formule sont refermés, les autres restent', !mod(r.body, 'hr').enabled && !mod(r.body, 'projects').enabled && !mod(r.body, 'logistics').enabled && mod(r.body, 'sales').enabled && mod(r.body, 'stock').enabled && mod(r.body, 'appointments').enabled, r.body.modules?.map((m) => [m.key, m.enabled]));
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: ['sales', 'hr', 'projects'] } });
  check('module hors formule : refusé (403 MODULE_NOT_IN_PLAN) avec la liste des modules refusés', r.status === 403 && r.body.code === 'MODULE_NOT_IN_PLAN' && [...r.body.modules].sort().join() === 'hr,projects', r);
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: ['sales', 'pos'] } });
  check('modules inclus dans la formule : acceptés', r.status === 200 && mod(r.body, 'pos').enabled && !mod(r.body, 'stock').enabled, r.body.modules?.map((m) => [m.key, m.enabled]));
  r = await call('POST', '/projects', { token: M1.token, body: { name: 'Hors formule' } });
  check('et le serveur refuse bien d’écrire dans un module fermé par la formule', r.status === 403 && r.body.code === 'MODULE_DISABLED', r);
  const c2m = await checkout(M1, 'business', 'annual');
  konnect.pay(c2m.ref);
  r = await verify(M1, c2m.co.id);
  check('M1 passe à Business par carte', r.body.status === 'paid' && r.body.account.planCode === 'business', r.body);
  r = await call('PUT', '/billing/modules', { token: M1.token, body: { modules: ['sales', 'hr', 'projects'] } });
  check('formule Business : le client ouvre RH et Projets lui-même', r.status === 200 && mod(r.body, 'hr').enabled && mod(r.body, 'projects').enabled && mod(r.body, 'hr').included === true, r.body.modules?.map((m) => [m.key, m.enabled]));
  r = await call('GET', `/admin/audit?userId=${M1.id}&action=modules_changed`, { token: admin });
  const r2 = await call('GET', `/admin/audit?userId=${M1.id}&action=sector_changed`, { token: admin });
  check('journal : les changements de modules et de secteur du client sont tracés', r.body.total >= 4 && r2.body.total === 2, [r.body.total, r2.body.total]);

  // ═════════════════════════ 3. Agenda et projets ═════════════════════════
  console.log('— Agenda : rendez-vous et réservations');
  const A1 = await signUp({ email: 'a1@test.tn', companyName: 'Cabinet Conseil A1', sector: 'services' });
  const A2 = await signUp({ email: 'a2@test.tn', companyName: 'Clinique A2', sector: 'healthcare' });
  check('cabinet de services : agenda et projets ouverts d’emblée', A1.r.body.user.modules.appointments === true && A1.r.body.user.modules.projects === true, A1.r.body.user?.modules);
  r = await call('PUT', '/billing/modules', { token: A2.token, body: { modules: ['appointments', 'projects', 'clients'] } });
  check('A2 (clinique) ouvre aussi l’agenda, les projets et les clients', r.status === 200 && mod(r.body, 'appointments').enabled && mod(r.body, 'projects').enabled, r);

  r = await call('POST', '/appointments', { token: A1.token, body: { title: 'Consultation Mme Ben Ali', resource: 'Salle 1', service: 'Consultation', startAt: slot(9), durationMinutes: 45, clientName: 'Mme Ben Ali', clientPhone: '22 111 333', price: 80 } });
  check('rendez-vous créé : 45 min, 80 $, état « scheduled »', r.status === 201 && r.body.userId === A1.id && r.body.status === 'scheduled' && new Date(r.body.endAt).getTime() - new Date(r.body.startAt).getTime() === 45 * 60_000 && r.body.price === 80, r);
  const ap1 = r.body;
  r = await call('POST', '/appointments', { token: A1.token, body: { title: 'Autre client', resource: 'salle 1', startAt: slot(9, 30), durationMinutes: 30 } });
  check('même ressource (casse ignorée), créneau qui chevauche : 409 SLOT_TAKEN avec le rendez-vous en cause', r.status === 409 && r.body.code === 'SLOT_TAKEN' && r.body.conflictId === ap1.id, r);
  r = await call('POST', '/appointments', { token: A1.token, body: { title: 'Suivant', resource: 'Salle 1', startAt: slot(9, 45), durationMinutes: 30 } });
  check('créneau qui commence à la fin du précédent : accepté', r.status === 201, r);
  const ap2 = r.body;
  r = await call('POST', '/appointments', { token: A1.token, body: { title: 'Autre salle', resource: 'Salle 2', startAt: slot(9, 30), durationMinutes: 30 } });
  check('autre ressource, même heure : accepté', r.status === 201, r);
  r = await call('POST', '/appointments', { token: A1.token, body: { title: 'Surréservation voulue', resource: 'Salle 1', startAt: slot(9, 30), durationMinutes: 15, allowOverlap: true } });
  check('chevauchement volontaire (allowOverlap) : accepté', r.status === 201, r);
  r = await call('PATCH', `/appointments/${ap1.id}/status`, { token: A1.token, body: { status: 'cancelled' } });
  check('rendez-vous annulé', r.status === 200 && r.body.status === 'cancelled', r);
  r = await call('POST', '/appointments', { token: A1.token, body: { title: 'Nouveau créneau', resource: 'Salle 1', startAt: slot(9), durationMinutes: 20 } });
  check('un rendez-vous annulé libère la ressource', r.status === 201, r);
  const apNew = r.body;
  r = await call('PATCH', `/appointments/${ap1.id}/status`, { token: A1.token, body: { status: 'scheduled' } });
  check('le rouvrir alors que le créneau est repris : 409 SLOT_TAKEN', r.status === 409 && r.body.code === 'SLOT_TAKEN', r);
  r = await call('PATCH', `/appointments/${ap1.id}/status`, { token: A1.token, body: { status: 'inconnu' } });
  check('état inconnu : 400', r.status === 400, r);
  r = await call('PUT', `/appointments/${ap2.id}`, { token: A1.token, body: { startAt: slot(9, 10) } });
  check('déplacer un rendez-vous sur un créneau pris (Salle 1) : 409', r.status === 409 && r.body.code === 'SLOT_TAKEN', r);
  r = await call('PUT', `/appointments/${ap2.id}`, { token: A1.token, body: { startAt: slot(11), notes: 'Apporter le dossier' } });
  check('déplacer sur un créneau libre : accepté, la durée est conservée', r.status === 200 && new Date(r.body.endAt).getTime() - new Date(r.body.startAt).getTime() === 30 * 60_000 && r.body.notes === 'Apporter le dossier', r);
  for (const [label, body] of [['objet trop court', { title: 'x', startAt: slot(12) }], ['sans date', { title: 'Sans date' }], ['fin avant le début', { title: 'Fin avant début', startAt: slot(12), endAt: slot(11) }], ['durée trop courte', { title: 'Trop court', startAt: slot(12), durationMinutes: 2 }], ['durée de plus de 7 jours', { title: 'Trop long', startAt: slot(12), endAt: new Date(Date.UTC(2031, 5, 25)).toISOString() }], ['nombre de personnes invalide', { title: 'Table', startAt: slot(12), partySize: 0 }], ['montant négatif', { title: 'Montant', startAt: slot(12), price: -5 }]]) {
    r = await call('POST', '/appointments', { token: A1.token, body });
    check(`rendez-vous refusé : ${label} (400)`, r.status === 400, r);
  }
  r = await call('POST', '/clients', { token: A1.token, body: { name: 'Mme Ben Ali', phone: '22 111 333', email: 'ba@a1.tn' } });
  const clientA1 = r.body;
  r = await call('POST', '/appointments', { token: A1.token, body: { title: 'RDV sur fiche client', clientId: clientA1.id, startAt: slot(14), durationMinutes: 30 } });
  check('rendez-vous rattaché à une fiche client : nom et téléphone repris de la fiche', r.status === 201 && r.body.clientId === clientA1.id && r.body.clientName === 'Mme Ben Ali' && r.body.clientPhone === '22 111 333', r);
  r = await call('GET', '/appointments?from=2031-06-10&to=2031-06-10', { token: A1.token });
  check('liste d’une journée : 6 rendez-vous, triés par heure', r.status === 200 && r.body.length === 6 && r.body.every((a, i, all) => i === 0 || new Date(all[i - 1].startAt) <= new Date(a.startAt)), r.body.map((a) => [a.title, a.startAt]));
  r = await call('GET', '/appointments?from=2031-06-10&to=2031-06-10&status=cancelled', { token: A1.token });
  check('filtre par état', r.body.length === 1 && r.body[0].id === ap1.id, r.body);
  r = await call('GET', '/appointments?from=2031-06-10&to=2031-06-10&resource=salle%202', { token: A1.token });
  check('filtre par ressource', r.body.length === 1 && r.body[0].resource === 'Salle 2', r.body);
  r = await call('GET', '/appointments?from=2031-06-10&to=2031-06-10&q=ben%20ali', { token: A1.token });
  check('recherche par nom du client', r.body.length === 2 && r.body.every((a) => /ben ali/i.test(`${a.title} ${a.clientName}`)), r.body.map((a) => a.title));
  r = await call('GET', '/appointments?from=2031-06-12&to=2031-06-10', { token: A1.token });
  check('période à l’envers : 400', r.status === 400, r);
  r = await call('GET', '/appointments/summary', { token: A1.token });
  check('résumé : ressources et prestations déjà utilisées proposées à la saisie, rien de prévu dans les 7 prochains jours', r.status === 200 && r.body.resources.includes('Salle 1') && r.body.resources.includes('Salle 2') && r.body.services.includes('Consultation') && r.body.upcoming7Days === 0 && typeof r.body.today.planned === 'number', r.body);

  console.log('— Agenda : isolation entre sociétés et droits liés aux modules');
  for (const [label, method, path, body] of [['lire', 'GET', `/appointments/${ap1.id}`], ['modifier', 'PUT', `/appointments/${ap1.id}`, { title: 'Piraté' }], ['changer l’état de', 'PATCH', `/appointments/${ap1.id}/status`, { status: 'done' }], ['supprimer', 'DELETE', `/appointments/${ap1.id}`]]) {
    r = await call(method, path, { token: A2.token, body });
    check(`A2 ne peut pas ${label} le rendez-vous de A1 (404)`, r.status === 404, r);
  }
  r = await call('GET', '/appointments?from=2031-06-01&to=2031-06-30', { token: A2.token });
  check('l’agenda de A2 ne contient rien de A1', r.status === 200 && r.body.length === 0, r.body);
  r = await call('POST', '/appointments', { token: A2.token, body: { id: ap1.id, userId: A1.id, title: 'Pirate', resource: 'Salle 1', startAt: slot(9), durationMinutes: 45 } });
  check('création avec l’id et la société de A1 : une NOUVELLE ligne est créée pour A2, et « Salle 1 » de A1 ne la gêne pas', r.status === 201 && r.body.id !== ap1.id && r.body.userId === A2.id, r);
  row = await one('SELECT title, "userId", status FROM appointments WHERE id = $1', [ap1.id]);
  check('le rendez-vous de A1 est intact', row.title === 'Consultation Mme Ben Ali' && row.userId === A1.id && row.status === 'cancelled', row);
  r = await call('POST', '/appointments', { token: A2.token, body: { title: 'Fiche d’une autre société', clientId: clientA1.id, startAt: slot(15) } });
  check('A2 ne peut pas rattacher un rendez-vous à une fiche client de A1 (400)', r.status === 400, r);
  r = await call('POST', '/appointments', { token: P1.token, body: { title: 'Commerce', startAt: slot(10) } });
  check('commerce (agenda hors secteur) : écriture refusée (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED' && r.body.module === 'appointments', r);
  r = await call('GET', '/appointments', { token: P1.token });
  check('lecture toujours possible (tableau de bord, rapports)', r.status === 200 && Array.isArray(r.body), r);
  r = await call('DELETE', `/appointments/${apNew.id}`, { token: A1.token });
  check('suppression d’un rendez-vous', r.status === 200 && r.body.success === true, r);
  r = await call('GET', `/appointments/${apNew.id}`, { token: A1.token });
  check('supprimé : introuvable', r.status === 404, r);

  console.log('— Projets : tâches, avancement automatique, retards');
  r = await call('POST', '/projects', { token: A1.token, body: { name: 'Audit société X', code: 'AUD-001', manager: 'Sami', startDate: '2031-06-01', endDate: '2031-07-15', budget: 12000, status: 'active', priority: 'high', clientId: clientA1.id, tasks: ['Cadrage', { title: 'Entretiens', assignee: 'Leila', dueDate: '2031-06-10' }, 'Rapport'] } });
  check('projet créé avec ses 3 tâches, rattaché à une fiche client', r.status === 201 && r.body.tasks.length === 3 && r.body.tasksTotal === 3 && r.body.tasksDone === 0 && r.body.progress === 0 && Number(r.body.budget) === 12000 && r.body.clientName === 'Mme Ben Ali' && r.body.priority === 'high' && r.body.tasks[1].assignee === 'Leila', r.body);
  const pr1 = r.body;
  r = await call('PATCH', `/projects/${pr1.id}/tasks/${pr1.tasks[0].id}`, { token: A1.token, body: { status: 'done' } });
  check('1 tâche sur 3 terminée : avancement 33 %', r.status === 200 && r.body.progress === 33 && r.body.tasksDone === 1, r.body);
  r = await call('PATCH', `/projects/${pr1.id}/tasks/${pr1.tasks[1].id}`, { token: A1.token, body: { status: 'done' } });
  check('2 sur 3 : 67 %', r.body.progress === 67 && r.body.tasksDone === 2, r.body);
  r = await call('POST', `/projects/${pr1.id}/tasks`, { token: A1.token, body: { title: 'Archivage', assignee: 'Sami' } });
  check('tâche ajoutée : 2 sur 4, 50 %', r.status === 201 && r.body.tasksTotal === 4 && r.body.progress === 50 && r.body.tasks[3].title === 'Archivage', r.body);
  const archive = r.body.tasks[3];
  r = await call('DELETE', `/projects/${pr1.id}/tasks/${archive.id}`, { token: A1.token });
  check('tâche supprimée : de nouveau 2 sur 3, 67 %', r.status === 200 && r.body.tasksTotal === 3 && r.body.progress === 67, r.body);
  r = await call('POST', `/projects/${pr1.id}/tasks`, { token: A1.token, body: { title: 'Relance du client', dueDate: '2020-01-15' } });
  check('tâche à l’échéance dépassée : comptée en retard', r.status === 201 && r.body.tasksLate === 1, r.body);
  const late = r.body.tasks.find((t) => t.title === 'Relance du client');
  r = await call('GET', '/projects/tasks/late', { token: A1.token });
  check('tableau de bord : la tâche en retard est listée avec le nom du projet', r.status === 200 && r.body.length === 1 && r.body[0].projectName === 'Audit société X' && r.body[0].id === late.id, r.body);
  r = await call('PATCH', `/projects/${pr1.id}/tasks/${late.id}`, { token: A1.token, body: { status: 'done' } });
  check('terminée : plus en retard', r.body.tasksLate === 0, r.body);
  r = await call('GET', '/projects/tasks/late', { token: A1.token });
  check('liste des retards vide', r.status === 200 && r.body.length === 0, r.body);
  r = await call('GET', '/projects', { token: A1.token });
  check('liste des projets avec les compteurs de tâches', r.status === 200 && r.body.length === 1 && r.body[0].tasksTotal === 4 && r.body[0].tasksDone === 3, r.body.map((p) => [p.name, p.tasksTotal, p.tasksDone]));
  r = await call('PUT', `/projects/${pr1.id}`, { token: A1.token, body: { status: 'on_hold', cost: 3500.5 } });
  check('projet modifié (suspendu, coût engagé)', r.status === 200 && r.body.status === 'on_hold' && Number(r.body.cost) === 3500.5 && r.body.name === 'Audit société X' && r.body.tasks.length === 4, r.body);
  r = await call('PATCH', `/projects/${pr1.id}/tasks/${pr1.tasks[2].id}`, { token: A1.token, body: { status: 'bizarre' } });
  check('état de tâche inconnu : 400', r.status === 400, r);
  r = await call('POST', `/projects/${pr1.id}/tasks`, { token: A1.token, body: { title: '  ' } });
  check('tâche sans intitulé : 400', r.status === 400, r);
  for (const [label, body] of [['nom trop court', { name: 'x' }], ['fin avant le début', { name: 'Dates', startDate: '2031-07-01', endDate: '2031-06-01' }], ['état inconnu', { name: 'Etat', status: 'bizarre' }], ['budget négatif', { name: 'Budget', budget: -5 }], ['priorité inconnue', { name: 'Priorité', priority: 'urgente' }], ['avancement hors limites', { name: 'Avancement', progress: 150 }], ['client d’une autre société', { name: 'Client', clientId: 999999 }]]) {
    r = await call('POST', '/projects', { token: A1.token, body });
    check(`projet refusé : ${label} (400)`, r.status === 400, r);
  }

  console.log('— Projets : isolation entre sociétés et droits liés aux modules');
  for (const [label, method, path, body] of [['lire', 'GET', `/projects/${pr1.id}`], ['modifier', 'PUT', `/projects/${pr1.id}`, { name: 'Piraté' }], ['supprimer', 'DELETE', `/projects/${pr1.id}`], ['ajouter une tâche au', 'POST', `/projects/${pr1.id}/tasks`, { title: 'Piège' }], ['modifier une tâche du', 'PATCH', `/projects/${pr1.id}/tasks/${pr1.tasks[0].id}`, { status: 'todo' }], ['supprimer une tâche du', 'DELETE', `/projects/${pr1.id}/tasks/${pr1.tasks[0].id}`]]) {
    r = await call(method, path, { token: A2.token, body });
    check(`A2 ne peut pas ${label} projet de A1 (404)`, r.status === 404, r);
  }
  r = await call('GET', '/projects', { token: A2.token });
  check('la liste des projets de A2 ne contient rien de A1', r.status === 200 && r.body.length === 0, r.body);
  r = await call('GET', '/projects/tasks/late', { token: A2.token });
  check('ni ses tâches en retard', r.status === 200 && r.body.length === 0, r.body);
  r = await call('POST', '/projects', { token: A2.token, body: { id: pr1.id, userId: A1.id, name: 'Projet pirate' } });
  const prA2 = r.body;
  check('création avec l’id et la société de A1 : une NOUVELLE ligne pour A2', r.status === 201 && prA2.id !== pr1.id && prA2.userId === A2.id, r);
  r = await call('PATCH', `/projects/${prA2.id}/tasks/${pr1.tasks[0].id}`, { token: A2.token, body: { status: 'todo' } });
  check('A2 ne peut pas atteindre une tâche de A1 en passant par son propre projet (404)', r.status === 404, r);
  r = await call('POST', '/projects', { token: A2.token, body: { name: 'Client d’une autre société', clientId: clientA1.id } });
  check('ni rattacher son projet à une fiche client de A1 (400)', r.status === 400, r);
  row = await one('SELECT name, "userId", status FROM projects WHERE id = $1', [pr1.id]);
  check('le projet de A1 est intact', row.name === 'Audit société X' && row.userId === A1.id && row.status === 'on_hold', row);
  row = await one('SELECT COUNT(*)::int AS n FROM project_tasks WHERE "projectId" = $1 AND "userId" = $2', [pr1.id, A1.id]);
  check('ses 4 tâches aussi', row.n === 4, row);
  // Compatibilité : les comptes qui avaient « Finance » avant l'arrivée du module Projets continuent d'y écrire.
  r = await call('PUT', '/billing/modules', { token: A2.token, body: { modules: ['finance'] } });
  r = await call('POST', '/projects', { token: A2.token, body: { name: 'Chantier saisi depuis la comptabilité' } });
  check('module Comptabilité seul : l’écriture dans les projets reste permise (compatibilité)', r.status === 201, r);
  r = await call('PUT', '/billing/modules', { token: A2.token, body: { modules: ['clients'] } });
  r = await call('POST', '/projects', { token: A2.token, body: { name: 'Sans module' } });
  check('ni Projets ni Comptabilité : écriture refusée (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED' && r.body.module === 'projects', r);
  r = await call('DELETE', `/projects/${pr1.id}`, { token: A1.token });
  check('projet supprimé avec ses tâches', r.status === 200 && r.body.success === true, r);
  row = await one('SELECT COUNT(*)::int AS n FROM project_tasks WHERE "projectId" = $1', [pr1.id]);
  check('plus aucune tâche orpheline', row.n === 0, row);

  await db.end();
  console.log(`\n${passes} ok, ${failures} échec(s)`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
