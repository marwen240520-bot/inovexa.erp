// Tests de bout en bout : formulaire de contact du site (POST /public/contact) avec un FAUX serveur d'emails (voir fakes.js).
// Vérifie : message transmis à l'équipe, « répondre » écrit au visiteur, validation, champ piège anti-robot, limitation de débit.
const { startFakeSmtp } = require('./fakes');
const BASE = process.env.BASE || 'http://127.0.0.1:4101';
let passes = 0, failures = 0;
function check(name, cond, extra) {
  if (cond) { passes++; console.log('  ok  ', name); }
  else { failures++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 500) : ''); }
}
async function post(body) {
  const res = await fetch(BASE + '/public/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const valid = { firstName: 'Ali', lastName: 'Ben Salah', company: 'ACME Tunisie', email: 'ali@acme.tn', phone: '22000000', size: '10-50', message: 'Bonjour,\nJe voudrais un devis <b>annuel</b>.', language: 'fr' };

(async () => {
  const smtp = await startFakeSmtp(Number(process.env.FAKE_SMTP_PORT));
  console.log('— Contact avec SMTP');
  let r = await post(valid);
  check('message valide : 200 { sent: true }', r.status === 200 && r.body.sent === true, r);
  await wait(500);
  const mail = smtp.mails[smtp.mails.length - 1];
  check('l’équipe reçoit le message', !!mail && /ACME Tunisie/.test(mail.data) && /Je voudrais un devis/.test(mail.text), mail && mail.data.slice(0, 300));
  check('« répondre » écrit au visiteur (Reply-To)', !!mail && /^Reply-To:\s*ali@acme\.tn/mi.test(mail.data), mail && mail.data.slice(0, 400));
  check('destinataire = adresse de contact par défaut', !!mail && mail.to.includes('contact@inovexa-erp.com'), mail && mail.to);
  const decoded = mail ? mail.data.replace(/=\r?\n/g, '').replace(/=3D/g, '=') : '';
  check('le HTML du visiteur est neutralisé dans la version HTML du message', /&lt;b&gt;annuel&lt;\/b&gt;/.test(decoded) && !/<p[^>]*>[^<]*<b>annuel/.test(decoded), decoded.slice(0, 900));

  r = await post({ ...valid, email: 'pas-un-email' });
  check('email invalide → 400', r.status === 400, r);
  r = await post({ ...valid, company: '' });
  check('société manquante → 400', r.status === 400, r);
  const before = smtp.mails.length;
  r = await post({ ...valid, website: 'http://spam.example' });
  await wait(400);
  check('champ piège rempli : 200 sans rien envoyer', r.status === 200 && smtp.mails.length === before, { r, before, after: smtp.mails.length });
  r = await post({ ...valid, firstName: 'Ali\r\nBcc: victime@x.tn' });
  await wait(400);
  const last = smtp.mails[smtp.mails.length - 1];
  const headers = last ? last.data.split(/\r?\n\r?\n/)[0] : '';
  check('injection d’en-tête impossible (aucun en-tête Bcc créé)', r.status === 200 && !/^Bcc:/mi.test(headers) && !/^Bcc:/mi.test(last.text), headers);
  r = await post(valid);
  check('6e envoi en moins de 10 minutes → 429', r.status === 429, r);
  console.log(`\n${passes} ok, ${failures} échec(s)`);
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
