import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
export declare class LogisticsService {
    private shipmentRepository;
    constructor(shipmentRepository: Repository<Shipment>);
    findAllByClient(clientId: number): Promise<Shipment[]>;
    findAllByTransporteur(transporteurId: number): Promise<Shipment[]>;
    findOne(id: number, clientId: number): Promise<Shipment>;
    create(clientId: number, data: any): Promise<Shipment>;
    assignToTransporteur(id: number, clientId: number, transporteurId: number): Promise<Shipment>;
    updateStatus(id: number, clientId: number, status: string): Promise<Shipment>;
    updateStatusByTransporteur(id: number, transporteurId: number, status: string): Promise<Shipment>;
    update(id: number, clientId: number, data: any): Promise<Shipment>;
    delete(id: number, clientId: number): Promise<{
        success: boolean;
    }>;
}
