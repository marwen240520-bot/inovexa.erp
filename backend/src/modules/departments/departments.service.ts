import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async findAll(userId: number) {
    return this.departmentRepository.find({ where: { userId } });
  }

  async create(userId: number, data: any) {
    const department = this.departmentRepository.create({ ...data, userId });
    return this.departmentRepository.save(department);
  }

  async delete(id: number, userId: number) {
    const department = await this.departmentRepository.findOne({ where: { id, userId } });
    if (!department) throw new NotFoundException('Département non trouvé');
    await this.departmentRepository.delete(id);
    return { success: true };
  }
}
