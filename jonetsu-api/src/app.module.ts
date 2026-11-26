import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { PrismaModule } from './prisma/prisma.module.js';
import { ArchivosModule } from './common/archivos/archivos.module.js';
import { CategoriaModule } from './categoria/categoria.module.js';
import { UserModule } from './user/user.module.js';
import { EventoModule } from './evento/evento.module.js';
import { HorarioModule } from './horario/horario.module.js';
import { TicketModule } from './ticket/ticket.module.js';
import { PagoModule } from './pago/pago.module.js';
import { ProductoModule } from './producto/producto.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ArchivosModule,
    CategoriaModule,
    UserModule,
    EventoModule,
    HorarioModule,
    TicketModule,
    PagoModule,
    ProductoModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
