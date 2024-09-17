import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Module({
  providers: [TicketsService]
})
export class TicketsModule {}
