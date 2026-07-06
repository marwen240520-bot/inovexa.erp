import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  private toIntOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = parseInt(String(value), 10);
    return isNaN(n) ? null : n;
  }

  /** Trouve un client par nom (insensible à la casse) ou le crée s'il n'existe pas. */
  private async findOrCreateClient(userId: number, name: string, extra: any = {}): Promise<Client> {
    const trimmed = (name || '').trim();
    const existing = await this.clientRepository
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere('LOWER(c.name) = LOWER(:name)', { name: trimmed })
      .getOne();
    if (existing) return existing;
    const client = this.clientRepository.create({
      userId,
      name: trimmed,
      email: extra.email || '',
      phone: extra.phone || null,
      address: extra.address || null,
    });
    return this.clientRepository.save(client);
  }

  /** Trouve un fournisseur par nom (insensible à la casse) ou le crée s'il n'existe pas. */
  private async findOrCreateSupplier(userId: number, name: string): Promise<Supplier> {
    const trimmed = (name || '').trim();
    const existing = await this.supplierRepository
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('LOWER(s.name) = LOWER(:name)', { name: trimmed })
      .getOne();
    if (existing) return existing;
    const supplier = this.supplierRepository.create({
      userId,
      name: trimmed,
      email: '',
    });
    return this.supplierRepository.save(supplier);
  }

  private getValidDate(date: any): Date | null {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d;
    } catch {
      return null;
    }
  }

  async findAll(userId: number) {
    return this.invoiceRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByOperationNumber(operationNumber: string, userId: number) {
    const invoice = await this.invoiceRepository.findOne({ 
      where: { operationNumber, userId } 
    });
    if (!invoice) throw new NotFoundException('Facture non trouvée');
    return invoice;
  }

  async findOne(id: number, userId: number) {
    const invoice = await this.invoiceRepository.findOne({ where: { id, userId } });
    if (!invoice) throw new NotFoundException('Facture non trouvée');
    return invoice;
  }

  async create(userId: number, data: any) {
    const dueDate = this.getValidDate(data.dueDate);
    const type = data.type || 'debit';

    let clientId = this.toIntOrNull(data.clientId);
    let supplierId = this.toIntOrNull(data.supplierId);
    let clientName = (data.clientName || '').trim();
    let supplierName = (data.supplierName || '').trim();

    // Facture débit : un client est requis (sélectionné ou saisi)
    if (type === 'debit') {
      if (!clientId && !clientName) {
        throw new BadRequestException('Veuillez sélectionner un client ou saisir son nom');
      }
      if (!clientId && clientName) {
        // Auto-création du client s'il n'existe pas
        const client = await this.findOrCreateClient(userId, clientName, {
          email: data.clientEmail,
          phone: data.clientPhone,
          address: data.clientAddress,
        });
        clientId = client.id;
        clientName = client.name;
      }
    }

    // Facture crédit : un fournisseur est requis (sélectionné ou saisi)
    if (type === 'credit') {
      if (!supplierId && !supplierName) {
        throw new BadRequestException('Veuillez sélectionner un fournisseur ou saisir son nom');
      }
      if (!supplierId && supplierName) {
        // Auto-création du fournisseur s'il n'existe pas
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
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new BadRequestException('Ce numéro d\'opération existe déjà');
      }
      throw new BadRequestException(
        `Erreur lors de la création de la facture: ${e?.detail || e?.message || 'données invalides'}`,
      );
    }
  }

  async update(id: number, userId: number, data: any) {
    const invoice = await this.findOne(id, userId);
    
    if (data.reference !== undefined) invoice.reference = data.reference;
    if (data.type !== undefined) invoice.type = data.type;
    if (data.clientId !== undefined) invoice.clientId = this.toIntOrNull(data.clientId);
    if (data.supplierId !== undefined) invoice.supplierId = this.toIntOrNull(data.supplierId);
    if (data.clientName !== undefined) invoice.clientName = data.clientName;
    if (data.supplierName !== undefined) invoice.supplierName = data.supplierName;

    // Si un nom est saisi sans ID, résoudre ou créer le client/fournisseur (évite les 500)
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

    if (data.clientEmail !== undefined) invoice.clientEmail = data.clientEmail;
    if (data.clientAddress !== undefined) invoice.clientAddress = data.clientAddress;
    if (data.clientPhone !== undefined) invoice.clientPhone = data.clientPhone;
    if (data.clientSiret !== undefined) invoice.clientSiret = data.clientSiret;
    if (data.description !== undefined) invoice.description = data.description;
    if (data.items !== undefined) invoice.items = data.items;
    if (data.subtotalHT !== undefined) invoice.subtotalHT = data.subtotalHT;
    if (data.amount !== undefined) invoice.amount = data.amount;
    if (data.taxRate !== undefined) invoice.taxRate = data.taxRate;
    if (data.taxAmount !== undefined) invoice.taxAmount = data.taxAmount;
    if (data.dueDate !== undefined) invoice.dueDate = this.getValidDate(data.dueDate);
    if (data.paymentTerms !== undefined) invoice.paymentTerms = data.paymentTerms;
    if (data.notes !== undefined) invoice.notes = data.notes;
    if (data.status !== undefined) invoice.status = data.status;
    
    try {
      return await this.invoiceRepository.save(invoice);
    } catch (e: any) {
      throw new BadRequestException(
        `Erreur lors de la modification de la facture: ${e?.detail || e?.message || 'données invalides'}`,
      );
    }
  }

  async markAsPaid(id: number, userId: number) {
    const invoice = await this.findOne(id, userId);
    invoice.status = 'paid';
    return this.invoiceRepository.save(invoice);
  }

  async markAsPaidByOperationNumber(operationNumber: string, userId: number) {
    const invoice = await this.findByOperationNumber(operationNumber, userId);
    invoice.status = 'paid';
    return this.invoiceRepository.save(invoice);
  }

  async delete(id: number, userId: number) {
    const invoice = await this.findOne(id, userId);
    await this.invoiceRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
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
      if (!i.createdAt) return false;
      const date = new Date(i.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    
    const quarterlyTotal = invoices.filter(i => {
      if (!i.createdAt) return false;
      const date = new Date(i.createdAt);
      return Math.floor(date.getMonth() / 3) === currentQuarter && date.getFullYear() === currentYear;
    }).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    
    const yearlyTotal = invoices.filter(i => {
      if (!i.createdAt) return false;
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
}