const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

async function createAllTables() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Créer la base
    await client.query(`CREATE DATABASE inovexa_erp`);
    console.log('✅ Base inovexa_erp créée');
    
    await client.end();
    
    // Se connecter à la nouvelle base
    const dbConfig = { ...config, database: 'inovexa_erp' };
    const dbClient = new Client(dbConfig);
    await dbClient.connect();
    console.log('✅ Connecté à inovexa_erp');
    
    // 1. Table users
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
    
    // 2. Table products
    await dbClient.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        quantity INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table products créée');
    
    // 3. Table categories
    await dbClient.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table categories créée');
    
    // 4. Table sales
    await dbClient.query(`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "clientName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table sales créée');
    
    // 5. Table purchases
    await dbClient.query(`
      CREATE TABLE purchases (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "supplierName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table purchases créée');
    
    // 6. Table orders
    await dbClient.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "clientName" VARCHAR(255),
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 1,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table orders créée');
    
    // 7. Table clients
    await dbClient.query(`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
    
    // 8. Table suppliers
    await dbClient.query(`
      CREATE TABLE suppliers (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        contact VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        "totalPurchases" DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table suppliers créée');
    
    // 9. Table invoices
    await dbClient.query(`
      CREATE TABLE invoices (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "clientName" VARCHAR(255),
        amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        "dueDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table invoices créée');
    
    // 10. Table employees
    await dbClient.query(`
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
    
    // 11. Table expenses
    await dbClient.query(`
      CREATE TABLE expenses (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table expenses créée');
    
    // 12. Table shipments
    await dbClient.query(`
      CREATE TABLE shipments (
        id SERIAL PRIMARY KEY,
        "clientId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "transporteurId" INTEGER,
        "trackingNumber" VARCHAR(255) UNIQUE NOT NULL,
        "clientName" VARCHAR(255),
        address TEXT,
        carrier VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        "estimatedDelivery" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table shipments créée');
    
    // 13. Table production_orders
    await dbClient.query(`
      CREATE TABLE production_orders (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
        "productName" VARCHAR(255),
        quantity INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table production_orders créée');
    
    // 14. Table transporteurs
    await dbClient.query(`
      CREATE TABLE transporteurs (
        id SERIAL PRIMARY KEY,
        "clientId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "userId" INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        "companyName" VARCHAR(255),
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table transporteurs créée');
    
    // 15. Table ia_chats
    await dbClient.query(`
      CREATE TABLE ia_chats (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table ia_chats créée');
    
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
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ TOUTES LES TABLES ONT ÉTÉ CRÉÉES !                       ║');
    console.log('║                                                                              ║');
    console.log('║  📋 TABLES CRÉÉES (15) :                                                      ║');
    console.log('║     users, products, categories, sales, purchases, orders, clients,          ║');
    console.log('║     suppliers, invoices, employees, expenses, shipments, production_orders,  ║');
    console.log('║     transporteurs, ia_chats                                                   ║');
    console.log('║                                                                              ║');
    console.log('║  🔐 COMPTES :                                                                ║');
    console.log('║     ADMIN  : marwen2405@gmail.com / 123456                                   ║');
    console.log('║     CLIENT : client@test.com / client123                                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAllTables();
