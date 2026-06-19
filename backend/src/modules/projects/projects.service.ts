import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async findAll(userId: number) {
    return this.projectRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, userId: number) {
    const project = await this.projectRepository.findOne({ where: { id, userId } });
    if (!project) throw new NotFoundException('Projet non trouvé');
    return project;
  }

  async create(userId: number, data: Partial<Project>) {
    const project = this.projectRepository.create({ ...data, userId });
    return this.projectRepository.save(project);
  }

  async update(id: number, userId: number, data: Partial<Project>) {
    const project = await this.findOne(id, userId);
    Object.assign(project, data);
    return this.projectRepository.save(project);
  }

  async delete(id: number, userId: number) {
    const project = await this.findOne(id, userId);
    await this.projectRepository.delete(id);
    return { success: true };
  }
}
