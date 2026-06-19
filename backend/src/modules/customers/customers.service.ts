import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersModuleEntity } from './entities/customers.entity';
import { CreateCustomersModuleDto } from './dto/create-customers.dto';
import { UpdateCustomersModuleDto } from './dto/update-customers.dto';

@Injectable()
export class CustomersModuleService {
  constructor(
    @InjectRepository(CustomersModuleEntity)
    private customersRepository: Repository<CustomersModuleEntity>,
  ) {}

  async findAll(): Promise<CustomersModuleEntity[]> {
    return this.customersRepository.find();
  }

  async findOne(id: string): Promise<CustomersModuleEntity> {
    const item = await this.customersRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  async create(createDto: CreateCustomersModuleDto): Promise<CustomersModuleEntity> {
    const item = this.customersRepository.create(createDto);
    return this.customersRepository.save(item);
  }

  async update(id: string, updateDto: UpdateCustomersModuleDto): Promise<CustomersModuleEntity> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.customersRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.customersRepository.remove(item);
  }
}
