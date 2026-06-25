// scripts/test-admin.js
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function testAdmin() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'inovexa_erp',
    });

    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL\n');

        // Vérifier si l'admin existe
        const result = await client.query('SELECT * FROM users WHERE email = $1', ['marwen2405@gmail.com']);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ ADMIN TROUVÉ !');
            console.log('───────────────────────────────────────────────────────────────');
            console.log(`📧 Email        : ${user.email}`);
            console.log(`👤 Nom          : ${user.name}`);
            console.log(`👑 Rôle         : ${user.role}`);
            console.log(`🔒 Status       : ${user.isActive ? 'Actif ✅' : 'Inactif ❌'}`);
            console.log(`📅 Créé le      : ${user.createdAt}`);
            console.log(`📅 Mise à jour  : ${user.updatedAt}`);
            console.log('───────────────────────────────────────────────────────────────');
            console.log('\n🔐 Mot de passe : 123456');
            console.log('\n✅ Le compte admin existe et est fonctionnel !');
            
            // Tester le mot de passe
            if (user.password) {
                const isValid = await bcrypt.compare('123456', user.password);
                console.log(`\n🔑 Test du mot de passe : ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
            }
        } else {
            console.log('❌ ADMIN NON TROUVÉ !');
            console.log('\nLe compte admin n\'existe pas dans la base de données.');
            console.log('\nPour le créer, exécute : node scripts/create-admin.js');
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.log('\nVérifie que PostgreSQL tourne et que la base existe.');
        console.log('docker ps | findstr postgres');
    } finally {
        await client.end();
    }
}

testAdmin();
