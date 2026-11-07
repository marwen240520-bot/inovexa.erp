/**
 * Génère une migration à partir de la DIFFÉRENCE entre le schéma réel de la base et les entités.
 *
 *   DATABASE_URL=postgres://… npx ts-node -T scripts/db/make-migration.ts NomDeLaMigration
 *
 * Contrairement à `typeorm migration:generate`, le SQL produit est IDEMPOTENT (IF NOT EXISTS, blocs DO …
 * EXCEPTION) : la migration peut s'exécuter sans erreur aussi bien sur une base neuve que sur une base
 * déjà synchronisée par l'ancien mode `synchronize: true`.
 *
 * ⚠️  Relire le fichier généré. TypeORM exprime un CHANGEMENT DE TYPE de colonne par « DROP COLUMN puis ADD
 *     COLUMN », ce qui détruit les données : le script le signale, remplacez alors ces deux lignes par
 *     « ALTER COLUMN … TYPE … USING … ».
 *
 * Variable optionnelle MIGRATION_ENTITIES : glob des entités à comparer (défaut : celles du projet).
 */
import 'reflect-metadata';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

function idempotent(query: string): string {
  let q = query.trim();
  q = q.replace(/^CREATE TABLE "/i, 'CREATE TABLE IF NOT EXISTS "');
  q = q.replace(/^CREATE UNIQUE INDEX "/i, 'CREATE UNIQUE INDEX IF NOT EXISTS "');
  q = q.replace(/^CREATE INDEX "/i, 'CREATE INDEX IF NOT EXISTS "');
  q = q.replace(/^DROP INDEX "public"\./i, 'DROP INDEX IF EXISTS "public".');
  q = q.replace(/^(ALTER TABLE "[^"]+") ADD "/i, '$1 ADD COLUMN IF NOT EXISTS "');
  q = q.replace(/^(ALTER TABLE "[^"]+") DROP COLUMN "/i, '$1 DROP COLUMN IF EXISTS "');
  if (/^ALTER TABLE "[^"]+" ADD CONSTRAINT /i.test(q)) {
    q = `DO $$ BEGIN ${q}; EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`;
  }
  return q;
}

async function main() {
  const name = (process.argv[2] || 'Migration').replace(/[^A-Za-z0-9]/g, '');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant');
  const entities = process.env.MIGRATION_ENTITIES
    ? [process.env.MIGRATION_ENTITIES]
    : [join(__dirname, '..', '..', 'src', '**', '*.entity.ts')];

  const ds = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL, entities, synchronize: false });
  await ds.initialize();
  const plan = await ds.driver.createSchemaBuilder().log();
  await ds.destroy();

  const up = plan.upQueries.map((q) => idempotent(q.query));
  const down = plan.downQueries.map((q) => q.query).reverse();
  if (!up.length) {
    console.log('✔ Le schéma est déjà à jour : aucune migration à générer.');
    return;
  }
  const destructive = up.filter((q) => /DROP COLUMN|DROP TABLE/i.test(q));
  if (destructive.length) {
    console.warn(`\n⚠️  ${destructive.length} requête(s) destructive(s) — à relire et corriger à la main :`);
    destructive.forEach((q) => console.warn('   ' + q.slice(0, 160)));
  }

  const timestamp = Date.now();
  const className = `${name}${timestamp}`;
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const body = (qs: string[]) => qs.map((q) => `    await queryRunner.query(\`${esc(q)}\`);`).join('\n');
  const file = `import { MigrationInterface, QueryRunner } from 'typeorm';

/** Migration générée par scripts/db/make-migration.ts — SQL idempotent (voir l'en-tête du script). */
export class ${className} implements MigrationInterface {
  name = '${className}';

  public async up(queryRunner: QueryRunner): Promise<void> {
${body(up)}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
${body(down)}
  }
}
`;
  const out = join(__dirname, '..', '..', 'src', 'database', 'migrations', `${timestamp}-${name}.ts`);
  writeFileSync(out, file, 'utf8');
  console.log(`✔ ${up.length} requête(s) écrite(s) dans ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
