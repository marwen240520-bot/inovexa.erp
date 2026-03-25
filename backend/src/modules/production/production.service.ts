import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BOM } from './entities/bom.entity';
import { WorkOrder } from './entities/work-order.entity';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(BOM)
    private bomRepository: Repository<BOM>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
  ) {}

  async findAllBOM(): Promise<BOM[]> {
    return this.bomRepository.find();
  }

  async createBOM(data: Partial<BOM>): Promise<BOM> {
    const bom = this.bomRepository.create(data);
    return this.bomRepository.save(bom);
  }

  async findAllWorkOrders(): Promise<WorkOrder[]> {
    return this.workOrderRepository.find();
  }

  async createWorkOrder(data: Partial<WorkOrder>): Promise<WorkOrder> {
    const order = this.workOrderRepository.create(data);
    return this.workOrderRepository.save(order);
  }

  async updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder | null> {
    await this.workOrderRepository.update(id, data);
    return this.workOrderRepository.findOne({ where: { id } });
  }

  async deleteWorkOrder(id: string): Promise<void> {
    await this.workOrderRepository.delete(id);
  }
}
