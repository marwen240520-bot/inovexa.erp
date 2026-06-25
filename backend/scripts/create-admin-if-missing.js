const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function createAdmin() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    const adminEmail = 'marwen2405@gmail.com';
    const adminPassword = '123456';

    const checkResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Admin existe déjà');
      await client.end();
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10);

    await client.query(
      `INSERT INTO users (
        email, password, name, role, "isActive", 
        "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        adminEmail,
        hashedPassword,
        'Admin',
        'admin',
        true,
        new Date(),
        subscriptionEnd,
        new Date(),
        new Date()
      ]
    );

    console.log('✅ Admin créé !');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
  }
}

createAdmin();
