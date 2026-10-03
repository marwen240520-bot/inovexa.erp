/**
 * Message affiché après un import, à partir de la réponse du serveur
 * ({ success, errors, total, errorDetails: [{ row, error }] }).
 *
 *  - tout a échoué            -> erreur + motif de la première ligne
 *  - réussite partielle       -> succès + nombre d'erreurs + motif
 *  - tout est passé           -> succès
 */
export interface ImportServerResult {
  success?: number;
  errors?: number;
  total?: number;
  errorDetails?: Array<{ row?: number; error?: string }>;
  message?: string | string[];
}

export function summarizeImport(
  result: ImportServerResult | null | undefined,
  noun: string,
): { message: string; type: "success" | "error" } {
  const ok = Number(result?.success ?? 0);
  const ko = Number(result?.errors ?? 0);
  const details = (result?.errorDetails || [])
    .slice(0, 3)
    .map((d) => (d.row ? `ligne ${d.row} : ${d.error}` : d.error))
    .filter(Boolean)
    .join(" | ");
  const more = ko > 3 ? ` (+${ko - 3} autre(s))` : "";

  if (ok === 0 && ko > 0) {
    return { type: "error", message: `Aucun ${noun} importé. ${ko} erreur(s) — ${details}${more}` };
  }
  if (ok === 0) {
    return { type: "error", message: `Aucun ${noun} importé : le fichier ne contient aucune ligne exploitable.` };
  }
  if (ko > 0) {
    return { type: "success", message: `${ok} ${noun}(s) importé(s), ${ko} erreur(s) — ${details}${more}` };
  }
  return { type: "success", message: `${ok} ${noun}(s) importé(s) avec succès` };
}

/** Message d'erreur lisible pour une réponse HTTP en échec */
export function importHttpError(status: number, body: any): string {
  if (status === 404) {
    return "Cette fonction d'import n'existe pas sur le serveur : déployez la dernière version du backend.";
  }
  if (status === 401 || status === 403) return "Session expirée : reconnectez-vous puis réessayez.";
  if (status >= 500) return "Erreur interne du serveur pendant l'import. Consultez les logs du backend.";
  const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
  return msg || "Erreur lors de l'import";
}
