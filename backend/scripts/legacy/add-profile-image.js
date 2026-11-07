const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addProfileImageColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si la colonne existe déjà
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profileImage'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Ajouter la colonne profileImage
      await client.query(`
        ALTER TABLE users ADD COLUMN "profileImage" TEXT
      `);
      console.log('✅ Colonne "profileImage" ajoutée à la table users');
    } else {
      console.log('✅ La colonne "profileImage" existe déjà');
    }
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addProfileImageColumn();
