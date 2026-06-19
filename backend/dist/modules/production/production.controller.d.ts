import { ProductionService } from './production.service';
export declare class ProductionController {
    private readonly productionService;
    constructor(productionService: ProductionService);
    findAll(req: any): Promise<import("./entities/production-order.entity").ProductionOrder[]>;
    findOne(id: string, req: any): Promise<import("./entities/production-order.entity").ProductionOrder>;
    create(req: any, body: any): Promise<import("./entities/production-order.entity").ProductionOrder[]>;
    update(id: string, req: any, body: any): Promise<import("./entities/production-order.entity").ProductionOrder>;
    updateStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("./entities/production-order.entity").ProductionOrder>;
    updateProgress(id: string, req: any, body: {
        progress: number;
    }): Promise<import("./entities/production-order.entity").ProductionOrder>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
