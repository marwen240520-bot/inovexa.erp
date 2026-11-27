// Tests de bout en bout : validation des formulaires de l'API (clients, RH, commandes, ventes, produits, fournisseurs,
// Finance, profil) et erreurs de saisie qui ne doivent plus produire de 500.
// Règles vérifiées : un envoi vide ou incohérent répond 400 avec un message français (jamais 201 ni 500) ; les nombres saisis
// en texte (« 12,5 ») sont acceptés ; une dépense à 3 décimales est enregistrée ; les identifiants et dates absurdes répondent 400.
const { api, check, setToken, summary } = require('./lib');
const today = new Date().toISOString().slice(0, 10);
const msg = (r) => [].concat(r.body && r.body.message ? r.body.message : []).join(' | ');
const bad = (name, r, part) => check(name, r.status === 400 && (!part || msg(r).toLowerCase().includes(part.toLowerCase())), { status: r.status, body: r.body });

(async () => {
  let r = await api('POST', '/auth/login', { email: 'owner@test.tn', password: 'Test#12345' });
  check('connexion', r.status === 200 || r.status === 201, r);
  setToken(r.body.access_token || r.body.token);

  // ───────────── Clients ─────────────
  console.log('— Clients');
  bad('client : corps vide refusé', await api('POST', '/clients', {}), 'nom');
  bad('client : nom d’espaces refusé', await api('POST', '/clients', { name: '   ', email: 'a@b.tn' }), 'nom');
  bad('client : email invalide refusé', await api('POST', '/clients', { name: 'X', email: 'pas-un-email' }), 'email');
  bad('client : total dépensé illisible refusé', await api('POST', '/clients', { name: 'X', totalSpent: 'abc' }), 'total');
  bad('client : statut inconnu refusé', await api('POST', '/clients', { name: 'X', status: 'banana' }), 'statut');
  r = await api('POST', '/clients', { name: '  Client de passage  ', phone: '22000000' });
  check('client sans email (client de passage) accepté, nom nettoyé', r.status === 201 && r.body.name === 'Client de passage' && r.body.email === '', r);
  const cl = r.body;
  r = await api('POST', '/clients', { name: 'Client Texte', email: 'w@x.tn', totalSpent: '1 200,5 DT', paymentTermsDays: '30' });
  check('client : nombres saisis en texte acceptés', r.status === 201 && Number(r.body.totalSpent) === 1200.5 && r.body.paymentTermsDays === 30, r);
  bad('client : modification avec nom vide refusée', await api('PUT', `/clients/${cl.id}`, { name: '' }), 'nom');
  r = await api('PUT', `/clients/${cl.id}`, { phone: '99999999' });
  check('client : modification partielle conserve le nom', r.status === 200 && r.body.name === 'Client de passage' && r.body.phone === '99999999', r);
  r = await api('PATCH', `/clients/${cl.id}/status`, { status: 'inactive' });
  check('client : statut inactif', r.status === 200 && r.body.status === 'inactive', r);
  bad('client : statut inconnu refusé (PATCH)', await api('PATCH', `/clients/${cl.id}/status`, { status: 'x' }), 'statut');
  bad('client : identifiant « abc » → 400', await api('GET', '/clients/abc'));
  check('client : identifiant inconnu → 404', (await api('GET', '/clients/999999')).status === 404);

  // ───────────── Employés et départements ─────────────
  console.log('— RH');
  bad('employé : corps vide refusé', await api('POST', '/employees', {}), 'nom');
  bad('employé : salaire négatif refusé', await api('POST', '/employees', { name: 'E', salary: -5 }), 'salaire');
  bad('employé : date d’embauche illisible refusée', await api('POST', '/employees', { name: 'E', hireDate: 'zzz' }), 'embauche');
  bad('employé : statut inconnu refusé', await api('POST', '/employees', { name: 'E', status: 'banana' }), 'statut');
  r = await api('POST', '/employees', { name: 'Emna Test', email: 'emna@test.tn', position: 'Comptable', salary: '1 200,50', hireDate: '2026-01-15', status: 'active', headOfFamily: 'true', childrenCount: '2', createdAt: '2026-01-15' });
  check('employé valide (salaire en texte, booléen en texte)', r.status === 201 && Number(r.body.salary) === 1200.5 && r.body.headOfFamily === true && r.body.childrenCount === 2, r);
  const emp = r.body;
  r = await api('PATCH', `/employees/${emp.id}/status`, { status: 'leave' });
  check('employé : statut « leave »', r.status === 200 && r.body.status === 'leave', r);
  bad('employé : statut inconnu refusé (PATCH)', await api('PATCH', `/employees/${emp.id}/status`, { status: 'x' }), 'statut');
  r = await api('PUT', `/employees/${emp.id}`, { ...emp, status: 'active' });
  check('employé : la fiche complète renvoyée par la liste est acceptée (PUT de repli)', r.status === 200 && r.body.status === 'active', r);
  bad('département : nom obligatoire', await api('POST', '/departments', {}), 'département');
  r = await api('POST', '/departments', { name: 'Ventes', description: 'Équipe commerciale' });
  check('département créé', r.status === 201 && r.body.name === 'Ventes', r);

  // ───────────── Produits ─────────────
  console.log('— Produits');
  bad('produit : corps vide refusé', await api('POST', '/products', {}), 'nom');
  bad('produit : prix illisible refusé (au lieu de 0 en silence)', await api('POST', '/products', { name: 'P', price: 'abc' }), 'prix');
  bad('produit : prix négatif refusé', await api('POST', '/products', { name: 'P', price: -1 }), 'prix');
  r = await api('POST', '/products', { name: 'Câble réseau', sku: 'CAB-9', price: '1 200,50 €', quantity: '5' });
  check('produit : prix et stock saisis en texte acceptés', r.status === 201 && Number(r.body.price) === 1200.5 && Number(r.body.quantity) === 5, r);
  const prod = r.body;
  r = await api('POST', '/products', { name: 'Maintenance', sku: 'SRV-1', price: 80, quantity: 0, isStockable: false });
  const service = r.body;
  check('service (non stockable) créé', r.status === 201 && service.isStockable === false, r);
  r = await api('PUT', `/products/${prod.id}`, { name: 'Câble réseau Cat6', sku: 'CAB-9', price: 15, categoryId: null, imageUrl: null });
  check('produit : modification comme le site (categoryId et image null)', r.status === 200 && r.body.name === 'Câble réseau Cat6', r);
  bad('produit : identifiant « abc » → 400', await api('PUT', '/products/abc', { name: 'x' }));

  // ───────────── Fournisseurs ─────────────
  console.log('— Fournisseurs');
  bad('fournisseur : corps vide refusé', await api('POST', '/suppliers', {}), 'nom');
  r = await api('POST', '/suppliers', { name: 'Fournisseur Test', email: 'f@test.tn', phone: '23000000', status: 'active' });
  check('fournisseur créé', r.status === 201 && r.body.name === 'Fournisseur Test', r);
  const sup = r.body;
  r = await api('PATCH', `/suppliers/${sup.id}/status`, { status: 'inactive' });
  check('fournisseur : route PATCH /status (elle n’existait pas)', r.status === 200 && r.body.status === 'inactive', r);
  bad('fournisseur : statut inconnu refusé', await api('PATCH', `/suppliers/${sup.id}/status`, { status: 'x' }), 'statut');

  // ───────────── Commandes ─────────────
  console.log('— Commandes');
  bad('commande : corps vide refusé', await api('POST', '/orders', {}), 'client');
  bad('commande : quantité décimale refusée (colonne entière)', await api('POST', '/orders', { clientName: 'C', productName: 'P', quantity: 1.5 }), 'quantité');
  r = await api('POST', '/orders', { clientName: 'Client Commande', productName: 'Câble', quantity: 2, unitPrice: '10,5', status: 'pending' });
  check('commande : prix en texte accepté, total recalculé', r.status === 201 && Number(r.body.total) === 21, r);
  const ord = r.body;
  bad('commande : statut inconnu refusé', await api('PATCH', `/orders/${ord.id}/status`, { status: 'x' }), 'statut');
  r = await api('PUT', `/orders/${ord.id}`, { ...ord, status: 'processing' });
  check('commande : la fiche complète renvoyée par la liste est acceptée (PUT de repli)', r.status === 200 && r.body.status === 'processing', r);
  r = await api('GET', '/orders/stats');
  check('commandes : le total est un nombre (et non une concaténation de textes)', r.status === 200 && typeof r.body.totalAmount === 'number' && r.body.totalAmount === 21, r);
  bad('commande : type de document inconnu refusé', await api('POST', `/orders/${ord.id}/convert`, { type: 'banana' }), 'document');

  // ───────────── Ventes ─────────────
  console.log('— Ventes');
  bad('vente : sans produit refusée (elle prenait le premier produit du compte)', await api('POST', '/sales', { quantity: 1, unitPrice: 10 }), 'produit');
  bad('vente : quantité nulle refusée', await api('POST', '/sales', { productId: prod.id, quantity: 0, unitPrice: 10 }), 'quantité');
  bad('vente : statut inconnu refusé', await api('POST', '/sales', { productId: prod.id, quantity: 1, status: 'banana' }), 'statut');
  r = await api('POST', '/sales', { productId: prod.id, quantity: '2', unitPrice: '15,5', clientName: 'Client Vente', status: 'paid' });
  check('vente valide : stock 5 → 3', r.status === 201 && Number(r.body.total) === 31 && Number(r.body.newStock) === 3, r);
  r = await api('POST', '/sales', { productId: service.id, quantity: 10, unitPrice: 80, status: 'completed' });
  check('vente d’un service : aucun stock requis', r.status === 201, r);
  r = await api('POST', '/sales', { productId: prod.id, quantity: 100, unitPrice: 15 });
  check('vente : stock insuffisant → 400', r.status === 400 && /stock/i.test(msg(r)), r);
  r = await api('GET', '/sales/stats');
  check('ventes : total numérique, vente « completed » comptée payée', r.status === 200 && typeof r.body.totalAmount === 'number' && r.body.totalAmount === 831 && r.body.paid === 2, r);

  // ───────────── Finance ─────────────
  console.log('— Finance');
  bad('dépense : corps vide refusé', await api('POST', '/finance/expenses', {}), 'montant');
  bad('dépense : sans catégorie refusée', await api('POST', '/finance/expenses', { amount: 10 }), 'catégorie');
  bad('dépense : TVA supérieure au montant refusée', await api('POST', '/finance/expenses', { amount: 100, taxAmount: 150, category: 'Loyer' }), 'tva');
  r = await api('POST', '/finance/expenses', { amount: 119.5, amountHT: 100.42, taxAmount: 19.08, taxRate: 19, category: 'Loyer', date: today, paymentMethod: 'transfer', vendor: 'SCI Carthage' });
  check('dépense à 3 chiffres décimaux enregistrée (HT / TVA étaient des entiers)', r.status === 201 && Number(r.body.amountHT) === 100.42 && Number(r.body.taxAmount) === 19.08, r);
  r = await api('POST', '/finance/expenses', { amount: '119,000', category: 'Fournitures' });
  check('dépense minimale : HT, TVA et date déduits', r.status === 201 && Number(r.body.amountHT) === 119 && Number(r.body.taxAmount) === 0 && !!r.body.date, r);
  r = await api('GET', '/finance/expenses?year=abc');
  bad('dépenses : année « abc » → 400', r, 'année');
  r = await api('GET', '/finance/expenses');
  check('dépenses : liste avec montants numériques', r.status === 200 && r.body.length === 2 && typeof r.body[0].amountHT === 'number', r);
  r = await api('GET', '/finance/budgets');
  check('budgets : sans année → année en cours (c’était un 500)', r.status === 200 && Array.isArray(r.body), r);
  bad('budgets : année « abc » → 400', await api('GET', '/finance/budgets?year=abc'), 'année');
  bad('budget : montant illisible refusé', await api('POST', '/finance/budgets', { category: 'revenue', amount: 'x', year: 2026 }), 'montant');
  r = await api('POST', '/finance/budgets', { category: 'revenue', amount: '1000', year: 2026 });
  check('budget créé', r.status === 201 && Number(r.body.amount) === 1000, r);
  const bud = r.body;
  r = await api('POST', '/finance/budgets', { category: 'revenue', amount: 2000, year: 2026 });
  check('budget : même catégorie et année → mise à jour (pas de doublon)', (r.status === 201 || r.status === 200) && r.body.id === bud.id && r.body.amount === 2000, r);
  r = await api('GET', '/finance/budgets?year=2026');
  check('budgets : un seul budget, montant numérique', r.status === 200 && r.body.length === 1 && r.body[0].amount === 2000, r);
  r = await api('DELETE', `/finance/budgets/${bud.id}`);
  check('budget supprimé', r.status === 200 && r.body.success === true, r);
  bad('compte : nom obligatoire', await api('POST', '/finance/accounts', {}), 'nom');
  bad('compte : type inconnu refusé', await api('POST', '/finance/accounts', { name: 'X', type: 'banana' }), 'type');
  r = await api('POST', '/finance/accounts', { name: 'Caisse', type: 'cash', balance: '250,5' });
  check('compte créé, solde numérique', r.status === 201 && r.body.balance === 250.5, r);
  const acc = r.body;
  for (const month of [0, 1, 3, 5]) {
    r = await api('GET', `/finance/stats?year=2026&month=${month}`);
    check(`synthèse : mois ${month + 1} (dernier jour réel)`, r.status === 200 && r.body.totalCash === 250.5, r);
  }
  r = await api('GET', '/finance/stats');
  check('synthèse : sans année → année en cours (c’était un 500)', r.status === 200, r);
  bad('synthèse : mois 99 → 400', await api('GET', '/finance/stats?year=2026&month=99'), 'mois');
  r = await api('DELETE', `/finance/accounts/${acc.id}`);
  check('compte supprimé', r.status === 200, r);

  // ───────────── Profil ─────────────
  console.log('— Profil');
  bad('profil : nom qui n’est pas du texte refusé (« [object Object] »)', await api('PATCH', '/users/profile', { name: { a: 1 } }), 'nom');
  bad('profil : société de 5 000 caractères refusée', await api('PATCH', '/users/profile', { companyName: 'x'.repeat(5000) }), 'société');
  r = await api('PATCH', '/users/profile', { name: '  Nouveau Nom  ', phone: '22111222' });
  check('profil : mise à jour', r.status === 200 && r.body.name === 'Nouveau Nom', r);

  // ───────────── Saisies absurdes : 400 et non 500 ─────────────
  console.log('— Lectures avec saisies absurdes');
  const GARB = 'from=zzz&to=zzz&page=-1&limit=999999&year=abc&month=99&q=%27%22%3C&sort=;drop&status=%00&days=-5&period=xx';
  for (const p of ['/sales/abc', '/purchases/abc', '/employees/abc', '/invoices/abc', '/orders/abc', '/categories/abc', '/clients/abc', '/products/abc', '/suppliers/abc',
    '/hr/leave-requests', '/finance/expenses', '/finance/budgets', '/finance/stats', '/accounting/bank/lines', '/stock/movements', '/stock/card/abc', '/stock/rotation',
    '/documents/payments', '/documents', '/audit']) {
    const q = p.includes('abc') ? p : `${p}?${GARB}`;
    const res = await api('GET', q);
    check(`GET ${p}${p.includes('abc') ? '' : ' (paramètres absurdes)'} : pas de 500`, res.status < 500, { status: res.status, body: res.body });
  }
  r = await api('GET', '/stock/movements?from=zzz');
  check('date illisible dans un filtre → 400 lisible', r.status === 400 && /date|valeur/i.test(msg(r)), r);

  // ───────────── Contact : l'envoi d'emails n'est pas configuré sur cette installation ─────────────
  console.log('— Contact sans SMTP');
  setToken(null);
  r = await api('POST', '/public/contact', { firstName: 'Ali', lastName: 'Ben', company: 'ACME', email: 'ali@acme.tn', message: 'Bonjour' });
  check('contact : 503 quand les emails ne sont pas configurés (le site propose alors sa messagerie)', r.status === 503, r);
  bad('contact : email invalide → 400', await api('POST', '/public/contact', { firstName: 'Ali', lastName: 'Ben', company: 'ACME', email: 'x' }), 'email');
  summary();
})().catch((e) => { console.error(e); process.exit(1); });
