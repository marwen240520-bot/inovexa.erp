import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dépenses : le montant HT, la TVA et le taux étaient des ENTIERS en base (seul « amount » était décimal). Une dépense de
 * 84,034 DT HT était refusée (erreur 500) ou arrondie au dinar. Conversion sur place, sans perte de données ; idempotente.
 */
export class ExpenseDecimals1795813000000 implements MigrationInterface {
  name = 'ExpenseDecimals1795813000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "amountHT" TYPE numeric(10,2) USING "amountHT"::numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "taxAmount" TYPE numeric(10,2) USING "taxAmount"::numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "taxRate" TYPE numeric(5,2) USING "taxRate"::numeric(5,2)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "taxRate" TYPE integer USING round("taxRate")::integer`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "taxAmount" TYPE integer USING round("taxAmount")::integer`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "amountHT" TYPE integer USING round("amountHT")::integer`);
  }
}
