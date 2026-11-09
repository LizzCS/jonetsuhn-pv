import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { PrismaModule } from './prisma/prisma.module.js';
import { CategoriaModule } from './categoria/categoria.module.js';
import { PersonaModule } from './persona/persona.module.js';
import { EventoModule } from './evento/evento.module.js';
import { HorarioModule } from './horario/horario.module.js';
import { TicketModule } from './ticket/ticket.module.js';
import { PagoModule } from './pago/pago.module.js';

@Module({
  imports: [
    PrismaModule,
    CategoriaModule,
    PersonaModule,
    EventoModule,
    HorarioModule,
    TicketModule,
    PagoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
