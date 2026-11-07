import { Controller, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { InjectDataSource, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Notification } from './notification.entity';
import { MailService } from '../../common/mail/mail.service';
import { CompanyService } from '../company/company.service';

const REFRESH_EVERY_MS = 5 * 60_000;

/** Numéro de semaine ISO (AAAA-Sxx) : une alerte persistante est rappelée une fois par semaine. */
function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  return `${t.getUTCFullYear()}-S${String(Math.ceil(((t.getTime() - yearStart) / 86_400_000 + 1) / 7)).padStart(2, '0')}`;
}

@Injectable()
export class NotificationsService {
  private readonly lastRefresh = new Map<number, number>();

  constructor(@InjectDataSource() private readonly ds: DataSource, private readonly mail: MailService, private readonly company: CompanyService) {}

  /**
   * Génère les alertes du jour à partir des données (stock bas, factures en retard, devis qui expirent, lots proches de la
   * péremption, échéances fournisseurs). Idempotent grâce à la clé de déduplication : on peut l'appeler à volonté.
   */
  async refresh(userId: number, force = false) {
    const last = this.lastRefresh.get(userId) || 0;
    if (!force && Date.now() - last < REFRESH_EVERY_MS) return { refreshed: false };
    this.lastRefresh.set(userId, Date.now());
    const week = weekKey();

    // Stock bas / rupture
    await this.ds.query(
      `INSERT INTO "notifications" ("userId","type","severity","title","body","link","dedupeKey")
       SELECT p."userId", 'low_stock', CASE WHEN p."quantity" <= 0 THEN 'critical' ELSE 'warning' END,
              CASE WHEN p."quantity" <= 0 THEN 'Rupture de stock : ' ELSE 'Stock bas : ' END || p."name",
              'Stock actuel ' || trim(trailing '.' from trim(trailing '0' from p."quantity"::text)) || ' pour un seuil d''alerte de ' || trim(trailing '.' from trim(trailing '0' from p."minStock"::text)) || '.',
              '/dashboard/stock', 'low_stock:' || p."id" || ':' || CASE WHEN p."quantity" <= 0 THEN 'out' ELSE 'low' END || ':' || $2
         FROM "products" p WHERE p."userId" = $1 AND p."isStockable" = true AND p."quantity" <= p."minStock"
       ON CONFLICT ("userId","dedupeKey") DO NOTHING`,
      [userId, week],
    );
    // Factures clients en retard (l'alerte monte d'un cran à 30 et 60 jours)
    await this.ds.query(
      `INSERT INTO "notifications" ("userId","type","severity","title","body","link","dedupeKey")
       SELECT d."userId", 'invoice_overdue', CASE WHEN CURRENT_DATE - d."dueDate" > 60 THEN 'critical' ELSE 'warning' END,
              'Facture ' || d."number" || ' en retard de ' || (CURRENT_DATE - d."dueDate") || ' jours',
              d."partyName" || ' — solde dû ' || to_char(d."balanceDue",'FM999G999G990D000') || ' ' || d."currency" || '.',
              '/dashboard/documents/' || d."id",
              'invoice_overdue:' || d."id" || ':' || CASE WHEN CURRENT_DATE - d."dueDate" > 60 THEN 3 WHEN CURRENT_DATE - d."dueDate" > 30 THEN 2 ELSE 1 END
         FROM "documents" d WHERE d."userId" = $1 AND d."type" = 'invoice' AND d."lockedAt" IS NOT NULL AND d."status" <> 'cancelled'
          AND d."paymentStatus" IN ('unpaid','partial') AND d."dueDate" < CURRENT_DATE
       ON CONFLICT ("userId","dedupeKey") DO NOTHING`,
      [userId],
    );
    // Devis qui expirent sous 3 jours
    await this.ds.query(
      `INSERT INTO "notifications" ("userId","type","severity","title","body","link","dedupeKey")
       SELECT d."userId", 'quote_expiring', 'info', 'Devis ' || d."number" || ' expire le ' || to_char(d."validUntil",'DD/MM/YYYY'),
              d."partyName" || ' — ' || to_char(d."totalTTC",'FM999G999G990D000') || ' ' || d."currency" || ' TTC.', '/dashboard/documents/' || d."id", 'quote_expiring:' || d."id"
         FROM "documents" d WHERE d."userId" = $1 AND d."type" = 'quote' AND d."status" IN ('validated','sent') AND d."validUntil" BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
       ON CONFLICT ("userId","dedupeKey") DO NOTHING`,
      [userId],
    );
    // Lots proches de la péremption (30 jours) ou périmés
    await this.ds.query(
      `INSERT INTO "notifications" ("userId","type","severity","title","body","link","dedupeKey")
       SELECT l."userId", 'lot_expiring', CASE WHEN l."expiryDate" <= CURRENT_DATE + 7 THEN 'critical' ELSE 'warning' END,
              CASE WHEN l."expiryDate" < CURRENT_DATE THEN 'Lot périmé : ' ELSE 'Lot à écouler : ' END || p."name" || ' (' || l."lotNumber" || ')',
              'Péremption le ' || to_char(l."expiryDate",'DD/MM/YYYY') || ' — quantité ' || trim(trailing '.' from trim(trailing '0' from l."quantity"::text)) || '.',
              '/dashboard/stock', 'lot_expiring:' || l."id" || ':' || CASE WHEN l."expiryDate" < CURRENT_DATE THEN 'expired' WHEN l."expiryDate" <= CURRENT_DATE + 7 THEN 'w1' ELSE 'm1' END
         FROM "stock_lots" l JOIN "products" p ON p."id" = l."productId"
        WHERE l."userId" = $1 AND l."quantity" > 0 AND l."expiryDate" IS NOT NULL AND l."expiryDate" <= CURRENT_DATE + 30
       ON CONFLICT ("userId","dedupeKey") DO NOTHING`,
      [userId],
    );
    // Factures fournisseurs à payer sous 7 jours
    await this.ds.query(
      `INSERT INTO "notifications" ("userId","type","severity","title","body","link","dedupeKey")
       SELECT d."userId", 'payment_due', CASE WHEN d."dueDate" < CURRENT_DATE THEN 'warning' ELSE 'info' END,
              'Facture fournisseur ' || d."number" || CASE WHEN d."dueDate" < CURRENT_DATE THEN ' échue' ELSE ' à payer avant le ' || to_char(d."dueDate",'DD/MM/YYYY') END,
              d."partyName" || ' — solde ' || to_char(d."balanceDue",'FM999G999G990D000') || ' ' || d."currency" || '.', '/dashboard/documents/' || d."id",
              'payment_due:' || d."id" || ':' || CASE WHEN d."dueDate" < CURRENT_DATE THEN 'late' ELSE 'soon' END
         FROM "documents" d WHERE d."userId" = $1 AND d."type" = 'supplier_invoice' AND d."lockedAt" IS NOT NULL AND d."status" <> 'cancelled'
          AND d."paymentStatus" IN ('unpaid','partial') AND d."dueDate" <= CURRENT_DATE + 7
       ON CONFLICT ("userId","dedupeKey") DO NOTHING`,
      [userId],
    );
    // Nettoyage : les alertes lues depuis plus de 90 jours disparaissent
    await this.ds.query(`DELETE FROM "notifications" WHERE "userId" = $1 AND "readAt" IS NOT NULL AND "readAt" < now() - interval '90 days'`, [userId]);
    return { refreshed: true };
  }

