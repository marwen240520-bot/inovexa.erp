const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addColumnsSafe() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    // ========== TABLE USERS ==========
    console.log('📋 Vérification table Users...');
    
    // Vérifier et ajouter theme
    const themeCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='theme'
    `);
    if (themeCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN theme VARCHAR(50) DEFAULT 'dark'`);
      console.log('  ✅ colonne theme ajoutée');
    } else {
      console.log('  ✅ colonne theme existe déjà');
    }
    
    // Vérifier et ajouter profileImage
    const profileImageCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='profileImage'
    `);
    if (profileImageCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN "profileImage" TEXT`);
      console.log('  ✅ colonne profileImage ajoutée');
    } else {
      console.log('  ✅ colonne profileImage existe déjà');
    }
    
    // Vérifier et ajouter modules
    const modulesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='modules'
    `);
    if (modulesCheck.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN modules TEXT`);
      console.log('  ✅ colonne modules ajoutée');
    } else {
      console.log('  ✅ colonne modules existe déjà');
    }
    
    // ========== TABLE SALES ==========
    console.log('\n📋 Vérification table Sales...');
    const clientIdCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='sales' AND column_name='clientId'
    `);
    if (clientIdCheck.rows.length === 0) {
      await client.query(`ALTER TABLE sales ADD COLUMN "clientId" INTEGER`);
      console.log('  ✅ colonne clientId ajoutée');
    } else {
      console.log('  ✅ colonne clientId existe déjà');
    }
    
    // ========== TABLE ORDERS ==========
    console.log('\n📋 Vérification table Orders...');
    const unitPriceCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='unitPrice'
    `);
    if (unitPriceCheck.rows.length === 0) {
      await client.query(`ALTER TABLE orders ADD COLUMN "unitPrice" DECIMAL(10,2) DEFAULT 0`);
      console.log('  ✅ colonne unitPrice ajoutée');
    } else {
      console.log('  ✅ colonne unitPrice existe déjà');
    }
    
    // ========== TABLE INVOICES ==========
    console.log('\n📋 Vérification table Invoices...');
    const referenceCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='invoices' AND column_name='reference'
    `);
    if (referenceCheck.rows.length === 0) {
      await client.query(`ALTER TABLE invoices ADD COLUMN reference VARCHAR(50)`);
      console.log('  ✅ colonne reference ajoutée');
    } else {
      console.log('  ✅ colonne reference existe déjà');
    }
    
    // ========== TABLE PRODUCTS ==========
    console.log('\n📋 Vérification table Products...');
    const categoryIdCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='products' AND column_name='categoryId'
    `);
    if (categoryIdCheck.rows.length === 0) {
      await client.query(`ALTER TABLE products ADD COLUMN "categoryId" INTEGER`);
      console.log('  ✅ colonne categoryId ajoutée');
    } else {
      console.log('  ✅ colonne categoryId existe déjà');
    }
    
    // ========== TABLE SHIPMENTS ==========
    console.log('\n📋 Vérification table Shipments...');
    const transporteurIdCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='shipments' AND column_name='transporteurId'
    `);
    if (transporteurIdCheck.rows.length === 0) {
      await client.query(`ALTER TABLE shipments ADD COLUMN "transporteurId" INTEGER`);
      console.log('  ✅ colonne transporteurId ajoutée');
    } else {
      console.log('  ✅ colonne transporteurId existe déjà');
    }
    
    // ========== TABLE PRODUCTION_ORDERS ==========
    console.log('\n📋 Vérification table Production Orders...');
    const costCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='production_orders' AND column_name='cost'
    `);
    if (costCheck.rows.length === 0) {
      await client.query(`ALTER TABLE production_orders ADD COLUMN cost DECIMAL(10,2) DEFAULT 0`);
      console.log('  ✅ colonne cost ajoutée');
    } else {
      console.log('  ✅ colonne cost existe déjà');
    }
    
    const assignedToCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='production_orders' AND column_name='assignedTo'
    `);
    if (assignedToCheck.rows.length === 0) {
      await client.query(`ALTER TABLE production_orders ADD COLUMN "assignedTo" VARCHAR(255)`);
      console.log('  ✅ colonne assignedTo ajoutée');
    } else {
      console.log('  ✅ colonne assignedTo existe déjà');
    }
    
    const notesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='production_orders' AND column_name='notes'
    `);
    if (notesCheck.rows.length === 0) {
      await client.query(`ALTER TABLE production_orders ADD COLUMN notes TEXT`);
      console.log('  ✅ colonne notes ajoutée');
    } else {
      console.log('  ✅ colonne notes existe déjà');
    }
    
    // ========== TABLE EMPLOYEES ==========
    console.log('\n📋 Vérification table Employees...');
    const departmentCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='employees' AND column_name='department'
    `);
    if (departmentCheck.rows.length === 0) {
      await client.query(`ALTER TABLE employees ADD COLUMN department VARCHAR(255)`);
      console.log('  ✅ colonne department ajoutée');
    } else {
      console.log('  ✅ colonne department existe déjà');
    }
    
    const hireDateCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='employees' AND column_name='hireDate'
    `);
    if (hireDateCheck.rows.length === 0) {
      await client.query(`ALTER TABLE employees ADD COLUMN "hireDate" DATE`);
      console.log('  ✅ colonne hireDate ajoutée');
    } else {
      console.log('  ✅ colonne hireDate existe déjà');
    }
    
    // ========== TABLE CATEGORIES ==========
    console.log('\n📋 Vérification table Categories...');
    const userIdCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='categories' AND column_name='userId'
    `);
    if (userIdCheck.rows.length === 0) {
      await client.query(`ALTER TABLE categories ADD COLUMN "userId" INTEGER`);
      console.log('  ✅ colonne userId ajoutée');
    } else {
      console.log('  ✅ colonne userId existe déjà');
    }
    
    console.log('\n✅ Toutes les colonnes ont été vérifiées !');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addColumnsSafe();
