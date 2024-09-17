import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 500000,
    }),
  ],
  providers: [HotelsService],
})
export class HotelsModule {}
