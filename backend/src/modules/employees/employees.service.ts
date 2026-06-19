import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async findAll(userId: number) {
    return this.employeeRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const employee = await this.employeeRepository.findOne({ where: { id, userId } });
    if (!employee) throw new NotFoundException('Employé non trouvé');
    return employee;
  }

  async create(userId: number, data: any) {
    const employee = this.employeeRepository.create({
      ...data,
      userId,
      hireDate: data.hireDate ? new Date(data.hireDate) : null
    });
    return this.employeeRepository.save(employee);
  }

  async update(id: number, userId: number, data: any) {
    const employee = await this.findOne(id, userId);
    if (data.hireDate) data.hireDate = new Date(data.hireDate);
    Object.assign(employee, data);
    return this.employeeRepository.save(employee);
  }

  async updateStatus(id: number, userId: number, status: string) {
    const employee = await this.findOne(id, userId);
    employee.status = status;
    return this.employeeRepository.save(employee);
  }

  async delete(id: number, userId: number) {
    const employee = await this.findOne(id, userId);
    await this.employeeRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const employees = await this.findAll(userId);
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const onLeave = employees.filter(e => e.status === 'leave').length;
    const inactive = employees.filter(e => e.status === 'inactive').length;
    const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const avgSalary = total > 0 ? totalPayroll / total : 0;
    
    return { total, active, onLeave, inactive, totalPayroll, avgSalary };
  }

  async importEmployees(userId: number, employees: any[]) {
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
      } catch(e) {
        errors++;
      }
    }
    
    return { success, errors, message: `${success} employé(s) importé(s), ${errors} erreur(s)` };
  }
}
