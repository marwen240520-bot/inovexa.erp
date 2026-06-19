import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

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

  async findByName(name: string, userId: number) {
    if (!name) return null;
    return this.categoryRepository.findOne({ where: { name, userId } });
  }

  async create(userId: number, data: Partial<Category>) {
    // Vérifier si le nom est fourni
    if (!data.name) {
      throw new ConflictException('Le nom de la catégorie est requis');
    }
    
    const existing = await this.findByName(data.name, userId);
    if (existing) {
      throw new ConflictException('Une catégorie avec ce nom existe déjà');
    }
    
    const category = this.categoryRepository.create({ ...data, userId });
    return this.categoryRepository.save(category);
  }

  async update(id: number, userId: number, data: Partial<Category>) {
    const category = await this.findOne(id, userId);
    
    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (data.name && data.name !== category.name) {
      const existing = await this.findByName(data.name, userId);
      if (existing) {
        throw new ConflictException('Une catégorie avec ce nom existe déjà');
      }
    }
    
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async delete(id: number, userId: number) {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.delete(id);
    return { success: true };
  }

  async getStats(userId: number) {
    const categories = await this.findAll(userId);
    return {
      total: categories.length,
      items: categories
    };
  }
}
