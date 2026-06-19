import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportModuleEntity } from './entities/export.entity';
import { CreateExportModuleDto } from './dto/create-export.dto';
import { UpdateExportModuleDto } from './dto/update-export.dto';

@Injectable()
export class ExportModuleService {
  constructor(
    @InjectRepository(ExportModuleEntity)
    private exportRepository: Repository<ExportModuleEntity>,
  ) {}

  async findAll(): Promise<ExportModuleEntity[]> {
    return this.exportRepository.find();
  }

  async findOne(id: string): Promise<ExportModuleEntity> {
    const item = await this.exportRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  async create(createDto: CreateExportModuleDto): Promise<ExportModuleEntity> {
    const item = this.exportRepository.create(createDto);
    return this.exportRepository.save(item);
  }

  async update(id: string, updateDto: UpdateExportModuleDto): Promise<ExportModuleEntity> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.exportRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.exportRepository.remove(item);
  }
}
