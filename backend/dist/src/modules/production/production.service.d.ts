import { Repository } from 'typeorm';
import { ProductionOrder } from './entities/production-order.entity';
export declare class ProductionService {
    private productionRepository;
    constructor(productionRepository: Repository<ProductionOrder>);
    findAll(userId: number): Promise<ProductionOrder[]>;
    findOne(id: number, userId: number): Promise<ProductionOrder>;
    create(userId: number, data: any): Promise<ProductionOrder[]>;
    update(id: number, userId: number, data: any): Promise<ProductionOrder>;
    updateStatus(id: number, userId: number, status: string): Promise<ProductionOrder>;
    updateProgress(id: number, userId: number, progress: number): Promise<ProductionOrder>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
}
