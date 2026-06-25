const express = require('express');
const path = require('path');
const app = express();

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Proxy vers NestJS
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule);
  nestApp.enableCors();
  await nestApp.listen(3002);
  console.log('🚀 NestJS running on port 3002');
}

bootstrap();

// Servir les fichiers sur le port 3003
app.listen(3003, () => {
  console.log('📁 Static files server running on port 3003');
  console.log('📁 http://localhost:3003/uploads/profiles/');
});
