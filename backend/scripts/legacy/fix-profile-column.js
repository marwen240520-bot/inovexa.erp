const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function checkAndAddColumn() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier si la colonne existe
    const checkColumn = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='profileImage'
    `);
    
    if (checkColumn.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN "profileImage" VARCHAR(255)`);
      console.log('✅ Colonne profileImage ajoutée');
    } else {
      console.log('✅ Colonne profileImage existe déjà');
      
      // Modifier pour accepter NULL si nécessaire
      if (checkColumn.rows[0].is_nullable === 'NO') {
        await client.query(`ALTER TABLE users ALTER COLUMN "profileImage" DROP NOT NULL`);
        console.log('✅ Colonne profileImage modifiée pour accepter NULL');
      }
    }
    
    // Vérifier la colonne theme
    const checkTheme = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='theme'
    `);
    
    if (checkTheme.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN theme VARCHAR(50) DEFAULT 'dark'`);
      console.log('✅ Colonne theme ajoutée');
    } else {
      console.log('✅ Colonne theme existe déjà');
    }
    
    await client.end();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkAndAddColumn();
