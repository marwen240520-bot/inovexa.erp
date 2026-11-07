/**
 * Crée (ou réinitialise) le compte administrateur de la plateforme.
 *
 *   ADMIN_EMAIL=moi@exemple.tn ADMIN_PASSWORD='un mot de passe long' npm run admin:create   (en production : node dist/cli/create-admin.js)
 *   ADMIN_RESET=true …                       réinitialise le mot de passe d'un compte existant
 *
 * Remplace les anciens scripts qui créaient un administrateur avec un mot de passe écrit dans le code.
 * Le mot de passe n'est jamais affiché ni enregistré ailleurs que haché (bcrypt).
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../database/typeorm.config';
import { User } from '../modules/users/entities/user.entity';

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('ADMIN_EMAIL invalide ou manquant.');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD : 12 caractères minimum.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant.');

  // Applique les migrations en attente (utile sur une base neuve), sans synchronisation automatique.
  const ds = new DataSource(buildTypeOrmOptions({ synchronize: false, migrationsRun: true } as any));
  await ds.initialize();
  try {
    const repo = ds.getRepository(User);
    const existing = await repo.findOne({ where: { email } });
    const hash = await bcrypt.hash(password, 12);
    if (existing) {
      if (process.env.ADMIN_RESET !== 'true') throw new Error(`Le compte ${email} existe déjà (ADMIN_RESET=true pour réinitialiser son mot de passe).`);
      existing.password = hash;
      existing.role = 'admin';
      existing.isActive = true;
      await repo.save(existing);
      console.log(`✔ Mot de passe de ${email} réinitialisé.`);
    } else {
      const end = new Date();
      end.setFullYear(end.getFullYear() + 10);
      await repo.save(repo.create({ email, password: hash, name: 'Administrateur', role: 'admin', isActive: true, subscriptionStart: new Date(), subscriptionEnd: end } as any));
      console.log(`✔ Administrateur ${email} créé.`);
    }
  } finally {
    await ds.destroy();
  }
}

main().catch((e) => {
  console.error('✘', e.message);
  process.exit(1);
});
