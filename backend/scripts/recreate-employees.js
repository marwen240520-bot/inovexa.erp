const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function recreateEmployees() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer la table si elle existe
    await client.query(`DROP TABLE IF EXISTS employees CASCADE`);
    console.log('✅ Ancienne table employees supprimée');
    
    // Recréer la table SANS contrainte de clé étrangère
    await client.query(`
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        department VARCHAR(255),
        salary DECIMAL(10,2) DEFAULT 0,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Nouvelle table employees créée sans contrainte');
    
    // Ajouter un index sur userId
    await client.query(`CREATE INDEX idx_employees_userId ON employees("userId")`);
    console.log('✅ Index créé sur userId');
    
    await client.end();
    console.log('✅ Table employees recréée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

recreateEmployees();
