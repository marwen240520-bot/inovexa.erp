const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function fixDatabase() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // 1. Vérifier les tables avec des colonnes UUID
    const tables = ['users', 'products', 'sales', 'purchases', 'orders', 'clients', 'invoices'];
    
    for (const table of tables) {
      try {
        // Vérifier les colonnes de type UUID
        const result = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 AND data_type = 'uuid'
        `, [table]);
        
        if (result.rows.length > 0) {
          console.log(`⚠️ Table ${table} a des colonnes UUID:`, result.rows.map(r => r.column_name).join(', '));
          
          // Convertir UUID en texte ou integer
          for (const row of result.rows) {
            const column = row.column_name;
            console.log(`🔧 Conversion de ${table}.${column} de UUID à TEXT...`);
            
            // Vérifier si la colonne contient des données
            const countResult = await client.query(`SELECT COUNT(*) FROM ${table} WHERE ${column} IS NOT NULL`);
            if (parseInt(countResult.rows[0].count) > 0) {
              // Convertir en texte
              await client.query(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE TEXT USING ${column}::TEXT`);
              console.log(`✅ ${table}.${column} converti en TEXT`);
            }
          }
        }
      } catch(e) {
        // Ignorer les erreurs
      }
    }

    console.log('🎉 Corrections terminées !');
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

fixDatabase();
