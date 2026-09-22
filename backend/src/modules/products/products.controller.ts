import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.productsService.findAll(req.user.userId);
  }

  // ⚠️ DOIT être AVANT ':id' sinon NestJS capture "import" comme :id
  @Post('import')
  async importProducts(@Request() req: any, @Body() body: { products: any[] }) {
    console.log('[ProductsController] Body reçu:', JSON.stringify(body).substring(0, 500));
    console.log('[ProductsController] Nombre de produits:', body?.products?.length);
    return this.productsService.importProducts(req.user.userId, body.products);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.productsService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.productsService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.productsService.update(parseInt(id), req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.productsService.delete(parseInt(id), req.user.userId);
  }
}