import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogs } from './audit_logs.entity';
import { AuditLogsService } from './audit_logs.service';
import { AuditLogsController } from './audit_logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogs])],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
