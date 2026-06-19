const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function alterTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // 1. Supprimer les colonnes de dates si elles existent avec des contraintes
    await client.query(`
      ALTER TABLE users 
        ALTER COLUMN "subscriptionStart" DROP NOT NULL,
        ALTER COLUMN "subscriptionEnd" DROP NOT NULL,
        ALTER COLUMN "subscriptionStart" SET DEFAULT NULL,
        ALTER COLUMN "subscriptionEnd" SET DEFAULT NULL
    `);
    console.log('✅ Colonnes modifiées pour accepter NULL');
    
    // 2. Mettre toutes les dates à NULL
    await client.query(`
      UPDATE users SET 
        "subscriptionStart" = NULL,
        "subscriptionEnd" = NULL
    `);
    console.log('✅ Toutes les dates mises à NULL');
    
    // 3. Vérifier
    const result = await client.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE "subscriptionStart" IS NOT NULL OR "subscriptionEnd" IS NOT NULL
    `);
    console.log(`✅ ${result.rows[0].count} enregistrements avec dates non NULL`);
    
    await client.end();
    console.log('✅ Modification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

alterTable();
