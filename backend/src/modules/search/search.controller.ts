import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SearchModuleService } from './search.service';
import { CreateSearchModuleDto } from './dto/create-search.dto';
import { UpdateSearchModuleDto } from './dto/update-search.dto';

@Controller('search')
export class SearchModuleController {
  constructor(private readonly searchService: SearchModuleService) {}

  @Post()
  create(@Body() createDto: CreateSearchModuleDto) {
    return this.searchService.create(createDto);
  }

  @Get()
  findAll() {
    return this.searchService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.searchService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSearchModuleDto) {
    return this.searchService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.searchService.remove(id);
  }
}
