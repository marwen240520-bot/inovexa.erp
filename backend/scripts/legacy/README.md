# Scripts historiques — ne pas utiliser en production

Ces scripts ont servi à dépanner la base **avant** l'arrivée des migrations versionnées
(`backend/src/database/migrations`). Ils sont conservés pour mémoire uniquement.

⚠ Plusieurs suppriment ou réécrivent des données (`reset-*`, `drop-and-recreate-db`, `force-reset`, `clean-*`, `fix-*`)
ou créent des comptes avec des mots de passe écrits dans le code (`create-admin*`, `seed`).

À la place :

| Besoin                          | Commande                                                          |
| ------------------------------- | ----------------------------------------------------------------- |
| Créer / mettre à jour le schéma | `npm run migration:run` (ou automatique au démarrage en production) |
| Évolution d'une entité          | `npm run migration:generate -- NomDeLaMigration`                  |
| Premier administrateur          | `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create`             |
| Sauvegarde / restauration       | `npm run backup`, `npm run restore:check` (voir docs/OPERATIONS.md) |

Quand plus personne n'en a besoin, supprimez ce dossier.
