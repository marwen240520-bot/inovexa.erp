import { ExportModuleService } from './export.service';
import { CreateExportModuleDto } from './dto/create-export.dto';
import { UpdateExportModuleDto } from './dto/update-export.dto';
export declare class ExportModuleController {
    private readonly exportService;
    constructor(exportService: ExportModuleService);
    create(createDto: CreateExportModuleDto): Promise<import("./entities/export.entity").ExportModuleEntity>;
    findAll(): Promise<import("./entities/export.entity").ExportModuleEntity[]>;
    findOne(id: string): Promise<import("./entities/export.entity").ExportModuleEntity>;
    update(id: string, updateDto: UpdateExportModuleDto): Promise<import("./entities/export.entity").ExportModuleEntity>;
    remove(id: string): Promise<void>;
}
