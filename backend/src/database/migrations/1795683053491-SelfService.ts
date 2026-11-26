import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inscription en libre-service : identifiant Apple d'un compte (« Se connecter avec Apple »), lien de paiement en ligne
 * et version du contenu de départ dans les réglages de la plateforme.
 * Migration générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script).
 */
export class SelfService1795683053491 implements MigrationInterface {
  name = 'SelfService1795683053491';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appleSub" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "paymentLink" character varying(300)`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "catalogVersion" integer NOT NULL DEFAULT '1'`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_apple_sub" ON "users" ("appleSub") WHERE "appleSub" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_users_apple_sub"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "catalogVersion"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "paymentLink"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "appleSub"`);
  }
}
