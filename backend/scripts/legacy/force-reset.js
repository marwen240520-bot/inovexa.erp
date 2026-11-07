const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

async function forceReset() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Terminer toutes les connexions
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'inovexa_erp'
      AND pid <> pg_backend_pid()
    `);
    
    // Supprimer la base
    await client.query(`DROP DATABASE IF EXISTS inovexa_erp`);
    console.log('✅ Base inovexa_erp supprimée');
    
    // Créer la base
    await client.query(`CREATE DATABASE inovexa_erp`);
    console.log('✅ Base inovexa_erp créée');
    
    await client.end();
    console.log('✅ Base recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

forceReset();
