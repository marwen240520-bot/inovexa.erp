import { Repository } from 'typeorm';
import { Product } from './product.entity';
export declare class ProductsService {
    private productRepository;
    constructor(productRepository: Repository<Product>);
    findAll(userId: number): Promise<Product[]>;
    findOne(id: number, userId: number): Promise<Product>;
    create(userId: number, data: any): Promise<Product>;
    update(id: number, userId: number, data: any): Promise<Product>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
}
