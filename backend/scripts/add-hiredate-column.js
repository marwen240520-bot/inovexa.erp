const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function addHireDateColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si la colonne existe déjà
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'hireDate'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Ajouter la colonne hireDate
      await client.query(`ALTER TABLE employees ADD COLUMN "hireDate" DATE`);
      console.log('✅ Colonne "hireDate" ajoutée avec succès');
    } else {
      console.log('✅ La colonne "hireDate" existe déjà');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addHireDateColumn();
