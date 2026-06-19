import { TransporteursService } from './transporteurs.service';
export declare class TransporteursController {
    private readonly transporteursService;
    constructor(transporteursService: TransporteursService);
    findAll(req: any): Promise<import("./entities/transporteur.entity").Transporteur[]>;
    findOne(id: string, req: any): Promise<import("./entities/transporteur.entity").Transporteur>;
    create(req: any, body: any): Promise<import("./entities/transporteur.entity").Transporteur>;
    update(id: string, req: any, body: any): Promise<import("./entities/transporteur.entity").Transporteur>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
