const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function alterColumns() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Modifier les colonnes de date en TEXT
    await client.query(`
      ALTER TABLE users 
        ALTER COLUMN "subscriptionStart" TYPE TEXT,
        ALTER COLUMN "subscriptionEnd" TYPE TEXT,
        ALTER COLUMN "hireDate" TYPE TEXT,
        ALTER COLUMN "createdAt" TYPE TEXT,
        ALTER COLUMN "updatedAt" TYPE TEXT
    `);
    console.log('✅ Colonnes users modifiées en TEXT');
    
    // Mettre à jour les valeurs NULL
    await client.query(`
      UPDATE users SET 
        "subscriptionStart" = NULL,
        "subscriptionEnd" = NULL,
        "hireDate" = NULL
    `);
    console.log('✅ Valeurs mises à NULL');
    
    // Vérifier
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND data_type = 'timestamp without time zone'
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Aucune colonne timestamp restante');
    } else {
      console.log(`⚠️ ${result.rows.length} colonnes timestamp restantes`);
    }
    
    await client.end();
    console.log('✅ Modification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

alterColumns();
