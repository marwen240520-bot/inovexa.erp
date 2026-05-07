import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(userId: number) {
    return this.categoryRepository.find({ where: { userId } });
  }

  async findOne(id: number, userId: number) {
    const category = await this.categoryRepository.findOne({ where: { id, userId } });
    if (!category) throw new NotFoundException('Catégorie non trouvée');
    return category;
  }

  async create(userId: number, data: any) {
    const category = this.categoryRepository.create({ ...data, userId });
    return this.categoryRepository.save(category);
  }

  async update(id: number, userId: number, data: any) {
    const category = await this.findOne(id, userId);
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async delete(id: number, userId: number) {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.delete(id);
    return { success: true };
  }
}
