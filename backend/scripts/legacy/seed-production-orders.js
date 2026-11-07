const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function seedProductionOrders() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    const adminRes = await client.query(`SELECT id FROM users WHERE email = 'marwen2405@gmail.com'`);
    const userId = adminRes.rows[0]?.id || 1;
    
    const existing = await client.query(`SELECT COUNT(*) FROM production_orders`);
    
    if (parseInt(existing.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO production_orders ("userId", "orderNumber", "productName", quantity, "completedQuantity", status, progress, priority, "assignedTo", "startDate", "createdAt", "updatedAt")
        VALUES 
          ($1, 'PO-0001', 'Produit Premium', 100, 100, 'completed', 100, 'high', 'Jean Dupont', NOW() - INTERVAL '30 days', NOW(), NOW()),
          ($1, 'PO-0002', 'Produit Standard', 50, 30, 'in_progress', 60, 'medium', 'Marie Martin', NOW() - INTERVAL '15 days', NOW(), NOW()),
          ($1, 'PO-0003', 'Produit Éco', 200, 0, 'pending', 0, 'low', NULL, NOW(), NOW(), NOW()),
          ($1, 'PO-0004', 'Produit Luxe', 75, 75, 'completed', 100, 'high', 'Pierre Durand', NOW() - INTERVAL '45 days', NOW(), NOW())
      `, [userId]);
      console.log('✅ Ordres de fabrication de test ajoutés');
    } else {
      console.log('✅ Ordres déjà existants');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

seedProductionOrders();
