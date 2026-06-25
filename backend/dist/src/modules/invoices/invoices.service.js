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
let InvoicesService = class InvoicesService {
    constructor(invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
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
        const invoice = this.invoiceRepository.create({
            userId,
            operationNumber: data.operationNumber,
            reference: data.reference,
            type: data.type || 'debit',
            clientId: data.clientId || null,
            supplierId: data.supplierId || null,
            clientName: data.clientName || '',
            supplierName: data.supplierName || '',
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
        return this.invoiceRepository.save(invoice);
    }
    async update(id, userId, data) {
        const invoice = await this.findOne(id, userId);
        if (data.reference !== undefined)
            invoice.reference = data.reference;
        if (data.type !== undefined)
            invoice.type = data.type;
        if (data.clientId !== undefined)
            invoice.clientId = data.clientId;
        if (data.supplierId !== undefined)
            invoice.supplierId = data.supplierId;
        if (data.clientName !== undefined)
            invoice.clientName = data.clientName;
        if (data.supplierName !== undefined)
            invoice.supplierName = data.supplierName;
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
        return this.invoiceRepository.save(invoice);
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
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map