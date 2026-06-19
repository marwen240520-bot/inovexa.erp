const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function cleanEmptyStrings() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Mettre à NULL toutes les chaînes vides dans les colonnes de date
    await client.query(`
      UPDATE users SET 
        "subscriptionStart" = NULL WHERE "subscriptionStart" = '' OR "subscriptionStart" = ' ',
        "subscriptionEnd" = NULL WHERE "subscriptionEnd" = '' OR "subscriptionEnd" = ' ',
        "hireDate" = NULL WHERE "hireDate" = '' OR "hireDate" = ' ',
        "createdAt" = NULL WHERE "createdAt" = '' OR "createdAt" = ' ',
        "updatedAt" = NULL WHERE "updatedAt" = '' OR "updatedAt" = ' '
    `);
    console.log('✅ Chaînes vides mises à NULL');
    
    // Vérifier
    const result = await client.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE "subscriptionStart" = '' OR "subscriptionEnd" = '' OR "hireDate" = ''
    `);
    console.log(`✅ ${result.rows[0].count} enregistrements avec chaînes vides restantes`);
    
    await client.end();
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

cleanEmptyStrings();
