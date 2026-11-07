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
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "clientName" VARCHAR(255),
        "clientId" INTEGER,
        "productName" VARCHAR(255),
        "productId" INTEGER,
        quantity INTEGER DEFAULT 1,
        "unitPrice" DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table orders créée');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTable();
