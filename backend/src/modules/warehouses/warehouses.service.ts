import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private repository: Repository<Warehouse>,
  ) {}
  async findAll() { return this.repository.find(); }
  async create(data: any) { return this.repository.save(this.repository.create(data)); }
}
