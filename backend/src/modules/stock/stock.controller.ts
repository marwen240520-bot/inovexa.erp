import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StockService } from './stock.service';
import { StockReportsService } from './stock-reports.service';
import { StockCountsService } from './stock-counts.service';
import { AdjustmentDto, CostDto, CountCreateDto, CountLinesDto, ProductStockSettingsDto, TransferDto, WarehouseDto } from './stock.dto';
import { Product } from '../products/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

const int = (v?: string) => (v === undefined || v === '' ? undefined : Number.parseInt(v, 10));
const actor = (req: any): number => req.user.actorId ?? req.user.userId;

@ApiTags('Stock')
@ApiBearerAuth()
@Controller('stock')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class StockController {
  constructor(
    private readonly stock: StockService,
    private readonly reports: StockReportsService,
    private readonly counts: StockCountsService,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  // ── Dépôts ──
  @Get('warehouses') @ApiOperation({ summary: 'Liste des dépôts (crée le dépôt principal si besoin)' })
  warehouses(@Request() req: any) { return this.stock.listWarehouses(req.user.userId); }

  @Post('warehouses') @ApiOperation({ summary: 'Crée un dépôt' })
  createWarehouse(@Request() req: any, @Body() dto: WarehouseDto) { return this.stock.createWarehouse(req.user.userId, dto); }

  @Put('warehouses/:id') @ApiOperation({ summary: 'Modifie / désactive un dépôt, ou le désigne par défaut' })
  updateWarehouse(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: WarehouseDto) { return this.stock.updateWarehouse(req.user.userId, id, dto); }

  // ── Consultation ──
  @Get('levels') @ApiOperation({ summary: 'Stock par produit et par dépôt' })
  levels(@Request() req: any, @Query('warehouseId') warehouseId?: string, @Query('search') search?: string, @Query('lowOnly') lowOnly?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.reports.levels(req.user.userId, { warehouseId: int(warehouseId), search, lowOnly: lowOnly === 'true', limit: int(limit), offset: int(offset) });
  }

  @Get('valuation') @ApiOperation({ summary: 'Valorisation du stock (CMUP) par dépôt et catégorie' })
  valuation(@Request() req: any) { return this.reports.valuation(req.user.userId); }

  @Get('movements') @ApiOperation({ summary: 'Journal des mouvements de stock' })
  movements(@Request() req: any, @Query('productId') productId?: string, @Query('warehouseId') warehouseId?: string, @Query('reason') reason?: string, @Query('type') type?: string,
    @Query('refType') refType?: string, @Query('refId') refId?: string, @Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.reports.movements(req.user.userId, { productId: int(productId), warehouseId: int(warehouseId), reason, type, refType, refId, from, to, limit: int(limit), offset: int(offset) });
  }

  @Get('card/:productId') @ApiOperation({ summary: 'Fiche de stock d’un produit (report, mouvements, solde cumulé)' })
  card(@Request() req: any, @Param('productId', ParseIntPipe) productId: number, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.card(req.user.userId, productId, from, to);
  }

  @Get('alerts') @ApiOperation({ summary: 'Ruptures, stocks bas et lots à péremption proche' })
  alerts(@Request() req: any, @Query('expiryDays') expiryDays?: string) { return this.reports.alerts(req.user.userId, int(expiryDays) ?? 60); }

  @Get('lots') @ApiOperation({ summary: 'Lots en stock (péremption)' })
  lots(@Request() req: any, @Query('productId') productId?: string, @Query('warehouseId') warehouseId?: string, @Query('expiringInDays') expiringInDays?: string) {
    return this.reports.lots(req.user.userId, { productId: int(productId), warehouseId: int(warehouseId), expiringInDays: int(expiringInDays) });
  }

  @Get('rotation') @ApiOperation({ summary: 'Rotation du stock sur une période' })
  rotation(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    const end = to || new Date().toISOString().slice(0, 10);
    const start = from || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    return this.reports.rotation(req.user.userId, start, end);
  }

  // ── Opérations ──
  @Post('adjustments') @ApiOperation({ summary: 'Ajustement manuel (casse, perte, retrouvé, correction) avec motif' })
  adjust(@Request() req: any, @Body() dto: AdjustmentDto) { return this.stock.adjust(req.user.userId, actor(req), dto); }

  @Post('transfers') @ApiOperation({ summary: 'Transfert entre deux dépôts' })
  transfer(@Request() req: any, @Body() dto: TransferDto) { return this.stock.transfer(req.user.userId, actor(req), dto); }

  @Get('reconcile') @ApiOperation({ summary: 'Contrôle de cohérence stock produit / dépôts (lecture seule)' })
  checkReconcile(@Request() req: any) { return this.stock.reconcile(req.user.userId, false); }

  @Post('reconcile') @ApiOperation({ summary: 'Contrôle de cohérence stock produit / dépôts (fix=true pour corriger)' })
  reconcile(@Request() req: any, @Query('fix') fix?: string) { return this.stock.reconcile(req.user.userId, fix === 'true'); }

  @Patch('products/:id/cost') @ApiOperation({ summary: 'Définit le coût moyen d’un produit' })
  cost(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: CostDto) { return this.stock.setAverageCost(req.user.userId, id, dto.avgCost); }

  @Patch('products/:id/settings') @ApiOperation({ summary: 'Seuil d’alerte, unité, TVA, code-barres, suivi par lot d’un produit' })
  async settings(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: ProductStockSettingsDto) {
    const product = await this.products.findOne({ where: { id, userId: req.user.userId } });
    if (!product) throw new NotFoundException('Produit introuvable');
    Object.assign(product, dto);
    return this.products.save(product);
  }

  // ── Inventaires physiques ──
  @Get('counts') countsList(@Request() req: any) { return this.counts.list(req.user.userId); }
  @Get('counts/:id') countGet(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.counts.get(req.user.userId, id); }
  @Post('counts') @ApiOperation({ summary: 'Ouvre un inventaire (fige le stock théorique du dépôt)' })
  countCreate(@Request() req: any, @Body() dto: CountCreateDto) { return this.counts.create(req.user.userId, actor(req), dto); }
  @Put('counts/:id/lines') @ApiOperation({ summary: 'Saisit les quantités comptées' })
  countLines(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: CountLinesDto) { return this.counts.saveLines(req.user.userId, id, dto.lines); }
  @Post('counts/:id/validate') @ApiOperation({ summary: 'Valide l’inventaire : génère les ajustements d’écart' })
  countValidate(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.counts.validate(req.user.userId, actor(req), id); }
  @Post('counts/:id/cancel') countCancel(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.counts.cancel(req.user.userId, id); }
}
