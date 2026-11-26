import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Retire la langue arabe (colonne sectors.nameAr) et enregistre la langue de l'interface de chaque compte (users.language :
 * fr, en ou es), pour écrire les emails dans la langue du client.
 * Générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script).
 */
export class LanguageAndNoArabic1795711761451 implements MigrationInterface {
  name = 'LanguageAndNoArabic1795711761451';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sectors" DROP COLUMN IF EXISTS "nameAr"`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" character varying(2) NOT NULL DEFAULT 'fr'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "language"`);
    await queryRunner.query(`ALTER TABLE "sectors" ADD "nameAr" character varying(120)`);
  }
}
