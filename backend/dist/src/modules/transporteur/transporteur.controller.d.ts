import { TransporteurService } from './transporteur.service';
export declare class TransporteurController {
    private readonly transporteurService;
    constructor(transporteurService: TransporteurService);
    getMyShipments(req: any): Promise<import("../logistics/entities/shipment.entity").Shipment[] | {
        error: string;
    }>;
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        inTransit: number;
        delivered: number;
        cancelled: number;
    } | {
        error: string;
    }>;
    updateShipmentStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("../logistics/entities/shipment.entity").Shipment | {
        error: string;
    }>;
}
