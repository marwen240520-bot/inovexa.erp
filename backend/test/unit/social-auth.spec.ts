import { generateKeyPairSync, createSign } from 'crypto';
import { AuthService } from '../../src/modules/auth/auth.service';
import { appleVerifierDeps, resetAppleKeyCache } from '../../src/modules/auth/apple-verifier';
import { googleVerifierDeps, resetGoogleKeyCache } from '../../src/modules/auth/google-verifier';

/**
 * Connexion et inscription avec Google ou Apple : le parcours complet d'AuthService, avec une table d'utilisateurs
 * en mémoire et de vrais jetons signés (la clé publique de test remplace celles de Google et d'Apple).
 */

const APPLE_CLIENT = 'tn.inovexa.erp.web';
const GOOGLE_CLIENT = '1234-abc.apps.googleusercontent.com';
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = () => Math.floor(Date.now() / 1000);
function sign(payload: Record<string, any>) {
  const head = b64({ alg: 'RS256', kid: 'k' });
  const body = b64({ iat: now() - 5, exp: now() + 600, ...payload });
  return `${head}.${body}.${createSign('RSA-SHA256').update(`${head}.${body}`).sign(privateKey).toString('base64url')}`;
}
const appleToken = (over: Record<string, any> = {}) => sign({ iss: 'https://appleid.apple.com', aud: APPLE_CLIENT, sub: 'apple-001', email: 'sami@exemple.tn', email_verified: 'true', ...over });
const googleToken = (over: Record<string, any> = {}) => sign({ iss: 'https://accounts.google.com', aud: GOOGLE_CLIENT, sub: 'google-001', email: 'sami@exemple.tn', email_verified: true, name: 'Sami Trabelsi', ...over });

function build(env: { apple?: boolean; google?: boolean } = { apple: true, google: true }) {
  const users: any[] = [];
  let nextId = 1;
  const matches = (row: any, where: Record<string, any>) => Object.entries(where).every(([k, v]) => row[k] === v);
  const repo: any = {
    findOne: async ({ where }: any) => users.find((u) => matches(u, where)) ?? null,
    createQueryBuilder: () => {
      let email = '';
      const qb: any = { where: (_sql: string, params: any) => { email = params.email ?? params.e; return qb; }, getOne: async () => users.find((u) => u.email.toLowerCase() === email) ?? null };
      return qb;
    },
    create: (data: any) => ({ ...data }),
    save: async (row: any) => { if (!row.id) { row.id = nextId++; users.push(row); } return row; },
    update: async (where: any, patch: any) => { for (const u of users) if (matches(u, where)) Object.assign(u, patch); return { affected: 1 }; },
    manager: { getRepository: () => ({ findOne: async ({ where }: any) => (['commerce', 'services'].includes(where.code) ? { code: where.code, isActive: true } : null) }) },
  };
  const audit: any[] = [];
  const service = new AuthService(
    repo,
    { sign: (payload: any) => `jwt-for-${payload.userId}` } as any,
    { trySend: async () => false } as any,
    { record: async (entry: any) => { audit.push(entry); } } as any,
    { effectivePermissions: () => [] } as any,
    {
      get: async () => ({ supportEmail: null }),
      googleClientId: () => (env.google ? GOOGLE_CLIENT : null),
      appleClientIds: () => (env.apple ? [APPLE_CLIENT] : []),
    } as any,
    {
      view: (owner: any) => ({ status: owner.accountStatus, blocked: false }),
      trialDates: async (at = new Date()) => ({ trialStartedAt: at, trialEndsAt: new Date(at.getTime() + 72 * 3_600_000), trialHours: 72 }),
      sectorModules: async () => ({ dashboard: true, sales: true }),
      allowedModules: async () => null, // aucune formule : tous les modules sont disponibles
    } as any,
    { getOrCreate: async () => ({}), update: async () => ({}) } as any,
  );
  return { service, users, audit };
}

