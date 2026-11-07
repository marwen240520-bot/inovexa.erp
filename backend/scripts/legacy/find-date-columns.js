const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function findDateColumns() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Trouver toutes les colonnes de type date
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE data_type IN ('date', 'timestamp', 'timestamp without time zone')
      ORDER BY table_name, column_name
    `);
    
    console.log('\n📋 COLONNES DE TYPE DATE/TIMESTAMP:');
    console.log('─'.repeat(60));
    for (const col of result.rows) {
      console.log(`   ${col.table_name}.${col.column_name} : ${col.data_type}`);
    }
    console.log('─'.repeat(60));
    
    if (result.rows.length === 0) {
      console.log('✅ Aucune colonne de type date trouvée');
    } else {
      console.log(`\n⚠️ ${result.rows.length} colonne(s) de type date trouvée(s)`);
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

findDateColumns();
