import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

declare module 'express' {
  interface Request {
    tenant?: any;
    tenantId?: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      try {
        const tenant = await this.dataSource.getRepository('Tenant').findOne({
          where: { subdomain, isActive: true }
        });
        if (tenant) {
          req.tenant = tenant;
          req.tenantId = tenant.id;
        }
      } catch (e) {}
    }
    next();
  }
}
