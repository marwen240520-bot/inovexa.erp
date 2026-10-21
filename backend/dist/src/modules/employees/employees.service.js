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
const import_utils_1 = require("../../common/import-utils");
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
    async importEmployees(userId, rows) {
        if (!Array.isArray(rows) || rows.length === 0)
            throw new common_1.BadRequestException('Aucun employé à importer');
        const details = [];
        let success = 0;
        let processed = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if ((0, import_utils_1.isEmptyRow)(row))
                continue;
            processed++;
            try {
                let name = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['name', 'nom complet', 'full name', 'fullname', 'employe', 'employee', 'nom et prenom']));
                if (!name) {
                    const first = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['prenom', 'firstname', 'first name']));
                    const last = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['nom', 'lastname', 'last name', 'nom de famille']));
                    name = [first, last].filter(Boolean).join(' ') || null;
                }
                if (!name)
                    throw new Error(`Nom de l'employé manquant (colonnes reçues : ${Object.keys(row).join(', ')})`);
                const hire = (0, import_utils_1.toDate)((0, import_utils_1.pick)(row, ['hireDate', 'hire date', 'date embauche', "date d'embauche", 'embauche', 'date']));
                const now = new Date().toISOString();
                const entity = this.employeeRepository.create({
                    userId,
                    name,
                    email: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['email', 'e-mail', 'mail', 'courriel'])) || '',
                    position: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['position', 'poste', 'fonction', 'job title', 'titre'])) || undefined,
                    department: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['department', 'departement', 'service'])) || undefined,
                    salary: (0, import_utils_1.toNumber)((0, import_utils_1.pick)(row, ['salary', 'salaire', 'salaire brut', 'remuneration'])),
                    phone: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['phone', 'telephone', 'tel', 'mobile', 'gsm'])) || undefined,
                    hireDate: hire ? hire.toISOString().slice(0, 10) : undefined,
                    status: (0, import_utils_1.normalizeStatus)((0, import_utils_1.pick)(row, ['status', 'statut', 'etat']), { active: ['actif', 'active'], inactive: ['inactif', 'inactive'], on_leave: ['conge', 'en conge', 'on leave', 'leave', 'on_leave'] }, 'active'),
                    createdAt: now,
                    updatedAt: now,
                });
                await this.employeeRepository.save(entity);
                success++;
            }
            catch (e) {
                details.push({ row: i + 2, error: (0, import_utils_1.errorMessage)(e) });
            }
        }
        return (0, import_utils_1.buildImportResult)('employé(s)', processed, success, details);
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map