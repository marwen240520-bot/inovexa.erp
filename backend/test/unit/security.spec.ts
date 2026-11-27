import { MAIL_LANGS, securityNoticeMail, type SecurityNotice } from '../../src/common/mail/auth-mails';
import { isPublicHttps } from '../../src/common/origins';
import { sniffImage } from '../../src/common/security/images';
import { PASSWORD_MESSAGES, passwordProblem } from '../../src/common/security/passwords';
import { trustProxyHops } from '../../src/common/security/proxy';
import { securityChecks, securitySummary, type SecurityFacts } from '../../src/common/security/security-report';

describe('passwordProblem — règle des mots de passe', () => {
  it('accepte une phrase de passe ou un mot de passe varié', () => {
    for (const ok of ['Essai#2026ok', 'Admin#2026-secret', 'Le chat dort 3 heures', 'k8Zp!vQ2mXw', 'Tr0ub4dour&3x']) expect(passwordProblem(ok)).toBeNull();
  });

  it('refuse trop court, trop long, sans chiffre ou sans lettre (règle d’origine)', () => {
    expect(passwordProblem('Ab1')).toBe('weak');
    expect(passwordProblem('abcdefgh')).toBe('weak');
    expect(passwordProblem('12345678')).toBe('weak');
    expect(passwordProblem('a1'.repeat(65))).toBe('weak');
    expect(passwordProblem(undefined)).toBe('weak');
    expect(passwordProblem(12345678)).toBe('weak');
  });

  it('refuse les mots de passe les plus répandus, même avec majuscules ou ponctuation', () => {
    for (const bad of ['Password1', 'PASSWORD123', 'Password1!', 'P@ssw0rd', 'P@ssw0rd!', 'Azerty123', 'azerty123!', 'Qwerty123', 'Inovexa2026', 'Inovexa-2026', 'Motdepasse1', 'Welcome2026!', '1q2w3e4r', 'Tunisie123']) {
      expect([bad, passwordProblem(bad)]).toEqual([bad, 'common']);
    }
  });

  it('refuse les mots de passe faits de quelques caractères répétés', () => {
    for (const bad of ['aaaa1111', 'abab1212', 'Zzzzzzz1', '1a1a1a1a']) expect([bad, passwordProblem(bad)]).toEqual([bad, 'common']);
  });

  it('refuse un mot de passe qui contient la partie locale de l’adresse email', () => {
    expect(passwordProblem('sami.trabelsi1X', { email: 'sami.trabelsi@exemple.tn' })).toBe('personal');
    expect(passwordProblem('Xx-samitrabelsi-9', { email: 'Sami.Trabelsi@exemple.tn' })).toBe('personal');
    // Une partie locale courte (moins de 4 caractères) ne déclenche rien : trop de faux positifs.
    expect(passwordProblem('Ali-un-bon-mot-de-passe-7', { email: 'ali@exemple.tn' })).toBeNull();
    expect(passwordProblem('Essai#2026ok', { email: 'autre@exemple.tn' })).toBeNull();
  });

  it('chaque raison a un message en français, sans fuite du mot de passe', () => {
    for (const reason of ['weak', 'common', 'personal'] as const) {
      expect(PASSWORD_MESSAGES[reason]).toMatch(/mot de passe/i);
    }
  });
});

