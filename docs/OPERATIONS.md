# Exploitation : déploiement, migrations, sauvegardes, secrets

## 1. Déploiement avec Docker

```bash
cp .env.example .env              # renseigner POSTGRES_PASSWORD et JWT_SECRET
docker compose up -d --build
docker compose exec -e ADMIN_EMAIL=vous@exemple.tn -e ADMIN_PASSWORD='un mot de passe long' backend node dist/cli/create-admin.js
```

- En production (`NODE_ENV=production`) l'API **applique les migrations au démarrage** : le schéma est créé ou mis à jour tout seul,
  sans `synchronize`. Une entité modifiée sans migration ne touche donc jamais aux données de production.
- Pour lancer les migrations à la main (`DB_MIGRATIONS_RUN=false`) : `npm run migration:run:prod`.
- Le conteneur API expose un contrôle de santé (`GET /`). Placez un reverse proxy HTTPS (Caddy, Nginx, Traefik) devant l'API et l'interface.
- Pensez à fixer le **même fuseau horaire** pour Node et PostgreSQL (UTC recommandé : `TZ=UTC`, `timezone = 'UTC'`) ; les colonnes
  `timestamp` sont lues avec le fuseau du processus Node.

## 2. Faire évoluer le schéma (développeurs)

1. Modifier l'entité.
2. `npm run migration:generate -- NomDeLaMigration` (avec `DATABASE_URL` pointant sur une base déjà migrée) : le SQL produit est **idempotent**.
3. Relire le fichier ; si TypeORM propose « DROP COLUMN puis ADD COLUMN » pour un changement de type, le remplacer par `ALTER COLUMN … TYPE … USING …` (sinon les données sont perdues — le script le signale).
4. Commiter l'entité **et** la migration. La CI échoue si une entité diffère des migrations.

## 3. Sauvegardes

Tout est dans `backend/scripts/ops/`.

| Action                         | Commande                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| Sauvegarde chiffrée            | `DATABASE_URL=… BACKUP_PASSPHRASE=… npm run backup`               |
| Copie hors serveur             | ajouter `BACKUP_S3_URI=s3://bucket/inovexa` (+ `BACKUP_S3_ENDPOINT` hors AWS) |
| **Test de restauration**       | `ADMIN_DATABASE_URL=…/postgres DATABASE_URL=… BACKUP_PASSPHRASE=… npm run restore:check` |
| Restauration réelle            | `TARGET_DATABASE_URL=…/base_vide BACKUP_PASSPHRASE=… bash scripts/ops/restore.sh fichier.dump.gpg` |

- Le workflow `.github/workflows/backup.yml` sauvegarde chaque nuit puis **restaure la sauvegarde dans une base temporaire et la compare à
  la source**. Secrets à créer : `DATABASE_URL`, `BACKUP_PASSPHRASE`, et idéalement `BACKUP_S3_URI` + clés d'accès.
- **Conservez la phrase de passe en dehors du serveur** (gestionnaire de mots de passe) : sans elle, les sauvegardes sont illisibles.
- La restauration refuse une base cible non vide et vérifie la somme de contrôle : on ne peut pas écraser une base par erreur.
- Objectif raisonnable : sauvegarde quotidienne, conservation 14 jours en local + 30 jours hors serveur, test de restauration à chaque sauvegarde.

## 4. Secrets : à faire tout de suite

Deux fichiers contenant des secrets ont été versionnés dans l'historique Git avant ce nettoyage (`.env.local` et `backend/admin-register.json`).
Ils sont maintenant ignorés et retirés de la version courante, **mais restent lisibles dans l'historique** :

1. Changer le `JWT_SECRET` (cela déconnecte tout le monde) et tous les mots de passe contenus dans ces fichiers (base de données, SMTP, comptes administrateurs).
2. Si le dépôt est ou a été public, considérer ces valeurs comme compromises même après nettoyage de l'historique
   (`git filter-repo --path .env.local --path backend/admin-register.json --invert-paths`, puis push forcé et reclonage par tous).
3. Aucun mot de passe par défaut n'est fourni : `docker-compose.yml` refuse de démarrer sans `POSTGRES_PASSWORD` et `JWT_SECRET`.

## 5. Variables d'environnement

Voir `.env.example`, qui liste chaque variable avec son effet. Obligatoires : `DATABASE_URL` (ou `POSTGRES_*` avec Docker Compose) et `JWT_SECRET`.
