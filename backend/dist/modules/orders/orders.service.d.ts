import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
export declare class OrdersService {
    private orderRepository;
    constructor(orderRepository: Repository<Order>);
    findAll(userId: number, period?: string): Promise<Order[]>;
    findOne(id: number, userId: number): Promise<Order>;
    create(userId: number, data: Partial<Order>): Promise<Order>;
    update(id: number, userId: number, data: Partial<Order>): Promise<Order>;
    updateStatus(id: number, userId: number, status: string): Promise<Order>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getStats(userId: number): Promise<{
        total: number;
        pending: number;
        processing: number;
        delivered: number;
        cancelled: number;
        totalAmount: number;
    }>;
}
