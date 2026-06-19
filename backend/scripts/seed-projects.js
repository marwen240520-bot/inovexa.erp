const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function seedProjects() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Récupérer l'ID de l'admin
    const adminRes = await client.query(`SELECT id FROM users WHERE email = 'marwen2405@gmail.com'`);
    const userId = adminRes.rows[0]?.id || 1;
    
    // Vérifier si des projets existent déjà
    const existingProjects = await client.query(`SELECT COUNT(*) FROM projects`);
    
    if (parseInt(existingProjects.rows[0].count) === 0) {
      // Ajouter des projets de test
      await client.query(`
        INSERT INTO projects (name, department, budget, cost, status, "userId", "createdAt", "updatedAt")
        VALUES 
          ('Site Web', 'Marketing', 50000, 35000, 'active', $1, NOW(), NOW()),
          ('Application Mobile', 'IT', 80000, 60000, 'active', $1, NOW(), NOW()),
          ('Campagne Publicitaire', 'Marketing', 30000, 28000, 'completed', $1, NOW(), NOW()),
          ('Nouveau Logiciel ERP', 'IT', 120000, 95000, 'active', $1, NOW(), NOW()),
          ('Formation Personnel', 'RH', 25000, 22000, 'completed', $1, NOW(), NOW()),
          ('Rénovation Locaux', 'Administration', 45000, 48000, 'active', $1, NOW(), NOW())
      `, [userId]);
      console.log('✅ Projets de test ajoutés');
    } else {
      console.log('✅ Projets déjà existants');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

seedProjects();
