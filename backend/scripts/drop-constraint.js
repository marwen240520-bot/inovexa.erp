const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function dropConstraint() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Récupérer le nom de la contrainte
    const constraintRes = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'suppliers'::regclass 
      AND contype = 'f'
    `);
    
    if (constraintRes.rows.length > 0) {
      const constraintName = constraintRes.rows[0].conname;
      console.log(`Contrainte trouvée: ${constraintName}`);
      
      await client.query(`ALTER TABLE suppliers DROP CONSTRAINT ${constraintName}`);
      console.log('✅ Contrainte de clé étrangère supprimée');
    } else {
      console.log('⚠️ Aucune contrainte trouvée');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

dropConstraint();
