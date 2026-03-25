import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Leave } from './entities/leave.entity';
import { Payroll } from './entities/payroll.entity';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
  ) {}

  async findAllEmployees(): Promise<Employee[]> {
    return this.employeeRepository.find();
  }

  async findEmployeeById(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Employé non trouvé');
    return employee;
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const employee = this.employeeRepository.create(data);
    return this.employeeRepository.save(employee);
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    await this.findEmployeeById(id);
    await this.employeeRepository.update(id, data);
    return this.findEmployeeById(id);
  }

  async deleteEmployee(id: string): Promise<void> {
    const employee = await this.findEmployeeById(id);
    await this.employeeRepository.remove(employee);
  }

  async createLeaveRequest(data: Partial<Leave>): Promise<Leave> {
    const leave = this.leaveRepository.create(data);
    return this.leaveRepository.save(leave);
  }

  async getHrStats(): Promise<any> {
    const totalEmployees = await this.employeeRepository.count();
    const pendingLeaves = await this.leaveRepository.count({ where: { status: 'pending' } });
    const currentMonthPayroll = await this.payrollRepository
      .createQueryBuilder('payroll')
      .select('SUM(payroll.net_salary)', 'total')
      .where('EXTRACT(MONTH FROM payroll.month) = EXTRACT(MONTH FROM CURRENT_DATE)')
      .getRawOne();
    
    return {
      totalEmployees,
      pendingLeaves,
      currentMonthPayroll: currentMonthPayroll?.total || 0,
    };
  }
}
