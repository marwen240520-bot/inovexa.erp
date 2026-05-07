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

    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ La table users n\'existe pas encore');
      console.log('💡 Attendez que le backend ait fini de démarrer');
      await client.end();
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10);

    await client.query(
      `INSERT INTO users (email, password, name, role, "isActive", "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true, new Date(), subscriptionEnd, new Date(), new Date()]
    );

    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     ✅ COMPTE ADMIN CRÉÉ AVEC SUCCÈS !      ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log('║  📧 Email : marwen2405@gmail.com           ║');
    console.log('║  🔑 Mot de passe : 123456                  ║');
    console.log('║  👑 Rôle : admin                           ║');
    console.log('╚════════════════════════════════════════════╝');

    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAdmin();
