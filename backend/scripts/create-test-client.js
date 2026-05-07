const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createTestClient() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'inovexa_erp'
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    const hashedPassword = await bcrypt.hash('client123', 10);
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    
    await client.query(`
      INSERT INTO users (email, password, name, companyName, phone, role, "subscriptionStart", "subscriptionEnd", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['client@test.com', hashedPassword, 'Client Test', 'Test SARL', '0612345678', 'client', new Date(), subscriptionEnd, true]);
    
    console.log('✅ Client de test créé avec succès!');
    console.log('📧 Email: client@test.com');
    console.log('🔑 Mot de passe: client123');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createTestClient();
