import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../order_items/order_item.entity';
import { Product } from '../products/product.entity';
import { Invoice } from '../invoices/invoice.entity';
import { StockMovement } from '../stock_movements/stock_movement.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class BusinessLogicService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async processSale(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new Error('Commande non trouvée');
    
    const items = await this.orderItemRepository.find({ where: { orderId } });
    
    for (const item of items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (product) {
        product.quantity -= item.quantity;
        await this.productRepository.save(product);
        
        await this.stockMovementRepository.save({
          productId: product.id,
          productName: product.name,
          type: 'out',
          quantity: item.quantity,
          reason: `Vente - Commande ${orderId}`,
          reference: orderId
        });
        
        if (product.quantity < 10) {
          this.notificationsGateway.sendToAll({
            type: 'low_stock',
            productId: product.id,
            productName: product.name,
            quantity: product.quantity,
            message: `⚠️ Stock bas: ${product.name} (${product.quantity} unités)`
          });
        }
      }
    }
    
    order.status = 'completed';
    await this.orderRepository.save(order);
    
    const invoice = this.invoiceRepository.create({
      customerId: order.customerId,
      customerName: order.customerName,
      amountHT: order.total,
      tva: order.total * 0.2,
      amountTTC: order.total * 1.2,
      status: 'pending'
    });
    await this.invoiceRepository.save(invoice);
  }

  async calculateProfitLoss(startDate: Date, endDate: Date): Promise<any> {
    const invoices = await this.invoiceRepository.find({
      where: { status: 'paid', createdAt: Between(startDate, endDate) }
    });
    
    const totalRevenue = invoices.reduce((s, i) => s + (i.amountTTC || 0), 0);
    
    return {
      totalRevenue,
      profit: totalRevenue,
      profitMargin: 100
    };
  }
}
