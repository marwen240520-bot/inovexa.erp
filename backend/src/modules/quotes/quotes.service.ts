import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from './quote.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
  ) {}

  async findAll(): Promise<Quote[]> {
    return this.quoteRepository.find();
  }

  async findOne(id: string): Promise<Quote | null> {
    return this.quoteRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Quote>): Promise<Quote> {
    const quote = this.quoteRepository.create(data);
    return this.quoteRepository.save(quote);
  }

  async update(id: string, data: Partial<Quote>): Promise<Quote | null> {
    await this.quoteRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.quoteRepository.delete(id);
  }

  async accept(id: string): Promise<Quote | null> {
    await this.quoteRepository.update(id, { status: 'accepted' });
    return this.findOne(id);
  }

  async reject(id: string): Promise<Quote | null> {
    await this.quoteRepository.update(id, { status: 'rejected' });
    return this.findOne(id);
  }
}
