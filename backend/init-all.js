const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(path.join(dataDir, "inovexa.db"));
const hash = bcrypt.hashSync("Admin123!", 10);

db.serialize(() => {
  // Tables
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

  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    company TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT,
    sku TEXT UNIQUE,
    price REAL,
    quantity INTEGER DEFAULT 0,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    clientId TEXT,
    clientName TEXT,
    amount REAL,
    status TEXT DEFAULT 'pending',
    dueDate DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    position TEXT,
    salary REAL,
    phone TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    clientId TEXT,
    clientName TEXT,
    total REAL,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Admin
  db.get("SELECT * FROM users WHERE email = 'admin@inovexa.com'", [], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)",
        ["admin@inovexa.com", hash, "Admin", "Inovexa", "admin"]);
      console.log("✅ Admin créé");
    }
  });

  // Données test Clients
  db.get("SELECT * FROM clients LIMIT 1", [], (err, row) => {
    if (!row) {
      db.run("INSERT INTO clients (name, email, phone, company) VALUES (?, ?, ?, ?)", 
        ["Tech Solutions", "contact@tech.com", "0612345678", "Tech SARL"]);
      db.run("INSERT INTO clients (name, email, phone, company) VALUES (?, ?, ?, ?)", 
        ["Digital Services", "info@digital.com", "0698765432", "Digital Group"]);
      console.log("✅ Clients de test créés");
    }
  });

  // Données test Produits
  db.get("SELECT * FROM products LIMIT 1", [], (err, row) => {
    if (!row) {
      db.run("INSERT INTO products (name, sku, price, quantity) VALUES (?, ?, ?, ?)", 
        ["Ordinateur Portable Pro", "PC-001", 1299.99, 25]);
      db.run("INSERT INTO products (name, sku, price, quantity) VALUES (?, ?, ?, ?)", 
        ["Souris Sans Fil", "MS-001", 29.99, 150]);
      db.run("INSERT INTO products (name, sku, price, quantity) VALUES (?, ?, ?, ?)", 
        ["Clavier Mécanique", "KB-001", 89.99, 75]);
      console.log("✅ Produits de test créés");
    }
  });

  // Données test Employés
  db.get("SELECT * FROM employees LIMIT 1", [], (err, row) => {
    if (!row) {
      db.run("INSERT INTO employees (firstName, lastName, email, position, salary) VALUES (?, ?, ?, ?, ?)", 
        ["Jean", "Dupont", "jean@inovexa.com", "Développeur", 45000]);
      db.run("INSERT INTO employees (firstName, lastName, email, position, salary) VALUES (?, ?, ?, ?, ?)", 
        ["Marie", "Martin", "marie@inovexa.com", "Chef de projet", 55000]);
      console.log("✅ Employés de test créés");
    }
  });
});

setTimeout(() => {
  db.close();
  console.log("✅ Base de données initialisée");
}, 2000);
