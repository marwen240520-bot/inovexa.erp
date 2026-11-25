import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CustomersModuleService } from './customers.service';
import { CreateCustomersModuleDto } from './dto/create-customers.dto';
import { UpdateCustomersModuleDto } from './dto/update-customers.dto';

import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../saas/admin.guard';
@ApiTags('Clients (CRM historique)')
// Module d'origine sans données de société : réservé à l'administrateur de la plateforme (il était ouvert sans connexion).
@Controller('customers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CustomersModuleController {
  constructor(private readonly customersService: CustomersModuleService) {}

  @Post()
  create(@Body() createDto: CreateCustomersModuleDto) {
    return this.customersService.create(createDto);
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCustomersModuleDto) {
    return this.customersService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
