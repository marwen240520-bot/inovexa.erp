import { generateKeyPairSync, createSign, KeyObject } from 'crypto';
import { blockMessage, isAllowedWhenBlocked, modulesFromList, resolveAccess } from '../../src/modules/saas/account-access';
import { addMonths } from '../../src/modules/saas/subscription.service';
import { isModuleEnabled, missingModuleFor } from '../../src/modules/auth/access.guard';
import { googleVerifierDeps, resetGoogleKeyCache, verifyGoogleIdToken } from '../../src/modules/auth/google-verifier';
import { appleVerifierDeps, resetAppleKeyCache, verifyAppleIdToken } from '../../src/modules/auth/apple-verifier';
import { formatPhone, normalizePhone } from '../../src/common/phone';
import { stripProtected } from '../../src/modules/saas/admin.guard';
import { CATALOG_V1, CATALOG_V2, CATALOG_VERSION, DEFAULT_PAYMENT_METHODS, DEFAULT_PLANS, DEFAULT_SECTORS, DEFAULT_SERVICE_OFFERS, PAYMENT_METHODS } from '../../src/modules/saas/saas-defaults';
import { MODULE_KEYS } from '../../src/modules/saas/account-access';

const NOW = new Date('2026-11-25T12:00:00Z');
const hours = (n: number) => new Date(NOW.getTime() + n * 3_600_000);
const owner = (over: Record<string, any> = {}) => ({ role: 'client', accountStatus: 'ACTIVE', expiryEnforced: true, signupSource: 'self', emailVerifiedAt: NOW, ...over });

