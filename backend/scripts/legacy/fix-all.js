const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function fixAll() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    console.log('🔧 CORRECTION DE LA BASE...\n');

    // 1. CORRIGER LES TABLES AVEC UUID (passer en TEXT)
    const uuidTables = ['admin', 'customers', 'export', 'search', 'transporteurs'];
    
    for (const table of uuidTables) {
      try {
        // Vérifier si la colonne id est de type UUID
        const checkResult = await client.query(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = 'id'
        `, [table]);
        
        if (checkResult.rows.length > 0 && checkResult.rows[0].data_type === 'uuid') {
          console.log(`🔧 Conversion ${table}.id de UUID à TEXT...`);
          await client.query(`ALTER TABLE "${table}" ALTER COLUMN id TYPE TEXT`);
          console.log(`✅ ${table}.id converti en TEXT`);
        }
      } catch(e) {
        console.log(`⚠️ ${table}: ${e.message}`);
      }
    }

    // 2. CORRIGER products.id (TEXT → INTEGER avec séquence)
    try {
      console.log('\n🔧 Correction products.id...');
      
      // Vérifier le type actuel
      const checkResult = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'id'
      `);
      
      if (checkResult.rows.length > 0 && checkResult.rows[0].data_type === 'text') {
        // Créer une séquence temporaire
        await client.query(`CREATE SEQUENCE IF NOT EXISTS products_id_seq`);
        
        // Ajouter une colonne temporaire
        await client.query(`ALTER TABLE products ADD COLUMN id_new INTEGER`);
        
        // Mettre à jour avec des valeurs séquentielles
        await client.query(`
          UPDATE products SET id_new = nextval('products_id_seq')
        `);
        
        // Supprimer l'ancienne colonne et renommer
        await client.query(`ALTER TABLE products DROP COLUMN id`);
        await client.query(`ALTER TABLE products RENAME COLUMN id_new TO id`);
        await client.query(`ALTER TABLE products ALTER COLUMN id SET NOT NULL`);
        await client.query(`ALTER TABLE products ADD PRIMARY KEY (id)`);
        
        console.log('✅ products.id converti en INTEGER avec séquence');
      }
    } catch(e) {
      console.log(`⚠️ products: ${e.message}`);
    }

    // 3. AJOUTER LES CONTRAINTES NOT NULL SUR products
    try {
      await client.query(`ALTER TABLE products ALTER COLUMN "userId" SET NOT NULL`);
      console.log('✅ products.userId NOT NULL');
    } catch(e) {
      console.log(`⚠️ products.userId: ${e.message}`);
    }

    // 4. CRÉER L'ADMIN S'IL N'EXISTE PAS
    const adminCheck = await client.query(
      `SELECT * FROM users WHERE email = 'marwen2405@gmail.com'`
    );
    
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await client.query(`
        INSERT INTO users (email, password, name, role, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['marwen2405@gmail.com', hashedPassword, 'Admin', 'admin', true, new Date(), new Date()]);
      
      console.log('✅ Admin créé');
    } else {
      console.log('✅ Admin existe déjà');
    }

    // 5. VÉRIFIER ET CORRIGER LES SÉQUENCES
    const sequences = ['products_id_seq', 'categories_id_seq', 'clients_id_seq', 'invoices_id_seq', 'orders_id_seq', 'shipments_id_seq', 'suppliers_id_seq'];
    
    for (const seq of sequences) {
      try {
        await client.query(`SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM ${seq.replace('_id_seq', 's')}), 1))`);
        console.log(`✅ ${seq} mis à jour`);
      } catch(e) {}
    }

    console.log('\n🎉 Corrections terminées !');
    await client.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

fixAll();
