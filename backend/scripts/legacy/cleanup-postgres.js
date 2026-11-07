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

    // 1. Supprimer les produits avec userId NULL
    await client.query(`DELETE FROM products WHERE "userId" IS NULL`);
    console.log('✅ Produits avec userId NULL supprimés');

    // 2. Ajouter une contrainte NOT NULL sur userId
    await client.query(`ALTER TABLE products ALTER COLUMN "userId" SET NOT NULL`);
    console.log('✅ Contrainte NOT NULL ajoutée sur userId');

    // 3. Vérifier les autres tables
    const tables = ['sales', 'purchases', 'orders', 'clients', 'invoices'];
    for (const table of tables) {
      await client.query(`UPDATE ${table} SET "userId" = 1 WHERE "userId" IS NULL`);
      console.log(`✅ ${table} nettoyé`);
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
