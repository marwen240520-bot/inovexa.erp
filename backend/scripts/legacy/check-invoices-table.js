const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function checkTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    // Vérifier si la table existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invoices'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ La table "invoices" n\'existe pas !');
      console.log('   Vous devez d\'abord exécuter le script de création.');
    } else {
      console.log('✅ La table "invoices" existe\n');
      
      // Afficher la structure de la table
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'invoices'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 STRUCTURE DE LA TABLE INVOICES :');
      console.log('─'.repeat(70));
      console.log('| Colonne            | Type           | Nullable | Défaut');
      console.log('|--------------------|----------------|----------|--------');
      
      for (const col of columns.rows) {
        console.log(`| ${col.column_name.padEnd(18)} | ${col.data_type.padEnd(14)} | ${col.is_nullable.padEnd(8)} | ${(col.column_default || '-').substring(0, 30)}`);
      }
      console.log('─'.repeat(70));
      
      // Compter le nombre de factures
      const count = await client.query('SELECT COUNT(*) FROM invoices');
      console.log(`\n📊 Nombre de factures : ${count.rows[0].count}`);
      
      // Afficher les 5 dernières factures
      if (parseInt(count.rows[0].count) > 0) {
        const recent = await client.query(`
          SELECT id, reference, operation_number, type, amount, status, created_at
          FROM invoices 
          ORDER BY id DESC 
          LIMIT 5
        `);
        
        console.log('\n📋 DERNIÈRES FACTURES :');
        console.log('─'.repeat(80));
        for (const inv of recent.rows) {
          console.log(`   ID: ${inv.id} | Ref: ${inv.reference} | Op: ${inv.operation_number} | Type: ${inv.type} | Montant: ${inv.amount}€ | Statut: ${inv.status}`);
        }
        console.log('─'.repeat(80));
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkTable();
