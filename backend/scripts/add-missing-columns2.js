const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addMissingColumns() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    // ========== TABLE SALES - Ajouter notes ==========
    console.log('📋 Vérification table Sales...');
    const notesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='sales' AND column_name='notes'
    `);
    if (notesCheck.rows.length === 0) {
      await client.query(`ALTER TABLE sales ADD COLUMN notes TEXT`);
      console.log('  ✅ colonne notes ajoutée à la table sales');
    } else {
      console.log('  ✅ colonne notes existe déjà dans sales');
    }
    
    // ========== TABLE INVOICES - Ajouter operationNumber ==========
    console.log('\n📋 Vérification table Invoices...');
    const operationNumberCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='invoices' AND column_name='operationNumber'
    `);
    if (operationNumberCheck.rows.length === 0) {
      await client.query(`ALTER TABLE invoices ADD COLUMN "operationNumber" VARCHAR(50)`);
      console.log('  ✅ colonne operationNumber ajoutée à la table invoices');
    } else {
      console.log('  ✅ colonne operationNumber existe déjà dans invoices');
    }
    
    // ========== TABLE INVOICES - Ajouter notes si besoin ==========
    const invoiceNotesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='invoices' AND column_name='notes'
    `);
    if (invoiceNotesCheck.rows.length === 0) {
      await client.query(`ALTER TABLE invoices ADD COLUMN notes TEXT`);
      console.log('  ✅ colonne notes ajoutée à la table invoices');
    } else {
      console.log('  ✅ colonne notes existe déjà dans invoices');
    }
    
    // ========== TABLE PURCHASES - Ajouter notes si besoin ==========
    console.log('\n📋 Vérification table Purchases...');
    const purchaseNotesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='purchases' AND column_name='notes'
    `);
    if (purchaseNotesCheck.rows.length === 0) {
      await client.query(`ALTER TABLE purchases ADD COLUMN notes TEXT`);
      console.log('  ✅ colonne notes ajoutée à la table purchases');
    } else {
      console.log('  ✅ colonne notes existe déjà dans purchases');
    }
    
    // ========== TABLE ORDERS - Ajouter notes si besoin ==========
    console.log('\n📋 Vérification table Orders...');
    const orderNotesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='notes'
    `);
    if (orderNotesCheck.rows.length === 0) {
      await client.query(`ALTER TABLE orders ADD COLUMN notes TEXT`);
      console.log('  ✅ colonne notes ajoutée à la table orders');
    } else {
      console.log('  ✅ colonne notes existe déjà dans orders');
    }
    
    console.log('\n✅ Toutes les colonnes ont été ajoutées avec succès !');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addMissingColumns();
