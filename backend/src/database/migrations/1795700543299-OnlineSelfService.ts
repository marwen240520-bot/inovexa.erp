import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tout en ligne, sans intervention de l'administrateur :
 *  - paiement par carte (Konnect) : référence du prestataire, page de paiement et retour sur subscription_payments ;
 *  - code de vérification à 6 chiffres envoyé par email (users.emailCode*) ;
 *  - nouveaux modules : Rendez-vous (appointments) et Projets avec leurs tâches (projects, project_tasks) ;
 *  - réglages : paiements hors ligne désactivés par défaut, devise USD et code de vérification par défaut pour les
 *    nouvelles installations (la ligne existante est mise à niveau par SaasSettingsService.upgradeDefaults).
 * Aucune colonne ni table n'est supprimée.
 *
 * Migration générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script).
 */
export class OnlineSelfService1795700543299 implements MigrationInterface {
  name = 'OnlineSelfService1795700543299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "project_tasks" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "projectId" integer NOT NULL, "title" character varying(200) NOT NULL, "assignee" character varying(120), "dueDate" date, "status" character varying(10) NOT NULL DEFAULT 'todo', "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b1b6204912a6f44133df3a4518b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_project_tasks_project" ON "project_tasks" ("userId", "projectId")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "appointments" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "title" character varying(160) NOT NULL, "clientId" integer, "clientName" character varying(160), "clientPhone" character varying(40), "service" character varying(160), "resource" character varying(120), "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying(12) NOT NULL DEFAULT 'scheduled', "partySize" integer, "price" numeric(14,3), "notes" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_appointments_user_start" ON "appointments" ("userId", "startAt")`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailCodeHash" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailCodeExpires" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailCodeAttempts" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailCodeSentAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "manualPayments" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "providerRef" character varying(80)`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "checkoutUrl" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "returnBase" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "code" character varying(40)`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "clientId" integer`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "clientName" character varying(160)`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "description" text`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "location" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "manager" character varying(120)`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "startDate" date`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "endDate" date`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "progress" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "priority" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "requireEmailVerification" SET DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "currency" SET DEFAULT 'USD'`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_payments_provider_ref" ON "subscription_payments" ("providerRef") WHERE "providerRef" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_subscription_payments_provider_ref"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "currency" SET DEFAULT 'TND'`);
    await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "requireEmailVerification" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "priority"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "progress"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "endDate"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "startDate"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "manager"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "clientName"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "clientId"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "code"`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" DROP COLUMN "returnBase"`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" DROP COLUMN "expiresAt"`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" DROP COLUMN "checkoutUrl"`);
    await queryRunner.query(`ALTER TABLE "subscription_payments" DROP COLUMN "providerRef"`);
    await queryRunner.query(`ALTER TABLE "platform_settings" DROP COLUMN "manualPayments"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailCodeSentAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailCodeAttempts"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailCodeExpires"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailCodeHash"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_appointments_user_start"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_tasks_project"`);
    await queryRunner.query(`DROP TABLE "project_tasks"`);
  }
}
