import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [StockModule, AccountingModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
