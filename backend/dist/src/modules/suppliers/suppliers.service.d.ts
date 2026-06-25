import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
export declare class SuppliersService {
    private supplierRepository;
    constructor(supplierRepository: Repository<Supplier>);
    findAll(userId: number): Promise<Supplier[]>;
    findOne(id: number, userId: number): Promise<Supplier>;
    create(userId: number, data: Partial<Supplier>): Promise<Supplier>;
    update(id: number, userId: number, data: Partial<Supplier>): Promise<Supplier>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getStats(userId: number): Promise<{
        total: number;
        active: number;
        totalPurchases: number;
    }>;
}
