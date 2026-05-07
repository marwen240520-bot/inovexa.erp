const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
});

async function createDatabase() {
  try {
    await client.connect();
    await client.query('CREATE DATABASE IF NOT EXISTS inovexa_erp');
    console.log('✅ Base de données créée avec succès');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('✅ La base de données existe déjà');
    } else {
      console.error('❌ Erreur:', err.message);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
