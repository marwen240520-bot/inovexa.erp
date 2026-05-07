const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function createTestData() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Vérifier si des produits existent déjà
    const productCheck = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCheck.rows[0].count) === 0) {
      console.log('📦 Création de produits de test...');
      
      // Créer des catégories
      await client.query(`
        INSERT INTO categories (id, "userId", name, description) VALUES 
        (1, 1, 'Électronique', 'Produits électroniques'),
        (2, 1, 'Vêtements', 'Mode et accessoires'),
        (3, 1, 'Maison', 'Décoration et mobilier')
        ON CONFLICT (id) DO NOTHING;
      `);
      
      // Créer des produits
      await client.query(`
        INSERT INTO products (id, "userId", name, sku, price, quantity, "categoryId") VALUES 
        (1, 1, 'iPhone 15 Pro', 'APP-001', 1299, 15, 1),
        (2, 1, 'MacBook Pro', 'APP-002', 2499, 8, 1),
        (3, 1, 'AirPods Pro', 'APP-003', 299, 25, 1),
        (4, 1, 'T-Shirt Premium', 'TEX-001', 49, 45, 2),
        (5, 1, 'Jean Slim', 'TEX-002', 89, 12, 2),
        (6, 1, 'Lampe LED', 'MAI-001', 39, 3, 3),
        (7, 1, 'Coussin Décoratif', 'MAI-002', 29, 7, 3),
        (8, 1, 'Table Basse', 'MAI-003', 199, 2, 3)
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ 8 produits de test créés');
    } else {
      console.log(`✅ ${productCheck.rows[0].count} produits existent déjà`);
    }

    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTestData();
