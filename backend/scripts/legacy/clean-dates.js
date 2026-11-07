const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function cleanDates() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Mettre à jour les dates invalides avec des dates valides
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);
    
    await client.query(`
      UPDATE users 
      SET "subscriptionStart" = $1,
          "subscriptionEnd" = $2
      WHERE "subscriptionStart" IS NULL 
         OR "subscriptionStart"::text = 'NaN'
         OR "subscriptionStart"::text LIKE '%NaN%'
         OR "subscriptionEnd" IS NULL 
         OR "subscriptionEnd"::text = 'NaN'
         OR "subscriptionEnd"::text LIKE '%NaN%'
    `, [now, oneYearLater]);
    
    console.log('✅ Dates invalides corrigées');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

cleanDates();
