import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Paiement en ligne par Flouci : Flouci encaisse uniquement en dinars. Quand les formules sont dans une autre devise (dollars
 * par défaut), le montant TTC est converti en dinars au moment d'ouvrir le paiement ; le montant réellement débité et sa
 * devise sont gardés sur le paiement (chargedAmount, chargedCurrency) pour être comparés à la confirmation de Flouci.
 * Colonnes facultatives (null pour les paiements hors ligne et les anciens paiements) ; idempotente.
 */
export class FlouciPayments1795900000000 implements MigrationInterface {
  name = 'FlouciPayments1795900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "chargedAmount" numeric(12,3)`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "chargedCurrency" character varying(3)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscription_payments" DROP COLUMN IF EXISTS "chargedCurrency"`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" DROP COLUMN IF EXISTS "chargedAmount"`);
  }
}
