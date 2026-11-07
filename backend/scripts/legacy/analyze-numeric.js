const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function analyze() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // Vérifier toutes les colonnes numeric
    const result = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE data_type IN ('numeric', 'decimal') 
      AND table_schema = 'public'
      ORDER BY table_name, column_name
    `);

    console.log('📊 Colonnes NUMERIC trouvées:\n');
    for (const row of result.rows) {
      console.log(`   ${row.table_name}.${row.column_name}: ${row.data_type} (precision: ${row.numeric_precision || 'N/A'}, scale: ${row.numeric_scale || 'N/A'})`);
    }

    // Vérifier les valeurs problématiques
    const tables = ['products', 'sales', 'purchases', 'orders', 'invoices', 'expenses', 'shipments'];
    
    console.log('\n🔍 Vérification des valeurs extrêmes...\n');
    
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT 
            COUNT(*) as total,
            MIN(price) as min_price,
            MAX(price) as max_price,
            MIN(total) as min_total,
            MAX(total) as max_total,
            MIN(amount) as min_amount,
            MAX(amount) as max_amount
          FROM "${table}"
        `);
        
        if (result.rows.length > 0) {
          const r = result.rows[0];
          console.log(`📄 ${table}:`);
          if (r.min_price !== null) console.log(`   price: ${r.min_price} → ${r.max_price}`);
          if (r.min_total !== null) console.log(`   total: ${r.min_total} → ${r.max_total}`);
          if (r.min_amount !== null) console.log(`   amount: ${r.min_amount} → ${r.max_amount}`);
        }
      } catch(e) {
        // Ignorer
      }
    }

    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
  }
}

analyze();
