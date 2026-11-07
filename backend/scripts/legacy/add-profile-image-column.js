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
    
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='users' AND column_name='profileimage') THEN 
          ALTER TABLE users ADD COLUMN "profileImage" TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Colonne profileImage ajoutée');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addColumn();
