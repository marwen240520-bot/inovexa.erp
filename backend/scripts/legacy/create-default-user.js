const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function createDefaultUser() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Vérifier si l'admin existe déjà
    const checkResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['default@inovexa.com']
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Utilisateur par défaut existe déjà');
      await client.end();
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

    await client.query(
      `INSERT INTO users (
        email, password, name, role, "isActive", 
        "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'default@inovexa.com',
        hashedPassword,
        'Utilisateur par défaut',
        'client',
        true,
        new Date(),
        subscriptionEnd,
        new Date(),
        new Date()
      ]
    );

    console.log('✅ Utilisateur par défaut créé avec succès !');
    console.log('📧 Email: default@inovexa.com');
    console.log('🔑 Mot de passe: 123456');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

createDefaultUser();
