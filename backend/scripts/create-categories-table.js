const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function createCategoriesTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Créer la table categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table categories créée');
    
    // Ajouter quelques catégories par défaut
    await client.query(`
      INSERT INTO categories ("userId", name, description)
      VALUES 
        (1, 'Électronique', 'Produits électroniques'),
        (1, 'Vêtements', 'Mode et accessoires'),
        (1, 'Maison', 'Décoration et mobilier'),
        (1, 'Sports', 'Équipements sportifs'),
        (1, 'Livres', 'Livres et magazines')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Catégories par défaut ajoutées');
    
    await client.end();
    console.log('✅ Table categories prête');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createCategoriesTable();
