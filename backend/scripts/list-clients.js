const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function listClients() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    
    const res = await client.query(`
      SELECT id, email, name, role, "isActive" 
      FROM users 
      WHERE role = 'client'
      ORDER BY id DESC
    `);
    
    console.log('📋 CLIENTS EXISTANTS :');
    console.log('─'.repeat(60));
    res.rows.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Nom: ${user.name} | Statut: ${user.isActive ? 'Actif' : 'Inactif'}`);
    });
    console.log('─'.repeat(60));
    console.log(`Total: ${res.rows.length} client(s)\n`);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

listClients();
