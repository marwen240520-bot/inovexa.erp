import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
export declare class DepartmentsService {
    private departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    findAll(userId: number): Promise<Department[]>;
    create(userId: number, data: any): Promise<Department[]>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
}
