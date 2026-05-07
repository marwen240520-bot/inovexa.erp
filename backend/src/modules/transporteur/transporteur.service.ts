import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../logistics/entities/shipment.entity';
import { Transporteur } from '../transporteurs/entities/transporteur.entity';

@Injectable()
export class TransporteurService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Transporteur)
    private transporteurRepository: Repository<Transporteur>,
  ) {}

  async getMyShipments(transporteurId: number) {
    // Récupérer l'ID utilisateur du transporteur
    const transporteur = await this.transporteurRepository.findOne({
      where: { userId: transporteurId }
    });
    
    if (!transporteur) {
      return [];
    }
    
    return this.shipmentRepository.find({ 
      where: { transporteurId: transporteur.id }
    });
  }

  async updateShipmentStatus(id: number, transporteurUserId: number, status: string) {
    // Récupérer le transporteur par son userId
    const transporteur = await this.transporteurRepository.findOne({
      where: { userId: transporteurUserId }
    });
    
    if (!transporteur) {
      throw new NotFoundException('Transporteur non trouvé');
    }
    
    const shipment = await this.shipmentRepository.findOne({ 
      where: { id, transporteurId: transporteur.id }
    });
    
    if (!shipment) {
      throw new NotFoundException('Expédition non trouvée');
    }
    
    shipment.status = status;
    return this.shipmentRepository.save(shipment);
  }

  async getStats(transporteurUserId: number) {
    const transporteur = await this.transporteurRepository.findOne({
      where: { userId: transporteurUserId }
    });
    
    if (!transporteur) {
      return { total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0 };
    }
    
    const shipments = await this.shipmentRepository.find({ 
      where: { transporteurId: transporteur.id }
    });
    
    const pending = shipments.filter(s => s.status === 'pending').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const cancelled = shipments.filter(s => s.status === 'cancelled').length;
    
    return { 
      total: shipments.length, 
      pending, 
      inTransit, 
      delivered, 
      cancelled 
    };
  }
}