import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const csrfProtection = csrf({ cookie: true });
    csrfProtection(req, res, next);
  }
}
