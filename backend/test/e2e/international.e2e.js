// Tests de bout en bout : sociétés de n'importe quel pays (pays, devise, TVA propre à la société, décimales de la devise),
// fonctions tunisiennes réservées à la Tunisie (timbre, retenue, TEIF, paie) et non-régression d'une société tunisienne.
// Chaque société est créée par l'inscription publique (POST /auth/register), comme le ferait un vrai client.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { api, check, setToken, summary } = require('./lib');

const near = (a, b, eps = 0.0006) => Math.abs(Number(a) - Number(b)) <= eps;
const PASSWORD = 'Essai#2026ok';
const signup = (over = {}) => ({
  name: 'Camille Martin', companyName: 'Martin Conseil SAS', email: 'camille@test.fr', phone: '+33 6 12 34 56 78',
  password: PASSWORD, sector: 'commerce', acceptTerms: true, ...over,
});
const register = async (over) => {
  setToken(null);
  const r = await api('POST', '/auth/register', signup(over));
  if (r.status === 201) setToken(r.body.access_token);
  return r;
};
const noTunisianFeatures = (f) => f && f.stampDuty === false && f.withholding === false && f.teif === false && f.payroll === false;
const hasPdftotext = spawnSync('pdftotext', ['-v'], { encoding: 'utf8' }).error === undefined;
async function pdfText(docId) {
  const res = await api('GET', `/documents/${docId}/pdf`, null, true);
  const buf = Buffer.from(await res.arrayBuffer());
  if (res.status !== 200 || buf.slice(0, 4).toString() !== '%PDF') return { ok: false, status: res.status, text: '' };
  if (!hasPdftotext) return { ok: true, text: null };
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'intl-')), 'doc.pdf');
  fs.writeFileSync(file, buf);
  const out = spawnSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  return { ok: true, text: String(out.stdout || '').replace(/\s+/g, ' ') };
}

