/**
 * Numéros de téléphone : format international E.164, avec les habitudes tunisiennes.
 *
 *  « 22 535 181 », « 0021622535181 », « +216 22 535 181 » → « +21622535181 »
 *  Un numéro étranger doit être saisi avec son indicatif (« +33 6 12 34 56 78 »).
 */
export interface PhoneCheck {
  valid: boolean;
  /** Forme enregistrée (E.164), vide si le champ est vide. */
  normalized: string;
  message?: string;
}

const TN_PREFIX = '216';

export function normalizePhone(value: string | null | undefined): PhoneCheck {
  const raw = String(value ?? '').trim();
  if (!raw) return { valid: true, normalized: '' };
  if (!/^[+\d][\d\s().-]*$/.test(raw)) return { valid: false, normalized: '', message: 'Numéro de téléphone invalide.' };
  let digits = raw.replace(/\D/g, '');
  const international = raw.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (!international) {
    // Numéro local tunisien : 8 chiffres, premier chiffre 2 à 9.
    if (/^[2-9]\d{7}$/.test(digits)) return { valid: true, normalized: `+${TN_PREFIX}${digits}` };
    return { valid: false, normalized: '', message: 'Numéro invalide : 8 chiffres pour la Tunisie, ou l’indicatif du pays (ex. +33…).' };
  }
  if (digits.startsWith(TN_PREFIX)) {
    const local = digits.slice(TN_PREFIX.length);
    if (!/^[2-9]\d{7}$/.test(local)) return { valid: false, normalized: '', message: 'Numéro tunisien invalide : +216 suivi de 8 chiffres.' };
    return { valid: true, normalized: `+${TN_PREFIX}${local}` };
  }
  if (digits.length < 8 || digits.length > 15) return { valid: false, normalized: '', message: 'Numéro de téléphone invalide.' };
  return { valid: true, normalized: `+${digits}` };
}

/** Affichage lisible : « +216 22 535 181 » pour la Tunisie, sinon le numéro tel quel. */
export function formatPhone(value: string | null | undefined): string {
  const s = String(value ?? '');
  const m = /^\+216(\d{2})(\d{3})(\d{3})$/.exec(s);
  return m ? `+216 ${m[1]} ${m[2]} ${m[3]}` : s;
}
