import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TicketsModule } from './tickets/tickets.module';
import { HotelsModule } from './hotels/hotels.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (conf: ConfigService): TypeOrmModuleOptions => {
        return {
          type: 'mysql',
          ssl: false,
          url: conf.get('DATABASE_URL'),
          entities: ['**/*.entity.js'],
          synchronize: false,
        };
      },
    }),
    TicketsModule,
    HotelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
