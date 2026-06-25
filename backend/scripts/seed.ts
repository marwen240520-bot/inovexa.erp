// scripts/seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  
  // Admin
  const adminEmail = 'marwen2405@gmail.com';
  const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const admin = userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      isActive: true,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
    });
    
    await userRepository.save(admin);
    console.log('✅ Admin créé avec succès !');
  } else {
    console.log('✅ Admin déjà existant');
  }
  
  // Créer un client de test
  const clientEmail = 'client@test.com';
  const existingClient = await userRepository.findOne({ where: { email: clientEmail } });
  
  if (!existingClient) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const client = userRepository.create({
      email: clientEmail,
      password: hashedPassword,
      name: 'Client Test',
      role: 'client',
      isActive: true,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    });
    
    await userRepository.save(client);
    console.log('✅ Client de test créé avec succès !');
  } else {
    console.log('✅ Client de test déjà existant');
  }
  
  await app.close();
  console.log('🎉 Seeding terminé !');
}

seed().catch(error => {
  console.error('❌ Erreur lors du seeding:', error);
  process.exit(1);
});
