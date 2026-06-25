const { Client } = require('pg');

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

        // Hash simple (à utiliser seulement en développement)
        const hashedPassword = '$2b$10$QJcQJcQJcQJcQJcQJcQJcQ';

        await client.query(`
            INSERT INTO users (email, password, name, role, "isActive", "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        `, [
            'marwen2405@gmail.com',
            hashedPassword,
            'Admin',
            'admin',
            true,
            new Date(),
            new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
            new Date(),
            new Date()
        ]);

        console.log('✅ Admin créé avec succès !');
        console.log('📧 Email: marwen2405@gmail.com');
        console.log('🔑 Mot de passe: 123456');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

createAdmin();
