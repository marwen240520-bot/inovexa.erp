const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addUserIdColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si la colonne userId existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='shipments' AND column_name='userId'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Ajouter la colonne userId
      await client.query(`
        ALTER TABLE shipments ADD COLUMN "userId" INTEGER
      `);
      console.log('✅ Colonne userId ajoutée à la table shipments');
      
      // Mettre à jour les enregistrements existants (si nécessaire)
      await client.query(`
        UPDATE shipments SET "userId" = "clientId" WHERE "userId" IS NULL
      `);
      console.log('✅ Enregistrements existants mis à jour');
    } else {
      console.log('✅ La colonne userId existe déjà');
    }
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addUserIdColumn();
