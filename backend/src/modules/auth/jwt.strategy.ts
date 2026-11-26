import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { SaasSettingsService } from '../saas/saas-settings.service';
import { SubscriptionService } from '../saas/subscription.service';
import { effectiveModules, resolveAccess } from '../saas/account-access';

/**
 * Clé de signature des sessions.
 *  - JWT_SECRET défini : c'est elle (obligatoire en production, 32 caractères au moins).
 *  - Absente en production : on ne retombe JAMAIS sur une clé connue de tous (n'importe qui pourrait fabriquer une
 *    session d'administrateur). Une clé aléatoire est tirée au démarrage : le service reste en ligne, mais chaque
 *    redémarrage déconnecte tout le monde — le message ci-dessous dit quoi faire.
 *  - Absente en développement : clé fixe, pour ne pas se reconnecter à chaque rechargement.
 */
function resolveJwtSecret(): string {
  const fromEnv = (process.env.JWT_SECRET || '').trim();
  if (fromEnv) {
    if (process.env.NODE_ENV === 'production' && fromEnv.length < 32) {
      // eslint-disable-next-line no-console
      console.error('⚠️  JWT_SECRET est trop court (moins de 32 caractères). Générez-en un : openssl rand -base64 48');
    }
    return fromEnv;
  }
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error('⚠️  JWT_SECRET n’est pas défini : une clé temporaire est utilisée, toutes les sessions seront perdues à chaque redémarrage. Définissez JWT_SECRET sur votre hébergeur (openssl rand -base64 48).');
    return randomBytes(48).toString('base64');
  }
  return 'dev-only-secret-not-for-production';
}

export const JWT_SECRET = resolveJwtSecret();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settings: SaasSettingsService,
    private subscriptions: SubscriptionService,
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
   *  - actorId = la personne réellement connectée (membre d'équipe ou propriétaire) : audit, profil, mot de passe ;
   *  - account = l'état du compte (essai, abonnement, suspension), recalculé ICI à chaque requête avec l'horloge du serveur ;
   *  - modules = les modules réellement utilisables par la société : activés par elle ET disponibles dans sa formule.
   */
  async validate(payload: any) {
    const user = await this.userRepository.findOne({ where: { id: payload.userId } });
    if (!user || user.isActive === false) throw new UnauthorizedException('Compte introuvable ou désactivé');
    // Session révoquée (changement de mot de passe, « se déconnecter partout »)
    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) throw new UnauthorizedException('Session expirée, reconnectez-vous');

    let owner: User | null = null;
    if (user.ownerId) {
      owner = await this.userRepository.findOne({ where: { id: user.ownerId } });
      if (!owner || owner.isActive === false) throw new UnauthorizedException('Le compte de la société est désactivé');
    }
    const accountRow = owner ?? user;
    const settings = await this.settings.get();
    const access = resolveAccess(accountRow, new Date(), { requireEmailVerification: this.settings.verificationRequired(settings) });
    if (access.persistExpired) {
      // L'essai (ou l'abonnement) vient de se terminer : on l'enregistre une fois, sans faire attendre la requête.
      void this.subscriptions.persistExpired(accountRow, access.reason === 'SUBSCRIPTION_EXPIRED' ? 'SUBSCRIPTION_EXPIRED' : 'TRIAL_EXPIRED').catch(() => undefined);
    }
    const account = { status: access.status, blocked: access.blocked, reason: access.reason };
    // La formule est relue à chaque requête : si l'administrateur la modifie, les modules retirés se ferment aussitôt
    // (le choix du client reste enregistré, il reprend effet si la formule les remet).
    const modules = effectiveModules(accountRow.modules, await this.subscriptions.allowedModules(accountRow.planCode));

    if (owner) {
      return { userId: owner.id, actorId: user.id, email: user.email, role: user.role, isTeamMember: true, permissions: user.extraPermissions || [], account, modules };
    }
    return { userId: user.id, actorId: user.id, email: user.email, role: user.role, isTeamMember: false, permissions: [], account, modules };
  }
}
