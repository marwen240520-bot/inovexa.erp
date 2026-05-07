const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

// Liste complète des modules
const defaultModules = {
  dashboard: true,
  products: true,
  categories: true,
  stock: true,
  sales: true,
  purchases: true,
  orders: true,
  clients: true,
  suppliers: true,
  invoices: true,
  hr: true,
  finance: true,
  logistics: true,
  production: true,
  ai: true,
  reports: true,
  analytics: true,
  profile: true,
  settings: true
};

async function initModules() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Récupérer tous les clients
    const res = await client.query(`
      SELECT id, email, name, modules 
      FROM users 
      WHERE role = 'client'
    `);
    
    console.log(`📋 ${res.rows.length} client(s) trouvé(s)\n`);
    
    let updatedCount = 0;
    
    for (const user of res.rows) {
      let needsUpdate = false;
      let modules = user.modules;
      
      if (!modules) {
        // Pas de modules, on initialise
        modules = defaultModules;
        needsUpdate = true;
        console.log(`🆕 Client ${user.name} (${user.email}): initialisation des modules`);
      } else {
        // Vérifier si des modules sont manquants
        let currentModules = JSON.parse(modules);
        let hasMissing = false;
        
        for (const [key, value] of Object.entries(defaultModules)) {
          if (currentModules[key] === undefined) {
            currentModules[key] = value;
            hasMissing = true;
          }
        }
        
        if (hasMissing) {
          modules = currentModules;
          needsUpdate = true;
          console.log(`🔄 Client ${user.name} (${user.email}): ajout des modules manquants`);
        }
      }
      
      if (needsUpdate) {
        await client.query(`
          UPDATE users 
          SET modules = $1 
          WHERE id = $2
        `, [JSON.stringify(modules), user.id]);
        updatedCount++;
      }
    }
    
    console.log(`\n✅ ${updatedCount} client(s) mis à jour`);
    
    // Afficher le résultat
    const finalRes = await client.query(`
      SELECT id, email, name, modules 
      FROM users 
      WHERE role = 'client'
    `);
    
    console.log('\n📊 État final des modules:');
    console.log('─'.repeat(60));
    for (const user of finalRes.rows) {
      const modules = user.modules ? Object.keys(JSON.parse(user.modules)).length : 0;
      console.log(`✅ ${user.name} (${user.email}): ${modules} modules actifs`);
    }
    console.log('─'.repeat(60));
    
    await client.end();
    console.log('\n✅ Initialisation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

initModules();
