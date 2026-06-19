import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExportModuleService } from './export.service';
import { CreateExportModuleDto } from './dto/create-export.dto';
import { UpdateExportModuleDto } from './dto/update-export.dto';

@Controller('export')
export class ExportModuleController {
  constructor(private readonly exportService: ExportModuleService) {}

  @Post()
  create(@Body() createDto: CreateExportModuleDto) {
    return this.exportService.create(createDto);
  }

  @Get()
  findAll() {
    return this.exportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exportService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateExportModuleDto) {
    return this.exportService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exportService.remove(id);
  }
}
