import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchModuleEntity } from './entities/search.entity';
import { CreateSearchModuleDto } from './dto/create-search.dto';
import { UpdateSearchModuleDto } from './dto/update-search.dto';

@Injectable()
export class SearchModuleService {
  constructor(
    @InjectRepository(SearchModuleEntity)
    private searchRepository: Repository<SearchModuleEntity>,
  ) {}

  async findAll(): Promise<SearchModuleEntity[]> {
    return this.searchRepository.find();
  }

  async findOne(id: string): Promise<SearchModuleEntity> {
    const item = await this.searchRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  async create(createDto: CreateSearchModuleDto): Promise<SearchModuleEntity> {
    const item = this.searchRepository.create(createDto);
    return this.searchRepository.save(item);
  }

  async update(id: string, updateDto: UpdateSearchModuleDto): Promise<SearchModuleEntity> {
    const item = await this.findOne(id);
    Object.assign(item, updateDto);
    return this.searchRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.searchRepository.remove(item);
  }
}
