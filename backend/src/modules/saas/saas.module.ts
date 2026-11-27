import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../../common/audit/audit-log.entity';
import { ProductsModule } from '../products/products.module';
import { Plan, PlatformSettings, SubscriptionPayment, SupportMessage } from './entities/saas.entity';
import { Sector, SectorCategory, SectorItem, ServiceOffer } from './entities/sector.entity';
import { SaasSettingsService } from './saas-settings.service';
import { SubscriptionService } from './subscription.service';
import { SectorsService } from './sectors.service';
import { AdminGuard } from './admin.guard';
import { PaymentGatewayService } from './payment-gateway.service';
import { AdminSaasController, BillingController, PublicController, SuggestionsController } from './saas.controllers';

/**
 * Couche SaaS : essai gratuit, abonnements, paiement en ligne (Flouci), secteurs d'activité, administration de la plateforme.
 * Global : l'authentification (JwtStrategy, AccessGuard) lit l'état du compte à chaque requête.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuditLog, PlatformSettings, Plan, SubscriptionPayment, SupportMessage, Sector, SectorCategory, SectorItem, ServiceOffer]),
    ProductsModule,
  ],
  controllers: [PublicController, BillingController, SuggestionsController, AdminSaasController],
  providers: [SaasSettingsService, SubscriptionService, SectorsService, AdminGuard, PaymentGatewayService],
  exports: [SaasSettingsService, SubscriptionService, SectorsService, AdminGuard, PaymentGatewayService],
})
export class SaasModule {}
