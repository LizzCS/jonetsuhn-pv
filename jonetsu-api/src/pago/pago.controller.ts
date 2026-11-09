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

import { PagoService } from './pago.service.js';
import { CreatePagoDto } from './dto/create-pago.dto.js';
import { UpdatePagoDto } from './dto/update-pago.dto.js';

@Controller('pagos')
export class PagoController {
  constructor(
    private readonly pagoService: PagoService,
  ) {}

  // POST /pagos
  @Post()
  create(@Body() dto: CreatePagoDto) {
    return this.pagoService.create(dto);
  }

  // GET /pagos
  @Get()
  findAll() {
    return this.pagoService.findAll();
  }

  // GET /pagos/:id
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pagoService.findOne(id);
  }

  // PATCH /pagos/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePagoDto,
  ) {
    return this.pagoService.update(id, dto);
  }

  // DELETE /pagos/:id
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pagoService.remove(id);
  }
}
