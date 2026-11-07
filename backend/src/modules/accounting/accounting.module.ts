import { BadRequestException, Body, Controller, Get, Module, Param, ParseIntPipe, Post, Put, Query, Request, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountingService } from './accounting.service';
import { AccountingReportsService } from './accounting-reports.service';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { BankStatementLine } from './entities/bank-statement-line.entity';
import { BankAccount } from '../finance/entities/bank-account.entity';
import { ACCOUNT_FUNCTIONS, JOURNALS } from './chart';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

class AccountDto {
  @IsString() @Matches(/^[0-9]{2,12}$/) code: string;
  @IsString() @MaxLength(160) name: string;
  @IsIn(['asset', 'liability', 'equity', 'income', 'expense']) type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
}
class AccountPatchDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() active?: boolean;
}
class EntryLineDto {
  @IsString() @MaxLength(20) accountCode: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(1e12) debit?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(1e12) credit?: number;
  @IsOptional() @IsString() @MaxLength(300) label?: string;
}
class EntryDto {
  @Matches(DATE) date: string;
  @IsString() @MaxLength(300) label: string;
  @IsOptional() @IsString() journal?: string;
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => EntryLineDto) lines: EntryLineDto[];
}
class ReverseDto {
  @IsOptional() @Matches(DATE) date?: string;
}
class StatementRowDto {
  @Matches(/^(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})$/) date: string;
  @IsString() @MaxLength(300) label: string;
  @IsNumber({ maxDecimalPlaces: 3 }) amount: number;
  @IsOptional() @IsString() @MaxLength(80) reference?: string;
}
class ImportDto {
  @IsInt() bankAccountId: number;
  @IsOptional() @IsString() @MaxLength(2_000_000) csv?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => StatementRowDto) rows?: StatementRowDto[];
}
class MatchDto {
  @IsInt() paymentId: number;
}

/** Comptabilité : plan comptable, écritures, journaux, grand livre, balance, résultat, TVA et rapprochement bancaire. */
@ApiTags('Comptabilité')
@ApiBearerAuth()
@Controller('accounting')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AccountingController {
  constructor(private readonly acc: AccountingService, private readonly reports: AccountingReportsService) {}

  @Get('chart')
  @ApiOperation({ summary: 'Plan comptable (de base + comptes personnalisés) et correspondance fonction → compte' })
  async chart(@Request() req: any) {
    return { accounts: await this.acc.chart(req.user.userId), config: await this.acc.accountsConfig(req.user.userId), functions: ACCOUNT_FUNCTIONS, journals: JOURNALS, notice: 'Plan indicatif : à valider avec votre expert-comptable.' };
  }

  @Post('accounts')
  addAccount(@Request() req: any, @Body() body: AccountDto) {
    return this.acc.addAccount(req.user.userId, body);
  }

  @Put('accounts/:id')
  updateAccount(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: AccountPatchDto) {
    return this.acc.updateAccount(req.user.userId, id, body);
  }

  @Get('journal')
  journal(@Request() req: any, @Query() q: any) {
    return this.reports.journal(req.user.userId, { from: q.from, to: q.to, journal: q.journal, limit: Number(q.limit) || undefined, offset: Number(q.offset) || undefined });
  }

  @Get('ledger/:code')
  ledger(@Request() req: any, @Param('code') code: string, @Query() q: any) {
    return this.reports.ledger(req.user.userId, code, { from: q.from, to: q.to });
  }

  @Get('trial-balance')
  trialBalance(@Request() req: any, @Query() q: any) {
    return this.reports.trialBalance(req.user.userId, { from: q.from, to: q.to });
  }

  @Get('income-statement')
  incomeStatement(@Request() req: any, @Query() q: any) {
    return this.reports.incomeStatement(req.user.userId, { from: q.from, to: q.to });
  }

  @Get('vat')
  @ApiOperation({ summary: 'Base de déclaration de TVA (collectée, déductible, à payer), timbre et retenues' })
  vat(@Request() req: any, @Query() q: any) {
    return this.reports.vatReport(req.user.userId, { from: q.from, to: q.to });
  }

  @Get('export/:kind')
  @ApiOperation({ summary: 'Export Excel : journal, ledger, trial-balance, income-statement, vat' })
  async export(@Request() req: any, @Param('kind') kind: string, @Query() q: any, @Res() res: Response) {
    const { buffer, filename } = await this.reports.exportXlsx(req.user.userId, kind, { from: q.from, to: q.to, account: q.account, journal: q.journal } as any);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Get('entries/:id')
  entry(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.acc.getEntry(req.user.userId, id);
  }

  @Post('entries')
  @ApiOperation({ summary: 'Saisit une écriture manuelle (opérations diverses) — équilibrée obligatoirement' })
  createEntry(@Request() req: any, @Body() body: EntryDto) {
    return this.acc.createManual(req.user.userId, req.user.actorId ?? req.user.userId, body as any);
  }

  @Post('entries/:id/reverse')
  @ApiOperation({ summary: 'Contre-passe une écriture manuelle' })
  reverse(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: ReverseDto) {
    return this.acc.reverseEntry(req.user.userId, req.user.actorId ?? req.user.userId, id, body?.date);
  }

  // ── Rapprochement bancaire ──

  @Post('bank/import')
  @ApiOperation({ summary: 'Importe un relevé bancaire (CSV « date;libellé;montant;référence » ou lignes JSON)' })
  importStatement(@Request() req: any, @Body() body: ImportDto) {
    return this.acc.importStatement(req.user.userId, body.bankAccountId, { csv: body.csv, rows: body.rows });
  }

  @Get('bank/lines')
  statementLines(@Request() req: any, @Query() q: any) {
    return this.acc.statementLines(req.user.userId, { bankAccountId: Number(q.bankAccountId) || undefined, status: q.status, from: q.from, to: q.to, limit: Number(q.limit) || undefined });
  }

  @Get('bank/lines/:id/suggestions')
  suggestions(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.acc.suggestions(req.user.userId, id);
  }

  @Post('bank/lines/:id/match')
  match(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: MatchDto) {
    return this.acc.match(req.user.userId, id, body.paymentId);
  }

  @Post('bank/lines/:id/unmatch')
  unmatch(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.acc.unmatch(req.user.userId, id);
  }

  @Post('bank/lines/:id/ignore')
  ignore(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.acc.ignore(req.user.userId, id, true);
  }

  @Post('bank/auto-match')
  autoMatch(@Request() req: any, @Body() body: { bankAccountId: number }) {
    if (!Number(body?.bankAccountId)) throw new BadRequestException('bankAccountId requis.');
    return this.acc.autoMatch(req.user.userId, Number(body.bankAccountId));
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalEntry, JournalLine, BankStatementLine, BankAccount])],
  controllers: [AccountingController],
  providers: [AccountingService, AccountingReportsService],
  exports: [AccountingService, AccountingReportsService],
})
export class AccountingModule {}
