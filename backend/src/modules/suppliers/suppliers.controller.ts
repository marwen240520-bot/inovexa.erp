import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.suppliersService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.suppliersService.findOne(parseInt(id), userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.suppliersService.create(userId, body);
  }

  // ⭐ NOUVEAU: Endpoint pour l'import multiple
  @Post('import')
  async importSuppliers(@Request() req: any, @Body() body: { suppliers: any[] }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('📥 Import de', body.suppliers?.length, 'fournisseurs pour user', userId);
    return this.suppliersService.importSuppliers(userId, body.suppliers || []);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.suppliersService.update(parseInt(id), userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.suppliersService.delete(parseInt(id), userId);
  }
}