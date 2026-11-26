import { isPublicHttps } from '../origins';

/** Ce que l'on sait de la configuration du serveur, sans aucun secret (la longueur de JWT_SECRET suffit au contrôle). */
export interface SecurityFacts {
  production: boolean;
  /** Longueur et variété de JWT_SECRET : la valeur elle-même n'est jamais conservée. */
  jwtSecretLength: number;
  jwtSecretDistinct: number;
  apiUrl: string;
  siteUrls: string[];
  /** Le schéma de la base se modifie tout seul à chaque démarrage (réservé au développement). */
  synchronize: boolean;
  swagger: boolean;
  mailConfigured: boolean;
  konnect: { configured: boolean; mode: 'production' | 'sandbox' };
  /** Sauvegardes chiffrées envoyées hors du serveur (BACKUP_PASSPHRASE et BACKUP_S3_URI). */
  backups: boolean;
  /** Administrateurs actifs sans double authentification ; null = non vérifié. */
  adminsWithoutTwoFactor: number | null;
}

export interface SecurityCheck {
  key: string;
  ok: boolean;
  /** error : à corriger avant d'ouvrir à de vrais clients ; warn : à régler dès que possible. */
  level: 'error' | 'warn';
  message: string;
}

/** Contrôles de configuration. Fonction pure : le même état donne toujours le même rapport. */
export function securityChecks(f: SecurityFacts): SecurityCheck[] {
  const checks: SecurityCheck[] = [];
  const add = (key: string, ok: boolean, level: 'error' | 'warn', good: string, bad: string) => checks.push({ key, ok, level, message: ok ? good : bad });
  const strict: 'error' | 'warn' = f.production ? 'error' : 'warn';

  add('secret', f.jwtSecretLength >= 32 && f.jwtSecretDistinct >= 8, strict,
    'Clé de signature des sessions (JWT_SECRET) définie, longue et variée.',
    'JWT_SECRET est absent, trop court (32 caractères au moins) ou trop répétitif : générez-en une avec « openssl rand -base64 48 ». Sans elle, les sessions sont faciles à falsifier ou perdues à chaque redémarrage.');
  add('https', isPublicHttps(f.apiUrl) && f.siteUrls.some(isPublicHttps), strict,
    'L’API et le site sont servis en https sur des adresses publiques.',
    `Définissez API_PUBLIC_URL et FRONTEND_URL avec des adresses https publiques (API : ${f.apiUrl}) : sans https, les mots de passe et les sessions circulent en clair.`);
  add('schema', !(f.production && f.synchronize), 'error',
    'Le schéma de la base ne change que par les migrations versionnées.',
    'Le schéma de la base se modifie tout seul au démarrage (synchronize) : en production, il ne doit évoluer que par les migrations (une erreur de code pourrait supprimer des colonnes de vos clients).');
  add('swagger', !(f.production && f.swagger), 'warn',
    'La documentation interactive de l’API n’est pas exposée.',
    'ENABLE_SWAGGER=true : la documentation interactive de l’API (/api/docs) est publique. Retirez la variable si vous n’en avez pas besoin.');
  add('mail', f.mailConfigured, 'warn',
    'Envoi d’emails configuré : code de vérification, mot de passe oublié, reçus et alertes partent.',
    'Envoi d’emails non configuré (SMTP_*) : l’adresse des nouveaux clients n’est pas vérifiée et « mot de passe oublié » ne peut pas fonctionner.');
  add('payments', f.konnect.configured && f.konnect.mode === 'production', 'warn',
    'Paiement en ligne en mode production.',
    f.konnect.configured ? 'Konnect est en mode test (bac à sable) : aucun paiement réel n’est encaissé.' : 'Konnect n’est pas configuré : les clients ne peuvent pas payer en ligne.');
  if (f.adminsWithoutTwoFactor !== null) {
    add('admin2fa', f.adminsWithoutTwoFactor === 0, 'warn',
      'Tous les administrateurs ont la double authentification.',
      `${f.adminsWithoutTwoFactor} compte(s) administrateur sans double authentification : un administrateur voit tous les clients. Activez-la dans « Mon profil › Sécurité ».`);
  }
  if (f.production) {
    add('backups', f.backups, 'warn',
      'Sauvegardes chiffrées envoyées hors du serveur.',
      'Sauvegardes hors serveur non configurées (BACKUP_PASSPHRASE et BACKUP_S3_URI) : voir docs/OPERATIONS.md.');
  }
  return checks;
}

/** Résumé : un rapport « ok » n'a aucune erreur ; les avertissements restent à lire. */
export function securitySummary(checks: SecurityCheck[]) {
  const errors = checks.filter((c) => !c.ok && c.level === 'error').length;
  const warnings = checks.filter((c) => !c.ok && c.level === 'warn').length;
  return { ok: errors === 0, errors, warnings };
}
