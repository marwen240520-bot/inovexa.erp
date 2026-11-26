// Tests de sécurité de bout en bout, sur le serveur réel (NODE_ENV=production, comme chez l'hébergeur) :
//  1. en-têtes et CORS de l'API, erreurs sans trace interne, JSON mal formé ;
//  2. taille des requêtes : 200 Ko sans session valide, 50 Mo avec ;
//  3. mots de passe refusés (trop courants, contenant l'email) à l'inscription et au changement ;
//  4. blocage des tentatives de connexion : par machine, et par compte quand l'attaque est répartie ;
//  5. sessions falsifiées (alg « none », mauvaise clé, rôle trafiqué) et écriture de champs réservés (rôle…) ;
//  6. photos de profil : seul un vrai fichier image est gardé ;
//  7. contrôles de sécurité de l'administrateur (GET /admin/security).
// Lancé par run.sh sur une base neuve (DATABASE_URL, BASE, JWT_SECRET) : propriétaire de test owner@test.tn / Test#12345.
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:4101';
const SECRET = process.env.JWT_SECRET;
let passes = 0, failures = 0;
function check(name, cond, extra) {
  if (cond) { passes++; console.log('  ok  ', name); }
  else { failures++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 600) : ''); }
}
/** `ip` simule des visiteurs différents (le serveur lit X-Forwarded-For derrière UN relais, comme chez l'hébergeur). */
async function call(method, route, opts = {}) {
  const headers = { ...(opts.json !== false && opts.body !== undefined && typeof opts.body !== 'object' ? {} : {}), ...(opts.headers || {}) };
  let body;
  if (opts.form) body = opts.form;
  else if (opts.rawBody !== undefined) { body = opts.rawBody; headers['Content-Type'] = headers['Content-Type'] || 'application/json'; }
  else if (opts.body !== undefined) { body = JSON.stringify(opts.body); headers['Content-Type'] = 'application/json'; }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.ip) headers['X-Forwarded-For'] = opts.ip;
  const res = await fetch(BASE + route, { method, headers, body });
  const text = await res.text();
  let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, body: parsed, text, headers: res.headers };
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = (payload, secret) => {
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64(payload);
  return `${head}.${body}.${crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`;
};
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const signup = (over = {}) => ({ name: 'Sami Trabelsi', companyName: 'Société', email: 'x@test.tn', phone: '22 535 181', password: 'Zebre#2026-ok', sector: 'commerce', acceptTerms: true, ...over });
const login = (email, password, ip) => call('POST', '/auth/login', { body: { email, password }, ip });
const avatarFiles = () => { try { return fs.readdirSync(path.join(process.cwd(), 'uploads', 'avatars')).length; } catch { return 0; } };

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const one = async (sql, params) => (await db.query(sql, params)).rows[0];
  await db.query(`INSERT INTO users (email,password,name,role,modules) VALUES ($1,$2,'Admin','admin','{}')`, ['admin@test.tn', await bcrypt.hash('Admin#2026-secret', 10)]);
  let r = await login('owner@test.tn', 'Test#12345', '10.9.0.1');
  const owner = r.body.access_token;
  const ownerId = r.body.user.id;
  r = await login('admin@test.tn', 'Admin#2026-secret', '10.9.0.2');
  const admin = r.body.access_token;
  const adminId = r.body.user.id;
  check('propriétaire et administrateur de test connectés', !!owner && !!admin, r);

  // ═════════════════════════ 1. En-têtes, CORS, erreurs ═════════════════════════
  console.log('— En-têtes de sécurité, CORS et erreurs sans trace interne');
  r = await call('GET', '/public/config');
  check('en-têtes : nosniff, HSTS, pas de X-Powered-By', r.headers.get('x-content-type-options') === 'nosniff' && /max-age=\d+/.test(r.headers.get('strict-transport-security') || '') && r.headers.get('x-powered-by') === null, [...r.headers.keys()]);
  r = await call('OPTIONS', '/auth/login', { headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  check('CORS : un site inconnu n’est pas autorisé à appeler l’API depuis un navigateur', r.headers.get('access-control-allow-origin') === null, r.headers.get('access-control-allow-origin'));
  r = await call('OPTIONS', '/auth/login', { headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  check('CORS : le site de l’éditeur l’est', r.headers.get('access-control-allow-origin') === 'http://localhost:3000', r.headers.get('access-control-allow-origin'));
  r = await call('GET', '/cette-route-nexiste-pas');
  check('route inconnue : 404 sans trace interne', r.status === 404 && !/node_modules|\n\s+at /.test(r.text), r.text.slice(0, 200));
  r = await call('POST', '/auth/login', { rawBody: '{"email": "a@b.c", "password": ' });
  check('JSON mal formé : 400 sans trace interne', r.status === 400 && !/node_modules|\n\s+at /.test(r.text), r);
  r = await call('POST', '/auth/login', { body: { email: "' OR 1=1 --", password: "' OR '1'='1" }, ip: '10.9.0.3' });
  check('injection SQL dans l’email de connexion : rejetée à la validation (400), jamais d’erreur serveur', r.status === 400, r);
  r = await call('POST', '/auth/login', { body: { email: "o'brien' OR '1'='1@test.tn", password: "' OR '1'='1" }, ip: '10.9.0.3' });
  check('même avec une adresse en apparence valide : refusée (400 ou 401), jamais d’erreur serveur', r.status === 400 || r.status === 401, r);
  for (const route of ['/clients?search=%27%20OR%201%3D1%20--', '/products?search=%27%3B%20DROP%20TABLE%20users%3B%20--', '/clients?search[%24ne]=1', '/products?page=abc&limit=-5']) {
    r = await call('GET', route, { token: owner });
    check(`injection dans ${route.split('?')[0]}?… : aucune erreur serveur`, r.status < 500, r);
  }
  check('la table des utilisateurs est intacte', Number((await one('SELECT COUNT(*) AS n FROM users')).n) >= 2);

  // ═════════════════════════ 2. Taille des requêtes ═════════════════════════
  console.log('— Taille des requêtes : 200 Ko sans session valide, 50 Mo avec');
  const big = (kb) => JSON.stringify({ name: 'x', notes: 'a'.repeat(kb * 1024) });
  r = await call('POST', '/clients', { rawBody: big(300) });
  check('sans session : un corps de 300 Ko est refusé (413) avant d’être lu en entier', r.status === 413, r.status);
  r = await call('POST', '/clients', { rawBody: big(300), headers: { Authorization: 'Bearer faux.jeton.inventé' } });
  check('avec un faux jeton : refusé aussi (413)', r.status === 413, r.status);
  r = await call('POST', '/clients', { rawBody: big(300), token: sign({ userId: ownerId, email: 'owner@test.tn', role: 'client', tv: 0 }, 'une-autre-cle-que-celle-du-serveur') });
  check('avec un jeton signé par quelqu’un d’autre : refusé aussi (413)', r.status === 413, r.status);
  r = await call('POST', '/auth/login', { rawBody: JSON.stringify({ email: 'a@b.tn', password: 'x'.repeat(300 * 1024) }), token: owner });
  check('routes /auth et /public : 200 Ko pour tout le monde, même connecté', r.status === 413, r.status);
  r = await call('POST', '/clients', { rawBody: big(300), token: owner });
  check('avec une vraie session : 300 Ko acceptés (la route répond, pas de 413)', r.status !== 413, r.status);
  r = await call('POST', '/clients', { rawBody: big(3 * 1024), token: owner });
  check('avec une vraie session : 3 Mo acceptés (imports de données)', r.status !== 413, r.status);
  r = await call('POST', '/clients', { rawBody: big(60 * 1024), token: owner });
  check('au-delà de 50 Mo : refusé même connecté (413)', r.status === 413, r.status);

  // ═════════════════════════ 3. Mots de passe ═════════════════════════
  console.log('— Mots de passe : trop courants ou contenant l’email, refusés');
  for (const [pw, email] of [['Password1', 'a1@test.tn'], ['Azerty123!', 'a2@test.tn'], ['P@ssw0rd', 'a3@test.tn'], ['Inovexa2026', 'a4@test.tn'], ['aaaa1111', 'a5@test.tn']]) {
    r = await call('POST', '/auth/register', { body: signup({ email, password: pw }), ip: '10.9.1.1' });
    check(`inscription avec « ${pw} » : 400, mot de passe trop courant`, r.status === 400 && /trop courant/i.test(String(r.body.message)), r.body);
  }
  r = await call('POST', '/auth/register', { body: signup({ email: 'sami.trabelsi@test.tn', password: 'sami.trabelsi1X' }), ip: '10.9.1.1' });
  check('inscription avec un mot de passe qui contient l’email : 400', r.status === 400 && /adresse email/i.test(String(r.body.message)), r.body);
  r = await call('POST', '/auth/register', { body: signup({ email: 'faible@test.tn', password: 'motdepasse' }), ip: '10.9.1.1' });
  check('règle d’origine toujours là : sans chiffre, 400', r.status === 400 && /8 caractères/.test(String(r.body.message)), r.body);
  check('aucun de ces refus n’a créé de compte', Number((await one(`SELECT COUNT(*) AS n FROM users WHERE email LIKE 'a_@test.tn' OR email IN ('sami.trabelsi@test.tn','faible@test.tn')`)).n) === 0);
  r = await call('POST', '/auth/register', { body: signup({ email: 'victime@test.tn', password: 'Zebre#2026-ok' }), ip: '10.9.1.1' });
  check('un mot de passe varié est accepté (201)', r.status === 201 && !!r.body.access_token, r.body);
  const victimToken = r.body.access_token;
  r = await call('PATCH', '/users/change-password', { token: victimToken, body: { oldPassword: 'Zebre#2026-ok', newPassword: 'Azerty123' } });
  check('changement de mot de passe vers un mot de passe courant : 400', r.status === 400 && /trop courant/i.test(String(r.body.message)), r.body);
  r = await call('PATCH', '/users/change-password', { token: victimToken, body: { oldPassword: 'Zebre#2026-ok', newPassword: 'victime-2026-Ok!' } });
  check('… ou contenant son adresse (victime@…) : 400', r.status === 400 && /adresse email/i.test(String(r.body.message)), r.body);
  r = await call('POST', '/auth/reset-password', { body: { email: 'victime@test.tn', token: 'x'.repeat(40), newPassword: 'Password123' } });
  check('réinitialisation avec un mot de passe courant : 400 avant même de regarder le lien', r.status === 400 && /trop courant/i.test(String(r.body.message)), r.body);
  r = await call('PATCH', '/users/change-password', { token: victimToken, body: { oldPassword: 'Zebre#2026-ok', newPassword: 'Lune#Bleue-2027x' } });
  check('un bon nouveau mot de passe est accepté', r.status === 200 && !!r.body.access_token, r.body);
  r = await call('GET', '/auth/me', { token: victimToken });
  check('l’ancienne session est fermée par le changement de mot de passe (401)', r.status === 401, r.status);
  const VICTIM_PW = 'Lune#Bleue-2027x';

  // ═════════════════════════ 4. Blocage des tentatives de connexion ═════════════════════════
  console.log('— Tentatives de connexion : blocage par machine, et par compte contre une attaque répartie');
  for (let i = 1; i <= 5; i++) {
    r = await login('victime@test.tn', 'mauvais-mot-de-passe-' + i, '10.3.0.1');
    if (i < 5) check(`échec n° ${i} depuis la machine A : 401`, r.status === 401, r.status);
  }
  r = await login('victime@test.tn', VICTIM_PW, '10.3.0.1');
  check('après 5 échecs, la machine A est bloquée même avec le bon mot de passe (429)', r.status === 429 && /Trop de tentatives/.test(String(r.body.message)), r.body);
  r = await login('victime@test.tn', VICTIM_PW, '10.3.0.2');
  check('mais le propriétaire, depuis une autre machine, se connecte normalement (200) : on ne peut pas l’enfermer dehors', r.status === 200 && !!r.body.access_token, r.body);

  r = await call('POST', '/auth/register', { body: signup({ email: 'cible@test.tn', password: 'Zebre#2026-ok' }), ip: '10.9.1.2' });
  check('deuxième compte (cible d’une attaque répartie)', r.status === 201, r.body);
  let blockedAt = 0;
  for (let ip = 1; ip <= 8 && !blockedAt; ip++) {
    for (let i = 1; i <= 5; i++) {
      r = await login('cible@test.tn', `essai-${ip}-${i}`, `10.4.0.${ip}`);
      if (r.status === 429 && !blockedAt) { blockedAt = (ip - 1) * 5 + i; break; }
    }
  }
  check('30 échecs répartis sur plusieurs machines : le compte est bloqué pour tout le monde', blockedAt >= 26 && blockedAt <= 36, blockedAt);
  r = await login('cible@test.tn', 'Zebre#2026-ok', '10.4.9.9');
  check('même le bon mot de passe, depuis une machine neuve, attend la fin du blocage (429)', r.status === 429, r);
  r = await login('cible-inconnue@test.tn', 'nimporte-Quoi-1', '10.4.9.10');
  check('un compte qui n’existe pas répond comme les autres (401, pas d’indice)', r.status === 401 && r.body.message === 'Email ou mot de passe incorrect', r.body);

  // ═════════════════════════ 5. Sessions falsifiées, champs réservés ═════════════════════════
  console.log('— Sessions falsifiées et champs réservés');
  const noneToken = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ userId: ownerId, email: 'owner@test.tn', role: 'admin', tv: 0 })}.`;
  r = await call('GET', '/auth/me', { token: noneToken });
  check('jeton « alg: none » (sans signature) : 401', r.status === 401, r.status);
  r = await call('GET', '/auth/me', { token: sign({ userId: ownerId, email: 'owner@test.tn', role: 'client', tv: 0 }, 'autre-cle') });
  check('jeton signé avec une autre clé : 401', r.status === 401, r.status);
  const real = sign({ userId: ownerId, email: 'owner@test.tn', role: 'client', tv: 0 }, SECRET);
  r = await call('GET', '/auth/me', { token: real });
  check('(témoin) un jeton correctement signé est accepté', r.status === 200, r.status);
  const forged = sign({ userId: ownerId, email: 'owner@test.tn', role: 'admin', tv: 0 }, SECRET);
  r = await call('GET', '/admin/payments', { token: forged });
  check('jeton signé qui AFFIRME « admin » : le rôle réel (base de données) fait foi → 403', r.status === 403, r.status);
  r = await call('GET', '/auth/me', { token: sign({ userId: ownerId, email: 'owner@test.tn', role: 'client', tv: 99 }, SECRET) });
  check('jeton d’une version de session qui n’existe pas : 401', r.status === 401, r.status);
  r = await call('GET', '/auth/me', { token: sign({ userId: ownerId, email: 'owner@test.tn', role: 'client', tv: 0, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET) });
  check('jeton expiré : 401', r.status === 401, r.status);
  r = await call('GET', '/admin/payments');
  check('administration sans session : 401', r.status === 401, r.status);
  r = await call('GET', '/admin/payments', { token: owner });
  check('administration avec un compte client : 403', r.status === 403, r.status);

  r = await call('PATCH', '/users/profile', { token: owner, body: { name: 'Propriétaire', role: 'admin', modules: { sales: false }, isActive: false, ownerId: 1, emailVerifiedAt: '2000-01-01', tokenVersion: 99, signupSource: 'admin', password: 'Hack#2026-xx' } });
  const after = await one('SELECT role, "isActive", "ownerId", "tokenVersion", password FROM users WHERE id = $1', [ownerId]);
  check('profil : les champs réservés (rôle, activation, rattachement, session, mot de passe) sont ignorés', after.role === 'client' && after.isActive === true && after.ownerId === null && Number(after.tokenVersion) !== 99 && (await bcrypt.compare('Test#12345', after.password)), { status: r.status, after: { ...after, password: '…' } });
  r = await call('GET', '/admin/payments', { token: owner });
  check('… et le compte est toujours un compte client', r.status === 403, r.status);

  // ═════════════════════════ 6. Photos de profil ═════════════════════════
  console.log('— Photos de profil : seul un vrai fichier image est gardé');
  const before = avatarFiles();
  const upload = (buf, filename, type) => { const form = new FormData(); form.append('file', new Blob([buf], { type }), filename); return call('POST', '/upload/avatar', { token: owner, form }); };
  r = await upload(Buffer.from('<!doctype html><script>alert(document.cookie)</script>'), 'photo.png', 'image/png');
  check('une page HTML qui se fait passer pour un PNG : refusée (400)', r.status === 400 && /pas une image valide/.test(String(r.body.message)), r.body);
  r = await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'), 'logo.svg', 'image/svg+xml');
  check('un SVG (peut contenir du script) : refusé (400)', r.status === 400, r.body);
  r = await upload(PNG_1X1, 'photo.jpg', 'image/jpeg');
  check('un PNG annoncé comme JPEG : refusé (400)', r.status === 400 && /pas une image valide/.test(String(r.body.message)), r.body);
  r = await upload(Buffer.alloc(100, 0x41), 'photo.gif', 'image/gif');
  check('des octets quelconques annoncés comme GIF : refusés (400)', r.status === 400, r.body);
  check('aucun de ces fichiers n’est resté sur le disque', avatarFiles() === before, [before, avatarFiles()]);
  r = await upload(PNG_1X1, 'ma-photo.png', 'image/png');
  check('un vrai PNG : accepté, nom choisi par le serveur', r.status === 201 && /^avatar-\d+-[0-9a-f]{12}\.png$/.test(String(r.body.avatar)), r.body);
  const url = r.body.url;
  const shown = await fetch(BASE + url);
  check('affichée avec le bon type et l’interdiction de deviner le type (nosniff)', shown.status === 200 && shown.headers.get('content-type') === 'image/png' && shown.headers.get('x-content-type-options') === 'nosniff', [shown.status, shown.headers.get('content-type')]);
  r = await call('DELETE', '/upload/avatar', { token: owner });
  check('suppression de la photo', r.status === 200 && avatarFiles() === before, [r.status, avatarFiles()]);
  r = await call('POST', '/upload/avatar');
  check('envoi sans session : 401', r.status === 401, r.status);

  // ═════════════════════════ 7. Contrôles de sécurité de l’administrateur ═════════════════════════
  console.log('— Contrôles de sécurité du serveur (GET /admin/security)');
  r = await call('GET', '/admin/security');
  check('sans session : 401', r.status === 401, r.status);
  r = await call('GET', '/admin/security', { token: owner });
  check('avec un compte client : 403', r.status === 403, r.status);
  r = await call('GET', '/admin/security', { token: admin });
  const byKey = Object.fromEntries((r.body.checks || []).map((c) => [c.key, c]));
  check('rapport complet pour l’administrateur', r.status === 200 && r.body.production === true && ['secret', 'https', 'schema', 'swagger', 'mail', 'payments', 'admin2fa', 'backups'].every((k) => byKey[k]), r.body);
  check('clé de session trop courte (celle des essais) : erreur bloquante en production', byKey.secret.ok === false && byKey.secret.level === 'error', byKey.secret);
  check('adresses locales (http) : erreur bloquante en production', byKey.https.ok === false && byKey.https.level === 'error', byKey.https);
  check('schéma géré par les migrations : en règle', byKey.schema.ok === true, byKey.schema);
  check('emails, paiement, double authentification de l’administrateur, sauvegardes : avertissements', ['mail', 'payments', 'admin2fa', 'backups'].every((k) => byKey[k].ok === false && byKey[k].level === 'warn'), byKey);
  check('le résumé compte les erreurs et les avertissements', r.body.ok === false && r.body.errors === 2 && r.body.warnings >= 4, [r.body.ok, r.body.errors, r.body.warnings]);
  check('jamais de valeur secrète dans la réponse', !r.text.includes(SECRET) && !/e2e-secret/.test(r.text), r.text.slice(0, 300));
  await db.query(`UPDATE users SET "twoFactorEnabled" = true WHERE email = 'admin@test.tn'`);
  r = await call('GET', '/admin/security', { token: admin });
  check('administrateur avec double authentification : ce contrôle passe', r.body.checks.find((c) => c.key === 'admin2fa').ok === true, r.body.checks.find((c) => c.key === 'admin2fa'));

  // ═════════════════════════ 8. Double authentification ═════════════════════════
  console.log('— Double authentification : activation, connexion, réinitialisation par le support');
  const { totp } = require('../../dist/common/totp');
  r = await login('victime@test.tn', VICTIM_PW, '10.5.0.1');
  const vt = r.body.access_token;
  const vid = r.body.user.id;
  check('client de test connecté (sans double authentification)', r.status === 200 && !!vt && r.body.user.twoFactorEnabled !== true, r.body);
  r = await call('POST', '/auth/2fa/setup', { token: vt });
  check('installation : clé secrète, adresse otpauth et QR code', r.status === 200 && /^[A-Z2-7]{16,}$/.test(r.body.secret) && /^otpauth:\/\/totp\//.test(r.body.otpauthUrl) && /^data:image\/png;base64,/.test(r.body.qrCodeDataUrl), Object.keys(r.body));
  const secret = r.body.secret;
  r = await call('POST', '/auth/2fa/enable', { token: vt, body: { code: '12' } });
  check('activation avec un code mal formé : 400', r.status === 400, r);
  r = await call('POST', '/auth/2fa/enable', { token: vt, body: { code: totp(secret, Date.now() + 10 * 60 * 1000) } });
  check('activation avec un code qui n’est pas celui du moment : 400', r.status === 400 && /Code invalide/.test(String(r.body.message)), r.body);
  r = await login('victime@test.tn', VICTIM_PW, '10.5.0.2');
  check('tant que la double authentification n’est pas confirmée, la connexion reste normale', r.status === 200, r);
  r = await call('POST', '/auth/2fa/enable', { token: vt, body: { code: totp(secret) } });
  check('activation avec le bon code : confirmée', r.status === 200 && r.body.twoFactorEnabled === true, r.body);
  r = await call('POST', '/auth/2fa/setup', { token: vt });
  check('une seconde installation est refusée tant qu’elle est active (400)', r.status === 400 && /déjà activée/.test(String(r.body.message)), r.body);
  r = await login('victime@test.tn', VICTIM_PW, '10.5.0.3');
  check('connexion sans code : 401 « code requis »', r.status === 401 && r.body.requires2fa === true, r.body);
  r = await call('POST', '/auth/login', { body: { email: 'victime@test.tn', password: VICTIM_PW, otp: '000000' }, ip: '10.5.0.3' });
  check('connexion avec un mauvais code : 401', r.status === 401 && r.body.requires2fa === true && /invalide/.test(String(r.body.message)), r.body);
  r = await call('POST', '/auth/login', { body: { email: 'victime@test.tn', password: 'mauvais-Mot-2de-passe', otp: totp(secret) }, ip: '10.5.0.3' });
  check('le bon code ne remplace pas le mot de passe (401)', r.status === 401, r.body);
  r = await call('POST', '/auth/login', { body: { email: 'victime@test.tn', password: VICTIM_PW, otp: totp(secret) }, ip: '10.5.0.3' });
  check('mot de passe + bon code : connecté', r.status === 200 && !!r.body.access_token, r.body);
  const vt2 = r.body.access_token;

  r = await call('POST', `/admin/accounts/${vid}/reset-2fa`, { token: owner });
  check('réinitialisation par un compte client : 403', r.status === 403, r.status);
  r = await call('POST', `/admin/accounts/${vid}/reset-2fa`);
  check('… sans session : 401', r.status === 401, r.status);
  r = await call('POST', '/admin/accounts/999999/reset-2fa', { token: admin });
  check('compte inconnu : 404', r.status === 404, r.status);
  r = await call('POST', `/admin/accounts/${adminId}/reset-2fa`, { token: admin });
  check('un compte administrateur ne se réinitialise pas par l’API (403) : commande serveur seulement', r.status === 403 && /ADMIN_RESET_2FA/.test(String(r.body.message)), r.body);
  r = await call('POST', `/admin/accounts/${vid}/reset-2fa`, { token: admin });
  check('le support réinitialise la double authentification du client (200)', r.status === 200 && r.body.success === true && r.body.alreadyDisabled === false, r.body);
  const reset = await one(`SELECT "twoFactorEnabled", "twoFactorSecret" FROM users WHERE id = $1`, [vid]);
  check('la clé secrète est effacée en base', reset.twoFactorEnabled === false && reset.twoFactorSecret === null, reset);
  r = await call('GET', '/auth/me', { token: vt2 });
  check('ses sessions ouvertes sont fermées (401)', r.status === 401, r.status);
  r = await login('victime@test.tn', VICTIM_PW, '10.5.0.4');
  check('il se reconnecte avec son seul mot de passe', r.status === 200, r.body);
  const vt3 = r.body.access_token;
  check('l’action est inscrite au journal', Number((await one(`SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'two_factor_reset_by_admin' AND "actorId" = $1`, [adminId])).n) === 1);
  r = await call('POST', `/admin/accounts/${vid}/reset-2fa`, { token: admin });
  check('réinitialiser deux fois ne change rien', r.status === 200 && r.body.alreadyDisabled === true, r.body);

  // Désactivation par le client lui-même : mot de passe ET code.
  r = await call('POST', '/auth/2fa/setup', { token: vt3 });
  const secret2 = r.body.secret;
  r = await call('POST', '/auth/2fa/enable', { token: vt3, body: { code: totp(secret2) } });
  check('réactivation : nouvelle clé confirmée', r.status === 200 && secret2 !== secret, r.body);
  r = await call('POST', '/auth/2fa/disable', { token: vt3, body: { password: 'mauvais-Mot-2de-passe', code: totp(secret2) } });
  check('désactivation avec un mauvais mot de passe : 401', r.status === 401, r);
  r = await call('POST', '/auth/2fa/disable', { token: vt3, body: { password: VICTIM_PW, code: '000000' } });
  check('désactivation avec un mauvais code : 400', r.status === 400, r);
  r = await call('POST', '/auth/2fa/disable', { token: vt3, body: { password: VICTIM_PW, code: totp(secret2) } });
  check('désactivation avec le mot de passe et le bon code : 200', r.status === 200 && r.body.twoFactorEnabled === false, r.body);
  r = await login('victime@test.tn', VICTIM_PW, '10.5.0.5');
  check('connexion de nouveau sans code', r.status === 200, r.body);

  // Administrateur qui a perdu son téléphone : seule la commande du serveur efface sa double authentification.
  console.log('— Récupération d’un administrateur depuis le serveur (ADMIN_RESET_2FA)');
  await db.query(`UPDATE users SET "twoFactorSecret" = 'JBSWY3DPEHPK3PXP', "twoFactorEnabled" = true WHERE email = 'admin@test.tn'`);
  r = await login('admin@test.tn', 'Admin#2026-secret', '10.5.1.1');
  check('administrateur avec double authentification : le mot de passe seul ne suffit plus (401)', r.status === 401 && r.body.requires2fa === true, r.body);
  const adminBefore = await one(`SELECT password, "tokenVersion" FROM users WHERE email = 'admin@test.tn'`);
  const cli = (email, extra = {}) => execFileSync('node', [path.join(process.cwd(), 'dist', 'cli', 'create-admin.js')], {
    env: { ...process.env, ADMIN_RESET_2FA: 'true', ADMIN_EMAIL: email, ...extra }, stdio: 'pipe', timeout: 60000,
  }).toString();
  let failed = false;
  try { cli('victime@test.tn'); } catch { failed = true; }
  check('la commande refuse un compte qui n’est pas administrateur', failed === true);
  failed = false;
  try { cli('inconnu@test.tn'); } catch { failed = true; }
  check('… ou un compte qui n’existe pas', failed === true);
  const out = cli('admin@test.tn');
  check('la commande efface la double authentification de l’administrateur', /Double authentification de admin@test\.tn effacée/.test(out), out);
  const adminAfter = await one(`SELECT password, "twoFactorEnabled", "twoFactorSecret", "tokenVersion" FROM users WHERE email = 'admin@test.tn'`);
  check('le mot de passe n’a pas changé, la clé a disparu, les sessions sont fermées', adminAfter.password === adminBefore.password && adminAfter.twoFactorEnabled === false && adminAfter.twoFactorSecret === null && adminAfter.tokenVersion === adminBefore.tokenVersion + 1, adminAfter);
  r = await call('GET', '/auth/me', { token: admin });
  check('l’ancienne session de l’administrateur est refusée (401)', r.status === 401, r.status);
  r = await login('admin@test.tn', 'Admin#2026-secret', '10.5.1.2');
  check('il se reconnecte avec son mot de passe seul', r.status === 200 && !!r.body.access_token, r.body);

  await db.end();
  console.log(`\n${passes} ok, ${failures} échec(s)`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
