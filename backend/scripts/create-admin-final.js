const { Client } = require('pg');
const bcrypt = require('bcrypt');

const pgClient = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function createAdmin() {
  try {
    await pgClient.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    const adminEmail = 'marwen2405@gmail.com';
    const adminPassword = '123456';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const now = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10);
    
    // Attendre que la table soit créée par TypeORM
    console.log('⏳ Attente de la création des tables...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Vérifier si la table existe
    const tableCheck = await pgClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ La table users n\'existe pas encore, attente supplémentaire...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Vérifier si l'admin existe
    const checkResult = await pgClient.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (checkResult.rows.length === 0) {
      await pgClient.query(
        `INSERT INTO users (email, password, name, role, "isActive", "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [adminEmail, hashedPassword, 'Admin', 'admin', true, now, subscriptionEnd, now, now]
      );
      console.log('✅ Compte admin créé avec succès !');
    } else {
      console.log('✅ Le compte admin existe déjà');
    }
    
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pgClient.end();
  }
}

createAdmin();
