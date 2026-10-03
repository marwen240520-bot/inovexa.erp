import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityMetadata } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Shipment } from '../logistics/entities/shipment.entity';
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
   * Tables rattachées à un client (colonne `userId`), triées pour qu'une table qui
   * référence une autre (clé étrangère) soit vidée AVANT celle qu'elle référence.
   * Ex. : purchases -> products -> categories.
   */
  private getUserOwnedTablesInDeleteOrder(): EntityMetadata[] {
    const byTable = new Map<string, EntityMetadata>();
    for (const meta of this.dataSource.entityMetadatas) {
      if (meta.target === User) continue;
      if (!meta.columns.some((c) => c.propertyName === 'userId')) continue;
      if (!byTable.has(meta.tablePath)) byTable.set(meta.tablePath, meta);
    }
    const nodes = Array.from(byTable.values());

    // refCount[t] = nombre de tables (du lot) qui ont une clé étrangère vers t
    const refCount = new Map<string, number>(nodes.map((m) => [m.tablePath, 0]));
    const refsOf = (m: EntityMetadata) =>
      Array.from(
        new Set(
          m.foreignKeys
            .map((fk) => fk.referencedEntityMetadata.tablePath)
            .filter((t) => t !== m.tablePath && byTable.has(t)),
        ),
      );
    for (const m of nodes) for (const t of refsOf(m)) refCount.set(t, (refCount.get(t) || 0) + 1);

    const ordered: EntityMetadata[] = [];
    const queue = nodes.filter((m) => (refCount.get(m.tablePath) || 0) === 0);
    const seen = new Set(queue.map((m) => m.tablePath));
    while (queue.length) {
      const m = queue.shift()!;
      ordered.push(m);
      for (const t of refsOf(m)) {
        refCount.set(t, (refCount.get(t) || 0) - 1);
        if ((refCount.get(t) || 0) <= 0 && !seen.has(t)) {
          seen.add(t);
          queue.push(byTable.get(t)!);
        }
      }
    }
    // Cycles éventuels : on ajoute le reste à la fin
    for (const m of nodes) if (!seen.has(m.tablePath)) ordered.push(m);
    return ordered;
  }

  async deleteClient(id: number) {
    const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
    if (!client) throw new NotFoundException('Client non trouvé');

    try {
      // Tout ou rien : si une étape échoue, rien n'est supprimé.
      await this.dataSource.transaction(async (manager) => {
        for (const meta of this.getUserOwnedTablesInDeleteOrder()) {
          await manager
            .createQueryBuilder()
            .delete()
            .from(meta.target)
            .where('"userId" = :id', { id })
            .execute();
        }
        // Les expéditions sont rattachées au client par `clientId` (et non `userId`)
        await manager.delete(Shipment, { clientId: id });
        await manager.delete(User, id);
      });
    } catch (err: any) {
      console.error(`Suppression du client ${id} impossible :`, err?.message || err);
      throw new ConflictException(
        'Impossible de supprimer ce client : des données liées empêchent la suppression.',
      );
    }

    return { success: true, message: 'Client supprimé' };
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