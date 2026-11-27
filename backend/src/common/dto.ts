import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, MaxLength, ValidateIf, registerDecorator, type ValidationArguments } from 'class-validator';

/**
 * Briques de validation communes aux anciens modules (clients, employés, commandes, ventes, produits, fournisseurs,
 * dépenses…). Elles acceptent ce que le site envoie réellement (nombres saisis en texte « 12,5 », champs vides)
 * et répondent 400 avec un message français plutôt que de laisser la base de données échouer en 500.
 *
 * Le ValidationPipe global ne retire pas les champs inconnus (pas de `whitelist`) : un formulaire qui renvoie toute
 * la fiche (id, createdAt…) continue de fonctionner ; seuls les champs déclarés dans un DTO sont contrôlés.
 */

const blank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const spaced = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 3 });

/** Texte : espaces de début et de fin retirés (une valeur qui n'est pas du texte est laissée telle quelle, puis refusée). */
export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/**
 * Nombre saisi dans un formulaire : 12, "12", "12,5", "1 200,50 DT". Vide → absent (undefined). null reste null (effacer une valeur).
 * Illisible → NaN, que la validation refuse.
 */
export const ToNumber = () => Transform(({ value }) => {
  if (value === undefined || value === null) return value;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const s = value.replace(/[\s  ]/g, '').replace(/(?:€|\$|£|DT|TND|EUR|USD|MAD|DZD)$/i, '');
  if (s === '') return undefined;
  if (!/^[+-]?(?:\d[\d.,]*|[.,]\d+)$/.test(s)) return NaN;
  // « 1.200,50 » (virgule décimale) comme « 1,200.50 » : le dernier séparateur est la décimale.
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let n: string;
  if (lastComma > -1 && lastDot > -1) n = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (lastComma > -1) n = (s.match(/,/g) || []).length > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
  else n = s;
  return Number(n);
});

type Msg = (a: ValidationArguments) => string;

function custom(name: string, validate: (v: unknown) => boolean, message: Msg | string) {
  return (target: object, key: string | symbol) =>
    registerDecorator({ name, target: target.constructor, propertyName: key as string, options: { message }, validator: { validate } });
}

/**
 * Montant, quantité, taux ou compteur. `int` : entier ; `min` / `max` : bornes (0 et 99 999 999,99 par défaut, soit la capacité des
 * colonnes décimales). À combiner avec @IsOptional() quand le champ est facultatif.
 */
export function Amount(o: { label: string; min?: number; max?: number; int?: boolean }) {
  const { label, min = 0, max = 99_999_999.99, int = false } = o;
  const message = `${label} : ${int ? 'entier' : 'nombre'} attendu, de ${spaced(min)} à ${spaced(max)}.`;
  return applyDecorators(
    ToNumber(),
    custom('amount', (v) => typeof v === 'number' && Number.isFinite(v) && (!int || Number.isInteger(v)) && v >= min && v <= max, message),
  );
}

/** Texte. `required` : non vide. À combiner avec @IsOptional() quand le champ est facultatif. */
export function Text(o: { label: string; max?: number; required?: boolean }) {
  const { label, max = 160, required = false } = o;
  const message: Msg = (a) =>
    blank(a.value) && required ? `${label} obligatoire.`
      : typeof a.value !== 'string' ? `${label} : texte attendu.`
      : `${label} : ${spaced(max)} caractères au maximum.`;
  return applyDecorators(
    Trim(),
    custom('text', (v) => typeof v === 'string' && (!required || v.trim() !== '') && v.length <= max, message),
  );
}

/** Adresse email, facultative : vide accepté, sinon format contrôlé. */
export function OptionalEmail() {
  return applyDecorators(
    Trim(),
    ValidateIf((_o, v) => !blank(v)),
    IsEmail({}, { message: 'Adresse email invalide.' }),
    MaxLength(160, { message: 'Adresse email : 160 caractères au maximum.' }),
  );
}

/** Date saisie : AAAA-MM-JJ ou date ISO complète ; vide accepté. */
export function DateLike(label = 'Date') {
  return custom(
    'dateLike',
    (v) => blank(v) || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(v.trim()) && !Number.isNaN(Date.parse(v.trim()))),
    `${label} invalide (format AAAA-MM-JJ).`,
  );
}

/** Oui / non : accepte true, false, "true", "false", 1, 0. */
export function Flag(label: string) {
  return applyDecorators(
    Transform(({ value }) => (value === 'true' || value === 1 || value === '1' ? true : value === 'false' || value === 0 || value === '0' ? false : value)),
    custom('flag', (v) => typeof v === 'boolean', `${label} : oui ou non attendu.`),
  );
}

/** Valeur parmi une liste. */
export const OneOf = (values: readonly string[], label: string) =>
  IsIn(values, { message: `${label} : valeur attendue parmi ${values.join(', ')}.` });
