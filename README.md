# 🚀 Inovexa-AI ERP

[![GitHub stars](https://img.shields.io/github/stars/marwen240520-bot/inovexa-erp)](https://github.com/marwen240520-bot/inovexa-erp/stargazers)
[![GitHub license](https://img.shields.io/github/license/marwen240520-bot/inovexa-erp)](https://github.com/marwen240520-bot/inovexa-erp/blob/main/LICENSE)
[![Made with NestJS](https://img.shields.io/badge/Made%20with-NestJS-red)](https://nestjs.com/)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black)](https://nextjs.org/)

**ERP nouvelle génération avec intelligence artificielle intégrée**

## 📋 Table des matières
- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Déploiement](#-déploiement)
- [Documentation](#-documentation)

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- JWT avec refresh tokens
- 2FA (QR code)
- RBAC avancé
- Audit logs

### 💰 Modules métier
| Module | Fonctionnalités |
|--------|----------------|
| **Finance** | Factures, Paiements Stripe, Reporting |
| **Inventory** | Produits, Stocks, Alertes |
| **HR** | Employés, Congés, Paie |
| **Sales** | Clients, Devis, Commandes |
| **Production** | BOM, Ordres de fabrication |
| **Logistics** | Expéditions, Suivi |

### 🤖 Intelligence Artificielle
- Assistant IA conversationnel
- Prédictions de ventes
- Analyse des données
- Recommandations

### 📊 Analytics
- Dashboard temps réel
- Rapports personnalisables
- Export PDF/Excel

## 🛠 Stack technique

### Backend
- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Paiement**: Stripe
- **Emails**: SendGrid

### Frontend
- **Framework**: Next.js 16
- **Styling**: Tailwind CSS
- **State**: Zustand
- **API Client**: TanStack Query

### DevOps
- **Backend**: Railway
- **Frontend**: Vercel
- **Monitoring**: Sentry

## 📁 Architecture

\\\
inovexa-erp/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/      # Authentification
│   │   │   ├── users/     # Gestion utilisateurs
│   │   │   ├── finance/   # Comptabilité
│   │   │   ├── inventory/ # Stock
│   │   │   ├── hr/        # RH
│   │   │   ├── sales/     # Ventes
│   │   │   ├── production/# Production
│   │   │   ├── logistics/ # Logistique
│   │   │   ├── ai/        # Assistant IA
│   │   │   └── analytics/ # Analytics
│   └── test/
├── frontend/         # Application Next.js
├── docs/             # Documentation
└── database/         # Migrations
\\\

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Redis (optionnel)

### Backend
\\\ash
cd backend
npm install
cp .env.example .env
# Configurer .env avec vos variables
npm run start:dev
\\\

### Frontend
\\\ash
cd frontend
npm install
npm run dev
\\\

### Variables d'environnement
\\\env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/inovexa

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET=your-secret-key

# Frontend
FRONTEND_URL=http://localhost:3000
\\\

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |

## 📚 Documentation

- [Guide utilisateur](docs/user-guide.md)
- [Guide développeur](docs/developer-guide.md)
- [API Reference](docs/api.md)
- [Postman Collection](docs/Inovexa-AI.postman_collection.json)

## 🧪 Tests

\\\ash
# Backend
cd backend
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run test
npm run test:e2e
\\\

## 📦 Déploiement

### Railway (Backend)
\\\ash
cd backend
railway login
railway up
\\\

### Vercel (Frontend)
\\\ash
cd frontend
vercel --prod
\\\

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Crée ta branche (git checkout -b feature/amazing)
3. Commit tes changements (git commit -m 'Add amazing feature')
4. Push (git push origin feature/amazing)
5. Ouvre une Pull Request

## 📄 Licence

MIT © [Inovexa](https://inovexa.ai)

---

**Fait avec ❤️ par l'équipe Inovexa**
