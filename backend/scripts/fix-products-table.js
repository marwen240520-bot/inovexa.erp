const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function fixProductsTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS products CASCADE`);
    console.log('✅ Ancienne table products supprimée');
    
    // Recréer la table sans contrainte de clé étrangère
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        categoryId INTEGER,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table products recréée (sans foreign key)');
    
    await client.end();
    console.log('✅ Correction terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixProductsTable();
