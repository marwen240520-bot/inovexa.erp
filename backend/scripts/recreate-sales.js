const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateSales() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS sales CASCADE`);
    console.log('✅ Ancienne table sales supprimée');
    
    // Recréer la table
    await client.query(`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "clientName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        "unitPrice" DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table sales créée');
    
    // Ajouter un index
    await client.query(`CREATE INDEX idx_sales_userId ON sales("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table sales recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateSales();
