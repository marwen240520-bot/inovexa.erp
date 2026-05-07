import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async findAll(userId: number) {
    return this.employeeRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
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
      hireDate: data.hireDate ? new Date(data.hireDate) : null,
      status: data.status || 'active'
    });
    return this.employeeRepository.save(employee);
  }

  // ⭐ NOUVELLE METHODE: IMPORT MULTIPLE
  async importEmployees(userId: number, employeesData: any[]) {
    let success = 0;
    let errors = 0;

    for (const empData of employeesData) {
      try {
        const employee = this.employeeRepository.create({
          userId: userId,
          name: empData.name || empData.employeeName || "Employé inconnu",
          email: empData.email || "",
          position: empData.position || "",
          department: empData.department || "",
          salary: parseFloat(empData.salary) || 0,
          phone: empData.phone || "",
          hireDate: empData.hireDate ? new Date(empData.hireDate) : null,
          status: empData.status || "active"
        });
        
        await this.employeeRepository.save(employee);
        success++;
      } catch (error) {
        errors++;
        console.error('Erreur import employé:', error.message);
      }
    }
    
    console.log(`✅ Import terminé: ${success} succès, ${errors} erreurs`);
    return { success, errors, total: employeesData.length };
  }

  async update(id: number, userId: number, data: any) {
    const employee = await this.findOne(id, userId);
    Object.assign(employee, {
      ...data,
      hireDate: data.hireDate ? new Date(data.hireDate) : employee.hireDate
    });
    return this.employeeRepository.save(employee);
  }

  async delete(id: number, userId: number) {
    const employee = await this.findOne(id, userId);
    await this.employeeRepository.delete(id);
    return { success: true };
  }
}