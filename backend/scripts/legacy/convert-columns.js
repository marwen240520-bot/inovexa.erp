const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function convertColumns() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Récupérer toutes les colonnes de type timestamp
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND data_type = 'timestamp without time zone'
    `);
    
    console.log(`📋 ${columns.rows.length} colonne(s) timestamp trouvée(s)`);
    
    // Convertir chaque colonne en TEXT
    for (const col of columns.rows) {
      const columnName = col.column_name;
      await client.query(`
        ALTER TABLE users 
        ALTER COLUMN "${columnName}" TYPE TEXT
      `);
      console.log(`✅ Colonne ${columnName} convertie en TEXT`);
    }
    
    // Mettre les dates invalides à NULL
    await client.query(`
      UPDATE users SET 
        "subscriptionStart" = NULL,
        "subscriptionEnd" = NULL,
        "createdAt" = NULL,
        "updatedAt" = NULL
      WHERE "subscriptionStart"::text LIKE '%NaN%' 
         OR "subscriptionEnd"::text LIKE '%NaN%'
    `);
    console.log('✅ Dates invalides mises à NULL');
    
    await client.end();
    console.log('✅ Conversion terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

convertColumns();
