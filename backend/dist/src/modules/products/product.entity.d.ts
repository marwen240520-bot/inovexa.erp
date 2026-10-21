import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
export declare class Product {
    id: number;
    userId: number;
    categoryId: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    category: Category;
}
