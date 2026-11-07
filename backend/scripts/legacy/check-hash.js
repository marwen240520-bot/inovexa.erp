const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'inovexa_erp',
});

async function checkPassword() {
    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL');
        
        const result = await client.query('SELECT email, password FROM users WHERE email = $1', ['marwen2405@gmail.com']);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('📧 Email:', user.email);
            console.log('🔑 Hash stocké:', user.password.substring(0, 20) + '...');
            
            const isValid = await bcrypt.compare('123456', user.password);
            console.log(`🔐 Mot de passe 123456 ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
            
            if (!isValid) {
                console.log('\n⚠️ Le hash est invalide. Recréation du compte...');
                
                const hashedPassword = await bcrypt.hash('123456', 10);
                await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, 'marwen2405@gmail.com']);
                console.log('✅ Mot de passe réinitialisé !');
                
                const newCheck = await bcrypt.compare('123456', hashedPassword);
                console.log(`🔐 Nouveau test: ${newCheck ? '✅ OK' : '❌ ÉCHEC'}`);
            }
        } else {
            console.log('❌ Admin non trouvé');
        }
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

checkPassword();
