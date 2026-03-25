import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityControl } from './entities/quality-control.entity';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityControl)
    private qualityRepository: Repository<QualityControl>,
  ) {}

  async findAll(): Promise<QualityControl[]> {
    return this.qualityRepository.find();
  }

  async findById(id: string): Promise<QualityControl | null> {
    return this.qualityRepository.findOne({ where: { id } });
  }

  async findByWorkOrder(workOrderId: string): Promise<QualityControl[]> {
    return this.qualityRepository.find({ where: { work_order_id: workOrderId } });
  }

  async create(data: Partial<QualityControl>): Promise<QualityControl> {
    const quality = this.qualityRepository.create(data);
    return this.qualityRepository.save(quality);
  }

  async update(id: string, data: Partial<QualityControl>): Promise<QualityControl | null> {
    await this.qualityRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.qualityRepository.delete(id);
  }
}
