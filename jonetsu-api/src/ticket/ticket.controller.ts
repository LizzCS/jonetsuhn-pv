import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UsePipes,
} from '@nestjs/common';

import { AccionAdminDto } from '../common/dto/accion-admin.dto.js';
import { validacionDto } from '../common/validacion.pipe.js';
import { TicketService } from './ticket.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { EntregarTicketDto } from './dto/entregar-ticket.dto.js';
import { FiltroTicketsDto } from './dto/filtro-tickets.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

@Controller('tickets')
@UsePipes(validacionDto)
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
  ) {}

  // POST /tickets
  @Post()
  create(@Body() dto: CreateTicketDto) {
    return this.ticketService.create(dto);
  }

  // GET /tickets?id_persona=&estado=
  @Get()
  findAll(@Query() filtros: FiltroTicketsDto) {
    return this.ticketService.findAll(filtros);
  }

  // GET /tickets/:id
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketService.findOne(id);
  }

  // PATCH /tickets/entregar (admin) — va antes de :id
  @Patch('entregar')
  entregar(@Body() dto: EntregarTicketDto) {
    return this.ticketService.entregar(dto);
  }

  // PATCH /tickets/:id/reactivar  (admin)
  @Patch(':id/reactivar')
  reactivar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AccionAdminDto,
  ) {
    return this.ticketService.reactivar(id, dto);
  }

  // PATCH /tickets/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketService.update(id, dto);
  }

  // DELETE /tickets/:id
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketService.remove(id);
  }
}
