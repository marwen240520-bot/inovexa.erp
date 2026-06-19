const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function createMissingTables() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    // ========== TABLE SHIPMENTS ==========
    console.log('📋 Création table Shipments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        "clientId" INTEGER NOT NULL,
        "transporteurId" INTEGER,
        "trackingNumber" VARCHAR(255) UNIQUE NOT NULL,
        "clientName" VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        carrier VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        "estimatedDelivery" DATE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table shipments créée');
    
    // ========== TABLE PRODUCTION_ORDERS ==========
    console.log('\n📋 Création table Production Orders...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS production_orders (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
        "productName" VARCHAR(255) NOT NULL,
        "productId" INTEGER,
        quantity INTEGER DEFAULT 1,
        "completedQuantity" INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        priority VARCHAR(50) DEFAULT 'medium',
        "startDate" DATE,
        "endDate" DATE,
        "assignedTo" VARCHAR(255),
        notes TEXT,
        cost DECIMAL(10,2) DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table production_orders créée');
    
    // ========== TABLE EMPLOYEES ==========
    console.log('\n📋 Création table Employees...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        position VARCHAR(255),
        department VARCHAR(255),
        salary DECIMAL(10,2) DEFAULT 0,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        "hireDate" DATE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table employees créée');
    
    // ========== TABLE TRANSPORTEURS ==========
    console.log('\n📋 Création table Transporteurs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS transporteurs (
        id SERIAL PRIMARY KEY,
        "clientId" INTEGER NOT NULL,
        "userId" INTEGER,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        "companyName" VARCHAR(255),
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table transporteurs créée');
    
    // ========== TABLE IA_CHATS ==========
    console.log('\n📋 Création table IA Chats...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ia_chats (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table ia_chats créée');
    
    // ========== TABLE DEPARTMENTS ==========
    console.log('\n📋 Création table Departments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table departments créée');
    
    // ========== TABLE PROJECTS ==========
    console.log('\n📋 Création table Projects...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        "startDate" DATE,
        "endDate" DATE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table projects créée');
    
    // ========== TABLE ANALYTICS ==========
    console.log('\n📋 Création table Analytics...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        data JSONB,
        period VARCHAR(50),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ table analytics créée');
    
    console.log('\n✅ Toutes les tables manquantes ont été créées !');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createMissingTables();
