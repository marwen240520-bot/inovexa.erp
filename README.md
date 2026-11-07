# Inovexa ERP

ERP de gestion pour PME tunisiennes : ventes et achats (devis → bon de livraison → facture → avoir), stock multi-dépôts,
règlements, comptabilité, paie, CRM, caisse, rapports — avec un assistant IA branché sur les données de l'entreprise.

```
backend/    API NestJS + TypeORM + PostgreSQL
frontend/   Interface Next.js
docs/       Guides (voir ci-dessous)
mobile/     Application mobile
```

## Démarrage rapide

**Avec Docker** (PostgreSQL + API + interface) :

```bash
cp .env.example .env          # renseignez POSTGRES_PASSWORD et JWT_SECRET (openssl rand -base64 48)
docker compose up -d --build
docker compose exec -e ADMIN_EMAIL=vous@exemple.tn -e ADMIN_PASSWORD='un mot de passe long' backend node dist/cli/create-admin.js
```

**En développement** (PostgreSQL local requis) :

```bash
cd backend && npm ci
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/inovexa_erp JWT_SECRET=dev-secret
npm run start:dev              # le schéma suit les entités automatiquement (synchronize)
ADMIN_EMAIL=vous@exemple.tn ADMIN_PASSWORD='un mot de passe long' npm run admin:create

cd ../frontend && npm ci && npm run dev
```

API : <http://localhost:3001> — documentation interactive : <http://localhost:3001/api/docs> (désactivée en production, `ENABLE_SWAGGER=true` pour l'activer).

## Qualité

| Commande (dans `backend/`)  | Rôle                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `npm run typecheck`         | vérification TypeScript                                              |
| `npm test`                  | tests unitaires (calculs de TVA/retenue/timbre, paie, chiffres en lettres…) |
| `npm run test:e2e`          | tests de bout en bout sur PostgreSQL réel, schéma créé par les migrations (`E2E_ADMIN_URL` requis) |
| `npm run migration:generate -- Nom` | génère la migration d'une évolution d'entité                 |

La CI GitHub (`.github/workflows/ci.yml`) exécute tout cela à chaque push, plus la compilation de l'interface, la construction
des images Docker et une vérification que **les migrations reflètent exactement les entités**.

## Documentation

- [`docs/ERP-PRO.md`](docs/ERP-PRO.md) — fonctionnalités, règles fiscales et comptables, **points à faire valider par votre expert-comptable**
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — déploiement, migrations, sauvegardes et restauration, rotation des secrets
- [`docs/developer-guide.md`](docs/developer-guide.md), [`docs/user-guide.md`](docs/user-guide.md)
