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
    console.log('✅ Connecté à PostgreSQL\n');
    
    // Créer la table categories
    console.log('📋 Création table Categories...');
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
    console.log('  ✅ table categories créée');
    
    // Ajouter quelques catégories par défaut
    console.log('\n📋 Ajout de catégories par défaut...');
    
    const defaultCategories = [
      { name: 'Électronique', description: 'Produits électroniques' },
      { name: 'Vêtements', description: 'Mode et accessoires' },
      { name: 'Maison', description: 'Décoration et mobilier' },
      { name: 'Sports', description: 'Articles de sport' },
      { name: 'Livres', description: 'Livres et magazines' }
    ];
    
    for (const cat of defaultCategories) {
      await client.query(`
        INSERT INTO categories (name, description, "userId")
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `, [cat.name, cat.description, 1]);
    }
    console.log('  ✅ catégories par défaut ajoutées');
    
    console.log('\n✅ Table categories prête !');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createCategoriesTable();
