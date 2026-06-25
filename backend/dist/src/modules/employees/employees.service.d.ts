import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
export declare class EmployeesService {
    private employeeRepository;
    constructor(employeeRepository: Repository<Employee>);
    findAll(userId: number): Promise<Employee[]>;
    findOne(id: number, userId: number): Promise<Employee>;
    create(userId: number, data: any): Promise<Employee[]>;
    update(id: number, userId: number, data: any): Promise<Employee>;
    updateStatus(id: number, userId: number, status: string): Promise<Employee>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getStats(userId: number): Promise<{
        total: number;
        active: number;
        onLeave: number;
        inactive: number;
        totalPayroll: number;
        avgSalary: number;
    }>;
    importEmployees(userId: number, employees: any[]): Promise<{
        success: number;
        errors: number;
        message: string;
    }>;
}
