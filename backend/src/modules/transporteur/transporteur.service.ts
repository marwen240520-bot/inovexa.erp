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

  async getMyShipments(userId: number) {
    console.log('=== getMyShipments called ===');
    console.log('userId received:', userId);
    
    // D'abord, trouver le transporteur associé à cet utilisateur
    const transporteur = await this.transporteurRepository.findOne({
      where: { userId: userId }
    });
    
    if (!transporteur) {
      console.log('No transporteur found for userId:', userId);
      return [];
    }
    
    console.log('Found transporteur:', transporteur.id, transporteur.name);
    
    // Ensuite, récupérer les livraisons pour ce transporteur
    const shipments = await this.shipmentRepository.find({
      where: { transporteurId: transporteur.id },
      order: { createdAt: 'DESC' }
    });
    
    console.log('Shipments found:', shipments.length);
    return shipments;
  }

  async getStats(userId: number) {
    const transporteur = await this.transporteurRepository.findOne({
      where: { userId: userId }
    });
    
    if (!transporteur) {
      return { total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0 };
    }
    
    const shipments = await this.shipmentRepository.find({
      where: { transporteurId: transporteur.id }
    });
    
    const total = shipments.length;
    const pending = shipments.filter(s => s.status === 'pending').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const cancelled = shipments.filter(s => s.status === 'cancelled').length;

    return { total, pending, inTransit, delivered, cancelled };
  }

  async updateShipmentStatus(id: number, userId: number, status: string) {
    // Trouver le transporteur
    const transporteur = await this.transporteurRepository.findOne({
      where: { userId: userId }
    });
    
    if (!transporteur) {
      throw new NotFoundException('Transporteur non trouvé');
    }
    
    const shipment = await this.shipmentRepository.findOne({
      where: { id: id, transporteurId: transporteur.id }
    });
    
    if (!shipment) {
      throw new NotFoundException('Expédition non trouvée');
    }
    
    shipment.status = status;
    return this.shipmentRepository.save(shipment);
  }
}