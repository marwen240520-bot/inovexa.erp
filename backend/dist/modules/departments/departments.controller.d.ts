import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    findAll(req: any): Promise<import("./entities/department.entity").Department[]>;
    create(req: any, body: any): Promise<import("./entities/department.entity").Department[]>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
