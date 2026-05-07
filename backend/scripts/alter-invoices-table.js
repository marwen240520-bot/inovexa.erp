const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function alterInvoicesTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Ajouter les nouvelles colonnes
    console.log('\n📝 Ajout des colonnes...');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reference VARCHAR(255)`);
    console.log('✅ Colonne reference ajoutée');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "operationNumber" VARCHAR(255)`);
    console.log('✅ Colonne operationNumber ajoutée');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'debit'`);
    console.log('✅ Colonne type ajoutée');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "supplierName" VARCHAR(255)`);
    console.log('✅ Colonne supplierName ajoutée');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT`);
    console.log('✅ Colonne description ajoutée');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0`);
    console.log('✅ Colonne subtotal ajoutée');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2) DEFAULT 20`);
    console.log('✅ Colonne taxRate ajoutée');
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10,2) DEFAULT 0`);
    console.log('✅ Colonne taxAmount ajoutée');
    
    // Mettre à jour les colonnes existantes
    console.log('\n🔄 Mise à jour des données...');
    
    await client.query(`UPDATE invoices SET type = 'debit' WHERE type IS NULL`);
    console.log('✅ type mis à jour (debit par défaut)');
    
    await client.query(`UPDATE invoices SET subtotal = amount WHERE subtotal = 0 OR subtotal IS NULL`);
    console.log('✅ subtotal mis à jour');
    
    await client.query(`UPDATE invoices SET "taxRate" = 20 WHERE "taxRate" IS NULL`);
    console.log('✅ taxRate mis à jour');
    
    await client.query(`UPDATE invoices SET "taxAmount" = amount * 0.2 WHERE "taxAmount" = 0 OR "taxAmount" IS NULL`);
    console.log('✅ taxAmount mis à jour');
    
    await client.query(`
      UPDATE invoices 
      SET reference = CONCAT('INV-', LPAD(id::text, 6, '0')) 
      WHERE reference IS NULL
    `);
    console.log('✅ reference générée automatiquement');
    
    // Vérifier le résultat
    console.log('\n📊 Structure de la table invoices:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n' + '─'.repeat(60));
    columns.rows.forEach(col => {
      console.log(`│ ${col.column_name.padEnd(20)} │ ${col.data_type.padEnd(15)} │ ${col.is_nullable.padEnd(10)} │`);
    });
    console.log('─'.repeat(60));
    
    // Afficher quelques exemples
    const samples = await client.query(`
      SELECT id, reference, amount, subtotal, "taxRate", "taxAmount", type 
      FROM invoices 
      LIMIT 5
    `);
    
    if (samples.rows.length > 0) {
      console.log('\n📋 Exemples de données:');
      console.log('─'.repeat(80));
      samples.rows.forEach(row => {
        console.log(`ID: ${row.id} | Ref: ${row.reference} | Montant: ${row.amount}€ | Sous-total: ${row.subtotal}€ | TVA: ${row.taxRate}% | Taxe: ${row.taxAmount}€ | Type: ${row.type}`);
      });
      console.log('─'.repeat(80));
    }
    
    await client.end();
    console.log('\n✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

alterInvoicesTable();
