const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function updateShipmentTable() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si la colonne amount existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shipments' AND column_name = 'amount'
    `);
    
    if (checkColumn.rows.length > 0) {
      // Supprimer la colonne amount si elle existe
      await client.query(`ALTER TABLE shipments DROP COLUMN amount`);
      console.log('✅ Colonne amount supprimée');
    } else {
      console.log('✅ Colonne amount n\'existe pas');
    }
    
    // Vérifier les autres colonnes
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shipments'
    `);
    
    console.log('\n📋 Colonnes actuelles de la table shipments:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
    await client.end();
    console.log('\n✅ Mise à jour terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

updateShipmentTable();
