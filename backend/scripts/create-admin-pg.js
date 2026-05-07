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
