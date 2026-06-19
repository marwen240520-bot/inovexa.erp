const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function fixDates() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);
    
    // Mettre à jour les dates invalides
    const result = await client.query(`
      UPDATE users 
      SET 
        "subscriptionStart" = $1,
        "subscriptionEnd" = $2
      WHERE 
        "subscriptionStart" IS NULL 
        OR "subscriptionStart"::text LIKE '%NaN%'
        OR "subscriptionStart"::text LIKE '%Invalid%'
        OR "subscriptionEnd" IS NULL 
        OR "subscriptionEnd"::text LIKE '%NaN%'
        OR "subscriptionEnd"::text LIKE '%Invalid%'
        OR "subscriptionStart"::text = ''
        OR "subscriptionEnd"::text = ''
    `, [now, oneYearLater]);
    
    console.log(`✅ ${result.rowCount} enregistrements mis à jour`);
    
    // Vérifier les données
    const check = await client.query(`
      SELECT id, email, "subscriptionStart", "subscriptionEnd" 
      FROM users 
      WHERE role = 'client'
    `);
    
    console.log('\n📊 États des clients:');
    check.rows.forEach(user => {
      console.log(`   ${user.email}: debut=${user.subscriptionStart}, fin=${user.subscriptionEnd}`);
    });
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixDates();
