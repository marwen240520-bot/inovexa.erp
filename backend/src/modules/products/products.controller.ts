import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Produits')
@ApiBearerAuth()
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
    return this.productsService.importProducts(req.user.userId, body.products);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.findOne(id, req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: CreateProductDto) {
    return this.productsService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.productsService.delete(id, req.user.userId);
  }
}