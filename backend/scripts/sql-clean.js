const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function sqlClean() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Nettoyer les dates
    await client.query(`
      UPDATE users SET 
        "subscriptionStart" = NULL,
        "subscriptionEnd" = NULL
    `);
    console.log('✅ Toutes les dates ont été mises à NULL');
    
    // Vérifier
    const result = await client.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE "subscriptionStart" IS NOT NULL OR "subscriptionEnd" IS NOT NULL
    `);
    console.log(`✅ ${result.rows[0].count} enregistrements avec dates non NULL`);
    
    await client.end();
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

sqlClean();
