export declare class Invoice {
    id: number;
    userId: number;
    operationNumber: string;
    reference: string;
    type: string;
    clientId: number | null;
    supplierId: number | null;
    clientName: string;
    supplierName: string;
    clientEmail: string;
    clientAddress: string;
    clientPhone: string;
    clientSiret: string;
    description: string;
    items: any[];
    subtotalHT: number;
    amount: number;
    taxRate: number;
    taxAmount: number;
    dueDate: Date | null;
    paymentTerms: string;
    notes: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
