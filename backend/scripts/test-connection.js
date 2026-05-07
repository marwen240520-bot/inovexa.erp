const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function test() {
  try {
    await client.connect();
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ PostgreSQL fonctionne! ${result.rows[0].count} utilisateurs`);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

test();
