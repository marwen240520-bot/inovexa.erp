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
    
    // Terminer toutes les connexions actives
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'inovexa_erp'
      AND pid <> pg_backend_pid()
    `);
    console.log('✅ Connexions terminées');
    
    // Supprimer la base si elle existe
    await client.query(`DROP DATABASE IF EXISTS inovexa_erp`);
    console.log('✅ Ancienne base supprimée');
    
    // Créer une nouvelle base
    await client.query(`CREATE DATABASE inovexa_erp`);
    console.log('✅ Nouvelle base créée');
    
    await client.end();
    
    // Se connecter à la nouvelle base
    const dbConfig = { ...config, database: 'inovexa_erp' };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ Connecté à inovexa_erp');
    
    // Créer la table users avec toutes les colonnes
    await dbClient.query(`
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
    
    // Créer l'utilisateur admin
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
    console.log('║              ✅ BASE DE DONNÉES RECRÉÉE AVEC SUCCÈS !         ║');
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
