const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si la colonne existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'updatedAt'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Ajouter la colonne updatedAt
      await client.query(`
        ALTER TABLE invoices ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ Colonne "updatedAt" ajoutée à la table invoices');
    } else {
      console.log('✅ La colonne "updatedAt" existe déjà');
    }
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addColumn();
