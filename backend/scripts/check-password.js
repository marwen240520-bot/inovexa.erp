const { Client } = require('pg');
const bcrypt = require('bcrypt');
const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'inovexa_erp' });
(async () => {
    try {
        await client.connect();
        const res = await client.query("SELECT password FROM users WHERE email = 'marwen2405@gmail.com'");
        if (res.rows.length > 0) {
            const isValid = await bcrypt.compare('123456', res.rows[0].password);
            console.log(`🔐 Mot de passe: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
            if (!isValid) {
                console.log('⚠️ Réinitialisation du mot de passe...');
                const hashed = await bcrypt.hash('123456', 10);
                await client.query("UPDATE users SET password = $1 WHERE email = $2", [hashed, 'marwen2405@gmail.com']);
                console.log('✅ Mot de passe réinitialisé');
            }
        } else {
            console.log('❌ Admin non trouvé');
        }
    } catch(e) { console.error('Erreur:', e.message); }
    finally { await client.end(); }
})();
