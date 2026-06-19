import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findAll(req: any, period?: string): Promise<import("./entities/order.entity").Order[]>;
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        processing: number;
        delivered: number;
        cancelled: number;
        totalAmount: number;
    }>;
    findOne(id: string, req: any): Promise<import("./entities/order.entity").Order>;
    create(req: any, body: any): Promise<import("./entities/order.entity").Order>;
    update(id: string, req: any, body: any): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("./entities/order.entity").Order>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
