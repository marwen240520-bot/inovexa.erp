const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateProducts() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS products CASCADE`);
    console.log('✅ Ancienne table products supprimée');
    
    // Recréer la table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "categoryId" INTEGER,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        quantity INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table products créée');
    
    // Ajouter un index
    await client.query(`CREATE INDEX idx_products_userId ON products("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table products recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateProducts();
