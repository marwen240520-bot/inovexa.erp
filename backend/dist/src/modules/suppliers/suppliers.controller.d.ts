import { SuppliersService } from './suppliers.service';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    findAll(req: any): Promise<{
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
    getStats(req: any): Promise<{
        total: number;
        active: number;
        totalPurchases: number;
    }>;
    findOne(id: string, req: any): Promise<import("./supplier.entity").Supplier>;
    create(req: any, body: any): Promise<import("./supplier.entity").Supplier>;
    update(id: string, req: any, body: any): Promise<import("./supplier.entity").Supplier>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
