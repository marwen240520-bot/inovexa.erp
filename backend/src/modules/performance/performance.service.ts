import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceReview } from './performance-review.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(PerformanceReview)
    private repository: Repository<PerformanceReview>,
  ) {}

  async findAll(): Promise<PerformanceReview[]> {
    return this.repository.find({ order: { year: 'DESC', createdAt: 'DESC' } });
  }

  async findByEmployee(employeeId: string): Promise<PerformanceReview[]> {
    return this.repository.find({ where: { employeeId }, order: { year: 'DESC' } });
  }

  async create(data: Partial<PerformanceReview>): Promise<PerformanceReview> {
    const review = this.repository.create(data);
    return this.repository.save(review);
  }

  async getAverageRating(employeeId: string): Promise<number> {
    const reviews = await this.findByEmployee(employeeId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return sum / reviews.length;
  }
}
