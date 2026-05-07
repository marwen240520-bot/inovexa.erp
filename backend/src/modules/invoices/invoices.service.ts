import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async findAll(userId: number) {
    return this.invoiceRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const invoice = await this.invoiceRepository.findOne({ where: { id, userId } });
    if (!invoice) throw new NotFoundException('Facture non trouvée');
    return invoice;
  }

  async findByOperationNumber(operationNumber: string, userId: number) {
    const invoice = await this.invoiceRepository.findOne({ where: { operationNumber, userId } });
    if (!invoice) throw new NotFoundException(`Facture avec le numéro ${operationNumber} non trouvée`);
    return invoice;
  }

  async create(userId: number, data: any) {
    const subtotal = Math.max(0, Number(data.subtotal) || Number(data.amount) || 0);
    const taxRate = Math.max(0, Math.min(100, Number(data.taxRate) || 20));
    const taxAmount = (subtotal * taxRate) / 100;
    const amount = subtotal + taxAmount;
    
    let dueDate = null;
    if (data.dueDate && data.dueDate !== "" && data.dueDate !== "undefined" && data.dueDate !== "null") {
      const parsedDate = new Date(data.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        dueDate = parsedDate;
      }
    }
    
    let operationNumber = data.operationNumber;
    if (!operationNumber) {
      const year = new Date().getFullYear();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      operationNumber = `INV-${year}${month}-${random}`;
    }
    
    // ⭐ Traitement des items
    let items = [];
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      items = data.items.map(item => ({
        description: item.description || "",
        quantity: Number(item.quantity) || 1,
        unitPriceHT: Number(item.unitPriceHT) || 0,
        totalHT: Number(item.totalHT) || (Number(item.quantity) * Number(item.unitPriceHT)),
        totalTTC: Number(item.totalTTC) || (Number(item.quantity) * Number(item.unitPriceHT) * (1 + taxRate / 100))
      }));
    } else {
      // Fallback pour compatibilité
      items = [{
        description: data.description || "Prestation",
        quantity: 1,
        unitPriceHT: subtotal,
        totalHT: subtotal,
        totalTTC: amount
      }];
    }
    
    const invoice = this.invoiceRepository.create({
      userId,
      reference: data.reference || `FACT-${Date.now()}`,
      operationNumber: operationNumber,
      type: data.type || 'debit',
      clientName: data.type === 'debit' ? (data.clientName || data.partyName || "") : null,
      supplierName: data.type === 'credit' ? (data.supplierName || data.partyName || "") : null,
      description: data.description || null,
      subtotal: subtotal,
      amount: amount,
      taxRate: taxRate,
      taxAmount: taxAmount,
      status: data.status || "pending",
      dueDate: dueDate,
      items: items // ⭐ Sauvegarde des items
    });
    
    return this.invoiceRepository.save(invoice);
  }

  async importInvoices(userId: number, invoicesData: any[]) {
    let success = 0;
    let errors = 0;

    for (const invoiceData of invoicesData) {
      try {
        const subtotal = Math.max(0, Number(invoiceData.amount) || Number(invoiceData.subtotal) || 0);
        const taxRate = Math.max(0, Math.min(100, Number(invoiceData.taxRate) || 20));
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const operationNumber = `INV-${year}${month}-${random}`;
        
        let dueDate = null;
        if (invoiceData.dueDate && invoiceData.dueDate !== "") {
          const parsedDate = new Date(invoiceData.dueDate);
          if (!isNaN(parsedDate.getTime())) {
            dueDate = parsedDate;
          }
        }
        
        // ⭐ Traitement des items pour l'import
        let items = [];
        if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
          items = invoiceData.items.map(item => ({
            description: item.description || "",
            quantity: Number(item.quantity) || 1,
            unitPriceHT: Number(item.unitPriceHT) || 0,
            totalHT: Number(item.totalHT) || (Number(item.quantity) * Number(item.unitPriceHT)),
            totalTTC: Number(item.totalTTC) || (Number(item.quantity) * Number(item.unitPriceHT) * (1 + taxRate / 100))
          }));
        } else {
          items = [{
            description: invoiceData.description || "Prestation",
            quantity: 1,
            unitPriceHT: subtotal,
            totalHT: subtotal,
            totalTTC: total
          }];
        }
        
        const invoice = this.invoiceRepository.create({
          userId: userId,
          reference: invoiceData.reference || `FACT-${Date.now()}-${success}`,
          operationNumber: invoiceData.operationNumber || operationNumber,
          type: invoiceData.type || "debit",
          clientName: invoiceData.type === "debit" ? (invoiceData.clientName || invoiceData.partyName || "") : null,
          supplierName: invoiceData.type === "credit" ? (invoiceData.supplierName || invoiceData.partyName || "") : null,
          description: invoiceData.description || "",
          subtotal: subtotal,
          amount: total,
          taxRate: taxRate,
          taxAmount: taxAmount,
          status: invoiceData.status || "pending",
          dueDate: dueDate,
          items: items
        });
        
        await this.invoiceRepository.save(invoice);
        success++;
      } catch (error) {
        errors++;
        console.error('Erreur import facture:', error.message);
      }
    }
    
    console.log(`✅ Import terminé: ${success} succès, ${errors} erreurs`);
    return { success, errors, total: invoicesData.length };
  }

  async update(id: number, userId: number, data: any) {
    const invoice = await this.findOne(id, userId);
    
    if (data.reference !== undefined) invoice.reference = data.reference;
    if (data.operationNumber !== undefined) invoice.operationNumber = data.operationNumber;
    if (data.type !== undefined) invoice.type = data.type;
    
    if (data.type === 'debit') {
      invoice.clientName = data.clientName || "";
      invoice.supplierName = null;
    } else if (data.type === 'credit') {
      invoice.supplierName = data.supplierName || "";
      invoice.clientName = null;
    }
    
    if (data.description !== undefined) invoice.description = data.description;
    
    if (data.subtotal !== undefined) {
      invoice.subtotal = Math.max(0, Number(data.subtotal));
    }
    if (data.taxRate !== undefined) {
      invoice.taxRate = Math.max(0, Math.min(100, Number(data.taxRate)));
    }
    if (data.status !== undefined) invoice.status = data.status;
    
    // ⭐ Mise à jour des items
    if (data.items !== undefined && Array.isArray(data.items)) {
      const taxRate = invoice.taxRate;
      invoice.items = data.items.map(item => ({
        description: item.description || "",
        quantity: Number(item.quantity) || 1,
        unitPriceHT: Number(item.unitPriceHT) || 0,
        totalHT: Number(item.totalHT) || (Number(item.quantity) * Number(item.unitPriceHT)),
        totalTTC: Number(item.totalTTC) || (Number(item.quantity) * Number(item.unitPriceHT) * (1 + taxRate / 100))
      }));
    }
    
    // Recalculer automatiquement
    invoice.taxAmount = (invoice.subtotal * invoice.taxRate) / 100;
    invoice.amount = invoice.subtotal + invoice.taxAmount;
    
    if (data.dueDate !== undefined) {
      if (data.dueDate && data.dueDate !== "" && data.dueDate !== "undefined" && data.dueDate !== "null") {
        const parsedDate = new Date(data.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          invoice.dueDate = parsedDate;
        } else {
          invoice.dueDate = null;
        }
      } else {
        invoice.dueDate = null;
      }
    }
    
    return this.invoiceRepository.save(invoice);
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

  async updateStatus(id: number, userId: number, status: string) {
    const invoice = await this.findOne(id, userId);
    invoice.status = status;
    return this.invoiceRepository.save(invoice);
  }

  async delete(id: number, userId: number) {
    const invoice = await this.findOne(id, userId);
    await this.invoiceRepository.delete(id);
    return { success: true };
  }

  async deleteByOperationNumber(operationNumber: string, userId: number) {
    const invoice = await this.findByOperationNumber(operationNumber, userId);
    await this.invoiceRepository.delete(invoice.id);
    return { success: true };
  }

  async getStats(userId: number) {
    const invoices = await this.invoiceRepository.find({ where: { userId } });
    const total = invoices.length;
    const paid = invoices.filter(i => i.status === 'paid').length;
    const pending = invoices.filter(i => i.status !== 'paid').length;
    const totalAmount = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalTax = invoices.reduce((sum, i) => sum + (Number(i.taxAmount) || 0), 0);
    const debitTotal = invoices.filter(i => i.type === 'debit').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const creditTotal = invoices.filter(i => i.type === 'credit').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    
    return { 
      total, paid, pending, 
      totalAmount, paidAmount, pendingAmount: totalAmount - paidAmount,
      totalTax, debitTotal, creditTotal
    };
  }
}