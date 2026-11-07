import { Body, Controller, Delete, Get, Module, Param, ParseIntPipe, Post, Put, Query, Request, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Employee } from '../employees/entities/employee.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { Payslip } from './entities/payslip.entity';
import { HrService } from './hr.service';
import { AccountingModule } from '../accounting/accounting.module';

class LeaveDto {
  @IsInt() employeeId: number;
  @IsIn(['paid', 'sick', 'unpaid', 'maternity', 'other']) kind: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}
class GenerateDto {
  @IsInt() @Min(2000) @Max(2100) year: number;
  @IsInt() @Min(1) @Max(12) month: number;
}
class DraftDto {
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) bonuses?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) otherDeductions?: number;
}
class PayDto {
  @IsIn(['cash', 'transfer']) method: 'cash' | 'transfer';
  @IsOptional() @IsDateString() date?: string;
}

const actorId = (req: any) => req.user.actorId ?? req.user.userId;

/** Ressources humaines : congés (solde, demandes, validation) et paie mensuelle paramétrable. */
@ApiTags('RH et paie')
@ApiBearerAuth()
@Controller('hr')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get('leave-requests')
  leaves(@Request() req: any, @Query() q: any) {
    return this.hr.listLeaves(req.user.userId, { employeeId: Number(q.employeeId) || undefined, status: q.status, from: q.from, to: q.to });
  }

  @Post('leave-requests')
  @ApiOperation({ summary: 'Demande de congé (jours ouvrés décomptés, solde et chevauchements contrôlés)' })
  requestLeave(@Request() req: any, @Body() body: LeaveDto) {
    return this.hr.requestLeave(req.user.userId, body);
  }

  @Post('leave-requests/:id/approve')
  approve(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.hr.decideLeave(req.user.userId, actorId(req), id, 'approved'); }

  @Post('leave-requests/:id/reject')
  reject(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.hr.decideLeave(req.user.userId, actorId(req), id, 'rejected'); }

  @Post('leave-requests/:id/cancel')
  cancel(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.hr.decideLeave(req.user.userId, actorId(req), id, 'cancelled'); }

  @Get('leave-balance/:employeeId')
  balance(@Request() req: any, @Param('employeeId', ParseIntPipe) employeeId: number) { return this.hr.leaveBalance(req.user.userId, employeeId); }

  // ── Paie (ressource « payroll » : /hr/payroll/...) ──

  @Get('payroll/settings')
  @ApiOperation({ summary: 'Paramètres de paie (taux CNSS, barème IRPP, déductions) — à faire valider par le comptable' })
  settings(@Request() req: any) { return this.hr.settings(req.user.userId); }

  @Put('payroll/settings')
  updateSettings(@Request() req: any, @Body() body: any) { return this.hr.updateSettings(req.user.userId, body); }

  @Get('payroll')
  payslips(@Request() req: any, @Query('year') year: string, @Query('month') month?: string) {
    return this.hr.listPayslips(req.user.userId, Number(year) || new Date().getFullYear(), Number(month) || undefined);
  }

  @Post('payroll/generate')
  @ApiOperation({ summary: 'Génère (ou recalcule) les bulletins brouillons du mois pour les employés actifs' })
  generate(@Request() req: any, @Body() body: GenerateDto) { return this.hr.generate(req.user.userId, body.year, body.month); }

  @Put('payroll/:id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: DraftDto) { return this.hr.updateDraft(req.user.userId, id, body); }

  @Post('payroll/:id/validate')
  validate(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.hr.validate(req.user.userId, actorId(req), id); }

  @Post('payroll/:id/pay')
  pay(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: PayDto) { return this.hr.markPaid(req.user.userId, actorId(req), id, body.method, body.date); }

  @Delete('payroll/:id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.hr.remove(req.user.userId, id); }

  @Get('payroll/:id/pdf')
  async pdf(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, filename } = await this.hr.payslipPdf(req.user.userId, id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${filename}"`, 'Content-Length': String(buffer.length), 'Cache-Control': 'private, no-store' });
    res.end(buffer);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Employee, LeaveRequest, Payslip]), AccountingModule],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
