const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function convertAllDates() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Récupérer toutes les colonnes de type date
    const columns = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE data_type IN ('date', 'timestamp', 'timestamp without time zone')
    `);
    
    console.log(`📋 ${columns.rows.length} colonne(s) à convertir`);
    
    for (const col of columns.rows) {
      try {
        // Convertir la colonne en TEXT
        await client.query(`
          ALTER TABLE "${col.table_name}" 
          ALTER COLUMN "${col.column_name}" TYPE TEXT
        `);
        console.log(`✅ ${col.table_name}.${col.column_name} converti en TEXT`);
      } catch(e) {
        console.log(`⚠️ ${col.table_name}.${col.column_name}: ${e.message}`);
      }
    }
    
    // Mettre à jour les valeurs vides ou invalides
    const tables = ['users', 'employees', 'clients', 'products', 'orders', 'invoices', 'sales', 'purchases'];
    
    for (const table of tables) {
      try {
        await client.query(`
          UPDATE "${table}" 
          SET created_at = NULL, updated_at = NULL
          WHERE created_at = '' OR created_at::text LIKE '%NaN%' OR created_at IS NULL
        `);
      } catch(e) {
        // Ignorer les erreurs si la colonne n'existe pas
      }
    }
    
    console.log('✅ Conversion terminée');
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

convertAllDates();
