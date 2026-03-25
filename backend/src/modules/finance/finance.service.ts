import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async findAllInvoices(): Promise<Invoice[]> {
    return this.invoiceRepository.find({ relations: ['customer'] });
  }

  async findInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id }, relations: ['customer'] });
    if (!invoice) throw new NotFoundException('Facture non trouvée');
    return invoice;
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(data);
    return this.invoiceRepository.save(invoice);
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    await this.findInvoiceById(id);
    await this.invoiceRepository.update(id, data);
    return this.findInvoiceById(id);
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.findInvoiceById(id);
    await this.invoiceRepository.remove(invoice);
  }

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(data);
    await this.paymentRepository.save(payment);
    
    if (data.invoice_id) {
      const invoice = await this.invoiceRepository.findOne({ where: { id: data.invoice_id } });
      if (invoice) {
        const payments = await this.paymentRepository.find({ where: { invoice_id: data.invoice_id } });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= invoice.total) {
          invoice.status = 'paid';
          await this.invoiceRepository.save(invoice);
        }
      }
    }
    return payment;
  }

  async getDashboardStats(): Promise<any> {
    const totalInvoices = await this.invoiceRepository.count();
    const paidInvoices = await this.invoiceRepository.count({ where: { status: 'paid' } });
    const totalRevenue = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total)', 'total')
      .where('invoice.status = :status', { status: 'paid' })
      .getRawOne();
    
    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices: totalInvoices - paidInvoices,
      totalRevenue: totalRevenue?.total || 0,
    };
  }
}
