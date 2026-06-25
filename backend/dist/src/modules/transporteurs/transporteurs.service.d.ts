import { Repository } from 'typeorm';
import { Transporteur } from './entities/transporteur.entity';
import { User } from '../users/entities/user.entity';
export declare class TransporteursService {
    private transporteurRepository;
    private userRepository;
    constructor(transporteurRepository: Repository<Transporteur>, userRepository: Repository<User>);
    findAll(clientId: number): Promise<Transporteur[]>;
    findOne(id: number, clientId: number): Promise<Transporteur>;
    create(clientId: number, data: any): Promise<Transporteur>;
    update(id: number, clientId: number, data: any): Promise<Transporteur>;
    delete(id: number, clientId: number): Promise<{
        success: boolean;
    }>;
}
