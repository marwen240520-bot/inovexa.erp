import { Repository } from 'typeorm';
import { SearchModuleEntity } from './entities/search.entity';
import { CreateSearchModuleDto } from './dto/create-search.dto';
import { UpdateSearchModuleDto } from './dto/update-search.dto';
export declare class SearchModuleService {
    private searchRepository;
    constructor(searchRepository: Repository<SearchModuleEntity>);
    findAll(): Promise<SearchModuleEntity[]>;
    findOne(id: string): Promise<SearchModuleEntity>;
    create(createDto: CreateSearchModuleDto): Promise<SearchModuleEntity>;
    update(id: string, updateDto: UpdateSearchModuleDto): Promise<SearchModuleEntity>;
    remove(id: string): Promise<void>;
}
