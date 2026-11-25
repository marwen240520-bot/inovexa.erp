import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { Transporteur } from '../transporteurs/entities/transporteur.entity';
import { normalizePhone } from '../../common/phone';

export const SHIPMENT_STATUSES = ['pending', 'in_transit', 'delivered', 'cancelled'] as const;

/**
 * Expéditions d'une société.
 *
 * Deux identifiants à ne pas confondre :
 *  - `clientId` = la SOCIÉTÉ propriétaire de l'expédition (users.id du propriétaire) ;
 *  - `transporteurId` = une ligne de la table `transporteurs` (et non le compte de connexion du transporteur).
 * Le compte d'un transporteur est relié à sa ligne par `transporteurs.userId`.
 */
@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Transporteur)
    private transporteurRepository: Repository<Transporteur>,
  ) {}

  async findAllByClient(clientId: number) {
    return this.shipmentRepository.find({ where: { clientId }, order: { createdAt: 'DESC' } });
  }

  /** Expéditions confiées au transporteur connecté (`accountId` = son compte de connexion). */
  async findAllByTransporteurAccount(accountId: number) {
    const rows = await this.transporteurRepository.find({ where: { userId: accountId, isActive: true } });
    if (!rows.length) return [];
    return this.shipmentRepository
      .createQueryBuilder('s')
      .where('s.transporteurId IN (:...ids)', { ids: rows.map((t) => t.id) })
      .orderBy('s.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number, clientId: number) {
    const shipment = await this.shipmentRepository.findOne({ where: { id, clientId } });
    if (!shipment) throw new NotFoundException('Expédition non trouvée');
    return shipment;
  }

  private cleanStatus(status: unknown): string {
    const s = String(status || '').trim();
    if (!(SHIPMENT_STATUSES as readonly string[]).includes(s)) throw new BadRequestException(`Statut invalide (${SHIPMENT_STATUSES.join(', ')}).`);
    return s;
  }

  /** Le transporteur choisi doit appartenir à la société : on ne confie pas un colis au transporteur d'une autre société. */
  private async cleanTransporteurId(value: unknown, clientId: number): Promise<number | null> {
    if (value === null || value === undefined || value === '') return null;
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Transporteur invalide.');
    const transporteur = await this.transporteurRepository.findOne({ where: { id, clientId } });
    if (!transporteur) throw new BadRequestException('Transporteur introuvable dans votre société.');
    return id;
  }

  private cleanAmount(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > 99_999_999) throw new BadRequestException('Montant invalide.');
    return Math.round(n * 100) / 100;
  }

  private cleanDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Date de livraison invalide.');
    return d;
  }

  private cleanText(value: unknown, label: string, max: number, required: boolean): string {
    const s = String(value ?? '').trim();
    if (required && !s) throw new BadRequestException(`${label} : champ obligatoire.`);
    if (s.length > max) throw new BadRequestException(`${label} : ${max} caractères maximum.`);
    return s;
  }

  /** Téléphone du destinataire : mis au format international quand c'est possible, sinon gardé tel que saisi. */
  private cleanPhone(value: unknown): string | null {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    const check = normalizePhone(raw);
    return check.valid ? check.normalized : raw.slice(0, 40);
  }

  /** Numéro de suivi proposé quand la personne n'en saisit pas : EXP-AAAAMMJJ-XXXX, unique dans la société. */
  private async nextTrackingNumber(clientId: number): Promise<string> {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 0; i < 20; i++) {
      const candidate = `EXP-${day}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      if (!(await this.shipmentRepository.findOne({ where: { clientId, trackingNumber: candidate } }))) return candidate;
    }
    return `EXP-${day}-${Date.now()}`;
  }

  async create(clientId: number, data: any) {
    const body = data && typeof data === 'object' ? data : {};
    const trackingNumber = this.cleanText(body.trackingNumber, 'Numéro de suivi', 60, false) || (await this.nextTrackingNumber(clientId));
    // Le numéro de suivi est propre à chaque société : deux sociétés peuvent utiliser le même sans se gêner.
    if (await this.shipmentRepository.findOne({ where: { clientId, trackingNumber } })) throw new ConflictException('Ce numéro de suivi existe déjà');

    const shipment = this.shipmentRepository.create({
      clientId,
      trackingNumber,
      clientName: this.cleanText(body.clientName, 'Destinataire', 160, true),
      address: this.cleanText(body.address, 'Adresse de livraison', 300, true),
      phone: this.cleanPhone(body.phone) as any,
      amount: this.cleanAmount(body.amount),
      transporteurId: (await this.cleanTransporteurId(body.transporteurId, clientId)) as any,
      estimatedDelivery: this.cleanDate(body.estimatedDelivery) as any,
      status: body.status ? this.cleanStatus(body.status) : 'pending',
    });
    return this.shipmentRepository.save(shipment);
  }

  async assignToTransporteur(id: number, clientId: number, transporteurId: number) {
    const shipment = await this.findOne(id, clientId);
    shipment.transporteurId = (await this.cleanTransporteurId(transporteurId, clientId)) as any;
    return this.shipmentRepository.save(shipment);
  }

  async updateStatus(id: number, clientId: number, status: string) {
    const shipment = await this.findOne(id, clientId);
    shipment.status = this.cleanStatus(status);
    return this.shipmentRepository.save(shipment);
  }

  /** Le transporteur connecté met à jour une expédition qui LUI est confiée (quelle que soit la société). */
  async updateStatusByTransporteurAccount(id: number, accountId: number, status: string) {
    const rows = await this.transporteurRepository.find({ where: { userId: accountId, isActive: true } });
    const ids = rows.map((t) => t.id);
    const shipment = ids.length ? await this.shipmentRepository.findOne({ where: { id } }) : null;
    if (!shipment || !shipment.transporteurId || !ids.includes(shipment.transporteurId)) throw new NotFoundException('Expédition non trouvée ou non assignée');
    shipment.status = this.cleanStatus(status);
    return this.shipmentRepository.save(shipment);
  }

  async update(id: number, clientId: number, data: any) {
    const shipment = await this.findOne(id, clientId);
    const body = data && typeof data === 'object' ? data : {};

    if (body.trackingNumber !== undefined) {
      const trackingNumber = this.cleanText(body.trackingNumber, 'Numéro de suivi', 60, true);
      if (trackingNumber !== shipment.trackingNumber) {
        if (await this.shipmentRepository.findOne({ where: { clientId, trackingNumber } })) throw new ConflictException('Ce numéro de suivi existe déjà');
        shipment.trackingNumber = trackingNumber;
      }
    }
    if (body.clientName !== undefined) shipment.clientName = this.cleanText(body.clientName, 'Destinataire', 160, true);
    if (body.address !== undefined) shipment.address = this.cleanText(body.address, 'Adresse de livraison', 300, true);
    if (body.phone !== undefined) shipment.phone = this.cleanPhone(body.phone) as any;
    if (body.amount !== undefined) shipment.amount = this.cleanAmount(body.amount);
    if (body.transporteurId !== undefined) shipment.transporteurId = (await this.cleanTransporteurId(body.transporteurId, clientId)) as any;
    if (body.estimatedDelivery !== undefined) shipment.estimatedDelivery = this.cleanDate(body.estimatedDelivery) as any;
    if (body.status !== undefined && body.status !== null && body.status !== '') shipment.status = this.cleanStatus(body.status);

    return this.shipmentRepository.save(shipment);
  }

  async delete(id: number, clientId: number) {
    await this.findOne(id, clientId);
    await this.shipmentRepository.delete({ id, clientId });
    return { success: true };
  }

  /** Chiffres de la page « Analyse » : calculés sur toutes les expéditions de la société. */
  async stats(clientId: number) {
    const shipments = await this.findAllByClient(clientId);
    const carriers = await this.transporteurRepository.find({ where: { clientId } });
    const count = (status: string) => shipments.filter((s) => s.status === status).length;
    const now = Date.now();
    const delivered = shipments.filter((s) => s.status === 'delivered');
    // « À l'heure » : livrée au plus tard à la date prévue (seules les expéditions qui ont une date prévue comptent).
    const withDate = delivered.filter((s) => s.estimatedDelivery);
    const onTime = withDate.filter((s) => new Date(s.updatedAt).getTime() <= new Date(s.estimatedDelivery).getTime() + 86_400_000).length;
    const late = shipments.filter((s) => (s.status === 'pending' || s.status === 'in_transit') && s.estimatedDelivery && new Date(s.estimatedDelivery).getTime() < now).length;
    const byCarrier = carriers.map((c) => {
      const own = shipments.filter((s) => s.transporteurId === c.id);
      return {
        id: c.id, name: c.name, isActive: c.isActive, total: own.length,
        delivered: own.filter((s) => s.status === 'delivered').length,
        inTransit: own.filter((s) => s.status === 'in_transit').length,
        pending: own.filter((s) => s.status === 'pending').length,
        cancelled: own.filter((s) => s.status === 'cancelled').length,
        amount: Math.round(own.reduce((sum, s) => sum + Number(s.amount || 0), 0) * 100) / 100,
      };
    }).sort((a, b) => b.total - a.total);
    const months: Array<{ month: string; total: number; delivered: number; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const own = shipments.filter((s) => new Date(s.createdAt).toISOString().slice(0, 7) === key);
      months.push({ month: key, total: own.length, delivered: own.filter((s) => s.status === 'delivered').length, amount: Math.round(own.reduce((sum, s) => sum + Number(s.amount || 0), 0) * 100) / 100 });
    }
    return {
      total: shipments.length, pending: count('pending'), inTransit: count('in_transit'), delivered: count('delivered'), cancelled: count('cancelled'),
      unassigned: shipments.filter((s) => !s.transporteurId && s.status !== 'cancelled' && s.status !== 'delivered').length,
      late, onTime, onTimeBase: withDate.length, onTimeRate: withDate.length ? Math.round((onTime / withDate.length) * 1000) / 10 : null,
      amount: Math.round(shipments.reduce((sum, s) => sum + Number(s.amount || 0), 0) * 100) / 100,
      carriers: carriers.length, activeCarriers: carriers.filter((c) => c.isActive).length,
      byCarrier, byMonth: months,
    };
  }
}
