import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

/**
 * Configuration unique de la base, partagée par l'application (AppModule) et la ligne de commande (migrations).
 *
 * Mode du schéma :
 *  - DÉVELOPPEMENT (par défaut hors production) : `synchronize` — le schéma suit les entités automatiquement ;
 *  - PRODUCTION (NODE_ENV=production) : migrations versionnées exécutées au démarrage. Un changement d'entité
 *    ne peut plus supprimer de colonne par accident : il faut écrire (ou générer) une migration.
 *
 * Variables d'environnement :
 *  - DATABASE_URL        (obligatoire)
 *  - DB_SYNCHRONIZE      "true" | "false" : force le mode (sinon : true hors production, false en production)
 *  - DB_MIGRATIONS_RUN   "false" pour ne PAS lancer les migrations au démarrage (par défaut : oui quand synchronize = false)
 *  - DB_SSL              "true" pour activer SSL (hébergeurs qui l'exigent)
 */
export function isSynchronizeEnabled(): boolean {
  const forced = process.env.DB_SYNCHRONIZE;
  if (forced === 'true') return true;
  if (forced === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export function buildTypeOrmOptions(overrides: Partial<DataSourceOptions> = {}): DataSourceOptions {
  const synchronize = isSynchronizeEnabled();
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'schema_migrations',
    synchronize,
    migrationsRun: !synchronize && process.env.DB_MIGRATIONS_RUN !== 'false',
    logging: false,
    ...overrides,
  } as DataSourceOptions;
}
