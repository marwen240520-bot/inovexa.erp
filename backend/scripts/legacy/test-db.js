const { Client } = require('pg');
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'inovexa_erp',
});
async function test() {
    try {
        await client.connect();
        console.log('✅ Connexion à PostgreSQL réussie');
        const result = await client.query('SELECT COUNT(*) FROM users');
        console.log(`📊 Nombre d\'utilisateurs: ${result.rows[0].count}`);
        await client.end();
    } catch(e) {
        console.log('❌ Erreur:', e.message);
    }
}
test();
