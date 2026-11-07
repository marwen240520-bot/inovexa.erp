import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';

/**
 * Source de données pour la ligne de commande TypeORM (migrations) :
 *   npm run migration:run       applique les migrations en attente
 *   npm run migration:revert    annule la dernière
 *   npm run migration:show      liste l'état
 */
export default new DataSource(
  buildTypeOrmOptions({ synchronize: false, migrationsRun: false } as any),
);
