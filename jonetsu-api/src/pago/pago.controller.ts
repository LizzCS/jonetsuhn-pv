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
import { AccionAdminDto } from '../common/dto/accion-admin.dto.js';
import { COMPROBANTE_CAMPO } from '../common/reglas-negocio.js';
import { PagoService } from './pago.service.js';
import { CreatePagoDto } from './dto/create-pago.dto.js';
import { FiltroPagosDto } from './dto/filtro-pagos.dto.js';
import { VerificarPagoDto } from './dto/verificar-pago.dto.js';

const comprobantePipe = crearPipeImagen(COMPROBANTE_CAMPO, 'El comprobante');

@Controller('pagos')
export class PagoController {
  constructor(
    private readonly pagoService: PagoService,
  ) {}

  // POST /pagos  (multipart/form-data: id_ticket, metodo?, comprobante)
  @Post()
  @UseInterceptors(
    FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen),
  )
  create(
    @Body() dto: CreatePagoDto,
    @UploadedFile(comprobantePipe) archivo: ArchivoSubido,
  ) {
    return this.pagoService.create(dto, archivo);
  }

  // GET /pagos?estado=&id_ticket=
  @Get()
  findAll(@Query() filtros: FiltroPagosDto) {
    return this.pagoService.findAll(filtros);
  }

  // GET /pagos/:id
  @Get(':id')
  findOne(
    @Param('id', idValido) id: string,
  ) {
    return this.pagoService.findOne(id);
  }

  // GET /pagos/:id/comprobante  → devuelve la imagen
  @Get(':id/comprobante')
  async comprobante(
    @Param('id', idValido) id: string,
  ) {
    const { stream, tipo } = await this.pagoService.comprobante(id);
    return new StreamableFile(stream, { type: tipo });
  }

  // PATCH /pagos/:id/comprobante  (multipart: comprobante)
  @Patch(':id/comprobante')
  @UseInterceptors(
    FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen),
  )
  reemplazarComprobante(
    @Param('id', idValido) id: string,
    @UploadedFile(comprobantePipe) archivo: ArchivoSubido,
  ) {
    return this.pagoService.reemplazarComprobante(id, archivo);
  }

  // PATCH /pagos/:id/verificar  (admin)
  @Patch(':id/verificar')
  verificar(
    @Param('id', idValido) id: string,
    @Body() dto: VerificarPagoDto,
  ) {
    return this.pagoService.verificar(id, dto);
  }

  // PATCH /pagos/:id/reembolsar  (admin)
  @Patch(':id/reembolsar')
  reembolsar(
    @Param('id', idValido) id: string,
    @Body() dto: AccionAdminDto,
  ) {
    return this.pagoService.reembolsar(id, dto);
  }

  // DELETE /pagos/:id
  @Delete(':id')
  remove(
    @Param('id', idValido) id: string,
  ) {
    return this.pagoService.remove(id);
  }
}
