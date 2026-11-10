import { MigrationInterface, QueryRunner } from 'typeorm';

/** Migration générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script). */
export class ModuleLinks1794328096299 implements MigrationInterface {
  name = 'ModuleLinks1794328096299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "productId" integer`);
    await queryRunner.query(`ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "components" jsonb`);
    await queryRunner.query(`ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "stockedQuantity" numeric(14,3) NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "documentId" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "documentId"`);
    await queryRunner.query(`ALTER TABLE "production_orders" DROP COLUMN "stockedQuantity"`);
    await queryRunner.query(`ALTER TABLE "production_orders" DROP COLUMN "components"`);
    await queryRunner.query(`ALTER TABLE "production_orders" DROP COLUMN "productId"`);
  }
}
