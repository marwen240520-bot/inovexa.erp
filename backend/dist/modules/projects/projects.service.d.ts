import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
export declare class ProjectsService {
    private projectRepository;
    constructor(projectRepository: Repository<Project>);
    findAll(userId: number): Promise<Project[]>;
    findOne(id: number, userId: number): Promise<Project>;
    create(userId: number, data: Partial<Project>): Promise<Project>;
    update(id: number, userId: number, data: Partial<Project>): Promise<Project>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
}
