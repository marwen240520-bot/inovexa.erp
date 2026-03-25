import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { Employee } from './entities/employee.entity';
import { Leave } from './entities/leave.entity';
import { Payroll } from './entities/payroll.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Leave, Payroll])],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
