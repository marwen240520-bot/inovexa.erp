const https = require('http');

async function testApi() {
  console.log('📡 Test de l\'API Invoices...\n');
  
  // 1. Tester la connexion au backend
  try {
    const res = await fetch('http://localhost:3001');
    if (res.ok) {
      console.log('✅ Backend accessible sur le port 3001');
    } else {
      console.log('⚠️ Backend en cours de démarrage...');
    }
  } catch(e) {
    console.log('⚠️ Backend non accessible (démarrage en cours)');
  }
  
  // 2. Tester l'endpoint invoices (nécessite un token)
  console.log('\n💡 Pour tester l\'API, connectez-vous d\'abord via le frontend');
  console.log('   http://localhost:3000/auth/login');
  console.log('   Email: marwen2405@gmail.com');
  console.log('   Mot de passe: 123456');
}

testApi();
