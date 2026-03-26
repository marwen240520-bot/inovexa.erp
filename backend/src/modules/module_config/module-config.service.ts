import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleConfiguration } from './module-config.entity';

@Injectable()
export class ModuleConfigService {
  constructor(
    @InjectRepository(ModuleConfiguration)
    private repository: Repository<ModuleConfiguration>,
  ) {}

  async getModules(tenantId: string): Promise<ModuleConfiguration[]> {
    return this.repository.find({ where: { tenantId }, order: { order: 'ASC' } });
  }

  async toggleModule(tenantId: string, moduleName: string): Promise<ModuleConfiguration> {
    let config = await this.repository.findOne({ where: { tenantId, moduleName } });
    if (config) {
      config.isEnabled = !config.isEnabled;
    } else {
      config = this.repository.create({ tenantId, moduleName, isEnabled: true });
    }
    return this.repository.save(config);
  }

  async updateSettings(tenantId: string, moduleName: string, settings: any): Promise<ModuleConfiguration> {
    let config = await this.repository.findOne({ where: { tenantId, moduleName } });
    if (config) {
      config.settings = settings;
    } else {
      config = this.repository.create({ tenantId, moduleName, settings });
    }
    return this.repository.save(config);
  }
}
