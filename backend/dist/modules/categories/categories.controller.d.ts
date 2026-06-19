import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(req: any): Promise<import("./entities/category.entity").Category[]>;
    findOne(id: string, req: any): Promise<import("./entities/category.entity").Category>;
    create(req: any, body: any): Promise<import("./entities/category.entity").Category>;
    update(id: string, req: any, body: any): Promise<import("./entities/category.entity").Category>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
