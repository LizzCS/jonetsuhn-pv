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

import { HorarioService } from './horario.service.js';
import { CreateHorarioDto } from './dto/create-horario.dto.js';
import { UpdateHorarioDto } from './dto/update-horario.dto.js';

@Controller('horarios')
export class HorarioController {
  constructor(
    private readonly horarioService: HorarioService,
  ) {}

  // POST /horarios
  @Post()
  create(@Body() dto: CreateHorarioDto) {
    return this.horarioService.create(dto);
  }

  // GET /horarios
  @Get()
  findAll() {
    return this.horarioService.findAll();
  }

  // GET /horarios/:id
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.horarioService.findOne(id);
  }

  // PATCH /horarios/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHorarioDto,
  ) {
    return this.horarioService.update(id, dto);
  }

  // DELETE /horarios/:id
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.horarioService.remove(id);
  }
}
