import { ApiTags } from '@nestjs/swagger';
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
import { SoloAdmin } from '../auth/decorators/solo-admin.decorator.js';
import { Usuario } from '../auth/decorators/usuario.decorator.js';
import { ApiArchivo } from '../common/archivos/api-archivo.decorator.js';
import {
  COMPROBANTE_CAMPO,
  METODOS_PAGO_HABILITADOS,
} from '../common/reglas-negocio.js';
import { PagoService } from './pago.service.js';
import { CreatePagoDto } from './dto/create-pago.dto.js';
import { FiltroPagosDto } from './dto/filtro-pagos.dto.js';
import { VerificarPagoDto } from './dto/verificar-pago.dto.js';

const comprobantePipe = crearPipeImagen(COMPROBANTE_CAMPO, 'El comprobante');

@ApiTags('pagos')
@Controller('pagos')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  // POST /pagos  (multipart/form-data: id_ticket, metodo?, comprobante)
  @Post()
  @ApiArchivo(
    COMPROBANTE_CAMPO,
    {
      id_ticket: { type: 'string', format: 'uuid' },
      metodo: { type: 'string', enum: [...METODOS_PAGO_HABILITADOS] },
    },
    ['id_ticket'],
  )
  @UseInterceptors(FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen))
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
  findOne(@Param('id', idValido) id: string) {
    return this.pagoService.findOne(id);
  }

  // GET /pagos/:id/comprobante  → devuelve la imagen
  @Get(':id/comprobante')
  async comprobante(@Param('id', idValido) id: string) {
    const { stream, tipo } = await this.pagoService.comprobante(id);
    return new StreamableFile(stream, { type: tipo });
  }

  // PATCH /pagos/:id/comprobante  (multipart: comprobante)
  @Patch(':id/comprobante')
  @ApiArchivo(COMPROBANTE_CAMPO)
  @UseInterceptors(FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen))
  reemplazarComprobante(
    @Param('id', idValido) id: string,
    @UploadedFile(comprobantePipe) archivo: ArchivoSubido,
  ) {
    return this.pagoService.reemplazarComprobante(id, archivo);
  }

  // PATCH /pagos/:id/verificar  (admin)
  @Patch(':id/verificar')
  @SoloAdmin()
  verificar(
    @Param('id', idValido) id: string,
    @Body() dto: VerificarPagoDto,
    @Usuario('sub') id_admin: string,
  ) {
    return this.pagoService.verificar(id, dto, id_admin);
  }

  // PATCH /pagos/:id/reembolsar  (admin)
  @Patch(':id/reembolsar')
  @SoloAdmin()
  reembolsar(
    @Param('id', idValido) id: string,
    @Usuario('sub') id_admin: string,
  ) {
    return this.pagoService.reembolsar(id, id_admin);
  }

  // DELETE /pagos/:id
  @Delete(':id')
  remove(@Param('id', idValido) id: string) {
    return this.pagoService.remove(id);
  }
}
