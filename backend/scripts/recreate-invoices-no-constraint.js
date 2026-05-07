const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateInvoices() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne table
    await client.query(`DROP TABLE IF EXISTS invoices CASCADE`);
    console.log('✅ Ancienne table invoices supprimée');
    
    // Recréer la table sans contrainte de clé étrangère
    await client.query(`
      CREATE TABLE invoices (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "clientName" VARCHAR(255),
        amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "dueDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table invoices créée sans contrainte');
    
    // Ajouter un index sur userId pour les performances
    await client.query(`CREATE INDEX idx_invoices_userId ON invoices("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table invoices recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateInvoices();
