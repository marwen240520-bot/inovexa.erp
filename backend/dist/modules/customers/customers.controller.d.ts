import { CustomersModuleService } from './customers.service';
import { CreateCustomersModuleDto } from './dto/create-customers.dto';
import { UpdateCustomersModuleDto } from './dto/update-customers.dto';
export declare class CustomersModuleController {
    private readonly customersService;
    constructor(customersService: CustomersModuleService);
    create(createDto: CreateCustomersModuleDto): Promise<import("./entities/customers.entity").CustomersModuleEntity>;
    findAll(): Promise<import("./entities/customers.entity").CustomersModuleEntity[]>;
    findOne(id: string): Promise<import("./entities/customers.entity").CustomersModuleEntity>;
    update(id: string, updateDto: UpdateCustomersModuleDto): Promise<import("./entities/customers.entity").CustomersModuleEntity>;
    remove(id: string): Promise<void>;
}
