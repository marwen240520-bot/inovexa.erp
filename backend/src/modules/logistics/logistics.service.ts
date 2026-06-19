import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  async findAllByClient(clientId: number) {
    return this.shipmentRepository.find({ 
      where: { clientId: clientId },
      order: { createdAt: 'DESC' }
    });
  }

  async findAllByTransporteur(transporteurId: number) {
    return this.shipmentRepository.find({ 
      where: { transporteurId: transporteurId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, clientId: number) {
    const shipment = await this.shipmentRepository.findOne({ where: { id: id, clientId: clientId } });
    if (!shipment) throw new NotFoundException('Expédition non trouvée');
    return shipment;
  }

  async create(clientId: number, data: any) {
    const existing = await this.shipmentRepository.findOne({ 
      where: { trackingNumber: data.trackingNumber } 
    });
    if (existing) throw new ConflictException('Ce numéro de suivi existe déjà');
    
    const shipment = this.shipmentRepository.create({
      clientId: clientId,
      trackingNumber: data.trackingNumber,
      clientName: data.clientName,
      address: data.address,
      phone: data.phone || null,
      amount: data.amount || 0,
      transporteurId: data.transporteurId || null,
      estimatedDelivery: data.estimatedDelivery || null,
      status: data.status || 'pending'
    });
    
    return this.shipmentRepository.save(shipment);
  }

  async assignToTransporteur(id: number, clientId: number, transporteurId: number) {
    const shipment = await this.findOne(id, clientId);
    shipment.transporteurId = transporteurId;
    return this.shipmentRepository.save(shipment);
  }

  async updateStatus(id: number, clientId: number, status: string) {
    const shipment = await this.findOne(id, clientId);
    shipment.status = status;
    return this.shipmentRepository.save(shipment);
  }

  async updateStatusByTransporteur(id: number, transporteurId: number, status: string) {
    const shipment = await this.shipmentRepository.findOne({ 
      where: { id: id, transporteurId: transporteurId } 
    });
    if (!shipment) throw new NotFoundException('Expédition non trouvée ou non assignée');
    shipment.status = status;
    return this.shipmentRepository.save(shipment);
  }

  async update(id: number, clientId: number, data: any) {
    const shipment = await this.findOne(id, clientId);
    
    if (data.trackingNumber !== undefined) shipment.trackingNumber = data.trackingNumber;
    if (data.clientName !== undefined) shipment.clientName = data.clientName;
    if (data.address !== undefined) shipment.address = data.address;
    if (data.phone !== undefined) shipment.phone = data.phone;
    if (data.amount !== undefined) shipment.amount = data.amount;
    if (data.transporteurId !== undefined) shipment.transporteurId = data.transporteurId;
    if (data.estimatedDelivery !== undefined) shipment.estimatedDelivery = data.estimatedDelivery;
    if (data.status !== undefined) shipment.status = data.status;
    
    return this.shipmentRepository.save(shipment);
  }

  async delete(id: number, clientId: number) {
    const shipment = await this.findOne(id, clientId);
    await this.shipmentRepository.delete(id);
    return { success: true };
  }
}