import { Product } from '../../products/product.entity';
export declare class Purchase {
    id: number;
    userId: number;
    productId: number;
    productName: string;
    supplierName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    status: string;
    paymentMethod: string | null;
    createdAt: Date;
    product: Product;
}
