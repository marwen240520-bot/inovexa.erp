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

    // 1. Supprimer les purchases avec productId NULL
    const result = await client.query(`DELETE FROM purchases WHERE "productId" IS NULL`);
    console.log(`✅ ${result.rowCount} purchase(s) supprimé(s)`);

    // 2. Ajouter une contrainte NOT NULL si elle n'existe pas
    try {
      await client.query(`ALTER TABLE purchases ALTER COLUMN "productId" SET NOT NULL`);
      console.log('✅ Contrainte NOT NULL ajoutée sur productId');
    } catch(e) {
      console.log('⚠️', e.message);
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
