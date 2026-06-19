const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function verifyColumns() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name
    `);
    
    console.log('\n📋 STRUCTURE DE LA TABLE USERS:');
    console.log('─'.repeat(50));
    for (const col of result.rows) {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    }
    console.log('─'.repeat(50));
    
    // Vérifier s'il reste des timestamp
    const timestamps = result.rows.filter(r => r.data_type.includes('timestamp'));
    if (timestamps.length === 0) {
      console.log('\n✅ Aucune colonne TIMESTAMP restante !');
    } else {
      console.log(`\n⚠️ ${timestamps.length} colonne(s) TIMESTAMP restantes: ${timestamps.map(t => t.column_name).join(', ')}`);
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verifyColumns();
