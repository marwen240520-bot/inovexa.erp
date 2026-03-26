const sqlite3 = require("sqlite3");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "data", "inovexa.db"));

console.log("\n📋 UTILISATEURS DANS LA BASE :");
db.all("SELECT id, email, firstName, lastName, role, company FROM users", [], (err, rows) => {
    if (err) {
        console.error("Erreur:", err);
    } else {
        rows.forEach(row => {
            console.log(`   - ${row.email} (${row.firstName} ${row.lastName}) - ${row.role} - ${row.company || 'sans société'}`);
        });
        console.log(`\nTotal: ${rows.length} utilisateurs`);
        console.log(`   Admins: ${rows.filter(r => r.role === 'admin').length}`);
        console.log(`   Clients: ${rows.filter(r => r.role === 'user').length}`);
    }
    db.close();
});
