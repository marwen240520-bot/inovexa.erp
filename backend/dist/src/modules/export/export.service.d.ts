import { Repository } from 'typeorm';
import { ExportModuleEntity } from './entities/export.entity';
import { CreateExportModuleDto } from './dto/create-export.dto';
import { UpdateExportModuleDto } from './dto/update-export.dto';
export declare class ExportModuleService {
    private exportRepository;
    constructor(exportRepository: Repository<ExportModuleEntity>);
    findAll(): Promise<ExportModuleEntity[]>;
    findOne(id: string): Promise<ExportModuleEntity>;
    create(createDto: CreateExportModuleDto): Promise<ExportModuleEntity>;
    update(id: string, updateDto: UpdateExportModuleDto): Promise<ExportModuleEntity>;
    remove(id: string): Promise<void>;
}
