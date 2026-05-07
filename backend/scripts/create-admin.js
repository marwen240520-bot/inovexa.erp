const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function createAdmin() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si l'admin existe déjà
    const checkAdmin = await client.query(`
      SELECT * FROM users WHERE email = 'marwen2405@gmail.com'
    `);
    
    if (checkAdmin.rows.length > 0) {
      console.log('✅ Le compte admin existe déjà !');
      console.log('📧 Email: marwen2405@gmail.com');
      console.log('🔑 Mot de passe: 123456');
      await client.end();
      return;
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Créer l'admin
    await client.query(`
      INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true]);
    
    console.log('✅ Compte admin créé avec succès !');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              👑 COMPTE ADMIN CRÉÉ AVEC SUCCÈS !              ║');
    console.log('║                                                              ║');
    console.log('║  📧 Email : marwen2405@gmail.com                             ║');
    console.log('║  🔑 Mot de passe : 123456                                    ║');
    console.log('║                                                              ║');
    console.log('║  🌐 http://localhost:3000/auth/login                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAdmin();
