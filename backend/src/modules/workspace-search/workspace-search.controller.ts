import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceSearchService } from './workspace-search.service';

@Controller('workspace-search')
@UseGuards(JwtAuthGuard)
export class WorkspaceSearchController {
  constructor(private readonly searchService: WorkspaceSearchService) {}

  /** GET /workspace-search?q=alpha&limit=5 */
  @Get()
  async search(@Request() req: any, @Query('q') q: string, @Query('limit') limit?: string) {
    return this.searchService.search(req.user.userId, q, limit ? parseInt(limit, 10) : undefined);
  }
}
