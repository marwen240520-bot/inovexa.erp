import { MigrationInterface, QueryRunner } from 'typeorm';

/** Migration générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script). */
export class TtnReference1794326209799 implements MigrationInterface {
  name = 'TtnReference1794326209799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "ttnReference" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "ttnValidatedAt" TIMESTAMP`);
    // Nettoyage des mentions héritées du jeu de démonstration et de l'ancien module (imprimées sur les PDF).
    await queryRunner.query(`UPDATE "documents" SET "notes" = NULL WHERE lower(trim("notes")) = 'facture de démonstration'`);
    await queryRunner.query(String.raw`UPDATE "documents" SET "paymentTerms" = regexp_replace("paymentTerms", '^Net\s+(\d+)$', ' jours', 'i') WHERE "paymentTerms" ~* '^Net\s+\d+$'`);
    await queryRunner.query(`UPDATE "invoices" SET "notes" = NULL WHERE lower(trim("notes")) = 'facture de démonstration'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "ttnValidatedAt"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "ttnReference"`);
  }
}
