import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerInteraction } from './customer-interaction.entity';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(CustomerInteraction)
    private repository: Repository<CustomerInteraction>,
  ) {}

  async findAll(): Promise<CustomerInteraction[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findByCustomer(customerId: string): Promise<CustomerInteraction[]> {
    return this.repository.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<CustomerInteraction>): Promise<CustomerInteraction> {
    const interaction = this.repository.create(data);
    return this.repository.save(interaction);
  }

  async getTimeline(customerId: string): Promise<any> {
    const interactions = await this.findByCustomer(customerId);
    return interactions.map(i => ({
      date: i.createdAt,
      type: i.type,
      subject: i.subject,
      content: i.content,
      createdBy: i.createdBy
    }));
  }
}
