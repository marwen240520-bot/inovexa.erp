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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const invoice_entity_1 = require("./entities/invoice.entity");
const client_entity_1 = require("../clients/entities/client.entity");
const supplier_entity_1 = require("../suppliers/supplier.entity");
let InvoicesService = class InvoicesService {
    constructor(invoiceRepository, clientRepository, supplierRepository) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.supplierRepository = supplierRepository;
    }
    toIntOrNull(value) {
        if (value === null || value === undefined || value === '')
            return null;
        const n = parseInt(String(value), 10);
        return isNaN(n) ? null : n;
    }
    async findOrCreateClient(userId, name, extra = {}) {
        const trimmed = (name || '').trim();
        const existing = await this.clientRepository
            .createQueryBuilder('c')
            .where('c.userId = :userId', { userId })
            .andWhere('LOWER(c.name) = LOWER(:name)', { name: trimmed })
            .getOne();
        if (existing)
            return existing;
        const client = this.clientRepository.create({
            userId,
            name: trimmed,
            email: extra.email || '',
            phone: extra.phone || null,
            address: extra.address || null,
        });
        return this.clientRepository.save(client);
    }
    async findOrCreateSupplier(userId, name) {
        const trimmed = (name || '').trim();
        const existing = await this.supplierRepository
            .createQueryBuilder('s')
            .where('s.userId = :userId', { userId })
            .andWhere('LOWER(s.name) = LOWER(:name)', { name: trimmed })
            .getOne();
        if (existing)
            return existing;
        const supplier = this.supplierRepository.create({
            userId,
            name: trimmed,
            email: '',
        });
        return this.supplierRepository.save(supplier);
    }
    getValidDate(date) {
        if (!date)
            return null;
        try {
            const d = new Date(date);
            if (isNaN(d.getTime()))
                return null;
            return d;
        }
        catch {
            return null;
        }
    }
    async findAll(userId) {
        return this.invoiceRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }
    async findByOperationNumber(operationNumber, userId) {
        const invoice = await this.invoiceRepository.findOne({
            where: { operationNumber, userId }
        });
        if (!invoice)
            throw new common_1.NotFoundException('Facture non trouvée');
        return invoice;
    }
    async findOne(id, userId) {
        const invoice = await this.invoiceRepository.findOne({ where: { id, userId } });
        if (!invoice)
            throw new common_1.NotFoundException('Facture non trouvée');
        return invoice;
    }
    async create(userId, data) {
        const dueDate = this.getValidDate(data.dueDate);
        const type = data.type || 'debit';
        let clientId = this.toIntOrNull(data.clientId);
        let supplierId = this.toIntOrNull(data.supplierId);
        let clientName = (data.clientName || '').trim();
        let supplierName = (data.supplierName || '').trim();
        if (type === 'debit') {
            if (!clientId && !clientName) {
                throw new common_1.BadRequestException('Veuillez sélectionner un client ou saisir son nom');
            }
            if (!clientId && clientName) {
                const client = await this.findOrCreateClient(userId, clientName, {
                    email: data.clientEmail,
                    phone: data.clientPhone,
                    address: data.clientAddress,
                });
                clientId = client.id;
                clientName = client.name;
            }
        }
        if (type === 'credit') {
            if (!supplierId && !supplierName) {
                throw new common_1.BadRequestException('Veuillez sélectionner un fournisseur ou saisir son nom');
            }
            if (!supplierId && supplierName) {
                const supplier = await this.findOrCreateSupplier(userId, supplierName);
                supplierId = supplier.id;
                supplierName = supplier.name;
            }
        }
        const invoice = this.invoiceRepository.create({
            userId,
            operationNumber: data.operationNumber,
            reference: data.reference,
            type,
            clientId,
            supplierId,
            clientName,
            supplierName,
            clientEmail: data.clientEmail || '',
            clientAddress: data.clientAddress || '',
            clientPhone: data.clientPhone || '',
            clientSiret: data.clientSiret || '',
            description: data.description || '',
            items: data.items || [],
            subtotalHT: data.subtotalHT || 0,
            amount: data.amount || 0,
            taxRate: data.taxRate || 20,
            taxAmount: data.taxAmount || 0,
            dueDate: dueDate,
            paymentTerms: data.paymentTerms || 'Net 30',
            notes: data.notes || '',
            status: data.status || 'pending',
        });
        try {
            return await this.invoiceRepository.save(invoice);
        }
        catch (e) {
            if (e?.code === '23505') {
                throw new common_1.BadRequestException('Ce numéro d\'opération existe déjà');
            }
            throw new common_1.BadRequestException(`Erreur lors de la création de la facture: ${e?.detail || e?.message || 'données invalides'}`);
        }
    }
    async update(id, userId, data) {
        const invoice = await this.findOne(id, userId);
        if (data.reference !== undefined)
            invoice.reference = data.reference;
        if (data.type !== undefined)
            invoice.type = data.type;
        if (data.clientId !== undefined)
            invoice.clientId = this.toIntOrNull(data.clientId);
        if (data.supplierId !== undefined)
            invoice.supplierId = this.toIntOrNull(data.supplierId);
        if (data.clientName !== undefined)
            invoice.clientName = data.clientName;
        if (data.supplierName !== undefined)
            invoice.supplierName = data.supplierName;
        const type = invoice.type || 'debit';
        if (type === 'debit' && !invoice.clientId && (invoice.clientName || '').trim()) {
            const client = await this.findOrCreateClient(userId, invoice.clientName, {
                email: data.clientEmail,
                phone: data.clientPhone,
                address: data.clientAddress,
            });
            invoice.clientId = client.id;
            invoice.clientName = client.name;
        }
        if (type === 'credit' && !invoice.supplierId && (invoice.supplierName || '').trim()) {
            const supplier = await this.findOrCreateSupplier(userId, invoice.supplierName);
            invoice.supplierId = supplier.id;
            invoice.supplierName = supplier.name;
        }
        if (data.clientEmail !== undefined)
            invoice.clientEmail = data.clientEmail;
        if (data.clientAddress !== undefined)
            invoice.clientAddress = data.clientAddress;
        if (data.clientPhone !== undefined)
            invoice.clientPhone = data.clientPhone;
        if (data.clientSiret !== undefined)
            invoice.clientSiret = data.clientSiret;
        if (data.description !== undefined)
            invoice.description = data.description;
        if (data.items !== undefined)
            invoice.items = data.items;
        if (data.subtotalHT !== undefined)
            invoice.subtotalHT = data.subtotalHT;
        if (data.amount !== undefined)
            invoice.amount = data.amount;
        if (data.taxRate !== undefined)
            invoice.taxRate = data.taxRate;
        if (data.taxAmount !== undefined)
            invoice.taxAmount = data.taxAmount;
        if (data.dueDate !== undefined)
            invoice.dueDate = this.getValidDate(data.dueDate);
        if (data.paymentTerms !== undefined)
            invoice.paymentTerms = data.paymentTerms;
        if (data.notes !== undefined)
            invoice.notes = data.notes;
        if (data.status !== undefined)
            invoice.status = data.status;
        try {
            return await this.invoiceRepository.save(invoice);
        }
        catch (e) {
            throw new common_1.BadRequestException(`Erreur lors de la modification de la facture: ${e?.detail || e?.message || 'données invalides'}`);
        }
    }
    async markAsPaid(id, userId) {
        const invoice = await this.findOne(id, userId);
        invoice.status = 'paid';
        return this.invoiceRepository.save(invoice);
    }
    async markAsPaidByOperationNumber(operationNumber, userId) {
        const invoice = await this.findByOperationNumber(operationNumber, userId);
        invoice.status = 'paid';
        return this.invoiceRepository.save(invoice);
    }
    async delete(id, userId) {
        const invoice = await this.findOne(id, userId);
        await this.invoiceRepository.delete(id);
        return { success: true };
    }
    async getStats(userId) {
        const invoices = await this.findAll(userId);
        const total = invoices.length;
        const paid = invoices.filter(i => i.status === 'paid').length;
        const pending = invoices.filter(i => i.status !== 'paid').length;
        const totalAmount = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const totalTax = invoices.reduce((sum, i) => sum + (Number(i.taxAmount) || 0), 0);
        const debitTotal = invoices.filter(i => i.type === 'debit').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const creditTotal = invoices.filter(i => i.type === 'credit').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentQuarter = Math.floor(currentMonth / 3);
        const monthlyTotal = invoices.filter(i => {
            if (!i.createdAt)
                return false;
            const date = new Date(i.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const quarterlyTotal = invoices.filter(i => {
            if (!i.createdAt)
                return false;
            const date = new Date(i.createdAt);
            return Math.floor(date.getMonth() / 3) === currentQuarter && date.getFullYear() === currentYear;
        }).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const yearlyTotal = invoices.filter(i => {
            if (!i.createdAt)
                return false;
            const date = new Date(i.createdAt);
            return date.getFullYear() === currentYear;
        }).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        return {
            total,
            paid,
            pending,
            totalAmount,
            paidAmount,
            pendingAmount: totalAmount - paidAmount,
            totalTax,
            debitTotal,
            creditTotal,
            monthlyTotal,
            quarterlyTotal,
            yearlyTotal
        };
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(1, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __param(2, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map