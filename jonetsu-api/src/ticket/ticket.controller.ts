import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { idValido } from '../common/id-valido.pipe.js';

<<<<<<< HEAD
import { AccionAdminDto } from '../common/dto/accion-admin.dto.js';
=======
import { SoloAdmin } from '../auth/decorators/solo-admin.decorator.js';
import { Usuario } from '../auth/decorators/usuario.decorator.js';
import { ConAcceso } from '../auth/decorators/con-acceso.decorator.js';
import { AccesoActual } from '../auth/acceso.js';
import type { Acceso } from '../auth/acceso.js';
import { AccesoService } from '../auth/acceso.service.js';
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
import { TicketService } from './ticket.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { EntregarTicketDto } from './dto/entregar-ticket.dto.js';
import { FiltroTicketsDto } from './dto/filtro-tickets.dto.js';
import { ReagendarTicketDto } from './dto/reagendar-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
<<<<<<< HEAD
=======
    private readonly accesoService: AccesoService,
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
  ) {}

  // POST /tickets  (con sesión, o sin sesión enviando "invitado")
  // Al invitado se le entrega la cookie ticket_token para este pedido
  @Post()
  @ConAcceso()
  async create(
    @Body() dto: CreateTicketDto,
    @AccesoActual() acceso: Acceso,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ticket = await this.ticketService.create(dto, acceso);

    if (!acceso.usuario) {
      await this.accesoService.darAccesoInvitado(res, acceso, ticket.id_ticket);
    }

    return ticket;
  }

  // GET /tickets?id_user=&estado=
  // Admin: todos (id_user filtra). Cliente/invitado: solo los suyos.
  @Get()
  @ConAcceso()
  findAll(@Query() filtros: FiltroTicketsDto, @AccesoActual() acceso: Acceso) {
    return this.ticketService.findAll(filtros, acceso);
  }

  // GET /tickets/:id  (admin o dueño)
  @Get(':id')
<<<<<<< HEAD
  findOne(
    @Param('id', idValido) id: string,
  ) {
    return this.ticketService.findOne(id);
=======
  @ConAcceso()
  findOne(@Param('id', idValido) id: string, @AccesoActual() acceso: Acceso) {
    return this.ticketService.findOne(id, acceso);
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
  }

  // PATCH /tickets/entregar (admin) — va antes de :id
  @Patch('entregar')
  entregar(@Body() dto: EntregarTicketDto) {
    return this.ticketService.entregar(dto);
  }

  // PATCH /tickets/:id/reactivar  (admin)
  @Patch(':id/reactivar')
  reactivar(
    @Param('id', idValido) id: string,
    @Body() dto: AccionAdminDto,
  ) {
    return this.ticketService.reactivar(id, dto);
  }

  // PATCH /tickets/:id/reagendar  (admin, solo confirmados)
  @Patch(':id/reagendar')
  reagendar(
    @Param('id', idValido) id: string,
    @Body() dto: ReagendarTicketDto,
  ) {
    return this.ticketService.reagendar(id, dto);
  }

  // PATCH /tickets/:id  (admin: notas o cancelar)
  @Patch(':id')
  update(
    @Param('id', idValido) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketService.update(id, dto);
  }

  // DELETE /tickets/:id  ("Volver" desde la ventana de pago; admin o dueño)
  @Delete(':id')
<<<<<<< HEAD
  remove(
    @Param('id', idValido) id: string,
  ) {
    return this.ticketService.remove(id);
=======
  @ConAcceso()
  remove(@Param('id', idValido) id: string, @AccesoActual() acceso: Acceso) {
    return this.ticketService.remove(id, acceso);
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
  }
}
