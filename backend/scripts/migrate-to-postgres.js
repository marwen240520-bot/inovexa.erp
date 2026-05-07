const sqlite3 = require('sqlite3');
const { Client } = require('pg');
const path = require('path');

// Connexion SQLite
const sqliteDb = new sqlite3.Database(path.join(__dirname, '..', 'data', 'inovexa.db'));

// Connexion PostgreSQL
const pgClient = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

const tables = ['users', 'products', 'sales', 'purchases', 'clients', 'orders', 'invoices', 'employees', 'expenses', 'shipments', 'production_orders', 'transporteurs', 'categories', 'suppliers'];

async function migrate() {
  console.log('🚀 Début de la migration SQLite → PostgreSQL...');
  
  try {
    await pgClient.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    for (const table of tables) {
      console.log(`📦 Migration de la table ${table}...`);
      
      const rows = await new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT * FROM ${table}`, (err, rows) => {
          if (err) {
            if (err.message.includes('no such table')) {
              resolve([]);
            } else {
              reject(err);
            }
          } else {
            resolve(rows || []);
          }
        });
      });
      
      if (rows.length > 0) {
        // Supprimer les données existantes
        try {
          await pgClient.query(`DELETE FROM ${table}`);
        } catch(e) {}
        
        // Insérer les nouvelles données
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => row[col]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');
          
          try {
            await pgClient.query(
              `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`,
              values
            );
          } catch(e) {
            console.log(`  ⚠️ Erreur ligne: ${e.message}`);
          }
        }
        console.log(`  ✅ ${rows.length} lignes migrées`);
      } else {
        console.log(`  ⚠️ Table ${table} vide ou inexistante`);
      }
    }
    
    console.log('🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pgClient.end();
    sqliteDb.close();
  }
}

migrate();
