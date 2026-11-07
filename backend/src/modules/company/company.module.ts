import { Body, Controller, Get, Global, Module, Put, Request, UseGuards } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Company } from './company.entity';
import { CompanyService, DEFAULT_NUMBERING } from './company.service';
import { User } from '../users/entities/user.entity';
import { VAT_RATES, WITHHOLDING_PRESETS } from '../../common/fiscal';
import { SequenceService } from '../../common/sequences/sequence.service';
import { NumberSequence } from '../../common/sequences/number-sequence.entity';

@ApiTags('Société')
@ApiBearerAuth()
@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Fiche société (mentions légales, TVA, timbre, numérotation)' })
  async get(@Request() req: any) {
    const company = await this.company.getOrCreate(req.user.userId);
    return { ...company, legalGaps: this.company.legalGaps(company) };
  }

  @Put()
  @ApiOperation({ summary: 'Met à jour la fiche société' })
  async update(@Request() req: any, @Body() body: any) {
    const company = await this.company.update(req.user.userId, body);
    return { ...company, legalGaps: this.company.legalGaps(company) };
  }

  @Get('fiscal-options')
  @ApiOperation({ summary: 'Taux de TVA, retenues à la source et préfixes de numérotation proposés' })
  options() {
    return {
      vatRates: VAT_RATES,
      withholdingPresets: WITHHOLDING_PRESETS,
      numberingDefaults: DEFAULT_NUMBERING,
      disclaimer: 'Taux indicatifs (loi de finances en vigueur). Validez-les avec votre expert-comptable.',
    };
  }
}

/** Module global : la fiche société et les compteurs de numérotation sont utilisés par presque tous les autres modules. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Company, User, NumberSequence])],
  controllers: [CompanyController],
  providers: [CompanyService, SequenceService],
  exports: [CompanyService, SequenceService],
})
export class CompanyModule {}
