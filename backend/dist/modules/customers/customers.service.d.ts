import { Repository } from 'typeorm';
import { CustomersModuleEntity } from './entities/customers.entity';
import { CreateCustomersModuleDto } from './dto/create-customers.dto';
import { UpdateCustomersModuleDto } from './dto/update-customers.dto';
export declare class CustomersModuleService {
    private customersRepository;
    constructor(customersRepository: Repository<CustomersModuleEntity>);
    findAll(): Promise<CustomersModuleEntity[]>;
    findOne(id: string): Promise<CustomersModuleEntity>;
    create(createDto: CreateCustomersModuleDto): Promise<CustomersModuleEntity>;
    update(id: string, updateDto: UpdateCustomersModuleDto): Promise<CustomersModuleEntity>;
    remove(id: string): Promise<void>;
}
