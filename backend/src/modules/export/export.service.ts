import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Product } from '../products/product.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Employee } from '../employees/employee.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async exportToExcel(type: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    let data = [];
    let headers = [];

    switch (type) {
      case 'products':
        data = await this.productRepository.find();
        headers = ['ID', 'Nom', 'SKU', 'Prix', 'Quantité'];
        worksheet.columns = headers.map(h => ({ header: h, key: h.toLowerCase().replace(/ /g, '_'), width: 20 }));
        data.forEach(p => {
          worksheet.addRow({
            id: p.id,
            nom: p.name,
            sku: p.sku,
            prix: p.price,
            quantité: p.quantity
          });
        });
        break;
      case 'invoices':
        data = await this.invoiceRepository.find();
        headers = ['ID', 'Client', 'Montant HT', 'TVA', 'Montant TTC', 'Statut', 'Date'];
        worksheet.columns = headers.map(h => ({ header: h, key: h.toLowerCase().replace(/ /g, '_'), width: 15 }));
        data.forEach(i => {
          worksheet.addRow({
            id: i.id,
            client: i.customerName,
            montant_ht: i.amountHT,
            tva: i.tva,
            montant_ttc: i.amountTTC,
            statut: i.status,
            date: i.createdAt?.toISOString().split('T')[0]
          });
        });
        break;
      case 'employees':
        data = await this.employeeRepository.find();
        headers = ['ID', 'Prénom', 'Nom', 'Email', 'Poste', 'Salaire'];
        worksheet.columns = headers.map(h => ({ header: h, key: h.toLowerCase().replace(/ /g, '_'), width: 20 }));
        data.forEach(e => {
          worksheet.addRow({
            id: e.id,
            prénom: e.firstName,
            nom: e.lastName,
            email: e.email,
            poste: e.position,
            salaire: e.salary
          });
        });
        break;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportToPDF(type: string): Promise<Buffer> {
    return new Promise(async (resolve) => {
      const PDFDocumentModule = require('pdfkit');
      const doc = new PDFDocumentModule({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      doc.fontSize(20).text(`Rapport ${type}`, { align: 'center' });
      doc.moveDown();
      
      let data = [];
      switch (type) {
        case 'products':
          data = await this.productRepository.find();
          doc.fontSize(12).text(`Total produits: ${data.length}`);
          doc.moveDown();
          data.slice(0, 20).forEach(p => {
            doc.fontSize(10).text(`- ${p.name} (${p.sku}) : ${p.price}€ - Stock: ${p.quantity}`);
          });
          break;
        case 'invoices':
          data = await this.invoiceRepository.find();
          const total = data.reduce((s, i) => s + (i.amountTTC || 0), 0);
          doc.fontSize(12).text(`Total factures: ${data.length}`);
          doc.text(`Montant total TTC: ${total}€`);
          doc.moveDown();
          data.slice(0, 20).forEach(i => {
            doc.fontSize(10).text(`- ${i.customerName} : ${i.amountTTC}€ (${i.status})`);
          });
          break;
        case 'employees':
          data = await this.employeeRepository.find();
          const totalSalary = data.reduce((s, e) => s + (e.salary || 0), 0);
          doc.fontSize(12).text(`Total employés: ${data.length}`);
          doc.text(`Masse salariale: ${totalSalary}€`);
          doc.moveDown();
          data.forEach(e => {
            doc.fontSize(10).text(`- ${e.firstName} ${e.lastName} (${e.position}) : ${e.salary}€`);
          });
          break;
      }
      
      doc.end();
    });
  }
}
