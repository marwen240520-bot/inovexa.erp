const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addSupplierNameColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Ajouter la colonne supplierName si elle n'existe pas
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='invoices' AND column_name='supplierName') THEN 
          ALTER TABLE invoices ADD COLUMN "supplierName" VARCHAR(255);
          RAISE NOTICE 'Colonne supplierName ajoutée';
        ELSE
          RAISE NOTICE 'La colonne supplierName existe déjà';
        END IF;
      END $$;
    `);
    
    console.log('✅ Colonne supplierName ajoutée (ou déjà existante)');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addSupplierNameColumn();
