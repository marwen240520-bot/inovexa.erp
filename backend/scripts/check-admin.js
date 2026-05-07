const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'inovexa.db');
const db = new sqlite3.Database(dbPath);

db.get('SELECT id, email, name, role FROM users WHERE email = ?', ['marwen2405@gmail.com'], (err, row) => {
    if (err) {
        console.error('Erreur:', err);
    } else if (row) {
        console.log('✅ Admin trouvé :');
        console.log('   ID:', row.id);
        console.log('   Email:', row.email);
        console.log('   Nom:', row.name);
        console.log('   Rôle:', row.role);
    } else {
        console.log('❌ Admin non trouvé');
    }
    db.close();
});
