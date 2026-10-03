import * as fs from 'fs';
import * as path from 'path';

/**
 * Garde-fou de démarrage.
 *
 * Deux classes @Entity pour la MÊME table provoquent, à chaque démarrage, une boucle « supprime puis
 * recrée les colonnes » dans la synchronisation TypeORM. Tant que la table est vide ça passe ; dès
 * qu'elle contient des lignes, l'ajout d'une colonne NOT NULL échoue et le serveur ne démarre plus
 * (« column "x" of relation "y" contains null values »).
 *
 * Cette fonction lit les fichiers *.entity.(ts|js) et s'arrête avec un message clair AVANT de toucher
 * à la base si une table est déclarée deux fois (par exemple à cause d'un ancien fichier resté dans dist/).
 */
export function assertUniqueEntityTables(rootDir: string): void {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(full); }
      else if (/\.entity\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(full);
    }
  };
  walk(rootDir);

  const byTable = new Map<string, string[]>();
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const re = /Entity\)?\(\s*['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(source))) {
      const list = byTable.get(match[1]) || [];
      list.push(path.relative(rootDir, file));
      byTable.set(match[1], list);
    }
  }

  const duplicates = Array.from(byTable.entries()).filter(([, list]) => list.length > 1);
  if (duplicates.length > 0) {
    const detail = duplicates.map(([table, list]) => `  - table "${table}" : ${list.join(', ')}`).join('\n');
    throw new Error(
      `Démarrage annulé : plusieurs entités TypeORM pour la même table.\n${detail}\n` +
      `Gardez une seule classe par table (et supprimez dist/ avant de reconstruire).`,
    );
  }
}
