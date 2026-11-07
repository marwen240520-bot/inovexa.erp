import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class SequenceService {
  /**
   * Prochain numéro (atomique). À appeler avec le `manager` de la transaction en cours :
   * la ligne du compteur reste verrouillée jusqu'au commit, ce qui sérialise les validations concurrentes.
   */
  async next(manager: EntityManager, userId: number, key: string, year: number): Promise<number> {
    const rows: Array<{ lastValue: number }> = await manager.query(
      `INSERT INTO "number_sequences" ("userId", "key", "year", "lastValue")
       VALUES ($1, $2, $3, 1)
       ON CONFLICT ("userId", "key", "year")
       DO UPDATE SET "lastValue" = "number_sequences"."lastValue" + 1
       RETURNING "lastValue"`,
      [userId, key, year],
    );
    return Number(rows[0].lastValue);
  }

  /** Dernier numéro attribué (0 si aucun) — lecture seule. */
  async current(manager: EntityManager, userId: number, key: string, year: number): Promise<number> {
    const rows: Array<{ lastValue: number }> = await manager.query(
      `SELECT "lastValue" FROM "number_sequences" WHERE "userId" = $1 AND "key" = $2 AND "year" = $3`,
      [userId, key, year],
    );
    return rows.length ? Number(rows[0].lastValue) : 0;
  }

  /** Formate un numéro : PREFIX-2026-00042. */
  format(prefix: string, year: number, value: number, pad = 5): string {
    return `${prefix}-${year}-${String(value).padStart(pad, '0')}`;
  }
}
