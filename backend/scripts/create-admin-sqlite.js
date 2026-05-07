const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inovexa.db');
const db = new sqlite3.Database(dbPath);

const adminEmail = 'marwen2405@gmail.com';
const adminPassword = '123456';
const adminName = 'Admin';

async function createAdmin() {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    db.get('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, row) => {
        if (err) {
            console.error('Erreur:', err);
            db.close();
            return;
        }
        
        if (row) {
            console.log('✅ Compte admin existe déjà !');
            console.log('📧 Email:', adminEmail);
            console.log('🔑 Mot de passe:', adminPassword);
            db.close();
            return;
        }
        
        const subscriptionStart = new Date();
        const subscriptionEnd = new Date();
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10);
        
        db.run(
            `INSERT INTO users (email, password, name, role, isActive, subscriptionStart, subscriptionEnd, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminEmail, hashedPassword, adminName, 'admin', 1, subscriptionStart.toISOString(), subscriptionEnd.toISOString(), new Date().toISOString(), new Date().toISOString()],
            function(err) {
                if (err) {
                    console.error('Erreur création:', err);
                } else {
                    console.log('');
                    console.log('╔════════════════════════════════════════════╗');
                    console.log('║     ✅ COMPTE ADMIN CRÉÉ AVEC SUCCÈS !      ║');
                    console.log('╠════════════════════════════════════════════╣');
                    console.log('║  📧 Email : marwen2405@gmail.com           ║');
                    console.log('║  🔑 Mot de passe : 123456                  ║');
                    console.log('║  👑 Rôle : admin                           ║');
                    console.log('╚════════════════════════════════════════════╝');
                }
                db.close();
            }
        );
    });
}

createAdmin();
