const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

async function resetDatabase() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Supprimer l'ancienne base de données si elle existe
    await client.query(`DROP DATABASE IF EXISTS inovexa_erp`);
    console.log('✅ Ancienne base supprimée');
    
    // Créer une nouvelle base de données
    await client.query(`CREATE DATABASE inovexa_erp`);
    console.log('✅ Nouvelle base créée');
    
    await client.end();
    
    // Se connecter à la nouvelle base
    const dbConfig = { ...config, database: 'inovexa_erp' };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ Connecté à inovexa_erp');
    
    // Créer la table users avec les bonnes colonnes
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
    
    // Créer l'admin
    const hashedAdminPassword = await bcrypt.hash('123456', 10);
    await dbClient.query(`
      INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['marwen2405@gmail.com', hashedAdminPassword, 'Admin', 'admin', true]);
    console.log('✅ Admin créé');
    
    // Créer un client de test
    const hashedClientPassword = await bcrypt.hash('client123', 10);
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    
    await dbClient.query(`
      INSERT INTO users (email, password, name, "companyName", phone, role, "subscriptionStart", "subscriptionEnd", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['client@test.com', hashedClientPassword, 'Client Test', 'Test SARL', '0612345678', 'client', new Date(), subscriptionEnd, true]);
    console.log('✅ Client de test créé');
    
    await dbClient.end();
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ BASE DE DONNÉES POSTGRESQL PRÊTE !           ║');
    console.log('║                                                              ║');
    console.log('║  🔐 COMPTES :                                                ║');
    console.log('║     ADMIN  : marwen2405@gmail.com / 123456                   ║');
    console.log('║     CLIENT : client@test.com / client123                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

resetDatabase();
