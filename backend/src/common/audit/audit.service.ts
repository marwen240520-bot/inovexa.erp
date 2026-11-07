import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditEvent {
  userId?: number | null;
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | number | null;
  method?: string | null;
  path?: string | null;
  status?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  durationMs?: number | null;
  details?: any;
}

const SECRET_KEY = /pass(word)?|token|secret|otp|authorization|api[-_]?key|data:?url|image(url)?|logo|avatar|cvv|iban|rib/i;

/** Retire les secrets et tronque : un journal d'audit ne doit jamais devenir une fuite de données. */
export function sanitizeForAudit(value: any, depth = 0): any {
  if (value === null || value === undefined) return value;
  if (depth > 4) return '[…]';
  if (typeof value === 'string') return value.length > 300 ? `${value.slice(0, 300)}…` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    const items = value.slice(0, 20).map((v) => sanitizeForAudit(v, depth + 1));
    if (value.length > 20) items.push(`[+${value.length - 20} éléments]`);
    return items;
  }
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value).slice(0, 40)) {
    out[k] = SECRET_KEY.test(k) ? '[masqué]' : sanitizeForAudit(v, depth + 1);
  }
  return out;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  /** Enregistre un événement. Ne lève JAMAIS d'erreur : l'audit ne doit pas casser l'opération métier. */
  async record(event: AuditEvent): Promise<void> {
    try {
      const details = event.details === undefined ? null : sanitizeForAudit(event.details);
      await this.repo.insert({
        userId: event.userId ?? null,
        actorId: event.actorId ?? null,
        actorEmail: event.actorEmail ?? null,
        action: event.action,
        entity: event.entity ?? null,
        entityId: event.entityId === undefined || event.entityId === null ? null : String(event.entityId),
        method: event.method ?? null,
        path: event.path ? event.path.slice(0, 300) : null,
        status: event.status ?? null,
        ip: event.ip ?? null,
        userAgent: event.userAgent ? event.userAgent.slice(0, 200) : null,
        durationMs: event.durationMs ?? null,
        details: details && JSON.stringify(details).length > 4000 ? { truncated: true } : details,
      });
    } catch (e: any) {
      this.logger.warn(`Journal d'audit indisponible : ${e?.message || e}`);
    }
  }

  async list(userId: number, filters: { entity?: string; entityId?: string; actorId?: number; action?: string; from?: string; to?: string; limit?: number; offset?: number }) {
    const qb = this.repo.createQueryBuilder('a').where('a.userId = :userId', { userId });
    if (filters.entity) qb.andWhere('a.entity = :entity', { entity: filters.entity });
    if (filters.entityId) qb.andWhere('a.entityId = :entityId', { entityId: filters.entityId });
    if (filters.actorId) qb.andWhere('a.actorId = :actorId', { actorId: filters.actorId });
    if (filters.action) qb.andWhere('a.action = :action', { action: filters.action });
    if (filters.from) qb.andWhere('a.createdAt >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('a.createdAt <= :to', { to: filters.to });
    const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 500);
    const offset = Math.max(Number(filters.offset) || 0, 0);
    const [items, total] = await qb.orderBy('a.createdAt', 'DESC').addOrderBy('a.id', 'DESC').take(limit).skip(offset).getManyAndCount();
    return { total, limit, offset, items };
  }
}
