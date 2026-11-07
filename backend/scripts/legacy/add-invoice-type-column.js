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
    
    // Ajouter la colonne type
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='invoices' AND column_name='type') THEN 
          ALTER TABLE invoices ADD COLUMN type VARCHAR(50) DEFAULT 'invoice';
        END IF;
      END $$;
    `);
    console.log('✅ Colonne "type" ajoutée à la table invoices');
    
    // Vérifier
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='invoices' AND column_name='type'
    `);
    
    if (res.rows.length > 0) {
      console.log('✅ Vérification: colonne type existe');
    }
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addColumn();
