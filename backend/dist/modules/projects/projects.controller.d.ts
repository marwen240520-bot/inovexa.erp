import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findAll(req: any): Promise<import("./entities/project.entity").Project[]>;
    findOne(id: string, req: any): Promise<import("./entities/project.entity").Project>;
    create(req: any, body: any): Promise<import("./entities/project.entity").Project>;
    update(id: string, req: any, body: any): Promise<import("./entities/project.entity").Project>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
