import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payroll } from './payroll.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
  ) {}

  async findAll(): Promise<Payroll[]> {
    return this.payrollRepository.find();
  }

  async findByEmployee(employeeId: string): Promise<Payroll[]> {
    return this.payrollRepository.find({ where: { employeeId }, order: { year: 'DESC', month: 'DESC' } });
  }

  async create(data: Partial<Payroll>): Promise<Payroll> {
    const payroll = this.payrollRepository.create(data);
    return this.payrollRepository.save(payroll);
  }

  async delete(id: string): Promise<void> {
    await this.payrollRepository.delete(id);
  }

  async generate(employeeId: string, employeeName: string, grossSalary: number, month: string, year: number): Promise<Payroll> {
    const taxes = grossSalary * 0.23;
    const netSalary = grossSalary - taxes;
    return this.create({ employeeId, employeeName, month, year, grossSalary, netSalary, taxes });
  }
}
