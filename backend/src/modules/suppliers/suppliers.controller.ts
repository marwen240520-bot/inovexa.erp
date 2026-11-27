import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, SupplierStatusDto, UpdateSupplierDto } from './suppliers.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Fournisseurs')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.suppliersService.findAll(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.suppliersService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.suppliersService.findOne(id, req.user.userId);
  }

  // ⚠️ Route d'import : le front appelle POST /suppliers/import
  @Post('import')
  async importSuppliers(@Request() req: any, @Body() body: { suppliers: any[] }) {
    return this.suppliersService.importSuppliers(req.user.userId, body?.suppliers);
  }

  @Post()
  async create(@Request() req: any, @Body() body: CreateSupplierDto) {
    return this.suppliersService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: UpdateSupplierDto) {
    return this.suppliersService.update(id, req.user.userId, body);
  }

  // Activer / désactiver : le site appelait cette route, qui n'existait pas (il retombait sur un repli silencieux).
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: SupplierStatusDto) {
    return this.suppliersService.updateStatus(id, req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.suppliersService.delete(id, req.user.userId);
  }
}
