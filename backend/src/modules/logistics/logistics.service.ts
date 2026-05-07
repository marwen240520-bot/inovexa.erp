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
      where: { clientId },
      order: { createdAt: 'DESC' }
    });
  }

  async findAllByTransporteur(transporteurId: number) {
    console.log(`🔍 Recherche expéditions pour transporteur: ${transporteurId}`);
    
    const shipments = await this.shipmentRepository.find({ 
      where: { transporteurId },
      order: { createdAt: 'DESC' }
    });
    
    console.log(`📦 ${shipments.length} expédition(s) trouvée(s) pour le transporteur ${transporteurId}`);
    
    return shipments;
  }

  async findOne(id: number, clientId: number) {
    const shipment = await this.shipmentRepository.findOne({ where: { id, clientId } });
    if (!shipment) throw new NotFoundException('Expédition non trouvée');
    return shipment;
  }

  async create(clientId: number, data: any) {
    if (data.trackingNumber) {
      const existing = await this.shipmentRepository.findOne({ 
        where: { trackingNumber: data.trackingNumber } 
      });
      if (existing) throw new ConflictException('Ce numéro de suivi existe déjà');
    }
    
    // ⭐ AJOUTER amount et phone dans la création
    const cleanData = {
      clientId: clientId,
      trackingNumber: data.trackingNumber || `TRK${Date.now()}`,
      clientName: data.clientName || "",
      address: data.address || "",
      carrier: data.carrier || "Standard",
      status: data.status || "pending",
      estimatedDelivery: data.estimatedDelivery && data.estimatedDelivery !== "" ? new Date(data.estimatedDelivery) : null,
      transporteurId: data.transporteurId ? parseInt(data.transporteurId) : null,
      amount: data.amount ? parseFloat(data.amount) : 0,
      phone: data.phone || ""
    };
    
    const shipment = this.shipmentRepository.create(cleanData);
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
    console.log(`🔄 Mise à jour statut expédition ${id} par transporteur ${transporteurId} -> ${status}`);
    
    const shipment = await this.shipmentRepository.findOne({ 
      where: { id, transporteurId } 
    });
    
    if (!shipment) throw new NotFoundException('Expédition non trouvée ou non assignée');
    
    shipment.status = status;
    const updated = await this.shipmentRepository.save(shipment);
    console.log(`✅ Statut mis à jour: ${updated.status}`);
    
    return updated;
  }

  // ⭐ CORRECTION: Ajouter amount et phone dans la mise à jour
  async update(id: number, clientId: number, data: any) {
    const shipment = await this.findOne(id, clientId);
    
    const updateData: any = {};
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
    if (data.clientName) updateData.clientName = data.clientName;
    if (data.address) updateData.address = data.address;
    if (data.carrier) updateData.carrier = data.carrier;
    if (data.status) updateData.status = data.status;
    if (data.transporteurId !== undefined) updateData.transporteurId = data.transporteurId;
    if (data.estimatedDelivery && data.estimatedDelivery !== "") {
      updateData.estimatedDelivery = new Date(data.estimatedDelivery);
    }
    // ⭐ AJOUTER amount et phone
    if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);
    if (data.phone !== undefined) updateData.phone = data.phone;
    
    Object.assign(shipment, updateData);
    return this.shipmentRepository.save(shipment);
  }

  async delete(id: number, clientId: number) {
    const shipment = await this.findOne(id, clientId);
    await this.shipmentRepository.delete(id);
    return { success: true };
  }
}