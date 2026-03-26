import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  search(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return { results: [], total: 0 };
    }
    return this.service.search(query);
  }
}
