import { SearchModuleService } from './search.service';
import { CreateSearchModuleDto } from './dto/create-search.dto';
import { UpdateSearchModuleDto } from './dto/update-search.dto';
export declare class SearchModuleController {
    private readonly searchService;
    constructor(searchService: SearchModuleService);
    create(createDto: CreateSearchModuleDto): Promise<import("./entities/search.entity").SearchModuleEntity>;
    findAll(): Promise<import("./entities/search.entity").SearchModuleEntity[]>;
    findOne(id: string): Promise<import("./entities/search.entity").SearchModuleEntity>;
    update(id: string, updateDto: UpdateSearchModuleDto): Promise<import("./entities/search.entity").SearchModuleEntity>;
    remove(id: string): Promise<void>;
}
