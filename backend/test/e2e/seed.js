// Crée le propriétaire de test (owner@test.tn) sur la base d'essai. Utilisé par run.sh.
const { Client } = require('pg');
const bcrypt = require('bcrypt');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const hash = await bcrypt.hash('Test#12345', 10);
  await c.query(`DELETE FROM users WHERE email='owner@test.tn'`);
  await c.query(`INSERT INTO users (email,password,name,"companyName",role,modules) VALUES ($1,$2,'Owner','Société Test SARL','client','{}')`, ['owner@test.tn', hash]);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
