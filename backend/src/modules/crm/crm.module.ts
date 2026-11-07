import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Request, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { InjectDataSource, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Interaction } from './entities/interaction.entity';
import { PriceList, PriceListItem } from './entities/price-list.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { Product } from '../products/product.entity';
import { validateTaxId } from '../../common/fiscal';
import { round } from '../../common/money';

class PriceListDto {
  @IsString() @MaxLength(120) name: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
class PriceItemDto {
  @IsInt() productId: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(1e9) price: number;
}
class PriceItemsDto {
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => PriceItemDto) items: PriceItemDto[];
}
class InteractionDto {
  @IsIn(['client', 'supplier']) partyType: 'client' | 'supplier';
  @IsInt() partyId: number;
  @IsIn(['call', 'email', 'meeting', 'note', 'reminder', 'visit']) kind: string;
  @IsString() @MaxLength(200) subject: string;
  @IsOptional() @IsString() @MaxLength(5000) content?: string;
  @IsOptional() @IsDateString() followUpDate?: string;
}
class ConditionsDto {
  @IsOptional() @IsInt() @Min(0) @Max(365) paymentTermsDays?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) creditLimit?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) discountPct?: number;
  @IsOptional() @IsInt() priceListId?: number | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) withholdingRate?: number;
  @IsOptional() @IsString() @MaxLength(40) taxId?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

