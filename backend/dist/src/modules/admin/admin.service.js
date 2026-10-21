"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/entities/user.entity");
const demo_data_1 = require("./demo-data");
let AdminService = class AdminService {
    constructor(userRepository, dataSource) {
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    async getAllClients() {
        return this.userRepository.find({
            where: { role: 'client' },
            select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
        });
    }
    async getClientById(id) {
        const client = await this.userRepository.findOne({
            where: { id, role: 'client' },
            select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
        });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        return client;
    }
    async getClientModules(id) {
        const client = await this.userRepository.findOne({
            where: { id, role: 'client' },
            select: ['id', 'modules']
        });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        return client.modules || {};
    }
    async updateClientModules(id, modules) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        client.modules = modules;
        await this.userRepository.save(client);
        return {
            success: true,
            message: 'Modules mis à jour avec succès',
            modules: client.modules
        };
    }
    async createClient(body) {
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
        let demoData = {
            seeded: false,
            perModule: demo_data_1.DEMO_MIN_ITEMS,
            min: demo_data_1.DEMO_MIN_ITEMS,
            max: demo_data_1.DEMO_MAX_ITEMS,
            total: 0,
        };
        if (body.seedDemoData !== false) {
            try {
                const summary = await this.dataSource.transaction((manager) => (0, demo_data_1.seedDemoData)(manager, client.id));
                demoData = { seeded: true, perModule: summary.perModule, min: summary.min, max: summary.max, total: summary.total };
            }
            catch (err) {
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
    async updateClient(id, body) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        delete body.modules;
        delete body.businessCategory;
        Object.assign(client, body);
        await this.userRepository.save(client);
        return { success: true, message: 'Client mis à jour' };
    }
    async extendSubscription(id, days) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
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
    async purgeClientData(manager, userId) {
        const qi = (name) => `"${String(name).replace(/"/g, '""')}"`;
        const fks = await manager.query(`
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
        const mustDeleteChildren = (fk) => fk.on_delete === 'a' || fk.on_delete === 'r' ||
            ((fk.on_delete === 'n' || fk.on_delete === 'd') && fk.child_not_null);
        const deleteWhere = async (table, where, path) => {
            for (const fk of fks) {
                if (fk.parent_table !== table || fk.child_table === table)
                    continue;
                if (!mustDeleteChildren(fk) || path.includes(fk.child_table))
                    continue;
                await deleteWhere(fk.child_table, `${qi(fk.child_col)} IN (SELECT ${qi(fk.parent_col)} FROM ${qi(table)} WHERE ${where})`, [...path, table]);
            }
            await manager.query(`DELETE FROM ${qi(table)} WHERE ${where}`, [userId]);
        };
        const withUserId = await manager.query(`
      SELECT table_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND column_name = 'userId' AND table_name <> 'users'`);
        const roots = new Map();
        const addRoot = (table, col) => roots.set(`${table}::${col}`, { table, col });
        withUserId.forEach((r) => addRoot(r.table_name, 'userId'));
        fks.filter((f) => f.parent_table === 'users').forEach((f) => addRoot(f.child_table, f.child_col));
        addRoot('shipments', 'clientId');
        const existing = new Set((await manager.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()`)).map((r) => r.table_name));
        for (const { table, col } of roots.values()) {
            if (!existing.has(table) || table === 'users')
                continue;
            await deleteWhere(table, `${qi(col)} = $1`, []);
        }
    }
    describeDbError(err, action) {
        const pg = err?.driverError || err;
        console.error(`${action} impossible :`, err?.message || err);
        const detail = [pg?.table && `table "${pg.table}"`, pg?.constraint && `contrainte "${pg.constraint}"`]
            .filter(Boolean)
            .join(', ');
        return new common_1.ConflictException(`Impossible de ${action} : des données liées empêchent l'opération${detail ? ` (${detail})` : ''}.`);
    }
    async deleteClient(id) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        try {
            await this.dataSource.transaction(async (manager) => {
                await this.purgeClientData(manager, id);
                await manager.query(`DELETE FROM "users" WHERE id = $1`, [id]);
            });
        }
        catch (err) {
            throw this.describeDbError(err, 'supprimer ce client');
        }
        return { success: true, message: 'Client supprimé' };
    }
    async resetDemoData(id) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        try {
            const summary = await this.dataSource.transaction(async (manager) => {
                await this.purgeClientData(manager, id);
                return (0, demo_data_1.seedDemoData)(manager, id);
            });
            return {
                success: true,
                message: 'Données de démonstration régénérées',
                demoData: { seeded: true, perModule: summary.perModule, min: summary.min, max: summary.max, total: summary.total },
            };
        }
        catch (err) {
            throw this.describeDbError(err, 'régénérer les données de ce client');
        }
    }
    async toggleClientStatus(id) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        client.isActive = !client.isActive;
        await this.userRepository.save(client);
        return { success: true, isActive: client.isActive };
    }
    async getAdminStats() {
        const totalClients = await this.userRepository.count({ where: { role: 'client' } });
        const activeClients = await this.userRepository.count({ where: { role: 'client', isActive: true } });
        return { totalClients, activeClients };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], AdminService);
//# sourceMappingURL=admin.service.js.map