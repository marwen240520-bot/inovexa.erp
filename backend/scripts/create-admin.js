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
    
    // Vérifier si la table users existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ La table users n\'existe pas, création...');
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          "companyName" VARCHAR(255),
          phone VARCHAR(50),
          role VARCHAR(50) DEFAULT 'client',
          "subscriptionStart" TIMESTAMP,
          "subscriptionEnd" TIMESTAMP,
          "isActive" BOOLEAN DEFAULT true,
          modules TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table users créée');
    }
    
    // Vérifier si l'admin existe déjà
    const adminCheck = await client.query(`
      SELECT * FROM users WHERE email = 'marwen2405@gmail.com'
    `);
    
    if (adminCheck.rows.length > 0) {
      console.log('✅ Le compte admin existe déjà !');
      console.log('📧 Email: marwen2405@gmail.com');
      console.log('🔑 Mot de passe: 123456');
      await client.end();
      return;
    }
    
    // Créer l'admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true]);
    
    console.log('✅ Compte admin créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: marwen2405@gmail.com');
    console.log('🔑 Mot de passe: 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAdmin();
