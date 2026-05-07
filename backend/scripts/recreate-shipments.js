const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateShipments() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS shipments CASCADE`);
    console.log('✅ Ancienne table shipments supprimée');
    
    // Recréer la table avec les bonnes colonnes
    await client.query(`
      CREATE TABLE shipments (
        id SERIAL PRIMARY KEY,
        "clientId" INTEGER NOT NULL,
        "transporteurId" INTEGER,
        "trackingNumber" VARCHAR(100) UNIQUE NOT NULL,
        "clientName" VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        carrier VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        "estimatedDelivery" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table shipments créée');
    
    // Ajouter des index
    await client.query(`CREATE INDEX idx_shipments_clientId ON shipments("clientId")`);
    await client.query(`CREATE INDEX idx_shipments_transporteurId ON shipments("transporteurId")`);
    await client.query(`CREATE INDEX idx_shipments_status ON shipments(status)`);
    console.log('✅ Index créés');
    
    await client.end();
    console.log('✅ Table shipments recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateShipments();
