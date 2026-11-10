// Liens entre modules : caisse → comptabilité, Finances → comptabilité, commandes → documents, production → stock.
// Lancé par run.sh sur une base neuve.
const { api, check, setToken, summary } = require('./lib');
const near = (a, b, eps = 0.0006) => Math.abs(Number(a) - Number(b)) <= eps;
const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + '01';

(async () => {
  let r = await api('POST', '/auth/login', { email: 'owner@test.tn', password: 'Test#12345' });
  check('login', r.status === 200 || r.status === 201, r);
  setToken(r.body.access_token || r.body.token);
  r = await api('PUT', '/company', { legalName: 'Société Test SARL', legalForm: 'SARL', taxId: '1234567X/A/M/000', address: '12 rue de Carthage', city: 'Tunis', postalCode: '1000', defaultVatRate: 19 });
  check('fiche société', r.status === 200, r.body);
  const mk = async (body) => (await api('POST', '/products', body)).body;
  const tv = await mk({ name: 'Téléviseur', sku: 'TV', price: 119, quantity: 0, vatRate: 19 });
  const svc = await mk({ name: 'Installation', sku: 'INST', price: 50, quantity: 0, vatRate: 19, isStockable: false });
  const planche = await mk({ name: 'Planche', sku: 'PL', price: 5, quantity: 0, vatRate: 19 });
  const vis = await mk({ name: 'Vis', sku: 'VIS', price: 0.1, quantity: 0, vatRate: 19 });
  const table = await mk({ name: 'Table', sku: 'TAB', price: 80, quantity: 0, vatRate: 19 });
  check('produits créés', tv.id && svc.id && planche.id && vis.id && table.id, [tv, svc]);
  // Stock initial au coût : 10 TV à 70 HT, 100 planches à 2, 1 000 vis à 0,05
  for (const [p, q, c] of [[tv, 10, 70], [planche, 100, 2], [vis, 1000, 0.05]]) {
    r = await api('POST', '/stock/adjustments', { productId: p.id, quantity: q, reason: 'opening', unitCost: c });
    check(`stock initial ${p.name}`, r.status === 201, r.body);
  }
  const balance = async () => {
    const tb = (await api('GET', `/accounting/trial-balance?from=${monthStart}&to=${today}`)).body;
    return (code) => tb.accounts.find((a) => a.code === code) || { debit: 0, credit: 0 };
  };

  // ═════════════════════ 1. Caisse → comptabilité (rapport Z) ═════════════════════
  console.log('— Caisse → comptabilité');
  r = await api('POST', '/pos/sessions/open', { openingFloat: 100 });
  check('caisse ouverte', r.status === 201, r.body);
  r = await api('POST', '/pos/checkout', { mode: 'sale', lines: [{ productId: tv.id, quantity: 2 }], paymentMethod: 'cash' });
  check('vente espèces 2 TV (238 TTC)', r.status === 201 && near(r.body.total, 238), r.body);
  r = await api('POST', '/pos/checkout', { mode: 'sale', lines: [{ productId: svc.id, quantity: 1 }], paymentMethod: 'card' });
  check('vente carte service (50 TTC)', r.status === 201 && near(r.body.total, 50), r.body);
  r = await api('POST', '/pos/checkout', { mode: 'purchase', lines: [{ productId: planche.id, quantity: 10, unitPrice: 2.38 }], paymentMethod: 'cash' });
  check('achat espèces 10 planches (23,8 TTC)', r.status === 201 && near(r.body.total, 23.8), r.body);
  r = await api('GET', '/stock/movements?productId=' + planche.id);
  const lastIn = (r.body.items || r.body).find((m) => m.refType === 'pos_purchase');
  check('achat caisse entré en stock au coût HT (2,000)', !!lastIn && near(lastIn.unitCost, 2), lastIn);
  r = await api('POST', '/pos/sessions/close', { countedCash: 100 + 238 - 23.8 });
  check('clôture Z sans écart', r.status === 201 && near(r.body.variance, 0), r.body);
  const z = r.body;
  check('écriture de caisse rattachée au rapport Z', z.report && z.report.journalEntry && z.report.journalEntry.journal === 'CA' && /^CA-/.test(z.report.journalEntry.number), z.report && z.report.journalEntry);
  let acc = await balance();
  // Ventes : 238 TTC → 200 HT + 38 TVA (marchandises) ; 50 TTC → 42,017 HT + 7,983 TVA (service)
  check('531 caisse : +238 −23,8 ; 512 banque : +50', near(acc('531').debit, 238) && near(acc('531').credit, 23.8) && near(acc('512').debit, 50), [acc('531'), acc('512')]);
  check('701 ventes HT 200 ; 706 services HT 42,017', near(acc('701').credit, 200) && near(acc('706').credit, 42.017), [acc('701'), acc('706')]);
  check('4367 TVA collectée 45,983', near(acc('4367').credit, 45.983), acc('4367'));
  check('607 coût des ventes 140 (2 TV × 70) ; 370 : +20 achat, −140 sortie', near(acc('607').debit, 140) && near(acc('370').credit, 140) && near(acc('370').debit, 20), [acc('607'), acc('370')]);
  check('4366 TVA déductible achat caisse 3,8', near(acc('4366').debit, 3.8), acc('4366'));
  r = await api('GET', `/accounting/entries/${z.report.journalEntry.id}`);
  check('écriture CA équilibrée', r.status === 200 && near(r.body.totalDebit, r.body.totalCredit) && near(r.body.totalDebit, 238 + 50 + 140 + 20 + 3.8), [r.body.totalDebit, r.body.totalCredit]);

  // ═════════════════════ 2. Finances → comptabilité ═════════════════════
  console.log('— Finances → comptabilité');
  r = await api('POST', '/finance/expenses', { amount: 119, amountHT: 100, taxAmount: 19, taxRate: 19, category: 'Loyer', description: 'Loyer du local', date: today, paymentMethod: 'transfer', vendor: 'SCI Carthage' });
  check('dépense enregistrée avec son écriture', r.status === 201 && r.body.journalEntry && r.body.journalEntry.journal === 'BQ', r.body);
  const expense = r.body;
  acc = await balance();
  check('616 charge 100 ; 4366 TVA +19 ; 512 banque crédit 119', near(acc('616').debit, 100) && near(acc('4366').debit, 3.8 + 19) && near(acc('512').credit, 119), [acc('616'), acc('4366'), acc('512')]);
  r = await api('GET', `/finance/stats?year=${today.slice(0, 4)}`);
  check('synthèse Finances : dépenses, caisse clôturée, factures', r.status === 200 && near(r.body.totalExpenses, 119) && near(r.body.pos.sales, 288) && r.body.documents && typeof r.body.documents.receivables === 'number', r.body);
  r = await api('DELETE', `/finance/expenses/${expense.id}`);
  check('dépense supprimée', r.status === 200, r.body);
  acc = await balance();
  check('écriture contre-passée (616 soldé, banque rétablie)', near(acc('616').debit, 100) && near(acc('616').credit, 100) && near(acc('512').debit, 50 + 119), [acc('616'), acc('512')]);

  // ═════════════════════ 3. Commandes → documents ═════════════════════
  console.log('— Commandes → documents');
  const client = (await api('POST', '/clients', { name: 'Client Commande', email: 'cmd@test.tn', taxId: '7654321B/A/M/000' })).body;
  r = await api('POST', '/orders', { clientId: client.id, clientName: client.name, productId: tv.id, productName: tv.name, quantity: 2, unitPrice: 100 });
  check('commande créée', r.status === 201 && r.body.id, r.body);
  const order = r.body;
  r = await api('POST', `/orders/${order.id}/convert`, { type: 'invoice' });
  check('commande → facture brouillon', r.status === 201 && r.body.document && r.body.document.type === 'invoice' && !r.body.document.lockedAt, r.body);
  const doc = r.body.document;
  check('ligne reprise : 2 × 100 HT, TVA du produit, client lié', doc.lines.length === 1 && near(doc.lines[0].quantity, 2) && near(doc.lines[0].unitPriceHT, 100) && near(doc.lines[0].vatRate, 19) && doc.partyId === client.id && near(doc.totalTTC, 238), doc);
  check('commande liée au document et passée en traitement', r.body.order.documentId === doc.id && r.body.order.status === 'processing', r.body.order);
  r = await api('POST', `/orders/${order.id}/convert`, { type: 'delivery_note' });
  check('une commande ne donne qu’un document', r.status === 409, r.status);
  r = await api('POST', `/documents/${doc.id}/validate`);
  check('la facture issue de la commande se valide (stock −2 TV)', r.status === 201 && /^FA-/.test(r.body.number), r.body);
  r = await api('GET', `/products/${tv.id}`);
  check('stock TV : 10 − 2 (caisse) − 2 (facture) = 6', near(r.body.quantity, 6), r.body.quantity);

  // ═════════════════════ 4. Production → stock ═════════════════════
  console.log('— Production → stock');
  r = await api('POST', '/production/orders', { productName: 'Table', quantity: 5, productId: table.id, components: [{ productId: planche.id, quantity: 4 }, { productId: vis.id, quantity: 20 }], priority: 'normal' });
  check('ordre de production avec nomenclature', r.status === 201 && r.body.productId === table.id && r.body.components.length === 2, r.body);
  const po = r.body;
  r = await api('PATCH', `/production/orders/${po.id}/progress`, { progress: 40 });
  check('avancement 40 % : 2 tables produites', r.status === 200 && r.body.completedQuantity === 2 && near(r.body.stockedQuantity, 2), r.body);
  let tbl = (await api('GET', `/products/${table.id}`)).body, pl = (await api('GET', `/products/${planche.id}`)).body, vs = (await api('GET', `/products/${vis.id}`)).body;
  check('stock : +2 tables, −8 planches, −40 vis', near(tbl.quantity, 2) && near(pl.quantity, 110 - 8) && near(vs.quantity, 1000 - 40), [tbl.quantity, pl.quantity, vs.quantity]);
  r = await api('PATCH', `/production/orders/${po.id}/status`, { status: 'completed' });
  check('terminé : 5 tables au total', r.status === 200 && r.body.completedQuantity === 5 && near(r.body.stockedQuantity, 5), r.body);
  tbl = (await api('GET', `/products/${table.id}`)).body; pl = (await api('GET', `/products/${planche.id}`)).body; vs = (await api('GET', `/products/${vis.id}`)).body;
  check('stock final : 5 tables, 90 planches, 900 vis (pas de double comptage)', near(tbl.quantity, 5) && near(pl.quantity, 90) && near(vs.quantity, 900), [tbl.quantity, pl.quantity, vs.quantity]);
  r = await api('PATCH', `/production/orders/${po.id}/status`, { status: 'completed' });
  check('re-clôture sans nouveau mouvement', r.status === 200 && near((await api('GET', `/products/${table.id}`)).body.quantity, 5), r.body);
  r = await api('POST', '/production/orders', { productName: 'Chaise', quantity: 1000, productId: table.id, components: [{ productId: planche.id, quantity: 4 }] });
  r = await api('PATCH', `/production/orders/${r.body.id}/status`, { status: 'completed' });
  check('composants insuffisants : refus explicite', r.status === 400 && /insuffisant/i.test(r.body.message || ''), r.body);
  r = await api('GET', `/stock/movements?productId=${table.id}`);
  const prodMoves = (r.body.items || r.body).filter((m) => m.refType === 'production_order');
  check('mouvements de production tracés', prodMoves.length === 2 && prodMoves.every((m) => m.reason === 'production'), prodMoves);

  summary();
})().catch((e) => { console.error(e); process.exit(2); });
