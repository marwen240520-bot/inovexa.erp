const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function dropConstraint() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer la contrainte si elle existe
    await client.query(`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_userId_fkey`);
    console.log('✅ Contrainte invoices_userId_fkey supprimée');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

dropConstraint();
