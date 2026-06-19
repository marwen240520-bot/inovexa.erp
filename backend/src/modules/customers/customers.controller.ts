import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CustomersModuleService } from './customers.service';
import { CreateCustomersModuleDto } from './dto/create-customers.dto';
import { UpdateCustomersModuleDto } from './dto/update-customers.dto';

@Controller('customers')
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
