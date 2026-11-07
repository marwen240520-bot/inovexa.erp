const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'inovexa_erp',
});

async function recreateAdmin() {
    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL');
        
        const hashedPassword = await bcrypt.hash('123456', 10);
        console.log('🔑 Hash généré:', hashedPassword);
        
        // Supprimer l'ancien admin s'il existe
        await client.query('DELETE FROM users WHERE email = $1', ['marwen2405@gmail.com']);
        console.log('🗑️ Ancien admin supprimé');
        
        // Créer le nouvel admin
        await client.query(`
            INSERT INTO users (email, password, name, role, "isActive", "subscriptionStart", "subscriptionEnd", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        
        console.log('✅ Admin recréé avec succès !');
        console.log('📧 Email: marwen2405@gmail.com');
        console.log('🔑 Mot de passe: 123456');
        
        // Vérifier
        const result = await client.query('SELECT email, password FROM users WHERE email = $1', ['marwen2405@gmail.com']);
        if (result.rows.length > 0) {
            const valid = await bcrypt.compare('123456', result.rows[0].password);
            console.log(`🔐 Vérification: ${valid ? '✅ OK' : '❌ ÉCHEC'}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

recreateAdmin();
