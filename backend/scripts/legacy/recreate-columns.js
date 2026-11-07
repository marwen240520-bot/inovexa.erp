const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateColumns() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // 1. Supprimer les anciennes colonnes
    await client.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS "subscriptionStart";
      ALTER TABLE users DROP COLUMN IF EXISTS "subscriptionEnd";
    `);
    console.log('✅ Anciennes colonnes supprimées');
    
    // 2. Recréer les colonnes
    await client.query(`
      ALTER TABLE users ADD COLUMN "subscriptionStart" TIMESTAMP;
      ALTER TABLE users ADD COLUMN "subscriptionEnd" TIMESTAMP;
    `);
    console.log('✅ Nouvelles colonnes créées');
    
    // 3. Mettre les valeurs par défaut à NULL
    await client.query(`
      ALTER TABLE users ALTER COLUMN "subscriptionStart" SET DEFAULT NULL;
      ALTER TABLE users ALTER COLUMN "subscriptionEnd" SET DEFAULT NULL;
    `);
    console.log('✅ Default NULL configuré');
    
    await client.end();
    console.log('✅ Colonnes recréées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateColumns();
