const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function cleanup() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // 1. Remplacer les userId NULL par 1 (admin) dans products
    await client.query(`UPDATE products SET "userId" = 1 WHERE "userId" IS NULL`);
    console.log('✅ Products: userId NULL → 1');

    // 2. Vérifier et nettoyer les autres tables
    const tables = ['sales', 'purchases', 'orders', 'clients', 'invoices', 'employees', 'expenses', 'shipments'];
    for (const table of tables) {
      try {
        await client.query(`UPDATE ${table} SET "userId" = 1 WHERE "userId" IS NULL`);
        console.log(`✅ ${table}: userId NULL → 1`);
      } catch(e) {
        // Ignorer si la table n'existe pas ou n'a pas userId
      }
    }

    // 3. Ajouter la contrainte NOT NULL sur userId (uniquement si elle n'existe pas)
    try {
      await client.query(`ALTER TABLE products ALTER COLUMN "userId" SET NOT NULL`);
      console.log('✅ Contrainte NOT NULL ajoutée sur products.userId');
    } catch(e) {
      console.log('⚠️ Contrainte NOT NULL déjà présente ou erreur:', e.message);
    }

    console.log('🎉 Nettoyage terminé !');
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

cleanup();
