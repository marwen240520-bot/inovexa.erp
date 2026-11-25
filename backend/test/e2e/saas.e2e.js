// Tests de bout en bout de la couche SaaS : inscription, essai de 72 h, expiration, paiement validé par l'administrateur,
// suspension, isolation entre sociétés, modules par secteur, droits de l'administrateur, logistique et transporteurs.
// Lancé par run.sh sur une base neuve créée par les migrations (DATABASE_URL, BASE).
const { Client } = require('pg');
const bcrypt = require('bcrypt');

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PASSWORD = 'Essai#2026ok';
const signup = (over = {}) => ({ name: 'Sami Trabelsi', companyName: 'Société', email: 'x@test.tn', phone: '22 535 181', password: PASSWORD, sector: 'commerce', acceptTerms: true, ...over });

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const one = async (sql, params) => (await db.query(sql, params)).rows[0];

  // ═════════════════════════ Site public ═════════════════════════
  console.log('— Site public');
  let r = await call('GET', '/public/config');
  check('configuration publique : essai de 72 h, devise TND', r.status === 200 && r.body.trialHours === 72 && r.body.currency === 'TND', r);
  check('Google non configuré : aucun identifiant client exposé', r.body.googleClientId === null, r.body);
  r = await call('GET', '/public/sectors');
  check('10 secteurs proposés', r.status === 200 && r.body.length === 10 && r.body.every((s) => Array.isArray(s.modules) && s.itemCount > 0), r.body.length);
  check('aucun secteur n’active la production', r.body.every((s) => !s.modules.includes('production')));
  r = await call('GET', '/public/sectors/logistics');
  check('catalogue logistique : catégories, suggestions et avertissement « valeurs indicatives »', r.status === 200 && r.body.categories.length >= 3 && r.body.items.length >= 5 && /indicatives/.test(r.body.disclaimer) && r.body.items.every((i) => i.basis), r.body.disclaimer);
  const logisticsItems = r.body.items;
  r = await call('GET', '/public/sectors/inconnu');
  check('secteur inconnu : 404', r.status === 404, r);
  r = await call('GET', '/public/plans');
  check('formules en brouillon : rien n’est publié tant que l’administrateur n’a pas validé les prix', r.status === 200 && r.body.plans.length === 0, r.body);
  r = await call('GET', '/public/service-offers');
  check('prestations en brouillon : non publiées', r.status === 200 && r.body.length === 0, r.body);

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
  r = await call('POST', '/auth/register', { body: signup({ email: 'A@Test.tn', companyName: 'Restaurant A', sector: 'restaurant', city: 'Sousse', taxId: '1234567X/A/M/000' }) });
  check('inscription : 201, jeton, rôle client', r.status === 201 && !!r.body.access_token && r.body.user.role === 'client' && r.body.user.email === 'a@test.tn', r);
  const A = { token: r.body.access_token, id: r.body.user.id };
  const acc = r.body.account;
  check('essai démarré : état TRIAL, non bloqué', acc.status === 'TRIAL' && acc.blocked === false, acc);
  const trialMs = new Date(acc.trialEndsAt).getTime() - new Date(acc.trialStartedAt).getTime();
  check('durée de l’essai : exactement 72 heures', trialMs === 72 * 3600 * 1000, trialMs);
  check('temps restant calculé par le serveur (≈ 72 h)', acc.remainingSeconds <= 72 * 3600 && acc.remainingSeconds > 72 * 3600 - 120, acc.remainingSeconds);
  check('heure du serveur fournie', Math.abs(new Date(acc.serverTime).getTime() - before) < 120000, acc.serverTime);
  const mods = r.body.user.modules;
  check('modules du secteur restaurant : caisse et stock oui, logistique et production non', mods.pos === true && mods.stock === true && mods.hr === true && mods.logistics === false && mods.production === false && mods.dashboard === true, mods);
  check('téléphone enregistré au format international', (await one('SELECT phone, sector, "signupSource", "emailVerifiedAt" FROM users WHERE id = $1', [A.id])).phone === '+21622535181');
  const company = await one('SELECT "legalName", city, "taxId" FROM companies WHERE "userId" = $1', [A.id]);
  check('fiche société créée avec les informations facultatives', company && company.legalName === 'Restaurant A' && company.city === 'Sousse' && company.taxId === '1234567X/A/M/000', company);

  r = await call('POST', '/auth/register', { body: signup({ email: 'a@test.tn', companyName: 'Doublon' }) });
  check('email déjà utilisé : 409', r.status === 409, r);

  r = await call('POST', '/auth/register', { body: signup({ email: 'b@test.tn', companyName: 'Boutique B', sector: 'commerce' }) });
  const B = { token: r.body.access_token, id: r.body.user.id };
  r = await call('POST', '/auth/register', { body: signup({ email: 'c@test.tn', companyName: 'Transports C', sector: 'logistics' }) });
  const C = { token: r.body.access_token, id: r.body.user.id };
  r = await call('POST', '/auth/register', { body: signup({ email: 'd@test.tn', companyName: 'Grossiste D', sector: 'wholesale' }) });
  const D = { token: r.body.access_token, id: r.body.user.id };
  check('quatre sociétés distinctes créées', new Set([A.id, B.id, C.id, D.id]).size === 4 && [A, B, C, D].every((x) => x.token));

  r = await call('POST', '/auth/login', { body: { email: 'a@test.tn', password: PASSWORD } });
  check('connexion par email : état du compte renvoyé', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.user.sector === 'restaurant', r);
  r = await call('GET', '/auth/me', { token: A.token });
  check('profil : essai en cours, adresse non encore confirmée', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.emailVerified === false, r);
  r = await call('POST', '/auth/verify-email', { body: { email: 'a@test.tn', token: 'x'.repeat(64) } });
  check('lien de confirmation invalide : refusé', r.status === 400, r);
  r = await call('POST', '/auth/resend-verification', { token: A.token });
  check('renvoi du lien : accepté (aucun email envoyé sans SMTP, et c’est dit)', r.status === 200 && r.body.emailSent === false, r);
  r = await call('POST', '/auth/google', { body: { credential: 'x'.repeat(60) } });
  check('Google non configuré : 503, pas de connexion', r.status === 503, r);

  // ═════════════════════════ Abonnement vu par le client ═════════════════════════
  console.log('— Abonnement (client)');
  r = await call('GET', '/billing/subscription', { token: A.token });
  check('abonnement : essai, 1 utilisateur, aucune formule', r.status === 200 && r.body.account.status === 'TRIAL' && r.body.users.used === 1 && r.body.plan === null && r.body.payment.currency === 'TND' && r.body.payment.onlinePayment === false, r);
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
  let row = await one('SELECT name, "userId" FROM suppliers WHERE id = $1', [supplierA.id]);
  check('le fournisseur de A est intact', row.name === 'Fournisseur A' && row.userId === A.id, row);
  for (const [path, body, table, id] of [
    ['/clients', { id: clientA.id, name: 'Pirate', email: 'p@b.tn' }, 'clients', clientA.id],
    ['/categories', { id: categoryA.id, name: 'Pirate' }, 'categories', categoryA.id],
    ['/employees', { id: employeeA.id, name: 'Pirate', email: 'pe@b.tn' }, 'employees', employeeA.id],
    ['/projects', { id: 1, name: 'Projet D' }, null, null],
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

  r = await call('PUT', '/admin/settings', { token: admin, body: { requireEmailVerification: true } });
  check('exiger la confirmation d’email sans SMTP : refusé (personne ne recevrait le lien)', r.status === 400, r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { paymentInstructions: 'Virement : RIB 08 006 0123456789012 34', supportEmail: 'support@test.tn', trialReminderHours: 24 } });
  check('réglages enregistrés', r.status === 200 && r.body.supportEmail === 'support@test.tn', r);
  r = await call('PUT', '/admin/settings', { token: admin, body: { trialHours: 0 } });
  check('durée d’essai invalide refusée', r.status === 400, r);

  const plans = (await call('GET', '/admin/plans', { token: admin })).body;
  const starter = plans.find((p) => p.code === 'starter');
  check('3 formules proposées en brouillon', plans.length === 3 && plans.every((p) => p.isPublic === false) && starter.priceMonthly === 49, plans.map((p) => p.code));
  r = await call('POST', '/billing/payments', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer' } });
  check('formule non publiée : le client ne peut pas la souscrire', r.status === 400, r);
  r = await call('PATCH', `/admin/plans/${starter.id}`, { token: admin, body: { isPublic: true } });
  check('l’administrateur publie la formule Starter', r.status === 200 && r.body.isPublic === true, r);
  r = await call('GET', '/public/plans');
  check('la formule publiée apparaît sur le site', r.body.plans.length === 1 && r.body.plans[0].code === 'starter', r.body);
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
  check('le client bloqué peut écrire à l’administrateur', r.status === 200 && r.body.received === true, r);
  r = await call('GET', '/admin/messages?unread=1', { token: admin });
  check('l’administrateur reçoit le message', r.status === 200 && r.body.length === 1 && r.body[0].account.email === 'a@test.tn', r);
  r = await call('POST', `/admin/messages/${r.body[0].id}/read`, { token: admin });
  check('message marqué comme lu', r.status === 200, r);

  // ═════════════════════════ Paiement et réactivation ═════════════════════════
  console.log('— Paiement déclaré puis validé par l’administrateur');
  r = await call('POST', '/billing/payments', { token: A.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer', reference: 'VIR-2026-001', amountHT: 1, amountTTC: 1 } });
  check('paiement déclaré : montant pris sur la formule, pas sur la requête', r.status === 201 && r.body.status === 'pending' && r.body.amountHT === 49 && r.body.amountTTC === 58.31 && r.body.vatRate === 19 && r.body.currency === 'TND', r);
  const payment = r.body;
  r = await call('POST', '/billing/payments', { token: A.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'bank_transfer' } });
  check('un seul paiement en attente à la fois (409)', r.status === 409, r);
  r = await call('POST', '/billing/payments', { token: B.token, body: { planCode: 'starter', billingCycle: 'monthly', method: 'card' } });
  check('moyen de paiement non proposé : refusé', r.status === 400, r);
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
  check('reçu disponible, avec la mention qu’il ne remplace pas la facture légale', r.status === 200 && r.body.amountTTC === 58.31 && r.body.customer.taxId === '1234567X/A/M/000' && /facture légale/.test(r.body.notice), r);
  r = await call('GET', `/billing/payments/${payment.id}/receipt`, { token: B.token });
  check('le reçu d’une autre société est introuvable (404)', r.status === 404, r);
  r = await call('POST', '/employees', { token: A.token, body: { name: 'Nouvel employé', email: 'ne@a.tn' } });
  check('module RH hors formule : écriture refusée (403 MODULE_DISABLED)', r.status === 403 && r.body.code === 'MODULE_DISABLED', r);
  row = await one('SELECT COUNT(*)::int AS n FROM employees WHERE "userId" = $1', [A.id]);
  check('les employés déjà saisis sont conservés', row.n === 1, row);

  r = await call('POST', '/team/members', { token: A.token, body: { email: 'v2@test.tn', name: 'Vendeur', role: 'sales', password: 'Vendeur#2026' } });
  check('3e utilisateur accepté (limite de la formule : 3)', r.status === 201, r);
  r = await call('POST', '/team/members', { token: A.token, body: { email: 'v3@test.tn', name: 'Trop', role: 'sales', password: 'Vendeur#2026' } });
  check('4e utilisateur refusé avec un message qui explique la limite', r.status === 400 && /limitée à 3/.test(String(r.body.message)), r);

  r = await call('GET', '/admin/overview', { token: admin });
  check('tableau de bord : 1 client payant, revenu récurrent 49 TND, revenu réel 49 HT', r.body.customers.paying === 1 && r.body.mrr === 49 && r.body.revenue.ht === 49 && r.body.revenue.ttc === 58.31 && r.body.pendingPayments === 0, { customers: r.body.customers, mrr: r.body.mrr, revenue: r.body.revenue });
  check('conversions calculées sur les comptes réels', r.body.conversion.signups === 5 && r.body.conversion.signupsPaid === 1 && r.body.conversion.subscriptionRate === 20 && r.body.conversion.trialsEnded === 1 && r.body.conversion.trialToPaidRate === 100, r.body.conversion);
  check('formule la plus utilisée', r.body.plans[0]?.code === 'starter' && r.body.plans[0].count === 1, r.body.plans);
  r = await call('GET', '/admin/stats', { token: admin });
  check('ancien écran : chiffres réels (plus de case vide)', r.status === 200 && r.body.totalClients === 5 && r.body.totalRevenue === 58.31 && r.body.expiredClients === 0, r);
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
  check('paiement saisi par l’administrateur (formule en brouillon autorisée, espèces) et validé', (r.status === 200 || r.status === 201) && r.body.status === 'validated' && r.body.periodMonths === 12 && r.body.amountHT === 990, r);
  r = await call('GET', '/products', { token: C.token });
  check('C réactivé par le paiement saisi par l’administrateur', r.status === 200, r);
  r = await call('GET', '/admin/overview', { token: admin });
  check('revenu récurrent : 49 + 990/12 = 131,5', r.body.mrr === 131.5 && r.body.customers.paying === 2 && r.body.customers.cancelled === 1 && r.body.cancellations === 1, { mrr: r.body.mrr, customers: r.body.customers });

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
