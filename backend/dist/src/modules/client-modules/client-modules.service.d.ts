import { Repository } from 'typeorm';
import { ClientModules } from './entities/client-modules.entity';
export declare class ClientModulesService {
    private clientModulesRepository;
    constructor(clientModulesRepository: Repository<ClientModules>);
    getModulesByClient(clientId: number): Promise<ClientModules>;
    createDefaultModules(clientId: number): Promise<ClientModules>;
    updateModules(clientId: number, data: any): Promise<ClientModules>;
    getAllModulesConfig(): Promise<ClientModules[]>;
    getModuleStatus(clientId: number, moduleName: string): Promise<any>;
    resetModules(clientId: number): Promise<ClientModules>;
}
