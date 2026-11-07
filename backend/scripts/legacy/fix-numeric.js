const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'inovexa_erp',
});

async function fixNumeric() {
  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');
    console.log('🔧 Correction des colonnes NUMERIC...\n');

    // 1. Modifier products.price
    await client.query(`ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(20,2)`);
    console.log('✅ products.price → NUMERIC(20,2)');

    // 2. Modifier sales.total, unitPrice
    await client.query(`ALTER TABLE sales ALTER COLUMN total TYPE NUMERIC(20,2)`);
    await client.query(`ALTER TABLE sales ALTER COLUMN "unitPrice" TYPE NUMERIC(20,2)`);
    console.log('✅ sales.total, unitPrice → NUMERIC(20,2)');

    // 3. Modifier purchases.total, unitPrice
    await client.query(`ALTER TABLE purchases ALTER COLUMN total TYPE NUMERIC(20,2)`);
    await client.query(`ALTER TABLE purchases ALTER COLUMN "unitPrice" TYPE NUMERIC(20,2)`);
    console.log('✅ purchases.total, unitPrice → NUMERIC(20,2)');

    // 4. Modifier orders.total, unitPrice
    await client.query(`ALTER TABLE orders ALTER COLUMN total TYPE NUMERIC(20,2)`);
    await client.query(`ALTER TABLE orders ALTER COLUMN "unitPrice" TYPE NUMERIC(20,2)`);
    console.log('✅ orders.total, unitPrice → NUMERIC(20,2)');

    // 5. Modifier invoices.amount, subtotalHT, taxAmount
    await client.query(`ALTER TABLE invoices ALTER COLUMN amount TYPE NUMERIC(20,2)`);
    await client.query(`ALTER TABLE invoices ALTER COLUMN "subtotalHT" TYPE NUMERIC(20,2)`);
    await client.query(`ALTER TABLE invoices ALTER COLUMN "taxAmount" TYPE NUMERIC(20,2)`);
    console.log('✅ invoices.amount, subtotalHT, taxAmount → NUMERIC(20,2)');

    // 6. Modifier expenses.amount
    await client.query(`ALTER TABLE expenses ALTER COLUMN amount TYPE NUMERIC(20,2)`);
    console.log('✅ expenses.amount → NUMERIC(20,2)');

    // 7. Modifier shipments.amount
    await client.query(`ALTER TABLE shipments ALTER COLUMN amount TYPE NUMERIC(20,2)`);
    console.log('✅ shipments.amount → NUMERIC(20,2)');

    // 8. Modifier clients.totalSpent
    await client.query(`ALTER TABLE clients ALTER COLUMN "totalSpent" TYPE NUMERIC(20,2)`);
    console.log('✅ clients.totalSpent → NUMERIC(20,2)');

    // 9. Modifier suppliers.totalPurchases
    await client.query(`ALTER TABLE suppliers ALTER COLUMN "totalPurchases" TYPE NUMERIC(20,2)`);
    console.log('✅ suppliers.totalPurchases → NUMERIC(20,2)');

    // 10. Modifier employees.salary
    await client.query(`ALTER TABLE employees ALTER COLUMN salary TYPE NUMERIC(20,2)`);
    console.log('✅ employees.salary → NUMERIC(20,2)');

    // 11. Modifier budgets.amount
    await client.query(`ALTER TABLE budgets ALTER COLUMN amount TYPE NUMERIC(20,2)`);
    console.log('✅ budgets.amount → NUMERIC(20,2)');

    // 12. Modifier projects.budget, cost
    await client.query(`ALTER TABLE projects ALTER COLUMN budget TYPE NUMERIC(20,2)`);
    await client.query(`ALTER TABLE projects ALTER COLUMN cost TYPE NUMERIC(20,2)`);
    console.log('✅ projects.budget, cost → NUMERIC(20,2)');

    // 13. Modifier bank_accounts.balance
    await client.query(`ALTER TABLE bank_accounts ALTER COLUMN balance TYPE NUMERIC(20,2)`);
    console.log('✅ bank_accounts.balance → NUMERIC(20,2)');

    console.log('\n🎉 Corrections NUMERIC terminées !');
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await client.end();
  }
}

fixNumeric();