  async list(userId: number, f: { unread?: boolean; limit?: number }) {
    await this.refresh(userId);
    const qb = this.ds.getRepository(Notification).createQueryBuilder('n').where('n.userId = :userId', { userId });
    if (f.unread) qb.andWhere('n.readAt IS NULL');
    const items = await qb
      .orderBy(`CASE n.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END`, 'ASC')
      .addOrderBy('n.createdAt', 'DESC')
      .take(Math.min(f.limit || 50, 200))
      .getMany();
    const [{ unread, critical }] = await this.ds.query(
      `SELECT COUNT(*) FILTER (WHERE "readAt" IS NULL)::int AS unread, COUNT(*) FILTER (WHERE "readAt" IS NULL AND "severity" = 'critical')::int AS critical FROM "notifications" WHERE "userId" = $1`,
      [userId],
    );
    return { unread, critical, items };
  }

  async markRead(userId: number, id: number) {
    const [rows] = await this.ds.query(`UPDATE "notifications" SET "readAt" = now() WHERE "id" = $1 AND "userId" = $2 RETURNING "id"`, [id, userId]);
    if (!rows?.length) throw new NotFoundException('Notification introuvable');
    return { read: true };
  }

  async markAllRead(userId: number) {
    const res = await this.ds.query(`UPDATE "notifications" SET "readAt" = now() WHERE "userId" = $1 AND "readAt" IS NULL`, [userId]);
    return { marked: Array.isArray(res) ? res[1] ?? 0 : 0 };
  }

  /** Envoie par email le récapitulatif des alertes importantes non encore envoyées. */
  async sendDigest(userId: number) {
    await this.refresh(userId, true);
    const items = await this.ds.getRepository(Notification).createQueryBuilder('n')
      .where('n.userId = :userId AND n.readAt IS NULL AND n.emailedAt IS NULL AND n.severity IN (:...sev)', { userId, sev: ['warning', 'critical'] })
      .orderBy('n.createdAt', 'DESC').take(100).getMany();
    if (!items.length) return { sent: false, count: 0, reason: 'Aucune nouvelle alerte importante.' };
    const company = await this.company.getOrCreate(userId);
    const to = company.email;
    if (!to) return { sent: false, count: items.length, reason: 'Renseignez l’email de la société pour recevoir le récapitulatif.' };
    const text = `Bonjour,\n\nVoici vos alertes du jour :\n\n${items.map((i) => `- [${i.severity === 'critical' ? 'URGENT' : 'à suivre'}] ${i.title}${i.body ? ` — ${i.body}` : ''}`).join('\n')}\n\nInovexa ERP`;
    await this.mail.send({ to, subject: `${items.length} alerte(s) à traiter — ${company.legalName || 'Inovexa ERP'}`, text });
    await this.ds.query(`UPDATE "notifications" SET "emailedAt" = now() WHERE "id" = ANY($1)`, [items.map((i) => i.id)]);
    return { sent: true, count: items.length, to };
  }
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get() @ApiOperation({ summary: 'Alertes (stock, retards, devis, péremption) ; générées à la demande' })
  list(@Request() req: any, @Query('unread') unread?: string, @Query('limit') limit?: string) {
    return this.svc.list(req.user.userId, { unread: unread === '1' || unread === 'true', limit: Number(limit) || undefined });
  }

  @Post('refresh') refresh(@Request() req: any) { return this.svc.refresh(req.user.userId, true); }
  @Post('read-all') readAll(@Request() req: any) { return this.svc.markAllRead(req.user.userId); }
  @Post('digest') @ApiOperation({ summary: 'Envoie par email le récapitulatif des alertes importantes' })
  digest(@Request() req: any) { return this.svc.sendDigest(req.user.userId); }
  @Post(':id/read') read(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.svc.markRead(req.user.userId, id); }
}

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
