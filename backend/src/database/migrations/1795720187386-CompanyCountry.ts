import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Société internationale : pays de la société (code ISO 3166-1 alpha-2, « TN » pour toutes les sociétés existantes) et liste
 * des taux de TVA propre à la société (NULL = taux par défaut du pays : 0 / 7 / 13 / 19 % pour la Tunisie, 0 % ailleurs).
 * Générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script).
 */
export class CompanyCountry1795720187386 implements MigrationInterface {
  name = 'CompanyCountry1795720187386';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "countryCode" character varying(2) NOT NULL DEFAULT 'TN'`);
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "vatRates" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "vatRates"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "countryCode"`);
  }
}
