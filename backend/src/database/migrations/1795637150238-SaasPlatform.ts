import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Couche SaaS : essai gratuit, abonnements, paiements, secteurs d'activité.
 * Générée par scripts/db/make-migration.ts puis relue — SQL idempotent.
 *
 * Ce que fait cette migration sur une base de production existante :
 *  - AJOUTE 8 tables (sectors, sector_categories, sector_items, service_offers, platform_settings, plans,
 *    subscription_payments, support_messages) et 17 colonnes à `users`. Aucune colonne, aucune ligne existante n'est supprimée.
 *  - Remplace deux unicités « sur toute la base » par des unicités « par société » :
 *      shipments.trackingNumber  ->  (clientId, trackingNumber)
 *      invoices.operationNumber  ->  (userId, operationNumber)
 *    Les données existantes respectent déjà la nouvelle règle (elle est moins stricte) : la création des index ne peut pas échouer.
 *  - Comptes déjà présents : `expiryEnforced = false`. Leur date de fin d'abonnement n'était pas appliquée jusqu'ici ;
 *    elle ne le devient pas par surprise au déploiement. L'administrateur l'active compte par compte.
 *
 * Retour arrière : cette migration est additive, il suffit de redéployer la version précédente de l'application
 * (elle ignore les nouvelles tables et colonnes). `down` refuse de s'exécuter : il détruirait l'historique des paiements.
 */
export class SaasPlatform1795637150238 implements MigrationInterface {
  name = 'SaasPlatform1795637150238';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sectors" ("id" SERIAL NOT NULL, "code" character varying(40) NOT NULL, "name" character varying(120) NOT NULL, "nameEn" character varying(120), "nameAr" character varying(120), "description" character varying(500), "modules" jsonb, "recommendations" jsonb, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_923fdda0dc12f59add7b3a1782f" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sectors_code" ON "sectors" ("code")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sector_categories" ("id" SERIAL NOT NULL, "sectorId" integer NOT NULL, "parentId" integer, "name" character varying(120) NOT NULL, "description" character varying(300), "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_087ac93511ceed1998fd7a1b814" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sector_categories_sector" ON "sector_categories" ("sectorId", "sortOrder")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sector_items" ("id" SERIAL NOT NULL, "sectorId" integer NOT NULL, "categoryId" integer, "kind" character varying(10) NOT NULL DEFAULT 'product', "name" character varying(160) NOT NULL, "description" character varying(400), "unit" character varying(20) NOT NULL DEFAULT 'pièce', "purchasePrice" numeric(12,3), "sellingPrice" numeric(12,3), "marginPct" numeric(6,2), "vatRate" numeric(5,2), "trackLots" boolean NOT NULL DEFAULT false, "basis" character varying(300), "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e5cbd8a132f5018fece8e66339a" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sector_items_sector" ON "sector_items" ("sectorId", "categoryId", "sortOrder")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "service_offers" ("id" SERIAL NOT NULL, "sectorCode" character varying(40), "category" character varying(20) NOT NULL DEFAULT 'setup', "name" character varying(160) NOT NULL, "description" character varying(400), "price" numeric(12,3), "priceUnit" character varying(12) NOT NULL DEFAULT 'one_time', "basis" character varying(300), "isPublic" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bd385f679a70f6e7891f6c78255" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_offers_sector" ON "service_offers" ("sectorCode", "sortOrder")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "platform_settings" ("id" SERIAL NOT NULL, "trialHours" integer NOT NULL DEFAULT '72', "requireEmailVerification" boolean NOT NULL DEFAULT false, "currency" character varying(3) NOT NULL DEFAULT 'TND', "vatRate" numeric(5,2) NOT NULL DEFAULT '19', "paymentInstructions" text, "paymentMethods" jsonb, "supportEmail" character varying(160), "supportPhone" character varying(40), "supportWhatsapp" character varying(40), "trialReminderHours" integer NOT NULL DEFAULT '24', "renewalReminderDays" integer NOT NULL DEFAULT '7', "defaultsSeeded" boolean NOT NULL DEFAULT false, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2934aeb70ec285196dcab4a2e96" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "plans" ("id" SERIAL NOT NULL, "code" character varying(40) NOT NULL, "name" character varying(80) NOT NULL, "description" character varying(400), "priceMonthly" numeric(12,3), "priceAnnual" numeric(12,3), "maxUsers" integer, "modules" jsonb, "features" jsonb, "isPublic" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "highlight" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_plans_code" ON "plans" ("code")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "subscription_payments" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "planCode" character varying(40) NOT NULL, "planName" character varying(80) NOT NULL, "billingCycle" character varying(10) NOT NULL, "periodMonths" integer NOT NULL DEFAULT '1', "amountHT" numeric(12,3) NOT NULL, "vatRate" numeric(5,2) NOT NULL DEFAULT '0', "amountTTC" numeric(12,3) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'TND', "method" character varying(20) NOT NULL, "provider" character varying(30) NOT NULL DEFAULT 'manual', "reference" character varying(120), "note" character varying(500), "status" character varying(12) NOT NULL DEFAULT 'pending', "rejectReason" character varying(300), "declaredBy" character varying(10) NOT NULL DEFAULT 'client', "validatedAt" TIMESTAMP WITH TIME ZONE, "validatedBy" integer, "periodStart" TIMESTAMP WITH TIME ZONE, "periodEnd" TIMESTAMP WITH TIME ZONE, "receiptNumber" character varying(30), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1b7a76365fd477de59cba0ab957" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_subscription_payments_receipt" ON "subscription_payments" ("receiptNumber") WHERE "receiptNumber" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_payments_status" ON "subscription_payments" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_payments_user" ON "subscription_payments" ("userId", "createdAt")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "support_messages" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "actorId" integer, "subject" character varying(160) NOT NULL, "message" text NOT NULL, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2aa37479e71ef29cbf4dba2b1a2" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_messages_user" ON "support_messages" ("userId", "createdAt")`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountStatus" character varying(12) NOT NULL DEFAULT 'ACTIVE'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "statusReason" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "expiryEnforced" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sector" character varying(40)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "planCode" character varying(40)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "billingCycle" character varying(10)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "userLimit" integer`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signupSource" character varying(12) NOT NULL DEFAULT 'admin'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifyHash" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifyExpires" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleSub" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trialReminderStage" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "renewalReminderStage" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT IF EXISTS "UQ_3300d7adbd17fdb51bdfd8c951e"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "UQ_d4c679011e607e520e4a465840d"`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_google_sub" ON "users" ("googleSub") WHERE "googleSub" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_shipments_client_tracking" ON "shipments" ("clientId", "trackingNumber")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_invoices_user_operation" ON "invoices" ("userId", "operationNumber")`);
    // Comptes existants : on ne coupe personne au déploiement (voir l'en-tête).
    await queryRunner.query(`UPDATE "users" SET "expiryEnforced" = false`);
  }

  public async down(): Promise<void> {
    // Additive : revenir à la version précédente de l'application suffit. Supprimer ces tables effacerait les paiements.
    throw new Error('La migration SaasPlatform ne s’annule pas automatiquement : redéployez la version précédente de l’application (voir docs/SAAS.md, « Retour arrière »).');
  }
}
