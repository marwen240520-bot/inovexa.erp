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
    
    // Ajouter la colonne hireDate si elle n'existe pas
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='hireDate') THEN 
          ALTER TABLE users ADD COLUMN "hireDate" TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Colonne hireDate ajoutée');
    
    // Ajouter la colonne theme si elle n'existe pas
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='theme') THEN 
          ALTER TABLE users ADD COLUMN theme TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Colonne theme ajoutée');
    
    // Ajouter la colonne profileImage si elle n'existe pas
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
    
    // Ajouter la colonne modules si elle n'existe pas
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='modules') THEN 
          ALTER TABLE users ADD COLUMN modules TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Colonne modules ajoutée');
    
    console.log('✅ Toutes les colonnes sont présentes');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addColumns();
