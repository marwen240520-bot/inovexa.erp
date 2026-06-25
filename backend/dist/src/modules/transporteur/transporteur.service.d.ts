import { Repository } from 'typeorm';
import { Shipment } from '../logistics/entities/shipment.entity';
import { Transporteur } from '../transporteurs/entities/transporteur.entity';
export declare class TransporteurService {
    private shipmentRepository;
    private transporteurRepository;
    constructor(shipmentRepository: Repository<Shipment>, transporteurRepository: Repository<Transporteur>);
    getMyShipments(userId: number): Promise<Shipment[]>;
    getStats(userId: number): Promise<{
        total: number;
        pending: number;
        inTransit: number;
        delivered: number;
        cancelled: number;
    }>;
    updateShipmentStatus(id: number, userId: number, status: string): Promise<Shipment>;
}
