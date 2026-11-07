import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

/** Verbes d'action métier reconnus à la fin d'une URL (POST /documents/12/validate -> action « validate »). */
const VERBS = new Set([
  'validate', 'cancel', 'pay', 'send', 'convert', 'duplicate', 'apply', 'receive', 'remind', 'void', 'close', 'open',
  'adjust', 'transfer', 'import', 'finalize', 'reopen', 'accept', 'reject', 'confirm', 'enable', 'disable', 'reset', 'reconcile',
  'payments', 'installments', 'lines', 'checkout', 'refund', 'post', 'match', 'unmatch', 'generate', 'depreciate',
]);

const METHOD_ACTION: Record<string, string> = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' };

function describe(method: string, rawPath: string) {
  const path = rawPath.split('?')[0].replace(/^\/+|\/+$/g, '');
  const parts = path.split('/').filter(Boolean);
  const entity = parts[0] || null;
  let entityId: string | null = null;
  let action = METHOD_ACTION[method] || method.toLowerCase();
  for (const p of parts.slice(1)) {
    if (/^\d+$/.test(p) && !entityId) entityId = p;
    else if (VERBS.has(p)) action = p;
  }
  return { entity, entityId, action };
}

/**
 * Journalise toutes les écritures (POST/PUT/PATCH/DELETE) des utilisateurs connectés, succès comme échecs.
 * Les lectures (GET) ne sont pas journalisées : trop volumineuses pour un intérêt limité.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const method = String(req.method || '').toUpperCase();
    if (!METHOD_ACTION[method]) return next.handle();

    const started = Date.now();
    const log = (status: number, extra?: any) => {
      const user = req.user;
      if (!user) return; // requêtes anonymes (login, etc.) : pas de société à laquelle rattacher la trace
      const d = describe(method, req.originalUrl || req.url || '');
      void this.audit.record({
        userId: user.userId,
        actorId: user.actorId ?? user.userId,
        actorEmail: user.email,
        action: d.action,
        entity: d.entity,
        entityId: d.entityId,
        method,
        path: (req.originalUrl || req.url || '').split('?')[0],
        status,
        ip: (req.ip || req.headers?.['x-forwarded-for'] || '').toString().split(',')[0].trim() || null,
        userAgent: req.headers?.['user-agent'],
        durationMs: Date.now() - started,
        details: { body: req.body, ...extra },
      });
    };

    return next.handle().pipe(
      tap(() => log(res.statusCode || 200)),
      catchError((err) => {
        const status = err instanceof HttpException ? err.getStatus() : 500;
        log(status, { error: String(err?.message || err).slice(0, 300) });
        return throwError(() => err);
      }),
    );
  }
}
