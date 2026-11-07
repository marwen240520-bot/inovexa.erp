const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function showSchema() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    // 1. Lister toutes les tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesRes.rows;
    console.log(`📋 ${tables.length} TABLE(S) DANS LA BASE :\n`);
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`║ 📁 TABLE: ${tableName}`);
      console.log(`║ ┌─────────────────────────────────────────────────────────────────────────┐ ║`);
      
      // Récupérer les colonnes de la table
      const columnsRes = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      const columns = columnsRes.rows;
      
      for (const col of columns) {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? `DEFAULT: ${col.column_default}` : '';
        console.log(`║ │ ${col.column_name.padEnd(25)} │ ${col.data_type.padEnd(15)} │ ${nullable.padEnd(8)} │ ${defaultVal}`);
      }
      
      // Compter le nombre de lignes
      const countRes = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const rowCount = parseInt(countRes.rows[0].count);
      
      console.log(`║ └─────────────────────────────────────────────────────────────────────────┘ ║`);
      console.log(`║ 📊 ${rowCount} ligne(s) dans cette table`);
      console.log(`║`);
    }
    
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    
    // 2. Résumé des tables avec leur nombre de lignes
    console.log(`\n📊 RÉSUMÉ DES TABLES :\n`);
    console.log('┌──────────────────────────────────┬─────────────┐');
    console.log(`│ Nom de la table                   │ Nb lignes   │`);
    console.log('├──────────────────────────────────┼─────────────┤');
    
    for (const table of tables) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
      const rowCount = parseInt(countRes.rows[0].count);
      console.log(`│ ${table.table_name.padEnd(32)} │ ${String(rowCount).padStart(11)} │`);
    }
    
    console.log('└──────────────────────────────────┴─────────────┘');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

showSchema();