const signupFields = { intent: 'register' as const, companyName: 'Boutique Sami', sector: 'commerce', phone: '22 535 181', acceptTerms: true };

beforeEach(() => {
  resetAppleKeyCache();
  resetGoogleKeyCache();
  const keys = async () => ({ keys: new Map([['k', publicKey]]), maxAgeSeconds: 3600 });
  appleVerifierDeps.fetchKeys = keys;
  googleVerifierDeps.fetchKeys = keys;
});

describe('Connexion avec Apple', () => {
  it('non configurée : 503, et un jeton invalide est refusé (401) quand elle l’est', async () => {
    await expect(build({ apple: false }).service.apple({ identityToken: appleToken() })).rejects.toMatchObject({ status: 503 });
    await expect(build().service.apple({ identityToken: appleToken({ aud: 'com.autre.app' }) })).rejects.toMatchObject({ status: 401 });
  });

  it('aucun compte : 404 ACCOUNT_NOT_FOUND tant que la personne n’a pas demandé à créer le sien', async () => {
    const { service, users } = build();
    await expect(service.apple({ identityToken: appleToken() })).rejects.toMatchObject({ status: 404, response: { code: 'ACCOUNT_NOT_FOUND', email: 'sami@exemple.tn' } });
    expect(users).toHaveLength(0);
  });

  it('inscription : société en essai de 72 h, rôle client, adresse déjà confirmée, nom transmis par le navigateur', async () => {
    const { service, users } = build();
    const res = await service.apple({ identityToken: appleToken(), name: '  Sami   <b>Trabelsi</b> ', ...signupFields });
    expect(res.created).toBe(true);
    expect(res.access_token).toBe('jwt-for-1');
    const u = users[0];
    expect(u).toMatchObject({ email: 'sami@exemple.tn', role: 'client', accountStatus: 'TRIAL', signupSource: 'apple', appleSub: 'apple-001', googleSub: null, companyName: 'Boutique Sami', phone: '+21622535181', sector: 'commerce' });
    expect(u.name).toBe('Sami b Trabelsi /b');
    expect(u.emailVerifiedAt).toBeInstanceOf(Date);
    expect(u.trialEndsAt.getTime() - u.trialStartedAt.getTime()).toBe(72 * 3_600_000);
  });

  it('inscription : conditions, société et secteur exigés ; sans adresse communiquée, refusée', async () => {
    const { service, users } = build();
    await expect(service.apple({ identityToken: appleToken(), ...signupFields, acceptTerms: false })).rejects.toMatchObject({ status: 400 });
    await expect(service.apple({ identityToken: appleToken(), ...signupFields, companyName: ' ' })).rejects.toMatchObject({ status: 400 });
    await expect(service.apple({ identityToken: appleToken(), ...signupFields, sector: 'astrologie' })).rejects.toMatchObject({ status: 400 });
    await expect(service.apple({ identityToken: appleToken({ email: undefined }), ...signupFields })).rejects.toMatchObject({ status: 400 });
    expect(users).toHaveLength(0);
  });

  it('connexion suivante : retrouvée par l’identifiant Apple, même si Apple ne redonne ni nom ni adresse', async () => {
    const { service, users } = build();
    await service.apple({ identityToken: appleToken(), name: 'Sami Trabelsi', ...signupFields });
    const res = await service.apple({ identityToken: appleToken({ email: undefined }) });
    expect(res.created).toBe(false);
    expect(res.user.email).toBe('sami@exemple.tn');
    expect(users).toHaveLength(1);
  });

  it('compte existant créé par email : relié à Apple à la première connexion (adresse vérifiée par Apple)', async () => {
    const { service, users } = build();
    users.push({ id: 7, email: 'sami@exemple.tn', name: 'Sami', role: 'client', isActive: true, accountStatus: 'ACTIVE', appleSub: null, googleSub: null, emailVerifiedAt: null, ownerId: null });
    const res = await service.apple({ identityToken: appleToken() });
    expect(res.created).toBe(false);
    expect(users[0]).toMatchObject({ id: 7, appleSub: 'apple-001' });
    expect(users[0].emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('une adresse NON vérifiée ne donne pas accès au compte qui porte cette adresse', async () => {
    const { service, users } = build();
    users.push({ id: 7, email: 'sami@exemple.tn', name: 'Sami', role: 'client', isActive: true, appleSub: null, googleSub: null, ownerId: null });
    await expect(service.apple({ identityToken: appleToken({ email_verified: 'false' }) })).rejects.toMatchObject({ status: 404 });
    expect(users[0].appleSub).toBeNull();
  });

  it('refus : compte relié à un autre identifiant Apple, compte désactivé, administrateur de la plateforme', async () => {
    const base = { email: 'sami@exemple.tn', name: 'Sami', isActive: true, googleSub: null, ownerId: null };
    let ctx = build();
    ctx.users.push({ id: 1, ...base, role: 'client', appleSub: 'apple-999' });
    await expect(ctx.service.apple({ identityToken: appleToken() })).rejects.toMatchObject({ status: 401 });
    ctx = build();
    ctx.users.push({ id: 1, ...base, role: 'client', appleSub: 'apple-001', isActive: false });
    await expect(ctx.service.apple({ identityToken: appleToken() })).rejects.toMatchObject({ status: 401 });
    ctx = build();
    ctx.users.push({ id: 1, ...base, role: 'admin', appleSub: null });
    await expect(ctx.service.apple({ identityToken: appleToken() })).rejects.toMatchObject({ status: 403 });
    expect(ctx.users[0].appleSub).toBeNull();
  });

  it('double authentification : le code est exigé avant d’ouvrir la session', async () => {
    const { service, users } = build();
    users.push({ id: 1, email: 'sami@exemple.tn', name: 'Sami', role: 'client', isActive: true, appleSub: 'apple-001', googleSub: null, ownerId: null, twoFactorEnabled: true, twoFactorSecret: 'JBSWY3DPEHPK3PXP' });
    await expect(service.apple({ identityToken: appleToken() })).rejects.toMatchObject({ status: 401, response: { requires2fa: true } });
    await expect(service.apple({ identityToken: appleToken(), otp: '000000' })).rejects.toMatchObject({ status: 401, response: { requires2fa: true } });
  });
});

describe('Connexion avec Google (même parcours)', () => {
  it('inscription puis connexion : un seul compte, relié à Google', async () => {
    const { service, users } = build();
    await expect(service.google({ credential: googleToken() })).rejects.toMatchObject({ status: 404, response: { code: 'ACCOUNT_NOT_FOUND', name: 'Sami Trabelsi' } });
    const created = await service.google({ credential: googleToken(), ...signupFields });
    expect(created.created).toBe(true);
    expect(users[0]).toMatchObject({ signupSource: 'google', googleSub: 'google-001', appleSub: null, name: 'Sami Trabelsi', accountStatus: 'TRIAL' });
    const again = await service.google({ credential: googleToken() });
    expect(again.created).toBe(false);
    expect(users).toHaveLength(1);
  });

  it('adresse non vérifiée par Google : refusée ; compte relié à un autre compte Google : refusé', async () => {
    const { service, users } = build();
    await expect(service.google({ credential: googleToken({ email_verified: false }) })).rejects.toMatchObject({ status: 401 });
    users.push({ id: 1, email: 'sami@exemple.tn', name: 'Sami', role: 'client', isActive: true, googleSub: 'google-999', appleSub: null, ownerId: null });
    await expect(service.google({ credential: googleToken() })).rejects.toMatchObject({ status: 401 });
  });

  it('un même compte peut être relié à Google ET à Apple', async () => {
    const { service, users } = build();
    await service.google({ credential: googleToken(), ...signupFields });
    const res = await service.apple({ identityToken: appleToken() });
    expect(res.created).toBe(false);
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ googleSub: 'google-001', appleSub: 'apple-001' });
  });
});
