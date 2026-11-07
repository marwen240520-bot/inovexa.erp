const { Client } = require('pg');
const bcrypt = require('bcrypt');

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
        
        // Vérifier si l'admin existe
        const checkResult = await client.query('SELECT * FROM users WHERE email = $1', ['marwen2405@gmail.com']);
        
        if (checkResult.rows.length > 0) {
            console.log('✅ Admin existe déjà !');
            const u = checkResult.rows[0];
            console.log(`📧 Email: ${u.email}`);
            console.log(`👤 Nom: ${u.name}`);
            console.log(`👑 Rôle: ${u.role}`);
        } else {
            console.log('⚠️ Création du compte admin...');
            const hashedPassword = await bcrypt.hash('123456', 10);
            
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
            console.log('✅ Admin créé avec succès !');
        }
        
        // Vérification finale
        const finalCheck = await client.query('SELECT email, name, role FROM users WHERE email = $1', ['marwen2405@gmail.com']);
        if (finalCheck.rows.length > 0) {
            const u = finalCheck.rows[0];
            console.log('\n📋 VÉRIFICATION FINALE:');
            console.log(`   ✅ Email: ${u.email}`);
            console.log(`   ✅ Nom: ${u.name}`);
            console.log(`   ✅ Rôle: ${u.role}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

createAdmin();
