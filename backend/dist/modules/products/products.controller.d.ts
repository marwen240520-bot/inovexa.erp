import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(req: any, search?: string): Promise<import("./product.entity").Product[]>;
    getStats(req: any): Promise<{
        total: number;
        totalValue: number;
        lowStock: number;
        outOfStock: number;
    }>;
    findOne(id: string, req: any): Promise<import("./product.entity").Product>;
    create(req: any, body: any): Promise<import("./product.entity").Product>;
    update(id: string, req: any, body: any): Promise<import("./product.entity").Product>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
