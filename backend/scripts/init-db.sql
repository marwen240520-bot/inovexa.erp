-- Activer les clés étrangères
PRAGMA foreign_keys = ON;

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    companyName TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client',
    subscriptionStart DATETIME,
    subscriptionEnd DATETIME,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table products
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    categoryId INTEGER,
    name TEXT NOT NULL,
    sku TEXT,
    price REAL DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table sales
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    clientName TEXT,
    productName TEXT,
    quantity INTEGER DEFAULT 1,
    unitPrice REAL DEFAULT 0,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table purchases
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    supplierName TEXT,
    productName TEXT,
    quantity INTEGER DEFAULT 1,
    unitPrice REAL DEFAULT 0,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table clients
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    totalSpent REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table orders
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    clientName TEXT,
    productName TEXT,
    quantity INTEGER DEFAULT 1,
    unitPrice REAL DEFAULT 0,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    clientName TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    dueDate DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table employees
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    position TEXT,
    department TEXT,
    salary REAL DEFAULT 0,
    phone TEXT,
    status TEXT DEFAULT 'active',
    hireDate DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table expenses
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table shipments
CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL,
    transporteurId INTEGER,
    trackingNumber TEXT UNIQUE NOT NULL,
    clientName TEXT NOT NULL,
    address TEXT NOT NULL,
    carrier TEXT,
    status TEXT DEFAULT 'pending',
    estimatedDelivery DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table production_orders
CREATE TABLE IF NOT EXISTS production_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    orderNumber TEXT NOT NULL,
    productName TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    startDate DATE,
    endDate DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table transporteurs
CREATE TABLE IF NOT EXISTS transporteurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL,
    userId INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    companyName TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    totalPurchases REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_products_userId ON products(userId);
CREATE INDEX IF NOT EXISTS idx_sales_userId ON sales(userId);
CREATE INDEX IF NOT EXISTS idx_purchases_userId ON purchases(userId);
CREATE INDEX IF NOT EXISTS idx_clients_userId ON clients(userId);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_invoices_userId ON invoices(userId);
CREATE INDEX IF NOT EXISTS idx_employees_userId ON employees(userId);
CREATE INDEX IF NOT EXISTS idx_expenses_userId ON expenses(userId);
CREATE INDEX IF NOT EXISTS idx_production_userId ON production_orders(userId);
CREATE INDEX IF NOT EXISTS idx_transporteurs_clientId ON transporteurs(clientId);
