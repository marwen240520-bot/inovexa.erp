const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function checkTables() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    const tables = ['clients', 'suppliers', 'invoices'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table "${table}" existe (${count.rows[0].count} enregistrements)`);
      } else {
        console.log(`⚠️ Table "${table}" n'existe pas`);
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkTables();
