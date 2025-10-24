import { Module } from '@nestjs/common';
import { SoundsController } from './sounds.controller';
import { SoundsService } from './sounds.service';
import { SoundsRepository } from './sounds.repository';

@Module({
  controllers: [SoundsController],
  providers: [SoundsService, SoundsRepository],
  exports: [SoundsService], // Para que Discord pueda usarlo
})
export class SoundsModule {}

