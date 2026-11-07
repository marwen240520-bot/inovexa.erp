import { MigrationInterface, QueryRunner } from 'typeorm';

/** Migration générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script). */
export class PosSessions1794065158263 implements MigrationInterface {
  name = 'PosSessions1794065158263';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "posSessionId" integer`);
    await queryRunner.query(`ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "ticketNumber" character varying(30)`);
    await queryRunner.query(`ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "posSessionId" integer`);
    await queryRunner.query(`ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "ticketNumber" character varying(30)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "ticketNumber"`);
    await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "posSessionId"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "ticketNumber"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "posSessionId"`);
  }
}
