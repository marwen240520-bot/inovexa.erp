import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    findAll(req: any, period?: string): Promise<import("./entities/purchase.entity").Purchase[]>;
    findOne(id: string, req: any): Promise<import("./entities/purchase.entity").Purchase>;
    create(req: any, body: any): Promise<import("./entities/purchase.entity").Purchase[]>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
