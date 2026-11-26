// Tests de bout en bout de la couche SaaS : inscription avec code de vérification reçu par email, essai de 72 h,
// expiration, paiement PAR CARTE en ligne (faux Konnect) activé sans administrateur, paiements hors ligne facultatifs,
// suspension, isolation entre sociétés, modules par secteur choisis par le client, agenda et projets, droits de
// l'administrateur, logistique et transporteurs.
// Lancé par run.sh sur une base neuve créée par les migrations (DATABASE_URL, BASE). Le serveur de l'ERP est démarré avec
// SMTP_* et KONNECT_* pointant vers les faux serveurs démarrés ci-dessous (voir fakes.js).
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { startFakeKonnect, startFakeSmtp } = require('./fakes');

const BASE = process.env.BASE || 'http://127.0.0.1:4101';
let passes = 0, failures = 0;
function check(name, cond, extra) {
  if (cond) { passes++; console.log('  ok  ', name); }
  else { failures++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 500) : ''); }
}
async function call(method, path, opts = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
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

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const one = async (sql, params) => (await db.query(sql, params)).rows[0];
  const smtp = await startFakeSmtp(Number(process.env.FAKE_SMTP_PORT));
  const konnect = await startFakeKonnect(Number(process.env.FAKE_KONNECT_PORT));

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

  // ═════════════════════════ Site public ═════════════════════════
  console.log('— Site public');
  let r = await call('GET', '/public/config');
  let row;
  check('configuration publique : essai de 72 h, prix en dollars', r.status === 200 && r.body.trialHours === 72 && r.body.currency === 'USD', r);
  check('paiement par carte en ligne proposé, code de vérification par email actif', r.body.onlinePayment === true && r.body.paymentMethods.includes('card') && r.body.requireEmailVerification === true && !r.body.paymentMethods.includes('bank_transfer'), r.body);
  check('les nouveaux modules Rendez-vous et Projets sont connus', r.body.modules.includes('appointments') && r.body.modules.includes('projects'), r.body.modules);
  check('Google et Apple non configurés : aucun identifiant client exposé', r.body.googleClientId === null && r.body.appleClientId === null, r.body);
  r = await call('GET', '/public/sectors');
  check('15 secteurs proposés, « Autre activité » en dernier', r.status === 200 && r.body.length === 15 && r.body[14].code === 'other' && r.body.every((s) => Array.isArray(s.modules) && s.itemCount > 0), r.body.map((s) => s.code));
  const bySector = Object.fromEntries(r.body.map((s) => [s.code, s.modules]));
  check('chaque secteur reçoit les modules qui lui correspondent (agenda, projets, caisse, logistique)', bySector.healthcare.includes('appointments') && bySector.beauty.includes('appointments') && bySector.restaurant.includes('appointments') && bySector.construction.includes('projects') && bySector.services.includes('projects') && bySector.services.includes('appointments') && !bySector.commerce.includes('appointments') && !bySector.logistics.includes('projects'), bySector);
  check('le module Production n’existe plus : aucun secteur ne le propose', r.body.every((s) => !s.modules.includes('production')), r.body.filter((s) => s.modules.includes('production')).map((s) => s.code));
  r = await call('GET', '/public/sectors/automotive');
  check('nouveau secteur (automobile) : pièces et prestations d’atelier suggérées', r.status === 200 && r.body.items.some((i) => i.kind === 'service') && r.body.items.some((i) => i.kind === 'product') && r.body.items.every((i) => i.basis), r.body.items?.length);
  r = await call('GET', '/public/sectors/logistics');
  check('catalogue logistique : catégories, suggestions et avertissement « valeurs indicatives »', r.status === 200 && r.body.categories.length >= 3 && r.body.items.length >= 5 && /indicatives/.test(r.body.disclaimer) && r.body.items.every((i) => i.basis), r.body.disclaimer);
  const logisticsItems = r.body.items;
  r = await call('GET', '/public/sectors/inconnu');
  check('secteur inconnu : 404', r.status === 404, r);
  r = await call('GET', '/public/plans');
  check('formules publiées d’emblée, en dollars : 15, 29 et 79 par mois (hors taxes)', r.status === 200 && r.body.currency === 'USD' && r.body.plans.map((p) => p.code).join() === 'starter,business,enterprise' && r.body.plans.map((p) => p.priceMonthly).join() === '15,29,79' && r.body.plans.map((p) => p.priceAnnual).join() === '150,290,790', r.body);
  r = await call('GET', '/public/service-offers');
  check('prestations de départ : tarifs en dollars', r.status === 200 && r.body.every((o) => o.price === null || o.price < 200), r.body.length);

  // ═════════════════════════ Inscription ═════════════════════════
  console.log('— Inscription');
  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', role: 'admin' }) });
  check('champ « role » refusé à l’inscription (400)', r.status === 400, r);
  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', modules: { hr: true }, subscriptionEnd: '2099-01-01' }) });
  check('champs « modules » / « subscriptionEnd » refusés (400)', r.status === 400, r);
  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', password: 'motdepasse' }) });
  check('mot de passe faible refusé', r.status === 400, r);
  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', sector: 'astrologie' }) });
  check('secteur inconnu refusé', r.status === 400, r);
  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', phone: '12 34' }) });
  check('téléphone invalide refusé', r.status === 400, r);
  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', acceptTerms: false }) });
  check('conditions non acceptées : refusé', r.status === 400, r);
  r = await call('POST', '/auth/register', { body: signup({ email: 'pas-un-email' }) });
  check('email invalide refusé', r.status === 400, r);

  const before = Date.now();
  const seenA = smtp.mails.length;
  r = await call('POST', '/auth/register', { body: signup({ email: 'A@Test.tn', companyName: 'Restaurant A', sector: 'restaurant', city: 'Sousse', taxId: '1234567X/A/M/000' }) });
  check('inscription : 201, jeton, rôle client', r.status === 201 && !!r.body.access_token && r.body.user.role === 'client' && r.body.user.email === 'a@test.tn', r);
  const A = { token: r.body.access_token, id: r.body.user.id };
  const acc = r.body.account;
  check('essai démarré : état TRIAL, ouvert dès que le code est saisi', acc.status === 'TRIAL' && acc.blocked === true && acc.reason === 'EMAIL_NOT_VERIFIED', acc);
  check('un code à 6 chiffres est envoyé par email (valable 15 min, nouveau code possible après 60 s)', r.body.emailSent === true && r.body.verification.required === true && r.body.verification.sent === true && r.body.verification.expiresInMinutes === 15 && r.body.verification.resendInSeconds === 60, r.body.verification);
  const trialMs = new Date(acc.trialEndsAt).getTime() - new Date(acc.trialStartedAt).getTime();
  check('durée de l’essai : exactement 72 heures', trialMs === 72 * 3600 * 1000, trialMs);
  check('temps restant calculé par le serveur (≈ 72 h)', acc.remainingSeconds <= 72 * 3600 && acc.remainingSeconds > 72 * 3600 - 120, acc.remainingSeconds);
  check('heure du serveur fournie', Math.abs(new Date(acc.serverTime).getTime() - before) < 120000, acc.serverTime);
  const mods = r.body.user.modules;
  check('modules du secteur restaurant : caisse, stock et agenda oui ; logistique et projets non ; aucune clé « production »', mods.pos === true && mods.stock === true && mods.hr === true && mods.appointments === true && mods.logistics === false && !('production' in mods) && mods.projects === false && mods.dashboard === true, mods);
  check('téléphone enregistré au format international', (await one('SELECT phone, sector, "signupSource", "emailVerifiedAt" FROM users WHERE id = $1', [A.id])).phone === '+21622535181');
  const company = await one('SELECT "legalName", city, "taxId" FROM companies WHERE "userId" = $1', [A.id]);
  check('fiche société créée avec les informations facultatives', company && company.legalName === 'Restaurant A' && company.city === 'Sousse' && company.taxId === '1234567X/A/M/000', company);

  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', companyName: 'Doublon' }) });
  check('email déjà utilisé : 409', r.status === 409, r);

  // ═════════════════════════ Code de vérification reçu par email ═════════════════════════
  console.log('— Vérification de l’email par code à 6 chiffres');
  r = await call('GET', '/clients', { token: A.token });
  check('adresse non confirmée : l’ERP reste fermé (402 EMAIL_NOT_VERIFIED)', r.status === 402 && r.body.reason === 'EMAIL_NOT_VERIFIED', r);
  r = await call('GET', '/auth/me', { token: A.token });
  check('le profil reste lisible : adresse non confirmée, accès fermé par le code', r.status === 200 && r.body.emailVerified === false && r.body.account.reason === 'EMAIL_NOT_VERIFIED', r.body.account);
  const codeA = await smtp.codeFor('a@test.tn', seenA);
  const mailA = smtp.mails.slice(seenA).find((m) => m.to.includes('a@test.tn'));
  check('l’email contient un code de 6 chiffres', /^\d{6}$/.test(codeA) && /Inovexa/.test(mailA.text), mailA?.text.slice(0, 200));
  row = await one('SELECT "emailCodeHash", "emailCodeExpires", "emailCodeAttempts" FROM users WHERE id = $1', [A.id]);
  check('le code n’est pas gardé en clair : seule son empreinte est en base, valable 15 min', /^[0-9a-f]{64}$/.test(row.emailCodeHash) && Math.abs(new Date(row.emailCodeExpires).getTime() - (Date.now() + 15 * 60_000)) < 60_000, row);
  r = await call('POST', '/auth/verify-email', { body: { email: 'a@test.tn', token: 'x'.repeat(64) } });
  check('ancien lien de confirmation, jeton invalide : refusé (400)', r.status === 400, r);
  r = await call('POST', '/auth/verify-email-code', { body: { code: codeA } });
  check('saisie du code sans être connecté : 401', r.status === 401, r);
  r = await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: 'abcdef' } });
  check('code mal formé : refusé (400)', r.status === 400, r);
  const wrong = codeA === '000000' ? '111111' : '000000';
  r = await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: wrong } });
  check('mauvais code : refusé, il reste 4 essais', r.status === 400 && r.body.code === 'CODE_INVALID' && r.body.remainingAttempts === 4, r);
  for (let i = 0; i < 3; i++) await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: wrong } });
  r = await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: wrong } });
  check('5e erreur : le code est verrouillé', r.status === 400 && r.body.code === 'CODE_LOCKED', r);
  r = await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: codeA } });
  check('même le bon code est refusé une fois verrouillé (impossible d’essayer les 1 000 000 de codes)', r.status === 400 && r.body.code === 'CODE_LOCKED', r);
  r = await call('POST', '/auth/resend-verification', { token: A.token });
  check('nouveau code demandé trop tôt : 429 avec le temps d’attente', r.status === 429 && r.body.code === 'CODE_TOO_SOON' && r.body.retryInSeconds > 0 && r.body.retryInSeconds <= 60, r);
  await db.query(`UPDATE users SET "emailCodeSentAt" = now() - interval '2 minutes' WHERE id = $1`, [A.id]);
  const seenResend = smtp.mails.length;
  r = await call('POST', '/auth/resend-verification', { token: A.token });
  check('nouveau code demandé après une minute : envoyé', r.status === 200 && r.body.emailSent === true && r.body.expiresInMinutes === 15, r);
  const codeA2 = await smtp.codeFor('a@test.tn', seenResend);
  if (codeA2 !== codeA) {
    r = await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: codeA } });
    check('l’ancien code ne marche plus', r.status === 400 && r.body.code === 'CODE_INVALID', r);
  }
  r = await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: codeA2 } });
  check('bon code : adresse confirmée, accès ouvert', r.status === 200 && r.body.success === true && r.body.account.blocked === false && r.body.account.status === 'TRIAL', r);
  r = await call('POST', '/auth/verify-email-code', { token: A.token, body: { code: codeA2 } });
  check('code ressaisi après confirmation : sans effet', r.status === 200 && r.body.alreadyVerified === true, r);
  r = await call('GET', '/clients', { token: A.token });
  check('l’ERP s’ouvre dès que le code est bon', r.status === 200, r);
  row = await one('SELECT "emailVerifiedAt", "emailCodeHash" FROM users WHERE id = $1', [A.id]);
  check('adresse confirmée en base, empreinte du code effacée', !!row.emailVerifiedAt && row.emailCodeHash === null, row);

  const seenB = smtp.mails.length;
  r = await call('POST', '/auth/register', { body: signup({ email: 'b@test.tn', companyName: 'Boutique B', sector: 'commerce' }) });
  const B = { token: r.body.access_token, id: r.body.user.id };
  const codeB = await smtp.codeFor('b@test.tn', seenB);
  await db.query(`UPDATE users SET "emailCodeExpires" = now() - interval '1 minute' WHERE id = $1`, [B.id]);
  r = await call('POST', '/auth/verify-email-code', { token: B.token, body: { code: codeB } });
  check('code expiré : refusé même s’il est exact', r.status === 400 && r.body.code === 'CODE_EXPIRED', r);
  const seenLogin = smtp.mails.length;
  r = await call('POST', '/auth/login', { body: { email: 'b@test.tn', password: PASSWORD } });
  check('connexion d’un compte non confirmé : un nouveau code part tout seul', r.status === 200 && r.body.account.reason === 'EMAIL_NOT_VERIFIED', r);
  const codeB2 = await smtp.codeFor('b@test.tn', seenLogin);
  if (codeB2 !== codeA2) {
    r = await call('POST', '/auth/verify-email-code', { token: B.token, body: { code: codeA2 } });
    check('le code d’une autre société ne sert à rien', r.status === 400 && r.body.code === 'CODE_INVALID', r);
  }
  r = await call('POST', '/auth/verify-email-code', { token: B.token, body: { code: codeB2 } });
  check('B confirme son adresse avec le nouveau code', r.status === 200 && r.body.account.blocked === false, r);

  const C = await signUp({ email: 'c@test.tn', companyName: 'Transports C', sector: 'logistics' });
  const D = await signUp({ email: 'd@test.tn', companyName: 'Grossiste D', sector: 'wholesale' });
  check('quatre sociétés distinctes créées et confirmées', new Set([A.id, B.id, C.id, D.id]).size === 4 && [A, B, C, D].every((x) => x.token) && C.verify?.status === 200 && D.verify?.status === 200);

  r = await call('POST', '/auth/login', { body: { email: 'a@test.tn', password: PASSWORD } });
  check('connexion par email : état du compte renvoyé', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.account.blocked === false && r.body.user.sector === 'restaurant', r);
  r = await call('GET', '/auth/me', { token: A.token });
  check('profil : essai en cours, adresse confirmée', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.emailVerified === true, r);
  r = await call('POST', '/auth/verify-email', { body: { email: 'a@test.tn', token: 'x'.repeat(64) } });
  check('ancien lien de confirmation : une adresse déjà confirmée le reste', r.status === 200 && r.body.alreadyVerified === true, r);
  r = await call('POST', '/auth/resend-verification', { token: A.token });
  check('nouveau code pour une adresse déjà confirmée : rien à faire', r.status === 200 && r.body.alreadyVerified === true, r);
  r = await call('POST', '/auth/google', { body: { credential: 'x'.repeat(60) } });
  check('Google non configuré : 503, pas de connexion', r.status === 503, r);
  r = await call('POST', '/auth/apple', { body: { identityToken: 'x'.repeat(60) } });
  check('Apple non configuré : 503, pas de connexion', r.status === 503, r);
  r = await call('POST', '/auth/apple', { body: { identityToken: 'x'.repeat(60), role: 'admin' } });
  check('connexion Apple : champ « role » refusé (400)', r.status === 400, r);

  // ═════════════════════════ Abonnement vu par le client ═════════════════════════
  console.log('— Abonnement (client)');
  r = await call('GET', '/billing/subscription', { token: A.token });
  check('abonnement : essai, 1 utilisateur, aucune formule, prix en dollars', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.users.used === 1 && r.body.plan === null && r.body.payment.currency === 'USD', r);
  check('paiement par carte disponible (mode test), aucun paiement hors ligne par défaut', r.body.payment.onlinePayment === true && r.body.payment.online.enabled === true && r.body.payment.online.test === true && r.body.payment.online.methods.includes('card') && r.body.payment.manual === false && r.body.payment.methods.length === 0 && r.body.payment.instructions === null && r.body.checkout === null && r.body.pendingPayment === null && r.body.emailEnabled === true, r.body.payment);
  r = await call('GET', '/billing/subscription');
  check('abonnement sans connexion : 401', r.status === 401, r);

  // ═════════════════════════ Élévation de privilèges ═════════════════════════
  console.log('— Élévation de privilèges par le profil');
  r = await call('PATCH', '/users/profile', { token: B.token, body: { role: 'admin', ownerId: A.id, modules: {}, isActive: false, password: 'pirate', subscriptionEnd: '2099-01-01', accountStatus: 'ACTIVE', trialEndsAt: '2099-01-01', expiryEnforced: false, twoFactorEnabled: true, tokenVersion: 99, name: 'Nouveau Nom' } });
  check('profil modifié : 200', r.status === 200 && r.body.name === 'Nouveau Nom', r);
  check('le profil renvoyé ne contient aucun secret', !('password' in r.body) && !('twoFactorSecret' in r.body) && !('passwordResetHash' in r.body) && !('emailVerifyHash' in r.body) && !('tokenVersion' in r.body), Object.keys(r.body));
  const bRow = await one('SELECT role, "ownerId", "isActive", "accountStatus", "trialEndsAt", "expiryEnforced", "twoFactorEnabled", "tokenVersion", "subscriptionEnd", modules FROM users WHERE id = $1', [B.id]);
  check('rôle, rattachement, abonnement et essai inchangés', bRow.role === 'client' && bRow.ownerId === null && bRow.isActive === true && bRow.accountStatus === 'TRIAL' && bRow.expiryEnforced === true && bRow.twoFactorEnabled === false && bRow.tokenVersion === 0 && bRow.subscriptionEnd === null && new Date(bRow.trialEndsAt).getFullYear() < 2090 && bRow.modules.sales === true, bRow);
  r = await call('POST', '/auth/login', { body: { email: 'b@test.tn', password: PASSWORD } });
  check('le mot de passe n’a pas été changé par le profil', r.status === 200, r);
  for (const path of ['/admin/overview', '/admin/accounts', '/admin/clients', '/admin/plans', '/admin/settings', '/admin/payments', '/admin/sectors', '/admin/audit']) {
    r = await call('GET', path, { token: B.token });
    check(`client refusé sur ${path} : 403`, r.status === 403, r);
  }
  r = await call('POST', '/admin/clients', { token: B.token, body: { email: 'z@test.tn', password: PASSWORD, name: 'Z', companyName: 'Z', subscriptionDuration: 30 } });
  check('client refusé pour créer un compte (403, plus de 200 avec { error })', r.status === 403, r);

  // ═════════════════════════ Isolation entre sociétés ═════════════════════════
  console.log('— Isolation entre sociétés');
  const clientA = (await call('POST', '/clients', { token: A.token, body: { name: 'Client de A', email: 'ca@a.tn' } })).body;
  const supplierA = (await call('POST', '/suppliers', { token: A.token, body: { name: 'Fournisseur A', email: 'fa@a.tn' } })).body;
  const categoryA = (await call('POST', '/categories', { token: A.token, body: { name: 'Plats A' } })).body;
  const productA = (await call('POST', '/products', { token: A.token, body: { name: 'Pizza A', sku: 'PZ-A', price: 12, quantity: 0, categoryId: categoryA.id } })).body;
  const employeeA = (await call('POST', '/employees', { token: A.token, body: { name: 'Employé A', email: 'ea@a.tn', salary: 900 } })).body;
  check('A crée client, fournisseur, catégorie, produit, employé', [clientA, supplierA, categoryA, productA, employeeA].every((x) => x && x.id), [clientA, supplierA, categoryA, productA, employeeA]);

  for (const [what, path] of [['client', `/clients/${clientA.id}`], ['fournisseur', `/suppliers/${supplierA.id}`], ['produit', `/products/${productA.id}`], ['employé', `/employees/${employeeA.id}`]]) {
    r = await call('GET', path, { token: D.token });
    check(`D ne lit pas le ${what} de A (404)`, r.status === 404, r);
    r = await call('PUT', path, { token: D.token, body: { name: 'Piraté' } });
    check(`D ne modifie pas le ${what} de A (404)`, r.status === 404, r);
    r = await call('DELETE', path, { token: D.token });
    check(`D ne supprime pas le ${what} de A (404)`, r.status === 404, r);
  }
  r = await call('GET', '/clients', { token: D.token });
  check('la liste des clients de D ne contient rien de A', r.status === 200 && Array.isArray(r.body) && r.body.every((c) => c.id !== clientA.id), r);

  // « Créer » avec l'id d'une ligne existante ne doit pas l'écraser
  r = await call('POST', '/suppliers', { token: D.token, body: { id: supplierA.id, userId: A.id, name: 'Pirate', email: 'p@b.tn' } });
  check('création avec l’id d’un fournisseur de A : une NOUVELLE ligne est créée pour D', (r.status === 200 || r.status === 201) && r.body.id !== supplierA.id && r.body.userId === D.id, r);
  const supplierD = r.body;
  row = await one('SELECT name, "userId" FROM suppliers WHERE id = $1', [supplierA.id]);
  check('le fournisseur de A est intact', row.name === 'Fournisseur A' && row.userId === A.id, row);
  for (const [path, body, table, id] of [
    ['/clients', { id: clientA.id, name: 'Pirate', email: 'p@b.tn' }, 'clients', clientA.id],
    ['/categories', { id: categoryA.id, name: 'Pirate' }, 'categories', categoryA.id],
    ['/employees', { id: employeeA.id, name: 'Pirate', email: 'pe@b.tn' }, 'employees', employeeA.id],
    ['/departments', { id: 1, name: 'Dept D' }, null, null],
  ]) {
    r = await call('POST', path, { token: D.token, body });
    if (table) {
      row = await one(`SELECT "userId", name FROM "${table}" WHERE id = $1`, [id]);
      check(`POST ${path} avec l’id d’une ligne de A : la ligne de A reste à A`, row.userId === A.id && row.name !== 'Pirate', { r, row });
    } else {
      check(`POST ${path} : la ligne créée appartient à D`, (r.status === 200 || r.status === 201) && r.body.userId === D.id, r);
    }
  }
  // « Modifier » en changeant le rattachement ne doit pas déplacer la ligne chez une autre société
  r = await call('PUT', `/suppliers/${supplierD.id}`, { token: D.token, body: { userId: A.id, id: supplierA.id, name: 'Fournisseur D' } });
  check('modification avec un autre userId : acceptée mais le rattachement est ignoré', r.status === 200 && r.body.id === supplierD.id && r.body.userId === D.id, r);
  row = await one('SELECT COUNT(*)::int AS n FROM suppliers WHERE "userId" = $1', [A.id]);
  check('A n’a toujours qu’un fournisseur', row.n === 1, row);
  r = await call('POST', '/sales', { token: D.token, body: { productId: productA.id, quantity: 1, unitPrice: 5, clientName: 'X' } });
  check('D ne vend pas un produit de A', r.status === 404, r);

  // ═════════════════════════ Modules par secteur ═════════════════════════
  console.log('— Modules par secteur (contrôle côté serveur)');
  r = await call('POST', '/logistics/client/shipments', { token: A.token, body: { clientName: 'X', address: 'Y' } });
  check('restaurant : écrire dans la logistique est refusé (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED' && r.body.module === 'logistics', r);
  r = await call('POST', '/Logistics/client/shipments', { token: A.token, body: { clientName: 'X', address: 'Y' } });
  check('même refus avec une majuscule dans l’URL', r.status === 403 && r.body.code === 'MODULE_DISABLED', r);
  r = await call('GET', '/logistics/client/shipments', { token: A.token });
  check('les lectures restent ouvertes (tableau de bord, rapports)', r.status === 200 && Array.isArray(r.body), r);
  r = await call('POST', '/appointments', { token: B.token, body: { title: 'Rendez-vous B', startAt: new Date(Date.now() + 86400000).toISOString() } });
  check('commerce : le module Rendez-vous n’est pas dans son secteur (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED' && r.body.module === 'appointments', r);

  // ═════════════════════════ Logistique et transporteurs ═════════════════════════
  console.log('— Logistique : expéditions, transporteurs, cloisonnement');
  r = await call('POST', '/transporteurs', { token: C.token, body: { name: 'Livreur C1', email: 'c1@test.tn', phone: '98 111 222', password: '123456' } });
  check('transporteur : mot de passe faible refusé (400 au lieu d’une erreur 500)', r.status === 400, r);
  r = await call('POST', '/transporteurs', { token: C.token, body: { name: 'Livreur C1', email: 'c1@test.tn', phone: '98 111 222', password: 'Livreur#2026' } });
  check('transporteur créé pour C', (r.status === 200 || r.status === 201) && r.body.id && r.body.clientId === C.id, r);
  const carrierC = r.body;
  r = await call('POST', '/transporteurs', { token: D.token, body: { name: 'Livreur D1', email: 'd1@test.tn', password: 'Livreur#2026' } });
  const carrierD = r.body;
  r = await call('POST', '/logistics/client/shipments', { token: C.token, body: { trackingNumber: 'TN-0001', clientName: '', address: 'Tunis' } });
  check('expédition sans destinataire : 400 avec un message clair', r.status === 400 && /Destinataire/.test(String(r.body.message)), r);
  r = await call('POST', '/logistics/client/shipments', { token: C.token, body: { trackingNumber: 'TN-0001', clientName: 'Client 1', address: 'Tunis', phone: '22 535 181', amount: '25.5', transporteurId: carrierC.id, status: '' } });
  check('expédition créée et confiée au transporteur', (r.status === 200 || r.status === 201) && r.body.trackingNumber === 'TN-0001' && r.body.transporteurId === carrierC.id && r.body.status === 'pending' && Number(r.body.amount) === 25.5, r);
  const s1 = r.body;
  r = await call('POST', '/logistics/client/shipments', { token: C.token, body: { trackingNumber: 'TN-0001', clientName: 'Autre', address: 'Sfax' } });
  check('même numéro de suivi dans la même société : 409', r.status === 409, r);
  r = await call('POST', '/logistics/client/shipments', { token: D.token, body: { trackingNumber: 'TN-0001', clientName: 'Client D', address: 'Bizerte', transporteurId: carrierD.id } });
  check('même numéro de suivi dans une AUTRE société : accepté', (r.status === 200 || r.status === 201) && r.body.clientId === D.id, r);
  const s2 = r.body;
  r = await call('POST', '/logistics/client/shipments', { token: C.token, body: { clientName: 'Sans numéro', address: 'Nabeul' } });
  check('numéro de suivi proposé automatiquement', (r.status === 200 || r.status === 201) && /^EXP-\d{8}-\d+$/.test(r.body.trackingNumber), r);
  const s3 = r.body;
  r = await call('PUT', `/logistics/client/shipments/${s3.id}`, { token: C.token, body: { transporteurId: carrierD.id } });
  check('confier un colis au transporteur d’une autre société : refusé', r.status === 400, r);
  r = await call('PATCH', `/logistics/client/shipments/${s2.id}/assign`, { token: C.token, body: { transporteurId: carrierC.id } });
  check('C ne touche pas à l’expédition de D (404)', r.status === 404, r);
  r = await call('PATCH', `/logistics/client/shipments/${s3.id}/status`, { token: C.token, body: { status: 'envolé' } });
  check('statut inconnu refusé', r.status === 400, r);
  r = await call('GET', '/logistics/stats', { token: C.token });
  check('statistiques logistiques réelles', r.status === 200 && r.body.total === 2 && r.body.pending === 2 && r.body.unassigned === 1 && r.body.carriers === 1 && r.body.byCarrier[0].total === 1 && r.body.byMonth.length === 6, r);

  r = await call('POST', '/auth/login', { body: { email: 'c1@test.tn', password: 'Livreur#2026' } });
  check('le transporteur se connecte (pas d’abonnement propre)', r.status === 200 && r.body.user.role === 'transporteur' && r.body.account === null, r);
  const carrierToken = r.body.access_token;
  r = await call('GET', '/transporteur/shipments', { token: carrierToken });
  check('le transporteur ne voit que ses expéditions', r.status === 200 && r.body.length === 1 && r.body[0].id === s1.id, r);
  r = await call('GET', '/logistics/shipments', { token: carrierToken });
  check('même résultat par /logistics/shipments (plus de confusion d’identifiants)', r.status === 200 && r.body.length === 1 && r.body[0].id === s1.id, r);
  r = await call('PATCH', `/transporteur/shipments/${s1.id}/status`, { token: carrierToken, body: { status: 'in_transit' } });
  check('le transporteur met à jour le statut de SON expédition', r.status === 200 && r.body.status === 'in_transit', r);
  r = await call('PATCH', `/transporteur/shipments/${s2.id}/status`, { token: carrierToken, body: { status: 'delivered' } });
  check('il ne peut pas toucher à l’expédition d’une autre société (404)', r.status === 404, r);
  r = await call('PATCH', `/logistics/transporteur/shipments/${s2.id}/status`, { token: carrierToken, body: { status: 'delivered' } });
  check('ni par l’autre route', r.status === 403 || r.status === 404, r);
  for (const [m, p] of [['GET', '/logistics/client/shipments'], ['GET', '/transporteurs'], ['POST', '/logistics/client/shipments'], ['GET', '/logistics/stats']]) {
    r = await call(m, p, { token: carrierToken, body: m === 'POST' ? { clientName: 'x', address: 'y' } : undefined });
    check(`transporteur refusé sur ${m} ${p} (403)`, r.status === 403, r);
  }
  r = await call('DELETE', `/transporteurs/${carrierD.id}`, { token: C.token });
  check('C ne supprime pas le transporteur de D (404)', r.status === 404, r);

  // ═════════════════════════ Suggestions du secteur ═════════════════════════
  console.log('— Suggestions par secteur → produits de la société');
  r = await call('GET', '/billing/suggestions', { token: C.token });
  check('suggestions du secteur de la société', r.status === 200 && r.body.current === 'logistics' && r.body.items.length === logisticsItems.length, r.body.current);
  const service = logisticsItems.find((i) => i.kind === 'service');
  const goods = logisticsItems.filter((i) => i.kind === 'product').slice(0, 2);
  r = await call('POST', '/products/suggestions/import', { token: C.token, body: { itemIds: [service.id, ...goods.map((g) => g.id)], overrides: { [goods[0].id]: { price: 3.3 } } } });
  check('3 suggestions copiées dans les produits de C', (r.status === 200 || r.status === 201) && r.body.created === 3 && r.body.skipped === 0, r);
  const productsC = (await call('GET', '/products', { token: C.token })).body;
  const pService = productsC.find((p) => p.name === service.name);
  const pGoods = productsC.find((p) => p.name === goods[0].name);
  check('prestation créée sans stock, au prix suggéré', pService && pService.isStockable === false && Number(pService.price) === Number(service.sellingPrice), pService);
  check('produit créé avec le prix choisi par la société et le coût indicatif', pGoods && Number(pGoods.price) === 3.3 && Number(pGoods.avgCost) === Number(goods[0].purchasePrice) && pGoods.categoryId, pGoods);
  r = await call('POST', '/products/suggestions/import', { token: C.token, body: { itemIds: [service.id, goods[0].id] } });
  check('nouvel import : rien n’est créé en double', r.body.created === 0 && r.body.skipped === 2, r);
  r = await call('GET', `/products/${pGoods.id}`, { token: D.token });
  check('les produits créés restent privés à C', r.status === 404, r);
  row = await one('SELECT COUNT(*)::int AS n FROM sector_items');
  check('le catalogue de la plateforme n’est pas modifié par l’import', row.n > 50, row);

  // ═════════════════════════ Équipe ═════════════════════════
  console.log('— Équipe : droits et casse des URL');
  r = await call('POST', '/team/members', { token: A.token, body: { email: 'v@test.tn', name: 'Viewer A', role: 'viewer', password: 'Viewer#2026' } });
  check('membre d’équipe invité', r.status === 201 && r.body.id, r);
  r = await call('POST', '/auth/login', { body: { email: 'v@test.tn', password: 'Viewer#2026' } });
  const viewerToken = r.body.access_token;
  check('le membre hérite de l’état du compte de sa société', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.user.isTeamMember === true, r);
  r = await call('DELETE', `/products/${productA.id}`, { token: viewerToken });
  check('lecteur : suppression refusée (403)', r.status === 403, r);
  r = await call('DELETE', `/Products/${productA.id}`, { token: viewerToken });
  check('lecteur : même refus avec « /Products » (contournement par la casse fermé)', r.status === 403, r);
  r = await call('GET', '/Audit', { token: viewerToken });
  check('lecteur : journal d’audit refusé même avec une majuscule', r.status === 403, r);
  r = await call('GET', '/billing/subscription', { token: viewerToken });
  check('le membre consulte l’abonnement sans pouvoir le gérer', r.status === 200 && r.body.canManage === false && r.body.users.used === 2, r);
  r = await call('POST', '/billing/payments', { token: viewerToken, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer' } });
  check('seul le propriétaire déclare un paiement (403)', r.status === 403, r);
  r = await call('POST', '/billing/checkout', { token: viewerToken, body: { planCode: 'starter', billingCycle: 'monthly' } });
  check('seul le propriétaire paie par carte (403)', r.status === 403, r);
  r = await call('PUT', '/billing/modules', { token: viewerToken, body: { modules: ['sales'] } });
  check('seul le propriétaire choisit les modules (403)', r.status === 403, r);

  // ═════════════════════════ Routes autrefois ouvertes sans connexion ═════════════════════════
  console.log('— Routes autrefois anonymes');
  for (const path of ['/customers', '/export', '/search']) {
    r = await call('GET', path);
    check(`${path} sans connexion : 401`, r.status === 401, r);
    r = await call('POST', path, { body: { name: 'x' } });
    check(`POST ${path} sans connexion : 401`, r.status === 401, r);
    r = await call('GET', path, { token: A.token });
    check(`${path} avec un compte client : 403`, r.status === 403, r);
  }

  // ═════════════════════════ Administrateur ═════════════════════════
  console.log('— Administrateur de la plateforme');
  await db.query(`INSERT INTO users (email,password,name,role,modules) VALUES ($1,$2,'Admin','admin','{}')`, ['admin@test.tn', await bcrypt.hash('Admin#2026-secret', 10)]);
  r = await call('POST', '/auth/login', { body: { email: 'admin@test.tn', password: 'Admin#2026-secret' } });
  check('connexion administrateur (pas d’abonnement)', r.status === 200 && r.body.user.role === 'admin' && r.body.account === null, r);
  const admin = r.body.access_token;
  r = await call('GET', '/admin/overview', { token: admin });
  check('tableau de bord : 5 comptes dont 4 en essai, aucun revenu inventé', r.status === 200 && r.body.customers.total === 5 && r.body.customers.trial === 4 && r.body.customers.active === 1 && r.body.customers.paying === 0 && r.body.mrr === 0 && r.body.revenue.ht === 0 && r.body.newRegistrations === 5, r.body.customers);
  check('répartition par secteur et par module', r.body.sectors.find((s) => s.code === 'restaurant')?.count === 1 && r.body.modules.find((m) => m.key === 'sales')?.count === 5, r.body.sectors);
  r = await call('GET', '/admin/accounts?status=TRIAL&q=transports', { token: admin });
  check('recherche et filtre des comptes', r.status === 200 && r.body.total === 1 && r.body.items[0].id === C.id && r.body.items[0].account.status === 'TRIAL', r);
  r = await call('GET', '/admin/accounts?limit=2&offset=0', { token: admin });
  check('pagination côté serveur', r.body.total === 5 && r.body.items.length === 2 && r.body.limit === 2, r.body.total);
  r = await call('GET', '/admin/clients', { token: admin });
  check('ancienne liste des clients : uniquement les propriétaires (pas les membres d’équipe)', r.status === 200 && r.body.length === 5 && r.body.every((c) => !('password' in c)), r.body.length);

  r = await call('GET', '/admin/settings', { token: admin });
  check('réglages de départ : dollars, code de vérification actif, paiement par carte en ligne (mode test), hors ligne fermé', r.status === 200 && r.body.currency === 'USD' && r.body.requireEmailVerification === true && r.body.emailVerificationActive === true && r.body.manualPayments === false && r.body.onlinePayment.enabled === true && r.body.onlinePayment.provider === 'konnect' && r.body.onlinePayment.mode === 'sandbox' && r.body.onlinePayment.reason === null && r.body.catalogVersion === 4, r.body.onlinePayment);
  check('la clé Konnect ne sort jamais du serveur', !JSON.stringify(r.body).includes('e2e-konnect-key') && !JSON.stringify(r.body).includes('e2e-wallet'), Object.keys(r.body));
  r = await call('PUT', '/admin/settings', { token: admin, body: { requireEmailVerification: false } });
  check('code de vérification désactivé par l’administrateur : accepté', r.status === 200 && r.body.requireEmailVerification === false, r);
  r = await call('GET', '/public/config');
  check('le site le sait : plus de code demandé', r.body.requireEmailVerification === false, r.body);
  {
    const seen = smtp.mails.length;
    const off = await call('POST', '/auth/register', { body: signup({ email: 'off@test.tn', companyName: 'Sans code', sector: 'commerce' }) });
    check('sans code exigé : l’ERP est ouvert tout de suite (le code part quand même par email)', off.status === 201 && off.body.verification.required === false && off.body.account.blocked === false, off.body.verification);
    const offToken = off.body.access_token;
    r = await call('GET', '/clients', { token: offToken });
    check('et il fonctionne sans confirmation', r.status === 200, r);
    await db.query(`DELETE FROM users WHERE email = 'off@test.tn'`);
    void seen;
  }
  r = await call('PUT', '/admin/settings', { token: admin, body: { requireEmailVerification: true } });
  check('code de vérification réactivé (le serveur sait envoyer des emails)', r.status === 200 && r.body.requireEmailVerification === true, r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { paymentInstructions: 'Virement : RIB 08 006 0123456789012 34', supportEmail: 'support@test.tn', trialReminderHours: 24 } });
  check('réglages enregistrés', r.status === 200 && r.body.supportEmail === 'support@test.tn', r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { trialHours: 0 } });
  check('durée d’essai invalide refusée', r.status === 400, r);
  r = await call('GET', '/admin/settings', { token: admin });
  check('réglages : moyens de paiement tunisiens connus, Apple et Google non configurés, emails configurés', r.status === 200 && ['bank_transfer', 'd17', 'flouci', 'edinar', 'postal', 'cheque', 'cash', 'card'].every((m) => r.body.paymentMethodOptions.includes(m)) && r.body.paymentMethods.join() === 'bank_transfer,d17,flouci,cheque,cash' && r.body.appleConfigured === false && r.body.googleConfigured === false && r.body.mailConfigured === true, r.body);
  r = await call('PUT', '/admin/settings', { token: admin, body: { currency: 'dollars' } });
  check('devise mal écrite refusée (code ISO à 3 lettres)', r.status === 400, r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { currency: 'MAD' } });
  check('devise que le prestataire ne gère pas : acceptée mais le paiement en ligne se signale indisponible', r.status === 200, r);
  r = await call('GET', '/admin/settings', { token: admin });
  check('l’administration voit pourquoi (CURRENCY_UNSUPPORTED)', r.body.onlinePayment.enabled === false && r.body.onlinePayment.reason === 'CURRENCY_UNSUPPORTED', r.body.onlinePayment);
  r = await call('POST', '/billing/checkout', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly' } });
  check('le client reçoit « paiement en cours d’activation » (503), sans détail technique', r.status === 503 && r.body.code === 'ONLINE_PAYMENT_UNAVAILABLE' && !/konnect/i.test(JSON.stringify(r.body)), r);
  check('aucune page de paiement n’a été ouverte chez le prestataire', konnect.initCount() === 0, konnect.initCount());
  r = await call('PUT', '/admin/settings', { token: admin, body: { currency: 'USD' } });
  check('retour au dollar', r.status === 200 && r.body.currency === 'USD', r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { paymentLink: 'javascript:alert(1)' } });
  check('lien de paiement : seul https est accepté', r.status === 400, r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { paymentLink: 'http://pay.exemple.tn/inovexa' } });
  check('lien de paiement en http : refusé', r.status === 400, r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { paymentLink: 'https://pay.exemple.tn/inovexa', paymentMethods: ['bank_transfer', 'd17', 'flouci', 'cheque', 'cash', 'card'] } });
  check('lien de paiement enregistré', r.status === 200 && r.body.paymentLink === 'https://pay.exemple.tn/inovexa' && r.body.paymentMethods.includes('card'), r);
  r = await call('GET', '/billing/subscription', { token: B.token });
  check('paiements hors ligne fermés : le client ne voit ni lien, ni coordonnées bancaires, ni moyens hors ligne', r.status === 200 && r.body.payment.manual === false && r.body.payment.link === null && r.body.payment.instructions === null && r.body.payment.methods.length === 0, r.body.payment);
  r = await call('POST', '/billing/payments', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer' } });
  check('déclarer un paiement hors ligne : refusé tant que l’administrateur ne l’a pas ouvert (403 MANUAL_PAYMENTS_DISABLED)', r.status === 403 && r.body.code === 'MANUAL_PAYMENTS_DISABLED', r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { manualPayments: true } });
  check('l’administrateur ouvre (facultatif) les paiements hors ligne', r.status === 200 && r.body.manualPayments === true, r);
  r = await call('GET', '/billing/subscription', { token: B.token });
  check('le client voit alors le lien de paiement, les coordonnées et les moyens proposés', r.status === 200 && r.body.payment.manual === true && r.body.payment.link === 'https://pay.exemple.tn/inovexa' && /RIB/.test(r.body.payment.instructions) && r.body.payment.methods.includes('card') && r.body.payment.methods.includes('flouci'), r.body.payment);
  r = await call('GET', '/public/config');
  check('le site propose alors aussi les moyens hors ligne', r.body.paymentMethods.includes('bank_transfer') && r.body.paymentMethods.includes('card'), r.body.paymentMethods);
  r = await call('PUT', '/admin/settings', { token: admin, body: { paymentLink: '', paymentMethods: ['bank_transfer', 'd17', 'flouci', 'cheque', 'cash'] } });
  check('lien de paiement retiré', r.status === 200 && r.body.paymentLink === null, r);

  const plans = (await call('GET', '/admin/plans', { token: admin })).body;
  const starter = plans.find((p) => p.code === 'starter');
  check('3 formules en dollars, déjà publiées : le client peut acheter seul, sans attendre l’administrateur', plans.length === 3 && plans.every((p) => p.isPublic === true && p.isActive === true) && starter.priceMonthly === 15 && starter.modules.includes('appointments'), plans.map((p) => [p.code, p.isPublic]));
  r = await call('PATCH', `/admin/plans/${starter.id}`, { token: admin, body: { isPublic: false } });
  check('l’administrateur peut retirer une formule du site', r.status === 200 && r.body.isPublic === false, r);
  r = await call('POST', '/billing/payments', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer' } });
  check('formule retirée : le client ne peut pas la souscrire', r.status === 400, r);
  r = await call('POST', '/billing/checkout', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly' } });
  check('formule retirée : pas de paiement par carte non plus', r.status === 400, r);
  r = await call('PATCH', `/admin/plans/${starter.id}`, { token: admin, body: { isPublic: true } });
  check('l’administrateur republie la formule Starter', r.status === 200 && r.body.isPublic === true, r);
  r = await call('GET', '/public/plans');
  check('les trois formules sont sur le site', r.body.plans.length === 3 && r.body.plans[0].code === 'starter', r.body.plans.map((p) => p.code));
  r = await call('PATCH', `/admin/plans/${starter.id}`, { token: admin, body: { modules: ['astrologie'] } });
  check('module inconnu refusé dans une formule', r.status === 400, r);

  // ═════════════════════════ Fin de l'essai ═════════════════════════
  console.log('— Fin de l’essai (72 h écoulées, simulées en base)');
  const countsBefore = await one('SELECT (SELECT COUNT(*) FROM clients WHERE "userId" = $1)::int AS clients, (SELECT COUNT(*) FROM products WHERE "userId" = $1)::int AS products, (SELECT COUNT(*) FROM employees WHERE "userId" = $1)::int AS employees', [A.id]);
  await db.query(`UPDATE users SET "trialStartedAt" = now() - interval '72 hours 1 minute', "trialEndsAt" = now() - interval '1 minute' WHERE id = $1`, [A.id]);
  r = await call('GET', '/clients', { token: A.token });
  check('ERP fermé : 402 avec le motif TRIAL_EXPIRED', r.status === 402 && r.body.code === 'SUBSCRIPTION_REQUIRED' && r.body.reason === 'TRIAL_EXPIRED' && r.body.status === 'EXPIRED', r);
  r = await call('POST', '/clients', { token: A.token, body: { name: 'Après essai', email: 'x@a.tn' } });
  check('écriture refusée aussi (402)', r.status === 402, r);
  r = await call('GET', '/products', { token: viewerToken });
  check('le membre d’équipe est bloqué avec sa société', r.status === 402, r);
  r = await call('PATCH', '/users/profile', { token: A.token, body: { name: 'X' } });
  check('modifier son profil ne contourne rien (402)', r.status === 402, r);
  r = await call('GET', '/auth/me', { token: A.token });
  check('le profil reste lisible et annonce le blocage', r.status === 200 && r.body.account.blocked === true && r.body.account.status === 'EXPIRED' && r.body.account.remainingSeconds === 0, r.body.account);
  r = await call('GET', '/billing/subscription', { token: A.token });
  check('la page Abonnement reste accessible, avec les instructions de paiement', r.status === 200 && r.body.account.blocked === true && /RIB/.test(r.body.payment.instructions) && r.body.support.email === 'support@test.tn', r.body.account);
  r = await call('POST', '/auth/login', { body: { email: 'a@test.tn', password: PASSWORD } });
  check('la connexion reste possible pour régulariser', r.status === 200 && r.body.account.blocked === true, r);
  await sleep(400);
  row = await one('SELECT "accountStatus", "statusReason" FROM users WHERE id = $1', [A.id]);
  check('état EXPIRED enregistré en base', row.accountStatus === 'EXPIRED' && row.statusReason === 'TRIAL_EXPIRED', row);
  const countsAfter = await one('SELECT (SELECT COUNT(*) FROM clients WHERE "userId" = $1)::int AS clients, (SELECT COUNT(*) FROM products WHERE "userId" = $1)::int AS products, (SELECT COUNT(*) FROM employees WHERE "userId" = $1)::int AS employees', [A.id]);
  check('aucune donnée supprimée à l’expiration', JSON.stringify(countsBefore) === JSON.stringify(countsAfter) && countsAfter.clients === 1 && countsAfter.products === 1, [countsBefore, countsAfter]);
  r = await call('GET', '/clients', { token: B.token });
  check('les autres sociétés ne sont pas affectées', r.status === 200, r);

  r = await call('POST', '/billing/contact', { token: A.token, body: { subject: 'Essai terminé', message: 'Bonjour, je souhaite un délai supplémentaire.' } });
  check('plus de formulaire « écrire à l’administrateur » : le client choisit et paie seul (404)', r.status === 404, r);
  r = await call('GET', '/admin/messages', { token: admin });
  check('plus de boîte de messages côté administrateur (404)', r.status === 404, r);
  r = await call('GET', '/admin/overview', { token: admin });
  check('le tableau de bord ne compte plus de messages', !('unreadMessages' in r.body), Object.keys(r.body));

  // ═════════════════════════ Paiement et réactivation ═════════════════════════
  console.log('— Paiement hors ligne (facultatif) : déclaré puis validé par l’administrateur');
  r = await call('POST', '/billing/payments', { token: A.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer', reference: 'VIR-2026-001', amountHT: 1, amountTTC: 1 } });
  check('paiement hors ligne déclaré : montant pris sur la formule (15 $ HT, 17,85 $ TTC), pas sur la requête', r.status === 201 && r.body.status === 'pending' && r.body.provider === 'manual' && r.body.amountHT === 15 && r.body.amountTTC === 17.85 && r.body.vatRate === 19 && r.body.currency === 'USD', r);
  const payment = r.body;
  r = await call('POST', '/billing/payments', { token: A.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer' } });
  check('un seul paiement en attente à la fois (409)', r.status === 409, r);
  r = await call('POST', '/billing/payments', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'card' } });
  check('moyen de paiement non proposé : refusé', r.status === 400, r);
  r = await call('POST', '/billing/payments', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'inconnu' } });
  check('moyen de paiement inconnu : refusé', r.status === 400, r);
  r = await call('GET', '/clients', { token: A.token });
  check('déclarer ne suffit pas : toujours bloqué tant que l’administrateur n’a pas validé', r.status === 402, r);
  r = await call('POST', `/admin/payments/${payment.id}/validate`, { token: D.token });
  check('un client ne valide pas un paiement (403)', r.status === 403, r);
  r = await call('POST', `/admin/payments/${payment.id}/validate`, { token: A.token });
  check('ni le compte bloqué lui-même (402)', r.status === 402, r);
  r = await call('GET', `/billing/payments/${payment.id}/receipt`, { token: A.token });
  check('pas de reçu avant validation', r.status === 404, r);
  r = await call('GET', '/admin/payments?status=pending', { token: admin });
  check('l’administrateur voit le paiement en attente', r.status === 200 && r.body.total === 1 && r.body.items[0].account.email === 'a@test.tn', r);
  r = await call('POST', `/admin/payments/${payment.id}/validate`, { token: admin });
  check('paiement validé : reçu numéroté, période d’un mois', r.status === 200 && r.body.status === 'validated' && /^REC-\d{4}-\d{5}$/.test(r.body.receiptNumber) && r.body.periodEnd, r);
  const periodDays = (new Date(r.body.periodEnd).getTime() - new Date(r.body.periodStart).getTime()) / 86400000;
  check('période : 1 mois calendaire', periodDays >= 28 && periodDays <= 31, periodDays);
  r = await call('POST', `/admin/payments/${payment.id}/validate`, { token: admin });
  check('un paiement ne se valide pas deux fois (409)', r.status === 409, r);
  r = await call('GET', '/clients', { token: A.token });
  check('accès rétabli après validation', r.status === 200 && r.body.length === 1, r);
  r = await call('GET', '/billing/subscription', { token: A.token });
  check('abonnement actif : formule Starter, 3 utilisateurs maximum', r.body.account.status === 'ACTIVE' && r.body.account.blocked === false && r.body.plan.code === 'starter' && r.body.users.limit === 3 && r.body.account.planCode === 'starter', r.body.account);
  check('modules = secteur ∩ formule (RH retiré, caisse gardée)', r.body.modules.pos === true && r.body.modules.hr === false && r.body.modules.finance === false && r.body.modules.logistics === false, r.body.modules);
  r = await call('GET', `/billing/payments/${payment.id}/receipt`, { token: A.token });
  check('reçu disponible, avec la mention qu’il ne remplace pas la facture légale', r.status === 200 && r.body.amountTTC === 17.85 && r.body.currency === 'USD' && r.body.customer.taxId === '1234567X/A/M/000' && /facture légale/.test(r.body.notice), r);
  r = await call('GET', `/billing/payments/${payment.id}/receipt`, { token: B.token });
  check('le reçu d’une autre société est introuvable (404)', r.status === 404, r);
  r = await call('POST', '/employees', { token: A.token, body: { name: 'Nouvel employé', email: 'ne@a.tn' } });
  check('module RH hors formule : écriture refusée (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED', r);
  r = await call('POST', '/projects', { token: A.token, body: { name: 'Projet A' } });
  check('module Projets hors formule (ni projets ni comptabilité) : écriture refusée (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED' && r.body.module === 'projects', r);
  r = await call('POST', '/appointments', { token: A.token, body: { title: 'Table de 4', startAt: new Date(Date.now() + 86400000).toISOString(), partySize: 4 } });
  check('module Rendez-vous inclus dans la formule Starter : l’agenda du restaurant fonctionne', r.status === 201 && r.body.userId === A.id, r);

  // ── Trois notions séparées : disponibles (formule) / par défaut (secteur) / activés (client). L'administrateur retire un module de
  //    la formule APRÈS l'abonnement : il se ferme aussitôt pour le client, son choix reste enregistré, et reprend effet si la formule le remet.
  const STARTER_MODULES = ['products', 'categories', 'stock', 'sales', 'pos', 'purchases', 'orders', 'clients', 'suppliers', 'invoices', 'appointments', 'reports'];
  r = await call('POST', '/suppliers', { token: A.token, body: {} });
  check('avant la modification de la formule : écrire chez les fournisseurs n’est pas bloqué par les modules', r.status !== 403, r);
  r = await call('PATCH', `/admin/plans/${starter.id}`, { token: admin, body: { modules: STARTER_MODULES.filter((m) => m !== 'suppliers') } });
  check('l’administrateur retire « Fournisseurs » de la formule Starter', r.status === 200 && !r.body.modules.includes('suppliers'), r);
  r = await call('POST', '/suppliers', { token: A.token, body: {} });
  check('formule modifiée : l’écriture est refusée aussitôt (403 MODULE_DISABLED), sans reconnexion', r.status === 403 && r.body.code === 'MODULE_DISABLED' && r.body.module === 'suppliers', r);
  r = await call('GET', '/auth/me', { token: A.token });
  check('… la barre latérale (GET /auth/me) ne propose plus le module', r.status === 200 && r.body.modules.suppliers === false && r.body.modules.sales === true, r.body.modules);
  r = await call('GET', '/billing/modules', { token: A.token });
  const supView = r.body.modules.find((m) => m.key === 'suppliers');
  check('… « Mes modules » distingue : activé par le client, mais non disponible dans sa formule, donc non utilisable', supView.activated === true && supView.included === false && supView.enabled === false && supView.recommended === true, supView);
  row = await one('SELECT modules FROM users WHERE id = $1', [A.id]);
  check('… le choix du client reste enregistré (rien n’est effacé)', row.modules.suppliers === true, row.modules);
  r = await call('PATCH', `/admin/plans/${starter.id}`, { token: admin, body: { modules: STARTER_MODULES } });
  check('l’administrateur remet « Fournisseurs » dans la formule', r.status === 200 && r.body.modules.includes('suppliers'), r);
  r = await call('POST', '/suppliers', { token: A.token, body: {} });
  check('… le module reprend effet aussitôt, avec le choix d’origine du client', r.status !== 403, r);
  r = await call('GET', '/billing/modules', { token: A.token });
  check('… disponible, par défaut du secteur, activé et utilisable', r.body.modules.find((m) => m.key === 'suppliers').enabled === true && r.body.modules.find((m) => m.key === 'suppliers').included === true, r.body.modules.find((m) => m.key === 'suppliers'));

  row = await one('SELECT COUNT(*)::int AS n FROM employees WHERE "userId" = $1', [A.id]);
  check('les employés déjà saisis sont conservés', row.n === 1, row);

  r = await call('POST', '/team/members', { token: A.token, body: { email: 'v2@test.tn', name: 'Vendeur', role: 'sales', password: 'Vendeur#2026' } });
  check('3e utilisateur accepté (limite de la formule : 3)', r.status === 201, r);
  r = await call('POST', '/team/members', { token: A.token, body: { email: 'v3@test.tn', name: 'Trop', role: 'sales', password: 'Vendeur#2026' } });
  check('4e utilisateur refusé avec un message qui explique la limite', r.status === 400 && /limitée à 3/.test(String(r.body.message)), r);

  r = await call('GET', '/admin/overview', { token: admin });
  check('tableau de bord : 1 client payant, revenu récurrent 15 $, revenu réel 15 $ HT (en dollars)', r.body.currency === 'USD' && r.body.customers.paying === 1 && r.body.mrr === 15 && r.body.revenue.ht === 15 && r.body.revenue.ttc === 17.85 && r.body.pendingPayments === 0, { currency: r.body.currency, customers: r.body.customers, mrr: r.body.mrr, revenue: r.body.revenue });
  check('conversions calculées sur les comptes réels', r.body.conversion.signups === 5 && r.body.conversion.signupsPaid === 1 && r.body.conversion.subscriptionRate === 20 && r.body.conversion.trialsEnded === 1 && r.body.conversion.trialToPaidRate === 100, r.body.conversion);
  check('formule la plus utilisée', r.body.plans[0]?.code === 'starter' && r.body.plans[0].count === 1, r.body.plans);
  r = await call('GET', '/admin/stats', { token: admin });
  check('ancien écran : chiffres réels (plus de case vide)', r.status === 200 && r.body.totalClients === 5 && r.body.totalRevenue === 17.85 && r.body.expiredClients === 0, r);
  r = await call('GET', `/admin/accounts/${A.id}`, { token: admin });
  check('fiche du compte : société, équipe, paiements, activité, volumes', r.status === 200 && r.body.company.taxId === '1234567X/A/M/000' && r.body.team.length === 2 && r.body.payments.length === 1 && r.body.activity.length > 3 && r.body.usage.clients === 1, { team: r.body.team?.length, usage: r.body.usage });
  r = await call('GET', '/admin/audit', { token: admin });
  check('journal : validation du paiement et changements d’état tracés', r.status === 200 && r.body.items.some((i) => i.action === 'payment_validated') && r.body.items.some((i) => i.action === 'account_expired') && r.body.items.some((i) => i.action === 'account_registered'), r.body.items.map((i) => i.action).slice(0, 12));

  // ═════════════════════════ Suspension, réactivation, essai prolongé ═════════════════════════
  console.log('— Suspension et réactivation');
  r = await call('POST', `/admin/accounts/${A.id}/suspend`, { token: admin, body: { reason: 'Impayé' } });
  check('compte suspendu', r.status === 200 && r.body.status === 'SUSPENDED' && r.body.blocked === true, r);
  r = await call('GET', '/clients', { token: A.token });
  check('compte suspendu : 402 SUSPENDED, bien que l’abonnement soit payé', r.status === 402 && r.body.reason === 'SUSPENDED', r);
  r = await call('POST', '/auth/login', { body: { email: 'a@test.tn', password: PASSWORD } });
  check('un compte suspendu peut se connecter pour voir sa situation', r.status === 200 && r.body.account.reason === 'SUSPENDED', r);
  r = await call('POST', `/admin/accounts/${A.id}/reactivate`, { token: admin });
  check('réactivation : le compte retrouve son abonnement payé', r.status === 200 && r.body.status === 'ACTIVE' && r.body.blocked === false, r);
  r = await call('GET', '/clients', { token: A.token });
  check('accès rétabli', r.status === 200, r);

  await db.query(`UPDATE users SET "trialEndsAt" = now() - interval '1 hour' WHERE id = $1`, [D.id]);
  r = await call('GET', '/products', { token: D.token });
  check('D : essai terminé, bloqué', r.status === 402, r);
  r = await call('POST', `/admin/accounts/${D.id}/extend-trial`, { token: admin, body: { hours: 48 } });
  check('l’administrateur rouvre l’essai pour 48 h', r.status === 200 && r.body.status === 'TRIAL' && r.body.remainingSeconds > 47 * 3600 && r.body.remainingSeconds <= 48 * 3600, r);
  r = await call('GET', '/products', { token: D.token });
  check('D retrouve l’accès', r.status === 200, r);
  r = await call('POST', `/admin/accounts/${D.id}/activate`, { token: admin, body: {} });
  check('activer sans durée ni date : refusé', r.status === 400, r);
  r = await call('POST', `/admin/accounts/${D.id}/activate`, { token: admin, body: { months: 12, planCode: 'business' } });
  check('activation manuelle pour 12 mois', r.status === 200 && r.body.status === 'ACTIVE' && r.body.planCode === 'business' && r.body.remainingSeconds > 360 * 86400, r);
  r = await call('POST', `/admin/accounts/${D.id}/cancel`, { token: admin, body: { reason: 'Demande du client' } });
  check('résiliation', r.status === 200 && r.body.status === 'CANCELLED', r);
  r = await call('GET', '/products', { token: D.token });
  check('compte résilié : 402 CANCELLED', r.status === 402 && r.body.reason === 'CANCELLED', r);
  row = await one('SELECT COUNT(*)::int AS n FROM shipments WHERE "clientId" = $1', [D.id]);
  check('les données du compte résilié sont conservées', row.n === 1, row);
  r = await call('POST', `/admin/accounts/${C.id}/suspend`, { token: admin, body: {} });
  r = await call('GET', '/transporteur/shipments', { token: carrierToken });
  check('le transporteur garde son accès à ses livraisons (compte distinct)', r.status === 200, r);
  await call('POST', `/admin/accounts/${C.id}/reactivate`, { token: admin });

  // ═════════════════════════ Balayage : rappels ═════════════════════════
  console.log('— Balayage périodique');
  await db.query(`UPDATE users SET "trialEndsAt" = now() + interval '2 hours' WHERE id = $1`, [B.id]);
  await db.query(`UPDATE users SET "trialEndsAt" = now() - interval '5 minutes' WHERE id = $1`, [C.id]);
  r = await call('POST', '/admin/maintenance/sweep', { token: admin });
  check('balayage : 1 essai expiré, 1 rappel avant échéance', r.status === 200 && r.body.expired === 1 && r.body.reminders === 1, r);
  r = await call('POST', '/admin/maintenance/sweep', { token: admin });
  check('second balayage : aucun rappel en double', r.body.expired === 0 && r.body.reminders === 0, r);
  row = await one('SELECT "accountStatus", "trialReminderStage" FROM users WHERE id = $1', [C.id]);
  check('C passé à EXPIRED par le balayage', row.accountStatus === 'EXPIRED', row);
  r = await call('POST', '/admin/payments', { token: admin, body: { userId: C.id, planCode: 'business', billingCycle: 'annual', method: 'cash', reference: 'Espèces au bureau' } });
  check('paiement saisi par l’administrateur (espèces, cas exceptionnel) et validé', (r.status === 200 || r.status === 201) && r.body.status === 'validated' && r.body.periodMonths === 12 && r.body.amountHT === 290, r);
  r = await call('GET', '/products', { token: C.token });
  check('C réactivé par le paiement saisi par l’administrateur', r.status === 200, r);
  r = await call('GET', '/admin/overview', { token: admin });
  check('revenu récurrent : 15 + 290/12 ≈ 39,17 $', Math.abs(r.body.mrr - (15 + 290 / 12)) < 0.01 && r.body.customers.paying === 2 && r.body.customers.cancelled === 1 && r.body.cancellations === 1, { mrr: r.body.mrr, customers: r.body.customers });

  // ═════════════════════════ Sessions ═════════════════════════
  console.log('— Sessions');
  r = await call('PATCH', '/users/change-password', { token: A.token, body: { oldPassword: PASSWORD, newPassword: 'Nouveau#2026ok' } });
  check('changement de mot de passe : nouveau jeton remis', r.status === 200 && !!r.body.access_token && r.body.access_token !== A.token, r);
  const newToken = r.body.access_token;
  r = await call('GET', '/auth/me', { token: A.token });
  check('l’ancienne session est fermée (401)', r.status === 401, r);
  r = await call('GET', '/auth/me', { token: newToken });
  check('la nouvelle session fonctionne', r.status === 200, r);
  r = await call('PATCH', `/admin/clients/${B.id}/toggle`, { token: admin });
  r = await call('GET', '/auth/me', { token: B.token });
  check('compte désactivé par l’administrateur : session coupée tout de suite', r.status === 401, r);

  // ═════════════════════════ Rapports et indicateurs ═════════════════════════
  console.log('— Rapports enregistrés et indicateurs sans chiffres inventés');
  r = await call('POST', '/reports/saved', { token: newToken, body: { name: 'Ventes de novembre', type: 'sales', data: { total: 12.5, rows: [1, 2] } } });
  check('rapport enregistré en base', (r.status === 200 || r.status === 201) && r.body.report && r.body.report.id, r);
  const savedReport = r.body.report;
  r = await call('GET', '/reports/saved', { token: newToken });
  check('le rapport est retrouvé (il ne dépend plus de la mémoire du serveur)', r.status === 200 && r.body.length === 1 && r.body[0].data.total === 12.5, r);
  row = await one('SELECT COUNT(*)::int AS n FROM saved_reports WHERE "userId" = $1', [A.id]);
  check('ligne présente dans la table saved_reports', row.n === 1, row);
  r = await call('GET', '/reports/saved', { token: C.token });
  check('une autre société ne voit pas ce rapport', r.status === 200 && r.body.length === 0, r);
  r = await call('DELETE', `/reports/saved/${savedReport.id}`, { token: C.token });
  check('ni ne peut le supprimer (404)', r.status === 404, r);
  r = await call('POST', '/reports/saved', { token: newToken, body: { name: '', type: 'sales' } });
  check('rapport sans nom refusé', r.status === 400, r);
  r = await call('GET', '/reports/logistics', { token: C.token });
  check('rapport logistique réel (il était toujours vide)', r.status === 200 && r.body.total === 2 && r.body.inTransit === 1 && r.body.pending === 1 && r.body.items.length === 2, r);
  r = await call('GET', '/ia/predictions', { token: newToken });
  check('prévision : pas de chiffre sans historique, et la raison est donnée', r.status === 200 && r.body.nextMonthSales === null && r.body.confidence === null && !!r.body.reason, r);
  r = await call('GET', '/ia/forecast', { token: newToken });
  check('projection : vide sans historique', r.status === 200 && Array.isArray(r.body.forecast) && r.body.forecast.length === 0 && !!r.body.reason, r);
  r = await call('GET', '/ia/stats/compare', { token: newToken });
  check('comparaison mensuelle : null quand il n’y a pas de mois précédent (plus de « +5,2 % » fixe)', r.status === 200 && r.body.clientGrowth === null && r.body.salesGrowth === null && r.body.profitGrowth === null, r);
  r = await call('DELETE', `/reports/saved/${savedReport.id}`, { token: newToken });
  check('le propriétaire supprime son rapport', r.status === 200 && r.body.success === true, r);

  // ═════════════════════════ Mise à niveau du contenu de départ ═════════════════════════
  console.log('— Mise à niveau du contenu de départ (installation en version 1, puis 2)');
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: newToken });
  check('mise à niveau : réservée à l’administrateur (403)', r.status === 403, r);
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('base neuve : déjà à jour, rien n’est modifié', r.status === 200 && r.body.upgraded === false, r);
  // On remet la base dans l'état d'une installation en version 1.
  const BASE_V1 = ['products', 'categories', 'clients', 'invoices', 'finance', 'reports', 'analytics', 'ai'];
  const V1_MANUFACTURING = [...BASE_V1, 'stock', 'sales', 'purchases', 'orders', 'suppliers', 'logistics', 'hr', 'objectives'];
  const V2_RESTAURANT = [...BASE_V1, 'stock', 'sales', 'pos', 'purchases', 'suppliers', 'hr', 'objectives'];
  const V2_STARTER = {
    description: 'Pour démarrer : ventes, caisse, stock et facturation.', priceMonthly: 49, priceAnnual: 490, maxUsers: 3,
    modules: ['products', 'categories', 'stock', 'sales', 'pos', 'purchases', 'orders', 'clients', 'suppliers', 'invoices', 'reports'],
    features: ['Jusqu’à 3 utilisateurs', 'Ventes, caisse, achats, commandes et stock', 'Devis, factures, avoirs et règlements', 'Fichier TEIF pour El Fatoora', 'Rapports, exports Excel et PDF', 'Support par email'],
  };
  const V2_BUSINESS_FEATURES = ['Jusqu’à 10 utilisateurs', 'Tous les modules de votre secteur', 'Comptabilité, TVA et rapprochement bancaire', 'RH, congés et paie (CNSS, IRPP)', 'Logistique, production et objectifs', 'Analyses et assistant IA', 'Support prioritaire'];
  const V2_ENTERPRISE = { description: 'Utilisateurs illimités et accompagnement dédié.', priceMonthly: 249, priceAnnual: 2490, features: ['Utilisateurs illimités', 'Tous les modules de votre secteur', 'Mise en service et reprise de données accompagnées', 'Formation de vos équipes', 'Interlocuteur dédié', 'Paramétrage sur mesure (sur devis)'] };
  await db.query(`UPDATE sectors SET modules = $1 WHERE code = 'manufacturing'`, [JSON.stringify(V1_MANUFACTURING)]);
  await db.query(`UPDATE sectors SET modules = $1 WHERE code = 'healthcare'`, [JSON.stringify(['products', 'sales'])]); // personnalisé par l'administrateur
  await db.query(`UPDATE sectors SET modules = $1 WHERE code = 'restaurant'`, [JSON.stringify(V2_RESTAURANT)]); // sans l'agenda : contenu de la version 2
  const NEW = ['agrifood', 'automotive', 'ecommerce', 'textile', 'beauty'];
  await db.query(`DELETE FROM sector_items WHERE "sectorId" IN (SELECT id FROM sectors WHERE code = ANY($1))`, [NEW]);
  await db.query(`DELETE FROM sector_categories WHERE "sectorId" IN (SELECT id FROM sectors WHERE code = ANY($1))`, [NEW]);
  await db.query(`DELETE FROM service_offers WHERE "sectorCode" = ANY($1)`, [NEW]);
  await db.query(`DELETE FROM sectors WHERE code = ANY($1)`, [NEW]);
  // Formules comme dans une installation en dinars : brouillons, prix de la version 2 ; le Starter a la liste de modules sans l'agenda.
  await db.query(`UPDATE plans SET "isPublic" = false, description = $1, "priceMonthly" = $2, "priceAnnual" = $3, "maxUsers" = $4, modules = $5, features = $6 WHERE code = 'starter'`, [V2_STARTER.description, V2_STARTER.priceMonthly, V2_STARTER.priceAnnual, V2_STARTER.maxUsers, JSON.stringify(V2_STARTER.modules), JSON.stringify(V2_STARTER.features)]);
  await db.query(`UPDATE plans SET "isPublic" = false, "priceMonthly" = 120, features = $1 WHERE code = 'business'`, [JSON.stringify(V2_BUSINESS_FEATURES)]); // prix changé par l'administrateur
  await db.query(`UPDATE plans SET "isPublic" = false, "priceMonthly" = NULL, "priceAnnual" = NULL, features = $1 WHERE code = 'enterprise'`, [JSON.stringify(['Utilisateurs illimités', 'Paramétrage sur mesure', 'Reprise de données accompagnée', 'Interlocuteur dédié'])]); // version 1, jamais modifiée
  await db.query(`UPDATE service_offers SET price = 300 WHERE name = 'Mise en service standard'`);
  await db.query(`UPDATE service_offers SET price = 275 WHERE name = 'Formation des utilisateurs'`); // prix changé par l'administrateur
  await db.query(`UPDATE platform_settings SET "catalogVersion" = 1, currency = 'TND', "requireEmailVerification" = false, "paymentMethods" = $1`, [JSON.stringify(['bank_transfer', 'cash', 'cheque', 'd17'])]);
  // Le compte A (restaurant, formule Starter) a ses modules sans l'agenda, comme avant la mise à niveau.
  const aModules = (await one('SELECT modules FROM users WHERE id = $1', [A.id])).modules;
  await db.query('UPDATE users SET modules = $1 WHERE id = $2', [JSON.stringify({ ...aModules, appointments: false, projects: false }), A.id]);
  // Deux ateliers inscrits avant la mise à niveau : l'un en essai, l'autre sur la formule Starter (qui ne comprend pas la fabrication).
  const E = await signUp({ email: 'e@test.tn', companyName: 'Atelier E', sector: 'manufacturing' });
  check('avant la mise à niveau : un atelier s’inscrit avec les modules de la version 1', E.r.status === 201 && E.r.body.user.modules.stock === true && E.r.body.user.modules.hr === true, E.r.body.user?.modules);
  await db.query(`INSERT INTO users (email, password, name, "companyName", role, sector, "planCode", "accountStatus", "signupSource", modules) SELECT 'f@test.tn', password, 'F', 'Atelier F', 'client', 'manufacturing', 'starter', 'ACTIVE', 'admin', modules FROM users WHERE id = $1`, [E.id]);

  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('mise à niveau exécutée une fois (version 1 → 4)', r.status === 200 && r.body.upgraded === true && r.body.from === 1, r);
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('second appel : plus rien à faire', r.status === 200 && r.body.upgraded === false, r);
  const sectorsNow = (await call('GET', '/admin/sectors', { token: admin })).body;
  const sectorBy = (code) => sectorsNow.find((s) => s.code === code);
  check('secteur resté d’origine (industrie) : ses modules sont gardés, sans Production', !sectorBy('manufacturing').modules.includes('production') && V1_MANUFACTURING.every((m) => sectorBy('manufacturing').modules.includes(m)), sectorBy('manufacturing').modules);
  check('secteur resté de la version 2 : l’agenda est ajouté au restaurant', sectorBy('restaurant').modules.includes('appointments') && V2_RESTAURANT.every((m) => sectorBy('restaurant').modules.includes(m)), sectorBy('restaurant').modules);
  check('secteur personnalisé par l’administrateur : laissé tel quel', sectorBy('healthcare').modules.join() === 'products,sales', sectorBy('healthcare').modules);
  check('nouveaux secteurs créés avec leurs suggestions, « Autre activité » reste en dernier', sectorsNow.length === 15 && NEW.every((c) => sectorBy(c) && sectorBy(c).itemCount > 0) && sectorsNow[14].code === 'other', sectorsNow.map((s) => s.code));
  check('les nouveaux secteurs reçoivent d’emblée l’agenda (beauté) ou les projets', sectorBy('beauty').modules.includes('appointments') && sectorBy('automotive').modules.includes('appointments'), [sectorBy('beauty').modules, sectorBy('automotive').modules]);
  row = await one(`SELECT COUNT(*)::int AS n, BOOL_OR("isPublic") AS public, MAX(price) AS max FROM service_offers WHERE "sectorCode" = ANY($1)`, [NEW]);
  check('leurs prestations de mise en service sont créées en brouillon, déjà en dollars', row.n === 5 && row.public === false && Number(row.max) <= 160, row);
  const plansNow = (await call('GET', '/admin/plans', { token: admin })).body;
  const planBy = (code) => plansNow.find((p) => p.code === code);
  r = await call('GET', '/admin/settings', { token: admin });
  check('devise : dinars → dollars, parce qu’aucune formule n’était publiée', r.body.currency === 'USD' && r.body.catalogVersion === 4 && r.body.requireEmailVerification === true, { currency: r.body.currency, version: r.body.catalogVersion });
  check('formule inchangée (Starter) : prix en dollars, publiée, avec l’agenda', planBy('starter').priceMonthly === 15 && planBy('starter').priceAnnual === 150 && planBy('starter').isPublic === true && planBy('starter').modules.includes('appointments') && planBy('starter').features.includes('Agenda : rendez-vous et réservations'), planBy('starter'));
  check('formule jamais modifiée depuis la version 1 (Enterprise) : prix proposé en dollars et publiée', planBy('enterprise').priceMonthly === 79 && planBy('enterprise').priceAnnual === 790 && planBy('enterprise').isPublic === true, planBy('enterprise'));
  check('formule modifiée par l’administrateur (Business) : son prix est conservé et elle reste en brouillon', planBy('business').priceMonthly === 120 && planBy('business').isPublic === false, planBy('business'));
  r = await call('GET', '/admin/service-offers', { token: admin });
  const offerBy = (name) => r.body.find((o) => o.name === name);
  check('prestations : tarif non modifié converti en dollars, tarif modifié conservé', Number(offerBy('Mise en service standard').price) === 95 && Number(offerBy('Formation des utilisateurs').price) === 275, [offerBy('Mise en service standard').price, offerBy('Formation des utilisateurs').price]);
  r = await call('GET', '/admin/settings', { token: admin });
  check('moyens de paiement d’origine : complétés (D17, Flouci…)', r.body.paymentMethods.join() === 'bank_transfer,d17,flouci,cheque,cash', r.body.paymentMethods);
  r = await call('GET', '/auth/me', { token: E.token });
  check('compte en essai du secteur : plus aucune trace de Production, ses autres modules sont intacts', r.status === 200 && !('production' in r.body.modules) && r.body.modules.stock === true, r.body.modules);
  row = await one(`SELECT modules FROM users WHERE email = 'f@test.tn'`);
  check('compte sur la formule Starter : aucune trace de Production non plus', !('production' in row.modules) && row.modules.stock === true, row.modules);
  row = await one(`SELECT (SELECT COUNT(*) FROM sectors WHERE modules::text LIKE '%production%')::int AS sectors, (SELECT COUNT(*) FROM plans WHERE modules::text LIKE '%production%')::int AS plans, (SELECT COUNT(*) FROM users WHERE modules::text LIKE '%"production"%')::int AS users`);
  check('après la mise à niveau : plus aucun secteur, aucune formule ni aucun compte ne cite le module Production', row.sectors === 0 && row.plans === 0 && row.users === 0, row);
  row = await one('SELECT modules FROM users WHERE id = $1', [A.id]);
  check('compte du restaurant sur la formule Starter : reçoit l’agenda, pas les projets', row.modules.appointments === true && row.modules.projects === false, row.modules);

  // Installation déjà en service, avec des paiements enregistrés en dinars : ni la devise ni les prix ne bougent.
  await db.query(`UPDATE platform_settings SET "catalogVersion" = 2, currency = 'TND'`);
  await db.query(`UPDATE plans SET "isPublic" = true, "priceMonthly" = 49, "priceAnnual" = 490 WHERE code = 'starter'`);
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('mise à niveau d’une installation déjà en service (version 2 → 4)', r.status === 200 && r.body.upgraded === true && r.body.from === 2, r);
  r = await call('GET', '/admin/settings', { token: admin });
  check('formules déjà publiées, paiements enregistrés : la devise et les prix des clients ne changent pas sous leurs pieds', r.body.currency === 'TND' && r.body.catalogVersion === 4, r.body.currency);
  r = await call('GET', '/admin/plans', { token: admin });
  check('le Starter publié garde son prix', r.body.find((p) => p.code === 'starter').priceMonthly === 49, r.body.find((p) => p.code === 'starter'));

  // Installation en service SANS paiement (les paiements des essais précédents sont mis de côté le temps de ces deux cas).
  await db.query('CREATE TABLE tmp_paiements_sauvegarde AS SELECT * FROM subscription_payments');
  await db.query('DELETE FROM subscription_payments');
  const publicOffers = (await db.query('SELECT id FROM service_offers WHERE "isPublic"')).rows.map((o) => o.id);
  await db.query('UPDATE service_offers SET "isPublic" = false');
  const asV2 = async ({ businessMonthly = 99, enterprisePublic = true } = {}) => {
    await db.query(`UPDATE platform_settings SET "catalogVersion" = 2, currency = 'TND'`);
    await db.query(`UPDATE plans SET "isPublic" = true, description = $1, "priceMonthly" = 49, "priceAnnual" = 490, "maxUsers" = 3, modules = $2, features = $3 WHERE code = 'starter'`, [V2_STARTER.description, JSON.stringify(V2_STARTER.modules), JSON.stringify(V2_STARTER.features)]);
    await db.query(`UPDATE plans SET "isPublic" = true, "priceMonthly" = $1, "priceAnnual" = 990, "maxUsers" = 10, features = $2 WHERE code = 'business'`, [businessMonthly, JSON.stringify(V2_BUSINESS_FEATURES)]);
    await db.query(`UPDATE plans SET "isPublic" = $1, "priceMonthly" = 249, "priceAnnual" = 2490, "maxUsers" = NULL, features = $2 WHERE code = 'enterprise'`, [enterprisePublic, JSON.stringify(V2_ENTERPRISE.features)]);
    await db.query(`UPDATE service_offers SET price = 300 WHERE name = 'Mise en service standard'`);
  };
  const planRows = async () => (await call('GET', '/admin/plans', { token: admin })).body.map((p) => [p.code, p.priceMonthly, p.priceAnnual, p.isPublic]);

  // (1) Un prix publié a été changé par l'administrateur : on ne touche à rien (sinon 120 dinars deviendraient 120 dollars).
  await asV2({ businessMonthly: 120 });
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('formules publiées dont une a un prix choisi par l’administrateur : mise à niveau 2 → 4', r.status === 200 && r.body.upgraded === true && r.body.from === 2, r);
  r = await call('GET', '/admin/settings', { token: admin });
  check('… la devise et tous les prix restent comme avant', r.body.currency === 'TND' && r.body.catalogVersion === 4, r.body.currency);
  let rows = await planRows();
  check('… Starter 49, Business 120, Enterprise 249 : inchangés', rows.find((x) => x[0] === 'starter')[1] === 49 && rows.find((x) => x[0] === 'business')[1] === 120 && rows.find((x) => x[0] === 'enterprise')[1] === 249, rows);

  // (2) Formules publiées mais jamais modifiées, aucun paiement : les prix de départ passent en dollars, la publication ne change pas.
  await asV2({ enterprisePublic: false });
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('formules publiées jamais modifiées, aucun paiement : mise à niveau 2 → 4', r.status === 200 && r.body.upgraded === true && r.body.from === 2, r);
  r = await call('GET', '/admin/settings', { token: admin });
  check('… la devise passe en dollars', r.body.currency === 'USD' && r.body.catalogVersion === 4, r.body.currency);
  rows = await planRows();
  check('… prix de départ en dollars (15 / 29 / 79, annuel 150 / 290 / 790)', rows.find((x) => x[0] === 'starter')[1] === 15 && rows.find((x) => x[0] === 'starter')[2] === 150 && rows.find((x) => x[0] === 'business')[1] === 29 && rows.find((x) => x[0] === 'business')[2] === 290 && rows.find((x) => x[0] === 'enterprise')[1] === 79 && rows.find((x) => x[0] === 'enterprise')[2] === 790, rows);
  check('… la publication est conservée : Starter et Business publiés, Enterprise toujours en brouillon', rows.find((x) => x[0] === 'starter')[3] === true && rows.find((x) => x[0] === 'business')[3] === true && rows.find((x) => x[0] === 'enterprise')[3] === false, rows);
  r = await call('GET', '/admin/service-offers', { token: admin });
  check('… la prestation au tarif de départ passe aussi en dollars', Number(r.body.find((o) => o.name === 'Mise en service standard').price) === 95, r.body.find((o) => o.name === 'Mise en service standard'));
  await db.query(`UPDATE plans SET "isPublic" = true WHERE code = 'enterprise'`);
  await db.query('UPDATE service_offers SET "isPublic" = true WHERE id = ANY($1)', [publicOffers]);
  await db.query('INSERT INTO subscription_payments SELECT * FROM tmp_paiements_sauvegarde');
  await db.query('DROP TABLE tmp_paiements_sauvegarde');
  // Retour à l'état de départ pour la suite.
  await db.query(`UPDATE platform_settings SET currency = 'USD'`);
  await db.query(`UPDATE plans SET "priceMonthly" = 15, "priceAnnual" = 150 WHERE code = 'starter'`);
  await db.query(`UPDATE plans SET "priceMonthly" = 29, "isPublic" = true WHERE code = 'business'`);
  await db.query(`DELETE FROM users WHERE email IN ('e@test.tn', 'f@test.tn')`);

  // ── Version 3 → 4 : le module Production est retiré d'une installation qui le proposait encore ──
  console.log('— Mise à niveau 3 → 4 : retrait du module Production');
  const V3_BUSINESS = ['Jusqu’à 10 utilisateurs', 'Tous les modules de votre secteur', 'Comptabilité, TVA et rapprochement bancaire', 'RH, congés et paie (CNSS, IRPP)', 'Logistique, production, projets et objectifs', 'Analyses et assistant IA', 'Support prioritaire'];
  const V3_TEXTILE_RECO = ['Créez un ordre de fabrication par modèle : la nomenclature (tissu, fil, boutons par pièce) sort du stock à chaque avancement.', 'Séparez tissus, fournitures et produits finis en catégories pour lire la valeur du stock par famille.', 'Facturez le travail à façon comme une prestation à la pièce.'];
  await db.query(`UPDATE sectors SET modules = modules || '["production"]'::jsonb WHERE code IN ('manufacturing', 'textile')`);
  await db.query(`UPDATE sectors SET modules = '["products","sales","production"]'::jsonb WHERE code = 'healthcare'`); // personnalisé par l'administrateur
  await db.query(`UPDATE sectors SET recommendations = $1::jsonb, description = $2 WHERE code = 'textile'`, [JSON.stringify(V3_TEXTILE_RECO), 'Ateliers de confection, façonniers et marques : tissus, fournitures, ordres de fabrication et livraisons.']);
  await db.query(`UPDATE plans SET features = $1::jsonb, description = $2 WHERE code = 'business'`, [JSON.stringify(V3_BUSINESS), 'Tous les modules de votre secteur pour une PME qui grandit.']);
  await db.query(`UPDATE plans SET modules = '["sales","production"]'::jsonb WHERE code = 'enterprise'`);
  await db.query(`INSERT INTO users (email, password, name, "companyName", role, sector, "planCode", "accountStatus", "signupSource", modules) SELECT 'h@test.tn', password, 'H', 'Atelier H', 'client', 'manufacturing', 'enterprise', 'ACTIVE', 'admin', '{"dashboard":true,"stock":true,"sales":true,"production":true}'::json FROM users WHERE id = $1`, [A.id]);
  await db.query(`UPDATE service_offers SET name = 'Agroalimentaire : lots, fabrication et traçabilité', description = 'Suivi par lot, nomenclatures de transformation, inventaire initial.' WHERE "sectorCode" = 'agrifood' AND category = 'setup'`);
  await db.query(`UPDATE service_offers SET name = 'Textile : nomenclatures et ordres de fabrication', description = 'Description personnalisée par l’administrateur.' WHERE "sectorCode" = 'textile' AND category = 'setup'`);
  await db.query(`UPDATE platform_settings SET "catalogVersion" = 3`);
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('mise à niveau 3 → 4 exécutée une fois', r.status === 200 && r.body.upgraded === true && r.body.from === 3, r);
  r = await call('POST', '/admin/maintenance/upgrade-catalog', { token: admin });
  check('second appel : plus rien à faire', r.status === 200 && r.body.upgraded === false, r);
  const s4 = (await call('GET', '/admin/sectors', { token: admin })).body;
  const sec4 = (code) => s4.find((s) => s.code === code);
  check('aucun secteur ne cite plus Production, même celui modifié par l’administrateur (qui garde ses autres modules)', s4.every((s) => !s.modules.includes('production')) && sec4('healthcare').modules.join() === 'products,sales' && sec4('manufacturing').modules.includes('stock') && sec4('textile').modules.includes('stock'), s4.map((s) => [s.code, s.modules.includes('production')]));
  check('textes de départ qui citaient les ordres de fabrication : remplacés dans le secteur resté d’origine', !/fabrication/i.test(sec4('textile').description) && sec4('textile').recommendations.length === 2 && sec4('textile').recommendations.every((t) => !/ordre de fabrication|nomenclature/i.test(t)), [sec4('textile').description, sec4('textile').recommendations]);
  const p4 = (await call('GET', '/admin/plans', { token: admin })).body;
  const plan4 = (code) => p4.find((p) => p.code === code);
  check('formule Business restée d’origine : arguments mis à jour (formule, RH par pays, support), sans « production »', plan4('business').features.includes('Tous les modules disponibles, ouverts selon votre secteur') && plan4('business').features.includes('Logistique, projets et objectifs') && plan4('business').features.includes('Support par email') && !plan4('business').features.some((f) => /production|prioritaire/i.test(f)), plan4('business').features);
  check('formule dont la liste citait Production : la liste est nettoyée sans jamais devenir « tous les modules »', plan4('enterprise').modules.join() === 'sales', plan4('enterprise').modules);
  row = await one(`SELECT modules FROM users WHERE email = 'h@test.tn'`);
  check('compte qui avait activé Production : la clé disparaît, ses autres modules restent', !('production' in row.modules) && row.modules.stock === true && row.modules.sales === true, row.modules);
  r = await call('GET', '/admin/service-offers', { token: admin });
  const agro = r.body.find((o) => o.sectorCode === 'agrifood' && o.category === 'setup');
  const tex = r.body.find((o) => o.sectorCode === 'textile' && o.category === 'setup');
  check('prestation inchangée : renommée et décrite sans fabrication', agro.name === 'Agroalimentaire : lots et traçabilité' && !/fabrication|nomenclature/i.test(agro.description), agro);
  check('prestation à description personnalisée : renommée, description conservée', tex.name === 'Textile : tissus, fournitures et façon' && tex.description === 'Description personnalisée par l’administrateur.', tex);
  await db.query(`UPDATE plans SET modules = NULL WHERE code = 'enterprise'`);
  await db.query(`DELETE FROM users WHERE email = 'h@test.tn'`);

  // ═════════════════════════ Paiement pendant l'essai gratuit ═════════════════════════
  console.log('— Paiement pendant l’essai gratuit (hors ligne)');
  const G0 = await signUp({ email: 'g@test.tn', companyName: 'Boutique G', sector: 'commerce' });
  const G = { token: G0.token, id: G0.id, trialEndsAt: G0.account.trialEndsAt };
  check('compte en essai, adresse confirmée par le code', G0.r.status === 201 && G0.account.status === 'TRIAL' && G0.verify?.status === 200 && !!G.trialEndsAt, G0.account);
  r = await call('POST', '/billing/payments', { token: G.token, body: { planCode: 'starter', billingCycle: 'annual', method: 'flouci', reference: 'FLOUCI-778899' } });
  check('paiement hors ligne déclaré pendant l’essai, par Flouci', r.status === 201 && r.body.status === 'pending' && r.body.method === 'flouci' && r.body.amountHT === 150, r);
  const trialPayment = r.body;
  r = await call('GET', '/clients', { token: G.token });
  check('l’essai continue pendant que le paiement attend', r.status === 200, r);
  r = await call('POST', `/admin/payments/${trialPayment.id}/validate`, { token: admin });
  check('validé : la période payée commence à la fin de l’essai (aucun jour gratuit perdu)', r.status === 200 && Math.abs(new Date(r.body.periodStart).getTime() - new Date(G.trialEndsAt).getTime()) < 2000, { periodStart: r.body.periodStart, trialEndsAt: G.trialEndsAt });
  const paidEnd = r.body.periodEnd;
  const paidMonths = (new Date(paidEnd).getTime() - new Date(r.body.periodStart).getTime()) / (86400000 * 30.4375);
  check('période annuelle : 12 mois après la fin de l’essai', paidMonths > 11.9 && paidMonths < 12.1, paidMonths);
  r = await call('GET', '/billing/subscription', { token: G.token });
  check('compte actif jusqu’à la fin de la période payée', r.body.account.status === 'ACTIVE' && r.body.account.blocked === false && new Date(r.body.account.subscriptionEnd).getTime() === new Date(paidEnd).getTime(), r.body.account);
  await db.query(`DELETE FROM subscription_payments WHERE "userId" = $1`, [G.id]);
  await db.query(`DELETE FROM users WHERE id = $1`, [G.id]);

  // ═════════════════════════ Correction de l'adresse email, e-mails en trois langues, outils de l'administrateur ═════════════════════════
  console.log('— Correction de l’adresse email, emails dans la langue du client, outils de l’administrateur');
  {
    /** Premier email reçu par cette adresse après le n-ième déjà vu (l'envoi à l'ancienne adresse part en tâche de fond). */
    const mailTo = async (email, after, timeoutMs = 6000) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const found = smtp.mails.slice(after).find((m) => m.to.includes(String(email).toLowerCase()));
        if (found) return found;
        await sleep(80);
      }
      return null;
    };

    // — Inscription : la langue de l'interface décide de la langue des emails.
    const seenH = smtp.mails.length;
    const h = await call('POST', '/auth/register', { body: signup({ email: 'h-faute@test.tn', companyName: 'Boutique H', sector: 'commerce', language: 'es' }) });
    check('inscription depuis l’interface espagnole : compte créé, code exigé et envoyé', h.status === 201 && h.body.verification.required === true && h.body.emailSent === true, h.body.verification);
    const H = { token: h.body.access_token, id: h.body.user.id };
    const codeH1 = await smtp.codeFor('h-faute@test.tn', seenH);
    const mailH1 = smtp.mails.slice(seenH).find((m) => m.to.includes('h-faute@test.tn'));
    check('l’email du code est écrit en espagnol, avec une version HTML', /Bienvenido a Inovexa ERP/.test(mailH1.text) && /Hola /.test(mailH1.text) && /<html lang=3D"es"|<html lang="es"/.test(mailH1.text), mailH1.text.slice(0, 300));
    row = await one(`SELECT language FROM users WHERE id = $1`, [H.id]);
    check('la langue est gardée sur le compte (les rappels et reçus suivent)', row.language === 'es', row);
    r = await call('POST', '/auth/register', { body: signup({ email: 'h-ar@test.tn', companyName: 'Langue inconnue', sector: 'commerce', language: 'ar' }) });
    check('une langue qui n’existe pas (ou plus) retombe sur le français', r.status === 201, r.body);
    row = await one(`SELECT language FROM users WHERE email = 'h-ar@test.tn'`);
    check('… enregistrée comme « fr »', row.language === 'fr', row);
    await db.query(`DELETE FROM users WHERE email = 'h-ar@test.tn'`);

    // — Faute de frappe à l'inscription : l'adresse est corrigée avec le mot de passe.
    r = await call('POST', '/auth/change-email', { body: { email: 'h@test.tn', password: PASSWORD } });
    check('corriger l’adresse sans être connecté : 401', r.status === 401, r);
    r = await call('POST', '/auth/change-email', { token: H.token, body: { email: 'h@test.tn', password: 'Mauvais#2026' } });
    check('mauvais mot de passe : refusé (401), l’adresse ne bouge pas', r.status === 401, r);
    row = await one(`SELECT email FROM users WHERE id = $1`, [H.id]);
    check('… l’adresse est restée celle de l’inscription', row.email === 'h-faute@test.tn', row);
    r = await call('POST', '/auth/change-email', { token: H.token, body: { email: 'a@test.tn', password: PASSWORD } });
    check('adresse déjà prise par une autre société : 409', r.status === 409, r);
    const seenChange = smtp.mails.length;
    r = await call('POST', '/auth/change-email', { token: H.token, body: { email: 'H@Test.tn', password: PASSWORD, language: 'en' } });
    check('mot de passe exact : adresse corrigée (casse ignorée), confirmation à refaire, code envoyé', r.status === 200 && r.body.changed === true && r.body.email === 'h@test.tn' && r.body.reverify === true && r.body.emailSent === true && r.body.verification.required === true && r.body.verification.resendInSeconds === 60, r.body);
    const codeH2 = await smtp.codeFor('h@test.tn', seenChange);
    const mailNew = await mailTo('h@test.tn', seenChange);
    check('le code part vers la NOUVELLE adresse, en anglais (langue demandée)', /^\d{6}$/.test(codeH2) && /Hello /.test(mailNew.text), mailNew?.text.slice(0, 200));
    const mailOld = await mailTo('h-faute@test.tn', seenChange);
    check('l’ANCIENNE adresse est prévenue (sans aucun code)', !!mailOld && /h@test\.tn/.test(mailOld.text) && smtp.codeOf(mailOld) === null, mailOld?.text.slice(0, 300));
    row = await one(`SELECT email, "emailVerifiedAt", "emailCodeHash", "emailCodeAttempts" FROM users WHERE id = $1`, [H.id]);
    check('en base : nouvelle adresse, confirmation à refaire, empreinte du code seulement', row.email === 'h@test.tn' && row.emailVerifiedAt === null && /^[0-9a-f]{64}$/.test(row.emailCodeHash) && row.emailCodeAttempts === 0, row);
    r = await call('POST', '/auth/login', { body: { email: 'h-faute@test.tn', password: PASSWORD } });
    check('l’ancienne adresse ne permet plus de se connecter', r.status === 401, r);
    r = await call('GET', '/auth/me', { token: H.token });
    check('profil : nouvelle adresse non confirmée, ERP fermé par le code', r.status === 200 && r.body.email === 'h@test.tn' && r.body.emailVerified === false && r.body.account.reason === 'EMAIL_NOT_VERIFIED', r.body.account);
    r = await call('GET', '/clients', { token: H.token });
    check('l’ERP reste fermé tant que la nouvelle adresse n’est pas confirmée (402)', r.status === 402 && r.body.reason === 'EMAIL_NOT_VERIFIED', r);
    if (codeH2 !== codeH1) {
      r = await call('POST', '/auth/verify-email-code', { token: H.token, body: { code: codeH1 } });
      check('le code reçu sur l’ancienne adresse ne sert plus à rien', r.status === 400 && r.body.code === 'CODE_INVALID', r);
    }
    r = await call('POST', '/auth/verify-email-code', { token: H.token, body: { code: codeH2 } });
    check('le code reçu sur la nouvelle adresse ouvre l’espace', r.status === 200 && r.body.success === true && r.body.account.blocked === false, r);

    // — Même opération depuis le profil : le mot de passe est exigé pour l'adresse, pas pour le reste.
    r = await call('PATCH', '/users/profile', { token: H.token, body: { name: 'Sami H.', phone: '22 535 181' } });
    check('profil : le nom et le téléphone se changent sans mot de passe', r.status === 200 && r.body.name === 'Sami H.' && !r.body.emailChange, r.body);
    r = await call('PATCH', '/users/profile', { token: H.token, body: { email: 'h2@test.tn' } });
    check('profil : changer l’adresse sans mot de passe est refusé (401)', r.status === 401, r);
    r = await call('PATCH', '/users/profile', { token: H.token, body: { email: 'pas-une-adresse', currentPassword: PASSWORD } });
    check('profil : adresse mal formée (400)', r.status === 400, r);
    const seenProfile = smtp.mails.length;
    r = await call('PATCH', '/users/profile', { token: H.token, body: { email: 'h2@test.tn', currentPassword: PASSWORD, language: 'fr' } });
    check('profil : avec le mot de passe, adresse changée, code envoyé, confirmation exigée', r.status === 200 && r.body.emailChange?.codeSent === true && r.body.emailChange?.verificationRequired === true, r.body);
    await smtp.codeFor('h2@test.tn', seenProfile);
    r = await call('GET', '/auth/me', { token: H.token });
    check('… le compte est de nouveau fermé jusqu’au code', r.status === 200 && r.body.email === 'h2@test.tn' && r.body.account.reason === 'EMAIL_NOT_VERIFIED', r.body.account);

    // — Outils de l'administrateur.
    const V = await signUp({ email: 'h-verifie@test.tn', companyName: 'Boutique V', sector: 'commerce' });
    r = await call('POST', `/admin/accounts/${H.id}/verify-email`, { token: V.token });
    check('un client ne peut pas confirmer sa propre adresse par l’API d’administration (403)', r.status === 403, r);
    r = await call('POST', `/admin/accounts/${H.id}/resend-verification`, { token: V.token, body: {} });
    check('… ni se faire renvoyer un code par cette voie (403)', r.status === 403, r);
    const seenAdmin = smtp.mails.length;
    r = await call('POST', `/admin/accounts/${H.id}/resend-verification`, { token: admin, body: { language: 'es' } });
    check('l’administrateur renvoie un code au client, sans attendre la minute', r.status === 200 && r.body.emailSent === true, r);
    const codeH3 = await smtp.codeFor('h2@test.tn', seenAdmin);
    const mailAdmin = smtp.mails.slice(seenAdmin).find((m) => m.to.includes('h2@test.tn'));
    check('… le code part à l’adresse du compte, dans la langue demandée', /^\d{6}$/.test(codeH3) && /Hola /.test(mailAdmin.text), mailAdmin?.text.slice(0, 200));
    r = await call('POST', `/admin/accounts/${H.id}/verify-email`, { token: admin });
    check('l’administrateur confirme l’adresse à la place du client', r.status === 200 && r.body.success === true && r.body.alreadyVerified === false && !!r.body.verifiedAt, r);
    row = await one(`SELECT "emailVerifiedAt", "emailCodeHash" FROM users WHERE id = $1`, [H.id]);
    check('… adresse confirmée en base, code effacé', !!row.emailVerifiedAt && row.emailCodeHash === null, row);
    r = await call('GET', '/clients', { token: H.token });
    check('… le client ouvre son espace sans code', r.status === 200, r);
    r = await call('POST', `/admin/accounts/${H.id}/verify-email`, { token: admin });
    check('adresse déjà confirmée : sans effet', r.status === 200 && r.body.alreadyVerified === true, r);
    r = await call('POST', `/admin/accounts/${H.id}/resend-verification`, { token: admin, body: {} });
    check('… et rien n’est renvoyé', r.status === 200 && r.body.alreadyVerified === true && r.body.emailSent === false, r);
    r = await call('POST', '/admin/accounts/999999/verify-email', { token: admin });
    check('compte inconnu : 404', r.status === 404, r);
    await sleep(400);
    const journal = (await db.query(`SELECT action, "actorEmail" FROM audit_logs WHERE "userId" = $1 AND action IN ('email_changed', 'email_verified_by_admin', 'email_code_sent_by_admin', 'email_change_failed')`, [H.id])).rows;
    const actions = journal.map((x) => x.action);
    check('le journal garde les changements d’adresse et les actions de l’administrateur', ['email_changed', 'email_verified_by_admin', 'email_code_sent_by_admin', 'email_change_failed'].every((a) => actions.includes(a)), actions);
    check('… avec l’adresse de l’administrateur pour ses actions', journal.filter((x) => x.action.endsWith('_by_admin')).every((x) => x.actorEmail === 'admin@test.tn'), journal);

    // — Diagnostic et test du serveur d'envoi.
    r = await call('GET', '/admin/maintenance/mail', { token: admin });
    check('diagnostic de l’envoi d’emails : configuré, serveur joignable, aucun mot de passe exposé', r.status === 200 && r.body.configured === true && r.body.reachable === true && r.body.host === '127.0.0.1' && r.body.error === null && /no-reply@test\.tn/.test(r.body.from) && !/pass/i.test(JSON.stringify(Object.keys(r.body))), r.body);
    r = await call('GET', '/admin/maintenance/mail', { token: V.token });
    check('… réservé à l’administrateur (403)', r.status === 403, r);
    const seenTest = smtp.mails.length;
    r = await call('POST', '/admin/maintenance/test-email', { token: admin, body: { to: 'verif@test.tn', language: 'en' } });
    check('email de test envoyé à l’adresse demandée', r.status === 200 && r.body.success === true && r.body.to === 'verif@test.tn', r);
    const mailTest = await mailTo('verif@test.tn', seenTest);
    check('… il arrive, dans la langue demandée', !!mailTest && /Inovexa ERP/.test(mailTest.text) && /platform/.test(mailTest.text), mailTest?.text.slice(0, 200));
    const seenSelf = smtp.mails.length;
    r = await call('POST', '/admin/maintenance/test-email', { token: admin, body: {} });
    check('sans adresse : le test part à l’administrateur lui-même', r.status === 200 && r.body.to === 'admin@test.tn' && !!(await mailTo('admin@test.tn', seenSelf)), r);
    r = await call('POST', '/admin/maintenance/test-email', { token: admin, body: { to: 'pas-une-adresse' } });
    check('adresse invalide : 400', r.status === 400, r);
    r = await call('POST', '/admin/maintenance/test-email', { token: V.token, body: {} });
    check('un client ne peut pas envoyer d’email de test (403)', r.status === 403, r);

    await db.query(`DELETE FROM users WHERE id = ANY($1)`, [[H.id, V.id]]);
  }

  // ═════════════════════════ Suppression d'un compte ═════════════════════════
  console.log('— Suppression d’un compte par l’administrateur');
  r = await call('DELETE', `/admin/clients/${C.id}`, { token: admin });
  check('compte supprimé', r.status === 200 && r.body.success === true, r);
  row = await one(`SELECT (SELECT COUNT(*) FROM users WHERE id = $1 OR email = 'c1@test.tn')::int AS users, (SELECT COUNT(*) FROM transporteurs WHERE "clientId" = $1)::int AS carriers, (SELECT COUNT(*) FROM shipments WHERE "clientId" = $1)::int AS shipments, (SELECT COUNT(*) FROM products WHERE "userId" = $1)::int AS products`, [C.id]);
  check('ses transporteurs, leurs comptes et ses données partent avec lui', row.users === 0 && row.carriers === 0 && row.shipments === 0 && row.products === 0, row);
  row = await one('SELECT (SELECT COUNT(*) FROM shipments WHERE "clientId" = $1)::int AS d, (SELECT COUNT(*) FROM clients WHERE "userId" = $2)::int AS a', [D.id, A.id]);
  check('les autres sociétés ne perdent rien', row.d === 1 && row.a === 1, row);

  await db.end();
  console.log(`\n${passes} ok, ${failures} échec(s)`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
