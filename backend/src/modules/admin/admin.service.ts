import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { seedDemoData, DEMO_MIN_ITEMS, DEMO_MAX_ITEMS } from './demo-data';
import { assertStrongPassword } from '../auth/auth.service';
import { MODULE_KEYS, modulesFromList } from '../saas/account-access';
import { Sector } from '../saas/entities/sector.entity';
import { normalizePhone } from '../../common/phone';

/** Colonnes d'un compte renvoyées à l'administrateur (jamais le mot de passe ni les secrets). */
const CLIENT_COLUMNS = ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules',
  'accountStatus', 'trialEndsAt', 'sector', 'planCode', 'signupSource', 'lastLoginAt'] as any;
/** Données d'abonnement : jamais effacées quand on vide ou régénère les données de démonstration d'un compte. */
const BILLING_TABLES = ['subscription_payments', 'support_messages'];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getAllClients() {
    // Seulement les propriétaires de société : pas leurs membres d'équipe.
    return this.userRepository.find({
      where: { role: 'client', ownerId: IsNull() },
      select: CLIENT_COLUMNS,
      order: { createdAt: 'DESC' },
    });
  }

  async getClientById(id: number) {
    const client = await this.userRepository.findOne({
      where: { id, role: 'client' },
      select: CLIENT_COLUMNS,
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client;
  }

  async getClientModules(id: number) {
    const client = await this.userRepository.findOne({
      where: { id, role: 'client' },
      select: ['id', 'modules']
    });
    if (!client) throw new NotFoundException('Client non trouvé');
    return client.modules || {};
  }

  async updateClientModules(id: number, modules: Record<string, boolean>) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    if (!modules || typeof modules !== 'object' || Array.isArray(modules)) throw new BadRequestException('Modules invalides.');
    // Seules les clés de modules connues sont enregistrées, en vrai/faux.
    const clean: Record<string, boolean> = {};
    for (const key of MODULE_KEYS) if (modules[key] !== undefined) clean[key] = modules[key] === true;
    client.modules = clean;
    await this.userRepository.save(client);
    
    return { 
      success: true, 
      message: 'Modules mis à jour avec succès',
      modules: client.modules
    };
  }

  async createClient(body: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    phone?: string;
    subscriptionDuration: number;
    /** Génère 50 à 100 éléments de démo dans chaque module (activé par défaut). */
    seedDemoData?: boolean;
  }) {
    const email = String(body?.email || '').trim().toLowerCase();
    if (!EMAIL.test(email)) throw new BadRequestException('Email invalide.');
    const name = String(body?.name || '').trim();
    const companyName = String(body?.companyName || '').trim();
    if (name.length < 2) throw new BadRequestException('Nom requis.');
    if (companyName.length < 2) throw new BadRequestException('Nom de la société requis.');
    assertStrongPassword(body?.password, email);
    if (await this.userRepository.createQueryBuilder('u').where('LOWER(u.email) = :email', { email }).getOne()) throw new ConflictException('Cet email est déjà utilisé.');
    const days = Number(body?.subscriptionDuration);
    if (!Number.isFinite(days) || days < 1 || days > 3650) throw new BadRequestException('Durée d’abonnement invalide (1 à 3 650 jours).');
    const phone = normalizePhone(body?.phone);
    let sector: Sector | null = null;
    if ((body as any)?.sector) {
      sector = await this.dataSource.getRepository(Sector).findOne({ where: { code: String((body as any).sector) } });
      if (!sector) throw new BadRequestException('Secteur inconnu.');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + Math.round(days));
    // Compte créé par l'administrateur : actif tout de suite, jusqu'à la date choisie (pas d'essai).
    const client = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      companyName,
      phone: phone.valid && phone.normalized ? phone.normalized : String(body?.phone || '').trim().slice(0, 40),
      role: 'client',
      subscriptionStart: new Date(),
      subscriptionEnd,
      isActive: true,
      accountStatus: 'ACTIVE',
      expiryEnforced: true,
      signupSource: 'admin',
      sector: sector?.code ?? null,
      modules: sector?.modules?.length ? modulesFromList(sector.modules) : {},
    } as Partial<User>) as User;
    
    await this.userRepository.save(client);

    // Éléments de démonstration sur 13 mois dans chaque module du nouveau client (volumes : DEMO_RANGES).
    // Le client est déjà créé : un échec ici ne doit pas annuler sa création.
    let demoData: { seeded: boolean; perModule: number; min: number; max: number; total: number; error?: string } = {
      seeded: false,
      perModule: DEMO_MIN_ITEMS,
      min: DEMO_MIN_ITEMS,
      max: DEMO_MAX_ITEMS,
      total: 0,
    };
    if (body.seedDemoData !== false) {
      try {
        const summary = await this.dataSource.transaction((manager) => seedDemoData(manager, client.id));
        demoData = { seeded: true, perModule: summary.perModule, min: summary.min, max: summary.max, total: summary.total };
      } catch (err: any) {
        console.error(`Données de démo non créées pour le client ${client.id} :`, err?.message || err);
        demoData = { ...demoData, error: 'Les données de démonstration n\'ont pas pu être créées.' };
      }
    }
    
    return {
      success: true,
      message: 'Client créé avec succès',
      demoData,
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        companyName: client.companyName,
        subscriptionEnd: client.subscriptionEnd,
        modules: client.modules
      }
    };
  }

  async updateClient(id: number, body: any) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    // Liste fermée : le rôle, le mot de passe ou le rattachement d'un compte ne se modifient pas par cette route.
    const data = body && typeof body === 'object' ? body : {};
    if (data.name !== undefined) client.name = String(data.name || '').trim().slice(0, 120) || client.name;
    if (data.companyName !== undefined) client.companyName = String(data.companyName || '').trim().slice(0, 160);
    if (data.phone !== undefined) client.phone = String(data.phone || '').trim().slice(0, 40);
    if (data.isActive !== undefined) client.isActive = data.isActive === true;
    if (data.subscriptionEnd !== undefined && data.subscriptionEnd !== null && data.subscriptionEnd !== '') {
      const end = new Date(data.subscriptionEnd);
      if (Number.isNaN(end.getTime())) throw new BadRequestException('Date de fin d’abonnement invalide.');
      client.subscriptionEnd = end;
    }
    await this.userRepository.save(client);
    
    return { success: true, message: 'Client mis à jour' };
  }

  async extendSubscription(id: number, days: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    const n = Number(days);
    if (!Number.isFinite(n) || n < 1 || n > 3650) throw new BadRequestException('Nombre de jours invalide (1 à 3 650).');
    // Abonnement déjà échu (ou sans date) : la prolongation part d'aujourd'hui, pas de l'ancienne date.
    const current = client.subscriptionEnd ? new Date(client.subscriptionEnd) : null;
    const newEnd = current && current.getTime() > Date.now() ? current : new Date();
    newEnd.setDate(newEnd.getDate() + Math.round(n));
    client.subscriptionEnd = newEnd;
    if (client.accountStatus === 'EXPIRED' || client.accountStatus === 'TRIAL') {
      client.accountStatus = 'ACTIVE';
      client.statusReason = null;
      client.statusChangedAt = new Date();
      if (!client.subscriptionStart) client.subscriptionStart = new Date();
    }
    client.renewalReminderStage = 0;
    await this.userRepository.save(client);
    
    return { 
      success: true, 
      message: `Abonnement prolongé de ${days} jours`,
      newEnd: newEnd 
    };
  }

  /**
   * Supprime TOUTES les données d'un client (sans supprimer son compte).
   *
   * On s'appuie sur les clés étrangères RÉELLES de la base (catalogue PostgreSQL) et non
   * sur les entités TypeORM : la base contient des liens que les entités ignorent
   * (ex. admin / customers / export / search -> users, voir scripts/correction.sql).
   * Pour chaque ligne à supprimer, on supprime d'abord les lignes qui la référencent.
   */
  private async purgeClientData(manager: EntityManager, userId: number, keepTables: string[] = []): Promise<void> {
    const keep = new Set(keepTables);
    const qi = (name: string) => `"${String(name).replace(/"/g, '""')}"`;

    // 1) Carte des clés étrangères (colonne simple) du schéma courant
    const fks: Array<{
      child_table: string; child_col: string; parent_table: string; parent_col: string;
      on_delete: string; child_not_null: boolean;
    }> = await manager.query(`
      SELECT cl.relname  AS child_table,  ca.attname AS child_col,
             pl.relname  AS parent_table, pa.attname AS parent_col,
             c.confdeltype AS on_delete,  ca.attnotnull AS child_not_null
        FROM pg_constraint c
        JOIN pg_class cl     ON cl.oid = c.conrelid
        JOIN pg_namespace ns ON ns.oid = cl.relnamespace
        JOIN pg_class pl     ON pl.oid = c.confrelid
        JOIN pg_attribute ca ON ca.attrelid = c.conrelid  AND ca.attnum = c.conkey[1]
        JOIN pg_attribute pa ON pa.attrelid = c.confrelid AND pa.attnum = c.confkey[1]
       WHERE c.contype = 'f' AND ns.nspname = current_schema() AND array_length(c.conkey, 1) = 1`);

    // Les lignes enfants doivent être supprimées si la base refuse (NO ACTION / RESTRICT)
    // ou si elle tenterait de mettre NULL dans une colonne NOT NULL. CASCADE est géré par la base.
    const mustDeleteChildren = (fk: (typeof fks)[number]) =>
      fk.on_delete === 'a' || fk.on_delete === 'r' ||
      ((fk.on_delete === 'n' || fk.on_delete === 'd') && fk.child_not_null);

    // 2) Suppression récursive : enfants d'abord, puis les lignes ciblées
    const deleteWhere = async (table: string, where: string, path: string[]): Promise<void> => {
      for (const fk of fks) {
        if (fk.parent_table !== table || fk.child_table === table) continue;
        if (!mustDeleteChildren(fk) || path.includes(fk.child_table)) continue;
        await deleteWhere(
          fk.child_table,
          `${qi(fk.child_col)} IN (SELECT ${qi(fk.parent_col)} FROM ${qi(table)} WHERE ${where})`,
          [...path, table],
        );
      }
      await manager.query(`DELETE FROM ${qi(table)} WHERE ${where}`, [userId]);
    };

    // 3) Points de départ : toute table ayant une colonne "userId", les expéditions (clientId)
    //    et toute colonne qui référence users(id), quel que soit son nom.
    const withUserId: Array<{ table_name: string }> = await manager.query(`
      SELECT table_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND column_name = 'userId' AND table_name <> 'users'`);

    const roots = new Map<string, { table: string; col: string }>();
    const addRoot = (table: string, col: string) => roots.set(`${table}::${col}`, { table, col });
    withUserId.forEach((r) => addRoot(r.table_name, 'userId'));
    fks.filter((f) => f.parent_table === 'users').forEach((f) => addRoot(f.child_table, f.child_col));
    addRoot('shipments', 'clientId');

    const existing = new Set<string>(
      (await manager.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()`,
      )).map((r: any) => r.table_name),
    );
    // Lignes et échéances des documents commerciaux : sans colonne "userId" ni clé étrangère,
    // elles doivent être supprimées AVANT leurs documents pour ne pas rester orphelines.
    if (existing.has('documents') && !keep.has('documents')) {
      for (const child of ['document_lines', 'document_installments']) {
        if (!existing.has(child)) continue;
        await manager.query(
          `DELETE FROM ${qi(child)} WHERE "documentId" IN (SELECT "id" FROM "documents" WHERE "userId" = $1)`,
          [userId],
        );
      }
    }
    for (const { table, col } of roots.values()) {
      if (!existing.has(table) || table === 'users' || keep.has(table)) continue;
      await deleteWhere(table, `${qi(col)} = $1`, []);
    }
  }

  /** Message d'erreur lisible (avec table / contrainte PostgreSQL si disponibles) */
  private describeDbError(err: any, action: string): ConflictException {
    const pg = err?.driverError || err;
    console.error(`${action} impossible :`, err?.message || err);
    const detail = [pg?.table && `table "${pg.table}"`, pg?.constraint && `contrainte "${pg.constraint}"`]
      .filter(Boolean)
      .join(', ');
    return new ConflictException(
      `Impossible de ${action} : des données liées empêchent l'opération${detail ? ` (${detail})` : ''}.`,
    );
  }

  async deleteClient(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');

    try {
      // Tout ou rien : si une étape échoue, rien n'est supprimé.
      await this.dataSource.transaction(async (manager) => {
        await this.purgeClientData(manager, id);
        // Ce que la purge générique ne voit pas : les transporteurs de la société (colonne clientId) et leurs comptes,
        // les membres de l'équipe (ownerId), l'ancienne table des modules.
        await manager.query(`DELETE FROM "users" WHERE "role" = 'transporteur' AND "id" IN (SELECT "userId" FROM "transporteurs" WHERE "clientId" = $1 AND "userId" IS NOT NULL)`, [id]);
        await manager.query(`DELETE FROM "transporteurs" WHERE "clientId" = $1`, [id]);
        await manager.query(`DELETE FROM "client_modules" WHERE "clientId" = $1`, [id]);
        await manager.query(`DELETE FROM "users" WHERE "ownerId" = $1`, [id]);
        await manager.query(`DELETE FROM "users" WHERE id = $1`, [id]);
      });
    } catch (err: any) {
      throw this.describeDbError(err, 'supprimer ce client');
    }

    return { success: true, message: 'Client supprimé' };
  }

  /**
   * Remplace TOUTES les données du client par un nouveau jeu de démonstration
   * (13 mois d'historique, volumes définis dans DEMO_RANGES, bénéfice positif). Opération destructive : à confirmer côté interface.
   */
  async resetDemoData(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');

    try {
      const summary = await this.dataSource.transaction(async (manager) => {
        await this.purgeClientData(manager, id, BILLING_TABLES);
        return seedDemoData(manager, id);
      });
      return {
        success: true,
        message: 'Données de démonstration régénérées',
        demoData: { seeded: true, perModule: summary.perModule, min: summary.min, max: summary.max, total: summary.total },
      };
    } catch (err: any) {
      throw this.describeDbError(err, 'régénérer les données de ce client');
    }
  }

  /**
   * Supprime les données de démonstration (et toutes les données métier) du client, sans supprimer son compte.
   * On conserve sa fiche société, son historique d'audit, ses compteurs de numérotation et ses conversations IA.
   * Opération destructive et irréversible : à confirmer côté interface.
   */
  async clearDemoData(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');

    try {
      await this.dataSource.transaction((manager) =>
        this.purgeClientData(manager, id, ['companies', 'audit_logs', 'number_sequences', 'ia_chats', ...BILLING_TABLES]),
      );
      return { success: true, message: 'Données de démonstration supprimées' };
    } catch (err: any) {
      throw this.describeDbError(err, 'supprimer les données de ce client');
    }
  }

  async toggleClientStatus(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    client.isActive = !client.isActive;
    // Désactivation = connexion refusée : les sessions ouvertes sont coupées tout de suite.
    if (!client.isActive) client.tokenVersion = (client.tokenVersion ?? 0) + 1;
    await this.userRepository.save(client);
    
    return { success: true, isActive: client.isActive };
  }

  async getAdminStats() {
    const totalClients = await this.userRepository.count({ where: { role: 'client', ownerId: IsNull() } });
    const activeClients = await this.userRepository.count({ where: { role: 'client', ownerId: IsNull(), isActive: true } });
    // Abonnements échus et chiffre d'affaires réel (paiements validés) : l'écran affichait des cases vides.
    const [{ expired }] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS expired FROM "users" WHERE "role" = 'client' AND "ownerId" IS NULL AND "accountStatus" = 'EXPIRED'`,
    );
    const [{ revenue }] = await this.dataSource.query(`SELECT COALESCE(SUM("amountTTC"), 0) AS revenue FROM "subscription_payments" WHERE "status" = 'validated'`);

    return { totalClients, activeClients, expiredClients: expired, totalRevenue: Number(revenue) };
  }
}