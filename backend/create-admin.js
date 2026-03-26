const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(path.join(dataDir, "inovexa.db"));
const hash = bcrypt.hashSync("Admin123!", 10);

db.serialize(() => {
    // Vérifier si la table users existe
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE,
        password TEXT,
        firstName TEXT,
        lastName TEXT,
        role TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Créer le compte admin
    db.get("SELECT * FROM users WHERE email = 'admin@inovexa.com'", [], (err, row) => {
        if (err) {
            console.error("Erreur:", err);
            return;
        }
        if (!row) {
            db.run(`INSERT INTO users (email, password, firstName, lastName, role, isActive) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                ["admin@inovexa.com", hash, "Admin", "Inovexa", "admin", 1],
                function(err) {
                    if (err) {
                        console.error("Erreur création admin:", err);
                    } else {
                        console.log("✅ Compte ADMIN créé avec succès !");
                        console.log("   Email: admin@inovexa.com");
                        console.log("   Mot de passe: Admin123!");
                    }
                }
            );
        } else {
            console.log("✅ Compte admin existe déjà");
        }
    });

    // Afficher tous les utilisateurs pour vérifier
    setTimeout(() => {
        db.all("SELECT id, email, firstName, lastName, role FROM users", [], (err, rows) => {
            if (err) {
                console.error("Erreur:", err);
            } else {
                console.log("\n📋 Utilisateurs dans la base :");
                rows.forEach(row => {
                    console.log(`   - ${row.email} (${row.firstName} ${row.lastName}) - ${row.role}`);
                });
            }
        });
    }, 500);
});

setTimeout(() => {
    db.close(() => {
        console.log("\n✅ Base de données fermée");
    });
}, 2000);
