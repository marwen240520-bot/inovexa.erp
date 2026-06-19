import { LogisticsService } from './logistics.service';
export declare class LogisticsController {
    private readonly logisticsService;
    constructor(logisticsService: LogisticsService);
    getClientShipments(req: any): Promise<import("./entities/shipment.entity").Shipment[] | {
        error: string;
    }>;
    getTransporteurShipments(req: any): Promise<import("./entities/shipment.entity").Shipment[] | {
        error: string;
    }>;
    findOne(id: string, req: any): Promise<import("./entities/shipment.entity").Shipment>;
    create(req: any, body: any): Promise<import("./entities/shipment.entity").Shipment | {
        error: string;
    }>;
    update(id: string, req: any, body: any): Promise<import("./entities/shipment.entity").Shipment>;
    assignToTransporteur(id: string, req: any, body: {
        transporteurId: number;
    }): Promise<import("./entities/shipment.entity").Shipment>;
    updateStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("./entities/shipment.entity").Shipment>;
    updateStatusByTransporteur(id: string, req: any, body: {
        status: string;
    }): Promise<import("./entities/shipment.entity").Shipment | {
        error: string;
    }>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
