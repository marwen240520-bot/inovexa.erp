const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function clearDates() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Mettre toutes les dates à NULL
    const result = await client.query(`
      UPDATE users 
      SET 
        "subscriptionStart" = NULL,
        "subscriptionEnd" = NULL,
        "createdAt" = NOW(),
        "updatedAt" = NOW()
      WHERE true
    `);
    
    console.log(`✅ ${result.rowCount} enregistrements mis à jour`);
    
    // Vérifier
    const check = await client.query(`
      SELECT id, email, 
             "subscriptionStart" IS NULL as start_null,
             "subscriptionEnd" IS NULL as end_null
      FROM users
    `);
    
    console.log('\n📊 État des dates:');
    check.rows.forEach(user => {
      console.log(`   ID ${user.id}: subscriptionStart NULL=${user.start_null}, subscriptionEnd NULL=${user.end_null}`);
    });
    
    await client.end();
    console.log('\n✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

clearDates();