describe('sniffImage — le contenu du fichier, pas son nom', () => {
  const pad = (...bytes: number[]) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);
  it('reconnaît JPEG, PNG, GIF et WebP', () => {
    expect(sniffImage(pad(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg');
    expect(sniffImage(pad(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
    expect(sniffImage(Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16)]))).toBe('gif');
    expect(sniffImage(Buffer.concat([Buffer.from('GIF87a'), Buffer.alloc(16)]))).toBe('gif');
    expect(sniffImage(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]))).toBe('webp');
  });

  it('refuse une page HTML, un SVG, un script ou un fichier trop court déguisés en image', () => {
    expect(sniffImage(Buffer.from('<!doctype html><script>alert(1)</script>'))).toBeNull();
    expect(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'))).toBeNull();
    expect(sniffImage(Buffer.from('#!/bin/sh\necho pwned\n'))).toBeNull();
    expect(sniffImage(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
    // RIFF mais pas WebP (WAV, AVI…) : refusé.
    expect(sniffImage(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVEfmt ')]))).toBeNull();
  });
});

describe('trustProxyHops', () => {
  it('un relais par défaut, réglable, jamais une valeur absurde', () => {
    expect(trustProxyHops({})).toBe(1);
    expect(trustProxyHops({ TRUST_PROXY: '' })).toBe(1);
    expect(trustProxyHops({ TRUST_PROXY: '2' })).toBe(2);
    expect(trustProxyHops({ TRUST_PROXY: '0' })).toBe(false);
    expect(trustProxyHops({ TRUST_PROXY: 'false' })).toBe(false);
    expect(trustProxyHops({ TRUST_PROXY: 'true' })).toBe(1);
    expect(trustProxyHops({ TRUST_PROXY: '99' })).toBe(1);
    expect(trustProxyHops({ TRUST_PROXY: '-3' })).toBe(1);
    expect(trustProxyHops({ TRUST_PROXY: '1.5' })).toBe(1);
  });
});

describe('isPublicHttps', () => {
  it('seule une adresse https accessible depuis Internet convient', () => {
    expect(isPublicHttps('https://api.exemple.tn')).toBe(true);
    expect(isPublicHttps('http://api.exemple.tn')).toBe(false);
    expect(isPublicHttps('https://localhost:3001')).toBe(false);
    expect(isPublicHttps('http://127.0.0.1:3001')).toBe(false);
    expect(isPublicHttps('pas une adresse')).toBe(false);
    expect(isPublicHttps('')).toBe(false);
  });
});

describe('securityChecks — rapport de configuration', () => {
  const good: SecurityFacts = {
    production: true, jwtSecretLength: 64, jwtSecretDistinct: 40,
    apiUrl: 'https://api.exemple.tn', siteUrls: ['https://www.exemple.tn'],
    synchronize: false, swagger: false, mailConfigured: true,
    gateway: { provider: 'flouci', configured: true, mode: 'production' }, backups: true, adminsWithoutTwoFactor: 0,
  };
  const find = (facts: SecurityFacts, key: string) => securityChecks(facts).find((c) => c.key === key)!;

  it('configuration saine : tout est en règle', () => {
    const checks = securityChecks(good);
    expect(checks.every((c) => c.ok)).toBe(true);
    expect(securitySummary(checks)).toEqual({ ok: true, errors: 0, warnings: 0 });
  });

  it('production sans JWT_SECRET, en http, avec synchronize : trois erreurs bloquantes', () => {
    const bad = { ...good, jwtSecretLength: 0, jwtSecretDistinct: 0, apiUrl: 'http://api.exemple.tn', siteUrls: [], synchronize: true };
    const checks = securityChecks(bad);
    expect(['secret', 'https', 'schema'].map((k) => checks.find((c) => c.key === k)).every((c) => c && !c.ok && c.level === 'error')).toBe(true);
    expect(securitySummary(checks)).toMatchObject({ ok: false, errors: 3 });
  });

  it('clé trop courte ou trop répétitive : refusée', () => {
    expect(find({ ...good, jwtSecretLength: 31, jwtSecretDistinct: 20 }, 'secret').ok).toBe(false);
    expect(find({ ...good, jwtSecretLength: 64, jwtSecretDistinct: 2 }, 'secret').ok).toBe(false);
    expect(find({ ...good, jwtSecretLength: 32, jwtSecretDistinct: 8 }, 'secret').ok).toBe(true);
  });

  it('hors production, ces mêmes défauts ne sont que des avertissements', () => {
    const dev = { ...good, production: false, jwtSecretLength: 0, jwtSecretDistinct: 0, apiUrl: 'http://localhost:3001', siteUrls: [] };
    expect(find(dev, 'secret').level).toBe('warn');
    expect(find(dev, 'https').level).toBe('warn');
    expect(securitySummary(securityChecks(dev)).ok).toBe(true);
    // Le schéma qui se modifie seul n'est une erreur qu'en production.
    expect(find({ ...dev, synchronize: true }, 'schema').ok).toBe(true);
    // Les sauvegardes ne sont contrôlées qu'en production.
    expect(securityChecks(dev).some((c) => c.key === 'backups')).toBe(false);
  });

  it('avertissements : emails, paiement en mode test, Swagger public, administrateurs sans double authentification, sauvegardes', () => {
    const warn = { ...good, mailConfigured: false, gateway: { provider: 'flouci', configured: true, mode: 'sandbox' as const }, swagger: true, adminsWithoutTwoFactor: 2, backups: false };
    const checks = securityChecks(warn);
    for (const key of ['mail', 'payments', 'swagger', 'admin2fa', 'backups']) {
      const c = checks.find((x) => x.key === key)!;
      expect([key, c.ok, c.level]).toEqual([key, false, 'warn']);
    }
    expect(checks.find((c) => c.key === 'admin2fa')!.message).toMatch(/^2 compte/);
    expect(securitySummary(checks)).toEqual({ ok: true, errors: 0, warnings: 5 });
    expect(find({ ...good, gateway: { provider: 'flouci', configured: false, mode: 'production' } }, 'payments').message).toMatch(/Flouci n’est pas configuré/);
  });

  it('contrôle des administrateurs ignoré quand il n’a pas pu être fait', () => {
    expect(securityChecks({ ...good, adminsWithoutTwoFactor: null }).some((c) => c.key === 'admin2fa')).toBe(false);
  });

  it('aucun message ne contient de valeur de configuration sensible', () => {
    const text = JSON.stringify(securityChecks({ ...good, jwtSecretLength: 3, jwtSecretDistinct: 3 }));
    expect(text).not.toMatch(/e2e-secret|password|apikey/i);
  });
});

describe('securityNoticeMail — alertes de sécurité envoyées au titulaire du compte', () => {
  const kinds: SecurityNotice[] = ['password_changed', 'two_factor_enabled', 'two_factor_disabled', 'two_factor_reset'];

  it.each(MAIL_LANGS)('langue %s : chaque alerte a un sujet, un texte et un HTML, et dit quoi faire si ce n’est pas vous', (lang) => {
    for (const kind of kinds) {
      const m = securityNoticeMail({ lang, name: 'Sami', kind });
      expect(m.subject.length).toBeGreaterThan(10);
      expect(m.text).toContain('Sami');
      expect(m.html).toContain(`lang="${lang}"`);
      expect(m.text).toMatch(lang === 'fr' ? /Mot de passe oublié/ : lang === 'en' ? /Forgot password/ : /Olvidé mi contraseña/);
      expect(m.html).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('les quatre alertes sont distinctes, dans chaque langue', () => {
    for (const lang of MAIL_LANGS) {
      expect(new Set(kinds.map((kind) => securityNoticeMail({ lang, name: 'S', kind }).subject)).size).toBe(4);
    }
    expect(securityNoticeMail({ lang: 'fr', name: 'S', kind: 'password_changed' }).subject).toMatch(/mot de passe/);
    expect(securityNoticeMail({ lang: 'en', name: 'S', kind: 'two_factor_reset' }).subject).toMatch(/reset/);
    expect(securityNoticeMail({ lang: 'es', name: 'S', kind: 'two_factor_enabled' }).subject).toMatch(/activada/);
  });

  it('le nom du client est neutralisé dans le HTML', () => {
    const m = securityNoticeMail({ lang: 'fr', name: '<script>alert(1)</script>', kind: 'password_changed' });
    expect(m.html).not.toContain('<script>');
    expect(m.html).toContain('&lt;script&gt;');
  });
});
