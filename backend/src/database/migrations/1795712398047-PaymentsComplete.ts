import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Paiement complet : identité légale de l'éditeur sur les reçus (platform_settings.issuer*) et compteur de numérotation
 * des reçus SANS TROU (number_sequences, clé « platform_receipt »), initialisé à partir des reçus déjà émis pour que la
 * suite continue après le plus grand numéro existant.
 * Générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script).
 */
export class PaymentsComplete1795712398047 implements MigrationInterface {
  name = 'PaymentsComplete1795712398047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "issuerName" character varying(160)`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "issuerTaxId" character varying(40)`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "issuerAddress" character varying(300)`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "issuerRegistry" character varying(60)`);
    // Les reçus déjà émis (REC-AAAA-NNNNN) gardent leur numéro ; le compteur reprend après le plus grand de chaque année.
    await queryRunner.query(`INSERT INTO "number_sequences" ("userId", "key", "year", "lastValue")
      SELECT 0, 'platform_receipt', split_part("receiptNumber", '-', 2)::int, MAX(split_part("receiptNumber", '-', 3)::int)
      FROM "subscription_payments"
      WHERE "receiptNumber" ~ '^REC-[0-9]{4}-[0-9]+$'
      GROUP BY split_part("receiptNumber", '-', 2)::int
      ON CONFLICT ("userId", "key", "year") DO UPDATE SET "lastValue" = GREATEST("number_sequences"."lastValue", EXCLUDED."lastValue")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "issuerRegistry"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "issuerAddress"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "issuerTaxId"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "issuerName"`);
  }
}
