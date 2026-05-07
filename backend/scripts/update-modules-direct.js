const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

const defaultModules = {
  dashboard: true, products: true, categories: true, stock: true,
  sales: true, purchases: true, orders: true, clients: true,
  suppliers: true, invoices: true, hr: true, finance: true,
  logistics: true, production: true, ai: true, reports: true,
  analytics: true, profile: true, settings: true
};

async function updateModules() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // 1. Vérifier si la colonne modules existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'modules'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('⚠️ La colonne modules n\'existe pas, création...');
      await client.query(`ALTER TABLE users ADD COLUMN modules TEXT`);
      console.log('✅ Colonne modules créée');
    }
    
    // 2. Mettre à jour tous les clients
    const result = await client.query(`
      UPDATE users 
      SET modules = $1 
      WHERE role = 'client' AND (modules IS NULL OR modules = '')
      RETURNING id, email, name
    `, [JSON.stringify(defaultModules)]);
    
    console.log(`\n✅ ${result.rowCount} client(s) mis à jour avec les modules par défaut`);
    
    // 3. Afficher le résultat
    const finalResult = await client.query(`
      SELECT id, email, name, modules 
      FROM users 
      WHERE role = 'client'
    `);
    
    console.log('\n📊 État des clients:');
    console.log('─'.repeat(60));
    for (const user of finalResult.rows) {
      const modules = user.modules ? JSON.parse(user.modules) : null;
      const moduleCount = modules ? Object.keys(modules).length : 0;
      console.log(`✅ ${user.name} (${user.email}): ${moduleCount} modules`);
    }
    console.log('─'.repeat(60));
    
    await client.end();
    console.log('\n✅ Mise à jour terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

updateModules();