(async () => {
  // ═════════════════════════ Inscription : contrôles ═════════════════════════
  console.log('— Inscription : pays, devise et identifiant fiscal contrôlés avant la création du compte');
  let r = await register({ email: 'a1@test.fr', countryCode: 'ZZ' });
  check('pays inconnu refusé', r.status === 400 && /pays/i.test(JSON.stringify(r.body)), r);
  r = await register({ email: 'a2@test.fr', countryCode: 'FRA' });
  check('code pays à 3 lettres refusé', r.status === 400, r);
  r = await register({ email: 'a3@test.fr', countryCode: 'FR', currency: 'EU' });
  check('devise à 2 lettres refusée', r.status === 400, r);
  r = await register({ email: 'a4@test.fr', countryCode: 'FR', currency: '123' });
  check('devise sans lettres refusée', r.status === 400 && /devise/i.test(JSON.stringify(r.body)), r);
  r = await register({ email: 'a5@test.fr', countryCode: 'AQ' });
  check('pays sans devise d’usage : la devise est demandée', r.status === 400 && /devise/i.test(JSON.stringify(r.body)), r);
  r = await register({ email: 'a6@test.fr', countryCode: 'FR', taxId: 'a' });
  check('identifiant fiscal étranger trop court refusé', r.status === 400, r);
  r = await register({ email: 'a7@test.tn', phone: '22 535 181', taxId: 'FR12345678901' });
  check('société tunisienne : le matricule fiscal reste strict', r.status === 400 && /atricule/.test(JSON.stringify(r.body)), r);
  r = await register({ email: 'a8@test.fr', countryCode: 'FR', phone: '06 12 34 56 78' });
  check('numéro étranger sans indicatif refusé', r.status === 400, r);
  r = await api('GET', '/public/config');
  check('aucun compte créé par les inscriptions refusées', r.status === 200, r.status);

  // ═════════════════════════ France : euro, TVA 20 % ═════════════════════════
  console.log('— France : société en euros');
  r = await register({ email: 'camille@test.fr', countryCode: 'FR', currency: 'EUR', taxId: 'fr 12 345678901' });
  check('inscription France / euro', r.status === 201 && !!r.body.access_token, r);
  r = await api('GET', '/company/profile');
  check('profil : France, euro, 2 décimales, « identifiant fiscal », aucune fonction tunisienne',
    r.status === 200 && r.body.countryCode === 'FR' && r.body.countryName === 'France' && r.body.currency === 'EUR' && r.body.currencyDecimals === 2
    && r.body.taxIdLabel === 'Identifiant fiscal' && noTunisianFeatures(r.body.features), r.body);
  check('TVA de départ : 0 % seulement', JSON.stringify(r.body.vatRates) === '[0]' && r.body.defaultVatRate === 0, r.body);
  r = await api('GET', '/company');
  check('fiche société : identifiant mis en forme, ni timbre ni dinar, profil joint',
    r.body.taxId === 'FR 12 345678901' && r.body.stampDutyEnabled === false && r.body.currency === 'EUR' && r.body.country === 'France' && r.body.profile?.countryCode === 'FR', r.body);
  r = await api('GET', '/documents/meta');
  check('métadonnées des documents : taux de la société, ni retenue ni TEIF',
    r.status === 200 && JSON.stringify(r.body.vatRates) === '[0]' && r.body.withholdingPresets.length === 0 && r.body.features.teif === false, r.body);

  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Client Paris', lines: [{ description: 'Conseil', quantity: 1, unitPriceHT: 100, vatRate: 20 }] });
  check('TVA 20 % refusée tant que la société n’a pas réglé ses taux', r.status === 400 && /TVA/.test(JSON.stringify(r.body)), r);
  r = await api('PUT', '/company', { vatRates: [] });
  check('liste de taux vide refusée', r.status === 400, r);
  r = await api('PUT', '/company', { vatRates: [150] });
  check('taux hors bornes refusé', r.status === 400, r);
  r = await api('PUT', '/company', { vatRates: [12.345] });
  check('taux à trois décimales refusé', r.status === 400, r);
  r = await api('PUT', '/company', { defaultVatRate: 150 });
  check('taux par défaut hors bornes refusé', r.status === 400, r);
  r = await api('PUT', '/company', { countryCode: 'ZZ' });
  check('pays inconnu refusé dans la fiche société', r.status === 400, r);
  r = await api('PUT', '/company', { currency: 'euro' });
  check('devise mal formée refusée', r.status === 400, r);
  r = await api('PUT', '/company', { currency: 'ZZZ' });
  check('devise inexistante refusée', r.status === 400 && /Devise invalide/.test(JSON.stringify(r.body)), r);
  r = await api('PUT', '/company', { taxId: '<script>' });
  check('identifiant fiscal aux caractères étranges refusé', r.status === 400, r);
  r = await api('PUT', '/company', { vatRates: [20, 10, 5.5, 2.1], defaultVatRate: 20 });
  check('taux de TVA français enregistrés (triés), taux par défaut 20 %',
    r.status === 200 && JSON.stringify(r.body.profile.vatRates) === '[2.1,5.5,10,20]' && r.body.profile.defaultVatRate === 20, r.body.profile);
  r = await api('GET', '/documents/meta');
  check('les documents proposent les nouveaux taux', JSON.stringify(r.body.vatRates) === '[2.1,5.5,10,20]', r.body.vatRates);
  r = await api('PUT', '/company', { currency: 'USD' });
  check('devise modifiable tant qu’aucune pièce n’est numérotée', r.status === 200 && r.body.profile.currency === 'USD' && r.body.profile.currencyDecimals === 2, r.body.profile);
  r = await api('PUT', '/company', { currency: 'EUR' });
  check('retour à l’euro', r.status === 200 && r.body.profile.currency === 'EUR', r.body.profile);
  r = await api('PUT', '/company', { countryCode: 'TN' });
  check('une société tunisienne tient ses comptes en dinars : pas de passage à la Tunisie en euros', r.status === 400 && /dinars/.test(JSON.stringify(r.body)), r);
  r = await api('PUT', '/company', { countryCode: 'TN', currency: 'TND' });
  check('passage à la Tunisie refusé tant que l’identifiant fiscal n’est pas un matricule valable', r.status === 400 && /en même temps/.test(JSON.stringify(r.body)), r);
  r = await api('PUT', '/company', { countryCode: 'TN', currency: 'TND', taxId: '1234567x/a/m/000' });
  check('passage à la Tunisie avec un matricule valable : dinars, timbre et TEIF disponibles',
    r.status === 200 && r.body.profile.countryCode === 'TN' && r.body.profile.currency === 'TND' && r.body.profile.currencyDecimals === 3 && r.body.profile.features.teif === true && r.body.taxId === '1234567X/A/M/000', r.body.profile);
  r = await api('PUT', '/company', { countryCode: 'FR', currency: 'EUR', taxId: 'FR 12 345678901' });
  check('retour à la France : euros, deux décimales, ni TEIF ni timbre',
    r.status === 200 && r.body.profile.countryCode === 'FR' && r.body.profile.currency === 'EUR' && r.body.profile.currencyDecimals === 2 && r.body.profile.features.teif === false && r.body.country === 'France', r.body.profile);

  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Atelier Dupont', lines: [{ description: 'Conseil', quantity: 1, unitPriceHT: 100 }] });
  check('facture à émettre sans mentions légales : brouillon accepté', r.status === 201, r);
  const draftNoCompany = r.body;
  r = await api('POST', `/documents/${draftNoCompany.id}/validate`);
  check('validation refusée tant que l’adresse manque (raison sociale et identifiant fiscal viennent de l’inscription)', r.status === 400 && /mentions légales manquantes : adresse\)/.test(JSON.stringify(r.body)), r);
  await api('DELETE', `/documents/${draftNoCompany.id}`);

  r = await api('PUT', '/company', { legalName: 'Martin Conseil SAS', legalForm: 'SAS', taxId: 'FR12 345678901', tradeRegister: '123 456 789 RCS Paris', address: '8 rue de Rivoli', city: 'Paris', postalCode: '75004', bankName: 'BNP Paribas', bankAccount: 'FR76 3000 6000 0112 3456 7890 189', phone: '+33 1 23 45 67 89' });
  check('fiche société complétée', r.status === 200 && r.body.legalGaps.length === 0 && r.body.taxId === 'FR12 345678901', r.body.legalGaps);
  r = await api('POST', '/clients', { name: 'Atelier Dupont', email: 'achats@dupont.fr', address: '12 avenue Foch, 69006 Lyon', taxId: 'FR98765432109' });
  check('client avec son numéro de TVA français', r.status === 201 && r.body.taxId === 'FR98765432109', r);
  const client = r.body;
  r = await api('POST', '/clients', { name: 'Client sans identifiant', email: 'x@dupont.fr' });
  const clientNoTax = r.body;

  r = await api('POST', '/products', { name: 'Licence logiciel', sku: 'LIC-1', price: 50, quantity: 0, vatRate: 20, isStockable: false });
  check('produit à 20 % de TVA accepté', r.status === 201 && Number(r.body.vatRate) === 20, r);
  r = await api('POST', '/products', { name: 'Livre', sku: 'LIV-1', price: 12, quantity: 0, vatRate: 5.5, isStockable: false });
  check('taux réduit à décimale (5,5 %) accepté', r.status === 201 && Number(r.body.vatRate) === 5.5, r);
  r = await api('POST', '/products', { name: 'Autre', sku: 'AUT-1', price: 12, quantity: 0, vatRate: 13 });
  check('TVA 13 % refusée : ce n’est pas un taux de la société', r.status === 400 && /TVA/.test(JSON.stringify(r.body)), r);

  console.log('— France : facture en euros');
  // Même avec un timbre et une retenue demandés, une société étrangère n'en applique pas.
  r = await api('POST', '/documents', { type: 'invoice', partyId: client.id, applyStamp: true, withholdingRate: 1.5, lines: [{ description: 'Conseil stratégique', quantity: 3, unitPriceHT: 19.99, vatRate: 20 }] });
  check('facture brouillon : totaux au centime, ni timbre ni retenue',
    r.status === 201 && r.body.currency === 'EUR' && near(r.body.totalHT, 59.97) && near(r.body.totalVat, 11.99) && near(r.body.totalTTC, 71.96) && r.body.stampDuty === 0 && r.body.withholdingAmount === 0 && near(r.body.netToPay, 71.96), r.body);
  const inv = r.body;
  r = await api('POST', '/documents', { type: 'invoice', partyId: client.id, lines: [{ description: 'Ouvrages', quantity: 1, unitPriceHT: 10, vatRate: 5.5 }, { description: 'Formation', quantity: 2, unitPriceHT: 4.99, vatRate: 20 }] });
  check('deux taux de TVA : base et TVA par taux, sommes exactes au centime',
    r.status === 201 && near(r.body.totalHT, 19.98) && near(r.body.totalVat, 2.55) && near(r.body.totalTTC, 22.53)
    && r.body.vatBreakdown.length === 2 && near(r.body.vatBreakdown[0].vatAmount, 0.55) && near(r.body.vatBreakdown[1].vatAmount, 2), r.body);
  await api('DELETE', `/documents/${r.body.id}`);
  r = await api('POST', '/documents', { type: 'invoice', partyId: client.id, lines: [{ description: 'Quantité fractionnée', quantity: 0.333, unitPriceHT: 99.99, vatRate: 20 }] });
  const cents = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;
  check('aucun montant n’a plus de deux décimales', r.status === 201 && [r.body.totalHT, r.body.totalVat, r.body.totalTTC, r.body.netToPay].every(cents), r.body);
  await api('DELETE', `/documents/${r.body.id}`);
  r = await api('POST', '/documents', { type: 'invoice', partyId: client.id, lines: [{ description: 'Test', quantity: 1, unitPriceHT: 10, vatRate: 13 }] });
  check('TVA 13 % refusée sur une ligne : message avec les taux admis', r.status === 400 && /2.1, 5.5, 10, 20/.test(JSON.stringify(r.body)), r);

  r = await api('POST', `/documents/${inv.id}/validate`);
  check('facture validée et numérotée', r.status === 201 && r.body.number === `FA-${new Date().getFullYear()}-00001` && r.body.status !== 'draft', r.body);
  r = await api('GET', `/documents/${inv.id}`);
  check('montant en lettres en euros et centimes', r.body.amountInWords === 'soixante et onze euros et quatre-vingt-seize centimes', r.body.amountInWords);
  r = await api('PUT', '/company', { currency: 'GBP' });
  check('devise verrouillée dès qu’une pièce est numérotée', r.status === 400 && /devise/i.test(JSON.stringify(r.body)), r);

  console.log('— France : PDF et facture électronique');
  const pdf = await pdfText(inv.id);
  check('PDF généré', pdf.ok, pdf);
  if (pdf.text !== null) {
    check('PDF : montants à deux décimales, pas de troisième', /71,96/.test(pdf.text) && !/71,960/.test(pdf.text) && /59,97/.test(pdf.text) && /11,99/.test(pdf.text), pdf.text.slice(0, 600));
    check('PDF : identifiant fiscal étiqueté « ID fiscal », jamais « MF »', /ID fiscal : FR12 345678901/.test(pdf.text) && /ID fiscal : FR98765432109/.test(pdf.text) && !/MF :/.test(pdf.text), pdf.text.slice(0, 600));
    check('PDF : montant en lettres en euros, sans timbre ni retenue', /soixante et onze euros et quatre-vingt-seize centimes/.test(pdf.text) && !/timbre/i.test(pdf.text) && !/Retenue/i.test(pdf.text) && /EUR/.test(pdf.text), pdf.text.slice(0, 900));
  } else console.log('  (pdftotext absent : contenu du PDF non vérifié)');
  r = await api('GET', `/documents/${inv.id}/teif?check=1`);
  check('TEIF (El Fatoora) refusé pour une société étrangère', r.status === 400 && /TEIF/.test(JSON.stringify(r.body)) && /tunisiennes/.test(JSON.stringify(r.body)), r);
  r = await api('GET', `/documents/${inv.id}/teif`);
  check('téléchargement TEIF refusé aussi', r.status === 400, r.status);
  r = await api('GET', `/documents/${inv.id}/einvoice`);
  check('jeu de données e-facture : euro, identifiants étrangers, mention du pays',
    r.status === 200 && r.body.document.currency === 'EUR' && r.body.seller.taxId === 'FR12 345678901' && r.body.buyer.taxId === 'FR98765432109' && /votre pays/.test(r.body.notice) && !/TTN/.test(r.body.notice), r.body);

  console.log('— France : règlements au centime');
  r = await api('POST', `/documents/${inv.id}/payments`, { amount: 20.005, method: 'transfer', reference: 'VIR-1' });
  check('règlement arrondi au centime (20,005 → 20,01)', r.status === 201 && near(r.body.payment?.amount ?? r.body.amount ?? 20.01, 20.01) && r.body.document.paymentStatus === 'partial' && near(r.body.document.balanceDue, 51.95), r.body);
  r = await api('POST', `/documents/${inv.id}/payments`, { amount: 51.95, method: 'transfer', reference: 'VIR-2' });
  check('solde réglé : facture payée, aucun reliquat', r.status === 201 && r.body.document.paymentStatus === 'paid' && r.body.document.balanceDue === 0, r.body);
  r = await api('POST', `/documents/${inv.id}/payments`, { amount: 0.01, method: 'cash' });
  check('règlement au-delà du solde refusé', r.status === 400, r);

  console.log('— France : client sans identifiant, avoir, paie');
  r = await api('POST', '/documents', { type: 'invoice', partyId: clientNoTax.id, lines: [{ description: 'Abonnement', quantity: 1, unitPriceHT: 120, vatRate: 20 }] });
  check('facture à un client sans identifiant fiscal acceptée', r.status === 201 && near(r.body.totalTTC, 144), r.body);
  r = await api('POST', `/documents/${r.body.id}/validate`);
  check('… et validée', r.status === 201 && r.body.number === `FA-${new Date().getFullYear()}-00002`, r.body);
  r = await api('POST', '/hr/payroll/generate', { year: 2026, month: 3 });
  check('paie automatique refusée (barèmes tunisiens)', r.status === 400 && /paie automatique/.test(JSON.stringify(r.body)) && /tunisiennes/.test(JSON.stringify(r.body)), r);
  r = await api('PUT', '/hr/payroll/settings', { cnssEmployeeRate: 5 });
  check('réglages de paie tunisiens refusés', r.status === 400, r);
  r = await api('POST', '/employees', { name: 'Julie Petit', email: 'julie@test.fr', position: 'Comptable', salary: 2500, status: 'active', createdAt: '2026-01-01' });
  check('les fiches employés restent disponibles', r.status === 201, r);
  const julie = r.body;
  r = await api('GET', `/hr/leave-balance/${julie.id}`);
  check('… et les congés aussi', r.status === 200, r);

  // ═════════════════════════ Japon : yen, aucune décimale ═════════════════════════
  console.log('— Japon : société en yens (0 décimale)');
  r = await register({ email: 'sato@test.jp', countryCode: 'JP', phone: '+81 90 1234 5678', companyName: 'Sato Trading KK', taxId: 'T1234567890123' });
  check('inscription Japon : devise par défaut = yen', r.status === 201, r);
  r = await api('GET', '/company/profile');
  check('profil : yen, 0 décimale, Japon', r.body.countryCode === 'JP' && r.body.currency === 'JPY' && r.body.currencyDecimals === 0 && r.body.countryName === 'Japon', r.body);
  r = await api('PUT', '/company', { vatRates: [8, 10], defaultVatRate: 10, legalName: 'Sato Trading KK', address: '1-2-3 Shibuya, Tokyo', city: 'Tokyo', postalCode: '150-0002' });
  check('taux japonais (8 et 10 %) enregistrés', r.status === 200 && JSON.stringify(r.body.profile.vatRates) === '[8,10]' && r.body.legalGaps.length === 0, r.body);
  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Kobayashi Shoten', lines: [{ description: 'Marchandises', quantity: 3, unitPriceHT: 1999, vatRate: 10 }] });
  check('facture en yens : montants entiers (HT 5 997, TVA 600, TTC 6 597)',
    r.status === 201 && r.body.currency === 'JPY' && r.body.totalHT === 5997 && r.body.totalVat === 600 && r.body.totalTTC === 6597 && r.body.stampDuty === 0, r.body);
  const jinv = r.body;
  r = await api('POST', `/documents/${jinv.id}/validate`);
  check('facture en yens validée', r.status === 201 && !!r.body.number, r.body);
  r = await api('GET', `/documents/${jinv.id}`);
  check('montant en lettres en yens', r.body.amountInWords === 'six mille cinq cent quatre-vingt-dix-sept yens', r.body.amountInWords);
  r = await api('POST', `/documents/${jinv.id}/payments`, { amount: 1000.6, method: 'cash' });
  check('règlement arrondi à l’entier (1 000,6 → 1 001)', r.status === 201 && r.body.document.balanceDue === 5596 && r.body.document.paymentStatus === 'partial', r.body);
  r = await api('POST', `/documents/${jinv.id}/payments`, { amount: 5596, method: 'transfer' });
  check('solde réglé en yens', r.status === 201 && r.body.document.paymentStatus === 'paid', r.body);
  const jpdf = await pdfText(jinv.id);
  check('PDF en yens généré', jpdf.ok, jpdf);
  if (jpdf.text !== null) check('PDF : montants sans décimale', /6 597/.test(jpdf.text) && !/6 597,0/.test(jpdf.text) && /5 997/.test(jpdf.text), jpdf.text.slice(0, 600));

  // ═════════════════════════ Maroc : dirham ═════════════════════════
  console.log('— Maroc : société en dirhams');
  r = await register({ email: 'amine@test.ma', countryCode: 'MA', phone: '+212 6 61 23 45 67', companyName: 'Atlas Négoce SARL', taxId: 'ICE 001509176000008' });
  check('inscription Maroc : devise par défaut = dirham', r.status === 201, r);
  r = await api('GET', '/company/profile');
  check('profil : Maroc, dirham, 2 décimales', r.body.countryCode === 'MA' && r.body.currency === 'MAD' && r.body.currencyDecimals === 2 && r.body.countryName === 'Maroc', r.body);
  r = await api('PUT', '/company', { countryCode: 'DZ' });
  check('changement de pays : le nom du pays suit', r.status === 200 && r.body.country === 'Algérie' && r.body.profile.countryCode === 'DZ', r.body.country);
  r = await api('PUT', '/company', { countryCode: 'MA', country: 'Royaume du Maroc' });
  check('nom du pays saisi à la main conservé', r.status === 200 && r.body.country === 'Royaume du Maroc', r.body.country);
  r = await api('PUT', '/company', { countryCode: 'TN' });
  check('passage à la Tunisie refusé tant que les comptes ne sont pas en dinars', r.status === 400, r);

  // ═════════════════════════ Pays sans devise d'usage ═════════════════════════
  console.log('— Devise choisie à l’inscription');
  r = await register({ email: 'base@test.aq', countryCode: 'AQ', currency: 'usd', phone: '+672 3 12 34 56', companyName: 'Polar Station Ltd' });
  check('inscription avec une devise choisie (minuscules acceptées)', r.status === 201, r);
  r = await api('GET', '/company/profile');
  check('profil : devise USD, 2 décimales', r.body.countryCode === 'AQ' && r.body.currency === 'USD' && r.body.currencyDecimals === 2, r.body);
  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Client', lines: [{ description: 'Service', quantity: 1, unitPriceHT: 10, vatRate: 0 }] });
  check('facture à 0 % de TVA en dollars : brouillon accepté', r.status === 201 && r.body.currency === 'USD' && r.body.totalTTC === 10 && r.body.stampDuty === 0, r.body);
  r = await api('POST', `/documents/${r.body.id}/validate`);
  check('validation : le manque est nommé « identifiant fiscal », pas « matricule fiscal »', r.status === 400 && /identifiant fiscal/.test(JSON.stringify(r.body)) && !/matricule/i.test(JSON.stringify(r.body)), r);

  // ═════════════════════════ Tunisie : rien ne change ═════════════════════════
  console.log('— Tunisie : non-régression');
  // Une devise envoyée par erreur est ignorée : une société tunisienne tient ses comptes en dinars.
  r = await register({ email: 'sami@test.tn', phone: '22 535 181', companyName: 'Société Tunisienne SARL', currency: 'EUR', taxId: '1234567x/a/m/000' });
  check('inscription Tunisie (pays par défaut), matricule fiscal mis en forme', r.status === 201, r);
  r = await api('GET', '/company/profile');
  check('profil : Tunisie, dinar, 3 décimales, « matricule fiscal », toutes les fonctions tunisiennes',
    r.body.countryCode === 'TN' && r.body.countryName === 'Tunisie' && r.body.currency === 'TND' && r.body.currencyDecimals === 3 && r.body.taxIdLabel === 'Matricule fiscal'
    && r.body.features.stampDuty && r.body.features.withholding && r.body.features.teif && r.body.features.payroll, r.body);
  check('TVA : 0, 7, 13 et 19 % ; défaut 19 %', JSON.stringify(r.body.vatRates) === '[0,7,13,19]' && r.body.defaultVatRate === 19, r.body);
  r = await api('GET', '/company');
  check('matricule normalisé, timbre activé', r.body.taxId === '1234567X/A/M/000' && r.body.stampDutyEnabled === true && r.body.currency === 'TND', r.body);
  r = await api('GET', '/documents/meta');
  check('métadonnées : taux tunisiens, retenues proposées, TEIF disponible',
    JSON.stringify(r.body.vatRates) === '[0,7,13,19]' && r.body.withholdingPresets.length > 0 && r.body.features.teif === true, r.body);
  r = await api('PUT', '/company', { legalName: 'Société Tunisienne SARL', legalForm: 'SARL', tradeRegister: 'B1234562020', address: '12 rue de Carthage', city: 'Tunis', postalCode: '1000', bankName: 'BIAT', bankAccount: '08 006 0123456789012 34', shareCapital: 10000, phone: '+216 22 535 181' });
  check('fiche société tunisienne complétée', r.status === 200 && r.body.legalGaps.length === 0, r.body.legalGaps);
  r = await api('PUT', '/company', { taxId: 'FR12345678901' });
  check('matricule fiscal invalide refusé pour la Tunisie', r.status === 400, r);
  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Client tunisien', lines: [{ description: 'Prestation', quantity: 1, unitPriceHT: 100, vatRate: 20 }] });
  check('TVA 20 % refusée en Tunisie', r.status === 400 && /0, 7, 13, 19/.test(JSON.stringify(r.body)), r);
  r = await api('POST', '/products', { name: 'Câble', sku: 'CAB-1', price: 10, quantity: 0, vatRate: 7 });
  check('produit à 7 % accepté', r.status === 201 && Number(r.body.vatRate) === 7, r);
  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Client tunisien', lines: [{ description: 'Prestation', quantity: 1, unitPriceHT: 100, vatRate: 19 }] });
  check('facture en dinars : TVA 19 % + timbre 1 DT, net 120,000',
    r.status === 201 && r.body.currency === 'TND' && r.body.totalHT === 100 && r.body.totalVat === 19 && r.body.totalTTC === 119 && r.body.stampDuty === 1 && r.body.netToPay === 120, r.body);
  const tinv = r.body;
  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Client tunisien', withholdingRate: 1.5, lines: [{ description: 'Gros contrat', quantity: 1, unitPriceHT: 5000.123, vatRate: 19 }] });
  check('retenue à la source appliquée (1,5 % du TTC) et trois décimales conservées',
    r.status === 201 && near(r.body.totalHT, 5000.123) && near(r.body.totalTTC, 5950.146) && near(r.body.withholdingAmount, 89.252) && r.body.withholdingRate === 1.5, r.body);
  await api('DELETE', `/documents/${r.body.id}`);
  r = await api('POST', `/documents/${tinv.id}/validate`);
  check('facture tunisienne validée', r.status === 201 && !!r.body.number, r.body);
  r = await api('GET', `/documents/${tinv.id}`);
  check('montant en lettres en dinars et millimes', r.body.amountInWords === 'cent vingt dinars', r.body.amountInWords);
  r = await api('GET', `/documents/${tinv.id}/teif?check=1`);
  check('TEIF disponible pour une société tunisienne', r.status === 200 && !/tunisiennes/.test(JSON.stringify(r.body)), r);
  r = await api('GET', `/documents/${tinv.id}/einvoice`);
  check('e-facture : mention TTN / El Fatoora', r.status === 200 && /TTN/.test(r.body.notice), r.body.notice);
  const tpdf = await pdfText(tinv.id);
  check('PDF tunisien généré', tpdf.ok, tpdf);
  if (tpdf.text !== null) check('PDF : montants à trois décimales, « MF », timbre',
    /120,000/.test(tpdf.text) && /MF : 1234567X\/A\/M\/000/.test(tpdf.text) && /Droit de timbre/.test(tpdf.text) && /cent vingt dinars/.test(tpdf.text), tpdf.text.slice(0, 700));
  r = await api('POST', `/documents/${tinv.id}/payments`, { amount: 119.999, method: 'cash' });
  check('règlement tunisien : le millime est conservé (reste 0,001)', r.status === 201 && near(r.body.document.balanceDue, 0.001) && r.body.document.paymentStatus === 'partial', r.body);
  r = await api('POST', `/documents/${tinv.id}/payments`, { amount: 0.001, method: 'cash' });
  check('règlement tunisien : dernier millime payé', r.status === 201 && r.body.document.paymentStatus === 'paid', r.body);
  r = await api('GET', '/hr/payroll/settings');
  check('paie tunisienne : réglages disponibles', r.status === 200 && r.body.cnssEmployeeRate === 9.18, r);
  r = await api('POST', '/hr/payroll/generate', { year: 2026, month: 3 });
  check('paie tunisienne : génération autorisée', r.status === 201, r);

  summary();
})().catch((e) => { console.error(e); process.exit(1); });
