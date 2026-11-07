import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.error('⚠️  JWT_SECRET n’est pas défini : la clé par défaut (publique) est utilisée. Définissez JWT_SECRET sur votre hébergeur AVANT d’exposer l’application.');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  /**
   * Retourne l'utilisateur de la requête :
   *  - userId  = la SOCIÉTÉ (propriétaire des données) : toutes les requêtes filtrent sur cet identifiant ;
   *  - actorId = la personne réellement connectée (membre d'équipe ou propriétaire) : audit, profil, mot de passe.
   */
  async validate(payload: any) {
    const user = await this.userRepository.findOne({ where: { id: payload.userId } });
    if (!user || user.isActive === false) throw new UnauthorizedException('Compte introuvable ou désactivé');
    // Session révoquée (changement de mot de passe, « se déconnecter partout »)
    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) throw new UnauthorizedException('Session expirée, reconnectez-vous');

    if (user.ownerId) {
      const owner = await this.userRepository.findOne({ where: { id: user.ownerId } });
      if (!owner || owner.isActive === false) throw new UnauthorizedException('Le compte de la société est désactivé');
      return { userId: owner.id, actorId: user.id, email: user.email, role: user.role, isTeamMember: true, permissions: user.extraPermissions || [] };
    }
    return { userId: user.id, actorId: user.id, email: user.email, role: user.role, isTeamMember: false, permissions: [] };
  }
}