@Injectable()
export class CrmService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Listes de prix ──
  async priceLists(userId: number) {
    const rows = await this.ds.query(
      `SELECT l."id", l."name", l."active", l."createdAt", (SELECT COUNT(*)::int FROM "price_list_items" i WHERE i."priceListId" = l."id") AS "itemCount",
              (SELECT COUNT(*)::int FROM "clients" c WHERE c."priceListId" = l."id") AS "clientCount"
         FROM "price_lists" l WHERE l."userId" = $1 ORDER BY l."name"`,
      [userId],
    );
    return rows;
  }

  private async ownList(userId: number, id: number) {
    const list = await this.ds.getRepository(PriceList).findOne({ where: { id, userId } });
    if (!list) throw new NotFoundException('Liste de prix introuvable');
    return list;
  }

  async createPriceList(userId: number, dto: PriceListDto) {
    return this.ds.getRepository(PriceList).save(this.ds.getRepository(PriceList).create({ userId, name: dto.name.trim(), active: dto.active ?? true }));
  }

  async updatePriceList(userId: number, id: number, dto: PriceListDto) {
    const list = await this.ownList(userId, id);
    list.name = dto.name.trim();
    if (dto.active !== undefined) list.active = dto.active;
    return this.ds.getRepository(PriceList).save(list);
  }

  async deletePriceList(userId: number, id: number) {
    await this.ownList(userId, id);
    await this.ds.transaction(async (em) => {
      await em.query(`UPDATE "clients" SET "priceListId" = NULL WHERE "userId" = $1 AND "priceListId" = $2`, [userId, id]);
      await em.query(`DELETE FROM "price_list_items" WHERE "priceListId" = $1`, [id]);
      await em.query(`DELETE FROM "price_lists" WHERE "id" = $1`, [id]);
    });
    return { deleted: true };
  }

  async priceListItems(userId: number, id: number) {
    await this.ownList(userId, id);
    const rows = await this.ds.query(
      `SELECT i."productId", p."name", p."sku", i."price", p."price" AS "catalogPrice" FROM "price_list_items" i JOIN "products" p ON p."id" = i."productId" WHERE i."priceListId" = $1 ORDER BY p."name"`,
      [id],
    );
    return rows.map((r: any) => ({ ...r, price: Number(r.price), catalogPrice: Number(r.catalogPrice) }));
  }

  /** Remplace le contenu de la liste. */
  async setPriceListItems(userId: number, id: number, items: PriceItemDto[]) {
    await this.ownList(userId, id);
    const ids = [...new Set(items.map((i) => i.productId))];
    if (ids.length !== items.length) throw new BadRequestException('Un produit apparaît deux fois dans la liste.');
    if (ids.length) {
      const [{ n }] = await this.ds.query(`SELECT COUNT(*)::int AS n FROM "products" WHERE "userId" = $1 AND "id" = ANY($2)`, [userId, ids]);
      if (n !== ids.length) throw new BadRequestException('Un des produits est introuvable.');
    }
    await this.ds.transaction(async (em) => {
      await em.query(`DELETE FROM "price_list_items" WHERE "priceListId" = $1`, [id]);
      if (items.length) await em.getRepository(PriceListItem).save(items.map((i) => em.getRepository(PriceListItem).create({ priceListId: id, productId: i.productId, price: round(i.price, 3) })));
    });
    return this.priceListItems(userId, id);
  }

  // ── Conditions commerciales ──
  async setConditions(userId: number, partyType: 'client' | 'supplier', id: number, dto: ConditionsDto) {
    const repo = partyType === 'client' ? this.ds.getRepository(Client) : this.ds.getRepository(Supplier);
    const party: any = await (repo as any).findOne({ where: { id, userId } });
    if (!party) throw new NotFoundException(partyType === 'client' ? 'Client introuvable' : 'Fournisseur introuvable');
    if (dto.taxId !== undefined) {
      const check = validateTaxId(dto.taxId);
      if (!check.valid) throw new BadRequestException(check.message);
      party.taxId = check.normalized || null;
    }
    if (dto.paymentTermsDays !== undefined) party.paymentTermsDays = dto.paymentTermsDays;
    if (dto.withholdingRate !== undefined) party.withholdingRate = dto.withholdingRate;
    if (dto.notes !== undefined) party.notes = dto.notes || null;
    if (partyType === 'client') {
      if (dto.creditLimit !== undefined) party.creditLimit = dto.creditLimit;
      if (dto.discountPct !== undefined) party.discountPct = dto.discountPct;
      if (dto.priceListId !== undefined) {
        if (dto.priceListId) await this.ownList(userId, dto.priceListId);
        party.priceListId = dto.priceListId;
      }
    }
    return (repo as any).save(party);
  }

  // ── Interactions ──
  private async assertParty(userId: number, type: string, id: number) {
    const table = type === 'client' ? 'clients' : 'suppliers';
    const rows = await this.ds.query(`SELECT 1 FROM "${table}" WHERE "id" = $1 AND "userId" = $2`, [id, userId]);
    if (!rows.length) throw new NotFoundException(type === 'client' ? 'Client introuvable' : 'Fournisseur introuvable');
  }

  async addInteraction(userId: number, actorId: number, dto: InteractionDto) {
    await this.assertParty(userId, dto.partyType, dto.partyId);
    return this.ds.getRepository(Interaction).save(
      this.ds.getRepository(Interaction).create({ userId, partyType: dto.partyType, partyId: dto.partyId, kind: dto.kind, subject: dto.subject.trim(), content: dto.content || null, documentId: null, level: null, followUpDate: dto.followUpDate?.slice(0, 10) || null, createdBy: actorId }),
    );
  }

  async interactions(userId: number, f: { partyType?: string; partyId?: number; kind?: string; limit?: number }) {
    const qb = this.ds.getRepository(Interaction).createQueryBuilder('i').where('i.userId = :userId', { userId });
    if (f.partyType) qb.andWhere('i.partyType = :pt', { pt: f.partyType });
    if (f.partyId) qb.andWhere('i.partyId = :pid', { pid: f.partyId });
    if (f.kind) qb.andWhere('i.kind = :k', { k: f.kind });
    return qb.orderBy('i.createdAt', 'DESC').take(Math.min(f.limit || 100, 500)).getMany();
  }

  async deleteInteraction(userId: number, id: number) {
    const repo = this.ds.getRepository(Interaction);
    const it = await repo.findOne({ where: { id, userId } });
    if (!it) throw new NotFoundException('Interaction introuvable');
    if (it.kind === 'reminder') throw new BadRequestException('Une relance de facture reste dans l’historique.');
    await repo.delete({ id });
    return { deleted: true };
  }

  /** Actions à mener : interactions avec une date de suivi échue ou proche. */
  async followUps(userId: number, days = 7) {
    const rows = await this.ds.query(
      `SELECT i."id", i."partyType", i."partyId", i."kind", i."subject", to_char(i."followUpDate",'YYYY-MM-DD') AS "followUpDate", i."documentId",
              COALESCE(c."name", s."name") AS "partyName"
         FROM "crm_interactions" i LEFT JOIN "clients" c ON i."partyType" = 'client' AND c."id" = i."partyId" LEFT JOIN "suppliers" s ON i."partyType" = 'supplier' AND s."id" = i."partyId"
        WHERE i."userId" = $1 AND i."followUpDate" IS NOT NULL AND i."followUpDate" <= (CURRENT_DATE + $2::int)
          AND NOT EXISTS (SELECT 1 FROM "crm_interactions" n WHERE n."userId" = i."userId" AND n."partyType" = i."partyType" AND n."partyId" = i."partyId" AND n."createdAt" > i."createdAt" AND n."id" <> i."id")
        ORDER BY i."followUpDate" LIMIT 200`,
      [userId, days],
    );
    return rows.map((r: any) => ({ ...r, overdue: r.followUpDate < today() }));
  }

  // ── Fiche 360° ──
  async overview(userId: number, partyType: 'client' | 'supplier', id: number) {
    const table = partyType === 'client' ? 'clients' : 'suppliers';
    const [party] = await this.ds.query(`SELECT * FROM "${table}" WHERE "id" = $1 AND "userId" = $2`, [id, userId]);
    if (!party) throw new NotFoundException(partyType === 'client' ? 'Client introuvable' : 'Fournisseur introuvable');
    const invoiceType = partyType === 'client' ? 'invoice' : 'supplier_invoice';
    const creditType = partyType === 'client' ? 'credit_note' : 'supplier_credit_note';
    const [stats] = await this.ds.query(
      `SELECT
         COALESCE(SUM("totalTTC") FILTER (WHERE "type" = $3 AND "issueDate" >= CURRENT_DATE - 365),0) AS "billed12m",
         COALESCE(SUM("totalTTC") FILTER (WHERE "type" = $4 AND "issueDate" >= CURRENT_DATE - 365),0) AS "credited12m",
         COALESCE(SUM("balanceDue") FILTER (WHERE "type" = $3 AND "paymentStatus" IN ('unpaid','partial')),0) AS "outstanding",
         COALESCE(SUM("balanceDue") FILTER (WHERE "type" = $3 AND "paymentStatus" IN ('unpaid','partial') AND "dueDate" < CURRENT_DATE),0) AS "overdue",
         COALESCE(SUM("balanceDue") FILTER (WHERE "type" = $4 AND "paymentStatus" IN ('unpaid','partial')),0) AS "creditsAvailable",
         COUNT(*) FILTER (WHERE "type" = $3)::int AS "invoiceCount",
         to_char(MAX("issueDate") FILTER (WHERE "type" = $3),'YYYY-MM-DD') AS "lastInvoice"
         FROM "documents" WHERE "userId" = $1 AND "partyType" = $2 AND "partyId" = $5 AND "lockedAt" IS NOT NULL AND "status" <> 'cancelled'`,
      [userId, partyType, invoiceType, creditType, id],
    );
    // Délai moyen de règlement : écart entre la date de facture et le dernier règlement, sur les factures soldées
    const [delay] = await this.ds.query(
      `SELECT AVG(("lastPay" - "issueDate"))::float AS "avgDays", COUNT(*)::int AS "n" FROM (
         SELECT d."issueDate", (SELECT MAX(p."date") FROM "payments" p WHERE p."documentId" = d."id" AND p."voidedAt" IS NULL) AS "lastPay"
           FROM "documents" d WHERE d."userId" = $1 AND d."partyType" = $2 AND d."partyId" = $3 AND d."type" = $4 AND d."paymentStatus" = 'paid' AND d."lockedAt" IS NOT NULL) x WHERE "lastPay" IS NOT NULL`,
      [userId, partyType, id, invoiceType],
    );
    const topProducts = await this.ds.query(
      `SELECT l."productId", l."description", SUM(l."quantity")::float AS "quantity", SUM(l."netHT")::float AS "revenue"
         FROM "document_lines" l JOIN "documents" d ON d."id" = l."documentId"
        WHERE d."userId" = $1 AND d."partyType" = $2 AND d."partyId" = $3 AND d."type" = $4 AND d."lockedAt" IS NOT NULL AND d."status" <> 'cancelled'
        GROUP BY l."productId", l."description" ORDER BY SUM(l."netHT") DESC LIMIT 5`,
      [userId, partyType, id, invoiceType],
    );
    const recent = await this.ds.query(
      `SELECT "id","type","number","status","paymentStatus", to_char("issueDate",'YYYY-MM-DD') AS "issueDate", "totalTTC","balanceDue" FROM "documents"
        WHERE "userId" = $1 AND "partyType" = $2 AND "partyId" = $3 AND "number" IS NOT NULL ORDER BY "issueDate" DESC, "id" DESC LIMIT 10`,
      [userId, partyType, id],
    );
    const interactions = await this.interactions(userId, { partyType, partyId: id, limit: 10 });
    const outstanding = Number(stats.outstanding);
    const creditLimit = party.creditLimit === null || party.creditLimit === undefined ? null : Number(party.creditLimit);
    return {
      party: { ...party, creditLimit },
      kpis: {
        billed12m: Number(stats.billed12m), credited12m: Number(stats.credited12m), netRevenue12m: round(Number(stats.billed12m) - Number(stats.credited12m), 3),
        outstanding, overdue: Number(stats.overdue), creditsAvailable: Number(stats.creditsAvailable), invoiceCount: stats.invoiceCount, lastInvoice: stats.lastInvoice,
        averagePaymentDays: delay.n ? round(delay.avgDays, 1) : null,
        creditLimit, creditUsedPct: creditLimit ? round((outstanding / creditLimit) * 100, 1) : null, overCreditLimit: creditLimit !== null && outstanding > creditLimit,
      },
      topProducts: topProducts.map((p: any) => ({ ...p, revenue: round(p.revenue, 3) })),
      recentDocuments: recent.map((d: any) => ({ ...d, totalTTC: Number(d.totalTTC), balanceDue: Number(d.balanceDue) })),
      interactions,
    };
  }
}

