import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { EventoService } from './evento.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';

@Controller('eventos')
export class EventoController {
  constructor(
    private readonly eventoService: EventoService,
  ) {}

  // POST /eventos
  @Post()
  create(@Body() dto: CreateEventoDto) {
    return this.eventoService.create(dto);
  }

  // GET /eventos
  @Get()
  findAll() {
    return this.eventoService.findAll();
  }

  // GET /eventos/:id
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventoService.findOne(id);
  }

  // PATCH /eventos/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.eventoService.update(id, dto);
  }

  // DELETE /eventos/:id
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventoService.remove(id);
  }
}
