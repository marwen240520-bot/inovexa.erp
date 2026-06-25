"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("./entities/employee.entity");
let EmployeesService = class EmployeesService {
    constructor(employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    async findAll(userId) {
        return this.employeeRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, userId) {
        const employee = await this.employeeRepository.findOne({ where: { id, userId } });
        if (!employee)
            throw new common_1.NotFoundException('Employé non trouvé');
        return employee;
    }
    async create(userId, data) {
        const employee = this.employeeRepository.create({
            ...data,
            userId,
            hireDate: data.hireDate ? new Date(data.hireDate) : null
        });
        return this.employeeRepository.save(employee);
    }
    async update(id, userId, data) {
        const employee = await this.findOne(id, userId);
        if (data.hireDate)
            data.hireDate = new Date(data.hireDate);
        Object.assign(employee, data);
        return this.employeeRepository.save(employee);
    }
    async updateStatus(id, userId, status) {
        const employee = await this.findOne(id, userId);
        employee.status = status;
        return this.employeeRepository.save(employee);
    }
    async delete(id, userId) {
        const employee = await this.findOne(id, userId);
        await this.employeeRepository.delete(id);
        return { success: true };
    }
    async getStats(userId) {
        const employees = await this.findAll(userId);
        const total = employees.length;
        const active = employees.filter(e => e.status === 'active').length;
        const onLeave = employees.filter(e => e.status === 'leave').length;
        const inactive = employees.filter(e => e.status === 'inactive').length;
        const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
        const avgSalary = total > 0 ? totalPayroll / total : 0;
        return { total, active, onLeave, inactive, totalPayroll, avgSalary };
    }
    async importEmployees(userId, employees) {
        let success = 0;
        let errors = 0;
        for (const emp of employees) {
            try {
                const newEmployee = this.employeeRepository.create({
                    ...emp,
                    userId,
                    hireDate: emp.hireDate ? new Date(emp.hireDate) : null
                });
                await this.employeeRepository.save(newEmployee);
                success++;
            }
            catch (e) {
                errors++;
            }
        }
        return { success, errors, message: `${success} employé(s) importé(s), ${errors} erreur(s)` };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map