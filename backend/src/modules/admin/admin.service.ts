import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { seedDemoData, DEMO_ITEMS_PER_MODULE } from './demo-data';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getAllClients() {
    return this.userRepository.find({
      where: { role: 'client' },
      select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
    });
  }

  async getClientById(id: number) {
    const client = await this.userRepository.findOne({
      where: { id, role: 'client' },
      select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
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
    
    client.modules = modules;
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
    /** Génère 20 éléments de démo dans chaque module (activé par défaut). */
    seedDemoData?: boolean;
  }) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + body.subscriptionDuration);
    
    const client = this.userRepository.create({
      email: body.email,
      password: hashedPassword,
      name: body.name,
      companyName: body.companyName,
      phone: body.phone,
      role: 'client',
      subscriptionStart: new Date(),
      subscriptionEnd,
      isActive: true,
      modules: {}
    });
    
    await this.userRepository.save(client);

    // 20 éléments de démonstration dans chaque module du nouveau client.
    // Le client est déjà créé : un échec ici ne doit pas annuler sa création.
    let demoData: { seeded: boolean; perModule: number; total: number; error?: string } = {
      seeded: false,
      perModule: DEMO_ITEMS_PER_MODULE,
      total: 0,
    };
    if (body.seedDemoData !== false) {
      try {
        const summary = await this.dataSource.transaction((manager) => seedDemoData(manager, client.id));
        demoData = { seeded: true, perModule: summary.perModule, total: summary.total };
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
    
    delete body.modules;
    delete body.businessCategory;
    
    Object.assign(client, body);
    await this.userRepository.save(client);
    
    return { success: true, message: 'Client mis à jour' };
  }

  async extendSubscription(id: number, days: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    const newEnd = new Date(client.subscriptionEnd);
    newEnd.setDate(newEnd.getDate() + days);
    client.subscriptionEnd = newEnd;
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
  private async purgeClientData(manager: EntityManager, userId: number): Promise<void> {
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
    for (const { table, col } of roots.values()) {
      if (!existing.has(table) || table === 'users') continue;
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
        await manager.query(`DELETE FROM "users" WHERE id = $1`, [id]);
      });
    } catch (err: any) {
      throw this.describeDbError(err, 'supprimer ce client');
    }

    return { success: true, message: 'Client supprimé' };
  }

  /**
   * Remplace TOUTES les données du client par un nouveau jeu de démonstration
   * (20 éléments par module, bénéfice positif). Opération destructive : à confirmer côté interface.
   */
  async resetDemoData(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');

    try {
      const summary = await this.dataSource.transaction(async (manager) => {
        await this.purgeClientData(manager, id);
        return seedDemoData(manager, id);
      });
      return {
        success: true,
        message: 'Données de démonstration régénérées',
        demoData: { seeded: true, perModule: summary.perModule, total: summary.total },
      };
    } catch (err: any) {
      throw this.describeDbError(err, 'régénérer les données de ce client');
    }
  }

  async toggleClientStatus(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');
    
    client.isActive = !client.isActive;
    await this.userRepository.save(client);
    
    return { success: true, isActive: client.isActive };
  }

  async getAdminStats() {
    const totalClients = await this.userRepository.count({ where: { role: 'client' } });
    const activeClients = await this.userRepository.count({ where: { role: 'client', isActive: true } });
    
    return { totalClients, activeClients };
  }
}