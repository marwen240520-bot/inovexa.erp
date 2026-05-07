const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inovexa.db');
const db = new sqlite3.Database(dbPath);

const adminEmail = 'marwen2405@gmail.com';
const newPassword = '123456';

async function resetPassword() {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    db.run(
        `UPDATE users SET password = ? WHERE email = ?`,
        [hashedPassword, adminEmail],
        function(err) {
            if (err) {
                console.error('Erreur:', err);
            } else if (this.changes === 0) {
                console.log('Admin non trouvé, création...');
                const subscriptionEnd = new Date();
                subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10);
                db.run(
                    `INSERT INTO users (email, password, name, role, isActive, subscriptionStart, subscriptionEnd, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [adminEmail, hashedPassword, 'Admin', 'admin', 1, new Date().toISOString(), subscriptionEnd.toISOString(), new Date().toISOString(), new Date().toISOString()],
                    function(err) {
                        if (err) console.error('Erreur création:', err);
                        else console.log('✅ Admin créé avec mot de passe: 123456');
                    }
                );
            } else {
                console.log('✅ Mot de passe admin réinitialisé avec succès!');
                console.log('📧 Email:', adminEmail);
                console.log('🔑 Nouveau mot de passe:', newPassword);
            }
            db.close();
        }
    );
}

resetPassword();
