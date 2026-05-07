const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function checkColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profileImage'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Colonne profileImage présente');
    } else {
      console.log('❌ Colonne profileImage absente');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkColumn();
