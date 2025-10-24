import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiscordModule } from './discord.module';
import { SoundsModule } from './sounds/sounds.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // Hace que el ConfigModule esté disponible en toda la app
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',  // Archivo de la base de datos
      synchronize: false,  // No usamos sync porque manejamos la DB con raw queries
      logging: false,
    }),
    DiscordModule,  // Nuestro módulo del bot
    SoundsModule,   // Nuestro módulo de sonidos
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
