const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateClients() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS clients CASCADE`);
    console.log('✅ Ancienne table clients supprimée');
    
    // Recréer la table
    await client.query(`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        "totalSpent" DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table clients créée');
    
    // Ajouter un index
    await client.query(`CREATE INDEX idx_clients_userId ON clients("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table clients recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateClients();
