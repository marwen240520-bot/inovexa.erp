/**
 * Règles des mots de passe de la plateforme.
 *  - 8 caractères au moins (128 au plus), avec une lettre et un chiffre ;
 *  - pas un mot de passe parmi les plus répandus (« Password1 », « Azerty123 », « Inovexa2026 »… — les premiers essayés par les
 *    programmes de devinette), même décoré de ponctuation ou de majuscules ;
 *  - pas composé de quelques caractères répétés (moins de cinq caractères différents : « aaaa1111 », « abab1212 ») ;
 *  - ne contient pas la partie locale de l'adresse email (« sami.trabelsi1 » pour sami.trabelsi@…).
 * La règle ne regarde que le mot de passe en clair reçu au moment de le choisir : les mots de passe déjà enregistrés ne sont
 * jamais refusés a posteriori.
 */

/** Les plus courants, en minuscules. Comparés tels quels puis sans ponctuation (« P@ssw0rd! » → « pssw0rd »). */
const COMMON = new Set([
  'password1', 'password12', 'password123', 'password1234', 'password01', 'password2024', 'password2025', 'password2026',
  'passw0rd', 'p@ssw0rd', 'pssw0rd', 'p4ssw0rd', 'p@ssword1', 'pssword1', 'p@ssw0rd1', 'pssw0rd1', 'p@ssw0rd123', 'pssw0rd123',
  'motdepasse1', 'motdepasse12', 'motdepasse123', 'monmotdepasse1', 'monmotdepasse123', 'mdp12345', 'mdp123456',
  'azerty123', 'azerty1234', 'azerty12345', 'azerty123456', 'azerty2026', 'azertyuiop1', 'azertyuiop123', 'azertyazerty1',
  'qwerty123', 'qwerty1234', 'qwerty12345', 'qwerty123456', 'qwerty2026', 'qwertyuiop1', 'qwertyuiop123',
  '12345678a', '123456789a', '1234567a', 'a1234567', 'a12345678', 'a123456789', 'abc12345', 'abc123456', 'abc123abc',
  'abcd1234', 'abcd12345', 'abcde12345', 'abcdef123', '1234abcd', '12345abc', 'a1b2c3d4', 'a1b2c3d4e5',
  '1q2w3e4r', '1q2w3e4r5t', '1qaz2wsx', '1qazxsw2', 'q1w2e3r4', 'q1w2e3r4t5', 'zaq12wsx',
  'welcome1', 'welcome12', 'welcome123', 'welcome2026', 'bienvenue1', 'bienvenue123', 'bonjour123', 'bonjour1234', 'salut1234',
  'soleil123', 'soleil1234', 'marseille1', 'football1', 'football123', 'iloveyou1', 'iloveyou123', 'monkey123', 'dragon123',
  'master123', 'login123', 'letmein1', 'letmein123', 'princess1', 'sunshine1', 'superman1', 'batman123',
  'admin123', 'admin1234', 'admin12345', 'admin2026', 'administrator1', 'root1234', 'root12345', 'user1234', 'test1234', 'test12345', 'testtest1',
  'changeme1', 'changeme123', 'default123', 'secret123', 'secret1234',
  'inovexa1', 'inovexa12', 'inovexa123', 'inovexa1234', 'inovexa2026', 'inovexaerp1', 'inovexaerp123', 'msai1234', 'msaisystems1', 'msaisystems123',
  'tunisie123', 'tunisie1234', 'tunisie2026', 'tunisia123', 'tunisia1234', 'tunis1234', 'tunis2026', 'carthage1', 'carthage123',
]);

export type PasswordProblem = 'weak' | 'common' | 'personal';

export interface PasswordContext {
  /** Adresse du compte : la partie avant « @ » ne doit pas se retrouver dans le mot de passe. */
  email?: string | null;
}

/** Raison pour laquelle un mot de passe est refusé, ou null s'il est acceptable. */
export function passwordProblem(password: unknown, ctx: PasswordContext = {}): PasswordProblem | null {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'weak';
  const flat = password.toLowerCase();
  const compact = flat.replace(/[^a-z0-9]/g, '');
  if (COMMON.has(flat) || COMMON.has(compact)) return 'common';
  // Moins de cinq caractères différents (« aaaa1111 », « abab1212 »…) : aussi prévisible qu'une liste.
  if (new Set(compact).size < 5) return 'common';
  const local = String(ctx.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  if (local.length >= 4 && compact.includes(local)) return 'personal';
  return null;
}

export const PASSWORD_MESSAGES: Record<PasswordProblem, string> = {
  weak: 'Mot de passe trop faible : 8 caractères minimum, avec au moins une lettre et un chiffre.',
  common: 'Ce mot de passe est trop courant ou trop prévisible : choisissez-en un autre (une courte phrase est idéale).',
  personal: 'Le mot de passe ne doit pas contenir votre adresse email : choisissez-en un autre.',
};
