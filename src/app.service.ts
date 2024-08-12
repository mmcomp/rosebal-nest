import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Cron('0 */1 * * * *')
  async handleCron() {
    console.log('Cron', new Date());
    const tickets = await this.getToBeDeletedTicketIds();
    const promises = tickets.map((ticket) => this.processTicket(ticket));
    await Promise.allSettled(promises);
  }

  async processTicket(ticket: {
    id: string;
    booking_class: string;
  }): Promise<void> {
    console.log('[processTicket]', { ticket });
    const ticketItems = await this.getTicketItems(ticket.id);
    console.log('[processTicket]', { ticketItems });
    for (const { flight_item_id, capacity_type } of ticketItems) {
      const capacities = await this.getFlightItemCapacities(
        flight_item_id,
        ticket.booking_class,
      );
      if (capacities && capacities.length > 0) {
        const id = capacities[0].id;
        console.log('[processTicket]', { id, capacity_type });
        await this.fixCapacity(id, capacity_type);
      }
    }

    await this.deleteTicket(ticket.id);
  }

  async deleteTicket(id: string) {
    console.log('[deleteTicket]', { id });
    await this.dataSource.query(
      `UPDATE tickets SET deleted_at = NOW() WHERE id = '${id}'`,
    );
  }

  async fixCapacity(id: string, capacity_type: string) {
    const lock = capacity_type === 'office' ? ', locked = locked - 1' : '';
    await this.dataSource.query(
      `UPDATE capacities SET reserved = reserved - 1, free = free + 1, avail_free = avail_free + 1 ${lock} WHERE id = '${id}'`,
    );
  }

  getFlightItemCapacities(
    flightItemId: string,
    cabin: string,
  ): Promise<{ id: string }[]> {
    console.log('[getFlightItemCapacities]', { flightItemId, cabin });
    return this.dataSource.query(
      `SELECT id FROM capacities WHERE deleted_at IS NULL AND flight_item_id = '${flightItemId}' AND cabin = '${cabin}' AND reserved > 0`,
    );
  }

  getTicketItems(
    ticketId: string,
  ): Promise<{ flight_item_id: string; capacity_type: string }[]> {
    return this.dataSource.query(
      `SELECT flight_item_id, capacity_type FROM ticket_items WHERE deleted_at IS NULL AND ticket_id = '${ticketId}'`,
    );
  }

  getToBeDeletedTicketIds(): Promise<{ id: string; booking_class: string }[]> {
    console.log('[getToBeDeletedTicketIds]');
    return this.dataSource.query(
      `SELECT id, booking_class FROM tickets WHERE expire_date < NOW() AND deleted_at IS NULL AND status < 2`,
    );
  }

  getHello(): string {
    return 'Hello World!';
  }
}
