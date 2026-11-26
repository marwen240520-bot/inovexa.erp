import { existsSync } from 'fs';
import { join } from 'path';
import { DEFAULT_PAYMENT_METHODS, DEFAULT_PLANS, DEFAULT_SECTORS, PAYMENT_METHODS } from '../../src/modules/saas/saas-defaults';

/**
 * Le site public (frontend/lib/catalog.ts) et le contenu de départ de la plateforme (saas-defaults.ts) décrivent les
 * mêmes secteurs, modules et formules. Ce test échoue dès que l'un change sans l'autre : la page Tarifs ne peut pas
 * annoncer un prix ou un module différent de ce que l'inscription crée réellement.
 */
const catalogPath = join(__dirname, '..', '..', '..', 'frontend', 'lib', 'catalog.ts');
const suite = existsSync(catalogPath) ? describe : describe.skip;

suite('catalogue du site = contenu de départ de la plateforme', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const site = existsSync(catalogPath) ? require(catalogPath) : null;
  const sorted = (list: readonly string[]) => [...list].sort();

  it('mêmes secteurs, dans le même ordre, avec les mêmes noms', () => {
    expect(site.SECTORS.map((s: any) => s.code)).toEqual(DEFAULT_SECTORS.map((s) => s.code));
    for (const def of DEFAULT_SECTORS) {
      const shown = site.SECTORS.find((s: any) => s.code === def.code);
      expect([def.code, shown.name.fr, shown.name.en, shown.name.ar]).toEqual([def.code, def.name, def.nameEn, def.nameAr]);
      for (const lang of ['fr', 'en', 'es', 'ar']) expect(shown.desc[lang].length).toBeGreaterThan(10);
    }
  });

  it('mêmes modules par secteur (le site ajoute seulement le tableau de bord, toujours actif)', () => {
    for (const def of DEFAULT_SECTORS) {
      const shown = site.SECTORS.find((s: any) => s.code === def.code);
      expect([def.code, sorted(shown.modules)]).toEqual([def.code, sorted([...def.modules, 'dashboard'])]);
    }
  });

  it('chaque module affiché a un nom et une description dans les quatre langues', () => {
    const shownModules = new Set<string>(site.SECTORS.flatMap((s: any) => s.modules));
    for (const key of shownModules) {
      expect(site.MODULE_INFO[key]).toBeDefined();
      for (const lang of ['fr', 'en', 'es', 'ar']) {
        expect(site.MODULE_INFO[key].label[lang].length).toBeGreaterThan(1);
        expect(site.MODULE_INFO[key].desc[lang].length).toBeGreaterThan(10);
      }
    }
    const grouped = site.MODULE_GROUPS.flatMap((g: any) => g.modules);
    expect(sorted(grouped)).toEqual(sorted(site.ALL_MODULES));
  });

  it('mêmes formules : prix proposés, utilisateurs, modules et arguments', () => {
    expect(site.PLANS.map((p: any) => p.code)).toEqual(DEFAULT_PLANS.map((p) => p.code));
    for (const def of DEFAULT_PLANS) {
      const shown = site.PLANS.find((p: any) => p.code === def.code);
      expect([def.code, shown.name, shown.priceMonthly, shown.priceAnnual, shown.maxUsers, shown.highlight]).toEqual([def.code, def.name, def.priceMonthly, def.priceAnnual, def.maxUsers, def.highlight]);
      expect(shown.tagline.fr).toBe(def.description);
      expect(shown.features.map((f: any) => f.fr)).toEqual(def.features);
      if (def.modules === null) expect(shown.modules).toBeNull();
      else expect(sorted(shown.modules)).toEqual(sorted([...def.modules, 'dashboard']));
    }
  });

  it('mêmes moyens de paiement', () => {
    expect(site.DEFAULT_PAYMENT_METHODS).toEqual(DEFAULT_PAYMENT_METHODS);
    expect(sorted(Object.keys(site.PAYMENT_METHOD_LABELS))).toEqual(sorted(PAYMENT_METHODS));
  });
});
