# Guide développeur - Inovexa-AI ERP

## Architecture
- Backend: NestJS
- Frontend: Next.js
- Base de données: PostgreSQL

## Structure du projet
\\\
inovexa-erp/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── modules/  # Modules métier
│   │   ├── config/   # Configuration
│   │   └── common/   # Utilitaires
├── frontend/         # Application Next.js
│   ├── app/          # Pages
│   ├── components/   # Composants UI
│   └── lib/          # Utilitaires
└── database/         # Migrations
\\\

## Installation locale
\\\ash
git clone [repo]
cd inovexa-erp/backend
npm install
npm run start:dev

cd ../frontend
npm install
npm run dev
\\\

## Variables d'environnement
\\\env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api
\\\

## API Endpoints
Documentation Swagger: /api/docs

## Déploiement
\\\ash
# Backend (Railway)
cd backend
railway up

# Frontend (Vercel)
cd frontend
vercel --prod
\\\

## Contribution
1. Créer une branche
2. Développer la fonctionnalité
3. Écrire des tests
4. Faire une pull request
