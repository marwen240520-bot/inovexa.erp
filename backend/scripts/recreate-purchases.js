const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreatePurchases() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS purchases CASCADE`);
    console.log('✅ Ancienne table purchases supprimée');
    
    // Recréer la table
    await client.query(`
      CREATE TABLE purchases (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "supplierName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        "unitPrice" DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table purchases créée');
    
    // Ajouter un index
    await client.query(`CREATE INDEX idx_purchases_userId ON purchases("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table purchases recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreatePurchases();
