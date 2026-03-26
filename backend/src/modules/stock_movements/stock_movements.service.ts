import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './stock_movement.entity';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private repository: Repository<StockMovement>,
  ) {}
  async findAll() { return this.repository.find(); }
  async create(data: any) { return this.repository.save(this.repository.create(data)); }
}
