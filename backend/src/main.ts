import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ⚡ Compression gzip des réponses (listes JSON de ventes, produits, clients…) :
  // 5 à 10 fois moins de données à transférer vers le navigateur.
  // Les flux SSE (text/event-stream) ne sont pas compressés pour rester en temps réel.
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        const type = String(res.getHeader('Content-Type') || '');
        if (type.includes('text/event-stream')) return false;
        return compression.filter(req, res);
      },
    }),
  );

  // ✅ زيادة حجم الطلب المسموح به (افتراضياً 100kb فقط)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    // ⚡ Le navigateur garde la réponse de pré-vérification CORS (OPTIONS) pendant 2 h :
    // chaque appel avec en-tête Authorization ne fait plus qu'UN aller-retour au lieu de deux.
    maxAge: 7200,
  });

  app.useGlobalPipes(new ValidationPipe());

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
