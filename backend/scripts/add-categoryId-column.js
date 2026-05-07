const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addCategoryIdColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si la colonne existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'categoryId'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Ajouter la colonne categoryId
      await client.query(`
        ALTER TABLE products ADD COLUMN "categoryId" INTEGER
      `);
      console.log('✅ Colonne categoryId ajoutée à la table products');
    } else {
      console.log('✅ La colonne categoryId existe déjà');
    }
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addCategoryIdColumn();
