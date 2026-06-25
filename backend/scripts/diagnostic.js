const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function diagnostic() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              📊 DIAGNOSTIC COMPLET DE LA BASE               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 1. Liste de toutes les tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(`📋 ${tables.length} tables trouvées:`);
    console.log('   ' + tables.join(', '));
    console.log('');

    // 2. Analyse de chaque table
    for (const table of tables) {
      console.log(`╔══════════════════════════════════════════════════════════════╗`);
      console.log(`║  📄 TABLE: ${table.padEnd(45)}║`);
      console.log(`╚══════════════════════════════════════════════════════════════╝`);
      
      // 2.1 Structure de la table
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log('\n  📌 STRUCTURE:');
      for (const col of columnsResult.rows) {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
        console.log(`     ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${nullable.padEnd(10)}${defaultVal}`);
      }

      // 2.2 Nombre de lignes
      const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = parseInt(countResult.rows[0].count);
      console.log(`\n  📊 LIGNES: ${count}`);

      // 2.3 Vérifier les valeurs NULL dans les colonnes importantes
      if (count > 0) {
        console.log('\n  ⚠️ VALEURS NULL:');
        for (const col of columnsResult.rows) {
          if (col.column_name.includes('id') && col.is_nullable === 'YES') {
            const nullResult = await client.query(
              `SELECT COUNT(*) FROM "${table}" WHERE "${col.column_name}" IS NULL`
            );
            const nullCount = parseInt(nullResult.rows[0].count);
            if (nullCount > 0) {
              console.log(`     ⚠️ ${col.column_name}: ${nullCount} valeur(s) NULL`);
            }
          }
        }
      }

      // 2.4 Index
      const indexResult = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = $1
      `, [table]);
      
      if (indexResult.rows.length > 0) {
        console.log('\n  🔑 INDEX:');
        for (const idx of indexResult.rows) {
          console.log(`     ${idx.indexname}`);
        }
      }

      console.log('');
    }

    // 3. Synthèse des problèmes
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              🚨 PROBLÈMES DÉTECTÉS                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 3.1 Vérifier les tables vides
    const emptyTables = [];
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = parseInt(countResult.rows[0].count);
      if (count === 0) {
        emptyTables.push(table);
      }
    }
    if (emptyTables.length > 0) {
      console.log(`⚠️ Tables vides: ${emptyTables.join(', ')}`);
    }

    // 3.2 Vérifier les colonnes NULL
    console.log('\n⚠️ Colonnes avec NULL:');
    for (const table of tables) {
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND is_nullable = 'YES'
        AND column_name LIKE '%id%'
      `, [table]);
      
      for (const col of columnsResult.rows) {
        const nullResult = await client.query(
          `SELECT COUNT(*) FROM "${table}" WHERE "${col.column_name}" IS NULL`
        );
        const nullCount = parseInt(nullResult.rows[0].count);
        if (nullCount > 0) {
          console.log(`   ${table}.${col.column_name}: ${nullCount} NULL`);
        }
      }
    }

    await client.end();
    console.log('\n✅ Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

diagnostic();
