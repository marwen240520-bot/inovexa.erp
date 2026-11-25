import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Shipment } from '../logistics/entities/shipment.entity';
import { Transporteur } from '../transporteurs/entities/transporteur.entity';
import { SHIPMENT_STATUSES } from '../logistics/logistics.service';

/**
 * Espace du transporteur connecté : il ne voit et ne modifie que les expéditions qui lui sont confiées.
 * `accountId` est son compte de connexion ; la ligne `transporteurs` correspondante se retrouve par `transporteurs.userId`.
 */
@Injectable()
export class TransporteurService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Transporteur)
    private transporteurRepository: Repository<Transporteur>,
  ) {}

  private async ownIds(accountId: number): Promise<number[]> {
    const rows = await this.transporteurRepository.find({ where: { userId: accountId, isActive: true }, select: ['id'] });
    return rows.map((t) => t.id);
  }

  async getMyShipments(accountId: number) {
    const ids = await this.ownIds(accountId);
    if (!ids.length) return [];
    return this.shipmentRepository.find({ where: { transporteurId: In(ids) }, order: { createdAt: 'DESC' } });
  }

  async getStats(accountId: number) {
    const shipments = await this.getMyShipments(accountId);
    const count = (status: string) => shipments.filter((s) => s.status === status).length;
    return { total: shipments.length, pending: count('pending'), inTransit: count('in_transit'), delivered: count('delivered'), cancelled: count('cancelled') };
  }

  async updateShipmentStatus(id: number, accountId: number, status: string) {
    if (!(SHIPMENT_STATUSES as readonly string[]).includes(String(status))) throw new BadRequestException(`Statut invalide (${SHIPMENT_STATUSES.join(', ')}).`);
    const ids = await this.ownIds(accountId);
    if (!ids.length) throw new NotFoundException('Transporteur non trouvé');
    const shipment = await this.shipmentRepository.findOne({ where: { id, transporteurId: In(ids) } });
    if (!shipment) throw new NotFoundException('Expédition non trouvée');
    shipment.status = status;
    return this.shipmentRepository.save(shipment);
  }
}
