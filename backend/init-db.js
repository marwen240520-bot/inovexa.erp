const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(path.join(dataDir, "inovexa.db"));
const adminHash = bcrypt.hashSync("123456", 10);
const clientHash = bcrypt.hashSync("client123", 10);

db.serialize(() => {
    // Supprimer toutes les tables
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`DROP TABLE IF EXISTS products`);
    db.run(`DROP TABLE IF EXISTS invoices`);
    db.run(`DROP TABLE IF EXISTS orders`);
    db.run(`DROP TABLE IF EXISTS suppliers`);
    db.run(`DROP TABLE IF EXISTS employees`);
    
    // Table users
    db.run(`CREATE TABLE users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE,
        password TEXT,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'user',
        isActive INTEGER DEFAULT 1,
        company TEXT,
        phone TEXT,
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Table products
    db.run(`CREATE TABLE products (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT,
        sku TEXT UNIQUE,
        price REAL,
        quantity INTEGER DEFAULT 0,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Table invoices
    db.run(`CREATE TABLE invoices (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        clientName TEXT,
        amount REAL,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Table orders
    db.run(`CREATE TABLE orders (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        clientName TEXT,
        total REAL,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Table suppliers
    db.run(`CREATE TABLE suppliers (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Table employees
    db.run(`CREATE TABLE employees (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        firstName TEXT,
        lastName TEXT,
        email TEXT UNIQUE,
        position TEXT,
        salary REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Admin
    db.run(`INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)`,
        ["marwen2405@gmail.com", adminHash, "Marwen", "Hadded", "admin"]);
    
    // Clients de test
    db.run(`INSERT INTO users (email, password, firstName, lastName, role, company, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["client1@test.com", clientHash, "Jean", "Dupont", "user", "Tech SARL", "0612345678"]);
    db.run(`INSERT INTO users (email, password, firstName, lastName, role, company, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["client2@test.com", clientHash, "Marie", "Martin", "user", "Digital Group", "0698765432"]);
    
    // Produits de test
    db.run(`INSERT INTO products (name, sku, price, quantity) VALUES (?, ?, ?, ?)`,
        ["Laptop Pro", "LP-001", 1299.99, 50]);
    db.run(`INSERT INTO products (name, sku, price, quantity) VALUES (?, ?, ?, ?)`,
        ["Souris Sans Fil", "MS-001", 29.99, 200]);
    db.run(`INSERT INTO products (name, sku, price, quantity) VALUES (?, ?, ?, ?)`,
        ["Clavier Mécanique", "KB-001", 89.99, 75]);
    
    // Factures de test
    db.run(`INSERT INTO invoices (clientName, amount, status) VALUES (?, ?, ?)`,
        ["Tech SARL", 1250.00, "paid"]);
    db.run(`INSERT INTO invoices (clientName, amount, status) VALUES (?, ?, ?)`,
        ["Digital Group", 890.00, "pending"]);
    
    // Commandes de test
    db.run(`INSERT INTO orders (clientName, total, status) VALUES (?, ?, ?)`,
        ["Tech SARL", 1299.99, "delivered"]);
    db.run(`INSERT INTO orders (clientName, total, status) VALUES (?, ?, ?)`,
        ["Digital Group", 89.99, "pending"]);
    
    // Employés de test
    db.run(`INSERT INTO employees (firstName, lastName, email, position, salary) VALUES (?, ?, ?, ?, ?)`,
        ["Jean", "Dupont", "jean@inovexa.com", "Développeur", 45000]);
    db.run(`INSERT INTO employees (firstName, lastName, email, position, salary) VALUES (?, ?, ?, ?, ?)`,
        ["Marie", "Martin", "marie@inovexa.com", "Chef Projet", 55000]);
    
    // Fournisseurs de test
    db.run(`INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)`,
        ["Tech Supplies", "contact@techsupplies.com", "0123456789"]);
    db.run(`INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)`,
        ["Digital Solutions", "info@digitalsolutions.com", "0987654321"]);
    
    console.log("✅ Base de données initialisée avec succès !");
});

setTimeout(() => {
    console.log("\n📋 DONNÉES INSÉRÉES :");
    db.all("SELECT COUNT(*) as count FROM products", [], (err, row) => console.log(`   Produits: ${row?.count || 0}`));
    db.all("SELECT COUNT(*) as count FROM users WHERE role='user'", [], (err, row) => console.log(`   Clients: ${row?.count || 0}`));
    db.close();
}, 1000);
