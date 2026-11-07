const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function insertProjects() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Récupérer l'ID de l'admin
    const adminRes = await client.query(`SELECT id FROM users WHERE email = 'marwen2405@gmail.com' LIMIT 1`);
    let userId = 1;
    
    if (adminRes.rows.length > 0) {
      userId = adminRes.rows[0].id;
      console.log(`✅ ID utilisateur trouvé: ${userId}`);
    } else {
      console.log(`⚠️ Admin non trouvé, utilisation de userId = 1`);
    }
    
    // Vérifier si des projets existent déjà
    const existingProjects = await client.query(`SELECT COUNT(*) FROM projects`);
    const count = parseInt(existingProjects.rows[0].count);
    
    if (count === 0) {
      // Ajouter des projets de test
      await client.query(`
        INSERT INTO projects (name, department, budget, cost, status, "userId", "createdAt", "updatedAt")
        VALUES 
          ('Site Web Corpo', 'Marketing', 50000, 35000, 'active', $1, NOW(), NOW()),
          ('Application Mobile', 'IT', 80000, 60000, 'active', $1, NOW(), NOW()),
          ('Campagne Publicitaire', 'Marketing', 30000, 28000, 'completed', $1, NOW(), NOW()),
          ('Nouveau Logiciel ERP', 'IT', 120000, 95000, 'active', $1, NOW(), NOW()),
          ('Formation Personnel', 'RH', 25000, 22000, 'completed', $1, NOW(), NOW()),
          ('Rénovation Locaux', 'Administration', 45000, 48000, 'active', $1, NOW(), NOW()),
          ('Migration Cloud', 'IT', 60000, 45000, 'planning', $1, NOW(), NOW()),
          ('Événement Client', 'Marketing', 35000, 32000, 'completed', $1, NOW(), NOW())
      `, [userId]);
      console.log('✅ 8 projets de test ajoutés');
    } else {
      console.log(`✅ ${count} projets déjà existants`);
    }
    
    // Afficher les projets
    const result = await client.query(`SELECT id, name, department, budget, cost, status FROM projects`);
    console.log('\n📋 Liste des projets:');
    console.log('─'.repeat(60));
    result.rows.forEach(proj => {
      console.log(`ID: ${proj.id} | ${proj.name} | ${proj.department} | Budget: ${proj.budget}€ | Coût: ${proj.cost}€ | Statut: ${proj.status}`);
    });
    console.log('─'.repeat(60));
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

insertProjects();
