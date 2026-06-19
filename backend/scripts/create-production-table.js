const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function createTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Créer la table production_orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS production_orders (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "orderNumber" VARCHAR(50) NOT NULL,
        "productName" VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        "completedQuantity" INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        progress INTEGER NOT NULL DEFAULT 0,
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        priority VARCHAR(20) DEFAULT 'medium',
        "assignedTo" VARCHAR(255),
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table production_orders créée');
    
    // Créer un index pour améliorer les performances
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_production_orders_userId ON production_orders("userId");
      CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
    `);
    console.log('✅ Index créés');
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTable();
