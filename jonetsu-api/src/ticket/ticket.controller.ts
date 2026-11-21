import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { idValido } from '../common/id-valido.pipe.js';

import { SoloAdmin } from '../auth/decorators/solo-admin.decorator.js';
import { Usuario } from '../auth/decorators/usuario.decorator.js';
import { TicketService } from './ticket.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { EntregarTicketDto } from './dto/entregar-ticket.dto.js';
import { FiltroTicketsDto } from './dto/filtro-tickets.dto.js';
import { ReagendarTicketDto } from './dto/reagendar-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  // POST /tickets
  @Post()
  create(@Body() dto: CreateTicketDto) {
    return this.ticketService.create(dto);
  }

  // GET /tickets?id_user=&estado=
  @Get()
  findAll(@Query() filtros: FiltroTicketsDto) {
    return this.ticketService.findAll(filtros);
  }

  // GET /tickets/:id
  @Get(':id')
  findOne(@Param('id', idValido) id: string) {
    return this.ticketService.findOne(id);
  }

  // PATCH /tickets/entregar (admin) — va antes de :id
  @Patch('entregar')
  @SoloAdmin()
  entregar(@Body() dto: EntregarTicketDto, @Usuario('sub') id_admin: string) {
    return this.ticketService.entregar(dto, id_admin);
  }

  // PATCH /tickets/:id/reactivar  (admin)
  @Patch(':id/reactivar')
  @SoloAdmin()
  reactivar(
    @Param('id', idValido) id: string,
    @Usuario('sub') id_admin: string,
  ) {
    return this.ticketService.reactivar(id, id_admin);
  }

  // POST /tickets/:id/reenviar-correo  (admin, solo confirmados)
  @Post(':id/reenviar-correo')
  @SoloAdmin()
  reenviarCorreo(
    @Param('id', idValido) id: string,
    @Usuario('sub') id_admin: string,
  ) {
    return this.ticketService.reenviarCorreo(id, id_admin);
  }

  // PATCH /tickets/:id/reagendar  (admin, solo confirmados)
  @Patch(':id/reagendar')
  @SoloAdmin()
  reagendar(
    @Param('id', idValido) id: string,
    @Body() dto: ReagendarTicketDto,
    @Usuario('sub') id_admin: string,
  ) {
    return this.ticketService.reagendar(id, dto, id_admin);
  }

  // PATCH /tickets/:id  (admin: notas o cancelar)
  @Patch(':id')
  @SoloAdmin()
  update(
    @Param('id', idValido) id: string,
    @Body() dto: UpdateTicketDto,
    @Usuario('sub') id_admin: string,
  ) {
    return this.ticketService.update(id, dto, id_admin);
  }

  // DELETE /tickets/:id  ("Volver" desde la ventana de pago)
  @Delete(':id')
  remove(@Param('id', idValido) id: string) {
    return this.ticketService.remove(id);
  }
}
