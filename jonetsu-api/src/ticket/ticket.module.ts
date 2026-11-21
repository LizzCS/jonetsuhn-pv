import { Module } from '@nestjs/common';

import { TicketController } from './ticket.controller.js';
import { TicketService } from './ticket.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
