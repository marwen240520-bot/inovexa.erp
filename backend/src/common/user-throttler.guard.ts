import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Limite le débit par personne connectée (et non par adresse IP, partagée par tout un bureau ou un serveur). */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.actorId) return `user:${req.user.actorId}`;
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
