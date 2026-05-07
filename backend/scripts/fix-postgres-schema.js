const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

async function fixSchema() {
  // Supprimer et recréer la base
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Terminer les connexions
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'inovexa_erp'
      AND pid <> pg_backend_pid()
    `);
    
    // Supprimer la base
    await client.query(`DROP DATABASE IF EXISTS inovexa_erp`);
    console.log('✅ Ancienne base supprimée');
    
    // Recréer la base
    await client.query(`CREATE DATABASE inovexa_erp`);
    console.log('✅ Nouvelle base créée');
    
    await client.end();
    
    // Se connecter à la nouvelle base
    const dbConfig = { ...config, database: 'inovexa_erp' };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ Connecté à inovexa_erp');
    
    // Créer la table users
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
    
    // Créer la table products (avec userId et categoryId)
    await dbClient.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "categoryId" INTEGER,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table products créée');
    
    // Créer la table sales
    await dbClient.query(`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "clientName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        "unitPrice" DECIMAL(10,2),
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table sales créée');
    
    // Créer la table purchases
    await dbClient.query(`
      CREATE TABLE purchases (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "supplierName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        "unitPrice" DECIMAL(10,2),
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table purchases créée');
    
    // Créer la table orders
    await dbClient.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "clientName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        "unitPrice" DECIMAL(10,2),
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table orders créée');
    
    // Créer la table clients
    await dbClient.query(`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        "totalSpent" DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table clients créée');
    
    // Créer la table invoices
    await dbClient.query(`
      CREATE TABLE invoices (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "clientName" VARCHAR(255),
        amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "dueDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table invoices créée');
    
    // Créer la table employees
    await dbClient.query(`
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        department VARCHAR(255),
        salary DECIMAL(10,2) DEFAULT 0,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        "hireDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table employees créée');
    
    // Créer la table expenses
    await dbClient.query(`
      CREATE TABLE expenses (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        category VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table expenses créée');
    
    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    await dbClient.query(`
      INSERT INTO users (email, password, name, role, "isActive")
      VALUES ($1, $2, $3, $4, $5)
    `, ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true]);
    console.log('✅ Compte admin créé');
    
    // Créer un client de test
    const hashedClientPassword = await bcrypt.hash('client123', 10);
    await dbClient.query(`
      INSERT INTO users (email, password, name, "companyName", phone, role, "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, ['client@test.com', hashedClientPassword, 'Client Test', 'Test SARL', '0612345678', 'client', true]);
    console.log('✅ Compte client de test créé');
    
    await dbClient.end();
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ BASE POSTGRESQL CORRIGÉE !                    ║');
    console.log('║                                                              ║');
    console.log('║  🔐 COMPTES :                                                ║');
    console.log('║     ADMIN  : marwen2405@gmail.com / 123456                   ║');
    console.log('║     CLIENT : client@test.com / client123                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixSchema();
