const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateOrders() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS orders CASCADE`);
    console.log('✅ Ancienne table orders supprimée');
    
    // Recréer la table
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "clientId" INTEGER,
        "clientName" VARCHAR(255),
        "productId" INTEGER,
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        "unitPrice" DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table orders créée');
    
    // Ajouter un index
    await client.query(`CREATE INDEX idx_orders_userId ON orders("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table orders recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateOrders();
