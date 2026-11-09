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

import { PersonaService } from './persona.service.js';
import { CreatePersonaDto } from './dto/create-persona.dto.js';
import { UpdatePersonaDto } from './dto/update-persona.dto.js';

@Controller('personas')
export class PersonaController {
  constructor(
    private readonly personaService: PersonaService,
  ) {}

  // POST /personas
  @Post()
  create(@Body() dto: CreatePersonaDto) {
    return this.personaService.create(dto);
  }

  // GET /personas
  @Get()
  findAll() {
    return this.personaService.findAll();
  }

  // GET /personas/:id
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.personaService.findOne(id);
  }

  // PATCH /personas/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePersonaDto,
  ) {
    return this.personaService.update(id, dto);
  }

  // DELETE /personas/:id
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.personaService.remove(id);
  }
}
