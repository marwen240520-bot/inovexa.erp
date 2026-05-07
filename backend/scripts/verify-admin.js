const { Client } = require('pg');

const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp'
};

async function verifyAdmin() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');
    
    const result = await client.query(`
      SELECT id, email, name, role, "isActive" FROM users WHERE email = 'marwen2405@gmail.com'
    `);
    
    if (result.rows.length > 0) {
      const admin = result.rows[0];
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║              ✅ COMPTE ADMIN VÉRIFIÉ !                       ║');
      console.log('║                                                              ║');
      console.log(`║  📧 Email : ${admin.email}`);
      console.log(`║  👤 Nom   : ${admin.name}`);
      console.log(`║  👑 Rôle  : ${admin.role}`);
      console.log(`║  🟢 Statut: ${admin.isActive ? 'Actif' : 'Inactif'}`);
      console.log('║                                                              ║');
      console.log('║  🔑 Mot de passe : 123456                                    ║');
      console.log('║                                                              ║');
      console.log('║  🌐 http://localhost:3000/auth/login                         ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
    } else {
      console.log('❌ Aucun compte admin trouvé');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verifyAdmin();
