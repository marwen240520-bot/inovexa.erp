// Tests de bout en bout : RH/paie, CRM, notifications, caisse (rapport Z), rapports de gestion.
// Lancer après restart.sh (base neuve). Indépendant de docs.test.js.
const { api, check, setToken, summary } = require('./lib');
const near = (a, b, eps = 0.0006) => Math.abs(Number(a) - Number(b)) <= eps;
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const today = iso(new Date());

(async () => {
  console.log('— Connexion et société');
  let r = await api('POST', '/auth/login', { email: 'owner@test.tn', password: 'Test#12345' });
  check('login', r.status === 200 || r.status === 201, r);
  setToken(r.body.access_token || r.body.token);
  r = await api('PUT', '/company', { legalName: 'Société Test SARL', legalForm: 'SARL', taxId: '1234567X/A/M/000', tradeRegister: 'B1234562020', address: '12 rue de Carthage', city: 'Tunis', postalCode: '1000', bankName: 'BIAT', bankAccount: '08 006 0123456789012 34', shareCapital: 10000, phone: '71000000', email: 'contact@test.tn' });
  check('fiche société', r.status === 200, r);

  // ═════════════════════════ RH : congés ═════════════════════════
  console.log('— RH : congés');
  const ali = (await api('POST', '/employees', { name: 'Ali Ben Salah', email: 'ali@test.tn', position: 'Comptable', salary: 2000, status: 'active', headOfFamily: true, childrenCount: 2, leaveBalanceStart: 2, createdAt: '2026-01-01' })).body;
  const sami = (await api('POST', '/employees', { name: 'Sami Trabelsi', email: 'sami@test.tn', position: 'Vendeur', salary: 1500, status: 'active', createdAt: '2026-01-01' })).body;
  check('employés créés', ali.id && sami.id, [ali, sami]);

  const now = new Date();
  let months = (now.getUTCFullYear() - 2026) * 12 + now.getUTCMonth();
  if (now.getUTCDate() < 1) months -= 1;
  let b = (await api('GET', `/hr/leave-balance/${ali.id}`)).body;
  check('solde de départ + acquisition mensuelle', near(b.accrued, 2 + months) && b.taken === 0 && near(b.available, 2 + months), [b, months]);

  // Prochain lundi → vendredi (5 jours ouvrés), dans l'année pour rester dans le solde
  const next = new Date(); next.setUTCDate(next.getUTCDate() + ((8 - (next.getUTCDay() || 7)) % 7 || 7));
  const monday = iso(next); const friday = addDays(0) && iso(new Date(next.getTime() + 4 * 86400000));
  r = await api('POST', '/hr/leave-requests', { employeeId: ali.id, kind: 'paid', startDate: monday, endDate: friday });
  check('demande de congé payé : 5 jours ouvrés décomptés', r.status === 201 && r.body.days === 5 && r.body.status === 'pending', r);
  const leave1 = r.body;
  b = (await api('GET', `/hr/leave-balance/${ali.id}`)).body;
  check('solde disponible réduit par la demande en attente', near(b.pending, 5) && near(b.available, 2 + months - 5), b);

  r = await api('POST', '/hr/leave-requests', { employeeId: ali.id, kind: 'paid', startDate: monday, endDate: monday });
  check('chevauchement refusé (409)', r.status === 409, r);
  r = await api('POST', '/hr/leave-requests', { employeeId: ali.id, kind: 'paid', startDate: addDays(60), endDate: addDays(200) });
  check('solde insuffisant refusé', r.status === 400 && /insuffisant/i.test(JSON.stringify(r.body)), r);
  r = await api('POST', '/hr/leave-requests', { employeeId: ali.id, kind: 'paid', startDate: '2027-02-06', endDate: '2027-02-07' });
  check('week-end seul : aucun jour ouvré', r.status === 400, r);

  r = await api('POST', `/hr/leave-requests/${leave1.id}/approve`);
  check('approbation', r.status === 201 && r.body.status === 'approved', r);
  r = await api('POST', `/hr/leave-requests/${leave1.id}/reject`);
  check('on ne peut plus refuser une demande approuvée', r.status === 400, r);
  b = (await api('GET', `/hr/leave-balance/${ali.id}`)).body;
  check('solde : 5 jours pris', near(b.taken, 5) && near(b.balance, 2 + months - 5), b);
  r = await api('POST', `/hr/leave-requests/${leave1.id}/cancel`);
  check('annulation d’un congé approuvé rend les jours', r.status === 201 && near((await api('GET', `/hr/leave-balance/${ali.id}`)).body.balance, 2 + months), r);

  // Congé sans solde en mars 2026 (lundi 2 → mardi 3) : 2 jours déduits du salaire de Sami
  r = await api('POST', '/hr/leave-requests', { employeeId: sami.id, kind: 'unpaid', startDate: '2026-03-02', endDate: '2026-03-03' });
  check('congé sans solde demandé', r.status === 201 && r.body.days === 2, r);
  r = await api('POST', `/hr/leave-requests/${r.body.id}/approve`);
  check('congé sans solde approuvé', r.status === 201, r);

  // ═════════════════════════ RH : paie ═════════════════════════
  console.log('— RH : paie');
  r = await api('GET', '/hr/payroll/settings');
  check('paramètres de paie présents, non validés', r.status === 200 && r.body.cnssEmployeeRate === 9.18 && r.body.validated === false, r);
  r = await api('PUT', '/hr/payroll/settings', { brackets: [{ upTo: 100, rate: 10 }, { upTo: 50, rate: 20 }, { upTo: null, rate: 30 }] });
  check('barème non croissant refusé', r.status === 400, r);
  r = await api('PUT', '/hr/payroll/settings', { cnssEmployeeRate: 150 });
  check('taux hors bornes refusé', r.status === 400, r);

  r = await api('POST', '/hr/payroll/generate', { year: 2026, month: 3 });
  check('génération mars 2026 : 2 bulletins brouillons + avertissement', r.status === 201 && r.body.created === 2 && /expert-comptable/.test(r.body.notice || ''), r);
  r = await api('POST', '/hr/payroll/generate', { year: 2026, month: 3 });
  check('régénération = mise à jour, pas de doublon', r.body.created === 0 && r.body.updated === 2, r.body);
  let pay = (await api('GET', '/hr/payroll?year=2026&month=3')).body;
  const pAli = pay.items.find((p) => p.employeeId === ali.id);
  const pSami = pay.items.find((p) => p.employeeId === sami.id);
  check('bulletin Ali : CNSS 183,600', near(pAli.employeeCnss, 183.6), pAli);
  check('bulletin Ali : IRPP mensuel 256,183 (barème LF 2025) et CSS 8,040 (0,5 %)', near(pAli.incomeTax, 256.183) && near(pAli.solidarityContribution, 8.04), pAli);
  check('bulletin Ali : net 1 552,177', near(pAli.netSalary, 1552.177), pAli);
  check('bulletin Ali : charges patronales 341,400', near(pAli.employerCnss, 341.4) && near(pAli.employerCost, 2341.4), pAli);
  check('absence déduite chez Sami (2/22 de 1 500)', near(pSami.grossSalary, 1500 - (1500 * 2) / 22, 0.002) && near(pSami.details.absenceDeduction, 136.364, 0.002), pSami);

  r = await api('PUT', `/hr/payroll/${pAli.id}`, { bonuses: 100 });
  check('prime ajoutée au brouillon, recalcul', r.status === 200 && near(r.body.bonuses, 100) && r.body.netSalary > pAli.netSalary, r.body);
  r = await api('PUT', `/hr/payroll/${pAli.id}`, { bonuses: 0 });
  check('retour à 0 prime', near(r.body.netSalary, 1552.177), r.body);

  r = await api('POST', `/hr/payroll/${pAli.id}/pay`, { method: 'transfer' });
  check('paiement avant validation refusé', r.status === 400, r);
  r = await api('POST', `/hr/payroll/${pAli.id}/validate`);
  check('validation du bulletin', r.status === 201 && r.body.status === 'validated', r);
  r = await api('PUT', `/hr/payroll/${pAli.id}`, { bonuses: 50 });
  check('bulletin validé non modifiable (409)', r.status === 409, r);
  r = await api('DELETE', `/hr/payroll/${pAli.id}`);
  check('bulletin validé non supprimable', r.status >= 400, r);
  r = await api('POST', '/hr/payroll/generate', { year: 2026, month: 3 });
  check('régénération saute le bulletin validé', r.body.skipped === 1 && r.body.updated === 1, r.body);

  let tb = (await api('GET', `/accounting/trial-balance?from=2026-03-01&to=2026-03-31`)).body;
  const acc = (code) => tb.accounts.find((a) => a.code === code) || { debit: 0, credit: 0 };
  check('écriture de paie : 641 débit 2 000, 645 débit 341,400', near(acc('641').debit, 2000) && near(acc('645').debit, 341.4), tb.accounts.map((a) => [a.code, a.debit, a.credit]));
  check('écriture de paie : 421 crédit net, 431 crédit CNSS, 4369 crédit impôts', near(acc('421').credit, 1552.177) && near(acc('431').credit, 525) && near(acc('4369').credit, 264.223), tb.accounts.map((a) => [a.code, a.debit, a.credit]));
  check('balance équilibrée après la paie', near(tb.totals.debit, tb.totals.credit), tb.totals);

  r = await api('POST', `/hr/payroll/${pAli.id}/pay`, { method: 'transfer', date: '2026-03-31' });
  check('paiement par virement', r.status === 201 && r.body.status === 'paid', r);
  r = await api('POST', `/hr/payroll/${pAli.id}/pay`, { method: 'transfer' });
  check('double paiement refusé', r.status === 400, r);
  tb = (await api('GET', `/accounting/trial-balance?from=2026-03-01&to=2026-03-31`)).body;
  check('421 soldé après paiement', near(acc('421').debit, 1552.177) && near(acc('512').credit, 1552.177), tb.accounts.map((a) => [a.code, a.debit, a.credit]));
  check('balance toujours équilibrée', near(tb.totals.debit, tb.totals.credit), tb.totals);

  const pdf = await api('GET', `/hr/payroll/${pAli.id}/pdf`, null, true);
  const pdfBuf = Buffer.from(await pdf.arrayBuffer());
  check('bulletin PDF', pdf.status === 200 && /pdf/.test(pdf.headers.get('content-type')) && pdfBuf.slice(0, 4).toString() === '%PDF', pdf.status);

  // ═════════════════════════ Données commerciales ═════════════════════════
  console.log('— Données commerciales');
  const mk = async (body) => (await api('POST', '/products', body)).body;
  const pa = await mk({ name: 'Imprimante', sku: 'ERP-A', price: 10, quantity: 0, vatRate: 19, minStock: 5 });
  const pb = await mk({ name: 'Cartouche', sku: 'ERP-B', price: 20, quantity: 0, vatRate: 19 });
  const ps = await mk({ name: 'Maintenance', sku: 'ERP-S', price: 100, quantity: 0, vatRate: 19, isStockable: false });
  check('produits créés', pa.id && pb.id && ps.id, [pa, pb, ps]);
  const cust = (await api('POST', '/clients', { name: 'Client Gros', email: 'gros@client.tn', phone: '22111111', address: '1 rue du Lac', taxId: '1000000A' })).body;
  const cust2 = (await api('POST', '/clients', { name: 'Client Détail', email: 'det@client.tn', phone: '22222222', address: '2 rue du Lac', taxId: '2000000B' })).body;
  const supplier = (await api('POST', '/suppliers', { name: 'Fournisseur Z', email: 'z@fourn.tn', phone: '23111111', address: 'Zone ind.', taxId: '3000000C' })).body;

  // ═════════════════════════ CRM ═════════════════════════
  console.log('— CRM');
  r = await api('POST', '/crm/price-lists', { name: 'Revendeur' });
  check('liste de prix créée', r.status === 201, r);
  const list = r.body;
  r = await api('PUT', `/crm/price-lists/${list.id}/items`, { items: [{ productId: pa.id, price: 8 }] });
  check('prix de liste enregistré', r.status === 200 && r.body.length === 1 && Number(r.body[0].price) === 8, r);
  r = await api('PUT', `/crm/price-lists/${list.id}/items`, { items: [{ productId: pa.id, price: 8 }, { productId: pa.id, price: 7 }] });
  check('produit en double refusé', r.status === 400, r);
  r = await api('PUT', `/crm/clients/${cust.id}/conditions`, { priceListId: list.id, paymentTermsDays: 30, creditLimit: 5000, discountPct: 10 });
  check('conditions client (liste, délai, plafond, remise)', r.status === 200 && r.body.priceListId === list.id && r.body.paymentTermsDays === 30, r);
  r = await api('PUT', `/crm/clients/${cust.id}/conditions`, { taxId: 'zz' });
  check('matricule fiscal invalide refusé', r.status === 400, r);

  r = await api('POST', '/documents', { type: 'quote', partyId: cust.id, validUntil: addDays(2), lines: [{ productId: pa.id, quantity: 10 }, { productId: pb.id, quantity: 1 }] });
  check('devis : prix de liste appliqué (8) et remise client (10 %)', r.status === 201 && near(r.body.lines[0].unitPriceHT, 8) && near(r.body.lines[0].discountPct, 10) && near(r.body.lines[1].unitPriceHT, 20), r.body.lines);
  const quote = r.body;
  r = await api('POST', '/documents', { type: 'quote', partyId: cust2.id, lines: [{ productId: pa.id, quantity: 1 }] });
  check('autre client : prix catalogue (10)', near(r.body.lines[0].unitPriceHT, 10) && r.body.lines[0].discountPct === 0, r.body.lines);
  await api('DELETE', `/documents/${r.body.id}`);

  r = await api('POST', '/crm/interactions', { partyType: 'client', partyId: cust.id, kind: 'call', subject: 'Appel de relance', content: 'Rappeler jeudi', followUpDate: addDays(1) });
  check('interaction enregistrée', r.status === 201, r);
  const inter = r.body;
  r = await api('GET', '/crm/follow-ups?days=7');
  check('relance à venir listée', r.status === 200 && JSON.stringify(r.body).includes('Appel de relance'), r);
  r = await api('GET', `/crm/clients/${cust.id}/overview`);
  check('fiche 360° disponible', r.status === 200 && r.body.kpis !== undefined, r.body);
  r = await api('DELETE', `/crm/interactions/${inter.id}`);
  check('interaction supprimée', r.status === 200, r);

  // ═════════════════════════ Stock + ventes pour les rapports ═════════════════════════
  console.log('— Achats, ventes et avoir');
  // Facture ancienne d’abord (chronologie), service seul → impayée et en retard
  r = await api('POST', '/documents', { type: 'invoice', partyId: cust2.id, issueDate: addDays(-45), dueDate: addDays(-15), lines: [{ productId: ps.id, quantity: 1, unitPriceHT: 100 }] });
  check('facture ancienne créée', r.status === 201, r);
  const oldInv = (await api('POST', `/documents/${r.body.id}/validate`)).body;
  check('facture ancienne validée', oldInv.number && oldInv.status === 'validated', oldInv);

  r = await api('POST', '/documents', { type: 'purchase_order', partyId: supplier.id, lines: [{ productId: pa.id, quantity: 100, unitPriceHT: 4 }, { productId: pb.id, quantity: 3, unitPriceHT: 12 }] });
  const po = (await api('POST', `/documents/${r.body.id}/validate`)).body;
  const gr = (await api('POST', `/documents/${po.id}/convert`, { to: 'goods_receipt' })).body;
  r = await api('POST', `/documents/${gr.id}/validate`);
  check('réception validée (stock Imprimante 100 à 4, Cartouche 3 à 12)', r.status === 201 && r.body.status === 'received', r.body);

  r = await api('POST', '/documents', { type: 'invoice', partyId: cust2.id, issueDate: today, lines: [{ productId: pa.id, quantity: 10, unitPriceHT: 10 }, { productId: pb.id, quantity: 1, unitPriceHT: 20 }] });
  const inv = (await api('POST', `/documents/${r.body.id}/validate`)).body;
  check('facture de vente validée (HT 120)', inv.number && near(inv.totalHT, 120), inv);
  const linePa = inv.lines.find((l) => l.productId === pa.id);
  r = await api('POST', `/documents/${inv.id}/convert`, { to: 'credit_note', creditLines: [{ lineId: linePa.id, quantity: 2 }] });
  const cn = (await api('POST', `/documents/${r.body.id}/validate`)).body;
  check('avoir partiel de 2 unités validé', cn.number && near(cn.totalHT, 20), cn);

  // ═════════════════════════ Rapports de gestion ═════════════════════════
  console.log('— Rapports de gestion');
  const from = addDays(-60);
  r = await api('GET', `/reports/business/sales?from=${from}&to=${today}`);
  check('CA net = 100 (ancienne) + 120 − 20 = 200', r.status === 200 && near(r.body.totals.netHT, 200) && r.body.totals.invoices === 2 && r.body.totals.creditNotes === 1, r.body.totals);
  const topP = r.body.topProducts.find((p) => p.productId === pa.id);
  check('Imprimante : quantité nette 8, CA net 80', topP && near(topP.quantity, 8) && near(topP.revenue, 80), r.body.topProducts);
  check('CA par mois non vide', r.body.byMonth.length >= 1 && near(r.body.byMonth.reduce((s, m) => s + m.revenue, 0), 200), r.body.byMonth);

  r = await api('GET', `/reports/business/margins?from=${from}&to=${today}`);
  const mA = r.body.items.find((i) => i.id === pa.id);
  const mB = r.body.items.find((i) => i.id === pb.id);
  check('marge Imprimante : CA 80, coût 32, marge 48 (60 %)', mA && near(mA.revenue, 80) && near(mA.cost, 32) && near(mA.margin, 48) && near(mA.marginRate, 60), mA);
  check('marge Cartouche : CA 20, coût 12, marge 8', mB && near(mB.revenue, 20) && near(mB.cost, 12) && near(mB.margin, 8), mB);
  const mS = r.body.items.find((i) => i.id === ps.id);
  check('service : pas d’alerte « coût manquant »', mS && mS.linesWithoutCost === 0 && !r.body.note, [mS, r.body.note]);
  r = await api('GET', `/reports/business/margins?from=${from}&to=${today}&by=client`);
  check('marges par client', r.status === 200 && r.body.items.length >= 1 && near(r.body.totals.revenue, 200), r.body.totals);
  r = await api('GET', `/reports/business/sales?from=${today}&to=${addDays(-1)}`);
  check('période inversée refusée', r.status === 400, r);
  r = await api('GET', '/reports/business/sales?from=abc');
  check('date invalide refusée', r.status === 400, r);

  for (const kind of ['sales', 'margins', 'aging-clients', 'aging-suppliers', 'stock-valuation']) {
    const x = await api('GET', `/reports/business/export/${kind}?from=${from}&to=${today}`, null, true);
    const buf = Buffer.from(await x.arrayBuffer());
    check(`export Excel ${kind}`, x.status === 200 && /spreadsheetml/.test(x.headers.get('content-type')) && buf.slice(0, 2).toString() === 'PK', x.status);
  }
  r = await api('GET', '/reports/business/export/inconnu');
  check('export inconnu refusé', r.status === 400, r);

  // ═════════════════════════ Notifications ═════════════════════════
  console.log('— Notifications');
  r = await api('POST', '/notifications/refresh');
  check('actualisation', r.status === 201 && r.body.refreshed === true, r);
  r = await api('GET', '/notifications');
  const types = r.body.items.map((n) => n.type);
  check('facture en retard signalée', types.includes('invoice_overdue'), types);
  check('stock bas signalé (Cartouche) mais pas Imprimante', r.body.items.some((n) => n.type === 'low_stock' && /Cartouche/.test(n.title)) && !r.body.items.some((n) => n.type === 'low_stock' && /Imprimante/.test(n.title)), r.body.items.map((n) => n.title));
  check('devis proche de l’expiration : non listé tant qu’il est brouillon', !types.includes('quote_expiring'), types);
  await api('POST', `/documents/${quote.id}/validate`);
  await api('POST', '/notifications/refresh');
  r = await api('GET', '/notifications');
  check('devis qui expire signalé après validation', r.body.items.some((n) => n.type === 'quote_expiring'), r.body.items.map((n) => n.type));
  const before = r.body.items.length;
  await api('POST', '/notifications/refresh');
  r = await api('GET', '/notifications');
  check('pas de doublon à la ré-actualisation', r.body.items.length === before, [before, r.body.items.length]);
  const unread0 = r.body.unread;
  r = await api('POST', `/notifications/${r.body.items[0].id}/read`);
  check('marquer comme lue', r.status === 201 && r.body.read === true, r);
  r = await api('POST', '/notifications/999999/read');
  check('notification inconnue : 404', r.status === 404, r);
  r = await api('POST', '/notifications/read-all');
  check('tout marquer comme lu', r.status === 201 && r.body.marked >= 0, r);
  r = await api('GET', '/notifications?unread=1');
  check('plus aucune alerte non lue', r.body.unread === 0 && r.body.items.length === 0, [unread0, r.body.unread]);
  r = await api('POST', '/notifications/digest');
  check('récapitulatif email (sans alerte non lue)', r.status === 201 && r.body.sent === false, r);

  // ═════════════════════════ Caisse ═════════════════════════
  console.log('— Caisse : sessions et rapport Z');
  r = await api('GET', '/pos/sessions/current');
  check('aucune session ouverte', r.status === 200 && r.body.open === false, r);
  r = await api('POST', '/pos/sessions/close', { countedCash: 0 });
  check('clôture sans session refusée (404)', r.status === 404, r);
  r = await api('POST', '/pos/sessions/open', { openingFloat: -5 });
  check('fond de caisse négatif refusé', r.status === 400, r);
  r = await api('POST', '/pos/sessions/open', { openingFloat: 50 });
  check('ouverture avec fond de 50', r.status === 201 && r.body.status === 'open', r);
  r = await api('POST', '/pos/sessions/open', { openingFloat: 10 });
  check('deuxième session refusée', r.status === 400, r);

  r = await api('POST', '/pos/checkout', { mode: 'sale', lines: [{ productId: pa.id, quantity: 2, unitPrice: 10 }], paymentMethod: 'cash' });
  check('vente comptoir espèces', r.status === 201, r);
  const t1 = r.body;
  r = await api('POST', '/pos/checkout', { mode: 'sale', lines: [{ productId: pa.id, quantity: 1, unitPrice: 10 }], paymentMethod: 'card' });
  check('vente comptoir carte', r.status === 201, r);
  const ticketNo = t1.ticketNumber;
  check('ticket numéroté et rattaché à la session', /^V-\d{8}-/.test(ticketNo || '') && Number.isInteger(t1.sessionId), t1);
  r = await api('GET', `/pos/tickets/${encodeURIComponent(ticketNo)}`);
  check('ticket consultable', r.status === 200 && JSON.stringify(r.body).includes('Imprimante'), r);
  r = await api('GET', '/pos/tickets/INCONNU');
  check('ticket inconnu : 404', r.status === 404, r);
  r = await api('GET', '/pos/sessions/current');
  check('rapport en direct', r.body.open === true && r.body.live, r.body);

  r = await api('POST', '/pos/sessions/close', { countedCash: -1 });
  check('montant compté invalide refusé', r.status === 400, r);
  const live = (await api('GET', '/pos/sessions/current')).body.live;
  check('rapport en direct : espèces 20, carte 10, attendu en caisse 70', near(live.salesTotal, 30) && live.sales.find((m) => m.method === 'cash').total === 20 && live.sales.find((m) => m.method === 'card').total === 10 && near(live.expectedCash, 70), live);
  r = await api('POST', '/pos/sessions/close', { countedCash: 50 + 20 - 2 });
  check('clôture : numéro Z et écart de caisse', r.status === 201 && /^Z-\d{4}-\d{5}$/.test(r.body.number || '') && r.body.status === 'closed', r.body);
  const zNumber = r.body.number;
  check('espèces attendues = fond 50 + ventes espèces 20', near(r.body.expectedCash, 70) && near(r.body.countedCash, 68), r.body);
  check('écart de caisse calculé (−2)', near(r.body.variance, -2), r.body);
  r = await api('POST', '/pos/sessions/close', { countedCash: 0 });
  check('double clôture refusée', r.status === 404, r);
  r = await api('GET', '/pos/sessions');
  check('historique des sessions', r.status === 200 && JSON.stringify(r.body).includes(zNumber), r);

  r = await api('POST', '/pos/sessions/open', { openingFloat: 0 });
  r = await api('POST', '/pos/sessions/close', { countedCash: 0 });
  check('numérotation Z sans trou', r.status === 201 && r.body.number === zNumber.replace(/(\d+)$/, (m) => String(Number(m) + 1).padStart(m.length, '0')), [r.body.number, zNumber]);

  // ═════════════════════════ Cohérence finale ═════════════════════════
  console.log('— Cohérence finale');
  const tbAll = (await api('GET', '/accounting/trial-balance')).body;
  check('balance générale équilibrée', near(tbAll.totals.debit, tbAll.totals.credit), tbAll.totals);
  r = await api('GET', '/stock/reconcile');
  check('stock cohérent avec le journal des mouvements', r.status === 200 && r.body.checked === true && r.body.drift.length === 0, r.body);

  summary();
})().catch((e) => { console.error(e); process.exit(2); });
