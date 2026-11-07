const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function fixDatabase() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    console.log('🔧 CORRECTION DE LA BASE...\n');

    // 1. Nettoyer les NULL dans les colonnes ID
    const tables = ['products', 'sales', 'purchases', 'orders', 'clients', 'invoices', 'employees'];
    
    for (const table of tables) {
      try {
        // Remplacer userId NULL par 1
        await client.query(`UPDATE "${table}" SET "userId" = 1 WHERE "userId" IS NULL`);
        console.log(`✅ ${table}: userId NULL → 1`);
      } catch(e) {}
    }

    // 2. Ajouter les contraintes NOT NULL
    const constraints = [
      { table: 'products', column: 'userId' },
      { table: 'sales', column: 'userId' },
      { table: 'purchases', column: 'userId' },
      { table: 'orders', column: 'userId' },
      { table: 'clients', column: 'userId' },
      { table: 'invoices', column: 'userId' }
    ];

    for (const c of constraints) {
      try {
        await client.query(`ALTER TABLE "${c.table}" ALTER COLUMN "${c.column}" SET NOT NULL`);
        console.log(`✅ ${c.table}.${c.column} NOT NULL`);
      } catch(e) {
        console.log(`⚠️ ${c.table}.${c.column}: ${e.message}`);
      }
    }

    // 3. Créer l'admin s'il n'existe pas
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

fixDatabase();
