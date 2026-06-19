import { Repository } from 'typeorm';
import { Product } from './product.entity';
export declare class ProductsService {
    private productRepository;
    constructor(productRepository: Repository<Product>);
    findAll(userId: number): Promise<Product[]>;
    search(userId: number, searchTerm: string): Promise<Product[]>;
    findOne(id: number, userId: number): Promise<Product>;
    create(userId: number, data: Partial<Product>): Promise<Product>;
    update(id: number, userId: number, data: Partial<Product>): Promise<Product>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getStats(userId: number): Promise<{
        total: number;
        totalValue: number;
        lowStock: number;
        outOfStock: number;
    }>;
}
