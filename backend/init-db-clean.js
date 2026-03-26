const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(path.join(dataDir, "inovexa.db"));
const hash = bcrypt.hashSync("123456", 10);

db.serialize(() => {
    // Recréer la table users proprement
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`CREATE TABLE users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE,
        password TEXT,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'user',
        isActive INTEGER DEFAULT 1,
        refreshToken TEXT,
        resetToken TEXT,
        twoFactorEnabled INTEGER DEFAULT 0,
        twoFactorSecret TEXT,
        clientId TEXT,
        duration INTEGER DEFAULT 30,
        expiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Créer UNIQUEMENT le compte admin
    db.run(`INSERT INTO users (email, password, firstName, lastName, role, isActive) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        ["marwen2405@gmail.com", hash, "Marwen", "Hadded", "admin", 1],
        function(err) {
            if (err) {
                console.error("Erreur:", err);
            } else {
                console.log("✅ Compte ADMIN créé avec succès !");
                console.log("   📧 marwen2405@gmail.com");
                console.log("   🔑 123456");
            }
        }
    );

    // Afficher les utilisateurs
    setTimeout(() => {
        db.all("SELECT email, firstName, lastName, role FROM users", [], (err, rows) => {
            if (!err && rows) {
                console.log("\n📋 UTILISATEURS DANS LA BASE :");
                rows.forEach(row => {
                    console.log(`   👑 ${row.email} (${row.firstName} ${row.lastName}) - ${row.role}`);
                });
            }
        });
    }, 500);
});

setTimeout(() => {
    db.close(() => {
        console.log("\n✅ Base de données prête");
    });
}, 1500);
