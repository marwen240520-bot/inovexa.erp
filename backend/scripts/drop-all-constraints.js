const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

const tables = ['suppliers', 'invoices', 'employees', 'products', 'orders', 'sales', 'purchases', 'clients', 'shipments', 'production_orders', 'transporteurs', 'expenses'];

async function dropAllConstraints() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    for (const table of tables) {
      try {
        // Récupérer les contraintes FK
        const constraints = await client.query(`
          SELECT conname 
          FROM pg_constraint 
          WHERE conrelid = $1::regclass 
          AND contype = 'f'
        `, [table]);
        
        for (const constraint of constraints.rows) {
          await client.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${constraint.conname}`);
          console.log(`✅ Contrainte ${constraint.conname} supprimée de ${table}`);
        }
      } catch (e) {
        console.log(`⚠️ Table ${table} non trouvée ou pas de contrainte`);
      }
    }
    
    await client.end();
    console.log('✅ Toutes les contraintes supprimées');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

dropAllConstraints();
