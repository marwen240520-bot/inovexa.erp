import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.productsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.productsService.findOne(parseInt(id), userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.productsService.create(userId, body);
  }

  // ⭐ NOUVEAU: Endpoint pour l'import multiple
  @Post('import')
  async importProducts(@Request() req: any, @Body() body: { products: any[] }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('📥 Import de', body.products?.length, 'produits pour user', userId);
    return this.productsService.importProducts(userId, body.products || []);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.productsService.update(parseInt(id), userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.productsService.delete(parseInt(id), userId);
  }
}