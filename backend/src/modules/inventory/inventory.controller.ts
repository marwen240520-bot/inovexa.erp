import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Product } from './entities/product.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('products')
  findAllProducts() {
    return this.inventoryService.findAllProducts();
  }

  @Get('products/:id')
  findProductById(@Param('id') id: string) {
    return this.inventoryService.findProductById(id);
  }

  @Post('products')
  createProduct(@Body() data: Partial<Product>) {
    return this.inventoryService.createProduct(data);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() data: Partial<Product>) {
    return this.inventoryService.updateProduct(id, data);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.inventoryService.deleteProduct(id);
  }

  @Get('stock/status')
  getStockStatus() {
    return this.inventoryService.getStockStatus();
  }

  @Get('suppliers')
  findAllSuppliers() {
    return this.inventoryService.findAllSuppliers();
  }

  @Get('categories')
  findAllCategories() {
    return this.inventoryService.findAllCategories();
  }
}
