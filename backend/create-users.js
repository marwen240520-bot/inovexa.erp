const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

const dataSource = new DataSource({
  type: 'sqlite',
  database: './data/inovexa.db',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
});

async function createDefaultUsers() {
  await dataSource.initialize();
  
  const userRepo = dataSource.getRepository('User');
  
  // Créer admin
  const adminExists = await userRepo.findOne({ where: { email: 'admin@inovexa.com' } });
  if (!adminExists) {
    const admin = userRepo.create({
      email: 'admin@inovexa.com',
      password: await bcrypt.hash('Admin123!', 10),
      firstName: 'Admin',
      lastName: 'Inovexa',
      role: 'admin',
      isActive: true,
    });
    await userRepo.save(admin);
    console.log('✅ Admin créé: admin@inovexa.com / Admin123!');
  }
  
  // Créer utilisateur
  const userExists = await userRepo.findOne({ where: { email: 'user@inovexa.com' } });
  if (!userExists) {
    const user = userRepo.create({
      email: 'user@inovexa.com',
      password: await bcrypt.hash('User123!', 10),
      firstName: 'User',
      lastName: 'Test',
      role: 'user',
      isActive: true,
    });
    await userRepo.save(user);
    console.log('✅ Utilisateur créé: user@inovexa.com / User123!');
  }
  
  console.log('✅ Comptes par défaut créés avec succès !');
  await dataSource.destroy();
}

createDefaultUsers().catch(console.error);
