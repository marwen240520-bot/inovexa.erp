import { User } from '../users/entities/user.entity';
import { Category } from '../categories/category.entity';
export declare class Product {
    id: number;
    userId: number;
    categoryId: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    category: Category;
}
