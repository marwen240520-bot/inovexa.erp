const sqlite3 = require('sqlite3');
const fs = require('fs');

const db = new sqlite3.Database('data/inovexa.db');
const tables = ['users', 'products', 'sales', 'purchases', 'orders', 'clients', 'invoices', 'employees', 'expenses', 'shipments', 'production_orders', 'transporteurs'];

async function extractData() {
    const data = {};
    for (const table of tables) {
        try {
            const rows = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${table}`, (err, rows) => {
                    if (err) resolve([]);
                    else resolve(rows);
                });
            });
            if (rows.length > 0) {
                data[table] = rows;
                console.log(`✅ ${table}: ${rows.length} lignes extraites`);
            } else {
                console.log(`⚠️ ${table}: vide`);
            }
        } catch(e) { console.log(`⚠️ ${table}: non trouvée`); }
    }
    fs.writeFileSync('data/backup_sqlite.json', JSON.stringify(data, null, 2));
    console.log('✅ Sauvegarde créée: data/backup_sqlite.json');
    db.close();
}

extractData();
