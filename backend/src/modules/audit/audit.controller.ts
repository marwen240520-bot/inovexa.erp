import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('audit')
@UseGuards(AuthGuard('jwt'))
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }

  @Get('entity/:entity')
  findByEntity(@Param('entity') entity: string) {
    return this.auditService.findByEntity(entity);
  }

  @Get('entity/:entity/:id')
  findByEntityAndId(@Param('entity') entity: string, @Param('id') id: string) {
    return this.auditService.findByEntity(entity, id);
  }
}
