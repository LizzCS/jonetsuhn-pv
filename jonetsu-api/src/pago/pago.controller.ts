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
import { ConAcceso } from '../auth/decorators/con-acceso.decorator.js';
import { AccesoActual } from '../auth/acceso.js';
import type { Acceso } from '../auth/acceso.js';
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
  @ConAcceso()
  @UseInterceptors(FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen))
  create(
    @Body() dto: CreatePagoDto,
    @UploadedFile(comprobantePipe) archivo: ArchivoSubido,
    @AccesoActual() acceso: Acceso,
  ) {
    return this.pagoService.create(dto, archivo, acceso);
  }

  // GET /pagos?estado=&id_ticket=  (admin; el cliente ve sus pagos en
  // GET /tickets/:id)
  @Get()
  @SoloAdmin()
  findAll(@Query() filtros: FiltroPagosDto) {
    return this.pagoService.findAll(filtros);
  }

  // GET /pagos/:id  (admin o dueño)
  @Get(':id')
  @ConAcceso()
  findOne(@Param('id', idValido) id: string, @AccesoActual() acceso: Acceso) {
    return this.pagoService.findOne(id, acceso);
  }

  // GET /pagos/:id/comprobante  → devuelve la imagen (admin o dueño)
  @Get(':id/comprobante')
  @ConAcceso()
  async comprobante(
    @Param('id', idValido) id: string,
    @AccesoActual() acceso: Acceso,
  ) {
    const { stream, tipo } = await this.pagoService.comprobante(id, acceso);
    return new StreamableFile(stream, { type: tipo });
  }

  // PATCH /pagos/:id/comprobante  (multipart: comprobante)
  // Solo mientras el pago esté pendiente y no venza el plazo de la reserva
  @Patch(':id/comprobante')
  @ApiArchivo(COMPROBANTE_CAMPO)
  @ConAcceso()
  @UseInterceptors(FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen))
  reemplazarComprobante(
    @Param('id', idValido) id: string,
    @UploadedFile(comprobantePipe) archivo: ArchivoSubido,
    @AccesoActual() acceso: Acceso,
  ) {
    return this.pagoService.reemplazarComprobante(id, archivo, acceso);
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

  // DELETE /pagos/:id  (admin, solo pagos pendientes)
  @Delete(':id')
  @SoloAdmin()
  remove(@Param('id', idValido) id: string, @Usuario('sub') id_admin: string) {
    return this.pagoService.remove(id, id_admin);
  }
}
