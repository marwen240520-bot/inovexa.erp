import { MigrationInterface, QueryRunner } from 'typeorm';

/** Migration générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script). */
export class SavedReports1795652186513 implements MigrationInterface {
  name = 'SavedReports1795652186513';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "saved_reports" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "name" character varying(160) NOT NULL, "type" character varying(40) NOT NULL, "data" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ab9983395681688e8d042fbe12e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_saved_reports_user" ON "saved_reports" ("userId", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_saved_reports_user"`);
    await queryRunner.query(`DROP TABLE "saved_reports"`);
  }
}
