const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

async function initDatabase() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Créer la base de données si elle n'existe pas
    await client.query(`CREATE DATABASE IF NOT EXISTS inovexa_erp`);
    console.log('✅ Base de données inovexa_erp créée');
    
    await client.end();
    
    // Se connecter à la nouvelle base de données
    const dbConfig = { ...config, database: 'inovexa_erp' };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    
    // Créer les tables
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
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
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table users créée');
    
    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    await dbClient.query(`
      INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true]);
    console.log('✅ Compte admin créé');
    
    await dbClient.end();
    console.log('✅ Initialisation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

initDatabase();
