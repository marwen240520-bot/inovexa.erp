const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function cleanAllDates() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);
    
    // 1. Mettre à jour tous les enregistrements avec des dates invalides
    const result = await client.query(`
      UPDATE users 
      SET 
        "subscriptionStart" = $1,
        "subscriptionEnd" = $2
      WHERE 
        "subscriptionStart" IS NULL 
        OR "subscriptionStart"::text LIKE '%NaN%'
        OR "subscriptionStart"::text LIKE '%Invalid%'
        OR "subscriptionStart"::text = ''
        OR "subscriptionStart"::text = '0NaN-NaN-NaNTNaN:NaN:NaN.NaN+NaN:NaN'
        OR "subscriptionEnd" IS NULL 
        OR "subscriptionEnd"::text LIKE '%NaN%'
        OR "subscriptionEnd"::text LIKE '%Invalid%'
        OR "subscriptionEnd"::text = ''
        OR "subscriptionEnd"::text = '0NaN-NaN-NaNTNaN:NaN:NaN.NaN+NaN:NaN'
    `, [now, oneYearLater]);
    
    console.log(`✅ ${result.rowCount} enregistrement(s) mis à jour`);
    
    // 2. Vérifier et afficher les données actuelles
    const check = await client.query(`
      SELECT id, email, "subscriptionStart", "subscriptionEnd" 
      FROM users
      ORDER BY id
    `);
    
    console.log('\n📊 État actuel des utilisateurs:');
    console.log('─'.repeat(80));
    for (const user of check.rows) {
      const startValid = user.subscriptionStart ? '✓' : '✗';
      const endValid = user.subscriptionEnd ? '✓' : '✗';
      console.log(`ID: ${user.id} | Email: ${user.email} | Début: ${startValid} | Fin: ${endValid}`);
    }
    console.log('─'.repeat(80));
    
    // 3. Vérifier qu'il n'y a plus de dates NaN
    const nanCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE "subscriptionStart"::text LIKE '%NaN%' 
         OR "subscriptionEnd"::text LIKE '%NaN%'
    `);
    
    if (parseInt(nanCheck.rows[0].count) === 0) {
      console.log('\n✅ Aucune date NaN trouvée !');
    } else {
      console.log(`\n⚠️ Attention: ${nanCheck.rows[0].count} enregistrement(s) ont encore des dates NaN`);
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

cleanAllDates();
