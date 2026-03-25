import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  async findAllShipments(): Promise<Shipment[]> {
    return this.shipmentRepository.find();
  }

  async createShipment(data: Partial<Shipment>): Promise<Shipment> {
    const shipment = this.shipmentRepository.create(data);
    return this.shipmentRepository.save(shipment);
  }

  async updateShipment(id: string, data: Partial<Shipment>): Promise<Shipment | null> {
    await this.shipmentRepository.update(id, data);
    return this.shipmentRepository.findOne({ where: { id } });
  }

  async deleteShipment(id: string): Promise<void> {
    await this.shipmentRepository.delete(id);
  }
}
