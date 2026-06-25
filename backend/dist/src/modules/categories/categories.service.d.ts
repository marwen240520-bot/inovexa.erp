import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
export declare class CategoriesService {
    private categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    findAll(userId: number): Promise<Category[]>;
    findOne(id: number, userId: number): Promise<Category>;
    findByName(name: string, userId: number): Promise<Category>;
    create(userId: number, data: Partial<Category>): Promise<Category>;
    update(id: number, userId: number, data: Partial<Category>): Promise<Category>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getStats(userId: number): Promise<{
        total: number;
        items: Category[];
    }>;
}
