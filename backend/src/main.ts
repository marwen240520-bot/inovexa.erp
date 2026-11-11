import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded, type NextFunction, type Request, type Response } from 'express';
import compression = require('compression');
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Derrière un reverse-proxy (Render, Railway, Vercel…) : l'adresse IP réelle vient de X-Forwarded-For.
  app.set('trust proxy', 1);

  // Express 5 lit les paramètres d'URL en mode « simple » : on garde le mode « extended » d'Express 4
  // (ex. ?filtre[statut]=payee → { filtre: { statut: 'payee' } } et ?ids[]=1&ids[]=2 → { ids: ['1', '2'] }).
  app.set('query parser', 'extended');

  // 🛡️ En-têtes de sécurité (HSTS, X-Content-Type-Options, X-Frame-Options…).
  // Les images /uploads sont affichées par le site (autre origine) : d'où cross-origin.
  const swaggerEnabled = process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV !== 'production';
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: swaggerEnabled ? false : undefined,
    }),
  );

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

  // Express 5 laisse req.body à undefined quand la requête n'a pas de corps (Express 4 donnait {}) :
  // on garde l'ancien comportement pour les contrôleurs qui lisent body.xxx sans vérification.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.body === undefined) req.body = {};
    next();
  });

  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URLS || '').split(',').map((s) => s.trim()).filter(Boolean),
  ];
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    // ⚡ Le navigateur garde la réponse de pré-vérification CORS (OPTIONS) pendant 2 h :
    // chaque appel avec en-tête Authorization ne fait plus qu'UN aller-retour au lieu de deux.
    maxAge: 7200,
  });

  // Les DTO à décorateurs sont validés ; les corps typés `any` (anciens modules) passent tels quels.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 📘 Documentation interactive de l'API (OpenAPI / Swagger) : /api/docs
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Inovexa ERP — API')
      .setDescription('API REST de l’ERP : ventes, achats, stock multi-dépôts, documents commerciaux, comptabilité, paie… Authentifiez-vous avec POST /auth/login puis « Authorize » avec le jeton.')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), { swaggerOptions: { persistAuthorization: true } });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
