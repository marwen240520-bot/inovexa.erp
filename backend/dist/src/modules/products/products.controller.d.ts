import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(req: any): Promise<import("./product.entity").Product[]>;
    importProducts(req: any, body: {
        products: any[];
    }): Promise<{
        success: number;
        errors: number;
        total: number;
        errorDetails: any[];
        message: string;
    }>;
    findOne(id: string, req: any): Promise<import("./product.entity").Product>;
    create(req: any, body: any): Promise<import("./product.entity").Product>;
    update(id: string, req: any, body: any): Promise<import("./product.entity").Product>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
