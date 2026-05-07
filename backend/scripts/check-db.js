const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inovexa.db');
const db = new sqlite3.Database(dbPath);

// Vérifier si la table client_modules existe
db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='client_modules'`, (err, row) => {
    if (err) {
        console.error('Erreur:', err);
        db.close();
        return;
    }
    
    if (!row) {
        console.log('Table client_modules n\'existe pas, création...');
        db.run(`
            CREATE TABLE client_modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clientId INTEGER UNIQUE,
                dashboard INTEGER DEFAULT 1,
                products INTEGER DEFAULT 1,
                categories INTEGER DEFAULT 1,
                stock INTEGER DEFAULT 1,
                sales INTEGER DEFAULT 1,
                purchases INTEGER DEFAULT 1,
                orders INTEGER DEFAULT 1,
                clients INTEGER DEFAULT 1,
                suppliers INTEGER DEFAULT 1,
                invoices INTEGER DEFAULT 1,
                hr INTEGER DEFAULT 1,
                finance INTEGER DEFAULT 1,
                logistics INTEGER DEFAULT 1,
                production INTEGER DEFAULT 1,
                ai INTEGER DEFAULT 1,
                reports INTEGER DEFAULT 1,
                analytics INTEGER DEFAULT 1,
                profile INTEGER DEFAULT 1,
                settings INTEGER DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Erreur création:', err);
            else console.log('✅ Table client_modules créée');
            db.close();
        });
    } else {
        console.log('✅ Table client_modules existe déjà');
        db.close();
    }
});
