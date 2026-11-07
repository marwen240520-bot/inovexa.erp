const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function fixClients() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    console.log('🔧 Correction de la table clients...\n');

    // 1. Vérifier la structure de la table clients
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clients'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Structure de clients:');
    for (const col of columns.rows) {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    }

    // 2. Modifier les colonnes si nécessaire
    await client.query(`ALTER TABLE clients ALTER COLUMN name SET NOT NULL`);
    await client.query(`ALTER TABLE clients ALTER COLUMN email SET NOT NULL`);
    await client.query(`ALTER TABLE clients ALTER COLUMN "userId" SET NOT NULL`);
    await client.query(`ALTER TABLE clients ALTER COLUMN status SET DEFAULT 'active'`);
    await client.query(`ALTER TABLE clients ALTER COLUMN "totalSpent" SET DEFAULT 0`);
    
    console.log('\n✅ Contraintes NOT NULL ajoutées');

    // 3. Créer une séquence pour clients.id si elle n'existe pas
    await client.query(`CREATE SEQUENCE IF NOT EXISTS clients_id_seq`);
    
    // 4. Mettre à jour la séquence
    await client.query(`
      SELECT setval('clients_id_seq', COALESCE((SELECT MAX(id) FROM clients), 0) + 1)
    `);
    
    console.log('✅ Séquence clients_id_seq mise à jour');

    // 5. Vérifier l'admin existe
    const adminCheck = await client.query(
      `SELECT * FROM users WHERE email = 'marwen2405@gmail.com'`
    );
    
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await client.query(`
        INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true, new Date(), new Date()]);
      
      console.log('✅ Admin créé');
    }

    console.log('\n🎉 Corrections terminées !');
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

fixClients();
