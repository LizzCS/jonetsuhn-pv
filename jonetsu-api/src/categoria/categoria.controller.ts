import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { idValido } from '../common/id-valido.pipe.js';
import { SoloAdmin } from '../auth/decorators/solo-admin.decorator.js';

import { CategoriaService } from './categoria.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@ApiTags('categorias')
@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  // POST /categorias
  @Post()
  @SoloAdmin()
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
  findOne(@Param('id', idValido) id: string) {
    return this.categoriaService.findOne(id);
  }

  // PATCH /categorias/:id
  @Patch(':id')
  @SoloAdmin()
  update(@Param('id', idValido) id: string, @Body() dto: UpdateCategoriaDto) {
    return this.categoriaService.update(id, dto);
  }

  // DELETE /categorias/:id
  @Delete(':id')
  @SoloAdmin()
  remove(@Param('id', idValido) id: string) {
    return this.categoriaService.remove(id);
  }
}
