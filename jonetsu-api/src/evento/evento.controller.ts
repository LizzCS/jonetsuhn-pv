import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { idValido } from '../common/id-valido.pipe.js';
import { FileInterceptor } from '@nestjs/platform-express';

import type { ArchivoSubido } from '../common/archivos/imagen.pipe.js';
import {
  crearPipeImagen,
  opcionesMulterImagen,
} from '../common/archivos/imagen.pipe.js';
import { IMAGEN_CAMPO } from '../common/reglas-negocio.js';
import { EventoService } from './evento.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { FiltroEventosDto } from './dto/filtro-eventos.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';

const imagenPipe = crearPipeImagen(IMAGEN_CAMPO, 'La imagen');

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

  // GET /eventos?incluir_pasados=
  @Get()
  findAll(@Query() filtros: FiltroEventosDto) {
    return this.eventoService.findAll(filtros);
  }

  // GET /eventos/:id
  @Get(':id')
  findOne(
    @Param('id', idValido) id: string,
  ) {
    return this.eventoService.findOne(id);
  }

  // GET /eventos/:id/imagen
  @Get(':id/imagen')
  async imagen(@Param('id', idValido) id: string) {
    const { stream, tipo } = await this.eventoService.imagen(id);
    return new StreamableFile(stream, { type: tipo });
  }

  // PATCH /eventos/:id/imagen  (multipart: imagen)
  @Patch(':id/imagen')
  @UseInterceptors(FileInterceptor(IMAGEN_CAMPO, opcionesMulterImagen))
  subirImagen(
    @Param('id', idValido) id: string,
    @UploadedFile(imagenPipe) archivo: ArchivoSubido,
  ) {
    return this.eventoService.subirImagen(id, archivo);
  }

  // PATCH /eventos/:id
  @Patch(':id')
  update(
    @Param('id', idValido) id: string,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.eventoService.update(id, dto);
  }

  // DELETE /eventos/:id
  @Delete(':id')
  remove(
    @Param('id', idValido) id: string,
  ) {
    return this.eventoService.remove(id);
  }
}
