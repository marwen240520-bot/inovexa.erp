const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function resetTables() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer les données existantes
    await client.query(`TRUNCATE TABLE sales, purchases, products, invoices RESTART IDENTITY CASCADE`);
    console.log('✅ Données supprimées');
    
    // Réinitialiser les séquences
    await client.query(`ALTER SEQUENCE sales_id_seq RESTART WITH 1`);
    await client.query(`ALTER SEQUENCE purchases_id_seq RESTART WITH 1`);
    await client.query(`ALTER SEQUENCE products_id_seq RESTART WITH 1`);
    await client.query(`ALTER SEQUENCE invoices_id_seq RESTART WITH 1`);
    console.log('✅ Séquences réinitialisées');
    
    await client.end();
    console.log('✅ Base nettoyée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

resetTables();
