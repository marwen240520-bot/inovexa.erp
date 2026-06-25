const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

const adminEmail = 'marwen2405@gmail.com';
const adminPassword = '123456';
const adminName = 'Admin';

async function createAdmin() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Vérifier si l'admin existe déjà
    const checkResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Le compte admin existe déjà !');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Mot de passe:', adminPassword);
      await client.end();
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Date de fin d'abonnement (10 ans)
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10);

    // Créer l'admin
    await client.query(
      `INSERT INTO users (
        email, password, name, role, "isActive", 
        "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        adminEmail,
        hashedPassword,
        adminName,
        'admin',
        true,
        new Date(),
        subscriptionEnd,
        new Date(),
        new Date()
      ]
    );

    console.log('✅ Compte admin créé avec succès !');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              👑 COMPTE ADMIN                                  ║');
    console.log('║                                                              ║');
    console.log('║     📧 Email : marwen2405@gmail.com                         ║');
    console.log('║     🔑 Mot de passe : 123456                                ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

createAdmin();
