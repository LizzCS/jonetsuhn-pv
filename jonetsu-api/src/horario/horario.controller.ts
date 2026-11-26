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

import { HorarioService } from './horario.service.js';
import { AsignarProductoDto, UpdateCupoDto } from './dto/cupo-producto.dto.js';
import { CreateHorarioDto } from './dto/create-horario.dto.js';
import { FiltroHorariosDto } from './dto/filtro-horarios.dto.js';
import { UpdateHorarioDto } from './dto/update-horario.dto.js';

@Controller('horarios')
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  // POST /horarios
  @Post()
  @SoloAdmin()
  create(@Body() dto: CreateHorarioDto) {
    return this.horarioService.create(dto);
  }

  // GET /horarios?id_evento=
  @Get()
  findAll(@Query() filtros: FiltroHorariosDto) {
    return this.horarioService.findAll(filtros);
  }

  // GET /horarios/:id
  @Get(':id')
  findOne(@Param('id', idValido) id: string) {
    return this.horarioService.findOne(id);
  }

  // PATCH /horarios/:id
  @Patch(':id')
  @SoloAdmin()
  update(@Param('id', idValido) id: string, @Body() dto: UpdateHorarioDto) {
    return this.horarioService.update(id, dto);
  }

  // DELETE /horarios/:id
  @Delete(':id')
  @SoloAdmin()
  remove(@Param('id', idValido) id: string) {
    return this.horarioService.remove(id);
  }

  // GET /horarios/:id/productos  → cupo total, ocupados y disponibles
  @Get(':id/productos')
  productos(@Param('id', idValido) id: string) {
    return this.horarioService.productos(id);
  }

  // POST /horarios/:id/productos  { id_producto, cupo_total }
  @Post(':id/productos')
  @SoloAdmin()
  asignarProducto(
    @Param('id', idValido) id: string,
    @Body() dto: AsignarProductoDto,
  ) {
    return this.horarioService.asignarProducto(id, dto);
  }

  // PATCH /horarios/:id/productos/:id_producto  { cupo_total }
  @Patch(':id/productos/:id_producto')
  @SoloAdmin()
  actualizarCupo(
    @Param('id', idValido) id: string,
    @Param('id_producto', idValido) id_producto: string,
    @Body() dto: UpdateCupoDto,
  ) {
    return this.horarioService.actualizarCupo(id, id_producto, dto);
  }

  // DELETE /horarios/:id/productos/:id_producto
  @Delete(':id/productos/:id_producto')
  @SoloAdmin()
  quitarProducto(
    @Param('id', idValido) id: string,
    @Param('id_producto', idValido) id_producto: string,
  ) {
    return this.horarioService.quitarProducto(id, id_producto);
  }
}
