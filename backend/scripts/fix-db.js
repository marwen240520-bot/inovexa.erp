const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'inovexa.db');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const email = 'marwen2405@gmail.com';
const password = '123456';
const name = 'Admin';
const role = 'admin';

db.serialize(() => {
    // Supprimer l'ancienne table et recréer
    db.run(`DROP TABLE IF EXISTS users`);
    
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        companyName TEXT,
        phone TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Erreur:', err);
        else console.log('✅ Table users créée');
    });
    
    setTimeout(async () => {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (email, password, name, role, isActive) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, name, role, 1],
            function(err) {
                if (err) console.error('Erreur insertion:', err);
                else {
                    console.log('✅ Admin créé avec succès !');
                    console.log('📧 Email:', email);
                    console.log('🔑 Mot de passe:', password);
                }
                db.close();
            }
        );
    }, 100);
});