/** CRM : conditions commerciales, listes de prix, historique des échanges, relances et fiche 360° d'un client / fournisseur. */
@ApiTags('CRM')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('price-lists') priceLists(@Request() req: any) { return this.crm.priceLists(req.user.userId); }
  @Post('price-lists') createList(@Request() req: any, @Body() b: PriceListDto) { return this.crm.createPriceList(req.user.userId, b); }
  @Put('price-lists/:id') updateList(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() b: PriceListDto) { return this.crm.updatePriceList(req.user.userId, id, b); }
  @Delete('price-lists/:id') deleteList(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.crm.deletePriceList(req.user.userId, id); }
  @Get('price-lists/:id/items') listItems(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.crm.priceListItems(req.user.userId, id); }
  @Put('price-lists/:id/items') @ApiOperation({ summary: 'Remplace les prix de la liste' })
  setItems(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() b: PriceItemsDto) { return this.crm.setPriceListItems(req.user.userId, id, b.items); }

  @Put('clients/:id/conditions') @ApiOperation({ summary: 'Délai de paiement, plafond d’encours, remise, liste de prix, retenue, matricule fiscal' })
  clientConditions(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() b: ConditionsDto) { return this.crm.setConditions(req.user.userId, 'client', id, b); }
  @Put('suppliers/:id/conditions')
  supplierConditions(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() b: ConditionsDto) { return this.crm.setConditions(req.user.userId, 'supplier', id, b); }

  @Get('clients/:id/overview') @ApiOperation({ summary: 'Fiche client 360° : encours, retard, délai moyen de règlement, meilleurs produits, historique' })
  clientOverview(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.crm.overview(req.user.userId, 'client', id); }
  @Get('suppliers/:id/overview')
  supplierOverview(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.crm.overview(req.user.userId, 'supplier', id); }

  @Get('interactions') interactions(@Request() req: any, @Query() q: any) { return this.crm.interactions(req.user.userId, { partyType: q.partyType, partyId: Number(q.partyId) || undefined, kind: q.kind, limit: Number(q.limit) || undefined }); }
  @Post('interactions') addInteraction(@Request() req: any, @Body() b: InteractionDto) { return this.crm.addInteraction(req.user.userId, req.user.actorId ?? req.user.userId, b); }
  @Delete('interactions/:id') deleteInteraction(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.crm.deleteInteraction(req.user.userId, id); }
  @Get('follow-ups') followUps(@Request() req: any, @Query('days') days?: string) { return this.crm.followUps(req.user.userId, Number(days) || 7); }
}

@Module({
  imports: [TypeOrmModule.forFeature([Interaction, PriceList, PriceListItem, Client, Supplier, Product])],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
