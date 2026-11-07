const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function fixNullData() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    // Vérifier les colonnes NULL
    const result = await client.query(`
      SELECT id, email, name, role, "isActive" 
      FROM users 
      WHERE email IS NULL OR name IS NULL
    `);
    
    if (result.rows.length > 0) {
      console.log(`⚠️ ${result.rows.length} utilisateur(s) avec des données NULL`);
      
      for (const user of result.rows) {
        console.log(`   ID: ${user.id} - Email: ${user.email || 'NULL'} - Name: ${user.name || 'NULL'}`);
      }
      
      // Supprimer les utilisateurs invalides
      await client.query(`
        DELETE FROM users 
        WHERE email IS NULL OR name IS NULL
      `);
      console.log(`✅ ${result.rows.length} utilisateur(s) invalide(s) supprimés`);
    } else {
      console.log('✅ Aucune donnée NULL trouvée');
    }
    
    // Vérifier si l'admin existe
    const adminCheck = await client.query(`
      SELECT * FROM users WHERE email = 'marwen2405@gmail.com'
    `);
    
    if (adminCheck.rows.length === 0) {
      console.log('⚠️ Admin non trouvé, création...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await client.query(`
        INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true]);
      console.log('✅ Admin créé');
    } else {
      console.log('✅ Admin existe déjà');
    }
    
    await client.end();
    console.log('✅ Correction terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixNullData();
