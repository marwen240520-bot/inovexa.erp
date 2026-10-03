/**
 * Corrections de la base AVANT la synchronisation automatique du schéma (TypeORM `synchronize`).
 *
 * Pourquoi : quand le type d'une colonne change dans une entité, TypeORM ne la convertit pas — il la
 * SUPPRIME puis la RECRÉE. Si la table contient des lignes et que la colonne est NOT NULL, la création
 * échoue (« column "x" of relation "y" contains null values ») et le serveur ne démarre plus.
 *
 * Ici on convertit les colonnes concernées SUR PLACE (ALTER ... TYPE ... USING), sans perdre de données,
 * pour que le schéma réel corresponde déjà à l'entité quand la synchronisation s'exécute.
 * Chaque correction est idempotente : sur une base déjà à jour, elle ne fait rien.
 */

type Row = { data_type: string; numeric_precision: number | null; numeric_scale: number | null; is_nullable: string };

async function columnInfo(client: any, table: string, column: string): Promise<Row | undefined> {
  const res = await client.query(
    `SELECT data_type, numeric_precision, numeric_scale, is_nullable
       FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return res.rows[0];
}

/** expenses : `amount` est décimal(10,2) en base (ancienne entité) ; `date` peut contenir des valeurs vides. */
async function fixExpenses(client: any): Promise<void> {
  const amount = await columnInfo(client, 'expenses', 'amount');
  if (amount && (amount.data_type !== 'numeric' || Number(amount.numeric_precision) !== 10 || Number(amount.numeric_scale) !== 2)) {
    await client.query(`ALTER TABLE "expenses" ALTER COLUMN "amount" TYPE numeric(10,2) USING "amount"::numeric(10,2)`);
    console.log('[pre-sync] expenses.amount converti en numeric(10,2) (données conservées)');
  }
  const date = await columnInfo(client, 'expenses', 'date');
  if (date) {
    const created = await columnInfo(client, 'expenses', 'createdAt');
    const res = await client.query(
      `UPDATE "expenses" SET "date" = ${created ? 'COALESCE("createdAt", NOW())' : 'NOW()'} WHERE "date" IS NULL`,
    );
    if (res.rowCount) console.log(`[pre-sync] expenses.date : ${res.rowCount} date(s) vide(s) complétée(s)`);
  }
}

const FIXES: Array<{ name: string; run: (client: any) => Promise<void> }> = [
  { name: 'expenses', run: fixExpenses },
];

export async function runPreSyncFixes(databaseUrl?: string): Promise<void> {
  if (!databaseUrl) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Client } = require('pg');
  const client = new Client({ connectionString: databaseUrl, ssl: false });
  try {
    await client.connect();
    for (const fix of FIXES) {
      try {
        await client.query('BEGIN');
        await fix.run(client);
        await client.query('COMMIT');
      } catch (e: any) {
        await client.query('ROLLBACK').catch(() => undefined);
        // Une correction qui échoue ne doit pas empêcher le serveur de démarrer : la synchronisation dira pourquoi.
        console.error(`[pre-sync] correction « ${fix.name} » ignorée :`, e?.message || e);
      }
    }
  } catch (e: any) {
    console.error('[pre-sync] connexion impossible, corrections ignorées :', e?.message || e);
  } finally {
    try { await client.end(); } catch { /* ignoré */ }
  }
}
