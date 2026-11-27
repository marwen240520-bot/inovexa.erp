/**
 * Contrôle de saisie des formulaires du tableau de bord, avant l'envoi à l'API.
 *
 * Même règles que celles de l'API (DTO) : un champ marqué « * » est vraiment obligatoire, un nombre doit être un nombre
 * (« 12,5 » est accepté comme « 12.5 »), une adresse email doit ressembler à une adresse. Le serveur revérifie de toute façon.
 *
 *   const problem = validateForm(language, form, [
 *     { key: "name", label: t("common.name"), required: true },
 *     { key: "email", label: t("common.email"), type: "email", required: true },
 *     { key: "salary", label: t("hr.salary"), type: "number", required: true, min: 0 },
 *   ]);
 *   if (problem) { setFormError(problem.message); focusField(`client-${problem.key}`); return; }
 */

type Lang = "fr" | "en" | "es";

const MESSAGES = {
  required: { fr: "Champ obligatoire : {label}.", en: "Required field: {label}.", es: "Campo obligatorio: {label}." },
  email: { fr: "Adresse email invalide.", en: "Invalid email address.", es: "Correo electrónico no válido." },
  number: { fr: "Valeur numérique invalide : {label}.", en: "Invalid number: {label}.", es: "Número no válido: {label}." },
  integer: { fr: "{label} doit être un nombre entier.", en: "{label} must be a whole number.", es: "{label} debe ser un número entero." },
  min: { fr: "{label} doit être supérieur ou égal à {min}.", en: "{label} must be at least {min}.", es: "{label} debe ser como mínimo {min}." },
  date: { fr: "Date invalide : {label}.", en: "Invalid date: {label}.", es: "Fecha no válida: {label}." },
  network: {
    fr: "Connexion impossible avec le serveur. Vérifiez votre réseau et réessayez.",
    en: "Can't reach the server. Check your connection and try again.",
    es: "No se puede conectar con el servidor. Compruebe su conexión e inténtelo de nuevo.",
  },
  saving: { fr: "Enregistrement…", en: "Saving…", es: "Guardando…" },
  bulkDeleted: { fr: "{count} élément(s) supprimé(s)", en: "{count} item(s) deleted", es: "{count} elemento(s) eliminado(s)" },
  bulkPartial: {
    fr: "{ok} supprimé(s), {failed} non supprimé(s) : {reason}",
    en: "{ok} deleted, {failed} not deleted: {reason}",
    es: "{ok} eliminado(s), {failed} no eliminado(s): {reason}",
  },
  cannotDelete: { fr: "Suppression impossible.", en: "Couldn't delete.", es: "No se pudo eliminar." },
} as const;

export type FormMessageKey = keyof typeof MESSAGES;

const lang = (language: string): Lang => (language === "en" || language === "es" ? language : "fr");

/** Message traduit (français par défaut) avec remplacement des {variables}. */
export function fm(language: string, key: FormMessageKey, vars: Record<string, string | number> = {}): string {
  const text: string = MESSAGES[key][lang(language)];
  return text.replace(/\{(\w+)\}/g, (_, name: string) => (name in vars ? String(vars[name]) : `{${name}}`));
}

export type FieldRule = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "email" | "number" | "int" | "date";
  min?: number;
};

const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/** Nombre saisi à la main : accepte « 12,5 », « 1 200,50 » et « 1.200,50 ». NaN si ce n'est pas un nombre. */
export function parseNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return NaN;
  let s = v.replace(/[\s ]/g, "");
  if (s === "") return NaN;
  const comma = s.lastIndexOf(",");
  const dot = s.lastIndexOf(".");
  if (comma !== -1 && dot !== -1) {
    // Le dernier séparateur est la virgule décimale ; l'autre sépare les milliers.
    s = comma > dot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (comma !== -1) {
    s = s.replace(",", ".");
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** Première erreur de saisie du formulaire, ou null s'il n'y en a pas. */
export function validateForm(
  language: string,
  form: Record<string, unknown>,
  rules: FieldRule[],
): { key: string; message: string } | null {
  for (const rule of rules) {
    const value = form[rule.key];
    const label = rule.label.replace(/\s*\*\s*$/, "");
    if (isBlank(value)) {
      if (rule.required) return { key: rule.key, message: fm(language, "required", { label }) };
      continue;
    }
    if (rule.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
      return { key: rule.key, message: fm(language, "email") };
    }
    if (rule.type === "number" || rule.type === "int") {
      const n = parseNumber(value);
      if (!Number.isFinite(n)) return { key: rule.key, message: fm(language, "number", { label }) };
      if (rule.type === "int" && !Number.isInteger(n)) return { key: rule.key, message: fm(language, "integer", { label }) };
      if (rule.min !== undefined && n < rule.min) return { key: rule.key, message: fm(language, "min", { label, min: rule.min }) };
    }
    if (rule.type === "date" && Number.isNaN(Date.parse(String(value)))) {
      return { key: rule.key, message: fm(language, "date", { label }) };
    }
  }
  return null;
}

/** Met le curseur dans le champ fautif (après le rendu du message d'erreur). */
export function focusField(id: string) {
  window.setTimeout(() => document.getElementById(id)?.focus(), 0);
}
