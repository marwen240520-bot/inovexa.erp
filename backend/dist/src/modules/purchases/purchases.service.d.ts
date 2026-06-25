import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { Product } from '../products/product.entity';
export declare class PurchasesService {
    private purchaseRepository;
    private productRepository;
    constructor(purchaseRepository: Repository<Purchase>, productRepository: Repository<Product>);
    findAll(userId: number, period?: string): Promise<Purchase[]>;
    findOne(id: number, userId: number): Promise<Purchase>;
    create(userId: number, data: any): Promise<Purchase[]>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
}
