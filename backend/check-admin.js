const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "data", "inovexa.db"));
const hash = bcrypt.hashSync("123456", 10);

db.serialize(() => {
    // Créer la table users si elle n'existe pas
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE,
        password TEXT,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'user',
        isActive INTEGER DEFAULT 1,
        company TEXT,
        phone TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Vérifier si admin existe
    db.get("SELECT * FROM users WHERE email = 'marwen2405@gmail.com'", [], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (email, password, firstName, lastName, role) 
                    VALUES (?, ?, ?, ?, ?)`,
                ["marwen2405@gmail.com", hash, "Marwen", "Hadded", "admin"],
                function(err) {
                    if (err) console.error("Erreur création admin:", err);
                    else console.log("✅ Compte ADMIN créé: marwen2405@gmail.com / 123456");
                }
            );
        } else {
            console.log("✅ Compte ADMIN existe déjà");
        }
    });

    // Afficher tous les utilisateurs
    setTimeout(() => {
        db.all("SELECT email, firstName, lastName, role FROM users", [], (err, rows) => {
            if (!err && rows) {
                console.log("\n📋 UTILISATEURS :");
                rows.forEach(row => {
                    console.log(`   - ${row.email} (${row.firstName} ${row.lastName}) - ${row.role}`);
                });
            }
            db.close();
        });
    }, 500);
});
