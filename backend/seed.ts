import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const userRepository = dataSource.getRepository('User');
  
  // Vérifier si admin existe déjà
  const existingAdmin = await userRepository.findOne({ where: { email: 'admin@inovexa.com' } });
  
  if (!existingAdmin) {
    // Créer admin
    const admin = userRepository.create({
      email: 'admin@inovexa.com',
      password: await bcrypt.hash('Admin123!', 10),
      firstName: 'Admin',
      lastName: 'Inovexa',
      role: 'admin',
      isActive: true,
    });
    await userRepository.save(admin);
    console.log('✓ Admin créé: admin@inovexa.com / Admin123!');
  }
  
  // Créer utilisateur test
  const existingUser = await userRepository.findOne({ where: { email: 'user@inovexa.com' } });
  if (!existingUser) {
    const user = userRepository.create({
      email: 'user@inovexa.com',
      password: await bcrypt.hash('User123!', 10),
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
    });
    await userRepository.save(user);
    console.log('✓ Utilisateur créé: user@inovexa.com / User123!');
  }
  
  console.log('✅ Données de test créées avec succès !');
  await app.close();
}

seed().catch(console.error);
