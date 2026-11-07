const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function createTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    // Vérifier si la table existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invoices'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ La table "invoices" existe déjà');
      
      // Vérifier si la colonne operation_number existe
      const columnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'invoices' AND column_name = 'operation_number'
        );
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️ Ajout de la colonne operation_number...');
        await client.query(`ALTER TABLE invoices ADD COLUMN operation_number VARCHAR(255) UNIQUE`);
        console.log('✅ Colonne operation_number ajoutée');
      }
    } else {
      console.log('📦 Création de la table "invoices"...');
      
      await client.query(`
        CREATE TABLE invoices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          reference VARCHAR(255) NOT NULL,
          operation_number VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(50) DEFAULT 'debit',
          client_id INTEGER,
          supplier_id INTEGER,
          client_name VARCHAR(255),
          supplier_name VARCHAR(255),
          client_email VARCHAR(255),
          client_address TEXT,
          client_phone VARCHAR(50),
          client_siret VARCHAR(50),
          description TEXT,
          items JSONB,
          subtotal_ht DECIMAL(10,2) DEFAULT 0,
          amount DECIMAL(10,2) DEFAULT 0,
          tax_rate DECIMAL(5,2) DEFAULT 20,
          tax_amount DECIMAL(10,2) DEFAULT 0,
          due_date DATE,
          payment_terms VARCHAR(100) DEFAULT 'Net 30',
          notes TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      console.log('✅ Table "invoices" créée avec succès');
      
      // Créer un index sur operation_number pour les recherches rapides
      await client.query(`
        CREATE INDEX idx_invoices_operation_number ON invoices(operation_number);
        CREATE INDEX idx_invoices_user_id ON invoices(user_id);
        CREATE INDEX idx_invoices_status ON invoices(status);
      `);
      console.log('✅ Index créés');
    }
    
    await client.end();
    console.log('\n✅ Vérification terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTable();
