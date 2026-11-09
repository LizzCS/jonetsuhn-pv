import { Module } from '@nestjs/common';

import { EventoController } from './evento.controller.js';
import { EventoService } from './evento.service.js';

@Module({
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}
