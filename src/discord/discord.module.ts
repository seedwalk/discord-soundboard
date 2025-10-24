import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscordService } from './discord.service';
import { SoundsModule } from '../sounds/sounds.module';

@Module({
  imports: [
    ConfigModule,  // Importamos ConfigModule para leer el .env
    SoundsModule,  // Importamos SoundsModule para acceder a los sonidos
  ],
  providers: [DiscordService],  // Registramos el servicio
})
export class DiscordModule {}

