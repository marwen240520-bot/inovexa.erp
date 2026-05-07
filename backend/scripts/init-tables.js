const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

async function initTables() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer la base si elle existe
    await client.query(`DROP DATABASE IF EXISTS inovexa_erp`);
    console.log('✅ Base supprimée');
    
    // Créer la base
    await client.query(`CREATE DATABASE inovexa_erp`);
    console.log('✅ Base créée');
    
    await client.end();
    
    // Se connecter à la nouvelle base
    const dbConfig = { ...config, database: 'inovexa_erp' };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ Connecté à inovexa_erp');
    
    // Créer la table users
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
        modules TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table users créée');
    
    // Créer la table products
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        price DECIMAL(10,2),
        quantity INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table products créée');
    
    // Créer la table sales
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "clientName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER,
        total DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table sales créée');
    
    // Créer l'admin
    const hashedAdminPassword = await bcrypt.hash('123456', 10);
    await dbClient.query(`
      INSERT INTO users (email, password, name, role, "isActive")
      VALUES ($1, $2, $3, $4, $5)
    `, ['marwen2405@gmail.com', hashedAdminPassword, 'Admin', 'admin', true]);
    console.log('✅ Compte admin créé');
    
    // Créer un client de test
    const hashedClientPassword = await bcrypt.hash('client123', 10);
    await dbClient.query(`
      INSERT INTO users (email, password, name, "companyName", phone, role, "subscriptionStart", "subscriptionEnd", "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, ['client@test.com', hashedClientPassword, 'Client Test', 'Test SARL', '0612345678', 'client', new Date(), new Date(Date.now() + 30*24*60*60*1000), true]);
    console.log('✅ Client de test créé');
    
    await dbClient.end();
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ TABLES CRÉÉES AVEC SUCCÈS !                   ║');
    console.log('║                                                              ║');
    console.log('║  🔐 COMPTES :                                                ║');
    console.log('║     ADMIN  : marwen2405@gmail.com / 123456                   ║');
    console.log('║     CLIENT : client@test.com / client123                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

initTables();
