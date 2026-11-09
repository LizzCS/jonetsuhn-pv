
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

import { CategoriaService } from './categoria.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@Controller('categorias')
export class CategoriaController {
  constructor(
    private readonly categoriaService: CategoriaService,
  ) {}

  // POST /categorias
  @Post()
  create(@Body() dto: CreateCategoriaDto) {
    return this.categoriaService.create(dto);
  }

  // GET /categorias
  @Get()
  findAll() {
    return this.categoriaService.findAll();
  }

  // GET /categorias/:id
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriaService.findOne(id);
  }

  // PATCH /categorias/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoriaDto,
  ) {
    return this.categoriaService.update(id, dto);
  }

  // DELETE /categorias/:id
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriaService.remove(id);
  }
}
