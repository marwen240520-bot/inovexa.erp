const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function testPassword() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'inovexa_erp',
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT password FROM users WHERE email = $1',
      ['marwen2405@gmail.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    const storedHash = result.rows[0].password;
    const testPassword = '123456';
    const isValid = await bcrypt.compare(testPassword, storedHash);
    
    if (isValid) {
      console.log('✅ MOT DE PASSE VALIDE !');
      console.log('   Le hash correspond bien à "123456"');
    } else {
      console.log('❌ MOT DE PASSE INVALIDE');
      console.log('   Le hash ne correspond pas à "123456"');
    }
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await client.end();
  }
}

testPassword();
