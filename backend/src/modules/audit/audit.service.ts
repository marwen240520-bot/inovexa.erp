import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditRepository.create(data);
    return this.auditRepository.save(log);
  }

  async logWithRequest(data: Partial<AuditLog>, req: Request): Promise<AuditLog> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return this.log({ ...data, ip_address: ip });
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepository.find({ order: { created_at: 'DESC' } });
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.auditRepository.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
  }

  async findByEntity(entity: string, entityId?: string): Promise<AuditLog[]> {
    const where: any = { entity };
    if (entityId) where.entity_id = entityId;
    return this.auditRepository.find({ where, order: { created_at: 'DESC' } });
  }
}
