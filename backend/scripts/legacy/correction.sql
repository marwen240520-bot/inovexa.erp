-- ============================================
-- SCRIPT DE CORRECTION COMPLET
-- ============================================

BEGIN;

-- ============================================
-- 1. CORRIGER products.id (TEXT → INTEGER)
-- ============================================

-- Créer une séquence
CREATE SEQUENCE IF NOT EXISTS products_id_seq;

-- Ajouter une colonne temporaire
ALTER TABLE products ADD COLUMN id_new INTEGER;

-- Remplir avec des valeurs séquentielles
UPDATE products SET id_new = nextval('products_id_seq');

-- Supprimer l'ancienne PK
ALTER TABLE products DROP CONSTRAINT IF EXISTS PK_0806c755e0aca124e67c0cf6d7d;

-- Supprimer l'ancienne colonne
ALTER TABLE products DROP COLUMN id;

-- Renommer la nouvelle colonne
ALTER TABLE products RENAME COLUMN id_new TO id;

-- Ajouter la PK
ALTER TABLE products ADD PRIMARY KEY (id);

-- Définir la séquence par défaut
ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');

-- Mettre à jour la séquence
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));


-- ============================================
-- 2. CORRIGER transporteurs.id (UUID → INTEGER)
-- ============================================

-- Créer une séquence
CREATE SEQUENCE IF NOT EXISTS transporteurs_id_seq;

-- Ajouter une colonne temporaire
ALTER TABLE transporteurs ADD COLUMN id_new INTEGER;

-- Remplir avec des valeurs séquentielles
UPDATE transporteurs SET id_new = nextval('transporteurs_id_seq');

-- Supprimer l'ancienne PK
ALTER TABLE transporteurs DROP CONSTRAINT IF EXISTS PK_994cc128fab3b2e3c91a5e87ad1;

-- Supprimer l'ancienne colonne
ALTER TABLE transporteurs DROP COLUMN id;

-- Renommer la nouvelle colonne
ALTER TABLE transporteurs RENAME COLUMN id_new TO id;

-- Ajouter la PK
ALTER TABLE transporteurs ADD PRIMARY KEY (id);

-- Définir la séquence par défaut
ALTER TABLE transporteurs ALTER COLUMN id SET DEFAULT nextval('transporteurs_id_seq');

-- Mettre à jour la séquence
SELECT setval('transporteurs_id_seq', COALESCE((SELECT MAX(id) FROM transporteurs), 1));


-- ============================================
-- 3. CORRIGER admin, customers, export, search
-- ============================================

-- Ajouter userId à admin
ALTER TABLE admin ADD COLUMN IF NOT EXISTS "userId" INTEGER REFERENCES users(id);
ALTER TABLE admin ALTER COLUMN "userId" SET NOT NULL;

-- Ajouter userId à customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "userId" INTEGER REFERENCES users(id);
ALTER TABLE customers ALTER COLUMN "userId" SET NOT NULL;

-- Ajouter userId à export
ALTER TABLE export ADD COLUMN IF NOT EXISTS "userId" INTEGER REFERENCES users(id);
ALTER TABLE export ALTER COLUMN "userId" SET NOT NULL;

-- Ajouter userId à search
ALTER TABLE search ADD COLUMN IF NOT EXISTS "userId" INTEGER REFERENCES users(id);
ALTER TABLE search ALTER COLUMN "userId" SET NOT NULL;

-- Rendre transporteurs.userId NOT NULL
ALTER TABLE transporteurs ALTER COLUMN "userId" SET NOT NULL;


-- ============================================
-- 4. CORRIGER employees (dates TEXT → TIMESTAMP)
-- ============================================

ALTER TABLE employees 
    ALTER COLUMN "hireDate" TYPE TIMESTAMP USING "hireDate"::TIMESTAMP,
    ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt"::TIMESTAMP,
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt"::TIMESTAMP;

ALTER TABLE employees ALTER COLUMN "hireDate" SET DEFAULT NOW();
ALTER TABLE employees ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE employees ALTER COLUMN "updatedAt" SET DEFAULT NOW();


-- ============================================
-- 5. AJOUTER LES CLÉS ÉTRANGÈRES
-- ============================================

-- invoices → clients
ALTER TABLE invoices ADD CONSTRAINT IF NOT EXISTS fk_invoice_client 
    FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE SET NULL;

-- invoices → suppliers
ALTER TABLE invoices ADD CONSTRAINT IF NOT EXISTS fk_invoice_supplier 
    FOREIGN KEY ("supplierId") REFERENCES suppliers(id) ON DELETE SET NULL;

-- shipments → transporteurs
ALTER TABLE shipments ADD CONSTRAINT IF NOT EXISTS fk_shipment_transporteur 
    FOREIGN KEY ("transporteurId") REFERENCES transporteurs(id) ON DELETE SET NULL;

-- orders → clients
ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_order_client 
    FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE SET NULL;

-- orders → products
ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS fk_order_product 
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL;

-- sales → products
ALTER TABLE sales ADD CONSTRAINT IF NOT EXISTS fk_sale_product 
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL;

-- purchases → products
ALTER TABLE purchases ADD CONSTRAINT IF NOT EXISTS fk_purchase_product 
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL;

-- products → users
ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS fk_product_user 
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- clients → users
ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS fk_client_user 
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;


-- ============================================
-- 6. RENDRE LES COLONNES OBLIGATOIRES
-- ============================================

ALTER TABLE orders ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE orders ALTER COLUMN "productId" SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE shipments ALTER COLUMN "transporteurId" SET NOT NULL;
ALTER TABLE sales ALTER COLUMN "productId" SET NOT NULL;
ALTER TABLE purchases ALTER COLUMN "productId" SET NOT NULL;


-- ============================================
-- 7. NORMALISER expenses
-- ============================================

-- Supprimer la colonne amount (garder amountHT)
ALTER TABLE expenses DROP COLUMN IF EXISTS amount;

-- Renommer amountHT en amount
ALTER TABLE expenses RENAME COLUMN "amountHT" TO amount;


-- ============================================
-- 8. SUPPRIMER customers SI DOUBLON
-- ============================================

-- Si customers est un doublon de clients, on le supprime
-- ATTENTION: Vérifier qu'il n'y a pas de données importantes
DO $$ 
BEGIN
    IF (SELECT COUNT(*) FROM customers) = 0 THEN
        DROP TABLE customers CASCADE;
        RAISE NOTICE '✅ Table customers supprimée (vide)';
    ELSE
        RAISE NOTICE '⚠️ Table customers contient des données, non supprimée';
    END IF;
END $$;


-- ============================================
-- 9. CRÉER L'ADMIN SI ABSENT
-- ============================================

INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
SELECT 'marwen2405@gmail.com', '$2b$10$XQr.gZqZ4Qk5h.8XQr.gZqZ4Qk5h.8XQr.gZqZ4Qk5h.8XQr.gZqZ4Qk5h.', 'Admin', 'admin', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'marwen2405@gmail.com');


-- ============================================
-- 10. VÉRIFICATION FINALE
-- ============================================

-- Vérifier les types des colonnes ID
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE column_name = 'id' 
AND table_schema = 'public'
ORDER BY table_name;

-- Vérifier les FK
SELECT 
    conname, 
    conrelid::regclass AS table_name, 
    confrelid::regclass AS references_table
FROM pg_constraint 
WHERE contype = 'f' 
ORDER BY conname;

COMMIT;
