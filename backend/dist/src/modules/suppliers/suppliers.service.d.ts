import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
export declare class SuppliersService {
    private supplierRepository;
    constructor(supplierRepository: Repository<Supplier>);
    private getPurchaseTotalsBySupplierName;
    findAll(userId: number): Promise<{
        totalPurchases: number;
        id: number;
        userId: number;
        name: string;
        contact: string;
        email: string;
        phone: string;
        address: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
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
