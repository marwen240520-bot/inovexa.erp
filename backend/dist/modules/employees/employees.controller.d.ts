import { EmployeesService } from './employees.service';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    findAll(req: any): Promise<import("./entities/employee.entity").Employee[]>;
    getStats(req: any): Promise<{
        total: number;
        active: number;
        onLeave: number;
        inactive: number;
        totalPayroll: number;
        avgSalary: number;
    }>;
    findOne(id: string, req: any): Promise<import("./entities/employee.entity").Employee>;
    create(req: any, body: any): Promise<import("./entities/employee.entity").Employee[]>;
    update(id: string, req: any, body: any): Promise<import("./entities/employee.entity").Employee>;
    updateStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("./entities/employee.entity").Employee>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
    importEmployees(req: any, body: {
        employees: any[];
    }): Promise<{
        success: number;
        errors: number;
        message: string;
    }>;
}
