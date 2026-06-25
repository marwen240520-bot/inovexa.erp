export declare class User {
    id: number;
    email: string;
    password: string;
    name: string;
    companyName: string;
    phone: string;
    role: string;
    modules: Record<string, boolean>;
    subscriptionStart: Date;
    subscriptionEnd: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
