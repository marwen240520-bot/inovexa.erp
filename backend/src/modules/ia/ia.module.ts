import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { IaChat } from './entities/ia-chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IaChat])],
  controllers: [IaController],
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
