export declare class Shipment {
    id: number;
    clientId: number;
    transporteurId: number;
    trackingNumber: string;
    clientName: string;
    address: string;
    phone: string;
    carrier: string;
    amount: number;
    status: string;
    estimatedDelivery: Date;
    createdAt: Date;
    updatedAt: Date;
}
