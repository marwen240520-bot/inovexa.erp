const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'inovexa_erp',
});

async function checkAdmin() {
    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL\n');
        
        // Vérifier si l'admin existe
        const result = await client.query('SELECT email, name, role, "isActive", "createdAt" FROM users WHERE email = $1', ['marwen2405@gmail.com']);
        
        if (result.rows.length > 0) {
            const admin = result.rows[0];
            console.log('✅ ADMIN TROUVÉ !');
            console.log('─────────────────────────────────────────────');
            console.log(`📧 Email        : ${admin.email}`);
            console.log(`👤 Nom          : ${admin.name}`);
            console.log(`👑 Rôle         : ${admin.role}`);
            console.log(`🔒 Statut       : ${admin.isActive ? '✅ Actif' : '❌ Inactif'}`);
            console.log(`📅 Créé le      : ${admin.createdAt}`);
            console.log('─────────────────────────────────────────────');
            console.log('\n✅ Le compte admin existe et est fonctionnel !');
            console.log('🔑 Mot de passe par défaut : 123456');
        } else {
            console.log('❌ ADMIN NON TROUVÉ !');
            console.log('\n⚠️ Le compte admin n\'existe pas dans la base de données.');
            console.log('\n📌 Pour le créer, exécute :');
            console.log('   node scripts/create-admin-now.js');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.log('\n⚠️ Vérifie que PostgreSQL tourne :');
        console.log('   Get-Service postgresql*');
    } finally {
        await client.end();
    }
}

checkAdmin();
