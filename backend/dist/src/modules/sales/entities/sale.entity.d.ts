export declare class Sale {
    id: number;
    userId: number;
    productId: number;
    clientName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    status: string;
    paymentMethod: string | null;
    createdAt: Date;
    updatedAt: Date;
}