describe('resolveAccess — état du compte décidé par le serveur', () => {
  it('essai en cours : ouvert, temps restant calculé avec l’horloge du serveur', () => {
    const a = resolveAccess(owner({ accountStatus: 'TRIAL', trialEndsAt: hours(72) }), NOW);
    expect(a).toMatchObject({ status: 'TRIAL', blocked: false, reason: null, remainingSeconds: 72 * 3600, persistExpired: false });
  });

  it('essai : exactement 72 h — encore ouvert une seconde avant, fermé à l’échéance', () => {
    const end = hours(72);
    expect(resolveAccess(owner({ accountStatus: 'TRIAL', trialEndsAt: end }), new Date(end.getTime() - 1000)).blocked).toBe(false);
    const after = resolveAccess(owner({ accountStatus: 'TRIAL', trialEndsAt: end }), end);
    expect(after).toMatchObject({ status: 'EXPIRED', blocked: true, reason: 'TRIAL_EXPIRED', persistExpired: true, remainingSeconds: 0 });
  });

  it('essai sans date de fin : fermé (jamais d’essai illimité par accident)', () => {
    expect(resolveAccess(owner({ accountStatus: 'TRIAL', trialEndsAt: null }), NOW)).toMatchObject({ blocked: true, reason: 'TRIAL_EXPIRED' });
  });

  it('abonnement actif jusqu’à son échéance, puis expiré', () => {
    expect(resolveAccess(owner({ subscriptionEnd: hours(24) }), NOW)).toMatchObject({ status: 'ACTIVE', blocked: false, remainingSeconds: 86_400 });
    expect(resolveAccess(owner({ subscriptionEnd: hours(-1) }), NOW)).toMatchObject({ status: 'EXPIRED', blocked: true, reason: 'SUBSCRIPTION_EXPIRED', persistExpired: true });
  });

  it('compte antérieur au SaaS : la date dépassée ne bloque pas tant que l’échéance n’est pas appliquée', () => {
    const a = resolveAccess(owner({ subscriptionEnd: hours(-24 * 400), expiryEnforced: false, signupSource: 'admin' }), NOW);
    expect(a).toMatchObject({ status: 'ACTIVE', blocked: false, endsAt: null, remainingSeconds: null });
  });

  it('abonnement sans date de fin : actif sans limite', () => {
    expect(resolveAccess(owner({ subscriptionEnd: null }), NOW)).toMatchObject({ status: 'ACTIVE', blocked: false, endsAt: null });
  });

  it('suspendu, résilié, expiré : fermés quelles que soient les dates', () => {
    expect(resolveAccess(owner({ accountStatus: 'SUSPENDED', subscriptionEnd: hours(1000) }), NOW)).toMatchObject({ blocked: true, reason: 'SUSPENDED' });
    expect(resolveAccess(owner({ accountStatus: 'CANCELLED', subscriptionEnd: hours(1000) }), NOW)).toMatchObject({ blocked: true, reason: 'CANCELLED' });
    expect(resolveAccess(owner({ accountStatus: 'EXPIRED', statusReason: 'SUBSCRIPTION_EXPIRED' }), NOW)).toMatchObject({ blocked: true, reason: 'SUBSCRIPTION_EXPIRED' });
    expect(resolveAccess(owner({ accountStatus: 'EXPIRED', statusReason: null, trialEndsAt: hours(100) }), NOW)).toMatchObject({ blocked: true, reason: 'TRIAL_EXPIRED' });
  });

  it('l’administrateur de la plateforme n’a pas d’abonnement', () => {
    for (const role of ['admin', 'super_admin']) {
      expect(resolveAccess({ role, accountStatus: 'SUSPENDED', trialEndsAt: hours(-1) }, NOW)).toMatchObject({ status: 'ACTIVE', blocked: false });
    }
  });

  it('confirmation de l’adresse email exigée : bloque seulement les comptes inscrits seuls et non confirmés', () => {
    const opts = { requireEmailVerification: true };
    expect(resolveAccess(owner({ accountStatus: 'TRIAL', trialEndsAt: hours(10), emailVerifiedAt: null }), NOW, opts)).toMatchObject({ status: 'TRIAL', blocked: true, reason: 'EMAIL_NOT_VERIFIED' });
    expect(resolveAccess(owner({ accountStatus: 'TRIAL', trialEndsAt: hours(10) }), NOW, opts).blocked).toBe(false);
    expect(resolveAccess(owner({ emailVerifiedAt: null, signupSource: 'admin' }), NOW, opts).blocked).toBe(false);
    expect(resolveAccess(owner({ emailVerifiedAt: null, signupSource: 'google' }), NOW, opts).blocked).toBe(false);
    // Sans l'option, rien n'est bloqué
    expect(resolveAccess(owner({ accountStatus: 'TRIAL', trialEndsAt: hours(10), emailVerifiedAt: null }), NOW).blocked).toBe(false);
  });

  it('un état inconnu est traité comme ACTIVE avec ses dates (pas de blocage ni d’ouverture hasardeuse)', () => {
    expect(resolveAccess(owner({ accountStatus: 'N’IMPORTE', subscriptionEnd: hours(-1) }), NOW).blocked).toBe(true);
  });

  it('chaque motif de blocage a un message', () => {
    for (const r of ['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'SUSPENDED', 'CANCELLED', 'EMAIL_NOT_VERIFIED'] as const) expect(blockMessage(r).length).toBeGreaterThan(20);
  });
});

describe('isAllowedWhenBlocked — ce qu’un compte bloqué peut encore faire', () => {
  it('abonnement, connexion et site public restent ouverts', () => {
    expect(isAllowedWhenBlocked('GET', '/billing/subscription')).toBe(true);
    expect(isAllowedWhenBlocked('POST', '/billing/payments')).toBe(true);
    expect(isAllowedWhenBlocked('GET', '/auth/me')).toBe(true);
    expect(isAllowedWhenBlocked('GET', '/public/plans')).toBe(true);
    expect(isAllowedWhenBlocked('GET', '/users/profile')).toBe(true);
    expect(isAllowedWhenBlocked('GET', '/users/12/modules')).toBe(true);
  });
  it('tout l’ERP est fermé, en lecture comme en écriture', () => {
    for (const [m, p] of [['GET', '/products'], ['POST', '/sales'], ['GET', '/documents/3/pdf'], ['PATCH', '/users/profile'], ['POST', '/products/suggestions/import'], ['GET', '/billingx']] as const) {
      expect(isAllowedWhenBlocked(m, p)).toBe(false);
    }
  });
});

describe('modules de l’abonnement', () => {
  it('modulesFromList : les modules de base sont toujours actifs', () => {
    const m = modulesFromList(['sales', 'pos']);
    expect(m).toMatchObject({ dashboard: true, profile: true, settings: true, sales: true, pos: true, logistics: false, production: false });
    expect(Object.keys(m).sort()).toEqual([...MODULE_KEYS].sort());
  });

  it('isModuleEnabled suit les mêmes règles que la barre latérale', () => {
    expect(isModuleEnabled({}, 'hr')).toBe(true); // compte jamais configuré
    expect(isModuleEnabled(null, 'hr')).toBe(true);
    expect(isModuleEnabled({ sales: true }, 'hr')).toBe(false);
    expect(isModuleEnabled({ sales: true }, 'objectives')).toBe(true);
    expect(isModuleEnabled({ sales: true, objectives: false }, 'objectives')).toBe(false);
    expect(isModuleEnabled({ sales: true }, 'pos')).toBe(true); // caisse = ventes ou achats si non précisée
    expect(isModuleEnabled({ sales: true, pos: false }, 'pos')).toBe(false);
  });

  it('missingModuleFor : une écriture passe si UN module de la liste est actif', () => {
    const restaurant = modulesFromList(['products', 'sales', 'pos', 'clients', 'invoices']);
    expect(missingModuleFor(restaurant, 'sales')).toBeNull();
    expect(missingModuleFor(restaurant, 'categories')).toBeNull(); // via « products »
    expect(missingModuleFor(restaurant, 'purchases')).toBeNull(); // via « pos »
    expect(missingModuleFor(restaurant, 'logistics')).toBe('logistics');
    expect(missingModuleFor(restaurant, 'employees')).toBe('hr');
    expect(missingModuleFor(restaurant, 'accounting')).toBe('finance');
    // Ressources jamais filtrées
    for (const path of ['company', 'team', 'users', 'billing', 'auth', 'upload', 'notifications']) expect(missingModuleFor(restaurant, path)).toBeNull();
  });

  it('chaque secteur par défaut n’utilise que des modules connus et a son catalogue de suggestions', () => {
    expect(DEFAULT_SECTORS).toHaveLength(15);
    expect(new Set(DEFAULT_SECTORS.map((s) => s.code)).size).toBe(15);
    for (const s of DEFAULT_SECTORS) {
      for (const m of s.modules) expect(MODULE_KEYS).toContain(m);
      expect(new Set(s.modules).size).toBe(s.modules.length);
      expect(s.categories.length).toBeGreaterThan(0);
      expect(s.recommendations.length).toBeGreaterThan(0);
      for (const text of [s.name, s.nameEn, s.description]) expect(text.length).toBeGreaterThan(3);
    }
    expect(DEFAULT_SECTORS[DEFAULT_SECTORS.length - 1].code).toBe('other');
    const modulesOf = (code: string) => DEFAULT_SECTORS.find((s) => s.code === code)!.modules;
    expect(modulesOf('logistics')).toEqual(expect.arrayContaining(['logistics', 'stock']));
    expect(modulesOf('restaurant')).toContain('pos');
    expect(modulesOf('restaurant')).not.toContain('production');
    // La fabrication n'est proposée qu'aux secteurs qui transforment des matières.
    expect(DEFAULT_SECTORS.filter((s) => s.modules.includes('production')).map((s) => s.code).sort()).toEqual(['agrifood', 'manufacturing', 'other', 'textile']);
    // Secteurs sans marchandise : pas de stock imposé.
    for (const code of ['education', 'services']) expect(modulesOf(code)).not.toContain('stock');
  });

  it('formules proposées : prix croissants, annuel = dix mensualités, modules connus', () => {
    expect(DEFAULT_PLANS.map((p) => p.code)).toEqual(['starter', 'business', 'enterprise']);
    let previous = 0;
    for (const plan of DEFAULT_PLANS) {
      expect(plan.priceMonthly).toBeGreaterThan(previous);
      expect(plan.priceAnnual).toBe(plan.priceMonthly * 10);
      previous = plan.priceMonthly;
      for (const m of plan.modules || []) expect(MODULE_KEYS).toContain(m);
      expect(plan.features.length).toBeGreaterThanOrEqual(5);
    }
    expect(DEFAULT_PLANS.filter((p) => p.highlight).map((p) => p.code)).toEqual(['business']);
    // La formule d'entrée ne comprend ni la comptabilité, ni la paie, ni l'assistant.
    for (const m of ['finance', 'hr', 'ai', 'production']) expect(DEFAULT_PLANS[0].modules).not.toContain(m);
  });

  it('moyens de paiement et prestations : valeurs connues, un secteur existant par prestation', () => {
    for (const m of DEFAULT_PAYMENT_METHODS) expect(PAYMENT_METHODS).toContain(m);
    expect(PAYMENT_METHODS).toEqual(expect.arrayContaining(['bank_transfer', 'd17', 'flouci', 'edinar', 'postal', 'cheque', 'cash', 'card']));
    const codes = DEFAULT_SECTORS.map((s) => s.code);
    for (const o of DEFAULT_SERVICE_OFFERS) if (o.sectorCode) expect(codes).toContain(o.sectorCode);
  });

  it('versions 1 et 2 du catalogue : repères pour la mise à niveau, sans rien perdre', () => {
    expect(CATALOG_VERSION).toBe(3);
    expect(Object.keys(CATALOG_V1.sectorModules)).toHaveLength(10);
    for (const [code, v1] of Object.entries(CATALOG_V1.sectorModules)) {
      const now = DEFAULT_SECTORS.find((s) => s.code === code)!.modules;
      // Une mise à niveau n'enlève jamais un module à un secteur.
      for (const m of v1) expect(now).toContain(m);
    }
    expect(Object.keys(CATALOG_V1.plans)).toEqual(DEFAULT_PLANS.map((p) => p.code));

    // La version 2 couvre les 15 secteurs ; la version 3 y ajoute des modules sans en retirer.
    expect(Object.keys(CATALOG_V2.sectorModules).sort()).toEqual(DEFAULT_SECTORS.map((s) => s.code).sort());
    for (const [code, v2] of Object.entries(CATALOG_V2.sectorModules)) {
      const now = DEFAULT_SECTORS.find((s) => s.code === code)!.modules;
      for (const m of v2) expect(now).toContain(m);
    }
    expect(Object.keys(CATALOG_V2.plans)).toEqual(DEFAULT_PLANS.map((p) => p.code));
    expect(CATALOG_V2.currency).toBe('TND');
  });

  it('modules Rendez-vous et Projets : connus du serveur et proposés aux secteurs qui en ont besoin', () => {
    expect(MODULE_KEYS).toEqual(expect.arrayContaining(['appointments', 'projects']));
    const modulesOf = (code: string) => DEFAULT_SECTORS.find((s) => s.code === code)!.modules;
    for (const code of ['healthcare', 'education', 'restaurant', 'automotive', 'beauty', 'services', 'other']) expect(modulesOf(code)).toContain('appointments');
    for (const code of ['construction', 'services', 'other']) expect(modulesOf(code)).toContain('projects');
    // Pas de rendez-vous imposés à un commerce de détail ou à une usine.
    for (const code of ['commerce', 'manufacturing', 'logistics']) expect(modulesOf(code)).not.toContain('appointments');
    // Chaque nouveau module se coupe avec la formule comme les autres.
    expect(missingModuleFor(modulesFromList(['sales']), 'appointments')).toBe('appointments');
    expect(missingModuleFor(modulesFromList(['appointments']), 'appointments')).toBeNull();
    expect(missingModuleFor(modulesFromList(['sales']), 'projects')).toBe('projects');
    expect(missingModuleFor(modulesFromList(['projects', 'finance']), 'projects')).toBeNull();
  });

  it('prix de départ en dollars : formules publiées par défaut, annuel = dix mensualités, TVA en plus', () => {
    expect(DEFAULT_PLANS.map((p) => [p.code, p.priceMonthly, p.priceAnnual])).toEqual([['starter', 15, 150], ['business', 29, 290], ['enterprise', 79, 790]]);
    // Les prestations restent à un tarif en dollars cohérent avec les formules.
    for (const offer of DEFAULT_SERVICE_OFFERS) if (offer.price !== null) expect(offer.price).toBeLessThan(200);
  });
});

describe('addMonths', () => {
  it('ajoute des mois calendaires sans déborder sur le mois suivant', () => {
    expect(addMonths(new Date('2026-01-31T10:00:00Z'), 1).toISOString()).toBe('2026-02-28T10:00:00.000Z');
    expect(addMonths(new Date('2026-11-25T10:00:00Z'), 1).toISOString()).toBe('2026-12-25T10:00:00.000Z');
    expect(addMonths(new Date('2026-11-25T10:00:00Z'), 12).toISOString()).toBe('2027-11-25T10:00:00.000Z');
    expect(addMonths(new Date('2028-02-29T00:00:00Z'), 12).toISOString()).toBe('2029-02-28T00:00:00.000Z');
  });
});

describe('stripProtected', () => {
  it('retire l’identité et le rattachement de la ligne, garde le reste', () => {
    expect(stripProtected({ id: 9, userId: 4, ownerId: 2, name: 'x', createdAt: '2026-01-01' })).toEqual({ name: 'x', createdAt: '2026-01-01' });
    expect(stripProtected({ id: 9, name: 'x', createdAt: 'a', total: 5 }, ['createdAt', 'total'])).toEqual({ name: 'x' });
    expect(stripProtected(null as any)).toEqual({});
  });
});

describe('normalizePhone — numéros tunisiens', () => {
  it('accepte les écritures courantes et enregistre au format international', () => {
    for (const v of ['22 535 181', '22535181', '+216 22 535 181', '0021622535181', '+216-22-535-181', '(+216) 22.535.181'.replace('(', '').replace(')', '')]) {
      expect(normalizePhone(v)).toMatchObject({ valid: true, normalized: '+21622535181' });
    }
    expect(formatPhone('+21622535181')).toBe('+216 22 535 181');
  });
  it('accepte un numéro étranger avec son indicatif', () => {
    expect(normalizePhone('+33 6 12 34 56 78')).toMatchObject({ valid: true, normalized: '+33612345678' });
  });
  it('refuse les numéros incomplets ou fantaisistes', () => {
    for (const v of ['1234', '12 345 678', '+216 1234', 'abc', '0612345678', '+216 02 535 181']) expect(normalizePhone(v).valid).toBe(false);
  });
  it('champ vide : valide et vide', () => {
    expect(normalizePhone('')).toEqual({ valid: true, normalized: '' });
    expect(normalizePhone(null)).toEqual({ valid: true, normalized: '' });
  });
});

describe('verifyGoogleIdToken — le jeton Google n’est jamais cru sur parole', () => {
  const CLIENT = '1234-abc.apps.googleusercontent.com';
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const seconds = Math.floor(NOW.getTime() / 1000);
  const sign = (payload: Record<string, any>, opts: { key?: KeyObject; header?: Record<string, any> } = {}) => {
    const head = b64({ alg: 'RS256', kid: 'k1', typ: 'JWT', ...(opts.header || {}) });
    const body = b64(payload);
    const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(opts.key || privateKey).toString('base64url');
    return `${head}.${body}.${sig}`;
  };
  const claims = (over: Record<string, any> = {}) => ({ iss: 'https://accounts.google.com', aud: CLIENT, sub: '1099', email: 'Sami@Exemple.tn', email_verified: true, name: 'Sami T', iat: seconds - 10, exp: seconds + 3000, ...over });

  beforeEach(() => {
    resetGoogleKeyCache();
    googleVerifierDeps.fetchKeys = async () => ({ keys: new Map([['k1', publicKey]]), maxAgeSeconds: 3600 });
  });

  it('accepte un jeton signé par Google pour notre application', async () => {
    const id = await verifyGoogleIdToken(sign(claims()), CLIENT, NOW);
    expect(id).toMatchObject({ sub: '1099', email: 'sami@exemple.tn', emailVerified: true, name: 'Sami T' });
  });

  it('refuse un jeton émis pour une autre application', async () => {
    await expect(verifyGoogleIdToken(sign(claims({ aud: 'autre.apps.googleusercontent.com' })), CLIENT, NOW)).rejects.toThrow(/autre application/);
  });

  it('refuse une signature faite avec une autre clé', async () => {
    await expect(verifyGoogleIdToken(sign(claims(), { key: other.privateKey }), CLIENT, NOW)).rejects.toThrow(/Signature invalide/);
  });

  it('refuse un contenu modifié après signature', async () => {
    const [h, , s] = sign(claims()).split('.');
    await expect(verifyGoogleIdToken(`${h}.${b64(claims({ email: 'pirate@x.tn' }))}.${s}`, CLIENT, NOW)).rejects.toThrow(/Signature invalide/);
  });

  it('refuse un jeton expiré, un émetteur inconnu, un algorithme « none » ou HS256', async () => {
    await expect(verifyGoogleIdToken(sign(claims({ exp: seconds - 3600 })), CLIENT, NOW)).rejects.toThrow(/expiré/);
    await expect(verifyGoogleIdToken(sign(claims({ iss: 'https://accounts.exemple.com' })), CLIENT, NOW)).rejects.toThrow(/Émetteur/);
    await expect(verifyGoogleIdToken(`${b64({ alg: 'none', kid: 'k1' })}.${b64(claims())}.`, CLIENT, NOW)).rejects.toThrow(/Algorithme/);
    await expect(verifyGoogleIdToken(sign(claims(), { header: { alg: 'HS256' } }), CLIENT, NOW)).rejects.toThrow(/Algorithme/);
  });

  it('refuse une clé de signature inconnue et un jeton mal formé', async () => {
    await expect(verifyGoogleIdToken(sign(claims(), { header: { kid: 'inconnue' } }), CLIENT, NOW)).rejects.toThrow(/inconnue/);
    await expect(verifyGoogleIdToken('pas-un-jeton', CLIENT, NOW)).rejects.toThrow(/mal formé/);
    await expect(verifyGoogleIdToken(sign(claims()), '', NOW)).rejects.toThrow(/GOOGLE_CLIENT_ID/);
  });

  it('signale une adresse non vérifiée par Google', async () => {
    expect((await verifyGoogleIdToken(sign(claims({ email_verified: false })), CLIENT, NOW)).emailVerified).toBe(false);
  });
});

describe('verifyAppleIdToken — le jeton Apple n’est jamais cru sur parole', () => {
  const CLIENT = 'tn.inovexa.erp.web';
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const seconds = Math.floor(NOW.getTime() / 1000);
  const sign = (payload: Record<string, any>, opts: { key?: KeyObject; header?: Record<string, any> } = {}) => {
    const head = b64({ alg: 'RS256', kid: 'a1', ...(opts.header || {}) });
    const body = b64(payload);
    const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(opts.key || privateKey).toString('base64url');
    return `${head}.${body}.${sig}`;
  };
  // Apple écrit les booléens sous forme de chaînes (« true »).
  const claims = (over: Record<string, any> = {}) => ({ iss: 'https://appleid.apple.com', aud: CLIENT, sub: '001234.abcdef.5678', email: 'Sami@Exemple.tn', email_verified: 'true', iat: seconds - 10, exp: seconds + 3000, ...over });

  beforeEach(() => {
    resetAppleKeyCache();
    appleVerifierDeps.fetchKeys = async () => ({ keys: new Map([['a1', publicKey]]), maxAgeSeconds: 3600 });
  });

  it('accepte un jeton signé par Apple pour notre identifiant de service', async () => {
    expect(await verifyAppleIdToken(sign(claims()), CLIENT, NOW)).toEqual({ sub: '001234.abcdef.5678', email: 'sami@exemple.tn', emailVerified: true, isPrivateEmail: false });
  });

  it('accepte plusieurs identifiants (site web et application), et un « aud » en liste', async () => {
    expect((await verifyAppleIdToken(sign(claims({ aud: 'tn.inovexa.erp' })), [CLIENT, 'tn.inovexa.erp'], NOW)).sub).toBe('001234.abcdef.5678');
    expect((await verifyAppleIdToken(sign(claims({ aud: ['autre', CLIENT] })), CLIENT, NOW)).sub).toBe('001234.abcdef.5678');
  });

  it('adresse de relais privée : reconnue ; adresse absente ou non vérifiée : signalée', async () => {
    expect(await verifyAppleIdToken(sign(claims({ email: 'x9k2@privaterelay.appleid.com', is_private_email: 'true' })), CLIENT, NOW)).toMatchObject({ email: 'x9k2@privaterelay.appleid.com', isPrivateEmail: true, emailVerified: true });
    expect(await verifyAppleIdToken(sign(claims({ email: undefined })), CLIENT, NOW)).toMatchObject({ email: null, emailVerified: false });
    expect((await verifyAppleIdToken(sign(claims({ email_verified: 'false' })), CLIENT, NOW)).emailVerified).toBe(false);
  });

  it('refuse un jeton émis pour une autre application, par un autre émetteur, ou expiré', async () => {
    await expect(verifyAppleIdToken(sign(claims({ aud: 'com.autre.app' })), CLIENT, NOW)).rejects.toThrow(/autre application/);
    await expect(verifyAppleIdToken(sign(claims({ iss: 'https://accounts.google.com' })), CLIENT, NOW)).rejects.toThrow(/Émetteur/);
    await expect(verifyAppleIdToken(sign(claims({ exp: seconds - 3600 })), CLIENT, NOW)).rejects.toThrow(/expiré/);
  });

  it('refuse une autre clé, un contenu modifié, un algorithme « none » ou HS256, une clé inconnue', async () => {
    await expect(verifyAppleIdToken(sign(claims(), { key: other.privateKey }), CLIENT, NOW)).rejects.toThrow(/Signature invalide/);
    const [h, , sig] = sign(claims()).split('.');
    await expect(verifyAppleIdToken(`${h}.${b64(claims({ sub: 'pirate' }))}.${sig}`, CLIENT, NOW)).rejects.toThrow(/Signature invalide/);
    await expect(verifyAppleIdToken(`${b64({ alg: 'none', kid: 'a1' })}.${b64(claims())}.`, CLIENT, NOW)).rejects.toThrow(/Algorithme/);
    await expect(verifyAppleIdToken(sign(claims(), { header: { alg: 'HS256' } }), CLIENT, NOW)).rejects.toThrow(/Algorithme/);
    await expect(verifyAppleIdToken(sign(claims(), { header: { kid: 'inconnue' } }), CLIENT, NOW)).rejects.toThrow(/inconnue/);
  });

  it('refuse un jeton mal formé ou une configuration absente', async () => {
    await expect(verifyAppleIdToken('pas-un-jeton', CLIENT, NOW)).rejects.toThrow(/mal formé/);
    await expect(verifyAppleIdToken(sign(claims()), [], NOW)).rejects.toThrow(/APPLE_CLIENT_ID/);
    await expect(verifyAppleIdToken(sign(claims({ sub: '' })), CLIENT, NOW)).rejects.toThrow(/Identité incomplète/);
  });
});
