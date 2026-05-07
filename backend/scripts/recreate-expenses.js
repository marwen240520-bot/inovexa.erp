const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateExpenses() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS expenses CASCADE`);
    console.log('✅ Ancienne table expenses supprimée');
    
    // Recréer la table
    await client.query(`
      CREATE TABLE expenses (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table expenses créée');
    
    // Ajouter un index
    await client.query(`CREATE INDEX idx_expenses_userId ON expenses("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table expenses recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateExpenses();
