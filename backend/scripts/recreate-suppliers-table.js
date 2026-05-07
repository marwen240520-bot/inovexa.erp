const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateSuppliersTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer la table si elle existe (CASCADE pour supprimer les contraintes)
    await client.query(`DROP TABLE IF EXISTS suppliers CASCADE`);
    console.log('✅ Ancienne table suppliers supprimée');
    
    // Recréer la table sans contrainte de clé étrangère
    await client.query(`
      CREATE TABLE suppliers (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        contact VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        "totalPurchases" DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table suppliers créée sans contrainte');
    
    // Ajouter un index sur userId pour les performances
    await client.query(`CREATE INDEX idx_suppliers_userId ON suppliers("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table suppliers recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateSuppliersTable();
