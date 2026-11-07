const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addColumns() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Ajouter la colonne theme
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='theme') THEN 
          ALTER TABLE users ADD COLUMN theme VARCHAR(50) DEFAULT 'dark';
        END IF;
      END $$;
    `);
    console.log('✅ Colonne theme ajoutée');
    
    // Ajouter la colonne profileImage
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='profileImage') THEN 
          ALTER TABLE users ADD COLUMN "profileImage" TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Colonne profileImage ajoutée');
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addColumns();
