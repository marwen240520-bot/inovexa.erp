// Fusion de l'ancien module « Factures » dans Documents : reprise automatique, lecture seule, compatibilité.
// Lancé par run.sh sur une base neuve.
const { Client } = require('pg');
const { api, check, setToken, summary } = require('./lib');
const near = (a, b, eps = 0.0006) => Math.abs(Number(a) - Number(b)) <= eps;

(async () => {
  let r = await api('POST', '/auth/login', { email: 'owner@test.tn', password: 'Test#12345' });
  check('login', r.status === 200 || r.status === 201, r);
  setToken(r.body.access_token || r.body.token);
  const me = (await api('GET', '/auth/me')).body;

  // Fiche client existante : les anciennes factures saisies avec ce nom lui seront rattachées
  const histo = (await api('POST', '/clients', { name: 'Client Histo', email: 'histo@test.tn' })).body;
  check('client Histo créé', !!histo.id, histo);

  // ── Anciennes factures saisies avant la fusion (insérées directement, comme l'ancien écran le faisait) ──
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  const insert = async (v) => (await pg.query(
    `INSERT INTO "invoices" ("userId","operationNumber","reference","type","clientName","supplierName","clientSiret","description","items","subtotalHT","amount","taxRate","taxAmount","dueDate","paymentTerms","paymentMethod","status","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18) RETURNING "id"`,
    [me.id, v.op, v.ref, v.type || 'debit', v.client || null, v.supplier || null, v.taxId || null, v.description || '', JSON.stringify(v.items || []), v.ht, v.ttc, v.rate ?? 19, v.vat, v.due || null, 'Net 30', v.method || null, v.status || 'pending', v.at],
  )).rows[0].id;
  const idA = await insert({ op: 'OP-A', ref: 'FA-2025-0007', client: 'Client Histo', taxId: '1234567/A/M/000', items: [{ description: 'Imprimante', quantity: 2, unitPrice: 100, total: 200 }], ht: 200, ttc: 238, vat: 38, status: 'paid', method: 'cash', at: '2025-09-10 10:00:00', due: '2025-10-10' });
  const idB = await insert({ op: 'OP-B', ref: 'FA-2025-0008', client: 'Client Histo', description: 'Prestation', ht: 100, ttc: 119, vat: 19, at: '2025-09-12 10:00:00' });
  const idC = await insert({ op: 'OP-C', ref: 'FF-2025-0001', type: 'credit', supplier: 'Fournisseur X', ht: 50, ttc: 59.5, vat: 9.5, at: '2025-09-15 00:00:00' });
  const idD = await insert({ op: 'OP-D', ref: 'FA-2025-0007', client: 'Autre client', ht: 10, ttc: 11.9, vat: 1.9, at: '2025-09-20 23:30:00' });
  await pg.end();

  // ── Première consultation : reprise silencieuse ──
  r = await api('GET', '/invoices');
  check('ancien module toujours lisible', r.status === 200 && Array.isArray(r.body) && r.body.length === 4, r.status);
  check('chaque ancienne facture pointe vers un document', r.body.every((i) => i.documentId), r.body.map((i) => i.documentId));
  const docOf = Object.fromEntries(r.body.map((i) => [i.id, i.documentId]));

  r = await api('GET', '/documents', null); const list = r.body;
  const docs = (type) => list.items.filter((d) => d.type === type);
  check('3 factures clients reprises', docs('invoice').length === 3, docs('invoice').map((d) => d.number));
  check('1 facture fournisseur reprise', docs('supplier_invoice').length === 1 && docs('supplier_invoice')[0].number === 'FF-2025-0001', docs('supplier_invoice'));
  const numbers = docs('invoice').map((d) => d.number).sort();
  check('numéros d’origine conservés, doublon suffixé', JSON.stringify(numbers) === JSON.stringify(['FA-2025-0007', 'FA-2025-0007-2', 'FA-2025-0008']), numbers);

  const a = (await api('GET', `/documents/${docOf[idA]}`)).body;
  check('facture payée : validée, figée, soldée', a.status === 'validated' && a.lockedAt && a.paymentStatus === 'paid' && near(a.balanceDue, 0) && near(a.paidAmount, 238), [a.status, a.paymentStatus, a.balanceDue]);
  check('date d’émission = date de l’ancienne facture', a.issueDate === '2025-09-10' && a.dueDate === '2025-10-10', [a.issueDate, a.dueDate]);
  check('lignes et montants repris', a.lines.length === 1 && near(a.lines[0].quantity, 2) && near(a.totalHT, 200) && near(a.totalVat, 38) && near(a.totalTTC, 238), a.lines);
  check('règlement de reprise enregistré', a.payments.length === 1 && near(a.payments[0].amount, 238) && a.payments[0].method === 'cash' && a.payments[0].date === '2025-09-10', a.payments);
  check('tiers et matricule repris', a.partyName === 'Client Histo' && a.partyTaxId === '1234567/A/M/000', [a.partyName, a.partyTaxId]);
  const d = (await api('GET', `/documents/${docOf[idD]}`)).body;
  check('date calendaire du serveur (pas de recul d’un jour)', d.issueDate === '2025-09-20', d.issueDate);
  const b = (await api('GET', `/documents/${docOf[idB]}`)).body;
  check('facture impayée : solde dû', b.paymentStatus === 'unpaid' && near(b.balanceDue, 119) && b.lines[0].description === 'Prestation', [b.paymentStatus, b.balanceDue]);

  r = await api('POST', '/documents/import-legacy');
  check('reprise idempotente', r.status === 201 && r.body.imported === 0 && r.body.remaining === 0, r.body);
  check('anciennes factures rattachées à la fiche client par le nom', a.partyId === histo.id && b.partyId === histo.id, [a.partyId, b.partyId, histo.id]);

  // ── Fiche 360° : factures reprises + ventes caisse de l'ancien module ──
  const prod = (await api('POST', '/products', { name: 'Cartouche', sku: 'CART', price: 20, quantity: 10 })).body;
  r = await api('POST', '/pos/checkout', { mode: 'sale', counterpart: 'Client Histo', lines: [{ productId: prod.id, quantity: 2, unitPrice: 20 }], paymentMethod: 'cash' });
  check('vente caisse au nom du client', r.status === 201, r.body);
  r = await api('GET', `/crm/clients/${histo.id}/overview`);
  const k = r.body.kpis || {};
  check('fiche 360° : factures reprises comptées', r.status === 200 && k.invoiceCount === 2 && near(k.outstanding, 119) && r.body.recentDocuments.length === 2, [r.status, k, r.body.recentDocuments]);
  check('fiche 360° : vente caisse comptée dans le CA et listée', k.legacyCount === 1 && near(k.legacyRevenue12m, 40) && near(k.netRevenue12m, 40) && r.body.legacySales.length === 1 && r.body.legacySales[0].productName === 'Cartouche', [k, r.body.legacySales]);
  check('fiche 360° : meilleurs produits fusionnés', r.body.topProducts.some((t) => /cartouche/i.test(t.description) && near(t.revenue, 40)) && r.body.topProducts.some((t) => /imprimante/i.test(t.description)), r.body.topProducts);

  // ── L'ancien module est en lecture seule ──
  r = await api('POST', '/invoices', { reference: 'X' }); check('POST /invoices refusé (410)', r.status === 410, r.status);
  r = await api('PUT', `/invoices/${idB}`, { amount: 1 }); check('PUT /invoices refusé (410)', r.status === 410, r.status);
  r = await api('DELETE', `/invoices/${idB}`); check('DELETE /invoices refusé (410)', r.status === 410, r.status);
  r = await api('GET', '/invoices/stats'); check('GET /invoices/stats répond', r.status === 200, r.status);

  // ── Compatibilité : « marquer payée » règle le document ──
  r = await api('PATCH', `/invoices/${idB}/pay`, { paymentMethod: 'transfer' });
  check('marquer payée → règlement sur le document', r.status === 200, r.body);
  const b2 = (await api('GET', `/documents/${docOf[idB]}`)).body;
  check('document soldé par virement', b2.paymentStatus === 'paid' && near(b2.balanceDue, 0) && b2.payments.some((p) => p.method === 'transfer' && near(p.amount, 119)), [b2.paymentStatus, b2.payments]);
  const mirrorB = (await api('GET', `/invoices/${idB}`)).body;
  check('reflet mis à jour', mirrorB.status === 'paid' && mirrorB.paymentMethod === 'transfer', [mirrorB.status, mirrorB.paymentMethod]);
  r = await api('PATCH', `/invoices/${idB}/pay`, {});
  check('déjà payée : pas de double règlement', r.status === 200 && r.body.already === true, r.body);

  // ── Import Excel d'un historique : reprise immédiate avec la date de la facture ──
  r = await api('POST', '/invoices/import', { invoices: [
    { reference: 'HIST-2026-01', client: 'Client Excel', 'date': '15/03/2026', montant: 59.5, 'montant ht': 50, tva: 19, statut: 'payée', 'moyen de paiement': 'especes' },
    { reference: 'HIST-2026-02', client: 'Client Excel', 'date': '2026-04-02', montant: 119, 'montant ht': 100, tva: 19, statut: 'en attente' },
  ] });
  check('import Excel accepté', r.status === 201 && r.body.success === 2 && r.body.migrated && r.body.migrated.imported === 2, r.body);
  r = await api('GET', '/documents', null);
  const h1 = r.body.items.find((x) => x.number === 'HIST-2026-01'), h2 = r.body.items.find((x) => x.number === 'HIST-2026-02');
  check('historique Excel repris avec ses dates', h1 && h1.issueDate === '2026-03-15' && h1.paymentStatus === 'paid' && h2 && h2.issueDate === '2026-04-02' && h2.paymentStatus === 'unpaid', [h1 && h1.issueDate, h2 && h2.issueDate]);

  // ── Les nouvelles factures suivent la numérotation légale, indépendante des numéros repris ──
  r = await api('PUT', '/company', { legalName: 'Société Test SARL', legalForm: 'SARL', taxId: '1234567X/A/M/000', address: '12 rue de Carthage', city: 'Tunis', postalCode: '1000' });
  check('fiche société', r.status === 200, r.body);
  r = await api('POST', '/documents', { type: 'invoice', partyName: 'Client Nouveau', lines: [{ description: 'Service', quantity: 1, unitPriceHT: 100, vatRate: 19 }] });
  check('nouveau brouillon', r.status === 201, r.body);
  r = await api('POST', `/documents/${r.body.id}/validate`);
  check('première facture « moteur » numérotée 00001', r.status === 201 && /-00001$/.test(r.body.number || ''), r.body.number);

  // ── Le tableau de bord (ancien écran) voit tout : reflets + reprises ──
  r = await api('GET', '/invoices');
  check('reflet complet pour les anciens écrans', r.status === 200 && r.body.length === 7, r.body.length);
  r = await api('GET', '/clients');
  check('la vente caisse n’a pas créé de doublon de client', r.body.filter((c) => /histo/i.test(c.name)).length === 1, r.body.map((c) => c.name));

  summary();
})().catch((e) => { console.error(e); process.exit(2); });
